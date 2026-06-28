import logging

from django.conf import settings
from django.core.mail import send_mail
from webpush import send_user_notification

from apps.users.models.profiles import AdministratorProfile

logger = logging.getLogger("api")


def send_admin_leftover_server_alert(trip, civil_servant):
    """
    Sends an automatic alert (Email and WebPush) to superadmins when a civil servant
    cannot find a seat on a trip.
    """
    payload = {
        "head": "Servidor sem vaga",
        "body": f"O servidor {civil_servant.user.full_name} não conseguiu vaga na "
                f"viagem {trip}. Por favor, aloque um novo ônibus.",
        "url": "/app/admin/trips/",
    }

    superadmins = AdministratorProfile.objects.filter(
        level=AdministratorProfile.Level.SUPERADMIN
    )

    for admin in superadmins:
        try:
            logger.info(f"Sending webpush notification to {admin.user.email}")
            send_user_notification(user=admin.user, payload=payload, ttl=1000)
        except Exception as exc:
            logger.error(
                "Failed to send webpush notification to %s: %s", admin.user.email, exc
            )

        try:
            send_mail(
                subject=payload["head"],
                message=payload["body"],
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[admin.user.email],
                fail_silently=False,
            )
        except Exception as exc:
            logger.error(
                "Failed to send email to %s: %s", admin.user.email, exc
            )
