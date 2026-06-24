# ---------------------------------------------------------------------------
# Re-exports from organized service modules (constants, priority, reservation)
# ---------------------------------------------------------------------------

from django.utils import timezone  # noqa: F401 — re-exported for test mocking
from webpush import send_user_notification  # noqa: F401 — re-exported for test mocking

from .constants import (
    ACTIVE_RESERVATION_STATUSES,
)
from .constants import (
    WAITLIST_STATUS as WAITLIST_STATUS,
)
from .priority_service import PriorityService
from .reservation_service import ReservationService

# ---------------------------------------------------------------------------
# Backward-compatible function aliases (old flat module interface)
# ---------------------------------------------------------------------------

get_priority_tuple = PriorityService.get_priority_tuple
evict_lowest_priority_active_reservation = PriorityService.evict_lowest_priority_active
get_reservation_status_for_user = ReservationService.get_status_for_user
get_reservation_passenger_name = ReservationService.get_passenger_name
get_waitlist_queryset = ReservationService.get_waitlist_queryset
promote_next_waitlisted_reservation = ReservationService.promote_next_waitlisted

# ---------------------------------------------------------------------------
# Re-exports from trips/services (backward compatibility)
# ---------------------------------------------------------------------------

from apps.trips.services.trip_service import TripService  # noqa: E402
from apps.trips.services.trip_status_service import TripStatusService  # noqa: E402

_departure_datetime = TripService._departure_datetime
reservation_cutoff = TripService.reservation_cutoff
is_reservation_open = TripService.is_reservation_open
trip_has_capacity = TripService.trip_has_capacity
trip_has_quorum = TripService.trip_has_quorum
get_trip_occupancy = TripService.get_trip_occupancy
get_active_reservations_queryset = TripService._get_active_reservations_queryset
sync_trip_status = TripStatusService.sync_trip_status
send_trip_quorum_met_notification = TripStatusService._send_quorum_met_notification
send_trip_quorum_warning_notification = (
    TripStatusService.send_quorum_warning_notification
)
_trip_notification_users = TripStatusService._notification_users
_send_trip_push_notification = TripStatusService._send_push

# ---------------------------------------------------------------------------
# process_trip_punishments — defined here to avoid circular imports
# ---------------------------------------------------------------------------

import logging  # noqa: E402

logger = logging.getLogger("api")


def process_trip_punishments(trip):
    """
    It processes absences and presences at the end of a trip.
    It applies penalties to those who were absent and forgives
    one active penalty (the oldest) for those who traveled.
    """
    from apps.reservations.models import Punishment, Reservation

    reservations = Reservation.objects.filter(
        trip=trip, status__in=ACTIVE_RESERVATION_STATUSES
    )

    for reservation in reservations:
        if not reservation.student_id:
            continue

        if reservation.check_in:
            punishment = (
                Punishment.objects
                .filter(
                    student=reservation.student,
                    is_active=True,
                )
                .order_by("created_at")
                .first()
            )

            if punishment:
                punishment.is_active = False
                punishment.save(update_fields=["is_active"])
        else:
            Punishment.objects.get_or_create(
                reservation=reservation,
                defaults={
                    "student": reservation.student,
                    "description": (
                        f"Faltou ao check-in na viagem {trip.route} em "
                        f"{trip.trip_date.strftime('%d/%m/%Y')}"
                    ),
                    "is_active": True,
                },
            )


def validate_trip_reservation_window(trip):
    if not is_reservation_open(trip):
        raise ValueError("Prazo de reserva encerrado.")


def validate_trip_quorum_window(trip):
    return trip_has_quorum(trip)
