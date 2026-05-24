from django.db import models

from apps.users.models.profiles import DriverProfile

from .querysets import TripQuerySet


class Bus(models.Model):
    """Represents a bus in the fleet available for trips.
    Stores vehicle identification, capacity, and assigned personnel.
    """

    number_plate = models.CharField(max_length=10, unique=True)
    seating_capacity = models.IntegerField()
    brand = models.CharField(max_length=100)
    # add field "status" (dont delete my comment pls,
    # i will remove it in the future lol)
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
    """Represents a scheduled trip instance, linking a specific bus and route
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
    status = models.CharField(max_length=25, choices=STATUS_TRIP, default="CONFIRMADA")
    departure_timestamp = models.DateTimeField(null=True, blank=True)
    arrival_timestamp = models.DateTimeField(null=True, blank=True)

    bus = models.ForeignKey(Bus, on_delete=models.SET_NULL, null=True, blank=True)
    route = models.ForeignKey(Route, on_delete=models.CASCADE)
    driver = models.ForeignKey(
        DriverProfile, on_delete=models.SET_NULL, null=True, blank=True
    )

    # for custom queryset methods
    objects = TripQuerySet.as_manager()

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
