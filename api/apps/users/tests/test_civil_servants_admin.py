from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient, APITestCase

from apps.users.models import CustomUser
from apps.users.models.profiles import CivilServantProfile

User = CustomUser


class TestCivilServantAdmin(APITestCase):
    """Admin CRUD operations on civil servant accounts."""

    def setUp(self):
        self.client = APIClient()

        # Admin user (is_staff=True with admin profile)
        self.admin = User.objects.create_superuser(
            email="admin@teste.com",
            full_name="Admin",
            password="12345678",
            role="admin",
        )

        # Regular user (no admin profile)
        self.regular_user = User.objects.create_user(
            email="regular@user.com",
            full_name="Regular User",
            password="12345678",
        )

        self.create_payload = {
            "email": "servidor@teste.com",
            "full_name": "Servidor Teste",
            "password": "12345678",
            "civil_servant_id": "987654321",
        }

    # ── List ──────────────────────────────────────────────

    def test_admin_can_list_civil_servants(self):
        self.client.force_authenticate(user=self.admin)
        self.client.post(
            reverse("civil-servants-list"), self.create_payload, format="json"
        )

        response = self.client.get(reverse("civil-servants-list"))

        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) >= 1

    def test_list_civil_servants_fails_without_authentication(self):
        response = self.client.get(reverse("civil-servants-list"))
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    # ── Search ────────────────────────────────────────────

    def test_search_civil_servants_by_name(self):
        self.client.force_authenticate(user=self.admin)
        self.client.post(
            reverse("civil-servants-list"), self.create_payload, format="json"
        )

        response = self.client.get(
            reverse("civil-servants-list"), {"q": "Servidor Teste"}
        )

        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 1
        assert response.data[0]["civil_servant_id"] == "987654321"

    def test_search_civil_servants_by_email(self):
        self.client.force_authenticate(user=self.admin)
        self.client.post(
            reverse("civil-servants-list"), self.create_payload, format="json"
        )

        response = self.client.get(
            reverse("civil-servants-list"), {"q": "servidor@teste.com"}
        )

        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 1

    def test_search_civil_servants_by_civil_servant_id(self):
        self.client.force_authenticate(user=self.admin)
        self.client.post(
            reverse("civil-servants-list"), self.create_payload, format="json"
        )

        response = self.client.get(
            reverse("civil-servants-list"), {"q": "987654321"}
        )

        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 1

    def test_search_civil_servants_no_match(self):
        self.client.force_authenticate(user=self.admin)
        response = self.client.get(
            reverse("civil-servants-list"), {"q": "inexistente"}
        )

        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 0

    # ── Create ────────────────────────────────────────────

    def test_admin_can_create_civil_servant(self):
        self.client.force_authenticate(user=self.admin)
        response = self.client.post(
            reverse("civil-servants-list"), self.create_payload, format="json"
        )

        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["email"] == self.create_payload["email"]
        assert (
            response.data["civil_servant_id"]
            == self.create_payload["civil_servant_id"]
        )
        assert User.objects.filter(email=self.create_payload["email"]).exists()
        assert CivilServantProfile.objects.filter(
            civil_servant_id=self.create_payload["civil_servant_id"]
        ).exists()

    def test_create_civil_servant_fails_without_authentication(self):
        response = self.client.post(
            reverse("civil-servants-list"), self.create_payload, format="json"
        )
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_regular_user_cannot_create_civil_servant(self):
        self.client.force_authenticate(user=self.regular_user)
        response = self.client.post(
            reverse("civil-servants-list"), self.create_payload, format="json"
        )
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_create_civil_servant_fails_with_duplicate_email(self):
        self.client.force_authenticate(user=self.admin)
        # Create first
        self.client.post(
            reverse("civil-servants-list"), self.create_payload, format="json"
        )
        # Try duplicate
        payload = dict(self.create_payload)
        payload["civil_servant_id"] = "111111111"

        response = self.client.post(
            reverse("civil-servants-list"), payload, format="json"
        )

        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_create_civil_servant_fails_without_password(self):
        self.client.force_authenticate(user=self.admin)
        payload = dict(self.create_payload)
        del payload["password"]

        response = self.client.post(
            reverse("civil-servants-list"), payload, format="json"
        )

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "password" in response.data

    # ── Update (PATCH) ───────────────────────────────────

    def test_admin_can_update_civil_servant(self):
        self.client.force_authenticate(user=self.admin)
        create_resp = self.client.post(
            reverse("civil-servants-list"), self.create_payload, format="json"
        )
        profile_id = create_resp.data["id"]

        response = self.client.patch(
            reverse("civil-servants-detail", args=[profile_id]),
            {"full_name": "Updated Servant"},
            format="json",
        )

        assert response.status_code == status.HTTP_200_OK
        profile = CivilServantProfile.objects.get(id=profile_id)
        assert profile.user.full_name == "Updated Servant"

    def test_update_civil_servant_fails_without_authentication(self):
        profile = CivilServantProfile.objects.create(
            user=User.objects.create_user(
                email="servant@teste.com",
                full_name="Servant",
                password="12345678",
            ),
            civil_servant_id="666666666",
        )
        response = self.client.patch(
            reverse("civil-servants-detail", args=[profile.id]),
            {"full_name": "Hacker"},
            format="json",
        )
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    # ── Delete ────────────────────────────────────────────

    def test_admin_can_delete_civil_servant(self):
        self.client.force_authenticate(user=self.admin)
        create_resp = self.client.post(
            reverse("civil-servants-list"), self.create_payload, format="json"
        )
        profile_id = create_resp.data["id"]

        response = self.client.delete(
            reverse("civil-servants-detail", args=[profile_id])
        )

        assert response.status_code == status.HTTP_204_NO_CONTENT
        assert not CivilServantProfile.objects.filter(id=profile_id).exists()

    def test_delete_civil_servant_fails_without_authentication(self):
        profile = CivilServantProfile.objects.create(
            user=User.objects.create_user(
                email="servant2@teste.com",
                full_name="Servant",
                password="12345678",
            ),
            civil_servant_id="555555555",
        )
        response = self.client.delete(
            reverse("civil-servants-detail", args=[profile.id])
        )
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    # ── User detail ───────────────────────────────────────

    def test_admin_can_view_civil_servant_detail(self):
        self.client.force_authenticate(user=self.admin)
        create_resp = self.client.post(
            reverse("civil-servants-list"), self.create_payload, format="json"
        )
        profile_id = create_resp.data["id"]

        response = self.client.get(
            reverse("civil-servants-user-detail", args=[profile_id])
        )

        assert response.status_code == status.HTTP_200_OK
        assert "user" in response.data
        assert response.data["user"]["email"] == self.create_payload["email"]
        assert (
            response.data["profile"]["civil_servant_id"]
            == self.create_payload["civil_servant_id"]
        )
        assert "stats" in response.data
        assert "trips" in response.data

    def test_civil_servant_detail_fails_without_authentication(self):
        profile = CivilServantProfile.objects.create(
            user=User.objects.create_user(
                email="servant3@teste.com",
                full_name="Servant",
                password="12345678",
            ),
            civil_servant_id="444444444",
        )
        response = self.client.get(
            reverse("civil-servants-user-detail", args=[profile.id])
        )
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
