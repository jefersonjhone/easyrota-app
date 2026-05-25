from rest_framework import generics, status, views, viewsets
from rest_framework.permissions import AllowAny, IsAdminUser, IsAuthenticated
from rest_framework.response import Response

from ..models.auth import AllowedStaff
from ..models.profiles import DriverProfile
from ..permissions import IsDriver, IsSuperAdmin
from ..serializers.users import CreateSubAdminSerializer, DriverSerializer
from ..serializers.auth import (
    AllowedStaffSearchSerializer,
    CivilServantAllowedStaffSerializer,
)
from ...trips.models import TripPassenger


class HealthCheckView(views.APIView):
    """Simple liveness endpoint used by the app and tests."""

    permission_classes = (AllowAny,)

    def get(self, request):
        return Response({"status": "ok"})


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

        passenger = TripPassenger.objects.create(
            trip_id=trip_id,
            allowed_staff=allowed_staff,
            recorded_by=request.user.driver_profile,
        )
        return Response({"id": passenger.id}, status=status.HTTP_201_CREATED)
