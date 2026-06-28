from django.db import transaction
from django.db.models import Count, Exists, OuterRef, Q
from rest_framework import generics, mixins, status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied
from rest_framework.permissions import IsAdminUser, IsAuthenticated
from rest_framework.response import Response

from apps.trips.services.checkin_service import CheckinService
from apps.trips.services.trip_status_service import TripStatusService

from ..trips.models import Trip
from ..users.permissions import IsDriver, IsSuperAdmin
from .models import Punishment, Reservation
from .serializers import (
    ActiveReservationSerializer,
    AdminCreateReservationSerializer,
    AdminPunishmentListSerializer,
    AdminPunishmentUpdateSerializer,
    AdminReservationListSerializer,
    AdminTripPunishmentsGroupSerializer,
    AdminTripReservationsGroupSerializer,
    AvailableTripSerializer,
    ManageReservationSerializer,
    PunishmentHistorySerializer,
    ReservationHistorySerializer,
    ReservationSerializer,
)
from .services.constants import ACTIVE_RESERVATION_STATUSES
from .services.reservation_service import ReservationService


class ReservationRetrieveView(generics.RetrieveAPIView):
    serializer_class = ReservationSerializer
    permission_classes = [IsAuthenticated]


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

        return qs.exclude(trip__status__in=["CANCELADA", "CONCLUÍDA"]).order_by(
            "-created_at"
        )

    def perform_create(self, serializer):
        user = self.request.user
        reservation = serializer.save(
            student=getattr(user, "student_profile", None),
            civil_servant=getattr(user, "civil_servant_profile", None),
        )

        TripStatusService.sync_trip_status(reservation.trip)


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

        return qs.exclude(trip__status__in=["CANCELADA", "CONCLUÍDA"]).order_by(
            "trip__trip_date", "trip__route__departure_time"
        )


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

        return qs.filter(trip__status__in=["CANCELADA", "CONCLUÍDA"]).order_by(
            "-created_at"
        )


class AvailableTripListView(generics.ListAPIView):
    """Returns trips available for reservation to the authenticated user."""

    serializer_class = AvailableTripSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
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
                user_is_reserved=Exists(
                    Reservation.objects.filter(
                        trip=OuterRef("pk"),
                        student=getattr(user, "student_profile", None),
                        civil_servant=getattr(user, "civil_servant_profile", None),
                    )
                    if hasattr(user, "student_profile")
                    or hasattr(user, "civil_servant_profile")
                    else Reservation.objects.none()
                ),
            )
            .order_by("trip_date", "route__departure_time")
        )

        return available_trips


class ReservationViewSet(viewsets.ModelViewSet):
    """ViewSet for managing all reservations by admins."""

    queryset = Reservation.objects.all()
    permission_classes = [IsAdminUser]

    def get_queryset(self):
        qs = Reservation.objects.select_related(
            "trip__route",
            "student__user",
            "civil_servant__user",
            "guest_passenger",
        ).all()

        q = self.request.query_params.get("q")
        status = self.request.query_params.get("status")
        passenger_type = self.request.query_params.get("passenger_type")
        date_from = self.request.query_params.get("date_from")
        date_to = self.request.query_params.get("date_to")

        if q:
            qs = qs.filter(
                Q(student__user__full_name__icontains=q)
                | Q(civil_servant__user__full_name__icontains=q)
                | Q(guest_passenger__full_name__icontains=q)
                | Q(trip__id__icontains=q)
            )
        if status:
            qs = qs.filter(status=status)
        if passenger_type == "ESTUDANTE":
            qs = qs.filter(student__isnull=False)
        elif passenger_type == "SERVIDOR":
            qs = qs.filter(civil_servant__isnull=False)
        elif passenger_type == "CONVIDADO":
            qs = qs.filter(guest_passenger__isnull=False)
        if date_from:
            qs = qs.filter(trip__trip_date__gte=date_from)
        if date_to:
            qs = qs.filter(trip__trip_date__lte=date_to)

        return qs.order_by("-created_at")

    def get_serializer_class(self):
        if self.action == "admin_create":
            return AdminCreateReservationSerializer
        if self.action in ("list"):
            return AdminReservationListSerializer
        elif self.action == "retrieve":
            if self.request.user.is_superuser:
                return AdminReservationListSerializer
            return ActiveReservationSerializer
        return ManageReservationSerializer

    def get_permissions(self):
        if self.action == "cancel":
            return [IsAuthenticated()]
        elif self.action == "checkin":
            return [IsDriver(), IsSuperAdmin()]
        elif self.action == "retrieve":
            return [IsAuthenticated()]
        elif self.action in ("create", "update", "partial_update", "destroy"):
            return [IsAdminUser()]
        else:
            return [IsAuthenticated()]
        return super().get_permissions()

    @action(detail=False, methods=["get"], url_path="grouped-by-trip")
    def grouped_by_trip(self, request):
        qs = self.get_queryset().select_related("trip__route")
        trip_data = {}
        for r in qs.iterator():
            tid = r.trip_id
            if tid not in trip_data:
                trip_data[tid] = {
                    "trip_id": tid,
                    "trip_date": r.trip.trip_date,
                    "departure_time": r.trip.route.departure_time,
                    "route": f"{r.trip.route.origin} → {r.trip.route.destiny}",
                    "trip_status": r.trip.status,
                    "reservations": [],
                }
            trip_data[tid]["reservations"].append(r)

        groups = list(trip_data.values())
        for g in groups:
            g["reservation_count"] = len(g["reservations"])

        serializer = AdminTripReservationsGroupSerializer(groups, many=True)
        return Response(serializer.data)

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
        ReservationService.promote_next_waitlisted(trip)
        TripStatusService.sync_trip_status(trip)

        return Response(
            {"status": "Reserva cancelada com sucesso."},
            status=status.HTTP_200_OK,
        )

    @action(detail=False, methods=["post"])
    def admin_create(self, request):
        serializer = AdminCreateReservationSerializer(
            data=request.data, context={"request": request}
        )
        serializer.is_valid(raise_exception=True)
        reservation = serializer.save()
        return Response(
            AdminReservationListSerializer(reservation).data,
            status=status.HTTP_201_CREATED,
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


class PunishmentManageViewSet(
    mixins.ListModelMixin,
    mixins.UpdateModelMixin,
    mixins.DestroyModelMixin,
    viewsets.GenericViewSet,
):
    permission_classes = [IsAdminUser]

    def get_serializer_class(self):
        if self.action == "partial_update":
            return AdminPunishmentUpdateSerializer
        return AdminPunishmentListSerializer

    def get_queryset(self):
        qs = Punishment.objects.select_related(
            "student__user", "reservation__trip__route"
        ).all()

        q = self.request.query_params.get("q")
        is_active = self.request.query_params.get("is_active")
        date_from = self.request.query_params.get("date_from")
        date_to = self.request.query_params.get("date_to")

        if q:
            qs = qs.filter(
                Q(student__user__full_name__icontains=q)
                | Q(student__student_id__icontains=q)
                | Q(description__icontains=q)
            )
        if is_active is not None:
            qs = qs.filter(is_active=is_active == "true")
        if date_from:
            qs = qs.filter(created_at__gte=date_from)
        if date_to:
            qs = qs.filter(created_at__lte=date_to)

        return qs.order_by("-created_at")

    @action(detail=False, methods=["get"], url_path="grouped-by-trip")
    def grouped_by_trip(self, request):
        qs = self.get_queryset().select_related(
            "student__user", "reservation__trip__route"
        )
        trip_data = {}
        for p in qs.iterator():
            tid = p.reservation.trip_id
            if tid not in trip_data:
                trip_data[tid] = {
                    "trip_id": tid,
                    "trip_date": p.reservation.trip.trip_date,
                    "departure_time": p.reservation.trip.route.departure_time,
                    "route": (
                        f"{p.reservation.trip.route.origin}"
                        f" → {p.reservation.trip.route.destiny}"
                    ),
                    "punishments": [],
                }
            trip_data[tid]["punishments"].append(p)

        groups = list(trip_data.values())
        for g in groups:
            g["punishment_count"] = len(g["punishments"])

        serializer = AdminTripPunishmentsGroupSerializer(groups, many=True)
        return Response(serializer.data)
