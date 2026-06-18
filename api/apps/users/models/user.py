import uuid
from datetime import timedelta

from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin
from django.db import models
from django.utils import timezone

from ..managers import CustomUserManager


class CustomUser(AbstractBaseUser, PermissionsMixin):
    """Application user model that uses email as the login identifier."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(unique=True)
    full_name = models.CharField(max_length=255)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    date_joined = models.DateTimeField(auto_now_add=True)

    is_deleted = models.BooleanField(default=False)
    deleted_at = models.DateTimeField(null=True, blank=True)

    objects = CustomUserManager()

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ("full_name",)

    def __str__(self):
        return self.email

    def can_reactivate_account(self):
        """User can reactivate account for up to 30 days after deletion request."""

        # TODO:
        # After 30 days the account can no longer be reactivated.
        # Future implementation should anonymize and purge personal data
        # according to the retention policy.

        if not self.deleted_at:
            return False

        return timezone.now() <= self.deleted_at + timedelta(days=30)
