from datetime import date, timedelta

from django.core.management.base import BaseCommand

from apps.reservations.models import Reservation
from apps.reservations.services import sync_trip_status
from apps.trips.models import Bus, Route, Trip
from apps.users.models.profiles import (
    AdministratorProfile,
    CivilServantProfile,
    StudentProfile,
)
from apps.users.models.user import CustomUser


class Command(BaseCommand):
    help = "Configura cenário de teste para Quórum e Notificações Push"

    def add_arguments(self, parser):
        parser.add_argument(
            "--trigger",
            action="store_true",
            help="Dispara a reserva do servidor para atingir o quórum",
        )

    def handle(self, *args, **options):
        # 1. Criar Admin se não existir
        admin_user, _ = CustomUser.objects.get_or_create(
            email="admin@test.com",
            defaults={
                "full_name": "Admin Teste",
                "is_staff": True,
                "is_superuser": True,
            },
        )
        if not hasattr(admin_user, "admin_profile"):
            admin_prof = AdministratorProfile.objects.create(
                user=admin_user, role="Gerente", level="superadmin"
            )
        else:
            admin_prof = admin_user.admin_profile

        # 2. Criar Ônibus e Rota
        bus, _ = Bus.objects.get_or_create(
            number_plate="TEST-2026",
            defaults={
                "seating_capacity": 40,
                "brand": "Mercedes",
                "administrator": admin_prof,
            },
        )
        route, _ = Route.objects.get_or_create(
            origin="Campus",
            destiny="Centro",
            defaults={
                "departure_time": "07:00:00",
                "arrival_time": "08:00:00",
                "administrator": admin_prof,
            },
        )

        # 3. Criar Viagem para Amanhã
        trip, created = Trip.objects.get_or_create(
            trip_date=date.today() + timedelta(days=1),
            route=route,
            defaults={"bus": bus, "status": "RISCO DE CANCELAMENTO"},
        )

        # 4. Criar seu usuário Aluno (para você logar e se inscrever no Push)
        student_user, _ = CustomUser.objects.get_or_create(
            email="aluno-teste@test.com",
            defaults={"full_name": "Seu Nome Aluno", "is_active": True},
        )
        student_user.set_password("12345678")
        student_user.save()

        student_prof, _ = StudentProfile.objects.get_or_create(
            user=student_user, defaults={"student_id": "20261000"}
        )

        # 5. Criar reserva para você (Aluno) - Ficará PENDENTE
        Reservation.objects.update_or_create(
            trip=trip, student=student_prof, defaults={"status": "PENDENTE"}
        )

        if not options["trigger"]:
            self.stdout.write(self.style.SUCCESS("\nPASSO 1 CONCLUÍDO!"))
            self.stdout.write("1. Logue com: aluno-teste@test.com / 12345678")
            self.stdout.write("2. Ative as Notificações Push em Configurações.")
            self.stdout.write("3. MANTENHA O NAVEGADOR ABERTO.")
            self.stdout.write(
                "4. Depois, rode: python api/manage.py setup_test_push --trigger"
            )
        else:
            # GATILHO: Criar Servidor e fazer reserva
            server_user, _ = CustomUser.objects.get_or_create(
                email="servidor-teste@test.com",
                defaults={"full_name": "Servidor do Quórum", "is_active": True},
            )
            server_prof, _ = CivilServantProfile.objects.get_or_create(
                user=server_user, defaults={"civil_servant_id": "99998888"}
            )

            self.stdout.write("Criando reserva do servidor...")
            Reservation.objects.update_or_create(
                trip=trip, civil_servant=server_prof, defaults={"status": "CONFIRMADA"}
            )

            # Sincronizar e disparar notificação
            if trip.quorum_met_notified_at is not None:
                trip.quorum_met_notified_at = None
                trip.save(update_fields=["quorum_met_notified_at"])

            sync_trip_status(trip)

            push_count = student_user.webpush_info.count()
            if push_count == 0:
                self.stdout.write(
                    self.style.WARNING(
                        "O usuário aluno-teste@test.com não tem "
                        "inscrição push vinculada."
                        "Ative as notificações no mesmo navegador "
                        "e com esse login antes de disparar o trigger."
                    )
                )
            else:
                self.stdout.write(
                    self.style.SUCCESS(
                        f"Inscrição push encontrada para aluno-teste@test.com "
                        f"({push_count} registro(s))."
                    )
                )

            self.stdout.write(
                self.style.SUCCESS(
                    "GATILHO EXECUTADO! Se você se inscreveu no push, "
                    "a notificação deve chegar agora."
                )
            )
