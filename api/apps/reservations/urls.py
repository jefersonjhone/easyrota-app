from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    ReservationCreateView,
    ReservationHistoryView,
)

urlpatterns = [
    path("reservations/", ReservationCreateView.as_view(), name="reservation-create"),
    path("reservations/history/", ReservationHistoryView.as_view(), name="reservation-history"),
]
