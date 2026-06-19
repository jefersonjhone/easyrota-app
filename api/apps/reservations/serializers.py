from django.utils import timezone
from rest_framework import serializers

from ..trips.models import GuestPassenger, Trip
from .models import Punishment, Reservation
from .services import (
    is_reservation_open,
    reservation_cutoff,
    trip_has_quorum,
)
from .services.reservation_service import ReservationService


class ReservationSerializer(serializers.ModelSerializer):
    status = serializers.CharField(read_only=True)

    class Meta:
        model = Reservation
        fields = ["id", "trip", "status", "created_at"]
        read_only_fields = ["id", "status", "created_at"]

    def validate_trip(self, trip):
        request = self.context["request"]
        user = request.user

        if not hasattr(user, "student_profile") and not hasattr(
            user, "civil_servant_profile"
        ):
            raise serializers.ValidationError("Perfil sem permissão para reservar.")

        if trip.status == "CANCELADA":
            raise serializers.ValidationError("Esta viagem foi cancelada.")

        if not is_reservation_open(trip):
            raise serializers.ValidationError("Prazo de reserva encerrado.")

        if hasattr(user, "civil_servant_profile"):
            current_date = timezone.localdate()
            if (
                trip.trip_date.isocalendar().week != current_date.isocalendar().week
                or trip.trip_date.isocalendar().year != current_date.isocalendar().year
            ):
                raise serializers.ValidationError(
                    "Servidor só pode reservar durante a semana vigente."
                )

        if (
            hasattr(user, "student_profile")
            and Reservation.objects.filter(
                trip=trip, student=user.student_profile
            ).exists()
        ):
            raise serializers.ValidationError("Você já possui reserva nesta viagem.")

        if (
            hasattr(user, "civil_servant_profile")
            and Reservation.objects.filter(
                trip=trip, civil_servant=user.civil_servant_profile
            ).exists()
        ):
            raise serializers.ValidationError("Você já possui reserva nesta viagem.")

        return trip

    def create(self, validated_data):
        request = self.context["request"]
        user = request.user
        trip = validated_data["trip"]
        return ReservationService.create(user, trip)

    def reserveToGuest(self, guest: GuestPassenger, trip: Trip):
        """Deprecated: use ReservationService.create_for_guest() instead."""
        return ReservationService.create_for_guest(guest, trip)


class ActiveReservationSerializer(serializers.ModelSerializer):
    """Serializer for active (non-finished) reservations."""

    origin = serializers.CharField(source="trip.route.origin")
    destiny = serializers.CharField(source="trip.route.destiny")
    trip_date = serializers.DateField(source="trip.trip_date")
    departure_time = serializers.TimeField(
        source="trip.route.departure_time", format="%H:%M"
    )
    arrival_time = serializers.TimeField(
        source="trip.route.arrival_time", format="%H:%M"
    )
    status_trip = serializers.SerializerMethodField()
    bus_number_plate = serializers.SerializerMethodField()
    driver = serializers.SerializerMethodField()
    reservation_status = serializers.CharField(source="status")
    can_cancel = serializers.SerializerMethodField()
    quorum_met = serializers.SerializerMethodField()
    percentage_complete = serializers.SerializerMethodField()
    minutes_remaining = serializers.SerializerMethodField()
    status_route = serializers.SerializerMethodField()
    trip_id = serializers.UUIDField(source="trip.id")
    passenger_identifier = serializers.SerializerMethodField()
    passenger_guests = serializers.SerializerMethodField()
    has_checked_in = serializers.BooleanField(source="check_in")
    kind = serializers.SerializerMethodField()
    trip_students_count = serializers.SerializerMethodField()
    trip_servants_count = serializers.SerializerMethodField()
    trip_guests_count = serializers.SerializerMethodField()
    available_seats = serializers.SerializerMethodField()

    class Meta:
        model = Reservation
        fields = [
            "id",
            "origin",
            "destiny",
            "trip_date",
            "departure_time",
            "arrival_time",
            "status_trip",
            "bus_number_plate",
            "driver",
            "reservation_status",
            "kind",
            "trip_id",
            "trip_students_count",
            "trip_servants_count",
            "trip_guests_count",
            "available_seats",
            "can_cancel",
            "quorum_met",
            "percentage_complete",
            "minutes_remaining",
            "status_route",
            "passenger_identifier",
            "passenger_guests",
            "has_checked_in",
            "created_at",
        ]

    def get_status_trip(self, obj):
        return obj.trip.get_status_display()

    def get_bus_number_plate(self, obj):
        bus = obj.trip.bus
        return bus.number_plate if bus else "—"

    def get_driver(self, obj):
        driver_profile = obj.trip.driver
        if driver_profile and hasattr(driver_profile, "user"):
            return driver_profile.user.full_name
        return "—"

    def get_can_cancel(self, obj):
        return is_reservation_open(obj.trip) and obj.trip.status not in {
            "CANCELADA",
            "CONCLUÍDA",
        }

    def get_quorum_met(self, obj):
        return trip_has_quorum(obj.trip)

    def _get_trip_metrics(self, obj):
        from datetime import datetime, timedelta

        from django.utils import timezone

        time_zone = timezone.get_current_timezone()
        trip = obj.trip

        if not trip.trip_date or not getattr(trip, "route", None):
            now = timezone.now()
            return now, 0

        expected_dep = timezone.make_aware(
            datetime.combine(trip.trip_date, trip.route.departure_time), time_zone
        )

        expected_arr = timezone.make_aware(
            datetime.combine(trip.trip_date, trip.route.arrival_time), time_zone
        )

        if expected_arr <= expected_dep:
            expected_arr += timedelta(days=1)

        total_duration = (expected_arr - expected_dep).total_seconds()
        return trip.departure_timestamp, total_duration

    def get_percentage_complete(self, obj):
        from django.utils import timezone

        trip = obj.trip

        if (
            trip.status in ["CANCELADA", "RISCO DE CANCELAMENTO", "CONFIRMADA"]
            or not trip.departure_timestamp
        ):
            return 0

        if trip.status == "CONCLUÍDA":
            return 100

        now = timezone.now()
        start_time, total_duration = self._get_trip_metrics(obj)

        if total_duration <= 0 or not start_time:
            return 0

        elapsed = (now - start_time).total_seconds()

        if elapsed < 0:
            return 0

        pct = (elapsed / total_duration) * 100

        if pct >= 100:
            return 99

        if 0 < pct < 1:
            return 1

        return int(pct)

    def get_minutes_remaining(self, obj):
        from datetime import timedelta

        from django.utils import timezone

        trip = obj.trip

        if trip.status != "EM ANDAMENTO" or not trip.departure_timestamp:
            return None

        now = timezone.now()
        start_time, total_duration = self._get_trip_metrics(obj)

        if not start_time:
            return None

        real_expected_arr = start_time + timedelta(seconds=total_duration)

        if now >= real_expected_arr:
            return 0

        remaining_seconds = (real_expected_arr - now).total_seconds()
        return int(remaining_seconds // 60)

    def get_status_route(self, obj):
        trip = obj.trip

        if trip.status == "CONFIRMADA":
            return "Aguardando Partida"
        elif trip.status == "RISCO DE CANCELAMENTO":
            return "Atenção: Risco de Cancelamento"
        elif trip.status == "CONCLUÍDA":
            return "Trajeto Concluído"

        pct = self.get_percentage_complete(obj)

        if pct == 0:
            return "Início do Trajeto"
        elif pct < 45:
            return "Trajeto em Andamento"
        elif 45 <= pct <= 55:
            return "Metade do trajeto concluído"
        elif pct < 99:
            return "Aproximando do Destino"
        else:
            return "Finalizando Trajeto"

    def get_kind(self, obj):
        if obj.student_id:
            return "STUDENT"
        if obj.civil_servant_id:
            return "CIVIL_SERVANT"
        return "GUEST"

    def get_trip_students_count(self, obj):
        return obj.trip.reservation_set.filter(student__isnull=False).count()

    def get_trip_servants_count(self, obj):
        return obj.trip.reservation_set.filter(civil_servant__isnull=False).count()

    def get_trip_guests_count(self, obj):
        return obj.trip.reservation_set.filter(guest_passenger__isnull=False).count()

    def get_available_seats(self, obj):
        trip = obj.trip
        if not trip.bus:
            return 0
        reserved = trip.reservation_set.count()
        passenger_seats = getattr(trip, "passenger_seats", 0)
        return max(trip.bus.seating_capacity - reserved - passenger_seats, 0)

    def get_passenger_guests(self, obj):
        guests = obj.trip.guestpassenger_set.all()
        guest_ids = [g.id for g in guests]
        res_ids = dict(
            Reservation.objects.filter(guest_passenger_id__in=guest_ids, trip=obj.trip)
            .values_list("guest_passenger_id", "id")
        )
        return [
            {
                "id": str(g.id),
                "full_name": g.full_name,
                "cpf": g.cpf,
                "passenger_identifier": f"{res_ids.get(g.id, g.id)}@{g.id}",
            }
            for g in guests
        ]

    def get_passenger_identifier(self, obj):
        request = self.context.get("request")
        if request and request.user and request.user.is_authenticated:
            return f"{obj.id}@{request.user.id}"
        return None


class ReservationHistorySerializer(serializers.ModelSerializer):
    """Serializer for trips history page."""

    origin = serializers.CharField(source="trip.route.origin")
    destiny = serializers.CharField(source="trip.route.destiny")
    trip_date = serializers.DateField(source="trip.trip_date")
    trip_id = serializers.UUIDField(source="trip.id")
    trip_departure = serializers.DateTimeField(
        source="trip.departure_timestamp",
        format="%H:%M:%S",
    )

    trip_history_status = serializers.SerializerMethodField()
    reservation_status = serializers.CharField(source="status")
    can_cancel = serializers.SerializerMethodField()
    quorum_met = serializers.SerializerMethodField()
    total_trips = serializers.SerializerMethodField()

    class Meta:
        model = Reservation
        fields = [
            "id",
            "origin",
            "destiny",
            "trip_id",
            "trip_date",
            "trip_departure",
            "trip_history_status",
            "reservation_status",
            "can_cancel",
            "quorum_met",
            "total_trips",
            "created_at",
        ]

    def get_trip_history_status(self, obj):
        """Returns the status of the trip the user booked."""

        trip = obj.trip

        if trip.status == "CANCELADA":
            return "CANCELADA"

        if trip.status in ["CONFIRMADA", "EM ANDAMENTO", "RISCO DE CANCELAMENTO"]:
            return "PENDENTE"

        if trip.status == "CONCLUÍDA":
            if obj.check_in:
                return "CONCLUÍDA"

            return "FALTA"

        return "PENDENTE"

    def get_can_cancel(self, obj):
        return is_reservation_open(obj.trip) and obj.trip.status not in {
            "CANCELADA",
            "CONCLUÍDA",
        }

    def get_quorum_met(self, obj):
        return trip_has_quorum(obj.trip)

    def get_total_trips(self, obj):
        """Returns the total number of trips the user has booked."""
        user = self.context["request"].user
        return Reservation.objects.for_user(user).count()


class AvailableTripSerializer(serializers.ModelSerializer):
    trip_date = serializers.DateField(format="%d/%m/%Y", read_only=True)
    departure_time = serializers.TimeField(
        source="route.departure_time", format="%H:%M", read_only=True
    )
    origin = serializers.CharField(source="route.origin", read_only=True)
    destiny = serializers.CharField(source="route.destiny", read_only=True)
    bus_brand = serializers.CharField(source="bus.brand", read_only=True)
    status_trip = serializers.SerializerMethodField()
    reserved_seats = serializers.SerializerMethodField()
    available_seats = serializers.SerializerMethodField()
    is_full = serializers.SerializerMethodField()
    is_reservable = serializers.SerializerMethodField()
    quorum_met = serializers.SerializerMethodField()
    reservation_deadline = serializers.SerializerMethodField()

    class Meta:
        model = Trip
        fields = [
            "id",
            "trip_date",
            "origin",
            "destiny",
            "departure_time",
            "bus_brand",
            "status_trip",
            "available_seats",
            "reserved_seats",
            "is_full",
            "is_reservable",
            "quorum_met",
            "reservation_deadline",
        ]

    def get_status_trip(self, obj):
        return obj.get_status_display()

    def get_reserved_seats(self, obj):
        return Reservation.objects.filter(trip=obj).count()

    def get_available_seats(self, obj):
        reserved_seats = getattr(
            obj,
            "active_reservation_seats",
            getattr(obj, "reserved_seats", 0),
        )
        passenger_seats = getattr(obj, "passenger_seats", 0)
        seating_capacity = obj.bus.seating_capacity if obj.bus else 46
        return max(seating_capacity - reserved_seats - passenger_seats, 0)

    def get_is_full(self, obj):
        return self.get_available_seats(obj) == 0   

    def get_is_reservable(self, obj):
        return (
            obj.status != "CANCELADA"
            and is_reservation_open(obj)
            and self.get_available_seats(obj) > 0
        )

    def get_quorum_met(self, obj):
        return trip_has_quorum(obj)

    def get_reservation_deadline(self, obj):
        return reservation_cutoff(obj)


class ManageReservationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Reservation
        fields = "__all__"


class PunishmentHistorySerializer(serializers.ModelSerializer):
    created_at = serializers.DateTimeField(format="%d/%m/%Y", read_only=True)

    class Meta:
        model = Punishment
        fields = ["id", "description", "is_active", "created_at"]
