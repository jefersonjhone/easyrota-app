from datetime import time, timedelta

from django.contrib.auth import get_user_model
from django.test import TestCase
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient, APITestCase
from rest_framework_simplejwt.tokens import RefreshToken

from apps.reservations.models import Reservation
from apps.trips.models import Bus, Route, Trip
from apps.users.models import CustomUser
from apps.users.models.profiles import (
    AdministratorProfile,
    DriverProfile,
    StudentProfile,
)

User = get_user_model()


class TripAPITestCase(APITestCase):
    def setUp(self):
        """
        Initial setup of the test database.
        Creates users, profiles, a bus, and some base routes.
        """

        self.today = timezone.now().date()
        self.tomorrow = self.today + timedelta(days=1)

        self.admin_user = CustomUser.objects.create_superuser(
            email="admin@easyrota.com",
            password="password123",
            full_name="Admin Supremo",
            is_active=True,
            is_staff=True,
            role="admin",
        )
        self.admin_profile = AdministratorProfile.objects.get(user=self.admin_user)

        self.driver_user = CustomUser.objects.create_user(
            email="motorista@easyrota.com",
            password="password123",
            full_name="João Motorista",
            is_active=True,
        )
        self.driver_profile = DriverProfile.objects.create(
            user=self.driver_user, cnh="12345678901"
        )

        self.bus = Bus.objects.create(
            number_plate="ABC-1234",
            seating_capacity=40,
            brand="Mercedes-Benz",
            administrator=self.admin_profile,
        )

        now = timezone.now()
        time_zone = timezone.get_current_timezone()

        self.past_time = (now - timedelta(hours=1)).astimezone(time_zone).time()
        self.future_time = (now + timedelta(hours=1)).astimezone(time_zone).time()

        self.route_morning = Route.objects.create(
            origin="Salvador",
            destiny="Feira",
            departure_time=time(8, 0),
            arrival_time=time(12, 0),
            administrator=self.admin_profile,
        )

        self.route_overlapping = Route.objects.create(
            origin="Feira",
            destiny="Salvador",
            departure_time=time(10, 0),
            arrival_time=time(14, 0),
            administrator=self.admin_profile,
        )

        self.route_midnight = Route.objects.create(
            origin="Salvador",
            destiny="Recife",
            departure_time=time(22, 0),
            arrival_time=time(5, 0),
            administrator=self.admin_profile,
        )

        self.route_active = Route.objects.create(
            origin="Feira de Santana",
            destiny="Salvador",
            departure_time=self.past_time,
            arrival_time=self.future_time,
            administrator=self.admin_profile,
        )

        self.trip_list_url = reverse("trip-list")

    def test_admin_can_create_trip(self):
        """It ensures that the Administrator can schedule a trip."""
        self.client.force_authenticate(user=self.admin_user)

        data = {
            "trip_date": self.tomorrow.isoformat(),
            "status": "CONFIRMADA",
            "bus": self.bus.id,
            "route": self.route_morning.id,
        }

        response = self.client.post(self.trip_list_url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Trip.objects.count(), 1)

    def test_driver_cannot_create_trip(self):
        """It ensures that the driver is unable to schedule a trip."""

        self.client.force_authenticate(user=self.driver_user)

        data = {
            "trip_date": self.tomorrow.isoformat(),
            "bus": self.bus.id,
            "route": self.route_morning.id,
        }

        response = self.client.post(self.trip_list_url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(Trip.objects.count(), 0)

    def test_driver_can_list_and_retrieve_own_in_progress_trip(self):
        """Drivers can return to trips in progress that are still assigned to them."""
        self.client.force_authenticate(user=self.driver_user)

        trip = Trip.objects.create(
            trip_date=self.today,
            bus=self.bus,
            route=self.route_active,
            status="EM ANDAMENTO",
            driver=self.driver_profile,
            departure_timestamp=timezone.now(),
        )

        list_response = self.client.get(self.trip_list_url)
        self.assertEqual(list_response.status_code, status.HTTP_200_OK)
        self.assertIn(trip.id, [item["id"] for item in list_response.data])

        detail_response = self.client.get(
            reverse("trip-detail", kwargs={"pk": trip.id})
        )
        self.assertEqual(detail_response.status_code, status.HTTP_200_OK)
        self.assertEqual(detail_response.data["id"], trip.id)

    def test_driver_cannot_list_or_retrieve_another_in_progress_trip(self):
        """Trips in progress remain hidden from drivers that are not assigned."""
        other_driver_user = CustomUser.objects.create_user(
            email="outro-motorista@easyrota.com",
            password="password123",
            full_name="Outro Motorista",
            is_active=True,
        )
        other_driver_profile = DriverProfile.objects.create(
            user=other_driver_user, cnh="12345678201"
        )
        trip = Trip.objects.create(
            trip_date=self.today,
            bus=self.bus,
            route=self.route_active,
            status="EM ANDAMENTO",
            driver=other_driver_profile,
            departure_timestamp=timezone.now(),
        )

        self.client.force_authenticate(user=self.driver_user)

        list_response = self.client.get(self.trip_list_url)
        self.assertEqual(list_response.status_code, status.HTTP_200_OK)
        self.assertNotIn(trip.id, [item["id"] for item in list_response.data])

        detail_response = self.client.get(
            reverse("trip-detail", kwargs={"pk": trip.id})
        )
        self.assertEqual(detail_response.status_code, status.HTTP_404_NOT_FOUND)

    def test_cannot_create_trip_in_the_past(self):
        """It ensures that the system blocks trips scheduled for previous days."""

        self.client.force_authenticate(user=self.admin_user)
        yesterday = self.today - timedelta(days=1)

        data = {
            "trip_date": yesterday.isoformat(),
            "bus": self.bus.id,
            "route": self.route_morning.id,
        }

        response = self.client.post(self.trip_list_url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("route", response.data)
        self.assertIn(
            "Não é possível agendar uma viagem para um horário que já passou hoje.",
            response.data["route"],
        )

    def test_double_booking_standard(self):
        """Tests the blocking of overlapping normal schedules (same day)."""

        self.client.force_authenticate(user=self.admin_user)

        Trip.objects.create(
            trip_date=self.tomorrow, bus=self.bus, route=self.route_morning
        )

        data = {
            "trip_date": self.tomorrow.isoformat(),
            "bus": self.bus.id,
            "route": self.route_overlapping.id,
        }

        response = self.client.post(self.trip_list_url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("bus", response.data)

    def test_double_booking_midnight_crossing(self):
        """Test the roadblock: a trip that crosses the early morning
        hours clashing with the next day's trip."""

        self.client.force_authenticate(user=self.admin_user)

        Trip.objects.create(
            trip_date=self.today, bus=self.bus, route=self.route_midnight
        )

        route_early_morning = Route.objects.create(
            origin="Recife",
            destiny="João Pessoa",
            departure_time=time(2, 0),
            arrival_time=time(6, 0),
            administrator=self.admin_profile,
        )

        data = {
            "trip_date": self.tomorrow.isoformat(),
            "bus": self.bus.id,
            "route": route_early_morning.id,
        }

        response = self.client.post(self.trip_list_url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_current_trip_screen_endpoint(self):
        """
        Check if the view prepared for the front-end returns the
        data with the correct structure.
        """

        self.client.force_authenticate(user=self.driver_user)

        Trip.objects.create(
            trip_date=self.today,
            bus=self.bus,
            route=self.route_active,
            driver=self.driver_profile,
            departure_timestamp=timezone.now() - timedelta(minutes=15),
        )

        url = reverse("trip-current")
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        keys = response.data.keys()
        self.assertIn("trip_date", keys)
        self.assertIn("departure_time", keys)
        self.assertIn("origin", keys)
        self.assertIn("percentage_complete", keys)
        self.assertIn("minutes_remaining", keys)
        self.assertIn("status_route", keys)
        self.assertEqual(response.data["bus_number_plate"], "ABC-1234")

    def test_trip_detail_separates_reservations_from_check_ins(self):
        """Driver occupancy data must count only confirmed check-ins."""
        self.client.force_authenticate(user=self.admin_user)

        trip = Trip.objects.create(
            trip_date=self.tomorrow,
            bus=self.bus,
            route=self.route_morning,
            status="CONFIRMADA",
        )
        checked_in_user = CustomUser.objects.create_user(
            email="checked-in@easyrota.com",
            password="password123",
            full_name="Passageiro Confirmado",
            is_active=True,
        )
        reserved_user = CustomUser.objects.create_user(
            email="reserved-only@easyrota.com",
            password="password123",
            full_name="Passageiro Reservado",
            is_active=True,
        )
        checked_in_profile = StudentProfile.objects.create(
            user=checked_in_user,
            student_id="STU-CHECKED-IN",
        )
        reserved_profile = StudentProfile.objects.create(
            user=reserved_user,
            student_id="STU-RESERVED-ONLY",
        )

        Reservation.objects.create(
            trip=trip,
            student=checked_in_profile,
            status="CONFIRMADA",
            check_in=True,
            checkin_date=timezone.now(),
        )
        Reservation.objects.create(
            trip=trip,
            student=reserved_profile,
            status="CONFIRMADA",
            check_in=False,
        )

        response = self.client.get(reverse("trip-detail", kwargs={"pk": trip.id}))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["active_reservations"], 2)
        self.assertEqual(response.data["checked_in_count"], 1)
        self.assertEqual(len(response.data["checked_in_passengers"]), 1)
        self.assertEqual(
            response.data["checked_in_passengers"][0]["passenger_name"],
            "Passageiro Confirmado",
        )


class CurrentTripPassengerAPITests(APITestCase):
    def setUp(self):
        """
        Setup focused on the passenger and their reservations.
        """
        self.url = reverse("trip-current")

        self.admin_user = CustomUser.objects.create_superuser(
            email="admin@easyrota.com", password="123", is_active=True, role="admin"
        )
        self.admin_profile = AdministratorProfile.objects.get(user=self.admin_user)

        self.passenger_user = CustomUser.objects.create_user(
            email="estudante@teste.com", password="123", is_active=True
        )
        self.student_profile = StudentProfile.objects.create(
            user=self.passenger_user,
        )

        self.other_user = CustomUser.objects.create_user(
            email="sem_reserva@teste.com", password="123", is_active=True
        )

        self.bus = Bus.objects.create(
            number_plate="XYZ-9876",
            seating_capacity=40,
            brand="Mercedes-Benz",
            administrator=self.admin_profile,
        )

        now = timezone.now()
        time_zone = timezone.get_current_timezone()

        self.past_time = (now - timedelta(hours=1)).astimezone(time_zone).time()
        self.future_time = (now + timedelta(hours=1)).astimezone(time_zone).time()

        self.route_active = Route.objects.create(
            origin="Feira de Santana",
            destiny="Salvador",
            departure_time=self.past_time,
            arrival_time=self.future_time,
            administrator=self.admin_profile,
        )

    def test_no_upcoming_trips_returns_404(self):
        """
        It should return 404 if the passenger has no upcoming trips.
        """
        self.client.force_authenticate(user=self.passenger_user)
        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertEqual(response.data["detail"], "Nenhuma viagem próxima.")

    def test_ignores_trips_without_user_reservation(self):
        """
        It ensures that one passenger cannot see another person's current trip.
        """

        trip = Trip.objects.create(
            trip_date=timezone.now().date(),
            bus=self.bus,
            route=self.route_active,
            status="CONFIRMADA",
        )

        Reservation.objects.create(
            trip=trip, student=self.student_profile, status="CONFIRMADA"
        )

        self.client.force_authenticate(user=self.other_user)
        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_returns_trip_in_progress(self):
        """
        The trip should be returned if the user
        has a reservation and it is in progress.
        """

        trip = Trip.objects.create(
            trip_date=timezone.now().date(),
            bus=self.bus,
            route=self.route_active,
            status="EM ANDAMENTO",
            departure_timestamp=timezone.now() - timedelta(minutes=15),
        )

        Reservation.objects.create(
            trip=trip, student=self.student_profile, status="CONFIRMADA"
        )

        self.client.force_authenticate(user=self.passenger_user)
        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["id"], trip.id)

    def test_updates_status_automatically(self):
        """
        Test the View's _update_trip_status method.
         If the trip is 'CONFIRMED', but the current
         time has already passed the departure time,
         the view should automatically update to 'IN PROGRESS'.
        """
        trip = Trip.objects.create(
            trip_date=timezone.now().date(),
            bus=self.bus,
            route=self.route_active,
            status="CONFIRMADA",
            departure_timestamp=timezone.now() - timedelta(minutes=5),
        )
        Reservation.objects.create(
            trip=trip, student=self.student_profile, status="CONFIRMADA"
        )

        self.client.force_authenticate(user=self.passenger_user)
        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["status_trip"], "Em Andamento")

        trip.refresh_from_db()
        self.assertEqual(trip.status, "EM ANDAMENTO")

    def test_percentage_logic_with_departure_timestamp(self):
        """
        Tests whether the Serializer calculates the percentage correctly
        based on the moment the driver actually pressed 'Start Trip'.
        """
        now = timezone.now()

        trip = Trip.objects.create(
            trip_date=now.date(),
            bus=self.bus,
            route=self.route_active,
            status="EM ANDAMENTO",
            departure_timestamp=now - timedelta(hours=1),
        )
        Reservation.objects.create(
            trip=trip, student=self.student_profile, status="CONFIRMADA"
        )

        self.client.force_authenticate(user=self.passenger_user)
        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        percentage = response.data["percentage_complete"]
        minutes_left = response.data["minutes_remaining"]

        self.assertTrue(
            49 <= percentage <= 51, f"Porcentagem esperada ~50%, recebido {percentage}"
        )
        self.assertTrue(
            59 <= minutes_left <= 61,
            f"Minutos restantes esperados ~60, recebido {minutes_left}",
        )


class TripCheckInAPITests(APITestCase):
    def setUp(self):
        self.admin_user = CustomUser.objects.create_superuser(
            email="admin-checkin@easyrota.com",
            password="password123",
            full_name="Admin Checkin",
            is_active=True,
            role="admin",
        )
        self.admin_profile = AdministratorProfile.objects.get(user=self.admin_user)

        self.driver_user = CustomUser.objects.create_user(
            email="driver-checkin@easyrota.com",
            password="password123",
            full_name="Motorista Checkin",
            is_active=True,
        )
        self.driver_profile = DriverProfile.objects.create(
            user=self.driver_user, cnh="12345678901"
        )

        self.other_driver_user = CustomUser.objects.create_user(
            email="other-driver-checkin@easyrota.com",
            password="password123",
            full_name="Outro Motorista",
            is_active=True,
        )
        self.other_driver_profile = DriverProfile.objects.create(
            user=self.other_driver_user, cnh="12345678201"
        )

        self.passenger_user = CustomUser.objects.create_user(
            email="passenger-checkin@easyrota.com",
            password="password123",
            full_name="Passageiro Checkin",
            is_active=True,
        )
        self.student_profile = StudentProfile.objects.create(
            user=self.passenger_user,
            student_id="STU-CHECKIN-01",
        )

        self.passenger_without_reservation = CustomUser.objects.create_user(
            email="no-reservation-checkin@easyrota.com",
            password="password123",
            full_name="Sem Reserva",
            is_active=True,
        )
        StudentProfile.objects.create(
            user=self.passenger_without_reservation,
            student_id="STU-CHECKIN-02",
        )

        self.bus = Bus.objects.create(
            number_plate="CHK-1234",
            seating_capacity=40,
            brand="Mercedes-Benz",
            administrator=self.admin_profile,
        )
        self.route = Route.objects.create(
            origin="Feira de Santana",
            destiny="Salvador",
            departure_time=time(8, 0),
            arrival_time=time(10, 0),
            administrator=self.admin_profile,
        )
        self.trip = Trip.objects.create(
            trip_date=timezone.localdate(),
            status="EM ANDAMENTO",
            bus=self.bus,
            route=self.route,
            driver=self.driver_profile,
        )
        self.reservation = Reservation.objects.create(
            trip=self.trip,
            student=self.student_profile,
            status="CONFIRMADA",
        )
        self.url = f"/api/trips/{self.trip.id}/check-in/"

    def test_check_in_marks_passenger_reservation(self):
        self.client.force_authenticate(user=self.driver_user)

        response = self.client.post(
            self.url,
            {"passenger_identifier": str(self.passenger_user.id)},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["status"], "Check-in realizado com sucesso.")
        self.reservation.refresh_from_db()
        self.assertTrue(self.reservation.check_in)
        self.assertIsNotNone(self.reservation.checkin_date)

    def test_check_in_does_not_require_trip_in_progress(self):
        self.trip.status = "CONFIRMADA"
        self.trip.save(update_fields=["status"])
        self.client.force_authenticate(user=self.driver_user)

        response = self.client.post(
            self.url,
            {"passenger_identifier": str(self.passenger_user.id)},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.reservation.refresh_from_db()
        self.assertTrue(self.reservation.check_in)

    def test_check_in_rejects_passenger_without_trip_reservation(self):
        self.client.force_authenticate(user=self.driver_user)

        response = self.client.post(
            self.url,
            {"passenger_identifier": str(self.passenger_without_reservation.id)},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertEqual(response.data["error"], "Passageiro sem reserva nesta viagem.")

    def test_check_in_rejects_driver_not_associated_with_trip(self):
        self.client.force_authenticate(user=self.other_driver_user)

        response = self.client.post(
            self.url,
            {"passenger_identifier": str(self.passenger_user.id)},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(
            response.data["error"], "Motorista nao autorizado para esta viagem."
        )
        self.reservation.refresh_from_db()
        self.assertFalse(self.reservation.check_in)

    def test_check_in_rejects_invalid_qr_code(self):
        self.client.force_authenticate(user=self.driver_user)

        response = self.client.post(
            self.url,
            {"passenger_identifier": "qr-invalido"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data["error"], "QR Code invalido.")

    def test_check_in_rejects_duplicate_check_in(self):
        self.reservation.check_in = True
        self.reservation.checkin_date = timezone.now()
        self.reservation.save(update_fields=["check_in", "checkin_date"])
        self.client.force_authenticate(user=self.driver_user)

        response = self.client.post(
            self.url,
            {"passenger_identifier": str(self.passenger_user.id)},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_409_CONFLICT)
        self.assertEqual(response.data["error"], "Passageiro ja fez check-in.")


class TripAssignDriverTestCase(TestCase):
    """Test cases for the assign_driver action"""

    def setUp(self):
        """Initialize test data and API client"""
        self.admin_user = User.objects.create_user(
            full_name="admin1", email="admin1@test.com", password="testpass123"
        )

        self.admin_profile = AdministratorProfile.objects.create(user=self.admin_user)

        self.driver_user = User.objects.create_user(
            full_name="driver1", email="driver1@test.com", password="testpass123"
        )

        self.driver_profile = DriverProfile.objects.create(
            user=self.driver_user, cnh="12345678901"
        )

        self.route = Route.objects.create(
            origin="São Paulo",
            destiny="Rio de Janeiro",
            departure_time="10:00:00",
            arrival_time="16:00:00",
            administrator=self.admin_profile,
        )

        self.trip = Trip.objects.create(
            trip_date="2026-05-25", status="CONFIRMADA", route=self.route
        )

        self.client = APIClient()
        self.authenticate_driver()

    def authenticate_driver(self):
        """Authenticate the driver user for API requests"""
        refresh = RefreshToken.for_user(self.driver_user)
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {refresh.access_token}")

    def test_assign_driver_success(self):
        """Test successful driver assignment to a trip"""
        url = f"/api/trips/{self.trip.id}/assign_driver/"

        response = self.client.post(url, format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["status"], "Motorista associado com sucesso.")

        self.trip.refresh_from_db()
        self.assertEqual(self.trip.driver, self.driver_profile)

    def test_assign_driver_already_assigned_same_driver(self):
        """Test assignment when trip already has the same driver"""
        self.trip.driver = self.driver_profile
        self.trip.save()

        url = f"/api/trips/{self.trip.id}/assign_driver/"

        response = self.client.post(url, format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.trip.refresh_from_db()
        self.assertEqual(self.trip.driver, self.driver_profile)

    def test_assign_driver_already_assigned_different_driver(self):
        """Test assignment failure when trip has a different driver"""
        other_user = User.objects.create_user(
            full_name="driver2", email="driver2@test.com", password="testpass123"
        )

        other_driver = DriverProfile.objects.create(user=other_user, cnh="12345678201")

        self.trip.driver = other_driver
        self.trip.save()

        url = f"/api/trips/{self.trip.id}/assign_driver/"

        response = self.client.post(url, format="json")

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(response.data["error"], "Você não é o motorista desta viagem.")

    def test_assign_driver_without_authentication(self):
        """Test assignment rejection when user is not authenticated"""
        self.client.credentials()
        url = f"/api/trips/{self.trip.id}/assign_driver/"

        response = self.client.post(url, format="json")

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_assign_driver_with_invalid_trip_id(self):
        """Test assignment failure with invalid trip ID"""
        url = "/api/trips/99999/assign_driver/"

        with self.assertRaises(Trip.DoesNotExist):
            self.client.post(url, format="json")


class TripUnassignDriverTestCase(TestCase):
    """Test cases for the unassign_driver action"""

    def setUp(self):
        """Initialize test data and API client"""
        self.admin_user = User.objects.create_user(
            full_name="admin2", email="admin2@test.com", password="testpass123"
        )

        self.admin_profile = AdministratorProfile.objects.create(user=self.admin_user)

        self.driver_user = User.objects.create_user(
            full_name="driver3", email="driver3@test.com", password="testpass123"
        )

        self.driver_profile = DriverProfile.objects.create(
            user=self.driver_user, cnh="12345678201"
        )

        self.route = Route.objects.create(
            origin="Brasília",
            destiny="Goiânia",
            departure_time="08:00:00",
            arrival_time="10:30:00",
            administrator=self.admin_profile,
        )

        self.trip = Trip.objects.create(
            trip_date="2026-05-26",
            status="CONFIRMADA",
            route=self.route,
            driver=self.driver_profile,
        )

        self.client = APIClient()
        self.authenticate_driver()

    def authenticate_driver(self):
        """Authenticate the driver user for API requests"""
        refresh = RefreshToken.for_user(self.driver_user)
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {refresh.access_token}")

    def test_unassign_driver_success(self):
        """Test successful driver unassignment from a trip"""
        self.assertIsNotNone(self.trip.driver)

        url = f"/api/trips/{self.trip.id}/unassign_driver/"

        response = self.client.post(url, format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["status"], "Motorista desassociado com sucesso.")

        self.trip.refresh_from_db()
        self.assertIsNone(self.trip.driver)

    def test_unassign_driver_not_assigned(self):
        """Test unassignment when trip has no driver"""
        self.trip.driver = None
        self.trip.save()

        url = f"/api/trips/{self.trip.id}/unassign_driver/"

        response = self.client.post(url, format="json")

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_unassign_driver_different_driver(self):
        """Test unassignment failure when different driver tries to unassign"""
        other_user = User.objects.create_user(
            full_name="driver4", email="driver4@test.com", password="testpass123"
        )

        other_driver = DriverProfile.objects.create(user=other_user, cnh="12345671201")

        self.trip.driver = other_driver
        self.trip.save()

        url = f"/api/trips/{self.trip.id}/unassign_driver/"

        response = self.client.post(url, format="json")

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(response.data["error"], "Você não é o motorista desta viagem.")

    def test_unassign_driver_without_authentication(self):
        """Test unassignment rejection when user is not authenticated"""
        self.client.credentials()
        url = f"/api/trips/{self.trip.id}/unassign_driver/"

        response = self.client.post(url, format="json")

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_unassign_driver_with_invalid_trip_id(self):
        """Test unassignment failure with invalid trip ID"""
        url = "/api/trips/99999/unassign_driver/"

        with self.assertRaises(Trip.DoesNotExist):
            self.client.post(url, format="json")

    def test_unassign_driver_preserves_trip_data(self):
        """Test that unassignment preserves other trip information"""
        original_status = self.trip.status
        original_route = self.trip.route

        url = f"/api/trips/{self.trip.id}/unassign_driver/"

        response = self.client.post(url, format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        self.trip.refresh_from_db()
        self.assertEqual(self.trip.status, original_status)
        self.assertEqual(self.trip.route, original_route)
        self.assertIsNone(self.trip.driver)


class TripAssignBusTestCase(TestCase):
    """Test cases for the assign_bus action"""

    def setUp(self):
        """Initialize test data and API client"""
        self.admin_user = User.objects.create_user(
            full_name="admin3", email="admin3@test.com", password="testpass123"
        )

        self.admin_profile = AdministratorProfile.objects.create(user=self.admin_user)

        self.driver_user = User.objects.create_user(
            full_name="driver5", email="driver5@test.com", password="testpass123"
        )

        self.driver_profile = DriverProfile.objects.create(
            user=self.driver_user, cnh="12345678301"
        )

        self.bus = Bus.objects.create(
            number_plate="ABC1234",
            seating_capacity=50,
            brand="Volvo B7R",
            administrator=self.admin_profile,
        )

        self.route = Route.objects.create(
            origin="São Paulo",
            destiny="Rio de Janeiro",
            departure_time="10:00:00",
            arrival_time="16:00:00",
            administrator=self.admin_profile,
        )

        self.trip = Trip.objects.create(
            trip_date="2026-05-25",
            status="CONFIRMADA",
            route=self.route,
            driver=self.driver_profile,
        )

        self.client = APIClient()
        self.authenticate_driver()

    def authenticate_driver(self):
        """Authenticate the driver user for API requests"""
        refresh = RefreshToken.for_user(self.driver_user)
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {refresh.access_token}")

    def test_assign_bus_success(self):
        """Test successful bus assignment to a trip"""
        url = f"/api/trips/{self.trip.id}/assign_bus/"
        data = {"bus": self.bus.id}

        response = self.client.post(url, data, format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["status"], "Onibus associado com sucesso.")

        self.trip.refresh_from_db()
        self.assertEqual(self.trip.bus, self.bus)

    def test_assign_bus_without_bus_id(self):
        """Test assignment failure when bus field is not provided"""
        url = f"/api/trips/{self.trip.id}/assign_bus/"
        data = {}

        response = self.client.post(url, data, format="json")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data["error"], "O campo 'bus' é obrigatório.")

    def test_assign_bus_with_invalid_bus_id(self):
        """Test assignment failure with invalid bus ID"""
        url = f"/api/trips/{self.trip.id}/assign_bus/"
        data = {"bus": 99999}

        with self.assertRaises(Bus.DoesNotExist):
            self.client.post(url, data, format="json")

    def test_assign_bus_not_trip_driver(self):
        """Test assignment failure when user is not the trip driver"""
        other_user = User.objects.create_user(
            full_name="driver6", email="driver6@test.com", password="testpass123"
        )

        DriverProfile.objects.create(user=other_user, cnh="12345621201")

        other_refresh = RefreshToken.for_user(other_user)
        self.client.credentials(
            HTTP_AUTHORIZATION=f"Bearer {other_refresh.access_token}"
        )

        url = f"/api/trips/{self.trip.id}/assign_bus/"
        data = {"bus": self.bus.id}

        response = self.client.post(url, data, format="json")

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(response.data["error"], "Você não é o motorista desta viagem.")

    def test_assign_bus_without_authentication(self):
        """Test assignment rejection when user is not authenticated"""
        self.client.credentials()
        url = f"/api/trips/{self.trip.id}/assign_bus/"
        data = {"bus": self.bus.id}

        response = self.client.post(url, data, format="json")

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_assign_bus_replaces_previous_bus(self):
        """Test that assignment replaces a previously assigned bus"""
        bus2 = Bus.objects.create(
            number_plate="XYZ5678",
            seating_capacity=45,
            brand="Scania K420",
            administrator=self.admin_profile,
        )

        self.trip.bus = self.bus
        self.trip.save()

        url = f"/api/trips/{self.trip.id}/assign_bus/"
        data = {"bus": bus2.id}

        response = self.client.post(url, data, format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        self.trip.refresh_from_db()
        self.assertEqual(self.trip.bus, bus2)

    def test_assign_bus_with_invalid_trip_id(self):
        """Test assignment failure with invalid trip ID"""
        url = "/api/trips/99999/assign_bus/"
        data = {"bus": self.bus.id}

        with self.assertRaises(Trip.DoesNotExist):
            self.client.post(url, data, format="json")


class TripUnassignBusTestCase(TestCase):
    """Test cases for the unassign_bus action"""

    def setUp(self):
        """Initialize test data and API client"""
        self.admin_user = User.objects.create_user(
            full_name="admin4", email="admin4@test.com", password="testpass123"
        )

        self.admin_profile = AdministratorProfile.objects.create(user=self.admin_user)

        self.driver_user = User.objects.create_user(
            full_name="driver7", email="driver7@test.com", password="testpass123"
        )

        self.driver_profile = DriverProfile.objects.create(
            user=self.driver_user, cnh="12345678405"
        )

        self.bus = Bus.objects.create(
            number_plate="DEF9999",
            seating_capacity=55,
            brand="Mercedes-Benz O500",
            administrator=self.admin_profile,
        )

        self.route = Route.objects.create(
            origin="Brasília",
            destiny="Goiânia",
            departure_time="08:00:00",
            arrival_time="10:30:00",
            administrator=self.admin_profile,
        )

        self.trip = Trip.objects.create(
            trip_date="2026-05-26",
            status="CONFIRMADA",
            route=self.route,
            driver=self.driver_profile,
            bus=self.bus,
        )

        self.client = APIClient()
        self.authenticate_driver()

    def authenticate_driver(self):
        """Authenticate the driver user for API requests"""
        refresh = RefreshToken.for_user(self.driver_user)
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {refresh.access_token}")

    def test_unassign_bus_success(self):
        """Test successful bus unassignment from a trip"""
        self.assertIsNotNone(self.trip.bus)

        url = f"/api/trips/{self.trip.id}/unassign_bus/"

        response = self.client.post(url, format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["status"], "Onibus desassociado com sucesso.")

        self.trip.refresh_from_db()
        self.assertIsNone(self.trip.bus)

    def test_unassign_bus_not_trip_driver(self):
        """Test unassignment failure when user is not the trip driver"""
        other_user = User.objects.create_user(
            full_name="driver8", email="driver8@test.com", password="testpass123"
        )

        DriverProfile.objects.create(user=other_user, cnh="12335678501")

        other_refresh = RefreshToken.for_user(other_user)
        self.client.credentials(
            HTTP_AUTHORIZATION=f"Bearer {other_refresh.access_token}"
        )

        url = f"/api/trips/{self.trip.id}/unassign_bus/"

        response = self.client.post(url, format="json")

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(response.data["error"], "Você não é o motorista desta viagem.")

    def test_unassign_bus_no_driver_assigned(self):
        """Test unassignment failure when trip has no driver"""
        self.trip.driver = None
        self.trip.save()

        url = f"/api/trips/{self.trip.id}/unassign_bus/"

        response = self.client.post(url, format="json")

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_unassign_bus_without_authentication(self):
        """Test unassignment rejection when user is not authenticated"""
        self.client.credentials()
        url = f"/api/trips/{self.trip.id}/unassign_bus/"

        response = self.client.post(url, format="json")

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_unassign_bus_with_invalid_trip_id(self):
        """Test unassignment failure with invalid trip ID"""
        url = "/api/trips/99999/unassign_bus/"

        with self.assertRaises(Trip.DoesNotExist):
            self.client.post(url, format="json")

    def test_unassign_bus_preserves_trip_data(self):
        """Test that unassignment preserves other trip information"""
        original_status = self.trip.status
        original_route = self.trip.route
        original_driver = self.trip.driver

        url = f"/api/trips/{self.trip.id}/unassign_bus/"

        response = self.client.post(url, format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        self.trip.refresh_from_db()
        self.assertEqual(self.trip.status, original_status)
        self.assertEqual(self.trip.route, original_route)
        self.assertEqual(self.trip.driver, original_driver)
        self.assertIsNone(self.trip.bus)


class TripDriverBusIntegrationTestCase(TestCase):
    """Integration test cases for driver and bus assignment workflow"""

    def setUp(self):
        """Initialize test data"""
        self.admin_user = User.objects.create_user(
            full_name="admin5", email="admin5@test.com", password="testpass123"
        )

        self.admin_profile = AdministratorProfile.objects.create(user=self.admin_user)

        self.driver_user = User.objects.create_user(
            full_name="driver9", email="driver9@test.com", password="testpass123"
        )

        self.driver_profile = DriverProfile.objects.create(
            user=self.driver_user, cnh="14345678901"
        )

        self.bus = Bus.objects.create(
            number_plate="GHI4567",
            seating_capacity=40,
            brand="Isuzu LT",
            administrator=self.admin_profile,
        )

        self.route = Route.objects.create(
            origin="Curitiba",
            destiny="São Paulo",
            departure_time="12:00:00",
            arrival_time="15:00:00",
            administrator=self.admin_profile,
        )

        self.trip = Trip.objects.create(
            trip_date="2026-05-27", status="CONFIRMADA", route=self.route
        )

        self.client = APIClient()

    def authenticate_driver(self):
        """Authenticate the driver user"""
        refresh = RefreshToken.for_user(self.driver_user)
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {refresh.access_token}")

    def test_full_workflow_assign_then_unassign(self):
        """Test complete workflow: assign driver,
        assign bus, unassign bus, unassign driver"""
        self.authenticate_driver()

        self.assertIsNone(self.trip.driver)
        self.assertIsNone(self.trip.bus)

        url_assign_driver = f"/api/trips/{self.trip.id}/assign_driver/"
        response = self.client.post(url_assign_driver, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        self.trip.refresh_from_db()
        self.assertEqual(self.trip.driver, self.driver_profile)

        url_assign_bus = f"/api/trips/{self.trip.id}/assign_bus/"
        response = self.client.post(
            url_assign_bus, data={"bus": self.bus.id}, format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        self.trip.refresh_from_db()
        self.assertEqual(self.trip.bus, self.bus)

        url_unassign_bus = f"/api/trips/{self.trip.id}/unassign_bus/"
        response = self.client.post(url_unassign_bus, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        self.trip.refresh_from_db()
        self.assertIsNone(self.trip.bus)
        self.assertEqual(self.trip.driver, self.driver_profile)

        url_unassign_driver = f"/api/trips/{self.trip.id}/unassign_driver/"
        response = self.client.post(url_unassign_driver, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        self.trip.refresh_from_db()
        self.assertIsNone(self.trip.driver)
        self.assertIsNone(self.trip.bus)

    def test_trip_records_driver_and_bus(self):
        """Test that trip properly stores driver and bus references"""
        self.trip.driver = self.driver_profile
        self.trip.bus = self.bus
        self.trip.save()

        self.assertEqual(self.trip.driver, self.driver_profile)
        self.assertEqual(self.trip.bus, self.bus)

    def test_multiple_trips_same_driver_different_buses(self):
        """Test that same driver can have multiple trips with different buses"""
        bus2 = Bus.objects.create(
            number_plate="JKL8901",
            seating_capacity=50,
            brand="Mercedes-Benz",
            administrator=self.admin_profile,
        )

        trip1 = Trip.objects.create(
            trip_date="2026-05-27",
            status="CONFIRMADA",
            route=self.route,
            driver=self.driver_profile,
            bus=self.bus,
        )

        trip2 = Trip.objects.create(
            trip_date="2026-05-28",
            status="CONFIRMADA",
            route=self.route,
            driver=self.driver_profile,
            bus=bus2,
        )

        driver_trips = Trip.objects.filter(driver=self.driver_profile)
        self.assertEqual(driver_trips.count(), 2)
        self.assertIn(trip1, driver_trips)
        self.assertIn(trip2, driver_trips)

    def test_trip_serves_as_audit_trail(self):
        """Test that trips provide audit trail of bus and driver usage"""
        trip = Trip.objects.create(
            trip_date="2026-05-28",
            status="CONFIRMADA",
            route=self.route,
            driver=self.driver_profile,
            bus=self.bus,
        )

        bus_trips = Trip.objects.filter(bus=self.bus)
        self.assertTrue(bus_trips.exists())
        self.assertIn(trip, bus_trips)

        driver_trips = Trip.objects.filter(driver=self.driver_profile)
        self.assertTrue(driver_trips.exists())
        self.assertIn(trip, driver_trips)
