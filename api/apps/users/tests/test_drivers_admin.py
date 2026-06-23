from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient, APITestCase

from apps.users.models import CustomUser
from apps.users.models.profiles import AdministratorProfile, DriverProfile

User = CustomUser


class TestDriverAdmin(APITestCase):
    """Admin CRUD operations on driver accounts."""

    def setUp(self):
        self.client = APIClient()

        # Admin user (superadmin with is_staff=True)
        self.admin = User.objects.create_superuser(
            email="admin@teste.com",
            full_name="Admin",
            password="12345678",
            role="admin",
        )

        # Regular user (no admin profile, not staff)
        self.regular_user = User.objects.create_user(
            email="regular@user.com",
            full_name="Regular User",
            password="12345678",
        )

        self.create_payload = {
            "email": "motorista@teste.com",
            "full_name": "Motorista Teste",
            "password": "12345678",
            "cnh": "12345678900",
        }

    # ── List ──────────────────────────────────────────────

    def test_admin_can_list_drivers(self):
        DriverProfile.objects.create(
            user=User.objects.create_user(
                email="driver1@teste.com", full_name="Driver One", password="12345678"
            ),
            cnh="11111111100",
        )
        self.client.force_authenticate(user=self.admin)
        response = self.client.get(reverse("drivers-list"))

        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) >= 1

    def test_list_drivers_fails_without_authentication(self):
        response = self.client.get(reverse("drivers-list"))
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    # ── Create ────────────────────────────────────────────

    def test_admin_can_create_driver(self):
        self.client.force_authenticate(user=self.admin)
        response = self.client.post(
            reverse("drivers-list"), self.create_payload, format="json"
        )

        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["email"] == self.create_payload["email"]
        assert response.data["cnh"] == self.create_payload["cnh"]
        assert User.objects.filter(email=self.create_payload["email"]).exists()
        assert DriverProfile.objects.filter(cnh=self.create_payload["cnh"]).exists()

    def test_create_driver_fails_without_authentication(self):
        response = self.client.post(
            reverse("drivers-list"), self.create_payload, format="json"
        )
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_regular_user_cannot_create_driver(self):
        self.client.force_authenticate(user=self.regular_user)
        response = self.client.post(
            reverse("drivers-list"), self.create_payload, format="json"
        )
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_create_driver_fails_with_invalid_cnh(self):
        self.client.force_authenticate(user=self.admin)
        payload = dict(self.create_payload)
        payload["cnh"] = "123"  # not 11 digits

        response = self.client.post(
            reverse("drivers-list"), payload, format="json"
        )

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "cnh" in response.data

    def test_create_driver_fails_with_duplicate_email(self):
        self.client.force_authenticate(user=self.admin)
        # Create first driver
        self.client.post(
            reverse("drivers-list"), self.create_payload, format="json"
        )
        # Try to create another with same email
        payload = dict(self.create_payload)
        payload["cnh"] = "22222222200"

        response = self.client.post(
            reverse("drivers-list"), payload, format="json"
        )

        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_create_driver_fails_with_duplicate_cnh(self):
        self.client.force_authenticate(user=self.admin)
        # Create first driver
        self.client.post(
            reverse("drivers-list"), self.create_payload, format="json"
        )
        # Try to create another with same CNH
        payload = dict(self.create_payload)
        payload["email"] = "outro@teste.com"

        response = self.client.post(
            reverse("drivers-list"), payload, format="json"
        )

        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_create_driver_fails_without_password(self):
        self.client.force_authenticate(user=self.admin)
        payload = dict(self.create_payload)
        del payload["password"]

        response = self.client.post(
            reverse("drivers-list"), payload, format="json"
        )

        assert response.status_code == status.HTTP_400_BAD_REQUEST

    # ── Update (PATCH) ───────────────────────────────────

    def test_admin_can_update_driver(self):
        self.client.force_authenticate(user=self.admin)
        # Create first
        create_resp = self.client.post(
            reverse("drivers-list"), self.create_payload, format="json"
        )
        driver_id = create_resp.data["id"]

        # Update
        response = self.client.patch(
            reverse("drivers-detail", args=[driver_id]),
            {"full_name": "Updated Name"},
            format="json",
        )

        assert response.status_code == status.HTTP_200_OK
        driver = DriverProfile.objects.get(id=driver_id)
        assert driver.user.full_name == "Updated Name"

    def test_update_driver_fails_without_authentication(self):
        # Create driver first
        driver = DriverProfile.objects.create(
            user=User.objects.create_user(
                email="driver@teste.com", full_name="Driver", password="12345678"
            ),
            cnh="33333333300",
        )
        url = reverse("drivers-detail", args=[driver.id])
        response = self.client.patch(
            url, {"full_name": "Hacker"}, format="json"
        )
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    # ── Delete ────────────────────────────────────────────

    def test_admin_can_delete_driver(self):
        self.client.force_authenticate(user=self.admin)
        create_resp = self.client.post(
            reverse("drivers-list"), self.create_payload, format="json"
        )
        driver_id = create_resp.data["id"]

        response = self.client.delete(
            reverse("drivers-detail", args=[driver_id])
        )

        assert response.status_code == status.HTTP_204_NO_CONTENT
        assert not DriverProfile.objects.filter(id=driver_id).exists()

    def test_delete_driver_fails_without_authentication(self):
        driver = DriverProfile.objects.create(
            user=User.objects.create_user(
                email="driver2@teste.com", full_name="Driver", password="12345678"
            ),
            cnh="44444444400",
        )
        response = self.client.delete(
            reverse("drivers-detail", args=[driver.id])
        )
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    # ── Admin detail ──────────────────────────────────────

    def test_admin_can_view_driver_detail(self):
        self.client.force_authenticate(user=self.admin)
        create_resp = self.client.post(
            reverse("drivers-list"), self.create_payload, format="json"
        )
        driver_id = create_resp.data["id"]

        response = self.client.get(
            reverse("drivers-admin-detail", args=[driver_id])
        )

        assert response.status_code == status.HTTP_200_OK
        assert response.data["email"] == self.create_payload["email"]
        assert response.data["cnh"] == self.create_payload["cnh"]
        # Must include trip-related fields
        assert "trip_count" in response.data
        assert "recent_trips" in response.data
        assert isinstance(response.data["trip_count"], int)
        assert isinstance(response.data["recent_trips"], list)

    def test_driver_detail_fails_without_authentication(self):
        driver = DriverProfile.objects.create(
            user=User.objects.create_user(
                email="driver3@teste.com", full_name="Driver", password="12345678"
            ),
            cnh="55555555500",
        )
        response = self.client.get(
            reverse("drivers-admin-detail", args=[driver.id])
        )
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
