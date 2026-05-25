import pytest
from unittest.mock import patch
from datetime import time, timedelta

from django.core.management import call_command
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient, APITestCase

from apps.trips.models import Bus, Route, Trip
from .models.profiles import (
    AdministratorProfile,
    CivilServantProfile,
    DriverProfile,
    StudentProfile,
)
from .models.auth import AllowedStaff, MFAChallenge
from .models.user import CustomUser

User = get_user_model()


class RegisterViewTests(APITestCase):
    """Exercise the account creation contract exposed by the API."""

    def setUp(self):
        self.client = APIClient()
        self.url = "/api/register/"

    def test_register_student_creates_user_profile_and_tokens(self):
        """A student registration should create the user and return OTP flow."""
        payload = {
            "email": "aluno@discente.uefs.br",
            "full_name": "Aluno Exemplo",
            "password": "senha1234",
            "password_confirmation": "senha1234",
            "profile_type": "student",
            "student_id": "12345678",
        }

        with patch("apps.users.views.auth.send_mail") as mocked_send_mail:
            response = self.client.post(self.url, payload, format="json")

        assert response.status_code == status.HTTP_202_ACCEPTED
        assert response.data["user"]["user"]["email"] == payload["email"]
        assert response.data["user"]["profile_type"] == "student"
        assert response.data["status"] == "verification_required"
        assert response.data["otp_destination"] == payload["email"]
        assert CustomUser.objects.filter(email=payload["email"]).exists()
        assert StudentProfile.objects.filter(student_id=payload["student_id"]).exists()
        assert MFAChallenge.objects.filter(user__email=payload["email"]).exists()
        assert mocked_send_mail.called

    def test_register_civil_servant_creates_user_profile_and_tokens(self):
        """A civil servant registration should validate against AllowedStaff."""
        AllowedStaff.objects.create(
            name="SERVIDOR EXEMPLO",
            registration_number="87654322",
        )
        payload = {
            "email": "servidor@uefs.br",
            "full_name": "Servidor Exemplo",
            "password": "senha1234",
            "password_confirmation": "senha1234",
            "profile_type": "civil-servant",
            "civil_servant_id": "87654322",
        }

        response = self.client.post(self.url, payload, format="json")

        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["user"]["user"]["email"] == payload["email"]
        assert response.data["user"]["profile_type"] == "civil-servant"
        assert response.data["status"] == "created"
        assert CustomUser.objects.filter(email=payload["email"]).exists()
        assert CivilServantProfile.objects.filter(
            civil_servant_id=payload["civil_servant_id"]
        ).exists()

    def test_register_student_rejects_invalid_email_domain(self):
        payload = {
            "email": "aluno@uefs.br",
            "full_name": "Aluno Exemplo",
            "password": "senha1234",
            "password_confirmation": "senha1234",
            "profile_type": "student",
            "student_id": "12345678",
        }

        response = self.client.post(self.url, payload, format="json")

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "email" in response.data

    def test_verify_registration_otp_activates_student(self):
        payload = {
            "email": "aluno2@discente.uefs.br",
            "full_name": "Aluno Exemplo 2",
            "password": "senha1234",
            "password_confirmation": "senha1234",
            "profile_type": "student",
            "student_id": "12345679",
        }

        with patch("apps.users.views.auth.send_mail"):
            response = self.client.post(self.url, payload, format="json")

        token = response.data["token"]
        challenge = MFAChallenge.objects.get(user__email=payload["email"])
        verify_url = reverse("verify-registration-otp")

        with patch("apps.users.views.auth.check_password", return_value=True):
            verify_response = self.client.post(
                verify_url,
                {"token": token, "code": "123456"},
                format="json",
            )

        assert verify_response.status_code == status.HTTP_200_OK
        challenge.refresh_from_db()
        assert challenge.used is True
        assert CustomUser.objects.get(email=payload["email"]).is_active is True

    def test_civil_servant_registration_rejects_unknown_staff(self):
        payload = {
            "email": "servidor2@uefs.br",
            "full_name": "Servidor Desconhecido",
            "password": "senha1234",
            "password_confirmation": "senha1234",
            "profile_type": "civil-servant",
            "civil_servant_id": "11111111",
        }

        response = self.client.post(self.url, payload, format="json")

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "detail" in response.data or "civil_servant_id" in response.data

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


class LoginViewTests(APITestCase):
    """Validate authentication and token generation."""

    def setUp(self):
        self.client = APIClient()
        self.url = "/api/login/"

    @classmethod
    def setUpTestData(cls):
        cls.user = User.objects.create_user(
            email="teste@email.com",
            full_name="Teste Usuario",
            password="12345678",
            is_active=True,
        )
        cls.admin_user = User.objects.create_user(
            email="superadmin@email.com",
            full_name="Super Admin",
            password="12345678",
            is_staff=True,
            is_active=True,
        )
        cls.admin_profile = AdministratorProfile.objects.create(
            user=cls.admin_user,
            role="Superadmin",
            level=AdministratorProfile.Level.SUPERADMIN,
        )

    def test_login_success(self):
        """Ensure valid credentials authenticate user successfully
        and return JWT tokens."""
        payload = {"email": "teste@email.com", "password": "12345678"}

        response = self.client.post(self.url, payload, format="json")

        assert response.status_code == status.HTTP_200_OK
        assert "tokens" in response.data

    def test_login_wrong_password(self):
        """Invalid password rejects authentication with 400 response."""
        payload = {"email": "teste@email.com", "password": "wrong_password"}

        response = self.client.post(self.url, payload, format="json")

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "detail" in response.data

    def test_user_not_found(self):
        """Non-existent user returns authentication error."""
        payload = {"email": "userErrado@email.com", "password": "12345678"}

        response = self.client.post(self.url, payload, format="json")

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "detail" in response.data

    def test_login_returns_admin_hierarchy_for_admins(self):
        payload = {"email": "superadmin@email.com", "password": "12345678"}

        response = self.client.post(self.url, payload, format="json")

        assert response.status_code == status.HTTP_200_OK
        assert response.data["user"]["admin_profile"]["level"] == "superadmin"
        assert response.data["user"]["admin_profile"]["role"] == "Superadmin"


class AdminDelegationViewTests(APITestCase):
    def setUp(self):
        self.client = APIClient()
        self.url = "/api/admins/"
        self.superadmin_user = User.objects.create_user(
            email="boss@email.com",
            full_name="Boss",
            password="12345678",
            is_staff=True,
        )
        self.superadmin_profile = AdministratorProfile.objects.create(
            user=self.superadmin_user,
            role="Diretor",
            level=AdministratorProfile.Level.SUPERADMIN,
        )
        self.subadmin_user = User.objects.create_user(
            email="sub@email.com",
            full_name="Sub",
            password="12345678",
            is_staff=True,
        )
        self.subadmin_profile = AdministratorProfile.objects.create(
            user=self.subadmin_user,
            role="Coordenador",
            level=AdministratorProfile.Level.SUBADMIN,
            created_by=self.superadmin_profile,
        )
        self.regular_user = User.objects.create_user(
            email="common@email.com",
            full_name="Common User",
            password="12345678",
        )
        self.payload = {
            "email": "newadmin@email.com",
            "full_name": "Novo Admin",
            "password": "12345678",
            "role": "Supervisor",
        }

    def test_superadmin_can_create_subadmin(self):
        self.client.force_authenticate(user=self.superadmin_user)

        response = self.client.post(self.url, self.payload, format="json")

        assert response.status_code == status.HTTP_201_CREATED
        created_user = User.objects.get(email=self.payload["email"])
        assert created_user.is_staff is True
        assert created_user.admin_profile.level == AdministratorProfile.Level.SUBADMIN
        assert created_user.admin_profile.created_by == self.superadmin_profile

    def test_subadmin_cannot_create_admin(self):
        self.client.force_authenticate(user=self.subadmin_user)

        response = self.client.post(self.url, self.payload, format="json")

        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_regular_user_cannot_create_admin(self):
        self.client.force_authenticate(user=self.regular_user)

        response = self.client.post(self.url, self.payload, format="json")

        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_cannot_create_superadmin_via_endpoint(self):
        self.client.force_authenticate(user=self.superadmin_user)
        payload = dict(self.payload)
        payload["level"] = "superadmin"

        response = self.client.post(self.url, payload, format="json")

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "level" in response.data


class AllowedStaffImportTests(APITestCase):
    def test_import_allowed_staff_command(self):
        call_command("import_allowed_staff", "servidores.ods")

        assert AllowedStaff.objects.exists()
        assert AllowedStaff.objects.filter(registration_number="71654523").exists()


class AllowedStaffValidationTests(APITestCase):
    def setUp(self):
        self.client = APIClient()
        self.url = "/api/register/"

    def test_civil_servant_registration_matches_allowed_staff(self):
        AllowedStaff.objects.create(
            name="SERVIDOR TESTE",
            registration_number="11112222",
        )

        payload = {
            "email": "servidor3@uefs.br",
            "full_name": "Servidor Teste",
            "password": "senha1234",
            "password_confirmation": "senha1234",
            "profile_type": "civil-servant",
            "civil_servant_id": "11112222",
        }

        response = self.client.post(self.url, payload, format="json")

        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["status"] == "created"

    def test_driver_search_and_passenger_registration(self):
        driver_user = CustomUser.objects.create_user(
            email="motorista@teste.com",
            full_name="Motorista Teste",
            password="12345678",
            is_active=True,
        )
        DriverProfile.objects.create(
            user=driver_user,
            cnh="12345678901",
        )
        admin_user = CustomUser.objects.create_superuser(
            email="admin@teste.com",
            full_name="Admin Teste",
            password="12345678",
        )
        admin_profile = AdministratorProfile.objects.create(user=admin_user)
        bus = Bus.objects.create(
            number_plate="TRIP-1234",
            seating_capacity=40,
            brand="Mercedes-Benz",
            administrator=admin_profile,
        )
        route = Route.objects.create(
            origin="Feira de Santana",
            destiny="Salvador",
            departure_time=time(8, 0),
            arrival_time=time(10, 0),
            administrator=admin_profile,
        )
        trip = Trip.objects.create(
            trip_date=timezone.now().date() + timedelta(days=1),
            bus=bus,
            route=route,
            status="CONFIRMADA",
        )
        AllowedStaff.objects.create(
            name="SERVIDOR BUSCA",
            registration_number="99998888",
        )

        self.client.force_authenticate(user=driver_user)

        search_response = self.client.get("/api/staff/search/", {"q": "SERVIDOR"})
        assert search_response.status_code == status.HTTP_200_OK
        assert len(search_response.data) >= 1

        create_response = self.client.post(
            "/api/staff/passengers/",
            {
                "trip": trip.id,
                "name": "SERVIDOR BUSCA",
                "registration_number": "99998888",
            },
            format="json",
        )

        assert create_response.status_code == status.HTTP_201_CREATED
        assert create_response.data["id"]


class DriverProfileTests(APITestCase):
    def test_create_driver_profile_with_valid_cnh(self):
        user = CustomUser.objects.create_user(
            email="driver@example.com",
            password="SenhaSegura123",
            full_name="Driver Test",
        )
        profile = DriverProfile(
            user=user,
            cnh="12345678901",
        )
        profile.full_clean()
        profile.save()

        assert profile.pk is not None

    def test_driver_profile_invalid_cnh(self):
        user = CustomUser.objects.create_user(
            email="driver2@example.com",
            password="SenhaSegura123",
            full_name="Driver Invalid",
        )
        profile = DriverProfile(
            user=user,
            cnh="abc123",
        )
        with pytest.raises(ValidationError) as exc:
            profile.full_clean()

        assert "cnh" in exc.value.message_dict

    def test_driver_profile_unique_cnh(self):
        user1 = CustomUser.objects.create_user(
            email="driver1@example.com",
            password="SenhaSegura123",
            full_name="Driver One",
        )
        user2 = CustomUser.objects.create_user(
            email="driver2@example.com",
            password="SenhaSegura123",
            full_name="Driver Two",
        )
        DriverProfile.objects.create(user=user1, cnh="12345678901")
        profile = DriverProfile(
            user=user2,
            cnh="12345678901",
        )
        with pytest.raises(ValidationError) as exc:
            profile.full_clean()

        assert "cnh" in exc.value.message_dict
