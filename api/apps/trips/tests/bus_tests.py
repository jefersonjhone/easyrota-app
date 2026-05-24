from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from apps.users.models import CustomUser
from apps.users.models.profiles import (
    AdministratorProfile,
    DriverProfile,
)
from apps.trips.models import Bus

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

    