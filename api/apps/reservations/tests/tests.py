from datetime import time, timedelta
from unittest.mock import patch

from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient, APITestCase

from apps.reservations.models import Punishment, Reservation
from apps.reservations.services.priority_service import PriorityService
from apps.reservations.services.punishment_service import process_trip_punishments
from apps.trips.models import Bus, Route, Trip
from apps.trips.services.trip_service import TripService
from apps.users.models import (
    AdministratorProfile,
    CivilServantProfile,
    CustomUser,
    DriverProfile,
    StudentProfile,
)


class BaseReservationTestCase(APITestCase):
    """Base test case for reservations."""

    def setUp(self):
        self._create_users()
        self._create_bus_and_route()

    def _create_users(self):
        """Creates admin and driver users and profiles."""

        self.admin_user = CustomUser.objects.create_superuser(
            email="admin@easyrota.com",
            password="password123",
            full_name="Admin Supremo",
            role="admin",
        )
        self.admin_profile = AdministratorProfile.objects.get(user=self.admin_user)

        self.driver_user = CustomUser.objects.create_user(
            email="motorista@easyrota.com",
            password="password123",
            full_name="João Motorista",
        )
        self.driver_profile = DriverProfile.objects.create(
            user=self.driver_user, cnh="12345678901"
        )

    def _create_bus_and_route(self):
        """Creates bus and route"""

        self.bus = Bus.objects.create(
            number_plate="ABC-1234",
            seating_capacity=40,
            brand="Mercedes-Benz",
            administrator=self.admin_profile,
        )

        self.route = Route.objects.create(
            origin="Salvador",
            destiny="Feira",
            departure_time=time(8, 0),
            arrival_time=time(12, 0),
            administrator=self.admin_profile,
        )

    def create_civil_servant(
        self,
        email="civil-servant@teste.com",
        civil_servant_id="12345",
    ):
        """Creates civil servant user and profile"""
        user = CustomUser.objects.create_user(email=email, password="12345678")
        civil_servant = CivilServantProfile.objects.create(
            user=user,
            civil_servant_id=civil_servant_id,
        )

        return user, civil_servant

    def create_student(self, email="student@teste.com", student_id="12345"):
        """
        Creates student user and profile.
        """
        user = CustomUser.objects.create_user(email=email, password="12345678")
        student_profile = StudentProfile.objects.create(
            user=user, student_id=student_id
        )

        return user, student_profile

    def create_trip(self, days_ahead=1, status="CONFIRMADA"):
        """Creates trip"""
        return Trip.objects.create(
            trip_date=timezone.now().date() + timedelta(days=days_ahead),
            status=status,
            bus=self.bus,
            route=self.route,
        )

    def create_reservation(self, trip=None, civil_servant=None, student=None):
        """Creates reservation."""
        if not trip:
            trip = self.create_trip()

        return Reservation.objects.create(
            trip=trip, civil_servant=civil_servant, student=student, checkin_date=None
        )


class ReservationTest(BaseReservationTestCase):
    def setUp(self):
        super().setUp()
        self.url = reverse("reservation-create")
        self.student, self.student_profile = self.create_student()

    def test_create_reservation_after_limit(self):
        """Creating a reservation after the limit (30 minutes before bus departure)
        should display an error message."""

        self.client.force_authenticate(user=self.student)

        trip = self.create_trip(days_ahead=0)

        cutoff_time = timezone.make_aware(
            timezone.datetime.combine(
                trip.trip_date,
                trip.route.departure_time,
            ),
            timezone.get_current_timezone(),
        ) + timedelta(minutes=31)

        with patch(
            "apps.trips.services.trip_service.timezone.now", return_value=cutoff_time
        ):
            response = self.client.post(
                self.url,
                data={"trip": trip.id},
                format="json",
            )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("Prazo de reserva encerrado.", str(response.data))

    def test_create_reservation_successfully(self):
        """Creating a reservation before the limit (30 minutes before bus departure)
        should create a successful reservation."""

        self.client.force_authenticate(user=self.student)

        trip = self.create_trip()

        response = self.client.post(self.url, data={"trip": trip.id}, format="json")

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)


class ReservationCancelTest(BaseReservationTestCase):
    def setUp(self):
        super().setUp()
        self.user, self.student_profile = self.create_student()
        self.trip = self.create_trip(days_ahead=1)
        self.reservation = self.create_reservation(
            student=self.student_profile,
            trip=self.trip,
        )
        self.url = reverse("reservation-manage-cancel", args=[self.reservation.id])

    def test_cancel_reservation(self):
        self.client.force_authenticate(user=self.user)

        response = self.client.post(self.url, format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(Reservation.objects.filter(id=self.reservation.id).exists())


class ReservationHistoryTest(BaseReservationTestCase):
    def setUp(self):
        super().setUp()
        self.url = reverse("reservation-history")
        self.user, self.civil_servant = self.create_civil_servant()

        self.trip = self.create_trip(days_ahead=0, status="CONCLUÍDA")
        self.reservation = self.create_reservation(
            civil_servant=self.civil_servant, trip=self.trip
        )

    def test_verify_fields_visible(self):
        """Verify if the fields are showing correctly."""

        self.client.force_authenticate(user=self.user)

        response = self.client.get(self.url, format="json")

        fields = [
            "origin",
            "destiny",
            "trip_date",
            "trip_history_status",
            "total_trips",
            "created_at",
        ]
        for field in fields:
            self.assertIn(field, response.data[0])

        self.assertEqual(response.data[0]["trip_history_status"], "FALTA")
        self.assertEqual(response.data[0]["total_trips"], 1)


class AvailableTripsTest(BaseReservationTestCase):
    def setUp(self):
        super().setUp()
        self.url = reverse("reservation-available-trips")
        self.user, self.student_profile = self.create_student()

    def test_returns_available_trips_with_reserved_seats(self):
        trip = self.create_trip(days_ahead=2)
        Reservation.objects.create(
            trip=trip,
            student=self.student_profile,
            status="CONFIRMADA",
        )
        Reservation.objects.create(
            trip=trip,
            civil_servant=self.create_civil_servant(
                email="cv1@teste.com",
                civil_servant_id="111",
            )[1],
            status="PENDENTE",
        )
        Reservation.objects.create(
            trip=trip,
            civil_servant=self.create_civil_servant(
                email="cv2@teste.com",
                civil_servant_id="222",
            )[1],
            status="LISTA SECUNDÁRIA",
        )

        print(Reservation.objects.count())

        self.client.force_authenticate(user=self.user)
        response = self.client.get(self.url, format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["available_seats"], 38)
        self.assertEqual(response.data[0]["bus_brand"], "Mercedes-Benz")

    def test_trip_has_quorum_counts_driver_registered_server(self):
        trip = self.create_trip(days_ahead=1)
        self.assertFalse(TripService.trip_has_quorum(trip))

    def test_trip_capacity_counts_trip_passengers(self):
        trip = self.create_trip(days_ahead=1)
        self.assertTrue(TripService.trip_has_capacity(trip))


class PunishmentSystemTestCase(BaseReservationTestCase):
    def setUp(self):
        super().setUp()

        self.trip = self.create_trip(days_ahead=0, status="EM ANDAMENTO")

        self.absent_user, self.absent_profile = self.create_student(
            email="absent_student@test.com", student_id="001"
        )

        self.present_user, self.present_profile = self.create_student(
            email="present_student@test.com", student_id="002"
        )

        self.absent_reservation = self.create_reservation(
            trip=self.trip, student=self.absent_profile
        )
        self.absent_reservation.check_in = False
        self.absent_reservation.status = "CONFIRMADA"
        self.absent_reservation.save()

        self.present_reservation = self.create_reservation(
            trip=self.trip, student=self.present_profile
        )
        self.present_reservation.check_in = True
        self.present_reservation.status = "CONFIRMADA"
        self.present_reservation.save()

    def test_apply_punishment_on_absence(self):
        """
        Ensures absent students receive an active
        punishment at the end of the trip.
        """
        process_trip_punishments(self.trip)

        punishment_exists = Punishment.objects.filter(
            student=self.absent_profile,
            reservation=self.absent_reservation,
            is_active=True,
        ).exists()

        self.assertTrue(punishment_exists)

    def test_forgive_punishment_on_presence(self):
        """
        Ensures that if a student already has an active punishment,
        it becomes inactive if they check in on a new trip.
        """
        old_reservation = self.create_reservation(
            trip=self.trip, student=self.present_profile
        )
        old_reservation.status = "CONFIRMADA"
        old_reservation.save()

        old_punishment = Punishment.objects.create(
            student=self.present_profile,
            reservation=old_reservation,
            is_active=True,
            description="Faltou na viagem",
        )

        process_trip_punishments(self.trip)
        old_punishment.refresh_from_db()

        self.assertFalse(old_punishment.is_active)

    def test_no_punishment_for_present_students(self):
        """Ensures that a present student does not receive a new punishment."""
        process_trip_punishments(self.trip)

        punishment_exists = Punishment.objects.filter(
            student=self.present_profile, reservation=self.present_reservation
        ).exists()

        self.assertFalse(punishment_exists)

    def test_priority_calculation_based_on_punishments(self):
        """
        Ensures get_priority_tuple calculates the correct priority
        based on the number of active punishments (1, 2, or 3).
        """
        clean_user, clean_profile = self.create_student(
            email="clean@test.com", student_id="003"
        )

        new_reservation = self.create_reservation(trip=self.trip, student=clean_profile)

        priority, _ = PriorityService.get_priority_tuple(new_reservation)
        self.assertEqual(priority, 1)

        old_trip_1 = self.create_trip(days_ahead=-1)
        old_res_1 = self.create_reservation(trip=old_trip_1, student=clean_profile)
        Punishment.objects.create(
            student=clean_profile,
            reservation=old_res_1,
            is_active=True,
            description="Primeira Falta",
        )

        priority, _ = PriorityService.get_priority_tuple(new_reservation)
        self.assertEqual(priority, 2)

        old_trip_2 = self.create_trip(days_ahead=-2)
        old_res_2 = self.create_reservation(trip=old_trip_2, student=clean_profile)
        Punishment.objects.create(
            student=clean_profile,
            reservation=old_res_2,
            is_active=True,
            description="Segunda Falta",
        )

        priority, _ = PriorityService.get_priority_tuple(new_reservation)
        self.assertEqual(priority, 3)

    def test_forgive_only_one_punishment_on_presence(self):
        """
        Ensures that if a student has multiple active punishments,
        only the oldest one is forgiven per check-in.
        """
        old_res_1 = self.create_reservation(
            trip=self.trip, student=self.present_profile
        )
        punishment_1 = Punishment.objects.create(
            student=self.present_profile,
            reservation=old_res_1,
            is_active=True,
            description="Falta antiga 1",
        )

        old_res_2 = self.create_reservation(
            trip=self.trip, student=self.present_profile
        )
        punishment_2 = Punishment.objects.create(
            student=self.present_profile,
            reservation=old_res_2,
            is_active=True,
            description="Falta recente 2",
        )

        process_trip_punishments(self.trip)

        punishment_1.refresh_from_db()
        punishment_2.refresh_from_db()

        self.assertFalse(punishment_1.is_active)
        self.assertTrue(punishment_2.is_active)


class PunishmentHistoryAPITestCase(BaseReservationTestCase):
    def setUp(self):
        super().setUp()
        self.client = APIClient()

        self.user, self.profile = self.create_student(
            email="api_student@test.com", student_id="999"
        )
        self.client.force_authenticate(user=self.user)

        self.trip = self.create_trip(days_ahead=-1)
        self.reservation = self.create_reservation(trip=self.trip, student=self.profile)
        self.punishment = Punishment.objects.create(
            student=self.profile,
            reservation=self.reservation,
            is_active=True,
            description="Faltou na viagem teste",
        )

    def test_get_punishment_history_authenticated(self):
        """
        It ensures that the student can list their own history of punishments.
        """
        url = reverse("reservation-punishments-history")

        response = self.client.get(url)

        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["description"], "Faltou na viagem teste")
        self.assertTrue(response.data[0]["is_active"])

        self.assertIn("created_at", response.data[0])

    def test_get_punishment_history_unauthenticated(self):
        """
        Ensures that anonymous users receive a 401 error.
        """
        self.client.force_authenticate(user=None)
        url = reverse("reservation-punishments-history")

        response = self.client.get(url)
        self.assertEqual(response.status_code, 401)
