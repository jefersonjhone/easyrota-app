from django.db import transaction
from django.db.models import Q
from django.utils import timezone
from rest_framework import generics, status, views, viewsets
from rest_framework.permissions import AllowAny, IsAdminUser, IsAuthenticated
from rest_framework.response import Response

from apps.reservations.models import Punishment, Reservation
from apps.reservations.services import (
    ACTIVE_RESERVATION_STATUSES,
    WAITLIST_STATUS,
    evict_lowest_priority_active_reservation,
    get_reservation_passenger_name,
    sync_trip_status,
    trip_has_capacity,
)

from ...trips.models import Trip, TripPassenger
from ..models.auth import AllowedStaff
from ..models.profiles import DriverProfile
from ..permissions import IsDriver, IsSuperAdmin
from ..serializers.auth import (
    AllowedStaffSearchSerializer,
    CivilServantAllowedStaffSerializer,
    LocalTripPassengerSerializer,
)
from ..serializers.users import (
    AuthenticatedUserWithProfileSerializer,
    CreateSubAdminSerializer,
    DriverSerializer,
)


class HealthCheckView(views.APIView):
    """Simple liveness endpoint used by the app and tests."""

    permission_classes = (AllowAny,)

    def get(self, request):
        return Response({"status": "ok"})


class SelfProfileView(views.APIView):
    permission_classes = (IsAuthenticated,)

    def get(self, request):
        user = self.request.user
        serializer = AuthenticatedUserWithProfileSerializer(user)

        reservations = Reservation.objects.none()
        info_data = {}
        active_punishments_count = 0

        if hasattr(user, "student_profile"):
            info_data = {
                "student_id": user.student_profile.student_id,
            }

            reservations = (
                Reservation.objects
                .filter(student=user.student_profile)
                .select_related("trip", "trip__route")
                .order_by("-created_at")
            )

            active_punishments_count = Punishment.objects.filter(
                student=user.student_profile, is_active=True
            ).count()

        elif hasattr(user, "civil_servant_profile"):
            info_data = {
                "civil_servant_id": user.civil_servant_profile.civil_servant_id,
            }
            reservations = (
                Reservation.objects
                .filter(civil_servant=user.civil_servant_profile)
                .select_related("trip", "trip__route")
                .order_by("-created_at")
            )

        reservations_list = list(reservations)

        data = {
            **serializer.data,
            **info_data,
            "joined_at": user.date_joined.strftime("%Y-%m-%d"),
            "checkins_count": sum(1 for r in reservations_list if r.check_in),
            "reservations_count": len(reservations_list),
            "active_reservations": sum(
                1
                for r in reservations_list
                if r.trip.status in ["CONFIRMADA", "RISCO DE CANCELAMENTO"]
            ),
            "active_punishments": active_punishments_count,
        }

        return Response(data)


class AdminDelegationView(generics.GenericAPIView):
    """Allow superadmins to delegate new subadmin accounts."""

    serializer_class = CreateSubAdminSerializer
    permission_classes = (IsAuthenticated, IsSuperAdmin)

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        created = serializer.save()
        return Response(
            serializer.to_representation(created),
            status=status.HTTP_201_CREATED,
        )


class DriverViewSet(viewsets.ModelViewSet):
    queryset = DriverProfile.objects.all()
    serializer_class = DriverSerializer
    permission_classes = (IsAdminUser,)


class AllowedStaffSearchView(views.APIView):
    permission_classes = (IsAuthenticated, IsDriver)

    def get(self, request):
        q = request.query_params.get("q", "").strip()
        queryset = AllowedStaff.objects.all()
        if q:
            queryset = queryset.filter(
                Q(name__icontains=q) | Q(registration_number__icontains=q)
            )
        serializer = AllowedStaffSearchSerializer(
            queryset.order_by("name")[:20],
            many=True,
        )
        return Response(serializer.data)


class DriverTripPassengerView(views.APIView):
    permission_classes = (IsAuthenticated, IsDriver)

    def post(self, request):
        serializer = CivilServantAllowedStaffSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        trip_id = request.data.get("trip")
        if not trip_id:
            return Response(
                {"trip": ["This field is required."]},
                status=status.HTTP_400_BAD_REQUEST,
            )

        allowed_staff = AllowedStaff.objects.get(
            name__iexact=serializer.validated_data["name"],
            registration_number=serializer.validated_data["registration_number"],
        )

        trip = Trip.objects.select_related("bus", "route").get(id=trip_id)

        existing_reservation = Reservation.objects.filter(
            trip_id=trip_id,
            civil_servant__civil_servant_id=allowed_staff.registration_number,
        ).first()

        if existing_reservation:
            if trip.bus and not trip_has_capacity(trip):
                return Response(
                    {"detail": "Não há vaga disponível para priorizar o servidor."},
                    status=status.HTTP_409_CONFLICT,
                )

            existing_reservation.status = "CONFIRMADA"
            existing_reservation.save(update_fields=["status"])
            sync_trip_status(existing_reservation.trip)

            return Response(
                {"reservation_id": existing_reservation.id},
                status=status.HTTP_200_OK,
            )

        if trip.bus and not trip_has_capacity(trip):
            evicted = evict_lowest_priority_active_reservation(trip)
            if evicted is None:
                return Response(
                    {"detail": "Não há vaga disponível para priorizar o servidor."},
                    status=status.HTTP_409_CONFLICT,
                )

        passenger = TripPassenger.objects.create(
            trip=trip,
            allowed_staff=allowed_staff,
            recorded_by=request.user.driver_profile,
        )
        sync_trip_status(trip)

        return Response({"id": passenger.id}, status=status.HTTP_201_CREATED)


class LocalDriverTripPassengerView(views.APIView):
    permission_classes = (IsAuthenticated, IsDriver)

    def _serialize_evicted_reservation(self, reservation):
        return {
            "name": get_reservation_passenger_name(reservation),
            "reservation_id": reservation.id,
        }

    def _serialize_local_passenger(self, passenger):
        if passenger.passenger_type == TripPassenger.PassengerType.LOCAL_SERVER:
            passenger_name = (
                passenger.allowed_staff.name
                if passenger.allowed_staff_id
                else "Servidor local"
            )
        else:
            passenger_name = passenger.full_name or "Convidado local"

        return {
            "id": passenger.id,
            "passenger_type": passenger.passenger_type,
            "name": passenger_name,
            "cpf": passenger.cpf,
            "allowed_staff_id": passenger.allowed_staff_id,
            "associated_staff_id": passenger.associated_staff_id,
        }

    def _serialize_reservation_passenger(self, reservation):
        return {
            "reservation_id": reservation.id,
            "passenger_type": "RESERVATION",
            "name": get_reservation_passenger_name(reservation),
        }

    def _checked_in_count(self, trip):
        return (
            Reservation.objects.filter(trip=trip, check_in=True).count()
            + trip.trip_passengers.count()
        )

    def _ensure_capacity_or_evict(self, trip, evicted_passengers):
        if trip.bus and not trip_has_capacity(trip):
            evicted = evict_lowest_priority_active_reservation(trip)
            if evicted is None:
                return Response(
                    {"detail": "Nao ha vaga disponivel para cadastrar o passageiro."},
                    status=status.HTTP_409_CONFLICT,
                )

            evicted_passengers.append(self._serialize_evicted_reservation(evicted))

        return None

    def _check_in_existing_server_reservation(
        self, trip, allowed_staff, evicted_passengers
    ):
        reservation = (
            Reservation.objects
            .filter(
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
            capacity_response = self._ensure_capacity_or_evict(trip, evicted_passengers)
            if capacity_response is not None:
                return capacity_response

        reservation.status = "CONFIRMADA"
        reservation.check_in = True
        reservation.checkin_date = timezone.now()
        reservation.save(update_fields=["status", "check_in", "checkin_date"])
        return reservation

    def _ensure_local_server(self, trip, allowed_staff, driver, evicted_passengers):
        existing_passenger = (
            TripPassenger.objects
            .filter(
                trip=trip,
                passenger_type=TripPassenger.PassengerType.LOCAL_SERVER,
                allowed_staff=allowed_staff,
            )
            .select_related("allowed_staff")
            .first()
        )
        if existing_passenger:
            return existing_passenger, False, None

        reservation = self._check_in_existing_server_reservation(
            trip, allowed_staff, evicted_passengers
        )
        if isinstance(reservation, Response):
            return None, False, reservation
        if reservation:
            return None, False, reservation

        capacity_response = self._ensure_capacity_or_evict(trip, evicted_passengers)
        if capacity_response is not None:
            return None, False, capacity_response

        passenger = TripPassenger.objects.create(
            trip=trip,
            passenger_type=TripPassenger.PassengerType.LOCAL_SERVER,
            allowed_staff=allowed_staff,
            recorded_by=driver,
        )
        return passenger, True, None

    def _build_response(self, payload, evicted_passengers, trip, response_status):
        response_payload = {
            **payload,
            "evicted_passengers": evicted_passengers,
            "checked_in_count": self._checked_in_count(trip),
        }
        if evicted_passengers:
            response_payload["evicted_passenger"] = evicted_passengers[0]

        return Response(response_payload, status=response_status)

    @transaction.atomic
    def delete(self, request):
        trip_id = request.data.get("trip")
        if not trip_id:
            return Response(
                {"trip": ["This field is required."]},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            trip = Trip.objects.get(id=trip_id)
        except (TypeError, ValueError, Trip.DoesNotExist):
            return Response(
                {"detail": "Viagem nao encontrada."},
                status=status.HTTP_404_NOT_FOUND,
            )

        local_passenger_id = request.data.get("local_passenger_id")
        reservation_id = request.data.get("reservation_id")
        if not local_passenger_id and not reservation_id:
            return Response(
                {
                    "detail": (
                        "Informe o passageiro local ou a reserva "
                        "para remover do embarque."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        if local_passenger_id:
            try:
                local_passenger_id = int(local_passenger_id)
            except (TypeError, ValueError):
                return Response(
                    {"detail": "Passageiro local invalido."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            passenger = (
                TripPassenger.objects
                .filter(id=local_passenger_id, trip=trip)
                .select_related("allowed_staff", "associated_staff")
                .first()
            )
            if passenger is None:
                return Response(
                    {"detail": "Passageiro local nao encontrado nesta viagem."},
                    status=status.HTTP_404_NOT_FOUND,
                )

            passenger_payload = self._serialize_local_passenger(passenger)
            passenger.delete()
            sync_trip_status(trip)
            return Response(
                {
                    "removed_passenger": {
                        "name": passenger_payload["name"],
                        "local_passenger_id": passenger_payload["id"],
                    },
                    "checked_in_count": self._checked_in_count(trip),
                },
                status=status.HTTP_200_OK,
            )

        try:
            reservation_id = int(reservation_id)
        except (TypeError, ValueError):
            return Response(
                {"detail": "Reserva invalida."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        reservation = (
            Reservation.objects
            .select_related("student__user", "civil_servant__user", "guest_passenger")
            .filter(id=reservation_id, trip=trip, check_in=True)
            .first()
        )
        if reservation is None:
            return Response(
                {"detail": "Reserva embarcada nao encontrada nesta viagem."},
                status=status.HTTP_404_NOT_FOUND,
            )

        passenger_name = get_reservation_passenger_name(reservation)
        reservation.check_in = False
        reservation.checkin_date = None
        reservation.save(update_fields=["check_in", "checkin_date"])
        sync_trip_status(trip)
        return Response(
            {
                "removed_passenger": {
                    "name": passenger_name,
                    "reservation_id": reservation.id,
                },
                "checked_in_count": self._checked_in_count(trip),
            },
            status=status.HTTP_200_OK,
        )

    @transaction.atomic
    def post(self, request):
        serializer = LocalTripPassengerSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        trip = Trip.objects.select_related("bus", "route").get(
            id=serializer.validated_data["trip"]
        )
        driver = request.user.driver_profile
        evicted_passengers = []

        passenger_type = serializer.validated_data["passenger_type"]
        if passenger_type == TripPassenger.PassengerType.LOCAL_SERVER:
            allowed_staff = serializer.validated_data["allowed_staff"]
            passenger, created, fallback = self._ensure_local_server(
                trip,
                allowed_staff,
                driver,
                evicted_passengers,
            )
            if isinstance(fallback, Response):
                transaction.set_rollback(True)
                return fallback

            sync_trip_status(trip)
            if fallback is not None:
                return self._build_response(
                    {"passenger": self._serialize_reservation_passenger(fallback)},
                    evicted_passengers,
                    trip,
                    status.HTTP_200_OK,
                )

            return self._build_response(
                {"passenger": self._serialize_local_passenger(passenger)},
                evicted_passengers,
                trip,
                status.HTTP_201_CREATED if created else status.HTTP_200_OK,
            )

        associated_staff = serializer.validated_data["associated_staff"]
        server_passenger, _, fallback = self._ensure_local_server(
            trip,
            associated_staff,
            driver,
            evicted_passengers,
        )
        if isinstance(fallback, Response):
            transaction.set_rollback(True)
            return fallback

        existing_guest = (
            TripPassenger.objects
            .filter(
                trip=trip,
                passenger_type=TripPassenger.PassengerType.LOCAL_GUEST,
                cpf=serializer.validated_data["cpf"],
            )
            .select_related("associated_staff")
            .first()
        )
        if existing_guest:
            sync_trip_status(trip)
            return self._build_response(
                {"passenger": self._serialize_local_passenger(existing_guest)},
                evicted_passengers,
                trip,
                status.HTTP_200_OK,
            )

        capacity_response = self._ensure_capacity_or_evict(trip, evicted_passengers)
        if capacity_response is not None:
            transaction.set_rollback(True)
            return capacity_response

        passenger = TripPassenger.objects.create(
            trip=trip,
            passenger_type=TripPassenger.PassengerType.LOCAL_GUEST,
            full_name=serializer.validated_data["full_name"],
            cpf=serializer.validated_data["cpf"],
            associated_staff=associated_staff,
            recorded_by=driver,
        )
        sync_trip_status(trip)

        payload = {
            "passenger": self._serialize_local_passenger(passenger),
        }
        if server_passenger is not None:
            payload["associated_server"] = self._serialize_local_passenger(
                server_passenger
            )
        elif fallback is not None:
            payload["associated_server"] = self._serialize_reservation_passenger(
                fallback
            )

        return self._build_response(
            payload,
            evicted_passengers,
            trip,
            status.HTTP_201_CREATED,
        )
