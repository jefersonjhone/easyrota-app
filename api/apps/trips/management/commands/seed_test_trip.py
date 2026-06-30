from datetime import timedelta

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from django.utils import timezone

from apps.reservations.models import Reservation
from apps.trips.models import Bus, Route, Trip
from apps.users.models.profiles import AdministratorProfile, StudentProfile


class Command(BaseCommand):
    help = "Cria uma viagem de teste para disparar alerta de quorum"

    def handle(self, *args, **options):
        # Limpa trips anteriores
        Trip.objects.all().delete()

        User = get_user_model()
        admin_user = User.objects.filter(is_staff=True).first()

        if not admin_user:
            admin_user = User.objects.create_superuser(
                email="admin@test.com", password="password123"
            )
            self.stdout.write("Superusuário admin@test.com criado.")

        admin_profile, _ = AdministratorProfile.objects.get_or_create(
            user=admin_user,
            defaults={
                "role": "System Admin",
                "level": AdministratorProfile.Level.SUPERADMIN,
            },
        )

        bus, _ = Bus.objects.get_or_create(
            number_plate="TESTE01",
            defaults={
                "seating_capacity": 20,
                "brand": "BusCo",
                "administrator": admin_profile,
            },
        )
        route, _ = Route.objects.get_or_create(
            origin="UEFS",
            destiny="Centro",
            departure_time="12:00:00",
            arrival_time="13:00:00",
            defaults={"administrator": admin_profile},
        )

        # Define horário: exatamente 32 minutos a partir de AGORA.
        # Assim a notificação (que ocorre 30 min antes) será disparada em 2 minutos.
        now = timezone.now()
        future_time = now + timedelta(minutes=32)

        # Para exibição no terminal (Horário Local)
        local_future = timezone.localtime(future_time)
        local_notify = timezone.localtime(future_time - timedelta(minutes=30))

        trip = Trip.objects.create(
            trip_date=future_time.date(),
            status="CONFIRMADA",
            departure_timestamp=future_time,
            bus=bus,
            route=route,
        )

        test_user = User.objects.filter(email="aluno_teste@test.com").first()
        if not test_user:
            test_user = User.objects.create_user(
                email="aluno_teste@test.com",
                full_name="Aluno de Teste",
                password="password123",
                is_active=True,
            )
            self.stdout.write(
                "Usuário aluno_teste@test.com criado (senha: password123)."
            )

        student_profile, _ = StudentProfile.objects.get_or_create(
            user=test_user, defaults={"student_id": "99999999"}
        )

        students = [student_profile]

        for student_profile in students:
            Reservation.objects.get_or_create(
                trip=trip,
                student=student_profile,
                status="CONFIRMADA",
            )

        self.stdout.write(self.style.SUCCESS("VIAGEM CRIADA COM SUCESSO!"))
        self.stdout.write(
            self.style.SUCCESS(
                f"Horário de Saída (Local): {local_future.strftime('%H:%M:%S')}"
            )
        )
        self.stdout.write(
            self.style.SUCCESS(
                f"A NOTIFICAÇÃO DISPARARÁ EM 2 MINUTOS, ÀS: {
                    local_notify.strftime('%H:%M:%S')
                }"
            )
        )
        self.stdout.write(
            self.style.WARNING(
                f"Hora atual no sistema (Local): {
                    timezone.localtime().strftime('%H:%M:%S')
                }"
            )
        )
        self.stdout.write(
            self.style.WARNING(f"Passageiros com reserva confirmada: {len(students)}")
        )
        self.stdout.write(
            self.style.WARNING(
                "Certifique-se de que o comando 'run_scheduler' "
                "esteja rodando em outro terminal."
            )
        )
