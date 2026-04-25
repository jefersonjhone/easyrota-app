from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin
from django.contrib.auth.base_user import BaseUserManager
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

    email = models.EmailField(unique=True)
    full_name = models.CharField(max_length=255)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    date_joined = models.DateTimeField(auto_now_add=True)

    objects = CustomUserManager()

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["full_name"]

    def __str__(self):
        return self.email

class StudentProfile(models.Model):
    """Profile data specific to student accounts."""

    user = models.OneToOneField(
        CustomUser,
        on_delete=models.CASCADE,
        related_name="student_profile",
    )
    student_id = models.CharField(max_length=32, unique=True)

    def __str__(self):
        return f"StudentProfile({self.user.email})"

class CivilServantProfile(models.Model):
    """Profile data specific to civil servant accounts."""

    user = models.OneToOneField(
        CustomUser,
        on_delete=models.CASCADE,
        related_name="civil_servant_profile",
    )
    civil_servant_id = models.CharField(max_length=32, unique=True)

    def __str__(self):
        return f"CivilServantProfile({self.user.email})"

class DriverProfile(models.Model):
    """Profile data specific to driver accounts."""

    user = models.OneToOneField(
        CustomUser,
        on_delete=models.CASCADE,
        related_name="driver_profile",
    )
    cnh = models.CharField(max_length=15, unique=True)

    def __str__(self):
        return f"DriverProfile({self.user.email})"

class AdministratorProfile(models.Model):
    """Profile data specific to administrator accounts."""

    user = models.OneToOneField(
        CustomUser,
        on_delete=models.CASCADE,
        related_name="admin_profile",
    )
    role = models.CharField(max_length=30) 

    def __str__(self):
        return f"AdministratorProfile({self.user.email})"
