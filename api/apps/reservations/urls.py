from django.urls import path

from .views import (
    AvailableTripListView,
    ReservationCreateView,
    ReservationHistoryView,
)

urlpatterns = [
    path(
        "reservations/available-trips/",
        AvailableTripListView.as_view(),
        name="reservation-available-trips",
    ),
    path("reservations/", ReservationCreateView.as_view(), name="reservation-create"),
    path(
        "reservations/history/",
        ReservationHistoryView.as_view(),
        name="reservation-history",
    ),
]
