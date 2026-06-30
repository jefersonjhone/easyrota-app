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

        if not self.deleted_at:
            return False

        return timezone.now() <= self.deleted_at + timedelta(days=30)

    def anonymize_user(self):
        self.email = f"deleted_{self.id}@anonymize"
        self.full_name = "Usuário deletado"
        self.save()

        if hasattr(self, "student_profile"):
            profile = self.student_profile
            profile.student_id = f"DEL_{self.id}"
            profile.save()

        if hasattr(self, "civil_servant_profile"):
            profile = self.civil_servant_profile
            profile.civil_servant_id = f"DEL_{self.id}"
            profile.save()

            guests_to_update = []

            for guest in profile.guest_set.all():
                guest.name = "Convidado deletado"
                guest.cpf = f"DEL_{guest.id}"
                guests_to_update.append(guest)

            if guests_to_update:
                from apps.reservations.models import Guest

                Guest.objects.bulk_update(guests_to_update, fields=["name", "cpf"])
