import re
import unicodedata
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo

from django.core.exceptions import ValidationError
from django.utils import timezone
from rest_framework import serializers

from ..reservations.models import Reservation
from .models import Bus, GuestPassenger, Route, Trip, TripPassenger, TripRequest
from .services.trip_service import TripService


class TripRequestSerializer(serializers.ModelSerializer):
    requester_name = serializers.CharField(
        source="requester.user.full_name", read_only=True
    )
    access_code = serializers.CharField(source="trip.access_code", read_only=True)

    class Meta:
        model = TripRequest
        fields = "__all__"
        read_only_fields = [
            "requester",
            "status",
            "feedback",
            "created_at",
            "updated_at",
        ]


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


class BusAdminDetailSerializer(serializers.ModelSerializer):
    trip_count = serializers.SerializerMethodField()
    recent_trips = serializers.SerializerMethodField()

    class Meta:
        model = Bus
        fields = [
            "id",
            "number_plate",
            "brand",
            "seating_capacity",
            "status",
            "trip_count",
            "recent_trips",
        ]

    def get_trip_count(self, obj):
        from .models import Trip

        return Trip.objects.filter(bus=obj).count()

    def get_recent_trips(self, obj):
        from .models import Trip

        trips = (
            Trip.objects
            .filter(bus=obj)
            .select_related("route")
            .order_by("-trip_date")[:50]
        )
        return [
            {
                "id": t.id,
                "trip_date": t.trip_date,
                "departure_time": t.route.departure_time.strftime("%H:%M")
                if t.route
                else None,
                "origin": t.route.origin if t.route else None,
                "destiny": t.route.destiny if t.route else None,
                "status": t.status,
            }
            for t in trips
        ]


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

    def _check_max_bus(self, max_bus):
        if max_bus <= 0:
            raise serializers.ValidationError({
                "max_bus": "A quantidade de ônibus disponíveis deve ser maior que 0"
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
        # ``get`` distinguishes an omitted value from 0, which must reach
        # ``_check_max_bus`` and be rejected instead of replaced as falsy.
        buses = data.get(
            "max_bus",
            self.instance.max_bus
            if self.instance
            else Route._meta.get_field("max_bus").get_default(),
        )

        self._check_locations(origin, destiny)
        self._check_times(departure, arrival)
        self._check_max_bus(buses)
        return data


class TripSerializer(serializers.ModelSerializer):
    origin = serializers.CharField(source="route.origin", read_only=True)
    destiny = serializers.CharField(source="route.destiny", read_only=True)
    route_max_bus = serializers.IntegerField(source="route.max_bus", read_only=True)
    same_route_trips_count = serializers.SerializerMethodField(read_only=True)
    active_reservations = serializers.SerializerMethodField(read_only=True)
    checked_in_count = serializers.SerializerMethodField(read_only=True)
    checked_in_passengers = serializers.SerializerMethodField(read_only=True)
    available_seats = serializers.SerializerMethodField(read_only=True)
    bus_plate = serializers.SerializerMethodField(read_only=True)
    bus_number_plate = serializers.SerializerMethodField(read_only=True)
    students_count = serializers.SerializerMethodField(read_only=True)
    servants_count = serializers.SerializerMethodField(read_only=True)
    guests_count = serializers.SerializerMethodField(read_only=True)
    local_passengers_count = serializers.SerializerMethodField(read_only=True)
    departure_time = serializers.TimeField(
        source="route.departure_time", format="%H:%M", read_only=True
    )
    arrival_time = serializers.TimeField(
        source="route.arrival_time", format="%H:%M", read_only=True
    )
    expected_departure = serializers.SerializerMethodField(read_only=True)
    expected_arrival = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Trip
        fields = "__all__"

    def get_active_reservations(self, obj) -> int:
        """filter reservations by especific trip"""
        reservations = Reservation.objects.filter(trip=obj).count()
        return reservations

    def get_same_route_trips_count(self, obj) -> int:
        return Trip.objects.filter(
            route=obj.route,
            trip_date=obj.trip_date,
        ).count()

    def _get_request_driver(self):
        request = self.context.get("request")
        user = getattr(request, "user", None)

        if not user or not user.is_authenticated:
            return None

        return getattr(user, "driver_profile", None)

    def get_is_current_driver(self, obj) -> bool:
        driver = self._get_request_driver()
        return bool(driver and obj.driver_id == driver.id)

    def get_is_occupied_by_other_driver(self, obj) -> bool:
        driver = self._get_request_driver()
        return bool(obj.driver_id and (driver is None or obj.driver_id != driver.id))

    def get_checked_in_count(self, obj) -> int:
        """Count QR check-ins and passengers registered locally by the driver."""
        return (
            Reservation.objects.filter(trip=obj, check_in=True).count()
            + obj.trip_passengers.count()
        )

    def get_available_seats(self, obj) -> int:
        occupied_seats, _ = TripService.get_trip_occupancy(obj)
        capacity = obj.bus.seating_capacity if obj.bus_id else obj.seating_capacity
        return max(capacity - occupied_seats, 0)

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

    def get_expected_departure(self, obj) -> str | None:
        from apps.trips.services.trip_service import TripService

        try:
            dep = TripService._departure_datetime(obj)
            return dep.isoformat()
        except AttributeError:
            return None

    def get_expected_arrival(self, obj) -> str | None:
        from apps.trips.services.trip_service import TripService

        try:
            arr = TripService._arrival_datetime(obj)
            return arr.isoformat()
        except AttributeError:
            return None

    def get_bus_plate(self, obj):
        if obj.bus_id:
            return obj.bus.number_plate
        return None

    def get_bus_number_plate(self, obj):
        return self.get_bus_plate(obj)

    def get_students_count(self, obj):
        return Reservation.objects.filter(trip=obj, student__isnull=False).count()

    def get_servants_count(self, obj):
        return Reservation.objects.filter(trip=obj, civil_servant__isnull=False).count()

    def get_guests_count(self, obj):
        return Reservation.objects.filter(
            trip=obj, guest_passenger__isnull=False
        ).count()

    def get_local_passengers_count(self, obj):
        return obj.trip_passengers.count()

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
    server_reserved_seats = serializers.SerializerMethodField()
    is_full = serializers.SerializerMethodField()
    is_reservable = serializers.SerializerMethodField()
    quorum_met = serializers.SerializerMethodField()
    reservation_deadline = serializers.SerializerMethodField()
    user_is_reserved = serializers.BooleanField(read_only=True)
    user_reservation_id = serializers.SerializerMethodField()

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
            "server_reserved_seats",
            "is_full",
            "is_reservable",
            "quorum_met",
            "reservation_deadline",
            "user_is_reserved",
            "user_reservation_id",
        ]

    def get_user_reservation_id(self, obj):
        request = self.context.get("request")
        if not request or not request.user or request.user.is_anonymous:
            return None
        from django.db.models import Q
        reservation = Reservation.objects.filter(
            trip=obj,
            status__in=["CONFIRMADA", "PENDENTE", "LISTA SECUNDÁRIA"]
        ).filter(
            Q(student__user=request.user) | Q(civil_servant__user=request.user)
        ).first()
        return reservation.id if reservation else None

    def get_status_trip(self, obj):
        return obj.get_status_display()

    def get_reserved_seats(self, obj):
        return Reservation.objects.filter(trip=obj).count()

    def get_server_reserved_seats(self, obj):
        return Reservation.objects.filter(
            trip=obj, civil_servant__isnull=False, status__in=["CONFIRMADA", "PENDENTE"]
        ).count()

    def get_available_seats(self, obj):
        total_occupied, server_occupied = TripService.get_trip_occupancy(obj)
        seating_capacity = obj.bus.seating_capacity if obj.bus else 46
        user = self.context["request"].user
        if hasattr(user, "civil_servant_profile"):
            # For servers, show capacity minus other servers
            return max(seating_capacity - server_occupied, 0)

        # For students and others, show total occupied
        return max(seating_capacity - total_occupied, 0)

    def get_is_full(self, obj):
        return self.get_available_seats(obj) == 0

    def get_is_reservable(self, obj):
        base_reservable = obj.status != "CANCELADA" and TripService.is_reservation_open(
            obj
        )
        if not base_reservable:
            return False

        if self.get_available_seats(obj) > 0:
            return True

        # Special case: Civil servants can reserve
        # if full but an unallocated bus is available
        user = self.context["request"].user
        if hasattr(user, "civil_servant_profile"):
            from ..trips.services.trip_service import has_available_bus

            return has_available_bus(obj.trip_date, obj.route)

        return False

    def get_quorum_met(self, obj):
        return TripService.trip_has_quorum(obj)

    def get_reservation_deadline(self, obj):
        return TripService.reservation_cutoff(obj)


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

    # invited_by: string;
    trip_date = serializers.DateField(
        source="trip.trip_date", read_only=True, format="%d-%m-%Y"
    )
    departure_time = serializers.TimeField(
        source="trip.route.departure_time", format="%H:%M", read_only=True
    )
    origin = serializers.CharField(source="trip.route.origin", read_only=True)
    destiny = serializers.CharField(source="trip.route.destiny", read_only=True)
    arrival_time = serializers.TimeField(
        source="trip.route.arrival_time", format="%H:%M", read_only=True
    )
    invited_by = serializers.CharField(source="recorded_by.user.full_name")

    class Meta:
        model = GuestPassenger
        fields = (
            "id", 
            "cpf", 
            "full_name", 
            "trip_date",
            "departure_time", 
            "origin", 
            "destiny", 
            "arrival_time", 
            "invited_by"
        )


class AdminTripDetailSerializer(serializers.ModelSerializer):
    origin = serializers.CharField(source="route.origin")
    destiny = serializers.CharField(source="route.destiny")
    departure_time = serializers.TimeField(
        source="route.departure_time", format="%H:%M"
    )
    arrival_time = serializers.TimeField(source="route.arrival_time", format="%H:%M")
    trip_departure_time = serializers.SerializerMethodField()
    trip_arrival_time = serializers.SerializerMethodField()
    driver_name = serializers.SerializerMethodField()
    driver_cnh = serializers.SerializerMethodField()
    driver_id = serializers.SerializerMethodField()
    bus_plate = serializers.SerializerMethodField()
    bus_brand = serializers.SerializerMethodField()
    bus_capacity = serializers.SerializerMethodField()
    bus_id = serializers.SerializerMethodField()
    active_reservations = serializers.SerializerMethodField()
    checked_in_count = serializers.SerializerMethodField()
    passengers = serializers.SerializerMethodField()

    class Meta:
        model = Trip
        fields = [
            "id",
            "trip_date",
            "status",
            "origin",
            "destiny",
            "departure_time",
            "arrival_time",
            "trip_departure_time",
            "trip_arrival_time",
            "driver_name",
            "driver_cnh",
            "driver_id",
            "bus_plate",
            "bus_brand",
            "bus_capacity",
            "bus_id",
            "seating_capacity",
            "active_reservations",
            "checked_in_count",
            "passengers",
        ]

    def get_trip_departure_time(self, obj):
        if obj.departure_timestamp:
            return obj.departure_timestamp.astimezone().strftime("%H:%M")
        return None

    def get_trip_arrival_time(self, obj):
        if obj.arrival_timestamp:
            return obj.arrival_timestamp.astimezone().strftime("%H:%M")
        return None

    def get_driver_name(self, obj):
        return obj.driver.user.full_name if obj.driver else None

    def get_driver_cnh(self, obj):
        return obj.driver.cnh if obj.driver else None

    def get_driver_id(self, obj):
        return obj.driver.id if obj.driver else None

    def get_bus_plate(self, obj):
        return obj.bus.number_plate if obj.bus else None

    def get_bus_brand(self, obj):
        return obj.bus.brand if obj.bus else None

    def get_bus_capacity(self, obj):
        return obj.bus.seating_capacity if obj.bus else None

    def get_bus_id(self, obj):
        return obj.bus.id if obj.bus else None

    def get_active_reservations(self, obj):
        from ..reservations.models import Reservation

        return Reservation.objects.filter(trip=obj).count()

    def get_checked_in_count(self, obj):
        from ..reservations.models import Reservation

        return (
            Reservation.objects.filter(trip=obj, check_in=True).count()
            + obj.trip_passengers.count()
        )

    def get_passengers(self, obj):
        from ..reservations.models import Reservation

        reservations = Reservation.objects.filter(trip=obj).select_related(
            "student__user", "civil_servant__user", "guest_passenger"
        )

        trip_passengers = obj.trip_passengers.select_related("allowed_staff")

        passengers = []

        for r in reservations:
            if r.student:
                name = r.student.user.full_name
                ptype = "ESTUDANTE"
                pid = r.student.student_id
            elif r.civil_servant:
                name = r.civil_servant.user.full_name
                ptype = "SERVIDOR"
                pid = r.civil_servant.civil_servant_id
            elif r.guest_passenger:
                name = r.guest_passenger.full_name
                ptype = "CONVIDADO"
                pid = r.guest_passenger.cpf
            else:
                continue

            passengers.append({
                "id": r.id,
                "passenger_name": name,
                "passenger_type": ptype,
                "passenger_id_display": pid,
                "profile_id": r.student.id
                if r.student
                else (r.civil_servant.id if r.civil_servant else None),
                "reservation_status": r.status,
                "check_in": r.check_in,
                "checkin_date": r.checkin_date,
            })

        for tp in trip_passengers:
            if (
                tp.passenger_type == TripPassenger.PassengerType.LOCAL_SERVER
                and tp.allowed_staff
            ):
                name = tp.allowed_staff.name
                pid = tp.allowed_staff.registration_number
                ptype = "SERVIDOR LOCAL"
            elif tp.passenger_type == TripPassenger.PassengerType.LOCAL_GUEST:
                name = tp.full_name
                pid = tp.cpf
                ptype = "CONVIDADO LOCAL"
            else:
                continue

            passengers.append({
                "id": tp.id,
                "passenger_name": name,
                "passenger_type": ptype,
                "passenger_id_display": pid,
                "profile_id": None,
                "reservation_status": "CONFIRMADA",
                "check_in": True,
                "checkin_date": tp.created_at,
            })

        passengers.sort(key=lambda p: p["id"], reverse=True)
        return passengers


class GuestHistorySerializer(serializers.ModelSerializer):
    """Serializes a guest with trip context for history display."""

    trip_id = serializers.UUIDField(source="trip.id")
    trip_origin = serializers.CharField(source="trip.route.origin")
    trip_destiny = serializers.CharField(source="trip.route.destiny")
    trip_date = serializers.DateField(source="trip.trip_date")

    class Meta:
        model = GuestPassenger
        fields = (
            "id",
            "full_name",
            "trip_id",
            "trip_origin",
            "trip_destiny",
            "trip_date",
        )
