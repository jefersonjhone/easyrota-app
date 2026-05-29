import unicodedata
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo

from django.utils import timezone
from rest_framework import serializers

from ..reservations.models import Reservation
from .models import Bus, Route, Trip, GuestPassenger


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

    seating_capacity = serializers.IntegerField(
        source="bus.seating_capacity", read_only=True
    )

    class Meta:
        model = Trip
        fields = "__all__"

    def get_active_reservations(self, obj) -> int:
        """filter reservations by especific trip"""
        reservations = Reservation.objects.filter(trip=obj).count()
        return reservations

    def get_checked_in_count(self, obj) -> int:
        """Count only passengers with confirmed check-in."""
        return Reservation.objects.filter(trip=obj, check_in=True).count()

    def get_checked_in_passengers(self, obj) -> list[dict]:
        """Return the checked-in passengers used by the driver occupancy screen."""
        reservations = (
            Reservation.objects
            .select_related("student__user", "civil_servant__user")
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

            passengers.append({
                "reservation_id": reservation.id,
                "passenger_name": getattr(user, "full_name", None) or "Passageiro",
                "check_in": reservation.check_in,
                "checkin_date": reservation.checkin_date,
            })

        return passengers

    def validate_trip_date(self, value):
        today = timezone.localtime().date()
        if self.instance is None and value < today:
            raise serializers.ValidationError(
                "A data da viagem não pode estar no passado."
            )
        return value

    def validate(self, data):
        bus = data.get("bus", self.instance.bus if self.instance else None)
        trip_date = data.get(
            "trip_date", self.instance.trip_date if self.instance else None
        )
        route = data.get("route", self.instance.route if self.instance else None)
        status = data.get("status", self.instance.status if self.instance else None)

        now = timezone.localtime()
        tz = timezone.get_current_timezone()

        if trip_date and trip_date < now.date():
            raise serializers.ValidationError({
                "trip_date": "A data da viagem não pode estar no passado."
            })

        if status == "EM ANDAMENTO" and trip_date and trip_date < now.date():
            raise serializers.ValidationError({
                "trip_date": "A data da viagem não pode estar no passado."
            })

        if trip_date and route:
            expected_dep = timezone.make_aware(
                datetime.combine(trip_date, route.departure_time), tz
            )

            is_new = self.instance is None
            date_changed = self.instance and self.instance.trip_date != trip_date
            route_changed = self.instance and self.instance.route != route

            if is_new or date_changed or route_changed:
                grace_limit = expected_dep + timedelta(hours=1)

                if now > grace_limit:
                    raise serializers.ValidationError({
                        "route": "Não é possível agendar uma viagem "
                        "para um horário que já passou hoje."
                    })

        if status == "EM ANDAMENTO":
            if trip_date == now.date() and route:
                expected_dep = timezone.make_aware(
                    datetime.combine(trip_date, route.departure_time), tz
                )

                if now < expected_dep - timedelta(minutes=30):
                    raise serializers.ValidationError({
                        "status": "Muito cedo para iniciar a viagem. "
                        "O horário previsto é {route.departure_time.strftime('%H:%M')}."
                    })

            elif trip_date > now.date():
                raise serializers.ValidationError({
                    "status": "Não é possível iniciar uma viagem "
                    "agendada para o futuro."
                })

            departure = data.get(
                "departure_timestamp",
                self.instance.departure_timestamp if self.instance else None,
            )
            if not departure:
                data["departure_timestamp"] = now

        if bus and trip_date and route:
            date_range = [
                trip_date - timedelta(days=1),
                trip_date,
                trip_date + timedelta(days=1),
            ]
            overlapping_trips = Trip.objects.filter(bus=bus, trip_date__in=date_range)
            if self.instance:
                overlapping_trips = overlapping_trips.exclude(id=self.instance.id)

            tz = timezone.get_current_timezone()
            new_start = timezone.make_aware(
                datetime.combine(trip_date, route.departure_time), tz
            )
            new_end = timezone.make_aware(
                datetime.combine(trip_date, route.arrival_time), tz
            )

            if new_end <= new_start:
                new_end += timedelta(days=1)

            for existing_trip in overlapping_trips:
                ex_start = timezone.make_aware(
                    datetime.combine(
                        existing_trip.trip_date, existing_trip.route.departure_time
                    ),
                    tz,
                )
                ex_end = timezone.make_aware(
                    datetime.combine(
                        existing_trip.trip_date, existing_trip.route.arrival_time
                    ),
                    tz,
                )

                if ex_end <= ex_start:
                    ex_end += timedelta(days=1)

                if new_start < ex_end and new_end > ex_start:
                    raise serializers.ValidationError({
                        "bus": (
                            f"Este ônibus já está alocado para a viagem "
                            f"'{existing_trip.route}' "
                            f"(Data: {existing_trip.trip_date}) "
                            "que conflita com este horário."
                        )
                    })

        return data


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
        ]

    def get_status_trip(self, obj):
        return obj.get_status_display()

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

        start_time = (
            obj.departure_timestamp if obj.departure_timestamp else expected_dep
        )

        return start_time, total_duration

    def get_percentage_complete(self, obj):
        if obj.status in ["CANCELADA", "RISCO DE CANCELAMENTO", "CONFIRMADA"]:
            return 0

        if obj.status == "CONCLUÍDA":
            return 100

        now = timezone.now()
        start_time, total_duration = self._get_trip_metrics(obj)

        if total_duration <= 0:
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
        if obj.status != "EM ANDAMENTO":
            return None

        now = timezone.now()
        start_time, total_duration = self._get_trip_metrics(obj)

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
            return str(request.user.id)
        return None



class GuestPassengerSerializer(serializers.ModelSerializer):
    """Compact public representation of a guest passenger."""

    class Meta:
        model = GuestPassenger
        fields = ("id", "cpf", "full_name", "recorded_by", "trip")
