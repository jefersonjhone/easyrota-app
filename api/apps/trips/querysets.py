from django.db import models
from django.utils import timezone

from ..users.models.profiles import DriverProfile


class TripQuerySet(models.QuerySet):
    """Custom queryset methods for Trip model."""

    def daily_driver_list(self, user):
        """Return today's trips for the driver trips list."""

        is_driver = DriverProfile.objects.filter(user=user).exists()

        if not is_driver:
            return self

        return (
            self
            .filter(trip_date=timezone.localdate())
            .exclude(status="CONCLU\u00cdDA")
            .order_by("route__departure_time", "id")
        )

    def joinable_by_driver(self, user):
        """Return trips that a driver can open from the driver trips list."""

        driver = DriverProfile.objects.filter(user=user).first()

        if driver is None:
            return self

        return self.exclude(status="CONCLU\u00cdDA").filter(
            models.Q(driver__isnull=True) | models.Q(driver=driver)
        )
