from ..users.models.profiles import DriverProfile
from django.db import models


class TripQuerySet(models.QuerySet):
    """Custom queryset methods for Trip model."""
    
    def joinable_by_driver(self, user):
        """Return Trips with status diferent from 'EM ANDAMENTO' and 'CONCLUÍDA'. 
        to drivers, return all for admins"""

        is_driver = DriverProfile.objects.filter(
            user=user
        ).exists()

        # may be is necessary verify if a trip already have another driver
        if not is_driver:
            return self
            
        return self.exclude(
            status__in=["EM ANDAMENTO", "CONCLUÍDA"]
        )
