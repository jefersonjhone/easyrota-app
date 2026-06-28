from django.utils import timezone

from apps.reservations.models import Reservation
from apps.reservations.services.constants import (
    ACTIVE_RESERVATION_STATUSES,
    WAITLIST_STATUS,
)
from apps.reservations.services.priority_service import PriorityService
from apps.reservations.services.reservation_service import ReservationService
from apps.trips.models import TripPassenger
from apps.trips.services.trip_service import TripService
from apps.trips.services.trip_status_service import TripStatusService


class CheckedInCount:
    """Value object for checked-in passenger count on a trip."""

    @staticmethod
    def get(trip):
        return (
            Reservation.objects.filter(trip=trip, check_in=True).count()
            + trip.trip_passengers.count()
        )


class PassengerSerializer:
    """Pure serialization helpers (dict outputs, no DRF dependency)."""

    @staticmethod
    def evicted_reservation(reservation):
        return {
            "name": ReservationService.get_passenger_name(reservation),
            "reservation_id": reservation.id,
        }

    @staticmethod
    def local_passenger(passenger):
        if (
            passenger.passenger_type
            == TripPassenger.PassengerType.LOCAL_SERVER
        ):
            name = passenger.allowed_staff.name if passenger.allowed_staff_id else "Servidor local"  # noqa: E501
        else:
            name = passenger.full_name or "Convidado local"

        return {
            "id": passenger.id,
            "passenger_type": passenger.passenger_type,
            "name": name,
            "cpf": passenger.cpf,
            "allowed_staff_id": passenger.allowed_staff_id,
            "associated_staff_id": passenger.associated_staff_id,
        }

    @staticmethod
    def reservation_passenger(reservation):
        return {
            "reservation_id": reservation.id,
            "passenger_type": "RESERVATION",
            "name": ReservationService.get_passenger_name(reservation),
        }


class LocalPassengerService:
    """
    Business logic for driver-managed local passengers:
    registration, removal, capacity enforcement, and eviction.
    Returns domain values — the view translates to HTTP.
    """

    class CapacityError(Exception):
        """Raised when no capacity is available and no eviction is possible."""

    class NotFound(Exception):
        """Raised when a passenger or reservation is not found."""

    # ------------------------------------------------------------------
    # Capacity helpers
    # ------------------------------------------------------------------

    @staticmethod
    def _ensure_capacity_or_evict(trip, evicted_passengers):
        """Try to free a seat via eviction. Raises CapacityError if impossible."""
        if trip.bus and not TripService.trip_has_capacity(trip):
            evicted = PriorityService.evict_lowest_priority_active(trip)
            if evicted is None:
                raise LocalPassengerService.CapacityError(
                    "Nao ha vaga disponivel para cadastrar o passageiro."
                )
            evicted_passengers.append(
                PassengerSerializer.evicted_reservation(evicted)
            )

    # ------------------------------------------------------------------
    # Server reservation check-in
    # ------------------------------------------------------------------

    @staticmethod
    def _check_in_existing_server_reservation(trip, allowed_staff, evicted_passengers):
        """Find and check-in an existing server reservation. Returns reservation or None."""  # noqa: E501
        reservation = (
            Reservation.objects.filter(
                trip=trip,
                civil_servant__civil_servant_id=allowed_staff.registration_number,
                status__in=(*ACTIVE_RESERVATION_STATUSES, WAITLIST_STATUS),
            )
            .select_related("civil_servant__user")
            .first()
        )
        if not reservation:
            return None

        if reservation.status == WAITLIST_STATUS:
            LocalPassengerService._ensure_capacity_or_evict(trip, evicted_passengers)

        reservation.status = "CONFIRMADA"
        reservation.check_in = True
        reservation.checkin_date = timezone.now()
        reservation.save(update_fields=["status", "check_in", "checkin_date"])
        return reservation

    # ------------------------------------------------------------------
    # Ensure local server (create or reuse)
    # ------------------------------------------------------------------

    @staticmethod
    def ensure_local_server(trip, allowed_staff, driver, evicted_passengers):
        """
        Ensure a local server passenger exists for the trip.
        Returns (passenger, created, fallback_reservation).
        - passenger: TripPassenger instance (may be existing or new)
        - created: bool — True if a new TripPassenger was created
        - fallback_reservation: Reservation if server was checked-in via reservation
        Raises CapacityError if no seat available.
        """
        # Check if already registered as local passenger
        existing = (
            TripPassenger.objects.filter(
                trip=trip,
                passenger_type=TripPassenger.PassengerType.LOCAL_SERVER,
                allowed_staff=allowed_staff,
            )
            .select_related("allowed_staff")
            .first()
        )
        if existing:
            return existing, False, None

        # Check if server has an existing reservation to check-in
        fallback = LocalPassengerService._check_in_existing_server_reservation(
            trip, allowed_staff, evicted_passengers
        )
        if fallback:
            return None, False, fallback

        # Ensure capacity before creating
        LocalPassengerService._ensure_capacity_or_evict(trip, evicted_passengers)

        passenger = TripPassenger.objects.create(
            trip=trip,
            passenger_type=TripPassenger.PassengerType.LOCAL_SERVER,
            allowed_staff=allowed_staff,
            recorded_by=driver,
        )
        return passenger, True, None

    # ------------------------------------------------------------------
    # Local guest registration
    # ------------------------------------------------------------------

    @staticmethod
    def register_local_guest(
        trip, associated_staff, cpf, full_name, driver, evicted_passengers
    ):
        """
        Register a local guest passenger. Returns the TripPassenger instance.
        Raises CapacityError if no seat available.
        """
        existing = (
            TripPassenger.objects.filter(
                trip=trip,
                passenger_type=TripPassenger.PassengerType.LOCAL_GUEST,
                cpf=cpf,
            )
            .select_related("associated_staff")
            .first()
        )
        if existing:
            return existing

        LocalPassengerService._ensure_capacity_or_evict(trip, evicted_passengers)

        return TripPassenger.objects.create(
            trip=trip,
            passenger_type=TripPassenger.PassengerType.LOCAL_GUEST,
            full_name=full_name,
            cpf=cpf,
            associated_staff=associated_staff,
            recorded_by=driver,
        )

    # ------------------------------------------------------------------
    # Removal
    # ------------------------------------------------------------------

    @staticmethod
    def remove_local_passenger(trip, local_passenger_id):
        """Remove a local passenger and return their serialized info."""
        passenger = (
            TripPassenger.objects.filter(id=local_passenger_id, trip=trip)
            .select_related("allowed_staff", "associated_staff")
            .first()
        )
        if passenger is None:
            raise LocalPassengerService.NotFound(
                "Passageiro local nao encontrado nesta viagem."
            )
        payload = PassengerSerializer.local_passenger(passenger)
        passenger.delete()
        TripStatusService.sync_trip_status(trip)
        return payload

    @staticmethod
    def remove_reservation_checkin(trip, reservation_id):
        """Undo a reservation check-in and return the passenger's name."""
        reservation = (
            Reservation.objects.select_related(
                "student__user", "civil_servant__user", "guest_passenger"
            )
            .filter(id=reservation_id, trip=trip, check_in=True)
            .first()
        )
        if reservation is None:
            raise LocalPassengerService.NotFound(
                "Reserva embarcada nao encontrada nesta viagem."
            )

        name = ReservationService.get_passenger_name(reservation)
        reservation.check_in = False
        reservation.checkin_date = None
        reservation.save(update_fields=["check_in", "checkin_date"])
        TripStatusService.sync_trip_status(trip)
        return name, reservation.id
