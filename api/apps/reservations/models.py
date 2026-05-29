from django.db import models


class Reservation(models.Model):
    """Represents a seat reservation made by a student or civil servant
    for a specific trip.

    Tracks check-in status and queue position.
    """

    STATUS_RESERVATION = (
        ("PENDENTE", "Pendente"),
        ("CONFIRMADA", "Confirmada"),
        ("LISTA SECUNDÁRIA", "Lista Secundária"),
    )

    checkin_date = models.DateTimeField(null=True, blank=True)
    check_in = models.BooleanField(default=False)
    status = models.CharField(
        max_length=25, choices=STATUS_RESERVATION, default="PENDENTE"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    student = models.ForeignKey(
        "users.StudentProfile", on_delete=models.CASCADE, null=True, blank=True
    )
    civil_servant = models.ForeignKey(
        "users.CivilServantProfile", on_delete=models.CASCADE, null=True, blank=True
    )
    trip = models.ForeignKey("trips.Trip", on_delete=models.CASCADE)

    def __str__(self):
        return f"Reservation #{self.id} - {self.status}"


class Guest(models.Model):
    """Represents an external guest invited by a civil servant.
    Can be associated with multiple reservations.
    """

    name = models.CharField(max_length=100)
    cpf = models.CharField(max_length=15, unique=True)

    civil_servant = models.ForeignKey(
        "users.CivilServantProfile", on_delete=models.CASCADE
    )
    reservations = models.ManyToManyField(Reservation)

    def __str__(self):
        return f"{self.name} (CPF: {self.cpf})"


class Punishment(models.Model):
    """Records a penalty applied to a student regarding a specific reservation
    (For missing a trip without cancellation)."""

    description = models.CharField(max_length=255)
    value = models.IntegerField()
    student = models.ForeignKey("users.StudentProfile", on_delete=models.CASCADE)

    reservation = models.OneToOneField(Reservation, on_delete=models.CASCADE)

    def __str__(self):
        return f"Punishment: {self.value} points for {self.student}"
