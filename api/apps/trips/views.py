from datetime import date, datetime, timedelta
from uuid import UUID

from django.contrib.auth import get_user_model
from django.db import transaction
from django.db.models import Q
from django.utils import timezone
from rest_framework import generics, permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.reservations.services import process_trip_punishments

User = get_user_model()

from ..reservations.models import Reservation
from ..reservations.serializers import ReservationSerializer
from ..reservations.services import (
    ACTIVE_RESERVATION_STATUSES,
    WAITLIST_STATUS,
    evict_lowest_priority_active_reservation,
    get_reservation_passenger_name,
    sync_trip_status,
    trip_has_capacity,
)
from ..users.permissions import (
    IsAdminOrReadOnly,
    IsDriver,
    IsDriverReadOnly,
)
from .filters import FilterTripViewSet
from .models import Bus, GuestPassenger, Route, Trip, TripRequest
from .serializers import (
    BusSerializer,
    GuestPassengerSerializer,
    RouteSerializer,
    TripCurrentScreenSerializer,
    TripSerializer,
    TripRequestSerializer,
)
import string
import random

def generate_access_code(length=8):
    letters_and_digits = string.ascii_uppercase + string.digits
    return ''.join(random.choice(letters_and_digits) for i in range(length))

class TripRequestViewSet(viewsets.ModelViewSet):
    queryset = TripRequest.objects.select_related("requester__user", "trip").all().order_by("-created_at")
    serializer_class = TripRequestSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if hasattr(user, "admin_profile") or user.is_staff:
            return TripRequest.objects.select_related("requester__user", "trip").all().order_by("-created_at")
        
        if hasattr(user, "civil_servant_profile"):
            return TripRequest.objects.select_related("requester__user", "trip").filter(requester=user.civil_servant_profile).order_by("-created_at")
        
        return TripRequest.objects.none()

    def perform_create(self, serializer):
        user = self.request.user
        if not hasattr(user, "civil_servant_profile"):
            raise PermissionDenied("Apenas servidores podem solicitar viagens.")
        
        serializer.save(requester=user.civil_servant_profile)

    @action(detail=True, methods=["post"], permission_classes=[permissions.IsAdminUser])
    @transaction.atomic
    def approve(self, request, pk=None):
        trip_request = self.get_object()
        
        if trip_request.status != "PENDENTE":
            return Response({"error": "Apenas solicitações pendentes podem ser aprovadas."}, status=status.HTTP_400_BAD_REQUEST)

        bus_id = request.data.get("bus_id")
        route_id = request.data.get("route_id")
        
        if not bus_id or not route_id:
            return Response({"error": "Aprovação exige bus_id e route_id."}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            bus = Bus.objects.get(id=bus_id)
            route = Route.objects.get(id=route_id)
        except (Bus.DoesNotExist, Route.DoesNotExist):
            return Response({"error": "Ônibus ou Rota não encontrados."}, status=status.HTTP_404_NOT_FOUND)
        
        # Create the private trip
        access_code = generate_access_code()
        
        trip = Trip.objects.create(
            trip_date=trip_request.departure_date,
            bus=bus,
            route=route,
            seating_capacity=bus.seating_capacity,
            is_private=True,
            access_code=access_code,
            manager=trip_request.requester,
            trip_request=trip_request
        )
        
        trip_request.status = "APROVADA"
        trip_request.save()
        
        return Response({"status": "Viagem aprovada e criada.", "access_code": access_code, "trip_id": trip.id}, status=status.HTTP_200_OK)

    @action(detail=True, methods=["post"], permission_classes=[permissions.IsAdminUser])
    def reject(self, request, pk=None):
        trip_request = self.get_object()
        
        if trip_request.status != "PENDENTE":
            return Response({"error": "Apenas solicitações pendentes podem ser recusadas."}, status=status.HTTP_400_BAD_REQUEST)
            
        feedback = request.data.get("feedback")
        if not feedback:
            return Response({"error": "Feedback é obrigatório para recusar."}, status=status.HTTP_400_BAD_REQUEST)
            
        trip_request.status = "RECUSADA"
        trip_request.feedback = feedback
        trip_request.save()
        
        return Response({"status": "Solicitação recusada com sucesso."}, status=status.HTTP_200_OK)


class PrivateTripDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        code = request.query_params.get("code")
        if not code:
            return Response({"error": "Código de acesso é obrigatório."}, status=status.HTTP_400_BAD_REQUEST)
            
        try:
            trip = Trip.objects.get(access_code=code, is_private=True)
            from apps.reservations.serializers import AvailableTripSerializer
            # Pass request context so serializers that depend on it work
            serializer = AvailableTripSerializer(trip, context={'request': request})
            return Response(serializer.data)
        except Trip.DoesNotExist:
            return Response({"error": "Viagem privada não encontrada ou código inválido."}, status=status.HTTP_404_NOT_FOUND)

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
        Trip.objects.filter(id=pk).update(
            status="CONCLUÍDA", arrival_timestamp=timezone.now()
        )

        return Response("trip concluída com sucesso", status.HTTP_200_OK)

    @action(detail=True, methods=["post"])
    def start_trip(
        self, request, pk=None
    ):  # CONTRIBUIÇÃO ENORME DE MATHEUS PRO BACKEND

        trip = self.get_object()

        Trip.objects.filter(id=pk).update(
            status="EM ANDAMENTO", departure_timestamp=timezone.now()
        )

        process_trip_punishments(trip)

        return Response("trip iniciada com sucesso", status.HTTP_200_OK)

    @action(detail=True, methods=["post"], url_path="check-in")
    @transaction.atomic
    def check_in(self, request, pk=None):
        passenger_identifier = (
            request.data.get("passenger_identifier")
            or request.data.get("user_id")
            or request.data.get("uuid")
        )

        if not passenger_identifier:
            return Response(
                {"error": "UUID do passageiro e obrigatorio."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            passenger_uuid = UUID(str(passenger_identifier))
        except (TypeError, ValueError):
            return Response(
                {"error": "QR Code invalido."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            trip = Trip.objects.select_related("driver").get(id=pk)
        except Trip.DoesNotExist:
            return Response(
                {"error": "Viagem nao encontrada."},
                status=status.HTTP_404_NOT_FOUND,
            )

        driver = request.user.driver_profile
        if trip.driver_id != driver.id:
            return Response(
                {"error": "Motorista nao autorizado para esta viagem."},
                status=status.HTTP_403_FORBIDDEN,
            )

        try:
            passenger = User.objects.get(
                id=passenger_uuid
            )  # trocar por uuid se for usar
        except User.DoesNotExist:
            try:
                passenger = GuestPassenger.objects.get(
                    id=passenger_uuid
                )  # trocar por uuid se for usar
            except GuestPassenger.DoesNotExist:
                return Response(
                    {"error": "QR Code invalido ou usuario inexistente."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        if isinstance(passenger, GuestPassenger):
            passenger_filter = Q(guest_passenger=passenger)
        else:
            passenger_filter = Q(student__user=passenger) | Q(
                civil_servant__user=passenger
            )

        reservation = (
            Reservation.objects
            .select_related("student__user", "civil_servant__user", "guest_passenger")
            .filter(
                passenger_filter,
                trip=trip,
                status__in=(*ACTIVE_RESERVATION_STATUSES, WAITLIST_STATUS),
            )
            .first()
        )

        if reservation is None:
            return Response(
                {"error": "Passageiro sem reserva nesta viagem."},
                status=status.HTTP_404_NOT_FOUND,
            )

        evicted_passenger = None
        priority_check_in = bool(
            reservation.civil_servant_id or reservation.guest_passenger_id
        )

        if reservation.status == WAITLIST_STATUS:
            if not priority_check_in:
                return Response(
                    {"error": "Passageiro sem reserva ativa nesta viagem."},
                    status=status.HTTP_404_NOT_FOUND,
                )

            if not trip_has_capacity(trip):
                evicted = evict_lowest_priority_active_reservation(trip)
                if evicted is None:
                    transaction.set_rollback(True)
                    return Response(
                        {
                            "error": "Nao ha vaga disponivel "
                            "para priorizar o passageiro."
                        },
                        status=status.HTTP_409_CONFLICT,
                    )

                evicted_passenger = {
                    "name": get_reservation_passenger_name(evicted),
                    "reservation_id": evicted.id,
                }

            reservation.status = "CONFIRMADA"

        if reservation.check_in:
            return Response(
                {
                    "error": "Passageiro ja fez check-in.",
                    "reservation_id": reservation.id,
                    "passenger_name": passenger.full_name,
                },
                status=status.HTTP_409_CONFLICT,
            )

        reservation.check_in = True
        reservation.checkin_date = timezone.now()
        reservation.save(update_fields=["status", "check_in", "checkin_date"])
        sync_trip_status(trip)

        response_payload = {
            "status": "Check-in realizado com sucesso.",
            "reservation_id": reservation.id,
            "passenger_name": passenger.full_name,
            "checkin_date": reservation.checkin_date,
        }
        if evicted_passenger is not None:
            response_payload["evicted_passenger"] = evicted_passenger
            response_payload["evicted_passengers"] = [evicted_passenger]

        return Response(
            response_payload,
            status=status.HTTP_200_OK,
        )

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
        # create a custom queryset in bus model to do it and reuse
        bus = Bus.objects.get(id=bus)
        if not bus:
            return Response(
                {"error": "Onibus não encontrado."}, status=status.HTTP_400_BAD_REQUEST
            )
        trip = Trip.objects.get(id=pk)

        if trip.driver and trip.driver == request.user.driver_profile:
            trip.bus = bus
            trip.capacity = bus.seating_capacity
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
            trip.capacity = 46
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
                civil_servant__isnull=False
            ).exists()

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

            base_running_query = Trip.objects.filter(
                user_trip_filter, status="EM ANDAMENTO", trip_date__gte=yesterday
            ).distinct()

            base_next_query = (
                Trip.objects
                .filter(user_trip_filter, trip_date__gte=today)
                .exclude(status__in=["CONCLUÍDA", "CANCELADA"])
                .distinct()
            )

        running_trips = base_running_query.order_by(
            "trip_date", "route__departure_time"
        )

        for trip in running_trips:
            updated_trip = self._update_trip_status(trip)
            if updated_trip.status == "EM ANDAMENTO":
                serializer = TripCurrentScreenSerializer(
                    updated_trip, context={"request": request}
                )
                return Response(serializer.data)

        next_trips = base_next_query.order_by("trip_date", "route__departure_time")

        for trip in next_trips:
            updated_trip = self._update_trip_status(trip)
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
        email = request.data.get("email")

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

        if not email:
            return Response(
                {"email": ["This field is required."]},
                status=status.HTTP_400_BAD_REQUEST,
            )

        passenger = GuestPassenger.objects.create(
            cpf=cpf,
            trip_id=trip_id,
            email=email,
            recorded_by=request.user.civil_servant_profile,
            full_name=request.data.get("full_name"),
        )

        trip = Trip.objects.get(id=trip_id)
        serializer = GuestPassengerSerializer(passenger)
        reservetionSerializer = ReservationSerializer()
        reservetionSerializer.reserveToGuest(passenger, trip)
        sync_trip_status(trip)
        return Response({"passenger": serializer.data}, status=status.HTTP_201_CREATED)
