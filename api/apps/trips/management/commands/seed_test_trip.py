from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from apps.trips.models import Trip, Bus, Route
from apps.users.models.profiles import AdministratorProfile
from django.contrib.auth import get_user_model

class Command(BaseCommand):
    help = "Cria uma viagem de teste para disparar alerta de quorum"

    def handle(self, *args, **options):
        # Limpa trips anteriores
        Trip.objects.all().delete()
        
        User = get_user_model()
        admin_user = User.objects.filter(is_staff=True).first()
        
        if not admin_user:
            admin_user = User.objects.create_superuser(
                email="admin@test.com",
                password="password123"
            )
            self.stdout.write("Superusuário admin@test.com criado.")

        admin_profile, _ = AdministratorProfile.objects.get_or_create(
            user=admin_user,
            defaults={'role': 'System Admin', 'level': AdministratorProfile.Level.SUPERADMIN}
        )

        bus = Bus.objects.create(number_plate="TESTE01", seating_capacity=20, brand="BusCo", administrator=admin_profile)
        route = Route.objects.create(origin="UEFS", destiny="Centro", departure_time="12:00:00", arrival_time="13:00:00", administrator=admin_profile)
        
        # Define horário: exatamente 31 minutos a partir de AGORA
        now = timezone.now()
        future_time = now + timedelta(minutes=31)
        
        # Para exibição no terminal (Horário Local)
        local_future = timezone.localtime(future_time)
        local_notify = timezone.localtime(future_time - timedelta(minutes=30))

        trip = Trip.objects.create(
            trip_date=future_time.date(),
            status="CONFIRMADA",
            departure_timestamp=future_time,
            bus=bus,
            route=route
        )
        self.stdout.write(self.style.SUCCESS(f"VIAGEM CRIADA COM SUCESSO!"))
        self.stdout.write(self.style.SUCCESS(f"Horário de Saída (Local): {local_future.strftime('%H:%M:%S')}"))
        self.stdout.write(self.style.SUCCESS(f"A notificação deve disparar às: {local_notify.strftime('%H:%M:%S')}"))
        self.stdout.write(self.style.WARNING(f"Hora atual no sistema (Local): {timezone.localtime().strftime('%H:%M:%S')}"))
        self.stdout.write(self.style.WARNING("Certifique-se de que o comando 'run_scheduler' esteja rodando em outro terminal."))
