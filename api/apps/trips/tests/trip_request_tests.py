import pytest
from datetime import time, timedelta
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase
from apps.trips.models import TripRequest, Trip, Bus, Route
from apps.users.models import CustomUser
from apps.users.models.profiles import (
    AdministratorProfile,
    StudentProfile,
    CivilServantProfile,
)

class TripRequestAPITestCase(APITestCase):
    def setUp(self):
        self.admin_user = CustomUser.objects.create_superuser(
            email="admin@easyrota.com",
            password="password123",
            full_name="Admin Supremo",
            is_active=True,
            is_staff=True,
            role="admin",
        )
        self.admin_profile = AdministratorProfile.objects.get(user=self.admin_user)

        self.student_user = CustomUser.objects.create_user(
            email="estudante@easyrota.com",
            password="password123",
            full_name="João Estudante",
            is_active=True,
        )
        self.student_profile = StudentProfile.objects.create(
            user=self.student_user, student_id="STU-12345"
        )

        self.server_user = CustomUser.objects.create_user(
            email="servidor@easyrota.com",
            password="password123",
            full_name="Maria Servidora",
            is_active=True,
        )
        self.server_profile = CivilServantProfile.objects.create(
            user=self.server_user, civil_servant_id="SRV-12345"
        )

        self.bus = Bus.objects.create(
            number_plate="ABC-1234",
            seating_capacity=40,
            brand="Mercedes-Benz",
            administrator=self.admin_profile,
        )

        self.route = Route.objects.create(
            origin="UEFS",
            destiny="Salvador",
            departure_time=time(8, 0),
            arrival_time=time(12, 0),
            administrator=self.admin_profile,
        )

    def test_civil_servant_can_create_request(self):
        self.client.force_authenticate(user=self.server_user)
        response = self.client.post(
            "/api/trip-requests/",
            {
                "origin_text": "UEFS",
                "destiny_text": "Salvador",
                "departure_date": "2024-12-01",
                "departure_time": "08:00",
                "reason": "Aula de Campo",
            },
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(TripRequest.objects.count(), 1)
        self.assertEqual(TripRequest.objects.first().origin_text, "UEFS")
        self.assertEqual(TripRequest.objects.first().status, "PENDENTE")

    def test_student_cannot_create_request(self):
        self.client.force_authenticate(user=self.student_user)
        response = self.client.post(
            "/api/trip-requests/",
            {
                "origin_text": "UEFS",
                "destiny_text": "Salvador",
                "departure_date": "2024-12-01",
                "departure_time": "08:00",
                "reason": "Aula de Campo",
            },
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_admin_can_approve_request(self):
        # Create request
        self.client.force_authenticate(user=self.server_user)
        res = self.client.post(
            "/api/trip-requests/",
            {
                "origin_text": "UEFS",
                "destiny_text": "Salvador",
                "departure_date": "2024-12-01",
                "departure_time": "08:00",
                "reason": "Aula de Campo",
            },
        )
        request_id = res.data["id"]

        # Approve it
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.post(
            f"/api/trip-requests/{request_id}/approve/",
            {
                "bus_id": self.bus.id,
                "route_id": self.route.id,
            },
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("access_code", response.data)
        
        trip_req = TripRequest.objects.get(id=request_id)
        self.assertEqual(trip_req.status, "APROVADA")
        
        trip = Trip.objects.get(id=response.data["trip_id"])
        self.assertTrue(trip.is_private)
        self.assertEqual(trip.access_code, response.data["access_code"])
        self.assertEqual(trip.bus, self.bus)
        self.assertEqual(trip.route, self.route)

    def test_admin_can_reject_request(self):
        # Create request
        self.client.force_authenticate(user=self.server_user)
        res = self.client.post(
            "/api/trip-requests/",
            {
                "origin_text": "UEFS",
                "destiny_text": "Salvador",
                "departure_date": "2024-12-01",
                "departure_time": "08:00",
                "reason": "Aula de Campo",
            },
        )
        request_id = res.data["id"]

        # Reject it
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.post(
            f"/api/trip-requests/{request_id}/reject/",
            {
                "feedback": "Não temos ônibus disponíveis."
            },
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        trip_req = TripRequest.objects.get(id=request_id)
        self.assertEqual(trip_req.status, "RECUSADA")
        self.assertEqual(trip_req.feedback, "Não temos ônibus disponíveis.")

class PrivateTripAPITestCase(APITestCase):
    def setUp(self):
        self.admin_user = CustomUser.objects.create_superuser(
            email="admin@easyrota.com",
            password="password123",
            full_name="Admin Supremo",
            is_active=True,
            is_staff=True,
            role="admin",
        )
        self.admin_profile = AdministratorProfile.objects.get(user=self.admin_user)

        self.student_user = CustomUser.objects.create_user(
            email="estudante@easyrota.com",
            password="password123",
            full_name="João Estudante",
            is_active=True,
        )
        self.student_profile = StudentProfile.objects.create(
            user=self.student_user, student_id="STU-12345"
        )

        self.server_user = CustomUser.objects.create_user(
            email="servidor@easyrota.com",
            password="password123",
            full_name="Maria Servidora",
            is_active=True,
        )
        self.server_profile = CivilServantProfile.objects.create(
            user=self.server_user, civil_servant_id="SRV-12345"
        )

        self.bus = Bus.objects.create(
            number_plate="ABC-1234",
            seating_capacity=40,
            brand="Mercedes-Benz",
            administrator=self.admin_profile,
        )

        self.route = Route.objects.create(
            origin="UEFS",
            destiny="Salvador",
            departure_time=time(8, 0),
            arrival_time=time(12, 0),
            administrator=self.admin_profile,
        )

        # Create private trip directly via API sequence
        self.client.force_authenticate(user=self.server_user)
        res = self.client.post(
            "/api/trip-requests/",
            {
                "origin_text": "UEFS",
                "destiny_text": "Salvador",
                "departure_date": (timezone.now() + timedelta(days=5)).date().isoformat(),
                "departure_time": "08:00",
                "reason": "Aula de Campo",
            },
        )
        self.request_id = res.data["id"]

        self.client.force_authenticate(user=self.admin_user)
        appr = self.client.post(
            f"/api/trip-requests/{self.request_id}/approve/",
            {"bus_id": self.bus.id, "route_id": self.route.id},
        )
        self.access_code = appr.data["access_code"]
        self.trip_id = appr.data["trip_id"]

    def test_fetch_private_trip_by_code(self):
        self.client.force_authenticate(user=self.student_user)
        response = self.client.get(f"/api/trips/private/?code={self.access_code}")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["id"], self.trip_id)
        
    def test_reserve_private_trip_requires_code(self):
        self.client.force_authenticate(user=self.student_user)
        
        # Try without code
        fail_res = self.client.post(
            "/api/reservations/",
            {"trip": self.trip_id}
        )
        self.assertEqual(fail_res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("access_code", fail_res.data)
        
        # Try with code
        success_res = self.client.post(
            "/api/reservations/",
            {"trip": self.trip_id, "access_code": self.access_code}
        )
        self.assertEqual(success_res.status_code, status.HTTP_201_CREATED)
