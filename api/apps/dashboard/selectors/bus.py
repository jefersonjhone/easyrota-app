from apps.trips.models import Bus


class BusSelector:
    @staticmethod
    def get_bus_stats():
        total_buses = Bus.objects.count()

        return {
            "total_buses": total_buses,
        }
