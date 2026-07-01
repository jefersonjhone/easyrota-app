from ..models import Reservation
from .constants import WAITLIST_STATUS
from .priority_service import PriorityService


class ReservationService:
    """Core reservation business logic: create, cancel, promote, helpers."""

    # ------------------------------------------------------------------
    # Creation
    # ------------------------------------------------------------------

    @staticmethod
    def create(user, trip):
        """
        Create a reservation for the authenticated user.
        Returns the reservation instance.
        """
        from apps.trips.services.trip_service import TripService

        reservation = Reservation(trip=trip)

        if hasattr(user, "student_profile"):
            reservation.student = user.student_profile
        elif hasattr(user, "civil_servant_profile"):
            reservation.civil_servant = user.civil_servant_profile

        if TripService.trip_has_capacity(trip):
            reservation.status = ReservationService.get_status_for_user(user)
        else:
            reservation.status = WAITLIST_STATUS

        reservation.save()
        return reservation

    @staticmethod
    def create_for_guest(guest, trip):
        """
        Create a confirmed reservation for a guest passenger.
        Guests always get CONFIRMADA if there's capacity, otherwise waitlisted.
        """
        from apps.trips.services.trip_service import TripService

        reservation = Reservation(trip=trip, guest_passenger=guest)
        if TripService.trip_has_capacity(trip):
            reservation.status = "CONFIRMADA"
        else:
            reservation.status = WAITLIST_STATUS

        reservation.save()
        return reservation

    # ------------------------------------------------------------------
    # Cancellation
    # ------------------------------------------------------------------

    @staticmethod
    def cancel(reservation):
        """Delete a reservation and promote the next waitlisted passenger."""
        trip = reservation.trip
        reservation.delete()
        ReservationService.promote_next_waitlisted(trip)
        return trip

    # ------------------------------------------------------------------
    # Waitlist promotion
    # ------------------------------------------------------------------

    @staticmethod
    def promote_next_waitlisted(trip):
        """
        Promote the highest-priority waitlisted reservation
        if there is available capacity.
        """
        from apps.trips.services.trip_service import TripService

        if not TripService.trip_has_capacity(trip):
            return None

        waitlisted = list(
            Reservation.objects.waitlisted()
            .for_trip(trip)
            .with_passenger_details()
        )
        if not waitlisted:
            return None

        next_reservation = sorted(
            waitlisted, key=PriorityService.get_priority_tuple
        )[0]

        if next_reservation.guest_passenger_id:
            next_reservation.status = "CONFIRMADA"
        else:
            next_reservation.status = ReservationService.get_status_for_user(
                next_reservation.civil_servant.user
                if next_reservation.civil_servant_id
                else next_reservation.student.user,
            )

        next_reservation.save(update_fields=["status"])
        return next_reservation

    # ------------------------------------------------------------------
    # Helpers
    # ------------------------------------------------------------------

    @staticmethod
    def get_status_for_user(user):
        """Determine the initial reservation status for a user."""
        if hasattr(user, "civil_servant_profile"):
            return "CONFIRMADA"
        return "PENDENTE"

    @staticmethod
    def get_passenger_name(reservation):
        """Get the human-readable name of the passenger from a reservation."""
        if reservation.student_id:
            return reservation.student.user.full_name
        if reservation.civil_servant_id:
            return reservation.civil_servant.user.full_name
        if reservation.guest_passenger_id:
            return reservation.guest_passenger.full_name
        return "Passageiro"

    @staticmethod
    def get_waitlist_queryset(trip):
        """Return queryset of waitlisted reservations for a trip."""
        return (
            Reservation.objects.waitlisted()
            .for_trip(trip)
            .with_passenger_details()
        )
