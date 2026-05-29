import uuid

from django.contrib.auth.base_user import BaseUserManager
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin
from django.db import models


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
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("is_active", True)

        if extra_fields.get("is_staff") is not True:
            raise ValueError("Superuser must have is_staff=True.")
        if extra_fields.get("is_superuser") is not True:
            raise ValueError("Superuser must have is_superuser=True.")

        return self._create_user(email, password, **extra_fields)


class CustomUser(AbstractBaseUser, PermissionsMixin):
    """Application user model that uses email as the login identifier."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(unique=True)
    full_name = models.CharField(max_length=255)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    date_joined = models.DateTimeField(auto_now_add=True)

    objects = CustomUserManager()

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ("full_name",)

    def __str__(self):
        return self.email


class TripPassengerManager(BaseUserManager):
    """Custom manager that authenticates guests by cpf and trip."""

    use_in_migrations = True

    def _create_passenger(self, cpf, trip, **extra_fields):
        """Create and persist a user with normalized email credentials."""
        if not cpf:
            raise ValueError("The cpf field must be set.")
        if not trip:
            raise ValueError("The trip field must be set.")

        passenger = self.model(cpf=cpf, trip=trip, **extra_fields)
        passenger.save(using=self._db)
        return passenger

    def create_passenger(self, cpf, trip, **extra_fields):
        """Create a regular passenger account."""
        extra_fields.setdefault("recorded_by", None)
        extra_fields.setdefault("allowed_staff", "users.AllowedStaff")
        extra_fields.setdefault("full_name", "")
        return self._create_passenger(cpf, trip, **extra_fields)


class TripPassenger(AbstractBaseUser, PermissionsMixin):
    cpf = models.CharField(primary_key=True, max_length=11)
    trip = models.ForeignKey(primary_key=True, on_delete=models.CASCADE)
    recorded_by = models.ForeignKey(on_delete=models.SET_NULL)
    allowed_staff = models.ForeignKey(
        "users.AllowedStaff", on_delete=models.CASCADE)
    full_name = models.CharField(max_length=255)

    objects = TripPassengerManager()

    USERNAME_FIELD = "cpf"
    REQUIRED_FIELDS = ("full_name",)

    def __str__(self):
        return f"Nome: {self.full_name} \nCPF: {self.cpf}\nAdicionado por: \
        {self.recorded_by}\n Adicionado na viagem: {self.trip}"
