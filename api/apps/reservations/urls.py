from django.urls import path

from .views import (
    ReservationCreateView,
    ReservationHistoryView,
)

urlpatterns = [
    path("reservations/", ReservationCreateView.as_view(), name="reservation-create"),
    path(
        "reservations/history/",
        ReservationHistoryView.as_view(),
        name="reservation-history",
    ),
]
