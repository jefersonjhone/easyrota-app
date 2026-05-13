from datetime import datetime, timedelta

from django.utils import timezone
from rest_framework import serializers

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
