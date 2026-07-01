import logging

from webpush import send_user_notification

from . import BaseNotificationBackend

logger = logging.getLogger("api")


class PushBackend(BaseNotificationBackend):
    """Deliver notifications via WebPush (browser push)."""

    def send(self, recipient, payload: dict) -> bool:
        """
        recipient: Django User instance
        payload:      {"head": str, "body": str, "url": str}
        """
        try:
            logger.info("Sending webpush notification to %s", recipient.email)
            send_user_notification(user=recipient, payload=payload, ttl=1000)
            return True
        except Exception:
            logger.exception("Failed to send webpush to %s", recipient.email)
            return False
