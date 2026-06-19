from uuid import UUID

from django.contrib.auth import get_user_model
from django.db.models import Q
from django.utils import timezone

from apps.reservations.models import Reservation

from ..models import GuestPassenger, Trip
from .trip_service import TripService
from .trip_status_service import TripStatusService

User = get_user_model()


class CheckinService:
    """QR-code and admin check-in business logic."""

    class Error(Exception):
        """Domain-level check-in error carrying an HTTP status code."""
        def __init__(self, detail, status_code=400):
            self.detail = detail
            self.status_code = status_code

    # ------------------------------------------------------------------
    # Core: operate directly on a reservation (used by both driver & admin flows)
    # ------------------------------------------------------------------

    @staticmethod
    def perform_on_reservation(reservation):
        """
        Execute check-in logic on an already-loaded reservation.
        Returns (success_payload, evicted_passenger_or_None).
        Raises CheckinService.Error on failure.
        """
        # --- lazy imports to avoid circular dependency ---
        from apps.reservations.services import (
            ACTIVE_RESERVATION_STATUSES as _ACTIVE_RESERVATION_STATUSES,
        )
        from apps.reservations.services import (
            WAITLIST_STATUS as _WAITLIST_STATUS,
        )
        from apps.reservations.services import (
            evict_lowest_priority_active_reservation,
            get_reservation_passenger_name,
        )

        evicted_passenger = None
        priority_check_in = bool(
            reservation.civil_servant_id or reservation.guest_passenger_id
        )

        if reservation.status == _WAITLIST_STATUS:
            if not priority_check_in:
                raise CheckinService.Error(
                    "Apenas reservas ativas podem fazer check-in.", 400
                )

            if not TripService.trip_has_capacity(reservation.trip):
                evicted = evict_lowest_priority_active_reservation(reservation.trip)
                if evicted is None:
                    raise CheckinService.Error(
                        "Nao ha vaga disponivel para priorizar o passageiro.", 409
                    )

                evicted_passenger = {
                    "name": get_reservation_passenger_name(evicted),
                    "reservation_id": evicted.id,
                }

            reservation.status = "CONFIRMADA"
        elif reservation.status not in _ACTIVE_RESERVATION_STATUSES:
            raise CheckinService.Error(
                "Apenas reservas ativas podem fazer check-in.", 400
            )

        if reservation.check_in:
            raise CheckinService.Error("Passageiro ja fez check-in.", 409)

        reservation.check_in = True
        reservation.checkin_date = timezone.now()
        reservation.save(update_fields=["status", "check_in", "checkin_date"])
        TripStatusService.sync_trip_status(reservation.trip)

        payload = {"status": "Check-in realizado com sucesso."}
        if evicted_passenger is not None:
            payload["evicted_passenger"] = evicted_passenger
            payload["evicted_passengers"] = [evicted_passenger]

        return payload, evicted_passenger

    # ------------------------------------------------------------------
    # Driver flow: QR-code scan (trip_id + passenger UUID)
    # ------------------------------------------------------------------

    @staticmethod
    def perform(trip_id: str, passenger_identifier: str, driver):
        """
        Execute the full QR-code check-in flow.
        Returns a dict with response payload on success.
        Raises CheckinService.Error on failure.
        """
        # --- resolve trip ---
        try:
            trip = Trip.objects.select_related("driver").get(id=trip_id)
        except Trip.DoesNotExist:
            raise CheckinService.Error("Viagem nao encontrada.", 404)

        if trip.driver_id != driver.id:
            raise CheckinService.Error(
                "Motorista nao autorizado para esta viagem.", 403
            )

        # --- resolve passenger ---
        passenger = CheckinService._resolve_passenger(passenger_identifier)

        # --- find reservation ---
        reservation = CheckinService._find_reservation(passenger, trip)

        # --- delegate core check-in logic ---
        payload, _evicted = CheckinService.perform_on_reservation(reservation)

        payload["reservation_id"] = reservation.id
        payload["passenger_name"] = passenger.full_name
        payload["checkin_date"] = reservation.checkin_date

        return payload

    @staticmethod
    def _resolve_passenger(passenger_identifier):
        """Resolve passenger from '{reservation_id}@{user_id}'."""

        if not passenger_identifier or "@" not in passenger_identifier:
            raise CheckinService.Error("QR Code invalido.", 400)

        reservation_id_str, user_id_str = passenger_identifier.rsplit("@", 1)

        try:
            reservation_id = UUID(str(reservation_id_str))
        except (TypeError, ValueError):
            raise CheckinService.Error("QR Code invalido.", 400)

        reservation = Reservation.objects.select_related(
            "student__user", "civil_servant__user", "guest_passenger"
        ).filter(id=reservation_id).first()

        if not reservation:
            raise CheckinService.Error("QR Code invalido.", 400)

        if reservation.student_id and str(reservation.student.user.id) == user_id_str:
            return reservation.student.user
        if reservation.civil_servant_id and str(reservation.civil_servant.user.id) == user_id_str:
            return reservation.civil_servant.user
        if reservation.guest_passenger_id and str(reservation.guest_passenger_id) == user_id_str:
            return reservation.guest_passenger

        raise CheckinService.Error(
            "QR Code invalido ou usuario inexistente.", 400
        )

    @staticmethod
    def _find_reservation(passenger, trip):
        """Find active/waitlisted reservation for a passenger on a trip."""
        from apps.reservations.services import (
            ACTIVE_RESERVATION_STATUSES as _ACTIVE_RESERVATION_STATUSES,
        )
        from apps.reservations.services import (
            WAITLIST_STATUS as _WAITLIST_STATUS,
        )

        if isinstance(passenger, GuestPassenger):
            passenger_filter = Q(guest_passenger=passenger)
        else:
            passenger_filter = Q(student__user=passenger) | Q(
                civil_servant__user=passenger
            )

        reservation = (
            Reservation.objects.select_related(
                "student__user", "civil_servant__user", "guest_passenger"
            )
            .filter(
                passenger_filter,
                trip=trip,
                status__in=(*_ACTIVE_RESERVATION_STATUSES, _WAITLIST_STATUS),
            )
            .first()
        )

        if reservation is None:
            raise CheckinService.Error(
                "Passageiro sem reserva nesta viagem.", 404
            )

        return reservation
