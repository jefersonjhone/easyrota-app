from datetime import timedelta

from django.utils import timezone
from rest_framework import generics, permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from ..users.permissions import IsAdminOrReadOnly, IsDriver, IsDriverReadOnly
from .models import Bus, Route, Trip
from .serializers import (
    BusSerializer,
    RouteSerializer,
    TripCurrentScreenSerializer,
    TripSerializer,
)


class BusViewSet(viewsets.ModelViewSet):
    """This view handles all CRUD operations, depending on the user type:
    administrator or driver."""

    queryset = Bus.objects.all()
    serializer_class = BusSerializer

    def get_permissions(self):
        """Allows full access for administrators and only GET requests for drivers."""
        if self.action in ["list", "retrieve"]:
            self.permission_classes = [permissions.IsAdminUser | IsDriverReadOnly]
        elif self.action == "assign_driver":
            self.permission_classes = [IsDriver]
        else:
            self.permission_classes = [permissions.IsAdminUser]

        return super().get_permissions()

    def perform_create(self, serializer):
        serializer.save(administrator=self.request.user.admin_profile)

    @action(detail=True, methods=["post"])
    def assign_driver(self, request, pk=None):
        bus = self.get_object()
        driver = request.user.driver_profile

        bus.driver = driver
        bus.save()

        return Response(
            {"status": "Motorista associado com sucesso."}, status=status.HTTP_200_OK
        )


class RouteListCreateView(generics.ListCreateAPIView):
    queryset = Route.objects.all()
    serializer_class = RouteSerializer
    permission_classes = (IsAdminOrReadOnly,)

    def perform_create(self, serializer):
        serializer.save(administrator=self.request.user.admin_profile)


class RouteDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Route.objects.all()
    serializer_class = RouteSerializer
    permission_classes = (IsAdminOrReadOnly,)


class TripViewSet(viewsets.ModelViewSet):
    queryset = Trip.objects.all()
    serializer_class = TripSerializer

    def get_permissions(self):
        if self.action in ["list", "retrieve"]:
            self.permission_classes = [permissions.IsAdminUser | IsDriverReadOnly]
        else:
            self.permission_classes = [permissions.IsAdminUser]

        return super().get_permissions()


class CurrentTripDetailView(generics.RetrieveAPIView):
    """
    Returns the processed data for a specific trip to the Current Trip screen.
    """

    permission_classes = [IsAuthenticated]
    queryset = Trip.objects.all()
    serializer_class = TripCurrentScreenSerializer


class MyNextTripView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        now = timezone.now()
        today = now.date()
        yesterday = today - timedelta(days=1)

        trip_running = (
            Trip.objects
            .filter(status="EM ANDAMENTO", trip_date__gte=yesterday)
            .order_by("trip_date", "route__departure_time")
            .first()
        )

        if trip_running:
            serializer = TripCurrentScreenSerializer(trip_running)
            return Response(serializer.data)

        next_trip = (
            Trip.objects
            .filter(trip_date__gte=today)
            .exclude(status__in=["CONCLUÍDA", "CANCELADA"])
            .order_by("trip_date", "route__departure_time")
            .first()
        )

        if not next_trip:
            return Response({"detail": "Nenhuma viagem próxima."}, status=404)

        serializer = TripCurrentScreenSerializer(next_trip)
        return Response(serializer.data)
