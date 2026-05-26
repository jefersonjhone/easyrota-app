from rest_framework import generics, status, views, viewsets
from rest_framework.permissions import AllowAny, IsAdminUser, IsAuthenticated
from rest_framework.response import Response

from ..models.profiles import DriverProfile
from ..permissions import IsSuperAdmin
from ..serializers.users import (
    AuthenticatedUserWithProfileSerializer,
    CreateSubAdminSerializer,
    DriverSerializer,
)
from apps.users.models import CustomUser
from apps.reservations.models import Reservation


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
                1 for r in reservations_list
                if r.trip.status in [
                    "CONFIRMADA", "RISCO DE CANCELAMENTO"
                ] or print(r.status)
            ),
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
