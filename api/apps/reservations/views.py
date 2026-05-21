from datetime import datetime, timedelta

from django.db.models import Count, Q
from django.utils import timezone
from rest_framework import generics
from rest_framework.permissions import IsAuthenticated

from ..trips.models import Trip
from .models import Reservation
from .serializers import (
    AvailableTripSerializer,
    ReservationHistorySerializer,
    ReservationSerializer,
)


class ReservationCreateView(generics.CreateAPIView):
    serializer_class = ReservationSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        user = self.request.user

        if hasattr(user, "student_profile"):
            serializer.save(student=user.student_profile)

        elif hasattr(user, "civil_servant_profile"):
            serializer.save(civil_servant=user.civil_servant_profile)


class ReservationHistoryView(generics.ListAPIView):
    """Trips history page."""

    serializer_class = ReservationHistorySerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):

        user = self.request.user

        if hasattr(user, "student_profile"):
            return (
                Reservation.objects
                .filter(student=user.student_profile)
                .select_related("trip", "trip__route")
                .order_by("-created_at")
            )

        if hasattr(user, "civil_servant_profile"):
            return (
                Reservation.objects
                .filter(civil_servant=user.civil_servant_profile)
                .select_related("trip", "trip__route")
                .order_by("-created_at")
            )

        return Reservation.objects.none()


class AvailableTripListView(generics.ListAPIView):
    """Returns trips available for reservation to the authenticated user."""

    serializer_class = AvailableTripSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        reserved_statuses = ["CONFIRMADA", "PENDENTE"]
        cutoff = timezone.now() + timedelta(hours=3)
        current_tz = timezone.get_current_timezone()

        available_trips = (
            Trip.objects.filter(status="CONFIRMADA")
            .select_related("route", "bus")
            .annotate(
                reserved_seats=Count(
                    "reservation",
                    filter=Q(reservation__status__in=reserved_statuses),
                )
            )
            .order_by("trip_date", "route__departure_time")
        )

        filtered_trips = []
        for trip in available_trips:
            departure = timezone.make_aware(
                datetime.combine(trip.trip_date, trip.route.departure_time),
                current_tz,
            )

            available_seats = trip.bus.seating_capacity - getattr(
                trip, "reserved_seats", 0
                )
            if departure <= cutoff or available_seats <= 0:
                continue

            filtered_trips.append(trip)

        return filtered_trips
