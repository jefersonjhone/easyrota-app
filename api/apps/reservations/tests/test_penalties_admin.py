from datetime import time, timedelta

from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from ...trips.models import Bus, Route, Trip
from ...users.models import (
    AdministratorProfile,
    CustomUser,
    StudentProfile,
)
from ..models import Punishment, Reservation


class BaseReservationTestCase(APITestCase):
    """Base test case for reservations — shared helpers."""

    def setUp(self):
        self._create_users()
        self._create_bus_and_route()
        self.student_user, self.student_profile = self.create_student()
        self.non_admin_user = self.student_user

    def _create_users(self):
        self.admin_user = CustomUser.objects.create_superuser(
            email="admin@easyrota.com",
            password="password123",
            full_name="Admin Supremo",
            role="admin",
        )
        self.admin_profile = AdministratorProfile.objects.get(user=self.admin_user)

    def _create_bus_and_route(self):
        self.bus = Bus.objects.create(
            number_plate="ABC-1234",
            seating_capacity=40,
            brand="Mercedes-Benz",
            administrator=self.admin_profile,
        )
        self.route = Route.objects.create(
            origin="Salvador",
            destiny="Feira",
            departure_time=time(8, 0),
            arrival_time=time(12, 0),
            administrator=self.admin_profile,
        )

    def create_student(self, email="student@teste.com", student_id="12345"):
        user = CustomUser.objects.create_user(email=email, password="12345678")
        profile = StudentProfile.objects.create(user=user, student_id=student_id)
        return user, profile

    def create_trip(self, days_ahead=1, status="CONFIRMADA"):
        return Trip.objects.create(
            trip_date=timezone.now().date() + timedelta(days=days_ahead),
            status=status,
            bus=self.bus,
            route=self.route,
        )

    def create_reservation(self, trip=None, student=None):
        if trip is None:
            trip = self.create_trip()
        return Reservation.objects.create(
            trip=trip,
            student=student,
            checkin_date=None,
        )

    def create_punishment(
        self,
        student=None,
        reservation=None,
        is_active=True,
        description="Faltou na viagem",
    ):
        if student is None:
            _, student = self.create_student(
                email="punished@teste.com", student_id="99999"
            )
        if reservation is None:
            trip = self.create_trip(days_ahead=-1)
            reservation = self.create_reservation(trip=trip, student=student)
        return Punishment.objects.create(
            student=student,
            reservation=reservation,
            is_active=is_active,
            description=description,
        )


class AdminPunishmentGroupedByTripTest(BaseReservationTestCase):
    """Tests for GET /api/reservations/punishments/grouped-by-trip/"""

    def setUp(self):
        super().setUp()
        self.url = reverse("admin-punishment-grouped-by-trip")

        # Create two trips with punishments
        self.trip1 = self.create_trip(days_ahead=-2, status="CONCLUÍDA")
        self.trip2 = self.create_trip(days_ahead=-1, status="CONCLUÍDA")

        self.student_a, self.profile_a = self.create_student(
            email="student_a@test.com", student_id="A001"
        )
        self.student_b, self.profile_b = self.create_student(
            email="student_b@test.com", student_id="B001"
        )

        self.res1a = self.create_reservation(trip=self.trip1, student=self.profile_a)
        self.res1b = self.create_reservation(trip=self.trip1, student=self.profile_b)
        self.res2a = self.create_reservation(trip=self.trip2, student=self.profile_a)

        self.pun1 = Punishment.objects.create(
            student=self.profile_a,
            reservation=self.res1a,
            is_active=True,
            description="Faltou trip1",
        )
        self.pun2 = Punishment.objects.create(
            student=self.profile_b,
            reservation=self.res1b,
            is_active=True,
            description="Faltou trip1 também",
        )
        self.pun3 = Punishment.objects.create(
            student=self.profile_a,
            reservation=self.res2a,
            is_active=False,
            description="Perdoado",
        )

    def test_admin_can_view_punishments_grouped_by_trip(self):
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.get(self.url, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_grouped_response_contains_expected_fields(self):
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.get(self.url, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        data = response.data
        self.assertGreaterEqual(len(data), 2)

        for group in data:
            self.assertIn("trip_id", group)
            self.assertIn("trip_date", group)
            self.assertIn("departure_time", group)
            self.assertIn("route", group)
            self.assertIn("punishment_count", group)
            self.assertIn("punishments", group)

    def test_grouped_punishment_count_matches(self):
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.get(self.url, format="json")
        data = response.data

        trip1_group = next(g for g in data if g["trip_id"] == self.trip1.id)
        trip2_group = next(g for g in data if g["trip_id"] == self.trip2.id)

        self.assertEqual(trip1_group["punishment_count"], 2)
        self.assertEqual(trip2_group["punishment_count"], 1)
        self.assertEqual(len(trip1_group["punishments"]), 2)
        self.assertEqual(len(trip2_group["punishments"]), 1)

    def test_empty_list_when_no_punishments_exist(self):
        self.client.force_authenticate(user=self.admin_user)
        Punishment.objects.all().delete()
        response = self.client.get(self.url, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 0)

    def test_grouped_by_trip_unauthenticated_returns_401(self):
        self.client.force_authenticate(user=None)
        response = self.client.get(self.url, format="json")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_grouped_by_trip_non_admin_returns_403(self):
        self.client.force_authenticate(user=self.non_admin_user)
        response = self.client.get(self.url, format="json")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


class AdminPunishmentListTest(BaseReservationTestCase):
    """Tests for GET /api/reservations/punishments/manage/ (admin list)"""

    def setUp(self):
        super().setUp()
        self.url = reverse("admin-punishment-list")

        self.trip = self.create_trip(days_ahead=-1, status="CONCLUÍDA")
        _, self.profile_a = self.create_student(
            email="list_a@test.com", student_id="L001"
        )
        _, self.profile_b = self.create_student(
            email="list_b@test.com", student_id="L002"
        )

        self.res_a = self.create_reservation(trip=self.trip, student=self.profile_a)
        self.res_b = self.create_reservation(trip=self.trip, student=self.profile_b)

        self.pun_a = Punishment.objects.create(
            student=self.profile_a,
            reservation=self.res_a,
            is_active=True,
            description="Falta A",
        )
        self.pun_b = Punishment.objects.create(
            student=self.profile_b,
            reservation=self.res_b,
            is_active=False,
            description="Falta B perdoada",
        )

    def test_admin_can_list_all_punishments(self):
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.get(self.url, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_list_returns_all_punishments_with_expected_fields(self):
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.get(self.url, format="json")

        data = response.data
        if isinstance(data, dict) and "results" in data:
            results = data["results"]
        else:
            results = data

        self.assertEqual(len(results), 2)

        for item in results:
            self.assertIn("id", item)
            self.assertIn("is_active", item)
            self.assertIn("description", item)
            self.assertIn("student_name", item)
            self.assertIn("student_id_display", item)
            self.assertIn("reservation_id", item)
            self.assertIn("created_at", item)

    def test_list_unauthenticated_returns_401(self):
        self.client.force_authenticate(user=None)
        response = self.client.get(self.url, format="json")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_list_non_admin_returns_403(self):
        self.client.force_authenticate(user=self.non_admin_user)
        response = self.client.get(self.url, format="json")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


class AdminPunishmentToggleTest(BaseReservationTestCase):
    """Tests for PATCH /api/reservations/punishments/manage/<pk>/ (toggle is_active)"""

    def setUp(self):
        super().setUp()
        self.trip = self.create_trip(days_ahead=-1, status="CONCLUÍDA")
        _, self.profile = self.create_student(
            email="toggle@test.com", student_id="T001"
        )
        self.reservation = self.create_reservation(
            trip=self.trip, student=self.profile
        )

    def test_admin_can_toggle_active_to_inactive(self):
        punishment = Punishment.objects.create(
            student=self.profile,
            reservation=self.reservation,
            is_active=True,
            description="Ativa para desativar",
        )
        url = reverse("admin-punishment-detail", args=[punishment.id])
        self.client.force_authenticate(user=self.admin_user)

        response = self.client.patch(url, {"is_active": False}, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        punishment.refresh_from_db()
        self.assertFalse(punishment.is_active)

    def test_admin_can_toggle_inactive_to_active(self):
        punishment = Punishment.objects.create(
            student=self.profile,
            reservation=self.reservation,
            is_active=False,
            description="Inativa para ativar",
        )
        url = reverse("admin-punishment-detail", args=[punishment.id])
        self.client.force_authenticate(user=self.admin_user)

        response = self.client.patch(url, {"is_active": True}, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        punishment.refresh_from_db()
        self.assertTrue(punishment.is_active)

    def test_toggle_unauthenticated_returns_401(self):
        punishment = Punishment.objects.create(
            student=self.profile,
            reservation=self.reservation,
            is_active=True,
            description="Protegida",
        )
        url = reverse("admin-punishment-detail", args=[punishment.id])
        self.client.force_authenticate(user=None)

        response = self.client.patch(url, {"is_active": False}, format="json")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_toggle_non_admin_returns_403(self):
        punishment = Punishment.objects.create(
            student=self.profile,
            reservation=self.reservation,
            is_active=True,
            description="Protegida",
        )
        url = reverse("admin-punishment-detail", args=[punishment.id])
        self.client.force_authenticate(user=self.non_admin_user)

        response = self.client.patch(url, {"is_active": False}, format="json")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_toggle_nonexistent_punishment_returns_404(self):
        url = reverse("admin-punishment-detail", args=[99999])
        self.client.force_authenticate(user=self.admin_user)

        response = self.client.patch(url, {"is_active": False}, format="json")
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)


class AdminPunishmentDeleteTest(BaseReservationTestCase):
    """Tests for DELETE /api/reservations/punishments/manage/<pk>/"""

    def setUp(self):
        super().setUp()
        self.trip = self.create_trip(days_ahead=-1, status="CONCLUÍDA")
        _, self.profile = self.create_student(
            email="delete@test.com", student_id="D001"
        )
        self.reservation = self.create_reservation(
            trip=self.trip, student=self.profile
        )

    def test_admin_can_delete_punishment(self):
        punishment = Punishment.objects.create(
            student=self.profile,
            reservation=self.reservation,
            is_active=True,
            description="Para deletar",
        )
        url = reverse("admin-punishment-detail", args=[punishment.id])
        self.client.force_authenticate(user=self.admin_user)

        response = self.client.delete(url, format="json")
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

        self.assertFalse(Punishment.objects.filter(id=punishment.id).exists())

    def test_delete_unauthenticated_returns_401(self):
        punishment = Punishment.objects.create(
            student=self.profile,
            reservation=self.reservation,
            is_active=True,
            description="Protegida",
        )
        url = reverse("admin-punishment-detail", args=[punishment.id])
        self.client.force_authenticate(user=None)

        response = self.client.delete(url, format="json")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_delete_non_admin_returns_403(self):
        punishment = Punishment.objects.create(
            student=self.profile,
            reservation=self.reservation,
            is_active=True,
            description="Protegida",
        )
        url = reverse("admin-punishment-detail", args=[punishment.id])
        self.client.force_authenticate(user=self.non_admin_user)

        response = self.client.delete(url, format="json")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_delete_nonexistent_punishment_returns_404(self):
        url = reverse("admin-punishment-detail", args=[99999])
        self.client.force_authenticate(user=self.admin_user)

        response = self.client.delete(url, format="json")
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
