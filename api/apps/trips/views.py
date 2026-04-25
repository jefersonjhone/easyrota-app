from django.shortcuts import render
from rest_framework import viewsets, permissions, generics

from .models import Bus, Route
from .serializers import BusSerializer, RouteSerializer
from ..users.permissions import IsDriverReadOnly

class BusViewSet(viewsets.ModelViewSet):
    """This view handles all CRUD operations, depending on the user type: administrator or driver."""
    queryset = Bus.objects.all()
    serializer_class = BusSerializer
    
    def get_permissions(self):
        """Allows full access for administrators and only GET requests for drivers."""
        if (self.action in ['list', 'retrieve']):
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
