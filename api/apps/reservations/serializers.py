from django.db import transaction
from django.utils import timezone
from rest_framework import serializers

from ..trips.models import GuestPassenger, Trip
from ..users.models.profiles import CivilServantProfile, StudentProfile
from .models import Punishment, Reservation
from .services import (
    ACTIVE_RESERVATION_STATUSES,
    get_reservation_status_for_user,
    is_reservation_open,
    reservation_cutoff,
    trip_has_capacity,
    trip_has_quorum,
)


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

        reservation = Reservation(trip=trip)

        if hasattr(user, "student_profile"):
            reservation.student = user.student_profile
        elif hasattr(user, "civil_servant_profile"):
            reservation.civil_servant = user.civil_servant_profile

        if trip_has_capacity(trip):
            reservation.status = get_reservation_status_for_user(user, trip)
        elif hasattr(user, "civil_servant_profile"):
            # If full, try to evict a student to accommodate the civil servant
            from .services import (
                evict_lowest_priority_active_reservation,
                send_admin_leftover_server_alert,
            )

            evicted = evict_lowest_priority_active_reservation(trip)
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
        reservation = Reservation(trip=trip, guest_passenger=guest)
        if trip_has_capacity(trip):
            # reserva sempre confirmada para convidados e servidores publicos
            reservation.status = "CONFIRMADA"
        else:
            reservation.status = "LISTA SECUNDÁRIA"

        reservation.save()
        return reservation


class ReservationHistorySerializer(serializers.ModelSerializer):
    """Serializer for trips history page."""

    origin = serializers.CharField(source="trip.route.origin")
    destiny = serializers.CharField(source="trip.route.destiny")
    trip_date = serializers.DateField(source="trip.trip_date")
    trip_id = serializers.IntegerField(source="trip.id")
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

        if hasattr(user, "student_profile"):
            return Reservation.objects.filter(student=user.student_profile).count()

        if hasattr(user, "civil_servant_profile"):
            return Reservation.objects.filter(
                civil_servant=user.civil_servant_profile
            ).count()

        return 0


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
        from .services import get_trip_occupancy
        
        total_occupied, server_occupied = get_trip_occupancy(obj)
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
        base_reservable = obj.status != "CANCELADA" and is_reservation_open(obj)
        if not base_reservable:
            return False

        if self.get_available_seats(obj) > 0:
            return True

        # Special case: Civil servants can reserve 
        # if full but an unallocated bus is available
        user = self.context["request"].user
        if hasattr(user, "civil_servant_profile"):
            from ..trips.services import has_available_bus
            return has_available_bus(obj.trip_date, obj.route)

        return False

    def get_quorum_met(self, obj):
        return trip_has_quorum(obj)

    def get_reservation_deadline(self, obj):
        return reservation_cutoff(obj)


class AdminReservationListSerializer(serializers.ModelSerializer):
    passenger_name = serializers.SerializerMethodField()
    passenger_type = serializers.SerializerMethodField()
    passenger_id_display = serializers.SerializerMethodField()
    trip_id = serializers.IntegerField(source="trip.id")
    trip_date = serializers.DateField(source="trip.trip_date")
    route = serializers.SerializerMethodField()
    departure_time = serializers.TimeField(source="trip.route.departure_time", format="%H:%M")
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
    passenger_type = serializers.ChoiceField(choices=["ESTUDANTE", "SERVIDOR", "CONVIDADO"])
    profile_id = serializers.IntegerField(required=False, allow_null=True, default=None)
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
                raise serializers.ValidationError(
                    {"profile_id": "Campo obrigatório para estudante/servidor."}
                )

            if passenger_type == "ESTUDANTE":
                try:
                    profile = StudentProfile.objects.get(id=profile_id)
                except StudentProfile.DoesNotExist:
                    raise serializers.ValidationError(
                        {"profile_id": "Estudante não encontrado."}
                    )
                if Reservation.objects.filter(trip=trip, student=profile).exists():
                    raise serializers.ValidationError(
                        "Estudante já possui reserva nesta viagem."
                    )
                data["student"] = profile

            else:
                try:
                    profile = CivilServantProfile.objects.get(id=profile_id)
                except CivilServantProfile.DoesNotExist:
                    raise serializers.ValidationError(
                        {"profile_id": "Servidor não encontrado."}
                    )
                if Reservation.objects.filter(trip=trip, civil_servant=profile).exists():
                    raise serializers.ValidationError(
                        "Servidor já possui reserva nesta viagem."
                    )
                data["civil_servant"] = profile

        else:
            guest_name = data.get("guest_name", "").strip()
            guest_cpf = data.get("guest_cpf", "").strip()
            if not guest_name or not guest_cpf:
                raise serializers.ValidationError(
                    {"guest_name": "Nome e CPF obrigatórios para convidado."}
                )

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
            from .services import (
                evict_lowest_priority_active_reservation,
                send_admin_leftover_server_alert,
            )

            if trip_has_capacity(trip):
                reservation.status = "CONFIRMADA"
            elif validated_data.get("civil_servant"):
                evicted = evict_lowest_priority_active_reservation(trip)
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

        from .services import sync_trip_status
        sync_trip_status(trip)

        return reservation


class ManageReservationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Reservation
        fields = "__all__"


class AdminTripReservationsGroupSerializer(serializers.Serializer):
    trip_id = serializers.IntegerField()
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
    departure_time = serializers.TimeField(source="reservation.trip.route.departure_time", format="%H:%M")
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
        return f"{obj.reservation.trip.route.origin} → {obj.reservation.trip.route.destiny}"


class AdminTripPunishmentsGroupSerializer(serializers.Serializer):
    trip_id = serializers.IntegerField()
    trip_date = serializers.DateField()
    departure_time = serializers.TimeField(format="%H:%M")
    route = serializers.CharField()
    punishment_count = serializers.IntegerField()
    punishments = AdminPunishmentListSerializer(many=True)


class AdminPunishmentUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Punishment
        fields = ["is_active"]
