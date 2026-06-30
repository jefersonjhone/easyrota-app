from django.db import transaction
from django.db.models import Q
from django.shortcuts import get_object_or_404
from rest_framework import generics, status, views, viewsets
from rest_framework.decorators import action
from rest_framework.pagination import PageNumberPagination
from rest_framework.permissions import AllowAny, IsAdminUser, IsAuthenticated
from rest_framework.response import Response

from apps.reservations.models import Punishment, Reservation
from apps.reservations.services.priority_service import PriorityService
from apps.trips.services.trip_service import TripService
from apps.trips.services.trip_status_service import TripStatusService

from ...trips.models import GuestPassenger, Trip, TripPassenger
from ..models.auth import AllowedStaff
from ..models.profiles import (
    AdministratorProfile,
    CivilServantProfile,
    DriverProfile,
    StudentProfile,
)
from ..permissions import IsDriver, IsSuperAdmin
from ..serializers.auth import (
    AllowedStaffListSerializer,
    AllowedStaffSearchSerializer,
    CivilServantAllowedStaffSerializer,
    LocalTripPassengerSerializer,
)
from ..serializers.users import (
    AdminListSerializer,
    AdminUpdateSerializer,
    AuthenticatedUserWithProfileSerializer,
    CivilServantSerializer,
    CreateSubAdminSerializer,
    DriverAdminDetailSerializer,
    DriverSerializer,
    StudentSerializer,
)
from ..services.local_passenger_service import (
    CheckedInCount,
    LocalPassengerService,
    PassengerSerializer,
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
    """List or create admin accounts. Superadmin only."""

    permission_classes = (IsAuthenticated, IsSuperAdmin)

    def get_serializer_class(self):
        if self.request.method == "POST":
            return CreateSubAdminSerializer
        return AdminListSerializer

    def get(self, request):
        q = request.query_params.get("q", "").strip()
        profiles = AdministratorProfile.objects.select_related(
            "user", "created_by__user"
        )
        if q:
            profiles = profiles.filter(
                Q(user__full_name__icontains=q) | Q(user__email__icontains=q)
            )
        serializer = AdminListSerializer(profiles, many=True)
        return Response(serializer.data)

    def post(self, request, *args, **kwargs):
        serializer = CreateSubAdminSerializer(
            data=request.data, context={"request": request}
        )
        serializer.is_valid(raise_exception=True)
        created = serializer.save()
        return Response(
            serializer.to_representation(created),
            status=status.HTTP_201_CREATED,
        )


class AdminDetailView(generics.GenericAPIView):
    """Update or soft-delete an admin account. Superadmin only."""

    permission_classes = (IsAuthenticated, IsSuperAdmin)
    serializer_class = AdminUpdateSerializer

    def get_object(self):
        user_id = self.kwargs["user_id"]
        return get_object_or_404(
            AdministratorProfile.objects.select_related("user"),
            user_id=user_id,
        )

    def patch(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = AdminUpdateSerializer(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        updated = serializer.save()
        return Response(AdminListSerializer(updated).data)

    def delete(self, request, *args, **kwargs):
        instance = self.get_object()
        user = instance.user
        user.is_staff = False
        user.save(update_fields=["is_staff"])
        instance.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class DriverViewSet(viewsets.ModelViewSet):
    serializer_class = DriverSerializer
    permission_classes = (IsAdminUser,)

    def get_queryset(self):
        qs = DriverProfile.objects.select_related("user").all()
        q = self.request.query_params.get("q", "").strip()
        if q:
            qs = qs.filter(
                Q(user__full_name__icontains=q)
                | Q(user__email__icontains=q)
                | Q(cnh__icontains=q)
            )
        return qs

    @action(detail=True, methods=["get"])
    def admin_detail(self, request, pk=None):
        driver = self.get_object()
        serializer = DriverAdminDetailSerializer(driver, context={"request": request})
        return Response(serializer.data)


def _build_user_detail_response(profile, profile_type):
    if profile_type == "STUDENT":
        reservations = Reservation.objects.filter(student=profile)
    else:
        reservations = Reservation.objects.filter(civil_servant=profile)

    reservations = reservations.select_related("trip", "trip__route")
    user = profile.user

    total_reservations = reservations.count()
    total_checked_in = reservations.filter(check_in=True).count()
    total_absences = total_reservations - total_checked_in
    attendance_rate = (
        round((total_checked_in / total_reservations * 100), 2)
        if total_reservations > 0
        else 0
    )

    trips_data = [
        {
            "id": r.trip.id,
            "date": r.trip.trip_date,
            "route": f"{r.trip.route.origin} → {r.trip.route.destiny}",
            "departure_time": str(r.trip.route.departure_time),
            "arrival_time": str(r.trip.route.arrival_time),
            "status": r.trip.status,
            "checked_in": r.check_in,
            "reservation_status": r.status,
        }
        for r in reservations.order_by("-trip__trip_date")
    ]

    guests_data = []
    guest_count = 0

    if profile_type == "CIVIL-SERVANT":
        guest_qs = (
            GuestPassenger.objects
            .filter(recorded_by=profile)
            .select_related("trip", "trip__route")
            .order_by("-trip__trip_date")
        )
        guest_count = guest_qs.count()
        guests_data = [
            {
                "id": str(g.id),
                "full_name": g.full_name,
                "cpf": g.cpf,
                "trip_date": g.trip.trip_date,
                "route": f"{g.trip.route.origin} → {g.trip.route.destiny}",
            }
            for g in guest_qs
        ]

    return {
        "user": {
            "id": user.id,
            "full_name": user.full_name,
            "email": user.email,
            "profile_type": profile_type,
            "is_active": user.is_active,
            "date_joined": user.date_joined,
        },
        "profile": {
            "student_id": profile.student_id if profile_type == "STUDENT" else None,
            "civil_servant_id": profile.civil_servant_id
            if profile_type == "CIVIL-SERVANT"
            else None,
        },
        "stats": {
            "total_trips": total_reservations,
            "total_reservations": total_reservations,
            "total_absences": total_absences,
            "attendance_rate": attendance_rate,
        },
        "trips": trips_data,
        "guests": guests_data,
        "guest_count": guest_count,
    }


class StudentViewSet(viewsets.ModelViewSet):
    serializer_class = StudentSerializer
    permission_classes = (IsAdminUser,)

    def get_queryset(self):
        qs = StudentProfile.objects.select_related("user").all()
        q = self.request.query_params.get("q", "").strip()
        if q:
            qs = qs.filter(
                Q(user__full_name__icontains=q)
                | Q(user__email__icontains=q)
                | Q(student_id__icontains=q)
            )
        return qs

    @action(detail=True, methods=["get"], url_path="detail")
    def user_detail(self, request, pk=None):
        profile = self.get_object()
        return Response(_build_user_detail_response(profile, "STUDENT"))


class CivilServantViewSet(viewsets.ModelViewSet):
    serializer_class = CivilServantSerializer
    permission_classes = (IsAdminUser,)

    def get_queryset(self):
        qs = CivilServantProfile.objects.select_related("user").all()
        q = self.request.query_params.get("q", "").strip()
        if q:
            qs = qs.filter(
                Q(user__full_name__icontains=q)
                | Q(user__email__icontains=q)
                | Q(civil_servant_id__icontains=q)
            )
        return qs

    @action(detail=True, methods=["get"], url_path="detail")
    def user_detail(self, request, pk=None):
        profile = self.get_object()
        return Response(_build_user_detail_response(profile, "CIVIL-SERVANT"))


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
            if trip.bus and not TripService.trip_has_capacity(trip):
                return Response(
                    {"detail": "Não há vaga disponível para priorizar o servidor."},
                    status=status.HTTP_409_CONFLICT,
                )

            existing_reservation.status = "CONFIRMADA"
            existing_reservation.save(update_fields=["status"])
            TripStatusService.sync_trip_status(existing_reservation.trip)

            return Response(
                {"reservation_id": existing_reservation.id},
                status=status.HTTP_200_OK,
            )

        if trip.bus and not TripService.trip_has_capacity(trip):
            evicted = PriorityService.evict_lowest_priority_active(trip)
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
        TripStatusService.sync_trip_status(trip)

        return Response({"id": passenger.id}, status=status.HTTP_201_CREATED)


class LocalDriverTripPassengerView(views.APIView):
    permission_classes = (IsAuthenticated, IsDriver)

    # ------------------------------------------------------------------
    # Response helpers (thin — only HTTP concerns)
    # ------------------------------------------------------------------

    @staticmethod
    def _build_response(payload, evicted_passengers, trip, response_status):
        response_payload = {
            **payload,
            "evicted_passengers": evicted_passengers,
            "checked_in_count": CheckedInCount.get(trip),
        }
        if evicted_passengers:
            response_payload["evicted_passenger"] = evicted_passengers[0]
        return Response(response_payload, status=response_status)

    # ------------------------------------------------------------------
    # DELETE — remove a local passenger or reservation check-in
    # ------------------------------------------------------------------

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

        # --- remove local passenger ---
        if local_passenger_id:
            try:
                passenger_payload = LocalPassengerService.remove_local_passenger(
                    trip, local_passenger_id
                )
            except LocalPassengerService.NotFound as exc:
                return Response({"detail": str(exc)}, status=status.HTTP_404_NOT_FOUND)

            return Response(
                {
                    "removed_passenger": {
                        "name": passenger_payload["name"],
                        "local_passenger_id": passenger_payload["id"],
                    },
                    "checked_in_count": CheckedInCount.get(trip),
                },
                status=status.HTTP_200_OK,
            )

        # --- remove reservation check-in ---
        try:
            name, res_id = LocalPassengerService.remove_reservation_checkin(
                trip, reservation_id
            )
        except LocalPassengerService.NotFound as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_404_NOT_FOUND)

        return Response(
            {
                "removed_passenger": {"name": name, "reservation_id": res_id},
                "checked_in_count": CheckedInCount.get(trip),
            },
            status=status.HTTP_200_OK,
        )

    # ------------------------------------------------------------------
    # POST — register a local server or guest passenger
    # ------------------------------------------------------------------

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

        try:
            # --- local server ---
            if passenger_type == TripPassenger.PassengerType.LOCAL_SERVER:
                allowed_staff = serializer.validated_data["allowed_staff"]
                passenger, created, fallback = (
                    LocalPassengerService.ensure_local_server(
                        trip, allowed_staff, driver, evicted_passengers
                    )
                )
                TripStatusService.sync_trip_status(trip)

                if fallback is not None:
                    return self._build_response(
                        {
                            "passenger": (
                                PassengerSerializer.reservation_passenger(fallback)
                            )
                        },
                        evicted_passengers,
                        trip,
                        status.HTTP_200_OK,
                    )
                return self._build_response(
                    {"passenger": PassengerSerializer.local_passenger(passenger)},
                    evicted_passengers,
                    trip,
                    status.HTTP_201_CREATED if created else status.HTTP_200_OK,
                )

            # --- local guest ---
            associated_staff = serializer.validated_data["associated_staff"]
            guest_without_server = serializer.validated_data.get(
                "guest_without_server", False
            )
            server_passenger = None
            fallback = None
            if not guest_without_server:
                server_passenger, _, fallback = (
                    LocalPassengerService.ensure_local_server(
                    trip, associated_staff, driver, evicted_passengers
                ))
                TripStatusService.sync_trip_status(trip)

            passenger = LocalPassengerService.register_local_guest(
                trip,
                associated_staff,
                serializer.validated_data["cpf"],
                serializer.validated_data["full_name"],
                driver,
                evicted_passengers,
            )
            TripStatusService.sync_trip_status(trip)

            payload = {"passenger": PassengerSerializer.local_passenger(passenger)}
            if server_passenger is not None:
                payload["associated_server"] = PassengerSerializer.local_passenger(
                    server_passenger
                )
            elif fallback is not None:
                payload["associated_server"] = (
                    PassengerSerializer.reservation_passenger(fallback)
                )

            return self._build_response(
                payload,
                evicted_passengers,
                trip,
                status.HTTP_201_CREATED,
            )

        except LocalPassengerService.CapacityError as exc:
            transaction.set_rollback(True)
            return Response({"detail": str(exc)}, status=status.HTTP_409_CONFLICT)
        associated_staff = serializer.validated_data["associated_staff"]
        guest_without_server = serializer.validated_data.get(
            "guest_without_server", False
        )
        server_passenger = None
        fallback = None
        if not guest_without_server:
            server_passenger, _, fallback = self._ensure_local_server(
                trip,
                associated_staff,
                driver,
                evicted_passengers,
            )
            if isinstance(fallback, Response):
                transaction.set_rollback(True)
                return fallback


class AllowedStaffPagination(PageNumberPagination):
    page_size = 15
    page_size_query_param = "page_size"
    max_page_size = 100


class AllowedStaffListView(generics.ListAPIView):
    permission_classes = [IsAdminUser]
    serializer_class = AllowedStaffListSerializer
    pagination_class = AllowedStaffPagination

    def get_queryset(self):
        from django.db.models import Exists, OuterRef, Q

        q = self.request.query_params.get("q", "").strip()
        has_account = self.request.query_params.get("has_account")

        qs = AllowedStaff.objects.annotate(
            has_account=Exists(
                CivilServantProfile.objects.filter(
                    civil_servant_id=OuterRef("registration_number")
                )
            )
        )

        if has_account is not None:
            qs = qs.filter(has_account=has_account.lower() == "true")

        if q:
            qs = qs.filter(
                Q(name__icontains=q) | Q(registration_number__icontains=q)
            )
        return qs.order_by("name")
