from datetime import time, timedelta

from django.contrib.auth import get_user_model
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from ..users.models import AdministratorProfile, CustomUser, DriverProfile
from .models import Bus, Route, Trip

User = get_user_model()


class BusViewTests(APITestCase):
    """Tests all request operations for buses."""

    def setUp(self):
        self.url = reverse("bus-list")

        self.admin = CustomUser.objects.create_superuser(
            email="admin@teste.com", password="12345678"
        )
        self.admin_profile = AdministratorProfile.objects.create(
            user=self.admin, role="Administrator"
        )

        self.user_driver = CustomUser.objects.create_user(
            email="driver@teste.com", password="123"
        )
        self.driver_profile = DriverProfile.objects.create(
            user=self.user_driver, cnh="12345678901"
        )

        self.regular_user = CustomUser.objects.create_user(
            email="user@teste.com", password="12345678"
        )

        self.payload = {
            "number_plate": "ABC123",
            "seating_capacity": 40,
            "brand": "Mercedes-Benz",
        }

    def test_list_buses_authenticated(self):
        """Authenticated users should NOT be able to list buses."""
        self.client.force_authenticate(user=self.regular_user)
        response = self.client.get(self.url, format="json")

        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_list_buses_unauthenticated(self):
        """Unauthenticated users should NOT be able to list buses."""
        response = self.client.get(self.url, format="json")

        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_list_buses_as_driver(self):
        """Drivers should be able to list buses."""
        self.client.force_authenticate(user=self.user_driver)
        response = self.client.get(self.url, format="json")

        assert response.status_code == status.HTTP_200_OK

    def test_create_bus_as_user(self):
        """Regular users should NOT be able to create a bus."""
        self.client.force_authenticate(user=self.regular_user)
        response = self.client.post(self.url, self.payload, format="json")

        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_create_bus_as_driver(self):
        """Drivers should NOT be able to create a bus."""
        self.client.force_authenticate(user=self.user_driver)
        response = self.client.post(self.url, self.payload, format="json")

        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_create_bus_as_admin(self):
        """Administrators should be able to create a bus successfully."""
        self.client.force_authenticate(user=self.admin)
        response = self.client.post(self.url, self.payload, format="json")

        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["number_plate"] == "ABC123"
        assert response.data["administrator"] == self.admin.id

    def test_driver_assigns_himself_to_bus(self):
        """Ensures that an authenticated driver can successfully assign themselves
        to a bus using the custom assign_driver endpoint.
        """
        bus = Bus.objects.create(**self.payload, administrator=self.admin_profile)

        self.client.force_authenticate(user=self.user_driver)

        url = reverse("bus-assign-driver", args=[bus.id])
        response = self.client.post(url)

        assert response.status_code == status.HTTP_200_OK

        bus.refresh_from_db()
        assert bus.driver == self.driver_profile


class RouteAPITests(APITestCase):
    def setUp(self):
        self.user = CustomUser.objects.create_user(
            email="user@teste.com", password="123"
        )

        self.admin = CustomUser.objects.create_superuser(
            email="admin@teste.com", password="123"
        )
        self.admin_profile = AdministratorProfile.objects.create(
            user=self.admin, role="Administrator"
        )
        self.url = reverse("route-list-create")

    def test_create_route_successfully(self):
        payload = {
            "origin": "Feira de Santana",
            "destiny": "Salvador",
            "departure_time": "08:00:00",
            "arrival_time": "10:00:00",
        }

        self.client.force_authenticate(user=self.admin)
        response = self.client.post(self.url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["origin"], "Feira de Santana")

    def test_successful_trip_early_night(self):
        payload = {
            "origin": "Feira de Santana",
            "destiny": "Salvador",
            "departure_time": "23:00:00",
            "arrival_time": "00:30:00",
        }
        self.client.force_authenticate(user=self.admin)
        response = self.client.post(self.url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_fail_route_same_city_accents(self):
        payload = {
            "origin": "Feira de Santana",
            "destiny": "féírá dé santanâ",
            "departure_time": "08:00:00",
            "arrival_time": "10:00:00",
        }

        self.client.force_authenticate(user=self.admin)
        response = self.client.post(self.url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn(
            "A origem e o destino não podem ser a mesma cidade.", str(response.data)
        )

    def test_fail_route_too_short(self):
        payload = {
            "origin": "Feira de Santana",
            "destiny": "Salvador",
            "departure_time": "08:00:00",
            "arrival_time": "08:15:00",
        }

        self.client.force_authenticate(user=self.admin)
        response = self.client.post(self.url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn(
            "Uma viagem intermunicipal precisa durar no mínimo 30 minutos.",
            str(response.data),
        )

    def test_failed_trip_too_long(self):
        payload = {
            "origin": "Feira de Santana",
            "destiny": "Salvador",
            "departure_time": "10:00:00",
            "arrival_time": "09:00:00",
        }

        self.client.force_authenticate(user=self.admin)
        response = self.client.post(self.url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("A viagem excede o tempo limite de 12 horas.", str(response.data))

    def test_regular_user_cannot_update_route(self):
        """Regular users should not update routes."""

        route = Route.objects.create(
            origin="Feira de Santana",
            destiny="Salvador",
            departure_time="08:00:00",
            arrival_time="10:00:00",
            administrator=self.admin_profile,
        )

        self.client.force_authenticate(user=self.user)

        url = reverse("route-detail", args=[route.id])

        payload = {
            "origin": "Feira de Santana",
            "destiny": "Cachoeira",
            "departure_time": "08:00:00",
            "arrival_time": "10:30:00",
        }

        response = self.client.put(url, payload, format="json")
        assert response.status_code == status.HTTP_403_FORBIDDEN


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
        )
        self.admin_profile = AdministratorProfile.objects.create(user=self.admin_user)

        self.driver_user = CustomUser.objects.create_user(
            email="motorista@easyrota.com",
            password="password123",
            full_name="João Motorista",
        )
        self.driver_profile = DriverProfile.objects.create(
            user=self.driver_user, cnh="12345678901"
        )

        self.bus = Bus.objects.create(
            number_plate="ABC-1234",
            seating_capacity=40,
            driver=self.driver_profile,
            administrator=self.admin_profile,
        )

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
        self.assertIn(
            "A data da viagem não pode estar no passado.", response.data["trip_date"]
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
        """Check if the view prepared for the front-end returns the
        data with the correct structure."""

        self.client.force_authenticate(user=self.driver_user)

        trip = Trip.objects.create(
            trip_date=self.today, bus=self.bus, route=self.route_morning
        )

        url = reverse("trip-current-screen", kwargs={"pk": trip.id})
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

    def test_next_trip_automatic_endpoint(self):
        """Ensures the automatic endpoint returns the next valid trip for the user."""
        self.client.force_authenticate(user=self.driver_user)

        Trip.objects.create(
            trip_date=self.today,
            bus=self.bus,
            route=self.route_morning,
            status="CANCELADA",
        )

        valid_trip = Trip.objects.create(
            trip_date=self.tomorrow,
            bus=self.bus,
            route=self.route_midnight,
            status="CONFIRMADA",
        )

        url = reverse("trip-current")
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["id"], valid_trip.id)
        self.assertEqual(response.data["destiny"], "Recife")
