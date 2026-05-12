from django.db import models

from .user import CustomUser


class ProfileType(models.TextChoices):
    STUDENT = "student", "Student"

    CIVIL_SERVANT = ("civil-servant", "Civil servant")


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

    class Level(models.TextChoices):
        SUPERADMIN = "superadmin", "Superadmin"
        SUBADMIN = "subadmin", "Subadmin"

    user = models.OneToOneField(
        CustomUser,
        on_delete=models.CASCADE,
        related_name="admin_profile",
    )
    role = models.CharField(max_length=30)
    level = models.CharField(
        max_length=20,
        choices=Level.choices,
        default=Level.SUBADMIN,
    )
    created_by = models.ForeignKey(
        "self",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="delegated_admins",
    )

    def __str__(self):
        return f"AdministratorProfile({self.user.email}, {self.level})"
