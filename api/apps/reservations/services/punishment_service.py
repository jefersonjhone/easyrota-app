import logging

from .constants import ACTIVE_RESERVATION_STATUSES

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
