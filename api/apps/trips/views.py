from datetime import datetime, timedelta

from django.db.models import Q
from django.utils import timezone
from rest_framework import generics, permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied
from rest_framework.response import Response
from rest_framework.views import APIView

from ..users.permissions import (
    IsAdminOrReadOnly,
    IsDriver,
    IsDriverReadOnly,
)
from .filters import FilterTripViewSet
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
        else:
            self.permission_classes = [permissions.IsAdminUser]

        return super().get_permissions()

    def perform_create(self, serializer):
        serializer.save(administrator=self.request.user.admin_profile)


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
    filter_backends = [FilterTripViewSet]

    @action(detail=True, methods=["post"])
    def finish_trip(self, request, pk=None):
        Trip.objects.filter(id=pk).update(status="CONCLUÍDA",
                                          arrival_timestamp=timezone.now())
        return Response("trip concluída com sucesso", status.HTTP_200_OK)

    @action(detail=True, methods=["post"])
    def assign_driver(self, request, pk=None):
        driver = request.user.driver_profile
        trip = Trip.objects.get(id=pk)
        if trip.driver and trip.driver != driver:
            return Response(
                {"error": "Você não é o motorista desta viagem."},
                status=status.HTTP_403_FORBIDDEN,
            )
        trip.driver = driver
        trip.save()
        return Response(
            {"status": "Motorista associado com sucesso."}, status=status.HTTP_200_OK
        )

    @action(detail=True, methods=["post"])
    def unassign_driver(self, request, pk):
        trip = Trip.objects.get(id=pk)
        if trip.driver and trip.driver == request.user.driver_profile:
            trip.driver = None
            trip.save()
            return Response(
                {"status": "Motorista desassociado com sucesso."},
                status=status.HTTP_200_OK,
            )

        return Response(
            {"error": "Você não é o motorista desta viagem."},
            status=status.HTTP_403_FORBIDDEN,
        )

    @action(detail=True, methods=["post"])
    def assign_bus(self, request, pk=None):
        bus = request.data.get("bus")
        if not bus:
            return Response(
                {"error": "O campo 'bus' é obrigatório."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        # verify if bus already is in use
        # create a custom queryset in bus model todo it and reuse
        bus = Bus.objects.get(id=bus)
        if not bus:
            return Response(
                {"error": "Onibus não encontrado."}, status=status.HTTP_400_BAD_REQUEST
            )
        trip = Trip.objects.get(id=pk)

        if trip.driver and trip.driver == request.user.driver_profile:
            trip.bus = bus
            trip.save()
            return Response(
                {"status": "Onibus associado com sucesso."}, status=status.HTTP_200_OK
            )
        return Response(
            {"error": "Você não é o motorista desta viagem."},
            status=status.HTTP_403_FORBIDDEN,
        )

    @action(detail=True, methods=["post"])
    def unassign_bus(self, request, pk):
        trip = Trip.objects.get(id=pk)

        if trip.driver and trip.driver == request.user.driver_profile:
            trip.bus = None
            trip.save()
            return Response(
                {"status": "Onibus desassociado com sucesso."},
                status=status.HTTP_200_OK,
            )

        return Response(
            {"error": "Você não é o motorista desta viagem."},
            status=status.HTTP_403_FORBIDDEN,
        )

    def get_queryset(self):
        return Trip.objects.joinable_by_driver(self.request.user)

    def get_permissions(self):
        if self.action in ["list", "retrieve"]:
            self.permission_classes = [permissions.IsAuthenticated]
        elif self.action in [
            "finish_trip",
            "start_trip",
            "assign_bus",
            "unassign_bus",
            "assign_driver",
            "unassign_driver",
        ]:
            self.permission_classes = [IsDriver]
        else:
            self.permission_classes = [permissions.IsAdminUser]

        return super().get_permissions()


class MyNextTripView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def _update_trip_status(self, trip):
        """
        Check schedules, reservations and driver actions 
        to update the trip status in the database.
        """
        if trip.status in ["CONCLUÍDA", "CANCELADA"]:
            return trip

        now = timezone.now()

        if trip.arrival_timestamp:
            real_status = "CONCLUÍDA"
        elif trip.departure_timestamp:
            real_status = "EM ANDAMENTO"
        else:
            has_civil_servant = trip.reservation_set.filter(
                civil_servant__isnull=False).exists()
            
            time_zone = timezone.get_current_timezone()
            expected_dep = timezone.make_aware(
                datetime.combine(trip.trip_date, trip.route.departure_time), time_zone
            )
            expected_arr = timezone.make_aware(
                datetime.combine(trip.trip_date, trip.route.arrival_time), time_zone
            )
            
            if expected_arr <= expected_dep:
                expected_arr += timedelta(days=1)

            if not has_civil_servant:
                cancel_limit = expected_dep + timedelta(minutes=30)
                
                if now >= cancel_limit:
                    real_status = "CANCELADA"
                else:
                    real_status = "RISCO DE CANCELAMENTO"
            else:
                if now >= expected_arr:
                    real_status = "CANCELADA"
                else:
                    real_status = "CONFIRMADA"

        if trip.status != real_status:
            trip.status = real_status
            trip.save(update_fields=["status"])

        return trip

    def get(self, request):
        now = timezone.localtime()
        today = now.date()
        yesterday = today - timedelta(days=1)

        is_admin = hasattr(request.user, "admin_profile") or request.user.is_staff

        if is_admin:
            base_running_query = Trip.objects.filter(
                status="EM ANDAMENTO", trip_date__gte=yesterday
            )

            base_next_query = Trip.objects.filter(trip_date__gte=today).exclude(
                status__in=["CONCLUÍDA", "CANCELADA"]
            )

        else:
            user_trip_filter = (
                Q(reservation__student__user=request.user)
                | Q(reservation__civil_servant__user=request.user)
                | Q(driver__user=request.user)
            )

            base_running_query = Trip.objects.filter(
                user_trip_filter, status="EM ANDAMENTO", trip_date__gte=yesterday
            )

            base_next_query = Trip.objects.filter(
                user_trip_filter, trip_date__gte=today
            ).exclude(status__in=["CONCLUÍDA", "CANCELADA"])

        running_trips = base_running_query.order_by(
            "trip_date", "route__departure_time"
            )
        
        for trip in running_trips:
            updated_trip = self._update_trip_status(trip)
            if updated_trip.status == "EM ANDAMENTO":
                serializer = TripCurrentScreenSerializer(updated_trip)
                return Response(serializer.data)

        next_trips = base_next_query.order_by("trip_date", "route__departure_time")
        
        for trip in next_trips:
            updated_trip = self._update_trip_status(trip)
            if updated_trip.status not in ["CONCLUÍDA", "CANCELADA"]:
                serializer = TripCurrentScreenSerializer(updated_trip)
                return Response(serializer.data)

        return Response({"detail": "Nenhuma viagem próxima."}, status=404)
