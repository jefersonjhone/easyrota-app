from datetime import datetime, timedelta

from django.db.models import Q
from django.utils import timezone
from rest_framework import generics, permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied
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
        profile = getattr(self.request.user, "admin_profile", None)
        if not profile:
            raise PermissionDenied("Usuário não é administrador")
        serializer.save(administrator=profile)


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

    permission_classes = [permissions.IsAuthenticated]
    queryset = Trip.objects.all()
    serializer_class = TripCurrentScreenSerializer


class MyNextTripView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def _update_trip_status(self, trip):
        """
        Check the schedules and update the trip status in the database, 
        relieving the Serializer of this responsibility.
        """
        
        if trip.status in ["CANCELADA", "RISCO DE CANCELAMENTO"]:
            return trip

        now = timezone.now()
        time_zone = timezone.get_current_timezone()

        expected_dep = timezone.make_aware(
            datetime.combine(trip.trip_date, trip.route.departure_time), time_zone
        )
        
        expected_arr = timezone.make_aware(
            datetime.combine(trip.trip_date, trip.route.arrival_time), time_zone
        )

        if expected_arr <= expected_dep:
            expected_arr += timedelta(days=1)

        if now < expected_dep:
            real_status = "CONFIRMADA"
        elif expected_dep <= now < expected_arr:
            real_status = "EM ANDAMENTO"
        else:
            real_status = "CONCLUÍDA"

        if trip.status != real_status:
            trip.status = real_status
            trip.save(update_fields=["status"])
            
        return trip

    def get(self, request):
        now = timezone.now()
        today = now.date()
        yesterday = today - timedelta(days=1)
        
        is_admin = hasattr(request.user, "admin_profile") or request.user.is_staff

        if is_admin:
            base_running_query = Trip.objects.filter(
                status="EM ANDAMENTO", 
                trip_date__gte=yesterday
            )
            
            base_next_query = Trip.objects.filter(
                trip_date__gte=today
            ).exclude(status__in=["CONCLUÍDA", "CANCELADA"])
            
        else:
            user_reservation_filter = (
                Q(reservation__student__user=request.user) | 
                Q(reservation__civil_servant__user=request.user)
            )
            
            base_running_query = Trip.objects.filter(
                user_reservation_filter,
                status="EM ANDAMENTO", 
                trip_date__gte=yesterday
            )
            
            base_next_query = Trip.objects.filter(
                user_reservation_filter,
                trip_date__gte=today
            ).exclude(status__in=["CONCLUÍDA", "CANCELADA"])

        trip_running = (
            base_running_query
            .order_by("trip_date", "route__departure_time")
            .first()
        )

        if trip_running:
            trip_running = self._update_trip_status(trip_running)
            serializer = TripCurrentScreenSerializer(trip_running)
            return Response(serializer.data)

        next_trip = (
            base_next_query
            .order_by("trip_date", "route__departure_time")
            .first()
        )

        if not next_trip:
            return Response({"detail": "Nenhuma viagem próxima."}, status=404)

        next_trip = self._update_trip_status(next_trip)
        serializer = TripCurrentScreenSerializer(next_trip)
        return Response(serializer.data)
