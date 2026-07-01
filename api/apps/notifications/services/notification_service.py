import logging

from django.utils import timezone

from apps.reservations.models import Reservation

from .email_service import EmailService
from .push_service import PushService

logger = logging.getLogger("api")

ACTIVE_RESERVATION_STATUSES = ("CONFIRMADA", "PENDENTE")


class NotificationService:
    """
    Channel-agnostic notification facade.
    Currently: Push + Email fallback.
    Future channels (SMS, WhatsApp) are added as backends here.
    """

    # ------------------------------------------------------------------
    # Trip notifications
    # ------------------------------------------------------------------
    @staticmethod
    def notify_route_admin(trip, payload: dict) -> bool:
        """Send push to the trip admin."""
        admin = trip.route.administrator
        if not admin:
            return False
        return PushService.send_to_users([admin.user], payload) > 0

    @staticmethod
    def notify_admin(trip, payload: dict) -> bool:
        """Send email to the trip admin."""
        admin = trip.route.administrator
        if not admin:
            return False
        return EmailService.send_to_users([admin.user], payload) > 0

    @staticmethod
    def notify_trip_users(trip, payload: dict) -> bool:
        """Send push to all active reservation holders for a trip."""
        recipients = NotificationService._trip_notification_users(trip)
        if not recipients:
            return False

        sent = PushService.send_to_users(recipients, payload)
        return sent > 0

    @staticmethod
    def _trip_notification_users(trip):
        """Collect users with active reservations for a trip."""
        users = []
        seen = set()

        reservations = Reservation.objects.filter(
            trip=trip, status__in=ACTIVE_RESERVATION_STATUSES
        ).select_related("student__user", "civil_servant__user")

        for reservation in reservations:
            user = None
            if reservation.student_id:
                user = reservation.student.user
            elif reservation.civil_servant_id:
                user = reservation.civil_servant.user

            if user and user.id not in seen:
                users.append(user)
                seen.add(user.id)

        return users

    # ------------------------------------------------------------------
    # Quorum notifications (push + email fallback planned)
    # ------------------------------------------------------------------

    @staticmethod
    def notify_quorum_met(trip) -> bool:
        """Notify passengers that quorum has been met."""
        if trip.quorum_met_notified_at:
            return False

        payload = {
            "head": "Quórum atingido",
            "body": (
                "O quórum mínimo foi atingido e há pelo menos "
                "1 servidor confirmado na viagem."
            ),
            "url": "/app/",
        }

        sent = NotificationService.notify_trip_users(trip, payload)
        trip.quorum_met_notified_at = timezone.now()
        trip.save(update_fields=["quorum_met_notified_at"])
        return sent

    @staticmethod
    def notify_quorum_warning(trip) -> bool:
        """Notify passengers that quorum was not met by the deadline."""
        if trip.quorum_warning_notified_at:
            return False

        payload = {
            "head": "Risco de cancelamento",
            "body": (
                "A viagem não atingiu o quórum mínimo "
                "até o fechamento das reservas."
            ),
            "url": "/app/",
        }

        sent = NotificationService.notify_trip_users(trip, payload)
        trip.quorum_warning_notified_at = timezone.now()
        trip.save(update_fields=["quorum_warning_notified_at"])
        return sent

    # ------------------------------------------------------------------
    # Email notifications (OTP)
    # ------------------------------------------------------------------

    @staticmethod
    def send_verification_email(email, code, purpose="registration"):
        """Send OTP verification email."""
        EmailService.send_verification(email, code, purpose)

    @staticmethod
    def send_password_reset_email(email, code):
        """Send password reset email."""
        EmailService.send_password_reset(email, code)
