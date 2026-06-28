import logging
from datetime import datetime, timedelta

from django.utils import timezone

logger = logging.getLogger("api")

QUORUM_MIN_SERVERS = 1
QUORUM_WARNING_THRESHOLD = 0.75


class TripStatusService:
    """Trip status machine: computes and synchronizes trip status,
    including quorum notifications."""

    # ------------------------------------------------------------------
    # Status computation (from MyNextTripView._update_trip_status)
    # ------------------------------------------------------------------

    @staticmethod
    def compute_status(trip):
        """
        Evaluate schedule, reservations and driver actions
        to determine the correct operational status.
        Persists the change if different from current.
        """
        if trip.status in ["CONCLUÍDA", "CANCELADA"]:
            return trip

        now = timezone.now()

        if trip.arrival_timestamp:
            real_status = "CONCLUÍDA"
        elif trip.departure_timestamp:
            real_status = "EM ANDAMENTO"
        else:
            has_civil_servant = trip.reservation_set.filter(
                civil_servant__isnull=False
            ).exists()

            time_zone = timezone.get_current_timezone()
            expected_dep = timezone.make_aware(
                datetime.combine(trip.trip_date, trip.route.departure_time),
                time_zone,
            )
            expected_arr = timezone.make_aware(
                datetime.combine(trip.trip_date, trip.route.arrival_time),
                time_zone,
            )

            if expected_arr <= expected_dep:
                expected_arr += timedelta(days=1)

            if not has_civil_servant:
                cancel_limit = expected_dep + timedelta(minutes=30)
                if now >= cancel_limit:
                    real_status = "CANCELADA"
                else:
                    real_status = "RISCO DE CANCELAMENTO"
            else:
                if now >= expected_arr:
                    real_status = "CANCELADA"
                else:
                    real_status = "CONFIRMADA"

        if trip.status != real_status:
            trip.status = real_status
            trip.save(update_fields=["status"])

        return trip

    # ------------------------------------------------------------------
    # Status synchronization (from reservations/services.py)
    # ------------------------------------------------------------------

    @staticmethod
    def sync_trip_status(trip):
        """
        Recalculate and persist trip status based on occupancy and quorum.
        Also manages quorum-related push notifications.
        """
        if trip.status in {"CANCELADA", "CONCLUÍDA", "EM ANDAMENTO"}:
            return trip

        from apps.notifications.services.notification_service import NotificationService

        from .trip_service import TripService

        _passengers, servers = TripService.get_trip_occupancy(trip)
        trip.reserved_seats = _passengers
        trip.save(update_fields=["reserved_seats"])

        # Determine desired status
        if _passengers == 0:
            desired_status = "RISCO DE CANCELAMENTO"
        elif servers >= QUORUM_MIN_SERVERS:
            desired_status = "CONFIRMADA"
        elif not TripService.is_reservation_open(trip):
            desired_status = "RISCO DE CANCELAMENTO"
        else:
            desired_status = "RISCO DE CANCELAMENTO"

        if servers / trip.seating_capacity > QUORUM_WARNING_THRESHOLD:
            origin = trip.origin
            dest = trip.destination
            payload = {
                "message": (
                    f"A viagem {origin} para {dest} {trip.date} está com "
                    f"{servers} reservas de servidores, pode ser"
                    "necessário alocar um mais um veículo."
                ),
                "subject": f"Alerta: viagem {origin}→{dest} {trip.date}",
            }
            NotificationService.notify_admin(trip, payload)

        if trip.status != desired_status:
            trip.status = desired_status
            trip.save(update_fields=["status"])

        # --- quorum notifications (delegated to NotificationService) ---
        if desired_status == "CONFIRMADA":
            if trip.quorum_warning_notified_at is not None:
                trip.quorum_warning_notified_at = None
                trip.save(update_fields=["quorum_warning_notified_at"])

            if trip.quorum_met_notified_at is None:
                NotificationService.notify_quorum_met(trip)
        elif trip.quorum_met_notified_at is not None:
            trip.quorum_met_notified_at = None
            trip.save(update_fields=["quorum_met_notified_at"])

        return trip

    # ------------------------------------------------------------------
    # Backward-compatible aliases (delegate to NotificationService)
    # ------------------------------------------------------------------

    @staticmethod
    def _notification_users(trip):
        from apps.notifications.services.notification_service import NotificationService

        return NotificationService._trip_notification_users(trip)

    @staticmethod
    def _send_push(trip, payload):
        from apps.notifications.services.push_service import PushService

        recipients = TripStatusService._notification_users(trip)
        return PushService.send_to_users(recipients, payload)

    @staticmethod
    def _send_quorum_met_notification(trip):
        from apps.notifications.services.notification_service import NotificationService

        return NotificationService.notify_quorum_met(trip)

    @staticmethod
    def send_quorum_warning_notification(trip):
        from apps.notifications.services.notification_service import NotificationService

        return NotificationService.notify_quorum_warning(trip)
