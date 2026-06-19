from django.db import transaction
from rest_framework import generics, status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied
from rest_framework.permissions import IsAdminUser, IsAuthenticated
from rest_framework.response import Response

from apps.trips.services.checkin_service import CheckinService

from ..trips.models import Trip
from ..users.permissions import IsDriver, IsSuperAdmin
from .models import Punishment, Reservation
from .serializers import (
    ActiveReservationSerializer,
    AvailableTripSerializer,
    ManageReservationSerializer,
    PunishmentHistorySerializer,
    ReservationHistorySerializer,
    ReservationSerializer,
)
from .services import (
    promote_next_waitlisted_reservation,
    sync_trip_status,
)


class ReservationCreateView(generics.ListCreateAPIView):
    serializer_class = ReservationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        qs = Reservation.objects.select_related("trip", "trip__route")

        if hasattr(user, "student_profile"):
            qs = qs.filter(student=user.student_profile)
        elif hasattr(user, "civil_servant_profile"):
            qs = qs.filter(civil_servant=user.civil_servant_profile)
        else:
            return Reservation.objects.none()

        return qs.exclude(trip__status__in=["CANCELADA", "CONCLUÍDA"]).order_by("-created_at")

    def perform_create(self, serializer):
        user = self.request.user
        reservation = serializer.save(
            student=getattr(user, "student_profile", None),
            civil_servant=getattr(user, "civil_servant_profile", None),
        )

        sync_trip_status(reservation.trip)


class ActiveReservationListView(generics.ListAPIView):
    """Returns active (non-finished) reservations for the authenticated user."""

    serializer_class = ActiveReservationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        qs = Reservation.objects.select_related(
            "trip", "trip__route", "trip__bus", "trip__driver__user"
        )

        if hasattr(user, "student_profile"):
            qs = qs.filter(student=user.student_profile)
        elif hasattr(user, "civil_servant_profile"):
            qs = qs.filter(civil_servant=user.civil_servant_profile)
        else:
            return Reservation.objects.none()

        return qs.exclude(trip__status__in=["CANCELADA", "CONCLUÍDA"]).order_by("trip__trip_date", "trip__route__departure_time")


class ReservationHistoryView(generics.ListAPIView):
    """Trips history page — only finished trips."""

    serializer_class = ReservationHistorySerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        qs = Reservation.objects.select_related("trip", "trip__route")

        if hasattr(user, "student_profile"):
            qs = qs.filter(student=user.student_profile)
        elif hasattr(user, "civil_servant_profile"):
            qs = qs.filter(civil_servant=user.civil_servant_profile)
        else:
            return Reservation.objects.none()

        return qs.filter(trip__status__in=["CANCELADA", "CONCLUÍDA"]).order_by("-created_at")


class AvailableTripListView(generics.ListAPIView):
    """Returns trips available for reservation to the authenticated user."""

    serializer_class = AvailableTripSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        available_trips = (
            Trip.objects
            .available_for_reservation()
                     .with_availability_annotations()
                     .order_by("trip_date", "route__departure_time")
        )

        return available_trips


class ReservationViewSet(viewsets.ModelViewSet):
    """ViewSet for managing all reservations by admins."""

    queryset = Reservation.objects.select_related(
        "trip", "trip__route", "trip__bus", "trip__driver__user"
    )
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.action == "retrieve":
            return ActiveReservationSerializer
        return ManageReservationSerializer

    def get_permissions(self):
        if self.action == "cancel":
            return [IsAuthenticated()]

        if self.action == "checkin":
            return [IsDriver(), IsSuperAdmin()]

        if self.action in ("create", "update", "partial_update", "destroy"):
            return [IsAdminUser()]

        return super().get_permissions()

    def get_queryset(self):
        user = self.request.user

        if self.action == "retrieve":
            if hasattr(user, "student_profile"):
                return self.queryset.filter(student=user.student_profile)
            if hasattr(user, "civil_servant_profile"):
                return self.queryset.filter(civil_servant=user.civil_servant_profile)
            return Reservation.objects.none()

        return self.queryset

    @action(detail=True, methods=["post"])
    @transaction.atomic
    def checkin(self, request, pk=None):
        """Record passenger presence on the bus."""
        reservation = self.get_object()

        try:
            payload, _evicted = CheckinService.perform_on_reservation(reservation)
            return Response(payload, status=status.HTTP_200_OK)
        except CheckinService.Error as exc:
            if exc.status_code == 409:
                transaction.set_rollback(True)
            return Response({"error": exc.detail}, status=exc.status_code)

    @action(detail=True, methods=["post"], permission_classes=[IsAuthenticated])
    def cancel(self, request, pk=None):
        reservation = self.get_object()
        user = request.user

        owns_reservation = (
            hasattr(user, "student_profile")
            and reservation.student_id == user.student_profile.id
        ) or (
            hasattr(user, "civil_servant_profile")
            and reservation.civil_servant_id == user.civil_servant_profile.id
        )

        if not owns_reservation and not request.user.is_staff:
            raise PermissionDenied("Você não pode cancelar esta reserva.")

        trip = reservation.trip
        reservation.delete()
        promote_next_waitlisted_reservation(trip)
        sync_trip_status(trip)

        return Response(
            {"status": "Reserva cancelada com sucesso."},
            status=status.HTTP_200_OK,
        )


class PunishmentHistoryView(generics.ListAPIView):
    """
    Returns the penalty history of the authenticated student.
    """

    serializer_class = PunishmentHistorySerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user

        if hasattr(user, "student_profile"):
            return Punishment.objects.filter(student=user.student_profile).order_by(
                "-created_at"
            )
        return Punishment.objects.none()
