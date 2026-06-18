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


class ReservationCreateView(generics.CreateAPIView):
    serializer_class = ReservationSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        user = self.request.user
        reservation = serializer.save(
            student=getattr(user, "student_profile", None),
            civil_servant=getattr(user, "civil_servant_profile", None),
        )

        sync_trip_status(reservation.trip)


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
        available_trips = (
            Trip.objects
            .available_for_reservation()
                     .with_availability_annotations()
                     .order_by("trip_date", "route__departure_time")
        )

        return available_trips


class ReservationViewSet(viewsets.ModelViewSet):
    """ViewSet for managing all reservations by admins."""

    queryset = Reservation.objects.all()
    serializer_class = ManageReservationSerializer
    permission_classes = [IsAdminUser]

    def get_permissions(self):
        if self.action == "cancel":
            return [IsAuthenticated()]

        if self.action == "checkin":
            return [IsDriver(), IsSuperAdmin()]

        return super().get_permissions()

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
                "-id"
            )
        return Punishment.objects.none()
