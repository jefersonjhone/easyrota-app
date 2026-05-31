from datetime import timedelta
from unittest.mock import patch

from django.core.management import call_command
from django.test import TestCase
from django.utils import timezone

from apps.reservations.models import Reservation
from apps.trips.management.commands.run_scheduler import check_upcoming_trips_quorum
from apps.trips.models import Bus, Route, Trip
from apps.users.models import CustomUser
from apps.users.models.profiles import AdministratorProfile, CivilServantProfile, StudentProfile


class NotificationFlowTests(TestCase):
    def setUp(self):
        self.admin = CustomUser.objects.create_superuser(
            email="admin@test.com",
            full_name="Admin Teste",
            password="12345678",
        )
        self.admin_profile = AdministratorProfile.objects.create(
            user=self.admin,
            role="Admin",
        )

        self.bus = Bus.objects.create(
            number_plate="TEST123",
            seating_capacity=20,
            brand="Volare",
            administrator=self.admin_profile,
        )
        self.route = Route.objects.create(
            origin="Feira de Santana",
            destiny="Salvador",
            departure_time="08:00:00",
            arrival_time="10:00:00",
            administrator=self.admin_profile,
        )

    def _create_trip_with_minimum_quorum(self):
        trip = Trip.objects.create(
            trip_date=timezone.now().date(),
            departure_timestamp=timezone.now() + timedelta(minutes=30),
            status="CONFIRMADA",
            bus=self.bus,
            route=self.route,
        )

        civ_user = CustomUser.objects.create_user(
            email="servidor@test.com",
            full_name="Servidor",
            password="12345678",
            is_active=True,
        )
        civ = CivilServantProfile.objects.create(
            user=civ_user,
            civil_servant_id="11112222",
        )
        Reservation.objects.create(trip=trip, civil_servant=civ, status="CONFIRMADA")

        for idx in range(4):
            student_user = CustomUser.objects.create_user(
                email=f"aluno{idx}@teste.com",
                full_name=f"Aluno {idx}",
                password="12345678",
                is_active=True,
            )
            student = StudentProfile.objects.create(
                user=student_user,
                student_id=f"2024000{idx}",
            )
            Reservation.objects.create(trip=trip, student=student, status="CONFIRMADA")

        return trip

    def test_send_test_push_calls_webpush_for_all_users(self):
        CustomUser.objects.create_user(
            email="user@test.com",
            full_name="User Teste",
            password="12345678",
            is_active=True,
        )

        with patch("apps.trips.management.commands.send_test_push.send_user_notification") as mocked_send:
            call_command("send_test_push")

        assert mocked_send.call_count >= 2

    def test_scheduler_sends_notifications_when_quorum_is_missing(self):
        trip = Trip.objects.create(
            trip_date=timezone.now().date(),
            departure_timestamp=timezone.now() + timedelta(minutes=30, seconds=30),
            status="CONFIRMADA",
            bus=self.bus,
            route=self.route,
        )

        student_user = CustomUser.objects.create_user(
            email="aluno-sem-servidor@test.com",
            full_name="Aluno Sem Servidor",
            password="12345678",
            is_active=True,
        )
        student = StudentProfile.objects.create(
            user=student_user,
            student_id="20240009",
        )
        Reservation.objects.create(trip=trip, student=student, status="CONFIRMADA")

        with patch("apps.trips.management.commands.run_scheduler.send_user_notification") as mocked_send:
            check_upcoming_trips_quorum()

        trip.refresh_from_db()
        assert trip.status == "RISCO DE CANCELAMENTO"
        assert mocked_send.called

    def test_scheduler_does_not_notify_when_quorum_is_met(self):
        trip = self._create_trip_with_minimum_quorum()

        with patch("apps.trips.management.commands.run_scheduler.send_user_notification") as mocked_send:
            check_upcoming_trips_quorum()

        trip.refresh_from_db()
        assert trip.status == "CONFIRMADA"
        assert not mocked_send.called
