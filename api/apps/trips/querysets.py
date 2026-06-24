from django.db import models

from ..users.models.profiles import DriverProfile


class TripQuerySet(models.QuerySet):
    """Custom queryset methods for Trip model."""

    def joinable_by_driver(self, user):
        """Return trips that a driver can open from the driver trips list."""

        is_driver = DriverProfile.objects.filter(user=user).exists()

        if not is_driver:
            return self

        return self.exclude(status="CONCLU\u00cdDA").filter(
            models.Q(status="EM ANDAMENTO", driver__user=user)
            | ~models.Q(status="EM ANDAMENTO")
        )

    def running(self):
        """Trips currently in progress."""
        return self.filter(status="EM ANDAMENTO")

    def upcoming(self):
        """Future trips that are not concluded or canceled."""
        return self.exclude(status__in=["CONCLU\u00cdDA", "CANCELADA"])

    def available_for_reservation(self):
        """Trips open for passenger reservation."""
        return self.filter(status__in=["CONFIRMADA", "RISCO DE CANCELAMENTO"])

    def by_date(self, date):
        """Filter trips by exact trip_date."""
        return self.filter(trip_date=date)

    def by_date_gte(self, date):
        """Trips on or after the given date."""
        return self.filter(trip_date__gte=date)

    def for_user(self, user):
        """Trips associated with a user (as driver, student, or civil servant)."""
        return self.filter(
            models.Q(driver__user=user)
            | models.Q(reservation__student__user=user)
            | models.Q(reservation__civil_servant__user=user)
        ).distinct()

    def with_overlap(self, bus, trip_date, route, exclude_id=None):
        """
        Find trips that overlap in time with the given bus on dates
        around trip_date. Optionally exclude a trip by id.
        """
        import datetime

        date_range = [
            trip_date - datetime.timedelta(days=1),
            trip_date,
            trip_date + datetime.timedelta(days=1),
        ]
        qs = self.filter(bus=bus, trip_date__in=date_range)
        if exclude_id is not None:
            qs = qs.exclude(id=exclude_id)
        return qs

    def with_route_details(self):
        """Select related route for efficient access."""
        return self.select_related("route")

    def with_bus_details(self):
        """Select related bus for efficient access."""
        return self.select_related("bus")

    def with_driver_details(self):
        """Select related driver user for efficient access."""
        return self.select_related("driver__user")

    def with_availability_annotations(self):
        """
        Annotate trip with active_reservation_seats and passenger_seats
        for the reservation-availability screen.
        """
        from django.db.models import Count, Q

        from apps.reservations.services import ACTIVE_RESERVATION_STATUSES

        return self.select_related("route", "bus").annotate(
            active_reservation_seats=Count(
                "reservation",
                filter=Q(reservation__status__in=ACTIVE_RESERVATION_STATUSES),
                distinct=True,
            ),
            passenger_seats=Count("trip_passengers", distinct=True),
        )


class BusQuerySet(models.QuerySet):
    """Custom queryset methods for Bus model."""

    def active(self):
        """Buses that are operational."""
        return self.filter(status="ATIVO")

    def in_maintenance(self):
        """Buses currently under maintenance."""
        return self.filter(status="MANUTEN\u00c7\u00c3O")


class RouteQuerySet(models.QuerySet):
    """Custom queryset methods for Route model."""

    def by_origin(self, origin):
        """Routes starting from a given origin."""
        return self.filter(origin__iexact=origin)

    def by_destiny(self, destiny):
        """Routes ending at a given destiny."""
        return self.filter(destiny__iexact=destiny)

    def by_location(self, origin, destiny):
        """Routes matching both origin and destiny."""
        return self.filter(origin__iexact=origin, destiny__iexact=destiny)
