from datetime import time, timedelta
from unittest.mock import patch

import pytest
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from ..trips.models import Bus, Route, Trip
from ..users.models import (
    AdministratorProfile,
    CivilServantProfile,
    CustomUser,
    DriverProfile,
    StudentProfile,
)
from .models import Reservation


class BaseReservationTestCase(APITestCase):
    """Base test case for reservations."""

    def setUp(self):
        self._create_users()
        self._create_bus_and_route()

    def _create_users(self):
        """Creates admin and driver users and profiles."""

        self.admin_user = CustomUser.objects.create_superuser(
            email="admin@easyrota.com",
            password="password123",
            full_name="Admin Supremo",
        )
        self.admin_profile = AdministratorProfile.objects.create(user=self.admin_user)

        self.driver_user = CustomUser.objects.create_user(
            email="motorista@easyrota.com",
            password="password123",
            full_name="João Motorista",
        )
        self.driver_profile = DriverProfile.objects.create(
            user=self.driver_user, cnh="12345678901"
        )

    def _create_bus_and_route(self):
        """Creates bus and route"""

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

    def create_civil_servant(
        self,
        email="civil-servant@teste.com",
        civil_servant_id="12345",
    ):
        """Creates civil servant user and profile"""
        user = CustomUser.objects.create_user(email=email, password="12345678")
        civil_servant = CivilServantProfile.objects.create(
            user=user,
            civil_servant_id=civil_servant_id,
        )

        return user, civil_servant

    def create_student(self):
        """Creates student user and profile."""
        user = CustomUser.objects.create_user(
            email="student@teste.com", password="12345678"
        )
        student_profile = StudentProfile.objects.create(user=user)

        return user, student_profile

    def create_trip(self, days_ahead=1, status="CONFIRMADA"):
        """Creates trip"""
        return Trip.objects.create(
            trip_date=timezone.now().date() + timedelta(days=days_ahead),
            status=status,
            bus=self.bus,
            route=self.route,
        )

    def create_reservation(self, trip=None, civil_servant=None, student=None):
        """Creates reservation."""
        if not trip:
            trip = self.create_trip()

        return Reservation.objects.create(
            trip=trip, civil_servant=civil_servant, student=student, checkin_date=None
        )


class ReservationTest(BaseReservationTestCase):
    def setUp(self):
        super().setUp()
        self.url = reverse("reservation-create")
        self.student, self.student_profile = self.create_student()

    def test_create_reservation_after_limit(self):
        """Creating a reservation after the limit (30 minutes before bus departure)
        should display an error message."""

        self.client.force_authenticate(user=self.student)

        trip = self.create_trip(days_ahead=0)

        cutoff_time = timezone.make_aware(
            timezone.datetime.combine(
                trip.trip_date,
                trip.route.departure_time,
            ),
            timezone.get_current_timezone(),
        ) + timedelta(minutes=31)

        with patch("apps.reservations.services.timezone.now", return_value=cutoff_time):
            response = self.client.post(
                self.url,
                data={"trip": trip.id},
                format="json",
            )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("Prazo de reserva encerrado.", str(response.data))

    def test_create_reservation_successfully(self):
        """Creating a reservation before the limit (30 minutes before bus departure)
        should create a successful reservation."""

        self.client.force_authenticate(user=self.student)

        trip = self.create_trip()

        response = self.client.post(self.url, data={"trip": trip.id}, format="json")

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)


class ReservationCancelTest(BaseReservationTestCase):
    def setUp(self):
        super().setUp()
        self.user, self.student_profile = self.create_student()
        self.trip = self.create_trip(days_ahead=1)
        self.reservation = self.create_reservation(
            student=self.student_profile,
            trip=self.trip,
        )
        self.url = reverse("reservation-manage-cancel", args=[self.reservation.id])

    def test_cancel_reservation(self):
        self.client.force_authenticate(user=self.user)

        response = self.client.post(self.url, format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(Reservation.objects.filter(id=self.reservation.id).exists())


class ReservationHistoryTest(BaseReservationTestCase):
    def setUp(self):
        super().setUp()
        self.url = reverse("reservation-history")
        self.user, self.civil_servant = self.create_civil_servant()

        self.trip = self.create_trip(days_ahead=0, status="CONCLUÍDA")
        self.reservation = self.create_reservation(
            civil_servant=self.civil_servant, trip=self.trip
        )

    def test_verify_fields_visible(self):
        """Verify if the fields are showing correctly."""

        self.client.force_authenticate(user=self.user)

        response = self.client.get(self.url, format="json")

        fields = [
            "origin",
            "destiny",
            "trip_date",
            "trip_history_status",
            "total_trips",
            "created_at",
        ]
        for field in fields:
            self.assertIn(field, response.data[0])

        self.assertEqual(response.data[0]["trip_history_status"], "FALTA")
        self.assertEqual(response.data[0]["total_trips"], 1)


class AvailableTripsTest(BaseReservationTestCase):
    def setUp(self):
        super().setUp()
        self.url = reverse("reservation-available-trips")
        self.user, self.student_profile = self.create_student()

    def test_returns_available_trips_with_reserved_seats(self):
        trip = self.create_trip(days_ahead=2)
        Reservation.objects.create(
            trip=trip,
            student=self.student_profile,
            status="CONFIRMADA",
        )
        Reservation.objects.create(
            trip=trip,
            civil_servant=self.create_civil_servant(
                email="cv1@teste.com",
                civil_servant_id="111",
            )[1],
            status="PENDENTE",
        )
        Reservation.objects.create(
            trip=trip,
            civil_servant=self.create_civil_servant(
                email="cv2@teste.com",
                civil_servant_id="222",
            )[1],
            status="LISTA SECUNDÁRIA",
        )

        self.client.force_authenticate(user=self.user)
        response = self.client.get(self.url, format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["available_seats"], 38)
        self.assertEqual(response.data[0]["bus_brand"], "Mercedes-Benz")
