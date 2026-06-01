import uuid

from django.contrib.auth.base_user import BaseUserManager
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin
from django.db import models
from django.utils import timezone
from datetime import timedelta


class CustomUserManager(BaseUserManager):
    """Custom manager that authenticates users by email."""

    use_in_migrations = True

    def _create_user(self, email, password, **extra_fields):
        """Create and persist a user with normalized email credentials."""
        if not email:
            raise ValueError("The email field must be set.")

        email = self.normalize_email(email).lower()
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_user(self, email, password=None, **extra_fields):
        """Create a regular user account."""
        extra_fields.setdefault("is_staff", False)
        extra_fields.setdefault("is_superuser", False)
        return self._create_user(email, password, **extra_fields)

    def create_superuser(self, email, password=None, **extra_fields):
        """Create a superuser account with administrative access."""
        from apps.users.models.profiles import AdministratorProfile

        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("is_active", True)
        role = extra_fields.pop("role", None)
        level = extra_fields.pop("level", AdministratorProfile.Level.SUBADMIN)

        if extra_fields.get("is_staff") is not True:
            raise ValueError("Superuser must have is_staff=True.")
        if extra_fields.get("is_superuser") is not True:
            raise ValueError("Superuser must have is_superuser=True.")
        user = self._create_user(email, password, **extra_fields)
        AdministratorProfile.objects.create(user=user, role=role, level=level)

        return user


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

        return (
            timezone.now() <= self.deleted_at + timedelta(days=30)
        )
