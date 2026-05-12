from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from ..users.models.profiles import AdministratorProfile, CustomUser, DriverProfile
from .models import Bus, Route

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
        self.user = User.objects.create_user(
            email="user@teste.com",
            password="123",
            is_active=True,
        )

        self.admin = CustomUser.objects.create_superuser(
            email="admin@teste.com", password="12345678", is_active=True
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
