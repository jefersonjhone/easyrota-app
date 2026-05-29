from datetime import datetime, timedelta

from django.utils import timezone

from .models import Punishment, Reservation

ACTIVE_RESERVATION_STATUSES = ("CONFIRMADA", "PENDENTE")
WAITLIST_STATUS = "LISTA SECUNDÁRIA"
RESERVATION_LIMIT_MINUTES = 30
QUORUM_MIN_PASSENGERS = 5
QUORUM_MIN_SERVERS = 1


def _departure_datetime(trip):
    time_zone = timezone.get_current_timezone()
    return timezone.make_aware(
        datetime.combine(trip.trip_date, trip.route.departure_time),
        time_zone,
    )


def reservation_cutoff(trip):
    return _departure_datetime(trip) - timedelta(minutes=RESERVATION_LIMIT_MINUTES)


def is_reservation_open(trip):
    if trip.status == "CANCELADA":
        return False

    return timezone.now() < reservation_cutoff(trip)


def get_active_reservations_queryset(trip):
    return Reservation.objects.filter(trip=trip, status__in=ACTIVE_RESERVATION_STATUSES)


def get_waitlist_queryset(trip):
    return Reservation.objects.filter(trip=trip, status=WAITLIST_STATUS).select_related(
        "student", "civil_servant"
    )


def get_trip_occupancy(trip):
    active_reservations = get_active_reservations_queryset(trip)
    total = active_reservations.count()
    servers = active_reservations.filter(civil_servant__isnull=False).count()
    return total, servers


def trip_has_quorum(trip):
    passengers, servers = get_trip_occupancy(trip)
    return passengers >= QUORUM_MIN_PASSENGERS and servers >= QUORUM_MIN_SERVERS


def trip_has_capacity(trip):
    if not trip.bus:
        return False

    return get_active_reservations_queryset(trip).count() < trip.bus.seating_capacity


def get_reservation_status_for_user(user, trip):
    if hasattr(user, "civil_servant_profile"):
        return "CONFIRMADA"

    return "PENDENTE"


def get_priority_tuple(reservation):
    if reservation.civil_servant_id:
        return (0, reservation.created_at)

    if reservation.student_id:
        active_punishments_count = Punishment.objects.filter(
            student=reservation.student, is_active=True
        ).count()

        if active_punishments_count >= 2:
            priority = 3
        elif active_punishments_count == 1:
            priority = 2
        else:
            priority = 1

        return (priority, reservation.created_at)

    return (4, reservation.created_at)


def promote_next_waitlisted_reservation(trip):
    if trip_has_capacity(trip):
        waitlisted = list(get_waitlist_queryset(trip))
        if not waitlisted:
            return None

        next_reservation = sorted(waitlisted, key=get_priority_tuple)[0]
        next_reservation.status = get_reservation_status_for_user(
            next_reservation.civil_servant.user
            if next_reservation.civil_servant_id
            else next_reservation.student.user,
            trip,
        )
        next_reservation.save(update_fields=["status"])
        return next_reservation

    return None


def sync_trip_status(trip):
    if trip.status in {"CANCELADA", "CONCLUÍDA", "EM ANDAMENTO"}:
        return trip

    passengers, servers = get_trip_occupancy(trip)

    if passengers == 0:
        desired_status = "RISCO DE CANCELAMENTO"
    elif passengers >= QUORUM_MIN_PASSENGERS and servers >= QUORUM_MIN_SERVERS:
        desired_status = "CONFIRMADA"
    elif not is_reservation_open(trip):
        desired_status = "RISCO DE CANCELAMENTO"
    else:
        desired_status = "RISCO DE CANCELAMENTO"

    if trip.status != desired_status:
        trip.status = desired_status
        trip.save(update_fields=["status"])

    return trip


def process_trip_punishments(trip):
    """
    It processes absences and presences at the end of a trip.
    It applies penalties to those who were absent and forgives
    those who traveled.
    """

    reservations = Reservation.objects.filter(
        trip=trip, status__in=ACTIVE_RESERVATION_STATUSES
    )

    for reservation in reservations:
        if not reservation.student_id:
            continue

        if reservation.check_in:
            Punishment.objects.filter(
                student=reservation.student, is_active=True
            ).update(is_active=False)
        else:
            Punishment.objects.get_or_create(
                reservation=reservation,
                defaults={
                    "student": reservation.student,
                    "description": (
                        f"Faltou ao check-in na viagem {trip.route} em {trip.trip_date}"
                    ),
                    "is_active": True,
                },
            )


def validate_trip_reservation_window(trip):
    if not is_reservation_open(trip):
        raise ValueError("Prazo de reserva encerrado.")


def validate_trip_quorum_window(trip):
    return trip_has_quorum(trip)
