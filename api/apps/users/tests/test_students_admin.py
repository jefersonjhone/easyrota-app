from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient, APITestCase

from apps.users.models import CustomUser
from apps.users.models.profiles import StudentProfile

User = CustomUser


class TestStudentAdmin(APITestCase):
    """Admin CRUD operations on student accounts."""

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
            "email": "aluno@teste.com",
            "full_name": "Aluno Teste",
            "password": "12345678",
            "student_id": "2024001",
        }

    # ── List ──────────────────────────────────────────────

    def test_admin_can_list_students(self):
        self.client.force_authenticate(user=self.admin)
        # Create a student first
        self.client.post(reverse("students-list"), self.create_payload, format="json")

        response = self.client.get(reverse("students-list"))

        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) >= 1

    def test_list_students_fails_without_authentication(self):
        response = self.client.get(reverse("students-list"))
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_search_students_by_name(self):
        self.client.force_authenticate(user=self.admin)
        self.client.post(reverse("students-list"), self.create_payload, format="json")

        response = self.client.get(reverse("students-list"), {"q": "Aluno Teste"})

        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 1
        assert response.data[0]["student_id"] == "2024001"

    def test_search_students_by_email(self):
        self.client.force_authenticate(user=self.admin)
        self.client.post(reverse("students-list"), self.create_payload, format="json")

        response = self.client.get(reverse("students-list"), {"q": "aluno@teste.com"})

        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 1

    def test_search_students_by_student_id(self):
        self.client.force_authenticate(user=self.admin)
        self.client.post(reverse("students-list"), self.create_payload, format="json")

        response = self.client.get(reverse("students-list"), {"q": "2024001"})

        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 1

    def test_search_students_no_match(self):
        self.client.force_authenticate(user=self.admin)
        response = self.client.get(reverse("students-list"), {"q": "inexistente"})

        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 0

    # ── Create ────────────────────────────────────────────

    def test_admin_can_create_student(self):
        self.client.force_authenticate(user=self.admin)
        response = self.client.post(
            reverse("students-list"), self.create_payload, format="json"
        )

        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["email"] == self.create_payload["email"]
        assert response.data["student_id"] == self.create_payload["student_id"]
        assert User.objects.filter(email=self.create_payload["email"]).exists()
        assert StudentProfile.objects.filter(
            student_id=self.create_payload["student_id"]
        ).exists()

    def test_create_student_fails_without_authentication(self):
        response = self.client.post(
            reverse("students-list"), self.create_payload, format="json"
        )
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_regular_user_cannot_create_student(self):
        self.client.force_authenticate(user=self.regular_user)
        response = self.client.post(
            reverse("students-list"), self.create_payload, format="json"
        )
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_create_student_fails_without_password(self):
        self.client.force_authenticate(user=self.admin)
        payload = dict(self.create_payload)
        del payload["password"]

        response = self.client.post(reverse("students-list"), payload, format="json")

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "password" in response.data

    def test_create_student_fails_with_duplicate_email(self):
        self.client.force_authenticate(user=self.admin)
        # Create first
        self.client.post(reverse("students-list"), self.create_payload, format="json")
        # Try duplicate
        payload = dict(self.create_payload)
        payload["student_id"] = "2024002"

        response = self.client.post(reverse("students-list"), payload, format="json")

        assert response.status_code == status.HTTP_400_BAD_REQUEST

    # ── Update (PATCH) ───────────────────────────────────

    def test_admin_can_update_student(self):
        self.client.force_authenticate(user=self.admin)
        create_resp = self.client.post(
            reverse("students-list"), self.create_payload, format="json"
        )
        student_id = create_resp.data["id"]

        response = self.client.patch(
            reverse("students-detail", args=[student_id]),
            {"full_name": "Updated Student"},
            format="json",
        )

        assert response.status_code == status.HTTP_200_OK
        profile = StudentProfile.objects.get(id=student_id)
        assert profile.user.full_name == "Updated Student"

    def test_update_student_fails_without_authentication(self):
        profile = StudentProfile.objects.create(
            user=User.objects.create_user(
                email="student@teste.com",
                full_name="Student",
                password="12345678",
            ),
            student_id="9999999",
        )
        response = self.client.patch(
            reverse("students-detail", args=[profile.id]),
            {"full_name": "Hacker"},
            format="json",
        )
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    # ── Delete ────────────────────────────────────────────

    def test_admin_can_delete_student(self):
        self.client.force_authenticate(user=self.admin)
        create_resp = self.client.post(
            reverse("students-list"), self.create_payload, format="json"
        )
        student_id = create_resp.data["id"]

        response = self.client.delete(reverse("students-detail", args=[student_id]))

        assert response.status_code == status.HTTP_204_NO_CONTENT
        assert not StudentProfile.objects.filter(id=student_id).exists()

    def test_delete_student_fails_without_authentication(self):
        profile = StudentProfile.objects.create(
            user=User.objects.create_user(
                email="student2@teste.com",
                full_name="Student",
                password="12345678",
            ),
            student_id="8888888",
        )
        response = self.client.delete(reverse("students-detail", args=[profile.id]))
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    # ── User detail ───────────────────────────────────────

    def test_admin_can_view_student_detail(self):
        self.client.force_authenticate(user=self.admin)
        create_resp = self.client.post(
            reverse("students-list"), self.create_payload, format="json"
        )
        student_id = create_resp.data["id"]

        response = self.client.get(reverse("students-user-detail", args=[student_id]))

        assert response.status_code == status.HTTP_200_OK
        # Structure from _build_user_detail_response
        assert "user" in response.data
        assert response.data["user"]["email"] == self.create_payload["email"]
        assert (
            response.data["profile"]["student_id"] == self.create_payload["student_id"]
        )
        assert "stats" in response.data
        assert "trips" in response.data

    def test_student_detail_fails_without_authentication(self):
        profile = StudentProfile.objects.create(
            user=User.objects.create_user(
                email="student3@teste.com",
                full_name="Student",
                password="12345678",
            ),
            student_id="7777777",
        )
        response = self.client.get(reverse("students-user-detail", args=[profile.id]))
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
