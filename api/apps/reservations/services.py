import logging
from datetime import datetime, timedelta

from django.utils import timezone
from webpush import send_user_notification

from apps.trips.models import TripPassenger

from .models import Punishment, Reservation

logger = logging.getLogger("api")


ACTIVE_RESERVATION_STATUSES = ("CONFIRMADA", "PENDENTE")
WAITLIST_STATUS = "LISTA SECUNDÁRIA"
RESERVATION_LIMIT_MINUTES = 30
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
        "student__user", "civil_servant__user", "guest_passenger"
    )


def get_trip_occupancy(trip):
    active_reservations = get_active_reservations_queryset(trip)
    total = active_reservations.count() + trip.trip_passengers.count()
    servers = (
        active_reservations.filter(civil_servant__isnull=False).count()
        + trip.trip_passengers.filter(
            passenger_type=TripPassenger.PassengerType.LOCAL_SERVER
        ).count()
    )
    return total, servers


def trip_has_quorum(trip):
    passengers, servers = get_trip_occupancy(trip)
    return servers >= QUORUM_MIN_SERVERS


def _trip_notification_users(trip):
    users = []
    seen_user_ids = set()

    reservations = Reservation.objects.filter(
        trip=trip, status__in=ACTIVE_RESERVATION_STATUSES
    ).select_related("student__user", "civil_servant__user")

    for reservation in reservations:
        user = None
        if reservation.student_id:
            user = reservation.student.user
        elif reservation.civil_servant_id:
            user = reservation.civil_servant.user

        if user and user.id not in seen_user_ids:
            users.append(user)
            seen_user_ids.add(user.id)

    return users


def _send_trip_push_notification(trip, payload):
    recipients = _trip_notification_users(trip)

    for user in recipients:
        try:
            logger.info(f"Sending webpush notification to {user.email}")
            send_user_notification(user=user, payload=payload, ttl=1000)
        except Exception as exc:
            logger.exception(
                "Failed to send webpush notification to %s: %s", user.email, exc)

    return bool(recipients)


def send_trip_quorum_met_notification(trip):
    if trip.quorum_met_notified_at:
        return False

    payload = {
        "head": "Quórum atingido",
        "body": "O quórum mínimo foi atingido e há pelo menos "
        "1 servidor confirmado na viagem.",
        "url": "/app/",
    }

    sent = _send_trip_push_notification(trip, payload)
    trip.quorum_met_notified_at = timezone.now()
    trip.save(update_fields=["quorum_met_notified_at"])
    return sent


def send_trip_quorum_warning_notification(trip):
    if trip.quorum_warning_notified_at:
        return False

    payload = {
        "head": "Risco de cancelamento",
        "body": "A viagem não atingiu o quórum mínimo até o fechamento das reservas.",
        "url": "/app/",
    }

    sent = _send_trip_push_notification(trip, payload)
    trip.quorum_warning_notified_at = timezone.now()
    trip.save(update_fields=["quorum_warning_notified_at"])
    return sent


def trip_has_capacity(trip):
    if not trip.bus:
        return False

    occupied = (
        get_active_reservations_queryset(trip).count() + trip.trip_passengers.count()
    )
    return occupied < trip.bus.seating_capacity


def get_reservation_status_for_user(user, trip):
    if hasattr(user, "civil_servant_profile"):
        return "CONFIRMADA"

    return "PENDENTE"


def get_priority_tuple(reservation):
    if reservation.civil_servant_id:
        return (0, reservation.created_at)

    if reservation.guest_passenger_id:
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


def get_reservation_passenger_name(reservation):
    if reservation.student_id:
        return reservation.student.user.full_name

    if reservation.civil_servant_id:
        return reservation.civil_servant.user.full_name

    if reservation.guest_passenger_id:
        return reservation.guest_passenger.full_name

    return "Passageiro"


def evict_lowest_priority_active_reservation(trip):
    removable_reservations = list(
        get_active_reservations_queryset(trip)
        .filter(student__isnull=False)
        .select_related("student__user")
    )
    if not removable_reservations:
        return None

    lowest_priority = sorted(
        removable_reservations, key=get_priority_tuple, reverse=True
    )[0]
    lowest_priority.status = "LISTA SECUNDÁRIA"
    lowest_priority.save(update_fields=["status"])
    return lowest_priority


def send_admin_leftover_server_alert(trip, civil_servant):
    """
    Sends an automatic alert (Email and WebPush) to superadmins when a civil servant
    cannot find a seat on a trip.
    """
    from apps.users.models.profiles import AdministratorProfile
    from django.core.mail import send_mail
    from django.conf import settings

    payload = {
        "head": "Servidor sem vaga",
        "body": f"O servidor {civil_servant.user.full_name} não conseguiu vaga na viagem {trip}. Por favor, aloque um novo ônibus.",
        "url": "/app/admin/trips/",
    }

    # Find the superadmins (e.g. Ricardo Mattos)
    superadmins = AdministratorProfile.objects.filter(level=AdministratorProfile.Level.SUPERADMIN)
    
    for admin in superadmins:
        # WebPush notification
        try:
            logger.info(f"Sending webpush notification to {admin.user.email}")
            send_user_notification(user=admin.user, payload=payload, ttl=1000)
        except Exception as exc:
            logger.error("Failed to send webpush notification to %s: %s", admin.user.email, exc)

        # Email notification
        try:
            send_mail(
                subject="Alerta: Servidor sem vaga na viagem",
                message=(
                    f"Olá,\n\n"
                    f"O servidor {civil_servant.user.full_name} tentou reservar a viagem de "
                    f"{trip.route.origin} para {trip.route.destiny} no dia {trip.trip_date}, "
                    f"mas o ônibus já está lotado por outros servidores.\n\n"
                    f"Ação Necessária: Por favor, verifique a disponibilidade de outro ônibus na frota e realize a alocação de um novo veículo para esta viagem no painel administrativo.\n\n"
                    f"Este é um alerta automático de alta prioridade.\n\n"
                    f"Contato de Emergência (Ricardo): +55 75 99744-054"
                ),
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[admin.user.email],
            )
        except Exception as exc:
            logger.error("Failed to send email notification to %s: %s", admin.user.email, exc)


def promote_next_waitlisted_reservation(trip):
    if trip_has_capacity(trip):
        waitlisted = list(get_waitlist_queryset(trip))
        if not waitlisted:
            return None

        next_reservation = sorted(waitlisted, key=get_priority_tuple)[0]
        if next_reservation.guest_passenger_id:
            next_reservation.status = "CONFIRMADA"
        else:
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
    trip.reserved_seats = servers
    trip.save(update_fields=["reserved_seats"])

    if passengers == 0:
        desired_status = "RISCO DE CANCELAMENTO"
    elif servers >= QUORUM_MIN_SERVERS:
        desired_status = "CONFIRMADA"
    elif not is_reservation_open(trip):
        desired_status = "RISCO DE CANCELAMENTO"
    else:
        desired_status = "RISCO DE CANCELAMENTO"

    if trip.status != desired_status:
        trip.status = desired_status
        trip.save(update_fields=["status"])

    if desired_status == "CONFIRMADA":
        if trip.quorum_warning_notified_at is not None:
            trip.quorum_warning_notified_at = None
            trip.save(update_fields=["quorum_warning_notified_at"])

        if trip.quorum_met_notified_at is None:
            send_trip_quorum_met_notification(trip)
    elif trip.quorum_met_notified_at is not None:
        trip.quorum_met_notified_at = None
        trip.save(update_fields=["quorum_met_notified_at"])

    return trip


def process_trip_punishments(trip):
    """
    It processes absences and presences at the end of a trip.
    It applies penalties to those who were absent and forgives
    one active penalty (the oldest) for those who traveled.
    """

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
