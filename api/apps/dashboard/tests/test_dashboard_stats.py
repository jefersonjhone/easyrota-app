from datetime import timedelta

from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from apps.reservations.models import Reservation
from apps.trips.models import Bus, Route, Trip
from apps.users.models.profiles import (
    AdministratorProfile,
    CivilServantProfile,
    DriverProfile,
    StudentProfile,
)

User = get_user_model()

BASE_URL = "/api/dashboard"


class DashboardStatsBaseTest(APITestCase):
    """Shared setup for all dashboard stats test classes."""

    def setUp(self):
        self.admin_user = User.objects.create_superuser(
            email="admin@example.com",
            password="admin123",
        )
        self.admin_profile = AdministratorProfile.objects.get(user=self.admin_user)

        self.regular_user = User.objects.create_user(
            email="user@example.com",
            password="user123",
        )


class TripsStatsByStatusViewTests(DashboardStatsBaseTest):
    """GET /api/dashboard/trips/status/"""

    def setUp(self):
        super().setUp()
        self.url = f"{BASE_URL}/trips/status/"
        self.route = Route.objects.create(
            origin="City A",
            destiny="City B",
            departure_time="08:00:00",
            arrival_time="10:00:00",
            administrator=self.admin_profile,
        )

    def test_returns_status_distribution_with_correct_counts(self):
        Trip.objects.create(
            trip_date=timezone.localdate(),
            status="CONFIRMADA",
            route=self.route,
        )
        Trip.objects.create(
            trip_date=timezone.localdate(),
            status="CONFIRMADA",
            route=self.route,
        )
        Trip.objects.create(
            trip_date=timezone.localdate(),
            status="EM ANDAMENTO",
            route=self.route,
        )
        Trip.objects.create(
            trip_date=timezone.localdate(),
            status="CANCELADA",
            route=self.route,
        )

        self.client.force_authenticate(user=self.admin_user)
        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["total_trips"], 4)
        self.assertIn("trips", response.data)
        self.assertIn("days", response.data)

        status_map = {item["label"]: item["value"] for item in response.data["trips"]}
        self.assertEqual(status_map["CONFIRMADA"], 2)
        self.assertEqual(status_map["EM ANDAMENTO"], 1)
        self.assertEqual(status_map["CANCELADA"], 1)

    def test_returns_empty_counts_when_no_trips_exist(self):
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["total_trips"], 0)
        self.assertEqual(response.data["trips"], [])

    def test_fails_without_authentication(self):
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class TripsStatsByRouteViewTests(DashboardStatsBaseTest):
    """GET /api/dashboard/trips/routes/"""

    def setUp(self):
        super().setUp()
        self.url = f"{BASE_URL}/trips/routes/"

    def test_returns_route_data_when_routes_and_trips_exist(self):
        route_a = Route.objects.create(
            origin="City A",
            destiny="City B",
            departure_time="08:00:00",
            arrival_time="10:00:00",
            administrator=self.admin_profile,
        )
        route_b = Route.objects.create(
            origin="City C",
            destiny="City D",
            departure_time="09:00:00",
            arrival_time="11:00:00",
            administrator=self.admin_profile,
        )
        today = timezone.localdate()
        Trip.objects.create(trip_date=today, status="CONFIRMADA", route=route_a)
        Trip.objects.create(trip_date=today, status="CONFIRMADA", route=route_a)
        Trip.objects.create(trip_date=today, status="CONFIRMADA", route=route_b)

        self.client.force_authenticate(user=self.admin_user)
        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)

        route_map = {item["route_id"]: item["total_trips"] for item in response.data}
        self.assertEqual(route_map[route_a.id], 2)
        self.assertEqual(route_map[route_b.id], 1)

        for item in response.data:
            self.assertIn("origin", item)
            self.assertIn("destiny", item)
            self.assertIn("departure_time", item)


class TripsStatsByDateViewTests(DashboardStatsBaseTest):
    """GET /api/dashboard/trips/dates/"""

    def setUp(self):
        super().setUp()
        self.url = f"{BASE_URL}/trips/dates/"
        self.route = Route.objects.create(
            origin="City A",
            destiny="City B",
            departure_time="08:00:00",
            arrival_time="10:00:00",
            administrator=self.admin_profile,
        )

    def test_returns_date_grouped_data(self):
        today = timezone.localdate()
        yesterday = today - timedelta(days=1)

        Trip.objects.create(trip_date=today, status="CONFIRMADA", route=self.route)
        Trip.objects.create(trip_date=today, status="CONFIRMADA", route=self.route)
        Trip.objects.create(trip_date=yesterday, status="CONFIRMADA", route=self.route)

        self.client.force_authenticate(user=self.admin_user)
        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        date_map = {str(item["trip_date"]): item["total"] for item in response.data}
        self.assertEqual(date_map[str(today)], 2)
        self.assertEqual(date_map[str(yesterday)], 1)


class TripsInProgressViewTests(DashboardStatsBaseTest):
    """GET /api/dashboard/trips/in-progress/"""

    def setUp(self):
        super().setUp()
        self.url = f"{BASE_URL}/trips/in-progress/"
        self.route = Route.objects.create(
            origin="City A",
            destiny="City B",
            departure_time="08:00:00",
            arrival_time="10:00:00",
            administrator=self.admin_profile,
        )

    def test_returns_only_in_progress_trips(self):
        today = timezone.localdate()
        Trip.objects.create(trip_date=today, status="EM ANDAMENTO", route=self.route)
        Trip.objects.create(trip_date=today, status="EM ANDAMENTO", route=self.route)
        Trip.objects.create(trip_date=today, status="CONFIRMADA", route=self.route)
        Trip.objects.create(trip_date=today, status="CONCLUÍDA", route=self.route)

        self.client.force_authenticate(user=self.admin_user)
        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["total_trips"], 2)

    def test_returns_empty_list_when_no_trips_in_progress(self):
        today = timezone.localdate()
        Trip.objects.create(trip_date=today, status="CONFIRMADA", route=self.route)

        self.client.force_authenticate(user=self.admin_user)
        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["total_trips"], 0)


class BusStatsViewTests(DashboardStatsBaseTest):
    """GET /api/dashboard/buses/"""

    def setUp(self):
        super().setUp()
        self.url = f"{BASE_URL}/buses/"

    def test_returns_bus_fleet_stats(self):
        Bus.objects.create(
            number_plate="ABC-1000",
            seating_capacity=40,
            brand="Mercedes",
            status="ATIVO",
        )
        Bus.objects.create(
            number_plate="ABC-2000",
            seating_capacity=42,
            brand="Volvo",
            status="MANUTENÇÃO",
        )

        self.client.force_authenticate(user=self.admin_user)
        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["total_buses"], 2)


class UsersDistributionViewTests(DashboardStatsBaseTest):
    """GET /api/dashboard/users/distribution/"""

    def setUp(self):
        super().setUp()
        self.url = f"{BASE_URL}/users/distribution/"

    def test_returns_user_type_counts(self):
        user1 = User.objects.create_user(email="student1@test.com", password="pass123")
        StudentProfile.objects.create(user=user1, student_id="S001")
        user2 = User.objects.create_user(email="student2@test.com", password="pass123")
        StudentProfile.objects.create(user=user2, student_id="S002")
        user3 = User.objects.create_user(email="servant1@test.com", password="pass123")
        CivilServantProfile.objects.create(user=user3, civil_servant_id="C001")

        self.client.force_authenticate(user=self.admin_user)
        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["total_users"], 3)
        profile_map = {item["label"]: item["value"] for item in response.data["profiles"]}
        self.assertEqual(profile_map["Estudantes"], 2)
        self.assertEqual(profile_map["Servidores"], 1)

    def test_returns_zero_counts_when_no_users_exist_besides_admin(self):
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["total_users"], 0)
        for item in response.data["profiles"]:
            self.assertEqual(item["value"], 0)


class UsersGrowthViewTests(DashboardStatsBaseTest):
    """GET /api/dashboard/users/growth/"""

    def setUp(self):
        super().setUp()
        self.url = f"{BASE_URL}/users/growth/"

    def test_returns_user_signup_data(self):
        joined_date = timezone.now() - timedelta(days=2)

        user1 = User.objects.create_user(email="student1@test.com", password="pass123")
        StudentProfile.objects.create(user=user1, student_id="S001")
        User.objects.filter(pk=user1.pk).update(date_joined=joined_date)

        user2 = User.objects.create_user(email="servant1@test.com", password="pass123")
        CivilServantProfile.objects.create(user=user2, civil_servant_id="C001")
        User.objects.filter(pk=user2.pk).update(date_joined=joined_date)

        self.client.force_authenticate(user=self.admin_user)
        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["total_users"], 2)
        self.assertIn("days", response.data)


class DriversCountViewTests(DashboardStatsBaseTest):
    """GET /api/dashboard/users/drivers/"""

    def setUp(self):
        super().setUp()
        self.url = f"{BASE_URL}/users/drivers/"

    def test_returns_driver_count(self):
        user1 = User.objects.create_user(email="driver1@test.com", password="pass123")
        DriverProfile.objects.create(user=user1, cnh="12345678901")
        user2 = User.objects.create_user(email="driver2@test.com", password="pass123")
        DriverProfile.objects.create(user=user2, cnh="98765432109")

        self.client.force_authenticate(user=self.admin_user)
        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["total_drivers"], 2)

    def test_returns_zero_when_no_drivers_exist(self):
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["total_drivers"], 0)


class ReservationsVolumeViewTests(DashboardStatsBaseTest):
    """GET /api/dashboard/reservations/volume/"""

    def setUp(self):
        super().setUp()
        self.url = f"{BASE_URL}/reservations/volume/"
        self.route = Route.objects.create(
            origin="City A",
            destiny="City B",
            departure_time="08:00:00",
            arrival_time="10:00:00",
            administrator=self.admin_profile,
        )
        self.trip = Trip.objects.create(
            trip_date=timezone.localdate(),
            status="CONFIRMADA",
            route=self.route,
        )

    def test_returns_reservation_volume(self):
        Reservation.objects.create(status="CONFIRMADA", trip=self.trip)
        Reservation.objects.create(status="CONFIRMADA", trip=self.trip)
        Reservation.objects.create(status="CONFIRMADA", trip=self.trip)

        self.client.force_authenticate(user=self.admin_user)
        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["total_reservations"], 3)
        self.assertIn("days", response.data)

    def test_returns_zero_when_no_reservations_exist(self):
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["total_reservations"], 0)


class ReservationsByStatusViewTests(DashboardStatsBaseTest):
    """GET /api/dashboard/reservations/status/"""

    def setUp(self):
        super().setUp()
        self.url = f"{BASE_URL}/reservations/status/"
        self.route = Route.objects.create(
            origin="City A",
            destiny="City B",
            departure_time="08:00:00",
            arrival_time="10:00:00",
            administrator=self.admin_profile,
        )
        self.trip = Trip.objects.create(
            trip_date=timezone.localdate(),
            status="CONFIRMADA",
            route=self.route,
        )

    def test_returns_status_distribution(self):
        Reservation.objects.create(status="CONFIRMADA", trip=self.trip)
        Reservation.objects.create(status="CONFIRMADA", trip=self.trip)
        Reservation.objects.create(status="PENDENTE", trip=self.trip)
        Reservation.objects.create(status="LISTA SECUNDÁRIA", trip=self.trip)

        self.client.force_authenticate(user=self.admin_user)
        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("statuses", response.data)
        status_map = {item["label"]: item["value"] for item in response.data["statuses"]}
        self.assertEqual(status_map["CONFIRMADA"], 2)
        self.assertEqual(status_map["PENDENTE"], 1)
        self.assertEqual(status_map["LISTA SECUNDÁRIA"], 1)


class ReservationsCheckinStatsViewTests(DashboardStatsBaseTest):
    """GET /api/dashboard/reservations/checkins/"""

    def setUp(self):
        super().setUp()
        self.url = f"{BASE_URL}/reservations/checkins/"
        self.route = Route.objects.create(
            origin="City A",
            destiny="City B",
            departure_time="08:00:00",
            arrival_time="10:00:00",
            administrator=self.admin_profile,
        )
        self.trip = Trip.objects.create(
            trip_date=timezone.localdate(),
            status="CONFIRMADA",
            route=self.route,
        )

    def test_returns_checkin_stats(self):
        Reservation.objects.create(status="CONFIRMADA", trip=self.trip, check_in=True)
        Reservation.objects.create(status="CONFIRMADA", trip=self.trip, check_in=True)
        Reservation.objects.create(status="CONFIRMADA", trip=self.trip, check_in=True)
        Reservation.objects.create(status="CONFIRMADA", trip=self.trip, check_in=False)

        self.client.force_authenticate(user=self.admin_user)
        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["total_checkins"], 3)
        self.assertEqual(response.data["without_checkin"], 1)
        self.assertIn("days", response.data)


class ReservationsMostReservedTripsViewTests(DashboardStatsBaseTest):
    """GET /api/dashboard/reservations/most-reserved-trips/"""

    def setUp(self):
        super().setUp()
        self.url = f"{BASE_URL}/reservations/most-reserved-trips/"
        self.route = Route.objects.create(
            origin="City A",
            destiny="City B",
            departure_time="08:00:00",
            arrival_time="10:00:00",
            administrator=self.admin_profile,
        )

    def test_returns_top_reserved_trips(self):
        trip_a = Trip.objects.create(
            trip_date=timezone.localdate(),
            status="CONFIRMADA",
            route=self.route,
        )
        trip_b = Trip.objects.create(
            trip_date=timezone.localdate(),
            status="CONFIRMADA",
            route=self.route,
        )

        Reservation.objects.create(status="CONFIRMADA", trip=trip_a)
        Reservation.objects.create(status="CONFIRMADA", trip=trip_a)
        Reservation.objects.create(status="CONFIRMADA", trip=trip_a)
        Reservation.objects.create(status="CONFIRMADA", trip=trip_b)

        self.client.force_authenticate(user=self.admin_user)
        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsInstance(response.data, list)
        self.assertEqual(len(response.data), 2)
        self.assertEqual(response.data[0]["total_reservations"], 3)
        self.assertEqual(response.data[1]["total_reservations"], 1)


class DashboardAuthEnforcementTests(DashboardStatsBaseTest):
    """All dashboard endpoints should reject non-admin and unauthenticated requests."""

    def setUp(self):
        super().setUp()
        self.route = Route.objects.create(
            origin="City A",
            destiny="City B",
            departure_time="08:00:00",
            arrival_time="10:00:00",
            administrator=self.admin_profile,
        )
        self.trip = Trip.objects.create(
            trip_date=timezone.localdate(),
            status="CONFIRMADA",
            route=self.route,
        )

        self.endpoints = [
            f"{BASE_URL}/trips/status/",
            f"{BASE_URL}/trips/routes/",
            f"{BASE_URL}/trips/dates/",
            f"{BASE_URL}/trips/buses/",
            f"{BASE_URL}/trips/created/",
            f"{BASE_URL}/trips/in-progress/",
            f"{BASE_URL}/buses/",
            f"{BASE_URL}/users/distribution/",
            f"{BASE_URL}/users/growth/",
            f"{BASE_URL}/users/drivers/",
            f"{BASE_URL}/reservations/volume/",
            f"{BASE_URL}/reservations/status/",
            f"{BASE_URL}/reservations/checkins/",
            f"{BASE_URL}/reservations/most-reserved-trips/",
        ]

    def test_all_dashboard_endpoints_reject_unauthenticated_requests(self):
        for endpoint in self.endpoints:
            with self.subTest(endpoint=endpoint):
                response = self.client.get(endpoint)
                self.assertEqual(
                    response.status_code,
                    status.HTTP_401_UNAUTHORIZED,
                    f"Endpoint {endpoint} did not return 401",
                )

    def test_all_dashboard_endpoints_reject_non_admin_authenticated_requests(self):
        self.client.force_authenticate(user=self.regular_user)
        for endpoint in self.endpoints:
            with self.subTest(endpoint=endpoint):
                response = self.client.get(endpoint)
                self.assertEqual(
                    response.status_code,
                    status.HTTP_403_FORBIDDEN,
                    f"Endpoint {endpoint} did not return 403",
                )

    def test_all_dashboard_endpoints_accept_admin_requests(self):
        self.client.force_authenticate(user=self.admin_user)
        for endpoint in self.endpoints:
            with self.subTest(endpoint=endpoint):
                response = self.client.get(endpoint)
                self.assertEqual(
                    response.status_code,
                    status.HTTP_200_OK,
                    f"Endpoint {endpoint} did not return 200; got {response.status_code}",
                )
