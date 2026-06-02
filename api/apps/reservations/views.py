from django.db import transaction
from django.db.models import Count, Q
from django.utils import timezone
from rest_framework import generics, status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied
from rest_framework.permissions import IsAdminUser, IsAuthenticated
from rest_framework.response import Response

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
    ACTIVE_RESERVATION_STATUSES,
    WAITLIST_STATUS,
    evict_lowest_priority_active_reservation,
    get_reservation_passenger_name,
    promote_next_waitlisted_reservation,
    sync_trip_status,
    trip_has_capacity,
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
            .filter(status__in=["CONFIRMADA", "RISCO DE CANCELAMENTO"])
            .select_related("route", "bus")
            .annotate(
                active_reservation_seats=Count(
                    "reservation",
                    filter=Q(reservation__status__in=ACTIVE_RESERVATION_STATUSES),
                    distinct=True,
                ),
                passenger_seats=Count("trip_passengers", distinct=True),
            )
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
        """
        It records the passenger's presence on the bus.
        """
        reservation = self.get_object()
        evicted_passenger = None
        priority_check_in = bool(
            reservation.civil_servant_id or reservation.guest_passenger_id
        )

        if reservation.status == WAITLIST_STATUS:
            if not priority_check_in:
                return Response(
                    {"error": "Apenas reservas ativas podem fazer check-in."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            if not trip_has_capacity(reservation.trip):
                evicted = evict_lowest_priority_active_reservation(reservation.trip)
                if evicted is None:
                    transaction.set_rollback(True)
                    return Response(
                        {"error": "Nao ha vaga disponivel para priorizar o passageiro."},
                        status=status.HTTP_409_CONFLICT,
                    )

                evicted_passenger = {
                    "name": get_reservation_passenger_name(evicted),
                    "reservation_id": evicted.id,
                }

            reservation.status = "CONFIRMADA"
        elif reservation.status not in ACTIVE_RESERVATION_STATUSES:
            return Response(
                {"error": "Apenas reservas ativas podem fazer check-in."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        reservation.check_in = True
        reservation.checkin_date = timezone.now()
        reservation.save(update_fields=["check_in", "checkin_date", "status"])
        sync_trip_status(reservation.trip)

        response_payload = {"status": "Check-in realizado com sucesso."}
        if evicted_passenger is not None:
            response_payload["evicted_passenger"] = evicted_passenger
            response_payload["evicted_passengers"] = [evicted_passenger]

        return Response(
            response_payload,
            status=status.HTTP_200_OK,
        )

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
