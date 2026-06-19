import re
import unicodedata
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo

from django.core.exceptions import ValidationError
from django.utils import timezone
from rest_framework import serializers

from ..reservations.models import Reservation
from .models import Bus, GuestPassenger, Route, Trip, TripPassenger
from .services.trip_service import TripService


class BusSerializer(serializers.ModelSerializer):
    """Validates bus data"""

    class Meta:
        model = Bus
        fields = "__all__"
        read_only_fields = ["administrator"]

    def validate_seating_capacity(self, value):
        """Ensures seating_capacity is greater than 0 and less than or equal to 120."""
        if value <= 0:
            raise serializers.ValidationError("Capacidade deve ser maior que 0.")
        if value > 120:
            raise serializers.ValidationError("Capacidade muito alta para um ônibus.")
        return value

    def validate_number_plate(self, value):
        pattern = r"^([a-zA-Z]{3}-?\d{4}|[a-zA-Z]{3}\d[a-zA-Z]\d{2})$"

        if not re.match(pattern, value):
            raise ValidationError(
                "%(value)s não é uma placa válida. Use AAA-1234 ou AAA1A23.",
                params={"value": value},
            )

        return value


class RouteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Route
        fields = "__all__"
        read_only_fields = ["administrator"]

    def _remove_accents(self, text):
        if not text:
            return None

        normalized_text = (
            unicodedata
            .normalize("NFKD", text)
            .encode("ASCII", "ignore")
            .decode("ASCII")
        )
        return normalized_text.strip().lower()

    def _check_locations(self, origin, destiny):
        if origin and destiny:
            origin_clear = self._remove_accents(origin)
            destiny_clear = self._remove_accents(destiny)

            if origin_clear == destiny_clear:
                raise serializers.ValidationError({
                    "destiny": "A origem e o destino não podem ser a mesma cidade."
                })

    def _check_times(self, departure, arrival):
        if arrival and departure:
            today = datetime.now(ZoneInfo("America/Sao_Paulo")).date()
            departure_date = datetime.combine(today, departure)
            arrival_date = datetime.combine(today, arrival)

            if arrival_date <= departure_date:
                arrival_date += timedelta(days=1)

            seconds = (arrival_date - departure_date).total_seconds()

            if seconds < 1800:
                raise serializers.ValidationError({
                    "arrival_time": (
                        "Uma viagem intermunicipal precisa durar no mínimo 30 minutos."
                    )
                })
            if seconds > 43200:
                raise serializers.ValidationError({
                    "arrival_time": "A viagem excede o tempo limite de 12 horas."
                })

    def validate(self, data):
        departure = data.get("departure_time") or (
            self.instance.departure_time if self.instance else None
        )
        arrival = data.get("arrival_time") or (
            self.instance.arrival_time if self.instance else None
        )

        origin = data.get("origin") or (self.instance.origin if self.instance else "")
        destiny = data.get("destiny") or (
            self.instance.destiny if self.instance else ""
        )

        self._check_locations(origin, destiny)
        self._check_times(departure, arrival)

        return data


class TripSerializer(serializers.ModelSerializer):
    origin = serializers.CharField(source="route.origin", read_only=True)
    destiny = serializers.CharField(source="route.destiny", read_only=True)
    active_reservations = serializers.SerializerMethodField(read_only=True)
    checked_in_count = serializers.SerializerMethodField(read_only=True)
    checked_in_passengers = serializers.SerializerMethodField(read_only=True)
    departure_time = serializers.CharField(
        source="route.departure_time", read_only=True
    )
    arrival_time = serializers.CharField(source="route.arrival_time", read_only=True)
    bus_plate = serializers.SerializerMethodField(read_only=True)
    checkin_started = serializers.DateTimeField(read_only=True)
    students_count = serializers.SerializerMethodField(read_only=True)
    servants_count = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Trip
        fields = "__all__"

    def get_active_reservations(self, obj) -> int:
        """filter reservations by especific trip"""
        reservations = Reservation.objects.filter(trip=obj).count()
        return reservations

    def get_checked_in_count(self, obj) -> int:
        """Count QR check-ins and passengers registered locally by the driver."""
        return (
            Reservation.objects.filter(trip=obj, check_in=True).count()
            + obj.trip_passengers.count()
        )

    def get_checked_in_passengers(self, obj) -> list[dict]:
        """Return the checked-in passengers used by the driver occupancy screen."""
        reservations = (
            Reservation.objects
            .select_related("student__user", "civil_servant__user", "guest_passenger")
            .filter(trip=obj, check_in=True)
            .order_by("checkin_date", "id")
        )

        passengers = []
        for reservation in reservations:
            user = None

            if reservation.student_id:
                user = reservation.student.user
            elif reservation.civil_servant_id:
                user = reservation.civil_servant.user
            elif reservation.guest_passenger_id:
                user = reservation.guest_passenger

            passengers.append({
                "reservation_id": reservation.id,
                "passenger_name": getattr(user, "full_name", None) or "Passageiro",
                "check_in": reservation.check_in,
                "checkin_date": reservation.checkin_date,
                "source": "QR",
            })

        local_passengers = (
            TripPassenger.objects
            .filter(trip=obj)
            .select_related("allowed_staff", "associated_staff")
            .order_by("created_at", "id")
        )
        for passenger in local_passengers:
            if passenger.passenger_type == TripPassenger.PassengerType.LOCAL_SERVER:
                passenger_name = (
                    passenger.allowed_staff.name
                    if passenger.allowed_staff_id
                    else "Servidor local"
                )
            else:
                passenger_name = passenger.full_name or "Convidado local"

            passengers.append({
                "local_passenger_id": passenger.id,
                "passenger_name": passenger_name,
                "check_in": True,
                "checkin_date": passenger.created_at,
                "source": "Manual",
                "kind": (
                    "Servidor"
                    if (
                        passenger.passenger_type
                        == TripPassenger.PassengerType.LOCAL_SERVER
                    )
                    else "Convidado"
                ),
            })

        return passengers

    def get_bus_plate(self, obj):
        if obj.bus_id:
            return obj.bus.number_plate
        return None

    def get_students_count(self, obj):
        return Reservation.objects.filter(trip=obj, student__isnull=False).count()

    def get_servants_count(self, obj):
        return Reservation.objects.filter(
            trip=obj, civil_servant__isnull=False
        ).count()

    def validate_trip_date(self, value):
        today = timezone.localtime().date()
        if self.instance is None and value < today:
            raise serializers.ValidationError(
                "A data da viagem não pode estar no passado."
            )
        return value

    def validate(self, data):
        """Delegate all business rule validation to TripService."""
        return TripService.validate_trip(data, instance=self.instance)


class TripCurrentScreenSerializer(serializers.ModelSerializer):
    """
    Serializer focused on delivering the exact
    data to the 'Current Trip' screen of the Frontend.
    """

    trip_date = serializers.DateField(read_only=True)
    departure_time = serializers.TimeField(
        source="route.departure_time", format="%H:%M", read_only=True
    )

    origin = serializers.CharField(source="route.origin", read_only=True)
    destiny = serializers.CharField(source="route.destiny", read_only=True)
    arrival_time = serializers.TimeField(
        source="route.arrival_time", format="%H:%M", read_only=True
    )
    status_trip = serializers.SerializerMethodField()

    bus_number_plate = serializers.CharField(source="bus.number_plate", read_only=True)
    driver = serializers.CharField(source="driver.user.full_name", read_only=True)

    percentage_complete = serializers.SerializerMethodField()
    minutes_remaining = serializers.SerializerMethodField()
    status_route = serializers.SerializerMethodField()

    passenger_identifier = serializers.SerializerMethodField()

    has_checked_in = serializers.SerializerMethodField()

    passenger_guests = serializers.SerializerMethodField()

    class Meta:
        model = Trip
        fields = [
            "id",
            "trip_date",
            "origin",
            "destiny",
            "departure_time",
            "arrival_time",
            "status_trip",
            "bus_number_plate",
            "driver",
            "percentage_complete",
            "minutes_remaining",
            "status_route",
            "passenger_identifier",
            "has_checked_in",
            "passenger_guests",
        ]

    def get_passenger_guests(self, obj):
        request = self.context.get("request")
        if not request or not request.user.is_authenticated:
            return []

        user = request.user
        civil_servant_profile = getattr(user, "civil_servant_profile", None)
        if civil_servant_profile is None:
            return []

        guests = GuestPassenger.objects.filter(
            recorded_by=civil_servant_profile,
            trip=obj.id,
        )

        return GuestPassengerSerializer(guests, many=True).data

    def get_status_trip(self, obj):
        return obj.get_status_display()

    def get_has_checked_in(self, obj):
        """
        It retrieves the reservation of the authenticated user
        and returns whether they have already checked in.
        """
        request = self.context.get("request")
        if not request or not request.user.is_authenticated:
            return False

        user = request.user
        if hasattr(user, "student_profile"):
            res = obj.reservation_set.filter(student=user.student_profile).first()
            return res.check_in if res else False

        if hasattr(user, "civil_servant_profile"):
            res = obj.reservation_set.filter(
                civil_servant=user.civil_servant_profile
            ).first()
            return res.check_in if res else False

        return False

    def _get_trip_metrics(self, obj):
        """
        It calculates the actual start time and duration based on the route.
        This serves as the basis for percentage and remaining time considering delays.
        """

        time_zone = timezone.get_current_timezone()

        if not obj.trip_date or not getattr(obj, "route", None):
            now = timezone.now()
            return now, 0

        expected_dep = timezone.make_aware(
            datetime.combine(obj.trip_date, obj.route.departure_time), time_zone
        )

        expected_arr = timezone.make_aware(
            datetime.combine(obj.trip_date, obj.route.arrival_time), time_zone
        )

        if expected_arr <= expected_dep:
            expected_arr += timedelta(days=1)

        total_duration = (expected_arr - expected_dep).total_seconds()

        return obj.departure_timestamp, total_duration

    def get_percentage_complete(self, obj):
        if (
            obj.status in ["CANCELADA", "RISCO DE CANCELAMENTO", "CONFIRMADA"]
            or not obj.departure_timestamp
        ):
            return 0

        if obj.status == "CONCLUÍDA":
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
        if obj.status != "EM ANDAMENTO" or not obj.departure_timestamp:
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
        if obj.status == "CONFIRMADA":
            return "Aguardando Partida"
        elif obj.status == "RISCO DE CANCELAMENTO":
            return "Atenção: Risco de Cancelamento"
        elif obj.status == "CONCLUÍDA":
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

    def get_passenger_identifier(self, obj):
        request = self.context.get("request")
        if request and request.user and request.user.is_authenticated:
            return f"{obj.id}@{request.user.id}"
        return None


class GuestPassengerSerializer(serializers.ModelSerializer):
    """Compact public representation of a guest passenger."""

    class Meta:
        model = GuestPassenger
        fields = ("id", "cpf", "full_name")


class GuestHistorySerializer(serializers.ModelSerializer):
    """Serializes a guest with trip context for history display."""

    trip_id = serializers.UUIDField(source="trip.id")
    trip_origin = serializers.CharField(source="trip.route.origin")
    trip_destiny = serializers.CharField(source="trip.route.destiny")
    trip_date = serializers.DateField(source="trip.trip_date")

    class Meta:
        model = GuestPassenger
        fields = ("id", "full_name", "trip_id", "trip_origin", "trip_destiny", "trip_date")
