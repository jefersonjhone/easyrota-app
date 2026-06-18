from django.db import models

from .querysets import BusQuerySet, RouteQuerySet, TripQuerySet


class TripManager(models.Manager.from_queryset(TripQuerySet)):
    """Manager for Trip model exposing custom queryset methods."""


class BusManager(models.Manager.from_queryset(BusQuerySet)):
    """Manager for Bus model exposing custom queryset methods."""


class RouteManager(models.Manager.from_queryset(RouteQuerySet)):
    """Manager for Route model exposing custom queryset methods."""
