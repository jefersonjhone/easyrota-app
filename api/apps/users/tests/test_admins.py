from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient, APITestCase

from apps.users.models import CustomUser
from apps.users.models.profiles import AdministratorProfile

User = CustomUser


class TestAdminCrud(APITestCase):
    """Superadmin CRUD operations on admin accounts."""

    def setUp(self):
        self.client = APIClient()

        # Superadmin user
        self.superadmin = User.objects.create_superuser(
            email="super@admin.com",
            full_name="Super Admin",
            password="12345678",
            role="Superadmin",
            level=AdministratorProfile.Level.SUPERADMIN,
        )

        # Subadmin user (created manually to set created_by)
        self.subadmin_user = User.objects.create_user(
            email="sub@admin.com",
            full_name="Sub Admin",
            password="12345678",
            is_staff=True,
        )
        self.subadmin_profile = AdministratorProfile.objects.create(
            user=self.subadmin_user,
            role="Coordenador",
            level=AdministratorProfile.Level.SUBADMIN,
            created_by=self.superadmin.admin_profile,
        )

        # Regular user (no admin profile)
        self.regular_user = User.objects.create_user(
            email="regular@user.com",
            full_name="Regular User",
            password="12345678",
        )

        self.create_payload = {
            "email": "newadmin@teste.com",
            "full_name": "Novo Admin",
            "password": "12345678",
            "role": "Supervisor",
        }

    # ── List ──────────────────────────────────────────────

    def test_superadmin_can_list_admins(self):
        self.client.force_authenticate(user=self.superadmin)
        response = self.client.get(reverse("admin-list"))

        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) >= 2
        emails = [item["email"] for item in response.data]
        assert "super@admin.com" in emails
        assert "sub@admin.com" in emails

    def test_subadmin_cannot_list_admins(self):
        self.client.force_authenticate(user=self.subadmin_user)
        response = self.client.get(reverse("admin-list"))

        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_list_admins_fails_without_authentication(self):
        response = self.client.get(reverse("admin-list"))
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    # ── Create ────────────────────────────────────────────

    def test_superadmin_can_create_subadmin(self):
        self.client.force_authenticate(user=self.superadmin)
        response = self.client.post(
            reverse("admin-list"), self.create_payload, format="json"
        )

        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["user"]["email"] == self.create_payload["email"]
        created_user = User.objects.get(email=self.create_payload["email"])
        assert created_user.is_staff is True
        assert created_user.admin_profile.level == AdministratorProfile.Level.SUBADMIN
        assert created_user.admin_profile.created_by == self.superadmin.admin_profile

    def test_create_admin_fails_without_authentication(self):
        response = self.client.post(
            reverse("admin-list"), self.create_payload, format="json"
        )
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_create_admin_fails_for_regular_user(self):
        self.client.force_authenticate(user=self.regular_user)
        response = self.client.post(
            reverse("admin-list"), self.create_payload, format="json"
        )
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_subadmin_cannot_create_admin(self):
        self.client.force_authenticate(user=self.subadmin_user)
        response = self.client.post(
            reverse("admin-list"), self.create_payload, format="json"
        )
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_cannot_create_superadmin_via_endpoint(self):
        self.client.force_authenticate(user=self.superadmin)
        payload = dict(self.create_payload)
        payload["level"] = "superadmin"

        response = self.client.post(reverse("admin-list"), payload, format="json")

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "level" in response.data

    def test_cannot_create_admin_with_duplicate_email(self):
        self.client.force_authenticate(user=self.superadmin)
        payload = dict(self.create_payload)
        payload["email"] = "sub@admin.com"

        response = self.client.post(reverse("admin-list"), payload, format="json")

        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_cannot_create_admin_without_password(self):
        self.client.force_authenticate(user=self.superadmin)
        payload = dict(self.create_payload)
        del payload["password"]

        response = self.client.post(reverse("admin-list"), payload, format="json")

        assert response.status_code == status.HTTP_400_BAD_REQUEST

    # ── Update (PATCH) ────────────────────────────────────

    def test_superadmin_can_update_subadmin(self):
        self.client.force_authenticate(user=self.superadmin)
        url = reverse("admin-detail", args=[self.subadmin_user.id])

        response = self.client.patch(
            url, {"full_name": "Updated Name"}, format="json"
        )

        assert response.status_code == status.HTTP_200_OK
        self.subadmin_user.refresh_from_db()
        assert self.subadmin_user.full_name == "Updated Name"

    def test_update_admin_fails_without_authentication(self):
        url = reverse("admin-detail", args=[self.subadmin_user.id])
        response = self.client.patch(
            url, {"full_name": "Hacker"}, format="json"
        )
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_update_admin_fails_for_regular_user(self):
        self.client.force_authenticate(user=self.regular_user)
        url = reverse("admin-detail", args=[self.subadmin_user.id])
        response = self.client.patch(
            url, {"full_name": "Hacker"}, format="json"
        )
        assert response.status_code == status.HTTP_403_FORBIDDEN

    # ── Delete (soft-delete) ──────────────────────────────

    def test_superadmin_can_soft_delete_subadmin(self):
        self.client.force_authenticate(user=self.superadmin)
        url = reverse("admin-detail", args=[self.subadmin_user.id])

        response = self.client.delete(url)

        assert response.status_code == status.HTTP_204_NO_CONTENT
        self.subadmin_user.refresh_from_db()
        assert self.subadmin_user.is_staff is False
        assert not AdministratorProfile.objects.filter(
            user=self.subadmin_user
        ).exists()

    def test_delete_admin_fails_without_authentication(self):
        url = reverse("admin-detail", args=[self.subadmin_user.id])
        response = self.client.delete(url)
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_delete_admin_fails_for_regular_user(self):
        self.client.force_authenticate(user=self.regular_user)
        url = reverse("admin-detail", args=[self.subadmin_user.id])
        response = self.client.delete(url)
        assert response.status_code == status.HTTP_403_FORBIDDEN

    # ── Search ────────────────────────────────────────────

    def test_search_admins_by_name(self):
        self.client.force_authenticate(user=self.superadmin)
        response = self.client.get(reverse("admin-list"), {"q": "Super Admin"})

        assert response.status_code == status.HTTP_200_OK
        emails = [item["email"] for item in response.data]
        assert "super@admin.com" in emails

    def test_search_admins_by_email(self):
        self.client.force_authenticate(user=self.superadmin)
        response = self.client.get(reverse("admin-list"), {"q": "sub@admin.com"})

        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 1
        assert response.data[0]["email"] == "sub@admin.com"

    def test_search_admins_no_match(self):
        self.client.force_authenticate(user=self.superadmin)
        response = self.client.get(reverse("admin-list"), {"q": "nonexistent"})

        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 0
