from datetime import timedelta
from unittest.mock import patch

from django.core.management import call_command
from django.test import TestCase
from django.utils import timezone

from apps.reservations.models import Reservation
from apps.reservations.services import sync_trip_status, trip_has_quorum
from apps.trips.management.commands.run_scheduler import check_upcoming_trips_quorum
from apps.trips.models import Bus, Route, Trip, TripPassenger
from apps.users.models import CustomUser
from apps.users.models.profiles import (
    AdministratorProfile,
    CivilServantProfile,
    StudentProfile,
)


class NotificationFlowTests(TestCase):
    def setUp(self):
        self.admin = CustomUser.objects.create_superuser(
            email="admin@test.com",
            full_name="Admin Teste",
            password="12345678",
        )
        self.admin_profile = AdministratorProfile.objects.get(user=self.admin)

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

    def _create_local_server_trip(self, departure_delta=timedelta(minutes=30)):
        trip = Trip.objects.create(
            trip_date=timezone.now().date(),
            departure_timestamp=timezone.now() + departure_delta,
            status="CONFIRMADA",
            bus=self.bus,
            route=self.route,
        )

        trip.trip_passengers.create(
            passenger_type=TripPassenger.PassengerType.LOCAL_SERVER,
            full_name="Servidor Local",
            cpf="12345678901",
        )

        return trip

    def test_send_test_push_calls_webpush_for_all_users(self):
        CustomUser.objects.create_user(
            email="user@test.com",
            full_name="User Teste",
            password="12345678",
            is_active=True,
        )

        with patch(
            "apps.trips.management.commands.send_test_push.send_user_notification"
        ) as mocked_send:
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

        with patch("apps.reservations.services.send_user_notification") as mocked_send:
            check_upcoming_trips_quorum()
            check_upcoming_trips_quorum()

        trip.refresh_from_db()
        assert trip.status == "RISCO DE CANCELAMENTO"
        assert trip.quorum_warning_notified_at is not None
        assert mocked_send.call_count == 1

    def test_trip_has_quorum_counts_confirmed_server_reservation(self):
        trip = Trip.objects.create(
            trip_date=timezone.now().date(),
            departure_timestamp=timezone.now() + timedelta(minutes=30),
            status="CONFIRMADA",
            bus=self.bus,
            route=self.route,
        )

        civ_user = CustomUser.objects.create_user(
            email="servidor-quorum@test.com",
            full_name="Servidor Quorum",
            password="12345678",
            is_active=True,
        )
        civ = CivilServantProfile.objects.create(
            user=civ_user,
            civil_servant_id="22223333",
        )
        Reservation.objects.create(trip=trip, civil_servant=civ, status="CONFIRMADA")

        assert trip_has_quorum(trip)

    def test_trip_has_quorum_counts_local_server_passenger(self):
        trip = self._create_local_server_trip()

        assert trip_has_quorum(trip)

    def test_sync_trip_status_sends_quorum_met_notification(self):
        trip = Trip.objects.create(
            trip_date=timezone.now().date(),
            departure_timestamp=timezone.now() + timedelta(minutes=30),
            status="RISCO DE CANCELAMENTO",
            bus=self.bus,
            route=self.route,
        )

        civ_user = CustomUser.objects.create_user(
            email="servidor-status@test.com",
            full_name="Servidor Status",
            password="12345678",
            is_active=True,
        )
        civ = CivilServantProfile.objects.create(
            user=civ_user,
            civil_servant_id="33334444",
        )
        Reservation.objects.create(trip=trip, civil_servant=civ, status="CONFIRMADA")

        with patch("apps.reservations.services.send_user_notification") as mocked_send:
            sync_trip_status(trip)

        trip.refresh_from_db()
        assert trip.status == "CONFIRMADA"
        assert trip.quorum_met_notified_at is not None
        assert mocked_send.called

    def test_scheduler_does_not_send_warning_when_quorum_is_met(self):
        trip = self._create_trip_with_minimum_quorum()

        with patch(
            "apps.trips.management.commands.run_scheduler.send_trip_quorum_warning_notification"
        ) as mocked_warning:
            check_upcoming_trips_quorum()

        trip.refresh_from_db()
        assert trip.status == "CONFIRMADA"
        assert not mocked_warning.called
