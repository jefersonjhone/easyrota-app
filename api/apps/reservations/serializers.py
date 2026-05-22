from datetime import datetime, timedelta

from django.utils import timezone
from rest_framework import serializers

from ..trips.models import Trip
from .models import Reservation


class ReservationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Reservation
        fields = ["trip"]

    def validate_trip(self, trip):
        """Ensures the trip still has 3 hours until departure time.
        A seat must be reserved ONLY up to 3 hours before departure time."""

        departure = timezone.make_aware(
            datetime.combine(trip.trip_date, trip.route.departure_time)
        )

        limit = departure - timedelta(hours=3)

        if timezone.now() >= limit:
            raise serializers.ValidationError("Prazo de reserva encerrado.")

        return trip

    # TODO: Implement priority business rules 
    # (students, civil servants, guests and punishments)


class ReservationHistorySerializer(serializers.ModelSerializer):
    """Serializer for trips history page."""

    origin = serializers.CharField(source="trip.route.origin")
    destiny = serializers.CharField(source="trip.route.destiny")
    trip_date = serializers.DateField(source="trip.trip_date")

    trip_history_status = serializers.SerializerMethodField()
    total_trips = serializers.SerializerMethodField()

    class Meta:
        model = Reservation
        fields = [
            "id",
            "origin",
            "destiny",
            "trip_date",
            "trip_history_status",
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
    available_seats = serializers.SerializerMethodField()
    is_full = serializers.SerializerMethodField()
    is_reservable = serializers.SerializerMethodField()

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
            "is_full",
            "is_reservable",
        ]

    def get_status_trip(self, obj):
        return obj.get_status_display()

    def get_available_seats(self, obj):
        reserved_seats = getattr(obj, "reserved_seats", 0)
        return max(obj.bus.seating_capacity - reserved_seats, 0)

    def get_is_full(self, obj):
        return self.get_available_seats(obj) == 0

    def get_is_reservable(self, obj):
        cutoff = timezone.now() + timedelta(hours=3)
        current_tz = timezone.get_current_timezone()
        departure = timezone.make_aware(
            datetime.combine(obj.trip_date, obj.route.departure_time),
            current_tz,
        )
        if departure <= cutoff:
            return False
        if obj.status != "CONFIRMADA":
            return False
        return self.get_available_seats(obj) > 0


class ManageReservationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Reservation
        fields = "__all__"
