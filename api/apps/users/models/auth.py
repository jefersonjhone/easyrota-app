import uuid

from django.conf import settings
from django.db import models
from django.utils import timezone


class MFAChallenge(models.Model):
    """A model for validate email at registration"""

    class Purpose(models.TextChoices):
        LOGIN = "login"

        REGISTER = "register"

        PASSWORD_RESET = "password_reset"

        REACTIVATE = "reactivate"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="mfa_challenges",
    )

    jti = models.UUIDField(unique=True)

    code_hash = models.CharField(max_length=255)
    purpose = models.CharField(max_length=30, choices=Purpose.choices)
    attempts = models.PositiveSmallIntegerField(default=0)

    max_attempts = models.PositiveSmallIntegerField(default=5)

    used = models.BooleanField(default=False)

    revoked = models.BooleanField(default=False)

    expires_at = models.DateTimeField()

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "auth_mfa_challenges"

        indexes = [
            models.Index(fields=["jti"]),
            models.Index(fields=["expires_at"]),
        ]

    def is_expired(self):

        return timezone.now() > self.expires_at

    def can_attempt(self):

        return self.attempts < self.max_attempts


class AllowedStaff(models.Model):
    """Staff imported from the official ODS file."""

    name = models.CharField(max_length=255)
    registration_number = models.CharField(max_length=32, unique=True)

    class Meta:
        db_table = "users_allowed_staff"
        ordering = ["name"]

    def __str__(self):
        return f"{self.name} ({self.registration_number})"
