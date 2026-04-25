from rest_framework import generics
from rest_framework import permissions
from rest_framework import viewsets

from ..users.permissions import IsDriverReadOnly
from .models import Bus
from .models import Route
from .serializers import BusSerializer
from .serializers import RouteSerializer


class BusViewSet(viewsets.ModelViewSet):
    """This view handles all CRUD operations, depending on the user type: administrator or driver."""

    queryset = Bus.objects.all()
    serializer_class = BusSerializer

    def get_permissions(self):
        """Allows full access for administrators and only GET requests for drivers."""
        if self.action in ["list", "retrieve"]:
            self.permission_classes = [permissions.IsAdminUser | IsDriverReadOnly]
        else:
            self.permission_classes = [permissions.IsAdminUser]

        return super().get_permissions()


class RouteListCreateView(generics.ListCreateAPIView):
    queryset = Route.objects.all()
    serializer_class = RouteSerializer


class RouteDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Route.objects.all()
    serializer_class = RouteSerializer
