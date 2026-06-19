from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    ActiveReservationListView,
    AvailableTripListView,
    PunishmentHistoryView,
    ReservationCreateView,
    ReservationHistoryView,
    ReservationViewSet,
)

router = DefaultRouter()
router.register(r"manage", ReservationViewSet, basename="reservation-manage")

urlpatterns = [
    path(
        "reservations/available-trips/",
        AvailableTripListView.as_view(),
        name="reservation-available-trips",
    ),
    path("reservations/", ReservationCreateView.as_view(), name="reservation-create"),
    path(
        "reservations/active/",
        ActiveReservationListView.as_view(),
        name="reservation-active",
    ),
    path(
        "reservations/history/",
        ReservationHistoryView.as_view(),
        name="reservation-history",
    ),
    path("reservations/", include(router.urls)),
    path(
        "reservations/punishments/",
        PunishmentHistoryView.as_view(),
        name="reservation-punishments-history",
    ),
]
