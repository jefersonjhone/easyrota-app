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
