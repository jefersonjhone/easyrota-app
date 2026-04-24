from django.shortcuts import render
from rest_framework import viewsets
from rest_framework import permissions

from .models import Bus
from .serializers import BusSerializer
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