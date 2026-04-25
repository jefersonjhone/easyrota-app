from django.db import models

# Create your models here.

class Bus(models.Model):
    """
    Represents a bus in the fleet available for trips.
    Stores vehicle identification, capacity, and assigned personnel.
    """

    number_plate = models.CharField(max_length=10, unique=True)
    seating_capacity = models.IntegerField()

    driver = models.ForeignKey('users.DriverProfile', on_delete=models.CASCADE)
    administrator = models.ForeignKey('users.AdministratorProfile', on_delete=models.CASCADE)
    
    def __str__(self):
        return f"Bus {self.number_plate}"

class Route(models.Model):
    """
    Defines a travel route with specific origin, destination, and expected times.
    """

    origin = models.CharField(max_length=50)
    destiny = models.CharField(max_length=50)
    departure_time = models.TimeField()
    arrival_time = models.TimeField()

    administrator = models.ForeignKey('users.AdministratorProfile', on_delete=models.CASCADE)
    
    def __str__(self):
        return f"{self.origin} -> {self.destiny}"

class Trip(models.Model):
    """
    Represents a scheduled trip instance, linking a specific bus and route 
    to a date and its current operational status.
    """

    STATUS_TRIP = [
        ("EM RISCO", "Em Risco"),
        ("CONFIRMADA", "Confirmada")
    ]

    trip_date = models.DateField()
    status = models.CharField(max_length=15, choices=STATUS_TRIP, default='CONFIRMADA')
    departure_timestamp = models.DateTimeField(null=True, blank=True)
    arrival_timestamp = models.DateTimeField(null=True, blank=True)
    
    bus = models.ForeignKey(Bus, on_delete=models.CASCADE)
    route = models.ForeignKey(Route, on_delete=models.CASCADE)
    
    def __str__(self):
        return f"Trip on {self.trip_date} - ({self.route})"

class Occurrence(models.Model):
    """
    Logs an incident or event that happened during a specific trip.
    """
    
    #Lembrar de Adicionar os status de ocorrências
    STATUS_OCCURRENCE = [
        ("EM RISCO", "Em risco"),
        ("CONFIRMADA", "Confirmada")
    ]

    title = models.CharField(max_length=100)
    description = models.TextField()
    event_date = models.DateField()
    status = models.CharField(max_length=30, choices=STATUS_OCCURRENCE, default='')

    trip = models.ForeignKey(Trip, on_delete=models.CASCADE)
    administrator = models.ForeignKey('users.AdministratorProfile', on_delete=models.CASCADE)
    
    def __str__(self):
        return self.title