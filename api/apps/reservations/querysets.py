from django.db import models
from django.utils import timezone


class ReservationQuerySet(models.QuerySet):
    """Custom queryset methods for Reservation model."""

    def active(self):
        """Reservations with CONFIRMADA or PENDENTE status."""
        return self.filter(status__in=("CONFIRMADA", "PENDENTE"))

    def confirmed(self):
        """Reservations with CONFIRMADA status."""
        return self.filter(status="CONFIRMADA")

    def waitlisted(self):
        """Reservations on the secondary waitlist."""
        return self.filter(status="LISTA SECUNDÁRIA")
    
    def checked_in(self):
        """Reservations that have completed check-in."""
        return self.filter(check_in=True)

    def not_checked_in(self):
        """Reservations that have NOT completed check-in."""
        return self.filter(check_in=False)

    def exclude_past(self):
        """Exclude reservations that have already passed the trip date."""
        return self.filter(trip__date__gte=timezone.now())

    def for_user(self, user):
        """Reservations belonging to a user (student or civil servant)."""
        if hasattr(user, "student_profile"):
            return self.filter(student=user.student_profile)
        if hasattr(user, "civil_servant_profile"):
            return self.filter(civil_servant=user.civil_servant_profile)
        return self.none()

    def for_trip(self, trip):
        """Reservations for a specific trip."""
        return self.filter(trip=trip)

    def with_passenger_details(self):
        """Select related passenger profiles for efficient access."""
        return self.select_related(
            "student__user", "civil_servant__user", "guest_passenger"
        )

    def with_trip_details(self):
        """Select related trip and route for efficient access."""
        return self.select_related("trip", "trip__route")

    def students_only(self):
        """Only reservations made by students."""
        return self.filter(student__isnull=False)

    def servers_only(self):
        """Only reservations made by civil servants."""
        return self.filter(civil_servant__isnull=False)


class PunishmentQuerySet(models.QuerySet):
    """Custom queryset methods for Punishment model."""

    def active(self):
        """Punishments that are currently active."""
        return self.filter(is_active=True)

    def inactive(self):
        """Punishments that have been forgiven/expired."""
        return self.filter(is_active=False)

    def for_student(self, student):
        """Punishments for a specific student profile."""
        return self.filter(student=student)

    def by_oldest(self):
        """Order by creation date ascending (oldest first)."""
        return self.order_by("created_at")

    def by_newest(self):
        """Order by creation date descending (newest first)."""
        return self.order_by("-created_at")
