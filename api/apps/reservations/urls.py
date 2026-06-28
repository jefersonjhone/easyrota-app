from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    ActiveReservationListView,
    AvailableTripListView,
    PunishmentHistoryView,
    PunishmentManageViewSet,
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
    path(
        "reservations/grouped-by-trip/",
        ReservationViewSet.as_view({"get": "grouped_by_trip"}),
        name="reservation-grouped-by-trip",
    ),
    path("reservations/", include(router.urls)),
    path(
        "reservations/punishments/",
        PunishmentHistoryView.as_view(),
        name="reservation-punishments-history",
    ),
    path(
        "reservations/punishments/grouped-by-trip/",
        PunishmentManageViewSet.as_view({"get": "grouped_by_trip"}),
        name="admin-punishment-grouped-by-trip",
    ),
    path(
        "reservations/punishments/manage/",
        PunishmentManageViewSet.as_view({"get": "list"}),
        name="admin-punishment-list",
    ),
    path(
        "reservations/punishments/manage/<uuid:pk>/",
        PunishmentManageViewSet.as_view({
            "patch": "partial_update",
            "delete": "destroy",
        }),
        name="admin-punishment-detail",
    ),
]
