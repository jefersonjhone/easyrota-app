import unicodedata
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo

from django.utils import timezone
from rest_framework import serializers

from .models import Bus, Route, Trip


class BusSerializer(serializers.ModelSerializer):
    """Validates bus data"""

    class Meta:
        model = Bus
        fields = "__all__"
        read_only_fields = ["administrator", "driver"]

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
    class Meta:
        model = Trip
        fields = "__all__"

    def validate_trip_date(self, value):
        today = timezone.now().date()
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

        if status == "EM ANDAMENTO":
            if trip_date > timezone.now().date():
                raise serializers.ValidationError({
                    "status": "Não é possível iniciar uma viagem "
                    "agendada para o futuro."
                })

            departure = data.get(
                "departure_timestamp",
                self.instance.departure_timestamp if self.instance else None,
            )
            if not departure:
                data["departure_timestamp"] = timezone.now()

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

    trip_date = serializers.DateField(format="%d/%m/%Y", read_only=True)
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
    driver = serializers.CharField(source="bus.driver.user.full_name", read_only=True)

    percentage_complete = serializers.SerializerMethodField()
    minutes_remaining = serializers.SerializerMethodField()
    status_route = serializers.SerializerMethodField()

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
        ]

    def get_status_trip(self, obj):
        if obj.status in ["CANCELADA", "RISCO DE CANCELAMENTO"]:
            return obj.get_status_display()

        now = timezone.now()
        expected_dep, expected_arr = self._get_expected_datetimes(obj)

        if now < expected_dep:
            real_status = "CONFIRMADA"
        elif expected_dep <= now < expected_arr:
            real_status = "EM ANDAMENTO"
        else:
            real_status = "CONCLUÍDA"

        if obj.status != real_status:
            obj.status = real_status
            obj.save(update_fields=["status"])

        return obj.get_status_display()

    def _get_expected_datetimes(self, obj):
        time_zone = timezone.get_current_timezone()

        if (
            not obj.trip_date
            or not getattr(obj, "route", None)
            or not obj.route.departure_time
            or not obj.route.arrival_time
        ):
            now = timezone.now()
            return now, now

        expected_dep = timezone.make_aware(
            datetime.combine(obj.trip_date, obj.route.departure_time), time_zone
        )
        expected_arr = timezone.make_aware(
            datetime.combine(obj.trip_date, obj.route.arrival_time), time_zone
        )

        if expected_arr <= expected_dep:
            expected_arr += timedelta(days=1)

        return expected_dep, expected_arr

    def get_percentage_complete(self, obj):
        now = timezone.now()
        expected_dep, expected_arr = self._get_expected_datetimes(obj)

        if now < expected_dep:
            return 0
        if now > expected_arr:
            return 100

        total_duration = (expected_arr - expected_dep).total_seconds()
        elapsed = (now - expected_dep).total_seconds()

        pct = (elapsed / total_duration) * 100

        if 0 < pct < 1:
            return 1

        return int(pct)

    def get_minutes_remaining(self, obj):
        now = timezone.now()
        _, expected_arr = self._get_expected_datetimes(obj)

        if now >= expected_arr:
            return 0

        remaining_seconds = (expected_arr - now).total_seconds()
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
            return "Metade do trajeto concluída"
        elif pct < 100:
            return "Aproximando do Destino"
        else:
            return "Trajeto Concluído"
