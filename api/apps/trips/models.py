import uuid

from django.contrib.auth.base_user import BaseUserManager
from django.db import models

from apps.users.models.profiles import CivilServantProfile, DriverProfile

from .querysets import TripQuerySet


class Bus(models.Model):
    """Represents a bus in the fleet available for trips.
    Stores vehicle identification, capacity, and assigned personnel.
    """

    BUS_STATUS = (
        ("ATIVO", "Ativo"),
        ("MANUTENÇÃO", "Manutenção"),
    )

    number_plate = models.CharField(max_length=10, unique=True)
    seating_capacity = models.IntegerField()
    brand = models.CharField(max_length=100)
    status = models.CharField(max_length=25, choices=BUS_STATUS, default="ATIVO")
    administrator = models.ForeignKey(
        "users.AdministratorProfile", on_delete=models.SET_NULL, null=True
    )

    def __str__(self):
        return f"Bus {self.number_plate}"


class Route(models.Model):
    """Defines a travel route with specific origin, destination, and expected times."""

    origin = models.CharField(max_length=50)
    destiny = models.CharField(max_length=50)
    departure_time = models.TimeField()
    arrival_time = models.TimeField()

    administrator = models.ForeignKey(
        "users.AdministratorProfile", on_delete=models.CASCADE
    )

    def __str__(self):
        return f"{self.origin} -> {self.destiny}"


class Trip(models.Model):
    """
    Represents a scheduled trip instance, linking a specific bus and route
    to a date and its current operational status.
    """

    STATUS_TRIP = (
        ("RISCO DE CANCELAMENTO", "Risco de Cancelamento"),
        ("CONFIRMADA", "Confirmada"),
        ("CANCELADA", "Cancelada"),
        ("EM ANDAMENTO", "Em Andamento"),
        ("CONCLUÍDA", "Concluída"),
    )

    trip_date = models.DateField()
    status = models.CharField(
        max_length=25, choices=STATUS_TRIP, default="RISCO DE CANCELAMENTO"
    )
    departure_timestamp = models.DateTimeField(null=True, blank=True)
    arrival_timestamp = models.DateTimeField(null=True, blank=True)
    seating_capacity = models.IntegerField(default=46)
    reserved_seats = models.IntegerField(default=0)
    quorum_met_notified_at = models.DateTimeField(null=True, blank=True)
    quorum_warning_notified_at = models.DateTimeField(null=True, blank=True)

    bus = models.ForeignKey(Bus, on_delete=models.SET_NULL, null=True, blank=True)
    route = models.ForeignKey(Route, on_delete=models.CASCADE)
    driver = models.ForeignKey(
        DriverProfile, on_delete=models.SET_NULL, null=True, blank=True
    )

    # for custom queryset methods
    objects = TripQuerySet.as_manager()

    @property
    def has_server(self):
        """Checks if there is at least 1 server passenger registered for the trip."""
        if self.reservation_set.filter(
            status="CONFIRMADA", civil_servant__isnull=False
        ).exists():
            return True

        return self.trip_passengers.filter(
            passenger_type=TripPassenger.PassengerType.LOCAL_SERVER
        ).exists()

    @property
    def has_minimum_quorum(self):
        """
        Checks if the minimum passenger quorum is met.
        For this project, one registered server already satisfies quorum.
        """
        return self.has_server

    def __str__(self):
        return f"Trip on {self.trip_date} - ({self.route})"


class Occurrence(models.Model):
    """Logs an incident or event that happened during a specific trip."""

    STATUS_OCCURRENCE = (
        ("CANCELAMENTO PARCIAL DO ÔNIBUS", "Cancelamento Parcial do Ônibus"),
        ("CANCELADO", "Cancelado"),
    )

    title = models.CharField(max_length=100)
    description = models.TextField()
    event_date = models.DateField()
    status = models.CharField(max_length=30, choices=STATUS_OCCURRENCE, default="")

    trip = models.ForeignKey(Trip, on_delete=models.CASCADE)
    administrator = models.ForeignKey(
        "users.AdministratorProfile", on_delete=models.CASCADE
    )

    def __str__(self):
        return self.title


class TripPassenger(models.Model):
    """Stores a non-account passenger record for a trip."""

    class PassengerType(models.TextChoices):
        LOCAL_SERVER = "LOCAL_SERVER", "Servidor local"
        LOCAL_GUEST = "LOCAL_GUEST", "Convidado local"

    trip = models.ForeignKey(Trip, on_delete=models.CASCADE, related_name="trip_passengers")
    allowed_staff = models.ForeignKey(
        "users.AllowedStaff",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="trip_passengers",
    )
    passenger_type = models.CharField(
        max_length=20,
        choices=PassengerType.choices,
        default=PassengerType.LOCAL_SERVER,
    )
    full_name = models.CharField(max_length=255, blank=True)
    cpf = models.CharField(max_length=11, blank=True)
    associated_staff = models.ForeignKey(
        "users.AllowedStaff",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="associated_local_guests",
    )
    recorded_by = models.ForeignKey(
        DriverProfile, on_delete=models.SET_NULL, null=True, blank=True
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "trips_trip_passengers"

    def __str__(self):
        if self.passenger_type == self.PassengerType.LOCAL_GUEST:
            return f"{self.full_name} on {self.trip}"

        return f"{self.allowed_staff} on {self.trip}"


class GuestPassengerManager(BaseUserManager):
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
        extra_fields.setdefault("full_name", "")
        return self._create_passenger(cpf, trip, **extra_fields)


class GuestPassenger(models.Model):
    id = models.UUIDField(
        primary_key=True, 
        default=uuid.uuid4, 
        editable=False
        )
    cpf = models.CharField(max_length=11)
    trip = models.ForeignKey(
        to=Trip, 
        on_delete=models.CASCADE
        )
    recorded_by = models.ForeignKey(
        to=CivilServantProfile, 
        on_delete=models.SET_NULL, 
        null=True
        )
    full_name = models.CharField(max_length=255)

    objects = GuestPassengerManager()

    USERNAME_FIELD = "cpf"
    REQUIRED_FIELDS = ("full_name",)

    class Meta:
        unique_together = (('cpf', 'trip'),)
        db_table = "trips_guest_passengers"

    def __str__(self):
        return f"Nome: {self.full_name} \nCPF: {self.cpf}\nAdicionado por: \
        {self.recorded_by}\n Adicionado na viagem: {self.trip}"
