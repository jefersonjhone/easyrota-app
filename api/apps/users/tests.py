from rest_framework import status
from rest_framework.test import APIClient, APITestCase

from .models import CivilServantProfile, CustomUser, StudentProfile


class RegisterViewTests(APITestCase):
    """Exercise the account creation contract exposed by the API."""

    def setUp(self):
        self.client = APIClient()
        self.url = "/api/register/"

    def test_register_student_creates_user_profile_and_tokens(self):
        """A student registration should create both records and return JWTs."""

        payload = {
            "email": "aluno@discente.uefs.br",
            "full_name": "Aluno Exemplo",
            "password": "senha1234",
            "password_confirmation": "senha1234",
            "profile_type": "student",
            "student_id": "12345678",
        }

        response = self.client.post(self.url, payload, format="json")

        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["user"]["email"] == payload["email"]
        assert response.data["profile_type"] == "student"
        assert "tokens" in response.data
        assert CustomUser.objects.filter(email=payload["email"]).exists()
        assert StudentProfile.objects.filter(student_id=payload["student_id"]).exists()

    def test_register_civil_servant_creates_user_profile_and_tokens(self):
        """A civil servant registration should create both records and return JWTs."""

        payload = {
            "email": "servidor@uefs.br",
            "full_name": "Servidor Exemplo",
            "password": "senha1234",
            "password_confirmation": "senha1234",
            "profile_type": "civil-servant",
            "civil_servant_id": "87654321",
        }

        response = self.client.post(self.url, payload, format="json")

        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["user"]["email"] == payload["email"]
        assert response.data["profile_type"] == "civil-servant"
        assert "tokens" in response.data
        assert CustomUser.objects.filter(email=payload["email"]).exists()
        assert CivilServantProfile.objects.filter(
            civil_servant_id=payload["civil_servant_id"]
        ).exists()

    def test_register_rejects_password_mismatch(self):
        """The API should reject payloads with inconsistent passwords."""

        payload = {
            "email": "aluno2@discente.uefs.br",
            "full_name": "Aluno Exemplo",
            "password": "senha1234",
            "password_confirmation": "senha9999",
            "profile_type": "student",
            "student_id": "12345679",
        }

        response = self.client.post(self.url, payload, format="json")

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "password_confirmation" in response.data

    def test_register_requires_profile_specific_field(self):
        """Each profile type must send its own identifier."""

        payload = {
            "email": "servidor2@uefs.br",
            "full_name": "Servidor Exemplo",
            "password": "senha1234",
            "password_confirmation": "senha1234",
            "profile_type": "civil-servant",
        }

        response = self.client.post(self.url, payload, format="json")

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "civil_servant_id" in response.data
