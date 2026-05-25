from datetime import timedelta

from django.db.models import Count
from django.utils import timezone

from apps.reservations.models import Reservation


class ReservationSelectors:
    @staticmethod
    def get_reservations_volume(days=7):
        today = timezone.localdate()

        if days == 0:
            reservations = Reservation.objects.filter(created_at__date=today)
        else:
            start_date = today - timedelta(days=days - 1)

            reservations = Reservation.objects.filter(
                created_at__date__range=[start_date, today]
            )

        return {
            "days": days,
            "total_reservations": reservations.count(),
        }

    @staticmethod
    def get_reservations_by_status(days=7):
        today = timezone.localdate()
        start_date = today - timedelta(days=days - 1)

        reservations = (
            Reservation.objects
            .filter(created_at__date__range=[start_date, today])
            .values("status")
            .annotate(total=Count("id"))
        )

        return {
            "days": days,
            "statuses": [
                {
                    "label": item["status"],
                    "value": item["total"],
                }
                for item in reservations
            ],
        }

    @staticmethod
    def get_checkin_stats(days=7):
        today = timezone.localdate()
        start_date = today - timedelta(days=days - 1)

        reservations = Reservation.objects.filter(
            created_at__date__range=[start_date, today]
        )

        total_reservations = reservations.count()

        total_checkins = reservations.filter(check_in=True).count()

        # could be total_reservations - total_checkins
        without_checkin = reservations.filter(check_in=False).count()

        checkin_rate = (
            (total_checkins / total_reservations) * 100 if total_reservations > 0 else 0
        )

        return {
            "days": days,
            "total_checkins": total_checkins,
            "without_checkin": without_checkin,
            "checkin_rate": round(checkin_rate, 2),
        }

    @staticmethod
    def get_most_reserved_trips(days=7):
        today = timezone.localdate()
        start_date = today - timedelta(days=days - 1)

        trips = (
            Reservation.objects
            .filter(created_at__date__range=[start_date, today])
            .values(
                "trip__id",
                "trip__route__origin",
                "trip__route__destiny",
                "trip__trip_date",
            )
            .annotate(total_reservations=Count("id"))
            .order_by("-total_reservations")
        )

        return list(trips)
