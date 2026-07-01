import resend
from django.conf import settings
from django.core.mail.backends.base import BaseEmailBackend


class ResendEmailBackend(BaseEmailBackend):
    """Django email backend using Resend API. Moved from config/email_backend.py."""

    def __init__(self, fail_silently=False, **kwargs):
        super().__init__(fail_silently=fail_silently, **kwargs)
        if not hasattr(settings, "RESEND_API_KEY"):
            raise ValueError("RESEND_API_KEY is not defined in settings")
        resend.api_key = settings.RESEND_API_KEY

    def send_messages(self, email_messages):
        if not email_messages:
            return 0

        count = 0
        for message in email_messages:
            try:
                params = {
                    "from": message.from_email or settings.DEFAULT_FROM_EMAIL,
                    "to": message.to,
                    "subject": message.subject,
                }

                # Check if it's an EmailMultiAlternatives with HTML content
                if hasattr(message, "alternatives") and message.alternatives:
                    for content, mimetype in message.alternatives:
                        if mimetype == "text/html":
                            params["html"] = content
                            break

                # Fallback to text body if no HTML or just text
                if "html" not in params:
                    params["text"] = message.body
                elif message.body:
                    params["text"] = message.body

                resend.Emails.send(params)
                count += 1
            except Exception:
                if not self.fail_silently:
                    raise
        return count
