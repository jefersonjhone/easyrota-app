from django.db import models

from .querysets import PunishmentQuerySet, ReservationQuerySet


class ReservationManager(models.Manager.from_queryset(ReservationQuerySet)):
    """Manager for Reservation model exposing custom queryset methods."""


class PunishmentManager(models.Manager.from_queryset(PunishmentQuerySet)):
    """Manager for Punishment model exposing custom queryset methods."""
