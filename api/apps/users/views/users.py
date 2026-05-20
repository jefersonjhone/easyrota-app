from rest_framework import generics, status, views
from rest_framework import viewsets
from rest_framework.permissions import AllowAny, IsAuthenticated, IsAdminUser
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet

from ..permissions import IsSuperAdmin

from ..serializers.users import CreateSubAdminSerializer, DriverSerializer
from ..models.profiles import DriverProfile


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
