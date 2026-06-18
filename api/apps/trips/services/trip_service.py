import logging
from datetime import datetime, timedelta

from django.utils import timezone

from apps.notifications.services.notification_service import NotificationService
from apps.reservations.models import Reservation

from ..models import Trip, TripPassenger

logger = logging.getLogger("api")

RESERVATION_LIMIT_MINUTES = 30
QUORUM_MIN_SERVERS = 1
ACTIVE_RESERVATION_STATUSES = ("CONFIRMADA", "PENDENTE")


class TripService:
    """Core trip business logic: lifecycle, assignment, capacity, validation."""

    # ------------------------------------------------------------------
    # Lifecycle
    # ------------------------------------------------------------------

    @staticmethod
    def start_trip(trip):
        """Mark a trip as in-progress and record the departure timestamp."""
        Trip.objects.filter(id=trip.id).update(
            status="EM ANDAMENTO",
            departure_timestamp=timezone.now(),
        )
        NotificationService.notify_trip_users(trip, {"message": "A viagem começou!"})
        from apps.reservations.services import process_trip_punishments

        process_trip_punishments(trip)

    @staticmethod
    def finish_trip(trip):
        """Mark a trip as concluded and record the arrival timestamp."""
        Trip.objects.filter(id=trip.id).update(
            status="CONCLU\u00cdDA",
            arrival_timestamp=timezone.now(),
        )

    # ------------------------------------------------------------------
    # Driver assignment
    # ------------------------------------------------------------------

    @staticmethod
    def assign_driver(trip, driver):
        """Associate a driver profile with the trip."""
        trip.driver = driver
        trip.save()

    @staticmethod
    def unassign_driver(trip):
        """Remove driver association from the trip."""
        trip.driver = None
        trip.save()

    @staticmethod
    def can_assign_driver(trip, driver):
        """Check whether the given driver can be assigned."""
        return trip.driver is None or trip.driver == driver

    @staticmethod
    def can_unassign_driver(trip, driver):
        """Check whether the given driver can unassign from the trip."""
        return trip.driver and trip.driver == driver

    # ------------------------------------------------------------------
    # Bus assignment
    # ------------------------------------------------------------------

    @staticmethod
    def assign_bus(trip, bus):
        """Associate a bus with the trip and update seating capacity."""
        trip.bus = bus
        trip.seating_capacity = bus.seating_capacity
        trip.save()

    @staticmethod
    def unassign_bus(trip):
        """Remove bus association and reset to default capacity."""
        trip.bus = None
        trip.seating_capacity = 46
        trip.save()

    @staticmethod
    def can_assign_bus(trip, driver):
        """Check whether the driver can assign a bus to this trip."""
        return trip.driver and trip.driver == driver

    # ------------------------------------------------------------------
    # Capacity & quorum
    # ------------------------------------------------------------------

    @staticmethod
    def _departure_datetime(trip):
        """Compute the aware departure datetime from trip_date and route."""
        time_zone = timezone.get_current_timezone()
        return timezone.make_aware(
            datetime.combine(trip.trip_date, trip.route.departure_time),
            time_zone,
        )

    @staticmethod
    def _arrival_datetime(trip):
        """Compute the aware arrival datetime, handling overnight trips."""
        time_zone = timezone.get_current_timezone()
        arr = timezone.make_aware(
            datetime.combine(trip.trip_date, trip.route.arrival_time),
            time_zone,
        )
        dep = TripService._departure_datetime(trip)
        if arr <= dep:
            arr += timedelta(days=1)
        return arr

    @staticmethod
    def reservation_cutoff(trip):
        """Datetime after which reservations are no longer accepted."""
        return TripService._departure_datetime(trip) - timedelta(
            minutes=RESERVATION_LIMIT_MINUTES
        )

    @staticmethod
    def is_reservation_open(trip):
        """Check if reservations are still open for this trip."""
        if trip.status == "CANCELADA":
            return False
        return timezone.now() < TripService.reservation_cutoff(trip)

    @staticmethod
    def _get_active_reservations_queryset(trip):
        return Reservation.objects.filter(
            trip=trip, status__in=ACTIVE_RESERVATION_STATUSES
        )

    @staticmethod
    def get_trip_occupancy(trip):
        """Return (total_passengers, server_count) for the trip."""
        active = TripService._get_active_reservations_queryset(trip)
        total = active.count() + trip.trip_passengers.count()
        servers = (
            active.filter(civil_servant__isnull=False).count()
            + trip.trip_passengers.filter(
                passenger_type=TripPassenger.PassengerType.LOCAL_SERVER
            ).count()
        )
        return total, servers

    @staticmethod
    def trip_has_capacity(trip):
        """Check if there's at least one free seat."""
        if not trip.bus:
            return 46
        occupied = (
            TripService._get_active_reservations_queryset(trip).count()
            + trip.trip_passengers.count()
        )
        return occupied < trip.bus.seating_capacity

    @staticmethod
    def trip_has_quorum(trip):
        """Check if the minimum number of servers is met."""
        _passengers, servers = TripService.get_trip_occupancy(trip)
        return servers >= QUORUM_MIN_SERVERS

    # ------------------------------------------------------------------
    # Validation (from TripSerializer)
    # ------------------------------------------------------------------

    @staticmethod
    def validate_trip(data, instance=None):
        """
        Business rule validation for trip data.
        Raises ValidationError from rest_framework.serializers on failure.
        Returns the (possibly modified) data dict on success.
        """
        from rest_framework import serializers

        bus = data.get("bus", instance.bus if instance else None)
        trip_date = data.get("trip_date", instance.trip_date if instance else None)
        route = data.get("route", instance.route if instance else None)
        status_value = data.get("status", instance.status if instance else None)

        now = timezone.localtime()
        tz = timezone.get_current_timezone()

        # --- date in the past ---
        if trip_date and trip_date < now.date():
            raise serializers.ValidationError({
                "trip_date": "A data da viagem não pode estar no passado."
            })

        if status_value == "EM ANDAMENTO" and trip_date and trip_date < now.date():
            raise serializers.ValidationError({
                "trip_date": "A data da viagem não pode estar no passado."
            })

        # --- grace period for new / changed trips ---
        if trip_date and route:
            expected_dep = timezone.make_aware(
                datetime.combine(trip_date, route.departure_time), tz
            )

            is_new = instance is None
            date_changed = instance and instance.trip_date != trip_date
            route_changed = instance and instance.route != route

            if is_new or date_changed or route_changed:
                grace_limit = expected_dep + timedelta(hours=1)
                if now > grace_limit:
                    raise serializers.ValidationError({
                        "route": "Não é possível agendar uma viagem "
                        "para um horário que já passou hoje."
                    })

        # --- starting trip validation ---
        if status_value == "EM ANDAMENTO":
            if trip_date == now.date() and route:
                expected_dep = timezone.make_aware(
                    datetime.combine(trip_date, route.departure_time), tz
                )
                if now < expected_dep - timedelta(minutes=30):
                    raise serializers.ValidationError({
                        "status": "Muito cedo para iniciar a viagem. "
                        "O horário previsto é {}.".format(
                            route.departure_time.strftime("%H:%M")
                        )
                    })
            elif trip_date and trip_date > now.date():
                raise serializers.ValidationError({
                    "status": "Não é possível iniciar uma viagem "
                    "agendada para o futuro."
                })

            departure = data.get(
                "departure_timestamp",
                instance.departure_timestamp if instance else None,
            )
            if not departure:
                data["departure_timestamp"] = now

        # --- bus overlap check ---
        if bus and trip_date and route:
            overlapping_trips = Trip.objects.with_overlap(
                bus, trip_date, route,
                exclude_id=instance.id if instance else None,
            )

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
                        existing_trip.trip_date,
                        existing_trip.route.departure_time,
                    ),
                    tz,
                )
                ex_end = timezone.make_aware(
                    datetime.combine(
                        existing_trip.trip_date,
                        existing_trip.route.arrival_time,
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
