from datetime import timedelta

from django.db.models import Count
from django.utils import timezone

from apps.trips.models import Trip


class TripsSelectors:
    @staticmethod
    def get_trips_stats_by_status(days=7):
        today = timezone.localdate()
        start_date = today - timedelta(days=days - 1)

        trips_by_status = (
            Trip.objects
            .filter(trip_date__range=[start_date, today])
            .values("status")
            .annotate(total=Count("id"))
        )

        total_trips = sum(item["total"] for item in trips_by_status)

        return {
            "days": days,
            "total_trips": total_trips,
            "trips": [
                {
                    "label": item["status"],
                    "value": item["total"],
                }
                for item in trips_by_status
            ],
        }

    @staticmethod
    def get_trips_stats_by_route(days=7):
        today = timezone.localdate()
        start_date = today - timedelta(days=days - 1)

        queryset = (
            Trip.objects
            .filter(trip_date__range=[start_date, today])
            .values(
                "route__id",
                "route__origin",
                "route__destiny",
                "route__departure_time",
            )
            .annotate(total=Count("id"))
            .order_by("-total")
        )

        return [
            {
                "route_id": item["route__id"],
                "origin": item["route__origin"],
                "destiny": item["route__destiny"],
                "departure_time": item["route__departure_time"],
                "total_trips": item["total"],
            }
            for item in queryset
        ]

    @staticmethod
    def get_trips_stats_by_date(days=7):
        today = timezone.localdate()
        start_date = today - timedelta(days=days - 1)

        trips = (
            Trip.objects
            .filter(trip_date__range=[start_date, today])
            .values("trip_date")
            .annotate(total=Count("id"))
            .order_by("trip_date")
        )

        return list(trips)

    @staticmethod
    def get_trips_stats_by_bus():
        queryset = (
            Trip.objects
            .values("bus__id", "bus__number_plate")
            .annotate(total=Count("id"))
            .order_by("-total")
        )

        return [
            {
                "bus_id": item["bus__id"],
                "bus_plate": item["bus__number_plate"],
                "total_trips": item["total"],
            }
            for item in queryset
        ]

    @staticmethod
    def get_created_trips(days=0):
        today = timezone.localdate()

        if days == 0:
            trips = Trip.objects.filter(trip_date=today)
        else:
            end_date = today + timedelta(days=days)

            trips = Trip.objects.filter(trip_date__range=[today, end_date])

        return {
            "days": days,
            "total_trips": trips.count(),
        }

    @staticmethod
    def get_trips_in_progress():
        trips = Trip.objects.filter(status=Trip.Status.IN_PROGRESS)

        return {
            "total_trips": trips.count(),
        }
