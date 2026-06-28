from django.db import transaction
from django.utils import timezone
from rest_framework import serializers

from ..trips.models import GuestPassenger, Trip
from ..trips.services.trip_service import TripService
from ..trips.services.trip_status_service import TripStatusService
from ..users.models.profiles import CivilServantProfile, StudentProfile
from .models import Punishment, Reservation
from .services.notification_service import send_admin_leftover_server_alert
from .services.priority_service import PriorityService
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

        if not TripService.is_reservation_open(trip):
            raise serializers.ValidationError("Prazo de reserva encerrado.")

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

        reservation = Reservation(trip=trip)

        if hasattr(user, "student_profile"):
            reservation.student = user.student_profile
        elif hasattr(user, "civil_servant_profile"):
            reservation.civil_servant = user.civil_servant_profile

        if TripService.trip_has_capacity(trip):
            reservation.status = ReservationService.get_status_for_user(user)
        elif hasattr(user, "civil_servant_profile"):
            # If full, try to evict a student to accommodate the civil servant
            evicted = PriorityService.evict_lowest_priority_active(trip)
            if evicted:
                reservation.status = "CONFIRMADA"
            else:
                # Trip is full and no student can be displaced (all are servers)
                reservation.status = "LISTA SECUNDÁRIA"
                send_admin_leftover_server_alert(trip, user.civil_servant_profile)
        else:
            reservation.status = "LISTA SECUNDÁRIA"

        reservation.save()
        return reservation

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
        return TripService.is_reservation_open(obj.trip) and obj.trip.status not in {
            "CANCELADA",
            "CONCLUÍDA",
        }

    def get_quorum_met(self, obj):
        return TripService.trip_has_quorum(obj.trip)

    def _get_trip_metrics(self, obj):
        from datetime import datetime, timedelta

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
            Reservation.objects.filter(
                guest_passenger_id__in=guest_ids, trip=obj.trip
            ).values_list("guest_passenger_id", "id")
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
        return TripService.is_reservation_open(obj.trip) and obj.trip.status not in {
            "CANCELADA",
            "CONCLUÍDA",
        }

    def get_quorum_met(self, obj):
        return TripService.trip_has_quorum(obj.trip)

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
    server_reserved_seats = serializers.SerializerMethodField()
    is_full = serializers.SerializerMethodField()
    is_reservable = serializers.SerializerMethodField()
    quorum_met = serializers.SerializerMethodField()
    reservation_deadline = serializers.SerializerMethodField()
    user_is_reserved = serializers.BooleanField(read_only=True)

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
        ]

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
        seating_capacity = obj.bus.seating_capacity if obj.bus else 0

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


class AdminReservationListSerializer(serializers.ModelSerializer):
    passenger_name = serializers.SerializerMethodField()
    passenger_type = serializers.SerializerMethodField()
    passenger_id_display = serializers.SerializerMethodField()
    trip_id = serializers.UUIDField(source="trip.id")
    trip_date = serializers.DateField(source="trip.trip_date")
    route = serializers.SerializerMethodField()
    departure_time = serializers.TimeField(
        source="trip.route.departure_time", format="%H:%M"
    )
    trip_status = serializers.CharField(source="trip.status")

    class Meta:
        model = Reservation
        fields = [
            "id",
            "passenger_name",
            "passenger_type",
            "passenger_id_display",
            "trip_id",
            "trip_date",
            "route",
            "departure_time",
            "trip_status",
            "status",
            "check_in",
            "created_at",
        ]

    def get_passenger_name(self, obj):
        if obj.student:
            return obj.student.user.full_name
        if obj.civil_servant:
            return obj.civil_servant.user.full_name
        if obj.guest_passenger:
            return obj.guest_passenger.full_name
        return "—"

    def get_passenger_type(self, obj):
        if obj.student:
            return "ESTUDANTE"
        if obj.civil_servant:
            return "SERVIDOR"
        if obj.guest_passenger:
            return "CONVIDADO"
        return "—"

    def get_passenger_id_display(self, obj):
        if obj.student:
            return obj.student.student_id
        if obj.civil_servant:
            return obj.civil_servant.civil_servant_id
        if obj.guest_passenger:
            return obj.guest_passenger.cpf
        return None

    def get_route(self, obj):
        return f"{obj.trip.route.origin} → {obj.trip.route.destiny}"


class AdminCreateReservationSerializer(serializers.Serializer):
    trip = serializers.PrimaryKeyRelatedField(queryset=Trip.objects.all())
    passenger_type = serializers.ChoiceField(
        choices=["ESTUDANTE", "SERVIDOR", "CONVIDADO"]
    )
    profile_id = serializers.UUIDField(required=False, allow_null=True, default=None)
    guest_name = serializers.CharField(required=False, allow_blank=True, default="")
    guest_cpf = serializers.CharField(required=False, allow_blank=True, default="")

    class Meta:
        fields = ["trip", "passenger_type", "profile_id", "guest_name", "guest_cpf"]

    def validate(self, data):
        trip = data["trip"]
        passenger_type = data["passenger_type"]

        if trip.status == "CANCELADA":
            raise serializers.ValidationError("Viagem cancelada.")

        if passenger_type in ("ESTUDANTE", "SERVIDOR"):
            profile_id = data.get("profile_id")
            if not profile_id:
                raise serializers.ValidationError({
                    "profile_id": "Campo obrigatório para estudante/servidor."
                })

            if passenger_type == "ESTUDANTE":
                try:
                    profile = StudentProfile.objects.get(id=profile_id)
                except StudentProfile.DoesNotExist:
                    raise serializers.ValidationError({
                        "profile_id": "Estudante não encontrado."
                    })
                if Reservation.objects.filter(trip=trip, student=profile).exists():
                    raise serializers.ValidationError(
                        "Estudante já possui reserva nesta viagem."
                    )
                data["student"] = profile

            else:
                try:
                    profile = CivilServantProfile.objects.get(id=profile_id)
                except CivilServantProfile.DoesNotExist:
                    raise serializers.ValidationError({
                        "profile_id": "Servidor não encontrado."
                    })
                if Reservation.objects.filter(
                    trip=trip, civil_servant=profile
                ).exists():
                    raise serializers.ValidationError(
                        "Servidor já possui reserva nesta viagem."
                    )
                data["civil_servant"] = profile

        else:
            guest_name = data.get("guest_name", "").strip()
            guest_cpf = data.get("guest_cpf", "").strip()
            if not guest_name or not guest_cpf:
                raise serializers.ValidationError({
                    "guest_name": "Nome e CPF obrigatórios para convidado."
                })

            guest = GuestPassenger.objects.filter(cpf=guest_cpf, trip=trip).first()
            if guest:
                data["guest_passenger"] = guest
            else:
                data["guest_passenger"] = GuestPassenger(
                    cpf=guest_cpf, full_name=guest_name, trip=trip
                )

        return data

    def create(self, validated_data):
        trip = validated_data["trip"]

        reservation = Reservation(trip=trip)

        if validated_data.get("student"):
            reservation.student = validated_data["student"]
        elif validated_data.get("civil_servant"):
            reservation.civil_servant = validated_data["civil_servant"]
        elif validated_data.get("guest_passenger"):
            guest = validated_data["guest_passenger"]
            if not guest.pk:
                guest.save()
            reservation.guest_passenger = guest

        with transaction.atomic():
            if TripService.trip_has_capacity(trip):
                reservation.status = "CONFIRMADA"
            elif validated_data.get("civil_servant"):
                evicted = PriorityService.evict_lowest_priority_active(trip)
                if evicted:
                    reservation.status = "CONFIRMADA"
                else:
                    reservation.status = "LISTA SECUNDÁRIA"
                    send_admin_leftover_server_alert(
                        trip, validated_data["civil_servant"]
                    )
            else:
                reservation.status = "LISTA SECUNDÁRIA"

            reservation.save()

        TripStatusService.sync_trip_status(trip)

        return reservation


class ManageReservationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Reservation
        fields = "__all__"


class AdminTripReservationsGroupSerializer(serializers.Serializer):
    trip_id = serializers.UUIDField()
    trip_date = serializers.DateField()
    departure_time = serializers.TimeField(format="%H:%M")
    route = serializers.CharField()
    trip_status = serializers.CharField()
    reservation_count = serializers.IntegerField()
    reservations = AdminReservationListSerializer(many=True)


class PunishmentHistorySerializer(serializers.ModelSerializer):
    created_at = serializers.DateTimeField(read_only=True)

    class Meta:
        model = Punishment
        fields = ["id", "description", "is_active", "created_at"]


class AdminPunishmentListSerializer(serializers.ModelSerializer):
    student_name = serializers.SerializerMethodField()
    student_id_display = serializers.SerializerMethodField()
    trip_date = serializers.DateField(source="reservation.trip.trip_date")
    route = serializers.SerializerMethodField()
    departure_time = serializers.TimeField(
        source="reservation.trip.route.departure_time", format="%H:%M"
    )
    reservation_id = serializers.IntegerField(source="reservation.id")

    class Meta:
        model = Punishment
        fields = [
            "id",
            "student_name",
            "student_id_display",
            "description",
            "is_active",
            "trip_date",
            "route",
            "departure_time",
            "reservation_id",
            "created_at",
        ]

    def get_student_name(self, obj):
        return obj.student.user.full_name

    def get_student_id_display(self, obj):
        return obj.student.student_id

    def get_route(self, obj):
        origin = obj.reservation.trip.route.origin
        destiny = obj.reservation.trip.route.destiny
        return f"{origin} → {destiny}"


class AdminTripPunishmentsGroupSerializer(serializers.Serializer):
    trip_id = serializers.UUIDField()
    trip_date = serializers.DateField()
    departure_time = serializers.TimeField(format="%H:%M")
    route = serializers.CharField()
    punishment_count = serializers.IntegerField()
    punishments = AdminPunishmentListSerializer(many=True)


class AdminPunishmentUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Punishment
        fields = ["is_active"]
