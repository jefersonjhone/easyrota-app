from django.contrib.auth.base_user import BaseUserManager
from django.db import models

from .querysets import AllowedStaffQuerySet, CustomUserQuerySet, MFAChallengeQuerySet


class CustomUserManager(BaseUserManager):
    """Custom manager combining BaseUserManager auth methods with queryset methods."""

    use_in_migrations = True

    def get_queryset(self):
        return CustomUserQuerySet(self.model, using=self._db)

    def _create_user(self, email, password, **extra_fields):
        if not email:
            raise ValueError("The email field must be set.")
        email = self.normalize_email(email).lower()
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_user(self, email, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", False)
        extra_fields.setdefault("is_superuser", False)
        return self._create_user(email, password, **extra_fields)

    def create_superuser(self, email, password=None, **extra_fields):
        from apps.users.models.profiles import AdministratorProfile

        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("is_active", True)
        role = extra_fields.pop("role", "subadmin")
        level = extra_fields.pop("level", AdministratorProfile.Level.SUBADMIN)

        if extra_fields.get("is_staff") is not True:
            raise ValueError("Superuser must have is_staff=True.")
        if extra_fields.get("is_superuser") is not True:
            raise ValueError("Superuser must have is_superuser=True.")
        user = self._create_user(email, password, **extra_fields)
        AdministratorProfile.objects.create(user=user, role=role, level=level)
        return user


class MFAChallengeManager(models.Manager.from_queryset(MFAChallengeQuerySet)):
    """Manager for MFAChallenge model."""


class AllowedStaffManager(models.Manager.from_queryset(AllowedStaffQuerySet)):
    """Manager for AllowedStaff model."""
