import logging

from django.core.mail import send_mail  # noqa: F401 — re-exported for test mocking

logger = logging.getLogger("api")

OTP_EXPIRATION_MINUTES = 10


# ---------------------------------------------------------------------------
# Re-export EmailService from canonical location (lazy to avoid circular imports)
# ---------------------------------------------------------------------------

def __getattr__(name):
    if name == "EmailService":
        from apps.notifications.services.email_service import EmailService

        return EmailService
    raise AttributeError(f"module {__name__!r} has no attribute {name!r}")
