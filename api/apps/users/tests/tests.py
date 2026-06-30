from datetime import time, timedelta
from unittest.mock import patch

import pytest
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from django.core.management import call_command
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient, APITestCase

from apps.reservations.models import Reservation
from apps.trips.models import Bus, Route, Trip, TripPassenger
from apps.users.models.auth import AllowedStaff, MFAChallenge
from apps.users.models.profiles import (
    AdministratorProfile,
    CivilServantProfile,
    DriverProfile,
    StudentProfile,
)
from apps.users.models.user import CustomUser

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

        with patch("apps.users.views.auth.send_mail") as mocked_send_mail:
            response = self.client.post(self.url, payload, format="json")

        assert response.status_code == status.HTTP_202_ACCEPTED
        assert response.data["user"]["user"]["email"] == payload["email"]
        assert response.data["user"]["profile_type"] == "civil-servant"
        assert response.data["status"] == "verification_required"
        assert CustomUser.objects.filter(email=payload["email"]).exists()
        assert CivilServantProfile.objects.filter(
            civil_servant_id=payload["civil_servant_id"]
        ).exists()
        assert MFAChallenge.objects.filter(user__email=payload["email"]).exists()
        assert mocked_send_mail.called

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
        cls.admin_user = User.objects.create_superuser(
            email="superadmin@email.com",
            full_name="Super Admin",
            password="12345678",
            is_staff=True,
            is_active=True,
            level=AdministratorProfile.Level.SUPERADMIN,
            role="Superadmin",
        )
        cls.admin_profile = AdministratorProfile.objects.get(
            user=cls.admin_user,
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

        with patch("apps.users.views.auth.send_mail"):
            response = self.client.post(self.url, payload, format="json")

        assert response.status_code == status.HTTP_202_ACCEPTED
        assert response.data["status"] == "verification_required"

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
            role="admin",
        )
        admin_profile = AdministratorProfile.objects.get(user=admin_user)
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
        assert create_response.data["passenger"]["id"]


class DriverTripPassengerRemovalTests(APITestCase):
    def setUp(self):
        self.client = APIClient()
        self.admin_user = CustomUser.objects.create_superuser(
            email="admin.remove@teste.com",
            full_name="Admin Remocao",
            password="12345678",
            role="admin",
        )
        self.admin_profile = AdministratorProfile.objects.get(user=self.admin_user)
        self.driver_user = CustomUser.objects.create_user(
            email="driver.remove@teste.com",
            full_name="Motorista Remocao",
            password="12345678",
            is_active=True,
        )
        self.driver_profile = DriverProfile.objects.create(
            user=self.driver_user,
            cnh="12345670001",
        )
        self.bus = Bus.objects.create(
            number_plate="REM-1234",
            seating_capacity=40,
            brand="Mercedes-Benz",
            administrator=self.admin_profile,
        )
        self.route = Route.objects.create(
            origin="Feira",
            destiny="Salvador",
            departure_time=time(8, 0),
            arrival_time=time(10, 0),
            administrator=self.admin_profile,
        )
        self.trip = Trip.objects.create(
            trip_date=timezone.now().date() + timedelta(days=1),
            bus=self.bus,
            route=self.route,
            status="CONFIRMADA",
            driver=self.driver_profile,
        )
        self.client.force_authenticate(user=self.driver_user)
        self.url = "/api/staff/passengers/"

    def test_driver_can_register_guest_without_boarding_associated_server(self):
        associated_staff = AllowedStaff.objects.create(
            name="SERVIDOR CONVIDANTE",
            registration_number="55556666",
        )

        response = self.client.post(
            self.url,
            {
                "trip": self.trip.id,
                "passenger_type": "LOCAL_GUEST",
                "associated_staff_id": associated_staff.id,
                "guest_without_server": True,
                "full_name": "Convidado Sem Servidor",
                "cpf": "12345678901",
            },
            format="json",
        )

        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["passenger"]["name"] == "Convidado Sem Servidor"
        assert "associated_server" not in response.data
        assert TripPassenger.objects.filter(
            trip=self.trip,
            passenger_type=TripPassenger.PassengerType.LOCAL_GUEST,
            associated_staff=associated_staff,
        ).exists()
        assert not TripPassenger.objects.filter(
            trip=self.trip,
            passenger_type=TripPassenger.PassengerType.LOCAL_SERVER,
            allowed_staff=associated_staff,
        ).exists()

    def test_driver_can_remove_local_passenger_from_trip(self):
        allowed_staff = AllowedStaff.objects.create(
            name="SERVIDOR REMOVIDO",
            registration_number="12340000",
        )
        passenger = TripPassenger.objects.create(
            trip=self.trip,
            allowed_staff=allowed_staff,
            recorded_by=self.driver_profile,
        )

        response = self.client.delete(
            self.url,
            {
                "trip": self.trip.id,
                "local_passenger_id": passenger.id,
            },
            format="json",
        )

        assert response.status_code == status.HTTP_200_OK
        assert response.data["removed_passenger"]["name"] == allowed_staff.name
        assert response.data["checked_in_count"] == 0
        assert not TripPassenger.objects.filter(id=passenger.id).exists()

    def test_driver_can_remove_reservation_check_in_without_deleting_reservation(self):
        passenger_user = CustomUser.objects.create_user(
            email="passageiro.remove@teste.com",
            full_name="Passageiro Removido",
            password="12345678",
            is_active=True,
        )
        student_profile = StudentProfile.objects.create(
            user=passenger_user,
            student_id="REM-0001",
        )
        reservation = Reservation.objects.create(
            trip=self.trip,
            student=student_profile,
            status="CONFIRMADA",
            check_in=True,
            checkin_date=timezone.now(),
        )

        response = self.client.delete(
            self.url,
            {
                "trip": self.trip.id,
                "reservation_id": reservation.id,
            },
            format="json",
        )

        assert response.status_code == status.HTTP_200_OK
        assert response.data["removed_passenger"]["name"] == passenger_user.full_name
        assert response.data["checked_in_count"] == 0
        reservation.refresh_from_db()
        assert reservation.check_in is False
        assert reservation.checkin_date is None


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


class WebPushSubscriptionTests(APITestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            email="push@teste.com",
            full_name="Push Teste",
            password="12345678",
            is_active=True,
        )
        self.client.force_authenticate(user=self.user)
        self.url = "/api/webpush/save_information/"

    def _payload(self, status_type="subscribe"):
        return {
            "status_type": status_type,
            "subscription": {
                "endpoint": "https://example.com/push/1",
                "keys": {
                    "auth": "auth-key",
                    "p256dh": "p256dh-key",
                },
            },
            "browser": "pytest",
        }

    def test_subscribe_creates_subscription_and_push_info(self):
        response = self.client.post(self.url, self._payload(), format="json")

        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["status"] == "success"

    def test_unsubscribe_returns_accepted(self):
        response = self.client.post(
            self.url,
            self._payload(status_type="unsubscribe"),
            format="json",
        )

        assert response.status_code == status.HTTP_202_ACCEPTED
        assert response.data["status"] == "success"

    def test_driver_can_register_allowed_staff_as_reservation(self):
        admin_user = CustomUser.objects.create_superuser(
            email="admin.reg@test.com",
            password="SenhaSegura123",
            full_name="Admin Reg",
        )
        admin_profile = AdministratorProfile.objects.get(user=admin_user)

        driver_user = CustomUser.objects.create_user(
            email="driver.registrar@teste.com",
            full_name="Motorista Registrar",
            password="SenhaSegura123",
            is_active=True,
        )
        DriverProfile.objects.create(user=driver_user, cnh="12345678001")

        trip = Trip.objects.create(
            trip_date=timezone.now().date() + timedelta(days=1),
            status="CONFIRMADA",
            bus=Bus.objects.create(
                number_plate="REG-1234",
                seating_capacity=1,
                brand="Marcopolo",
                administrator=admin_profile,
            ),
            route=Route.objects.create(
                origin="Feira",
                destiny="Salvador",
                departure_time="08:00:00",
                arrival_time="10:00:00",
                administrator=admin_profile,
            ),
        )

        allowed = AllowedStaff.objects.create(
            name="SERVIDOR PRIORITARIO",
            registration_number="99990000",
        )
        civil_user = CustomUser.objects.create_user(
            email="servidor.prior@teste.com",
            full_name="Servidor Prioritario",
            password="SenhaSegura123",
            is_active=True,
        )
        civil_profile = CivilServantProfile.objects.create(
            user=civil_user,
            civil_servant_id=allowed.registration_number,
        )

        reservation = Reservation.objects.create(
            trip=trip,
            civil_servant=civil_profile,
            status="PENDENTE",
        )

        client = APIClient()
        client.force_authenticate(user=driver_user)
        response = client.post(
            "/api/staff/passengers/",
            {
                "trip": trip.id,
                "name": allowed.name,
                "registration_number": allowed.registration_number,
            },
            format="json",
        )

        assert response.status_code == status.HTTP_200_OK
        assert response.data["passenger"]["reservation_id"] == reservation.id
        reservation.refresh_from_db()
        assert reservation.status == "CONFIRMADA"
        assert reservation.check_in is True

    def test_subscription_requires_authenticated_user(self):
        self.client.logout()

        response = self.client.post(self.url, self._payload(), format="json")

        assert response.status_code == status.HTTP_401_UNAUTHORIZED

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


class ChangePasswordTests(APITestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = CustomUser.objects.create_user(
            email="testuser@email.com",
            full_name="Test User",
            password="oldpassword123",
            is_active=True,
        )
        self.url = "/api/auth/change-password/"

    def test_change_password_success(self):
        self.client.force_authenticate(user=self.user)
        payload = {
            "current_password": "oldpassword123",
            "new_password": "newpassword123",
            "new_password_confirm": "newpassword123",
        }
        response = self.client.post(self.url, payload, format="json")
        assert response.status_code == status.HTTP_200_OK

        # Verify user can log in with new password
        self.user.refresh_from_db()
        assert self.user.check_password("newpassword123") is True

    def test_change_password_wrong_current(self):
        self.client.force_authenticate(user=self.user)
        payload = {
            "current_password": "wrongpassword",
            "new_password": "newpassword123",
            "new_password_confirm": "newpassword123",
        }
        response = self.client.post(self.url, payload, format="json")
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "current_password" in response.data

    def test_change_password_mismatch(self):
        self.client.force_authenticate(user=self.user)
        payload = {
            "current_password": "oldpassword123",
            "new_password": "newpassword123",
            "new_password_confirm": "differentpassword",
        }
        response = self.client.post(self.url, payload, format="json")
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "new_password_confirm" in response.data

    def test_change_password_too_short(self):
        self.client.force_authenticate(user=self.user)
        payload = {
            "current_password": "oldpassword123",
            "new_password": "short",
            "new_password_confirm": "short",
        }
        response = self.client.post(self.url, payload, format="json")
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "new_password" in response.data

    def test_change_password_unauthenticated(self):
        payload = {
            "current_password": "oldpassword123",
            "new_password": "newpassword123",
            "new_password_confirm": "newpassword123",
        }
        response = self.client.post(self.url, payload, format="json")
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
