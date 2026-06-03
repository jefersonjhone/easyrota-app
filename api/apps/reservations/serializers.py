from django.utils import timezone
from rest_framework import serializers

from ..trips.models import GuestPassenger, Trip
from .models import Punishment, Reservation
from .services import (
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
            raise serializers.ValidationError(
                "Perfil sem permissão para reservar.")

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
            raise serializers.ValidationError(
                "Você já possui reserva nesta viagem.")

        if (
            hasattr(user, "civil_servant_profile")
            and Reservation.objects.filter(
                trip=trip, civil_servant=user.civil_servant_profile
            ).exists()
        ):
            raise serializers.ValidationError(
                "Você já possui reserva nesta viagem.")

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
        seating_capacity = obj.bus.seating_capacity if obj.bus else 0
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
