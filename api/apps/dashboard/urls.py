from django.urls import path

from apps.dashboard.views.bus import BusStatsView
from apps.dashboard.views.reservation import (
    ReservationsByStatusView,
    ReservationsCheckinStatsView,
    ReservationsMostReservedTripsView,
    ReservationsVolumeView,
)
from apps.dashboard.views.trip import (
    TripsInProgressView,
    TripsStatsByBusView,
    TripsStatsByCreatedView,
    TripsStatsByDateView,
    TripsStatsByRouteView,
    TripsStatsByStatusView,
)
from apps.dashboard.views.user import (
    DriversCountView,
    UsersDistributionView,
    UsersGrowthView,
)

urlpatterns = [
    # Trips
    path(
        "trips/status/",
        TripsStatsByStatusView.as_view(),
        name="trips-stats-status",
    ),
    path(
        "trips/routes/",
        TripsStatsByRouteView.as_view(),
        name="trips-stats-routes",
    ),
    path(
        "trips/dates/",
        TripsStatsByDateView.as_view(),
        name="trips-stats-dates",
    ),
    path(
        "trips/buses/",
        TripsStatsByBusView.as_view(),
        name="trips-stats-buses",
    ),
    path(
        "trips/created/",
        TripsStatsByCreatedView.as_view(),
        name="trips-created",
    ),
    path(
        "trips/in-progress/",
        TripsInProgressView.as_view(),
        name="trips-in-progress",
    ),
    # Buses
    path(
        "buses/",
        BusStatsView.as_view(),
        name="buses-stats-drivers",
    ),
    # Users
    path(
        "users/distribution/",
        UsersDistributionView.as_view(),
        name="users-distribution",
    ),
    path(
        "users/growth/",
        UsersGrowthView.as_view(),
        name="users-growth",
    ),
    path(
        "users/drivers/",
        DriversCountView.as_view(),
        name="users-drivers",
    ),
    # Reservations
    path(
        "reservations/volume/",
        ReservationsVolumeView.as_view(),
        name="reservations-volume",
    ),
    path(
        "reservations/status/",
        ReservationsByStatusView.as_view(),
        name="reservations-status",
    ),
    path(
        "reservations/checkins/",
        ReservationsCheckinStatsView.as_view(),
        name="reservations-checkins",
    ),
    path(
        "reservations/most-reserved-trips/",
        ReservationsMostReservedTripsView.as_view(),
        name="reservations-most-reserved-trips",
    ),
]
