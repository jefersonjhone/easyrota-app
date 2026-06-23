from datetime import date, timedelta

from django.contrib.auth import get_user_model
from django.test import TestCase
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from apps.trips.models import Route, Trip
from apps.trips.services import (
    MAX_RECURRING_DAYS,
    create_recurring_trips,
)
from apps.users.models import CustomUser
from apps.users.models.profiles import AdministratorProfile, DriverProfile

User = get_user_model()


class RecurringTripServiceTestCase(TestCase):
    """Unit tests for create_recurring_trips service function."""

    def setUp(self):
        today = timezone.now().date()
        self.admin_user = CustomUser.objects.create_superuser(
            email="admin-recurring@easyrota.com",
            password="password123",
            full_name="Admin Recorrente",
            is_active=True,
            role="admin",
        )
        self.admin_profile = AdministratorProfile.objects.get(user=self.admin_user)

        self.route = Route.objects.create(
            origin="Salvador",
            destiny="Feira",
            departure_time="08:00:00",
            arrival_time="12:00:00",
            administrator=self.admin_profile,
        )

    # --- Service: basic weekday filtering ---

    def test_creates_trips_only_on_selected_weekdays(self):
        """Segunda(0), Quarta(2), Sexta(4) over 7 days → 3 trips."""
        base = date(2026, 7, 6)  # Monday
        trips = create_recurring_trips(
            date_start=base,
            date_end=base + timedelta(days=6),
            weekdays=[0, 2, 4],
            route=self.route,
            status="CONFIRMADA",
        )
        self.assertEqual(len(trips), 3)
        created_dates = {t.trip_date for t in trips}
        self.assertIn(base, created_dates)         # Seg
        self.assertIn(base + timedelta(days=2), created_dates)   # Qua
        self.assertIn(base + timedelta(days=4), created_dates)   # Sex

    def test_date_range_boundaries(self):
        """Range 10-Jun (Qua) to 12-Jun (Sex), weekdays=[3,4] (Qui, Sex)
        → trips on 11 (Qui) and 12 (Sex), not 10 (Qua)."""
        base = date(2026, 6, 10)  # Wednesday
        trips = create_recurring_trips(
            date_start=base,
            date_end=base + timedelta(days=2),
            weekdays=[3, 4],
            route=self.route,
            status="CONFIRMADA",
        )
        self.assertEqual(len(trips), 2)
        dates = {t.trip_date for t in trips}
        self.assertNotIn(base, dates)          # Qua (weekday 2)
        self.assertIn(base + timedelta(days=1), dates)   # Qui (weekday 3)
        self.assertIn(base + timedelta(days=2), dates)   # Sex (weekday 4)

    def test_no_trips_when_no_weekday_in_range(self):
        """weekdays=[5,6] (Sáb, Dom) over Seg-Sex → 0 trips."""
        base = date(2026, 7, 6)  # Monday
        trips = create_recurring_trips(
            date_start=base,
            date_end=base + timedelta(days=4),  # até Sexta
            weekdays=[5, 6],
            route=self.route,
            status="CONFIRMADA",
        )
        self.assertEqual(len(trips), 0)

    def test_single_day_match(self):
        """date_start == date_end and weekday matches → 1 trip."""
        base = date(2026, 7, 6)  # Monday
        trips = create_recurring_trips(
            date_start=base,
            date_end=base,
            weekdays=[0],
            route=self.route,
            status="CONFIRMADA",
        )
        self.assertEqual(len(trips), 1)
        self.assertEqual(trips[0].trip_date, base)

    def test_single_day_no_match(self):
        """date_start == date_end but weekday does NOT match → 0 trips."""
        base = date(2026, 7, 6)  # Monday
        trips = create_recurring_trips(
            date_start=base,
            date_end=base,
            weekdays=[1],  # Tuesday
            route=self.route,
            status="CONFIRMADA",
        )
        self.assertEqual(len(trips), 0)

    # --- Service: bus/driver always None ---

    def test_bus_and_driver_are_null(self):
        """All created trips have bus=None and driver=None."""
        base = date(2026, 7, 6)  # Monday
        trips = create_recurring_trips(
            date_start=base,
            date_end=base + timedelta(days=6),
            weekdays=[0, 2, 4],
            route=self.route,
            status="CONFIRMADA",
        )
        for t in trips:
            self.assertIsNone(t.bus)
            self.assertIsNone(t.driver)

    # --- Service: correct fields ---

    def test_all_trips_have_correct_route_and_status(self):
        """route and status match the arguments."""
        base = date(2026, 7, 6)
        trips = create_recurring_trips(
            date_start=base,
            date_end=base + timedelta(days=13),
            weekdays=[0],
            route=self.route,
            status="RISCO DE CANCELAMENTO",
        )
        for t in trips:
            self.assertEqual(t.route, self.route)
            self.assertEqual(t.status, "RISCO DE CANCELAMENTO")

    def test_returns_correct_count(self):
        """2 Mondays in 14 days → 2 trips."""
        base = date(2026, 7, 6)  # Monday
        trips = create_recurring_trips(
            date_start=base,
            date_end=base + timedelta(days=13),
            weekdays=[0],
            route=self.route,
            status="CONFIRMADA",
        )
        self.assertEqual(len(trips), 2)

    # --- Service: 3-month limit behaviour (service itself does not enforce) ---

    def test_range_within_limit_succeeds(self):
        """Service accepts range up to MAX_RECURRING_DAYS."""
        base = date(2026, 7, 6)
        trips = create_recurring_trips(
            date_start=base,
            date_end=base + timedelta(days=MAX_RECURRING_DAYS),
            weekdays=[0],
            route=self.route,
            status="CONFIRMADA",
        )
        expected = int((MAX_RECURRING_DAYS + 1) / 7) + 1
        self.assertGreaterEqual(len(trips), expected // 2)


class RecurringTripAPITestCase(APITestCase):
    """Integration tests for the recurring branch in TripViewSet.create."""

    def setUp(self):
        self.today = timezone.now().date()
        self.tomorrow = self.today + timedelta(days=1)

        self.admin_user = CustomUser.objects.create_superuser(
            email="admin-recurring-api@easyrota.com",
            password="password123",
            full_name="Admin Recorrente API",
            is_active=True,
            role="admin",
        )
        self.admin_profile = AdministratorProfile.objects.get(user=self.admin_user)

        self.driver_user = CustomUser.objects.create_user(
            email="driver-recurring@easyrota.com",
            password="password123",
            full_name="Motorista",
            is_active=True,
        )
        self.driver_profile = DriverProfile.objects.create(
            user=self.driver_user, cnh="12345678901"
        )

        self.bus = Trip._meta.get_field("bus").related_model.objects.create(
            number_plate="REC-1234",
            seating_capacity=40,
            brand="Mercedes-Benz",
            administrator=self.admin_profile,
        )

        self.route = Route.objects.create(
            origin="Salvador",
            destiny="Feira",
            departure_time="08:00:00",
            arrival_time="12:00:00",
            administrator=self.admin_profile,
        )

        self.trip_list_url = reverse("trip-list")

    # --- Happy paths ---

    def test_admin_creates_recurring_trips_success(self):
        """POST with valid recurring payload → 201."""
        self.client.force_authenticate(user=self.admin_user)
        payload = {
            "recurring": True,
            "weekdays": [0, 2, 4],
            "date_start": self.tomorrow.isoformat(),
            "date_end": (self.tomorrow + timedelta(days=13)).isoformat(),
            "route": self.route.id,
            "status": "CONFIRMADA",
        }
        response = self.client.post(self.trip_list_url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn("detail", response.data)

    def test_recurring_creates_multiple_trips(self):
        """2 Domingos (JS 0) in 8 days → exactly 2 Trips in DB."""
        self.client.force_authenticate(user=self.admin_user)
        base = self.tomorrow
        # Align to Sunday (Python weekday 6)
        days_until_sun = (6 - base.weekday()) % 7
        if days_until_sun == 0:
            days_until_sun = 7
        first_sun = base + timedelta(days=days_until_sun)

        payload = {
            "recurring": True,
            "weekdays": [0],  # JS: Dom
            "date_start": first_sun.isoformat(),
            "date_end": (first_sun + timedelta(days=7)).isoformat(),
            "route": self.route.id,
            "status": "CONFIRMADA",
        }
        response = self.client.post(self.trip_list_url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        # 2 Sundays (first and 7 days later) → 2 trips
        self.assertEqual(Trip.objects.count(), 2)

    def test_recurring_trips_have_no_bus_or_driver(self):
        """All created trips have bus=None and driver=None."""
        self.client.force_authenticate(user=self.admin_user)
        payload = {
            "recurring": True,
            "weekdays": [0],
            "date_start": self.tomorrow.isoformat(),
            "date_end": (self.tomorrow + timedelta(days=6)).isoformat(),
            "route": self.route.id,
            "status": "CONFIRMADA",
        }
        response = self.client.post(self.trip_list_url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        for trip in Trip.objects.all():
            self.assertIsNone(trip.bus)
            self.assertIsNone(trip.driver)

    def test_recurring_ignores_bus_and_driver_in_payload(self):
        """Even if bus/driver sent, created trips have None."""
        self.client.force_authenticate(user=self.admin_user)
        payload = {
            "recurring": True,
            "weekdays": [0],
            "date_start": self.tomorrow.isoformat(),
            "date_end": (self.tomorrow + timedelta(days=6)).isoformat(),
            "route": self.route.id,
            "status": "CONFIRMADA",
            "bus": self.bus.id,
            "driver": self.driver_profile.id,
        }
        response = self.client.post(self.trip_list_url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        for trip in Trip.objects.all():
            self.assertIsNone(trip.bus)
            self.assertIsNone(trip.driver)

    # --- Permissions ---

    def test_driver_cannot_create_recurring_trips(self):
        """Driver → 403."""
        self.client.force_authenticate(user=self.driver_user)
        payload = {
            "recurring": True,
            "weekdays": [0],
            "date_start": self.tomorrow.isoformat(),
            "date_end": (self.tomorrow + timedelta(days=6)).isoformat(),
            "route": self.route.id,
            "status": "CONFIRMADA",
        }
        response = self.client.post(self.trip_list_url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(Trip.objects.count(), 0)

    # --- Validation: weekdays ---

    def test_recurring_without_weekdays_returns_400(self):
        """Empty weekdays → 400."""
        self.client.force_authenticate(user=self.admin_user)
        payload = {
            "recurring": True,
            "weekdays": [],
            "date_start": self.tomorrow.isoformat(),
            "date_end": (self.tomorrow + timedelta(days=6)).isoformat(),
            "route": self.route.id,
        }
        response = self.client.post(self.trip_list_url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("weekdays", response.data)

    # --- Validation: dates ---

    def test_recurring_without_dates_returns_400(self):
        """Missing date_start → 400."""
        self.client.force_authenticate(user=self.admin_user)
        payload = {
            "recurring": True,
            "weekdays": [0],
            "date_start": "",
            "date_end": (self.tomorrow + timedelta(days=6)).isoformat(),
            "route": self.route.id,
        }
        response = self.client.post(self.trip_list_url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("date", response.data)

    def test_recurring_with_invalid_date_format(self):
        """Invalid date string → 400."""
        self.client.force_authenticate(user=self.admin_user)
        payload = {
            "recurring": True,
            "weekdays": [0],
            "date_start": "invalido",
            "date_end": (self.tomorrow + timedelta(days=6)).isoformat(),
            "route": self.route.id,
        }
        response = self.client.post(self.trip_list_url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("date", response.data)

    def test_recurring_date_start_after_date_end(self):
        """date_start > date_end → 400."""
        self.client.force_authenticate(user=self.admin_user)
        payload = {
            "recurring": True,
            "weekdays": [0],
            "date_start": (self.tomorrow + timedelta(days=6)).isoformat(),
            "date_end": self.tomorrow.isoformat(),
            "route": self.route.id,
        }
        response = self.client.post(self.trip_list_url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("date", response.data)

    # --- Validation: route ---

    def test_recurring_with_nonexistent_route(self):
        """Invalid route_id → 400."""
        self.client.force_authenticate(user=self.admin_user)
        payload = {
            "recurring": True,
            "weekdays": [0],
            "date_start": self.tomorrow.isoformat(),
            "date_end": (self.tomorrow + timedelta(days=6)).isoformat(),
            "route": 99999,
        }
        response = self.client.post(self.trip_list_url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("route", response.data)

    # --- Validation: 3-month limit ---

    def test_recurring_range_exceeds_3_months_returns_400(self):
        """Range > MAX_RECURRING_DAYS → 400."""
        self.client.force_authenticate(user=self.admin_user)
        payload = {
            "recurring": True,
            "weekdays": [0],
            "date_start": self.tomorrow.isoformat(),
            "date_end": (self.tomorrow + timedelta(days=MAX_RECURRING_DAYS + 1)).isoformat(),
            "route": self.route.id,
        }
        response = self.client.post(self.trip_list_url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("date", response.data)

    def test_recurring_range_exactly_at_limit_succeeds(self):
        """Range == MAX_RECURRING_DAYS → 201."""
        self.client.force_authenticate(user=self.admin_user)
        payload = {
            "recurring": True,
            "weekdays": [0],
            "date_start": self.tomorrow.isoformat(),
            "date_end": (self.tomorrow + timedelta(days=MAX_RECURRING_DAYS)).isoformat(),
            "route": self.route.id,
        }
        response = self.client.post(self.trip_list_url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    # --- Weekday conversion ---

    def test_weekday_conversion_js_to_python(self):
        """JS weekdays [0,6] (Dom, Sáb) create trips on Sáb and Dom, not Seg."""
        self.client.force_authenticate(user=self.admin_user)
        base = self.tomorrow

        # find the next Saturday (weekday 5 in Python)
        days_until_sat = (5 - base.weekday()) % 7
        if days_until_sat == 0:
            days_until_sat = 7
        next_sat = base + timedelta(days=days_until_sat)
        next_sun = next_sat + timedelta(days=1)

        payload = {
            "recurring": True,
            "weekdays": [0, 6],  # JS: Dom(0), Sáb(6)
            "date_start": next_sat.isoformat(),
            "date_end": (next_sun).isoformat(),
            "route": self.route.id,
            "status": "CONFIRMADA",
        }
        response = self.client.post(self.trip_list_url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        created_dates = {t.trip_date for t in Trip.objects.all()}
        self.assertIn(next_sat, created_dates)
        self.assertIn(next_sun, created_dates)

    def test_recurring_returns_detail_message(self):
        """Response body contains success message."""
        self.client.force_authenticate(user=self.admin_user)
        payload = {
            "recurring": True,
            "weekdays": [0],
            "date_start": self.tomorrow.isoformat(),
            "date_end": (self.tomorrow + timedelta(days=6)).isoformat(),
            "route": self.route.id,
        }
        response = self.client.post(self.trip_list_url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(
            response.data["detail"], "Viagens recorrentes criadas com sucesso."
        )
