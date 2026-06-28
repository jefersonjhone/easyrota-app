from datetime import time, timedelta

from django.contrib.auth import get_user_model
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from apps.trips.models import Bus, Route, Trip
from apps.users.models import CustomUser
from apps.users.models.profiles import (
    AdministratorProfile,
    DriverProfile,
)

User = get_user_model()


class TripAdminBulkDeleteTests(APITestCase):
    """Tests for POST /api/trips/bulk-delete/ (admin-only)."""

    def setUp(self):
        self.url = reverse("trip-bulk-delete")

        self.admin_user = CustomUser.objects.create_superuser(
            email="admin@easyrota.com",
            password="password123",
            full_name="Admin Supremo",
            is_active=True,
            is_staff=True,
            role="admin",
        )
        self.admin_profile = AdministratorProfile.objects.get(user=self.admin_user)

        self.regular_user = CustomUser.objects.create_user(
            email="user@easyrota.com",
            password="password123",
            full_name="Usuário Comum",
            is_active=True,
        )

        self.tomorrow = timezone.now().date() + timedelta(days=1)

        self.route = Route.objects.create(
            origin="Salvador",
            destiny="Feira",
            departure_time=time(8, 0),
            arrival_time=time(12, 0),
            administrator=self.admin_profile,
        )

        self.trip1 = Trip.objects.create(
            trip_date=self.tomorrow,
            route=self.route,
            status="CONFIRMADA",
        )
        self.trip2 = Trip.objects.create(
            trip_date=self.tomorrow,
            route=self.route,
            status="CONFIRMADA",
        )
        self.trip3 = Trip.objects.create(
            trip_date=self.tomorrow,
            route=self.route,
            status="CONFIRMADA",
        )

    def test_admin_can_bulk_delete_multiple_trips(self):
        """Admin can delete multiple trips at once."""
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.post(
            self.url, {"ids": [self.trip1.id, self.trip2.id]}, format="json"
        )
        assert response.status_code == status.HTTP_200_OK
        assert response.data["deleted"] == 2
        assert not Trip.objects.filter(id__in=[self.trip1.id, self.trip2.id]).exists()
        assert Trip.objects.filter(id=self.trip3.id).exists()

    def test_bulk_delete_fails_without_authentication(self):
        """Unauthenticated request to bulk delete returns 401."""
        response = self.client.post(self.url, {"ids": [self.trip1.id]}, format="json")
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_bulk_delete_with_empty_ids_returns_400(self):
        """Bulk delete with empty ids list returns 400."""
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.post(self.url, {"ids": []}, format="json")
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_non_admin_user_cannot_bulk_delete(self):
        """Regular users cannot bulk delete trips."""
        self.client.force_authenticate(user=self.regular_user)
        response = self.client.post(self.url, {"ids": [self.trip1.id]}, format="json")
        assert response.status_code == status.HTTP_403_FORBIDDEN


class TripAdminDetailTests(APITestCase):
    """Tests for GET /api/trips/<id>/admin_detail/."""

    def setUp(self):
        self.tomorrow = timezone.now().date() + timedelta(days=1)

        self.admin_user = CustomUser.objects.create_superuser(
            email="admin@easyrota.com",
            password="password123",
            full_name="Admin Supremo",
            is_active=True,
            is_staff=True,
            role="admin",
        )
        self.admin_profile = AdministratorProfile.objects.get(user=self.admin_user)

        self.driver_user = CustomUser.objects.create_user(
            email="motorista@easyrota.com",
            password="password123",
            full_name="João Motorista",
            is_active=True,
        )
        self.driver_profile = DriverProfile.objects.create(
            user=self.driver_user, cnh="12345678901"
        )

        self.bus = Bus.objects.create(
            number_plate="XYZ-9876",
            seating_capacity=50,
            brand="Volvo",
            administrator=self.admin_profile,
        )

        self.route = Route.objects.create(
            origin="Salvador",
            destiny="Feira",
            departure_time=time(8, 0),
            arrival_time=time(12, 0),
            administrator=self.admin_profile,
        )

        self.trip = Trip.objects.create(
            trip_date=self.tomorrow,
            route=self.route,
            status="CONFIRMADA",
            driver=self.driver_profile,
            bus=self.bus,
            seating_capacity=self.bus.seating_capacity,
        )

        self.url = reverse("trip-admin-detail", args=[self.trip.id])

    def test_admin_can_view_admin_detail(self):
        """Admin can view admin_detail with enriched passenger/driver/bus fields."""
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.get(self.url, format="json")
        assert response.status_code == status.HTTP_200_OK
        assert str(response.data["id"]) == str(self.trip.id)
        assert response.data["trip_date"] == self.tomorrow.isoformat()
        assert response.data["origin"] == "Salvador"
        assert response.data["destiny"] == "Feira"
        assert "driver_name" in response.data
        assert response.data["driver_name"] == "João Motorista"
        assert response.data["driver_cnh"] == "12345678901"
        assert str(response.data["driver_id"]) == str(self.driver_profile.id)
        assert response.data["bus_plate"] == "XYZ-9876"
        assert response.data["bus_brand"] == "Volvo"
        assert response.data["bus_capacity"] == 50
        assert str(response.data["bus_id"]) == str(self.bus.id)
        assert "passengers" in response.data
        assert "active_reservations" in response.data
        assert "checked_in_count" in response.data

    def test_admin_detail_returns_404_for_nonexistent_trip(self):
        """Admin detail returns 404 when trip does not exist."""
        self.client.force_authenticate(user=self.admin_user)
        invalid_url = reverse(
            "trip-admin-detail", args=["00000000-0000-0000-0000-000000000000"]
        )
        response = self.client.get(invalid_url, format="json")
        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_unauthenticated_user_gets_401_for_admin_detail(self):
        """Unauthenticated request to admin_detail returns 401."""
        response = self.client.get(self.url, format="json")
        assert response.status_code == status.HTTP_401_UNAUTHORIZED


class TripAdminAssignDriverTests(APITestCase):
    """Tests for POST /api/trips/<id>/admin_assign_driver/."""

    def setUp(self):
        self.tomorrow = timezone.now().date() + timedelta(days=1)

        self.admin_user = CustomUser.objects.create_superuser(
            email="admin@easyrota.com",
            password="password123",
            full_name="Admin Supremo",
            is_active=True,
            is_staff=True,
            role="admin",
        )
        self.admin_profile = AdministratorProfile.objects.get(user=self.admin_user)

        self.driver_user = CustomUser.objects.create_user(
            email="motorista@easyrota.com",
            password="password123",
            full_name="João Motorista",
            is_active=True,
        )
        self.driver_profile = DriverProfile.objects.create(
            user=self.driver_user, cnh="12345678901"
        )

        self.other_driver_user = CustomUser.objects.create_user(
            email="motorista2@easyrota.com",
            password="password123",
            full_name="Maria Motorista",
            is_active=True,
        )
        self.other_driver_profile = DriverProfile.objects.create(
            user=self.other_driver_user, cnh="98765432101"
        )

        self.route = Route.objects.create(
            origin="Salvador",
            destiny="Feira",
            departure_time=time(8, 0),
            arrival_time=time(12, 0),
            administrator=self.admin_profile,
        )

        self.trip = Trip.objects.create(
            trip_date=self.tomorrow,
            route=self.route,
            status="CONFIRMADA",
        )

    def test_admin_can_assign_driver_to_trip(self):
        """Admin can assign a driver to a trip."""
        self.client.force_authenticate(user=self.admin_user)
        url = reverse("trip-admin-assign-driver", args=[self.trip.id])
        response = self.client.post(
            url, {"driver_id": self.driver_profile.id}, format="json"
        )
        assert response.status_code == status.HTTP_200_OK
        self.trip.refresh_from_db()
        assert self.trip.driver == self.driver_profile

    def test_admin_can_reassign_another_driver(self):
        """Admin can reassign a different driver to the same trip."""
        self.trip.driver = self.driver_profile
        self.trip.save()

        self.client.force_authenticate(user=self.admin_user)
        url = reverse("trip-admin-assign-driver", args=[self.trip.id])
        response = self.client.post(
            url, {"driver_id": self.other_driver_profile.id}, format="json"
        )
        assert response.status_code == status.HTTP_200_OK
        self.trip.refresh_from_db()
        assert self.trip.driver == self.other_driver_profile

    def test_admin_assign_driver_fails_without_authentication(self):
        """Unauthenticated request returns 401."""
        url = reverse("trip-admin-assign-driver", args=[self.trip.id])
        response = self.client.post(
            url, {"driver_id": self.driver_profile.id}, format="json"
        )
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_admin_assign_driver_with_invalid_driver_id_returns_404(self):
        """Assign with non-existent driver_id returns 404."""
        self.client.force_authenticate(user=self.admin_user)
        url = reverse("trip-admin-assign-driver", args=[self.trip.id])
        response = self.client.post(
            url, {"driver_id": "00000000-0000-0000-0000-000000000000"}, format="json"
        )
        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_admin_assign_driver_without_driver_id_returns_400(self):
        """Assign without driver_id returns 400."""
        self.client.force_authenticate(user=self.admin_user)
        url = reverse("trip-admin-assign-driver", args=[self.trip.id])
        response = self.client.post(url, {}, format="json")
        assert response.status_code == status.HTTP_400_BAD_REQUEST


class TripAdminUnassignDriverTests(APITestCase):
    """Tests for POST /api/trips/<id>/admin_unassign_driver/."""

    def setUp(self):
        self.tomorrow = timezone.now().date() + timedelta(days=1)

        self.admin_user = CustomUser.objects.create_superuser(
            email="admin@easyrota.com",
            password="password123",
            full_name="Admin Supremo",
            is_active=True,
            is_staff=True,
            role="admin",
        )
        self.admin_profile = AdministratorProfile.objects.get(user=self.admin_user)

        self.driver_user = CustomUser.objects.create_user(
            email="motorista@easyrota.com",
            password="password123",
            full_name="João Motorista",
            is_active=True,
        )
        self.driver_profile = DriverProfile.objects.create(
            user=self.driver_user, cnh="12345678901"
        )

        self.route = Route.objects.create(
            origin="Salvador",
            destiny="Feira",
            departure_time=time(8, 0),
            arrival_time=time(12, 0),
            administrator=self.admin_profile,
        )

        self.trip = Trip.objects.create(
            trip_date=self.tomorrow,
            route=self.route,
            status="CONFIRMADA",
            driver=self.driver_profile,
        )

    def test_admin_can_unassign_driver_from_trip(self):
        """Admin can unassign a driver from a trip."""
        self.client.force_authenticate(user=self.admin_user)
        url = reverse("trip-admin-unassign-driver", args=[self.trip.id])
        response = self.client.post(url, format="json")
        assert response.status_code == status.HTTP_200_OK
        self.trip.refresh_from_db()
        assert self.trip.driver is None

    def test_admin_unassign_driver_when_no_driver_assigned_returns_200(self):
        """Unassign when no driver is assigned is a no-op returning 200."""
        self.trip.driver = None
        self.trip.save()

        self.client.force_authenticate(user=self.admin_user)
        url = reverse("trip-admin-unassign-driver", args=[self.trip.id])
        response = self.client.post(url, format="json")
        assert response.status_code == status.HTTP_200_OK
        self.trip.refresh_from_db()
        assert self.trip.driver is None

    def test_admin_unassign_driver_fails_without_authentication(self):
        """Unauthenticated request returns 401."""
        url = reverse("trip-admin-unassign-driver", args=[self.trip.id])
        response = self.client.post(url, format="json")
        assert response.status_code == status.HTTP_401_UNAUTHORIZED


class TripAdminAssignBusTests(APITestCase):
    """Tests for POST /api/trips/<id>/admin_assign_bus/."""

    def setUp(self):
        self.tomorrow = timezone.now().date() + timedelta(days=1)

        self.admin_user = CustomUser.objects.create_superuser(
            email="admin@easyrota.com",
            password="password123",
            full_name="Admin Supremo",
            is_active=True,
            is_staff=True,
            role="admin",
        )
        self.admin_profile = AdministratorProfile.objects.get(user=self.admin_user)

        self.bus1 = Bus.objects.create(
            number_plate="ABC-1234",
            seating_capacity=40,
            brand="Mercedes-Benz",
            administrator=self.admin_profile,
        )

        self.bus2 = Bus.objects.create(
            number_plate="XYZ-9876",
            seating_capacity=50,
            brand="Volvo",
            administrator=self.admin_profile,
        )

        self.route = Route.objects.create(
            origin="Salvador",
            destiny="Feira",
            departure_time=time(8, 0),
            arrival_time=time(12, 0),
            administrator=self.admin_profile,
        )

        self.trip = Trip.objects.create(
            trip_date=self.tomorrow,
            route=self.route,
            status="CONFIRMADA",
        )

    def test_admin_can_assign_bus_to_trip(self):
        """Admin can assign a bus to a trip."""
        self.client.force_authenticate(user=self.admin_user)
        url = reverse("trip-admin-assign-bus", args=[self.trip.id])
        response = self.client.post(url, {"bus_id": self.bus1.id}, format="json")
        assert response.status_code == status.HTTP_200_OK
        self.trip.refresh_from_db()
        assert self.trip.bus == self.bus1
        assert self.trip.seating_capacity == self.bus1.seating_capacity

    def test_admin_can_reassign_another_bus(self):
        """Admin can reassign a different bus to the same trip."""
        self.trip.bus = self.bus1
        self.trip.seating_capacity = self.bus1.seating_capacity
        self.trip.save()

        self.client.force_authenticate(user=self.admin_user)
        url = reverse("trip-admin-assign-bus", args=[self.trip.id])
        response = self.client.post(url, {"bus_id": self.bus2.id}, format="json")
        assert response.status_code == status.HTTP_200_OK
        self.trip.refresh_from_db()
        assert self.trip.bus == self.bus2
        assert self.trip.seating_capacity == self.bus2.seating_capacity

    def test_admin_assign_bus_fails_without_authentication(self):
        """Unauthenticated request returns 401."""
        url = reverse("trip-admin-assign-bus", args=[self.trip.id])
        response = self.client.post(url, {"bus_id": self.bus1.id}, format="json")
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_admin_assign_bus_with_invalid_bus_id_returns_404(self):
        """Assign with non-existent bus_id returns 404."""
        self.client.force_authenticate(user=self.admin_user)
        url = reverse("trip-admin-assign-bus", args=[self.trip.id])
        response = self.client.post(
            url, {"bus_id": "00000000-0000-0000-0000-000000000000"}, format="json"
        )
        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_admin_assign_bus_without_bus_id_returns_400(self):
        """Assign without bus_id returns 400."""
        self.client.force_authenticate(user=self.admin_user)
        url = reverse("trip-admin-assign-bus", args=[self.trip.id])
        response = self.client.post(url, {}, format="json")
        assert response.status_code == status.HTTP_400_BAD_REQUEST


class TripAdminUnassignBusTests(APITestCase):
    """Tests for POST /api/trips/<id>/admin_unassign_bus/."""

    def setUp(self):
        self.tomorrow = timezone.now().date() + timedelta(days=1)

        self.admin_user = CustomUser.objects.create_superuser(
            email="admin@easyrota.com",
            password="password123",
            full_name="Admin Supremo",
            is_active=True,
            is_staff=True,
            role="admin",
        )
        self.admin_profile = AdministratorProfile.objects.get(user=self.admin_user)

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

        self.trip = Trip.objects.create(
            trip_date=self.tomorrow,
            route=self.route,
            status="CONFIRMADA",
            bus=self.bus,
            seating_capacity=self.bus.seating_capacity,
        )

    def test_admin_can_unassign_bus_from_trip(self):
        """Admin can unassign a bus from a trip."""
        self.client.force_authenticate(user=self.admin_user)
        url = reverse("trip-admin-unassign-bus", args=[self.trip.id])
        response = self.client.post(url, format="json")
        assert response.status_code == status.HTTP_200_OK
        self.trip.refresh_from_db()
        assert self.trip.bus is None

    def test_admin_unassign_bus_when_no_bus_assigned_returns_200(self):
        """Unassign when no bus is assigned returns 200."""
        self.trip.bus = None
        self.trip.save()

        self.client.force_authenticate(user=self.admin_user)
        url = reverse("trip-admin-unassign-bus", args=[self.trip.id])
        response = self.client.post(url, format="json")
        assert response.status_code == status.HTTP_200_OK
        self.trip.refresh_from_db()
        assert self.trip.bus is None

    def test_admin_unassign_bus_fails_without_authentication(self):
        """Unauthenticated request returns 401."""
        url = reverse("trip-admin-unassign-bus", args=[self.trip.id])
        response = self.client.post(url, format="json")
        assert response.status_code == status.HTTP_401_UNAUTHORIZED


class TripAdminExportPassengersTests(APITestCase):
    """Tests for GET /api/trips/<id>/export_passengers/."""

    def setUp(self):
        self.tomorrow = timezone.now().date() + timedelta(days=1)

        self.admin_user = CustomUser.objects.create_superuser(
            email="admin@easyrota.com",
            password="password123",
            full_name="Admin Supremo",
            is_active=True,
            is_staff=True,
            role="admin",
        )
        self.admin_profile = AdministratorProfile.objects.get(user=self.admin_user)

        self.route = Route.objects.create(
            origin="Salvador",
            destiny="Feira",
            departure_time=time(8, 0),
            arrival_time=time(12, 0),
            administrator=self.admin_profile,
        )

        self.trip = Trip.objects.create(
            trip_date=self.tomorrow,
            route=self.route,
            status="CONFIRMADA",
        )

    def test_admin_can_export_passengers(self):
        """Admin can export passengers and receives a 200 response."""
        self.client.force_authenticate(user=self.admin_user)
        url = reverse("trip-export-passengers", args=[self.trip.id])
        response = self.client.get(url, format="json")
        assert response.status_code == status.HTTP_200_OK
