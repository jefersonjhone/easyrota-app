from datetime import date, timedelta

from django.contrib.auth import get_user_model
from django.db import transaction
from django.db.models import Q
from django.utils import timezone
from rest_framework import generics, permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied
from rest_framework.response import Response
from rest_framework.views import APIView

from ..reservations.serializers import ReservationSerializer
from ..reservations.services import sync_trip_status
from ..users.permissions import (
    IsAdminOrReadOnly,
    IsDriver,
    IsDriverReadOnly,
)
from .filters import FilterTripViewSet
from .models import Bus, GuestPassenger, Route, Trip
from .serializers import (
    BusSerializer,
    GuestPassengerSerializer,
    RouteSerializer,
    TripCurrentScreenSerializer,
    TripSerializer,
)
from .services import CheckinService, TripService, TripStatusService

User = get_user_model()


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

    def create(self, request, *args, **kwargs):
        trip_date = request.data.get("trip_date")
        if trip_date:
            try:
                parsed_trip_date = date.fromisoformat(trip_date)
            except ValueError:
                parsed_trip_date = None

            if parsed_trip_date and parsed_trip_date < timezone.localtime().date():
                return Response(
                    {"trip_date": ["A data da viagem não pode estar no passado."]},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        return super().create(request, *args, **kwargs)

    @action(detail=True, methods=["post"])
    def finish_trip(self, request, pk=None):
        trip = self.get_object()
        TripService.finish_trip(trip)
        return Response("trip concluída com sucesso", status.HTTP_200_OK)

    @action(detail=True, methods=["post"])
    def start_trip(self, request, pk=None):
        trip = self.get_object()
        TripService.start_trip(trip)
        return Response("trip iniciada com sucesso", status.HTTP_200_OK)

    @action(detail=True, methods=["post"], url_path="check-in")
    @transaction.atomic
    def check_in(self, request, pk=None):
        passenger_identifier = (
            request.data.get("passenger_identifier")
            or request.data.get("user_id")
            or request.data.get("uuid")
        )

        try:
            payload = CheckinService.perform(
                trip_id=int(pk),
                passenger_identifier=passenger_identifier,
                driver=request.user.driver_profile,
            )
            return Response(payload, status=status.HTTP_200_OK)
        except CheckinService.Error as exc:
            status_code = exc.status_code
            if status_code == 409:
                transaction.set_rollback(True)
            return Response(
                {"error": exc.detail},
                status=status_code,
            )

    @action(detail=True, methods=["post"])
    def assign_driver(self, request, pk=None):
        driver = request.user.driver_profile
        trip = Trip.objects.get(id=pk)

        if not TripService.can_assign_driver(trip, driver):
            return Response(
                {"error": "Você não é o motorista desta viagem."},
                status=status.HTTP_403_FORBIDDEN,
            )

        TripService.assign_driver(trip, driver)
        return Response(
            {"status": "Motorista associado com sucesso."}, status=status.HTTP_200_OK
        )

    @action(detail=True, methods=["post"])
    def unassign_driver(self, request, pk=None):
        trip = Trip.objects.get(id=pk)
        driver = request.user.driver_profile

        if not TripService.can_unassign_driver(trip, driver):
            return Response(
                {"error": "Você não é o motorista desta viagem."},
                status=status.HTTP_403_FORBIDDEN,
            )

        TripService.unassign_driver(trip)
        return Response(
            {"status": "Motorista desassociado com sucesso."},
            status=status.HTTP_200_OK,
        )

    @action(detail=True, methods=["post"])
    def assign_bus(self, request, pk=None):
        bus_id = request.data.get("bus")
        if not bus_id:
            return Response(
                {"error": "O campo 'bus' é obrigatório."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        bus = Bus.objects.get(id=bus_id)
        trip = Trip.objects.get(id=pk)
        driver = request.user.driver_profile

        if not TripService.can_assign_bus(trip, driver):
            return Response(
                {"error": "Você não é o motorista desta viagem."},
                status=status.HTTP_403_FORBIDDEN,
            )

        TripService.assign_bus(trip, bus)
        return Response(
            {"status": "Onibus associado com sucesso."}, status=status.HTTP_200_OK
        )

    @action(detail=True, methods=["post"])
    def unassign_bus(self, request, pk=None):
        trip = Trip.objects.get(id=pk)
        driver = request.user.driver_profile

        if not TripService.can_assign_bus(trip, driver):
            return Response(
                {"error": "Você não é o motorista desta viagem."},
                status=status.HTTP_403_FORBIDDEN,
            )

        TripService.unassign_bus(trip)
        return Response(
            {"status": "Onibus desassociado com sucesso."},
            status=status.HTTP_200_OK,
        )

    def get_queryset(self):
        return Trip.objects.joinable_by_driver(self.request.user)

    def get_permissions(self):
        if self.action in ["list", "retrieve"]:
            self.permission_classes = [permissions.IsAuthenticated]
        elif self.action in [
            "finish_trip",
            "start_trip",
            "check_in",
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

    def get(self, request):
        now = timezone.localtime()
        today = now.date()
        yesterday = today - timedelta(days=1)

        is_admin = hasattr(request.user, "admin_profile") or request.user.is_staff

        if is_admin:
            base_running_query = Trip.objects.running().by_date_gte(yesterday)
            base_next_query = Trip.objects.upcoming().by_date_gte(today)
        else:
            valid_statuses = ["CONFIRMADA", "LISTA SECUNDÁRIA", "PENDENTE"]

            user_trip_filter = (
                Q(
                    reservation__student__user=request.user,
                    reservation__status__in=valid_statuses,
                )
                | Q(
                    reservation__civil_servant__user=request.user,
                    reservation__status__in=valid_statuses,
                )
                | Q(driver__user=request.user)
            )

            base_running_query = (
                Trip.objects.filter(user_trip_filter)
                .running()
                .by_date_gte(yesterday)
                .distinct()
            )

            base_next_query = (
                Trip.objects.filter(user_trip_filter)
                .upcoming()
                .by_date_gte(today)
                .distinct()
            )

        running_trips = base_running_query.order_by(
            "trip_date", "route__departure_time"
        )

        for trip in running_trips:
            updated_trip = TripStatusService.compute_status(trip)
            if updated_trip.status == "EM ANDAMENTO":
                serializer = TripCurrentScreenSerializer(
                    updated_trip, context={"request": request}
                )
                return Response(serializer.data)

        next_trips = base_next_query.order_by("trip_date", "route__departure_time")

        for trip in next_trips:
            updated_trip = TripStatusService.compute_status(trip)
            if updated_trip.status not in ["CONCLUÍDA", "CANCELADA"]:
                serializer = TripCurrentScreenSerializer(
                    updated_trip, context={"request": request}
                )
                return Response(serializer.data)

        return Response({"detail": "Nenhuma viagem próxima."}, status=404)


class GuestPassengerView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = GuestPassengerSerializer

    def post(self, request):
        trip_id = request.data.get("trip")
        cpf = request.data.get("cpf")
        if not trip_id:
            return Response(
                {"trip": ["This field is required."]},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not cpf:
            return Response(
                {"cpf": ["This field is required."]},
                status=status.HTTP_400_BAD_REQUEST,
            )

        passenger = GuestPassenger.objects.create(
            cpf=cpf,
            trip_id=trip_id,
            recorded_by=request.user.civil_servant_profile,
            full_name=request.data.get("full_name"),
        )

        trip = Trip.objects.get(id=trip_id)
        serializer = GuestPassengerSerializer(passenger)
        reservetionSerializer = ReservationSerializer()
        reservetionSerializer.reserveToGuest(passenger, trip)
        sync_trip_status(trip)
        return Response({"passenger": serializer.data}, status=status.HTTP_201_CREATED)
