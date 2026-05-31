from rest_framework import generics, status, views, viewsets
from rest_framework.permissions import AllowAny, IsAdminUser, IsAuthenticated
from rest_framework.response import Response

from apps.reservations.models import Punishment, Reservation
from apps.reservations.services import (
    evict_lowest_priority_active_reservation,
    trip_has_capacity,
    sync_trip_status,
)

from ...trips.models import Trip, TripPassenger
from ..models.auth import AllowedStaff
from ..models.profiles import DriverProfile
from ..permissions import IsDriver, IsSuperAdmin
from ..serializers.auth import (
    AllowedStaffSearchSerializer,
    CivilServantAllowedStaffSerializer,
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
            queryset = queryset.filter(name__icontains=q)
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
