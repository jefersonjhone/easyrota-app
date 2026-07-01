from ..models import Punishment, Reservation


class PriorityService:
    """Passenger priority and eviction logic for reservations."""

    @staticmethod
    def get_priority_tuple(reservation):
        """
        Return a (priority, tiebreaker) tuple for ordering.
        Lower priority number = higher precedence.
        Civil servants and guests have priority 0 (highest).
        Students are ordered by number of active punishments.
        """
        if reservation.civil_servant_id:
            return (0, reservation.created_at)

        if reservation.guest_passenger_id:
            return (0, reservation.created_at)

        if reservation.student_id:
            active_punishments_count = Punishment.objects.active().for_student(
                reservation.student
            ).count()

            if active_punishments_count >= 2:
                priority = 3
            elif active_punishments_count == 1:
                priority = 2
            else:
                priority = 1

            return (priority, reservation.created_at)

        return (4, reservation.created_at)

    @staticmethod
    def evict_lowest_priority_active(trip):
        """
        Remove the lowest-priority active reservation among students.
        Returns the evicted reservation or None.
        """
        from .constants import ACTIVE_RESERVATION_STATUSES

        removable = list(
            Reservation.objects.filter(
                trip=trip,
                status__in=ACTIVE_RESERVATION_STATUSES,
                student__isnull=False,
            ).select_related("student__user")
        )
        if not removable:
            return None

        lowest = sorted(
            removable, key=PriorityService.get_priority_tuple, reverse=True
        )[0]
        lowest.status = "LISTA SECUNDÁRIA"
        lowest.save(update_fields=["status"])
        return lowest
