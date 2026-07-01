import random
import string
from datetime import date, timedelta

from django.conf import settings
from django.db import transaction
from django.db.models import Q
from django.utils import timezone
from rest_framework import generics, permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.reservations.models import Reservation
from apps.reservations.services.reservation_service import ReservationService
from apps.trips.services.trip_status_service import TripStatusService
from apps.users.models.profiles import DriverProfile
from apps.users.permissions import (
    IsAdminOrReadOnly,
    IsDriver,
    IsDriverReadOnly,
)
from apps.users.views.auth import send_qr_code_email

from .filters import FilterTripViewSet
from .models import Bus, GuestPassenger, Route, Trip, TripRequest
from .serializers import (
    AdminTripDetailSerializer,
    AvailableTripSerializer,
    BusSerializer,
    GuestHistorySerializer,
    GuestPassengerSerializer,
    RouteSerializer,
    TripCurrentScreenSerializer,
    TripRequestSerializer,
    TripSerializer,
)
from .services.checkin_service import CheckinService
from .services.trip_service import (
    MAX_RECURRING_DAYS,
    MAX_RECURRING_MONTHS,
    TripService,
    export_trip_passengers,
)


def generate_access_code(length=8):
    letters_and_digits = string.ascii_uppercase + string.digits
    return "".join(random.choice(letters_and_digits) for i in range(length))


def get_frontend_base_url():
    configured_url = getattr(settings, "FRONTEND_BASE_URL", None)
    if configured_url:
        return configured_url.rstrip("/") + "/"

    if settings.DEBUG:
        return "http://localhost:5173/"

    return "https://easyrota-app.vercel.app/"


def build_guest_qr_code_link(guest):
    return f"{get_frontend_base_url()}app/viagens/convidados/{guest.id}"


class TripRequestViewSet(viewsets.ModelViewSet):
    queryset = (
        TripRequest.objects
        .select_related("requester__user", "trip")
        .all()
        .order_by("-created_at")
    )
    serializer_class = TripRequestSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if hasattr(user, "admin_profile") or user.is_staff:
            return (
                TripRequest.objects
                .select_related("requester__user", "trip")
                .all()
                .order_by("-created_at")
            )

        if hasattr(user, "civil_servant_profile"):
            return (
                TripRequest.objects
                .select_related("requester__user", "trip")
                .filter(requester=user.civil_servant_profile)
                .order_by("-created_at")
            )

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
            return Response(
                {"error": "Apenas solicitações pendentes podem ser aprovadas."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        bus_id = request.data.get("bus_id")
        route_id = request.data.get("route_id")

        if not bus_id or not route_id:
            return Response(
                {"error": "Aprovação exige bus_id e route_id."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            bus = Bus.objects.get(id=bus_id)
            route = Route.objects.get(id=route_id)
        except (Bus.DoesNotExist, Route.DoesNotExist):
            return Response(
                {"error": "Ônibus ou Rota não encontrados."},
                status=status.HTTP_404_NOT_FOUND,
            )

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
            trip_request=trip_request,
        )

        trip_request.status = "APROVADA"
        trip_request.save()

        return Response(
            {
                "status": "Viagem aprovada e criada.",
                "access_code": access_code,
                "trip_id": trip.id,
            },
            status=status.HTTP_200_OK,
        )

    @action(detail=True, methods=["post"], permission_classes=[permissions.IsAdminUser])
    def reject(self, request, pk=None):
        trip_request = self.get_object()

        if trip_request.status != "PENDENTE":
            return Response(
                {"error": "Apenas solicitações pendentes podem ser recusadas."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        feedback = request.data.get("feedback")
        if not feedback:
            return Response(
                {"error": "Feedback é obrigatório para recusar."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        trip_request.status = "RECUSADA"
        trip_request.feedback = feedback
        trip_request.save()

        return Response(
            {"status": "Solicitação recusada com sucesso."}, status=status.HTTP_200_OK
        )


class PrivateTripDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        code = request.query_params.get("code")
        if not code:
            return Response(
                {"error": "Código de acesso é obrigatório."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            trip = Trip.objects.get(access_code=code, is_private=True)
            from apps.reservations.serializers import AvailableTripSerializer

            # Pass request context so serializers that depend on it work
            serializer = AvailableTripSerializer(trip, context={"request": request})
            return Response(serializer.data)
        except Trip.DoesNotExist:
            return Response(
                {"error": "Viagem privada não encontrada ou código inválido."},
                status=status.HTTP_404_NOT_FOUND,
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
        profile = getattr(self.request.user, "admin_profile", None)
        if not profile:
            raise PermissionDenied("Usuário não é administrador")
        serializer.save(administrator=profile)

    @action(detail=True, methods=["get"])
    def admin_detail(self, request, pk=None):
        bus = self.get_object()
        from .serializers import BusAdminDetailSerializer

        serializer = BusAdminDetailSerializer(bus, context={"request": request})
        return Response(serializer.data)


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
    queryset = Trip.objects.all().order_by("trip_date", "route__departure_time")
    serializer_class = TripSerializer
    filter_backends = [FilterTripViewSet]

    def get_queryset(self):
        if self.action == 'retrieve':
            if hasattr(self.request.user, "admin_profile"):
                return Trip.objects.all()
            elif hasattr(self.request.user, "driver_profile"):
                return Trip.objects.filter(driver=self.request.user.driver_profile)
            elif hasattr(self.request.user, "student_profile") or hasattr(
                self.request.user, "civil_servant_profile"):
                return Trip.objects.joinable_by_user(self.request.user)
            return Trip.objects.none()

        if hasattr(self.request.user, "admin_profile"):
            return Trip.objects.all().order_by("trip_date", "route__departure_time")
        elif hasattr(self.request.user, "driver_profile"):
            return Trip.objects.joinable_by_driver(self.request.user)
        elif hasattr(self.request.user, "student_profile") or hasattr(
            self.request.user, "civil_servant_profile"
        ):
            return Trip.objects.joinable_by_user(self.request.user)

        return Trip.objects.none()

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        if hasattr(request.user, "admin_profile"):
            serializer = self.serializer_class
        elif hasattr(request.user, "driver_profile"):
            serializer = self.serializer_class
        else:
            serializer = AvailableTripSerializer

        serializer = serializer(queryset, many=True, context={"request": request})
        return Response(serializer.data)

    def retrieve(self, request, *args, **kwargs):
        if hasattr(request.user, "admin_profile"):
            serializer = self.serializer_class
        elif hasattr(request.user, "driver_profile"):
            serializer = self.serializer_class
        else:
            serializer = AvailableTripSerializer
        serializer = serializer(self.get_object(), context={"request": request})
        return Response(serializer.data)

    def create(self, request, *args, **kwargs):
        if request.data.get("recurring"):
            weekdays = request.data.get("weekdays", [])
            date_start = request.data.get("date_start")
            date_end = request.data.get("date_end")
            route_id = request.data.get("route")
            status_val = request.data.get("status", "CONFIRMADA")

            if not weekdays:
                return Response(
                    {"weekdays": ["Selecione pelo menos um dia da semana."]},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            if not date_start or not date_end:
                return Response(
                    {"date": ["Informe a data de início e fim."]},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            try:
                date_start_parsed = date.fromisoformat(date_start)
                date_end_parsed = date.fromisoformat(date_end)
            except (TypeError, ValueError):
                return Response(
                    {"date": ["Formato de data inválido."]},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            if date_start_parsed > date_end_parsed:
                return Response(
                    {"date": ["Data início não pode ser posterior à data fim."]},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            if (date_end_parsed - date_start_parsed).days > MAX_RECURRING_DAYS:
                return Response(
                    {
                        "date": [
                            f"O intervalo não pode exceder"
                            f" {MAX_RECURRING_MONTHS} meses."
                        ]
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            try:
                route = Route.objects.get(id=route_id)
            except Route.DoesNotExist:
                return Response(
                    {"route": ["Rota não encontrada."]},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # Converte JS weekday (0=Dom…6=Sáb) → Python weekday (0=Seg…6=Dom)
            py_weekdays = [(wd - 1) % 7 for wd in weekdays]
            TripService.create_recurring_trips(
                date_start=date_start_parsed,
                date_end=date_end_parsed,
                weekdays=py_weekdays,
                route=route,
                status=status_val,
            )
            return Response(
                {"detail": "Viagens recorrentes criadas com sucesso."},
                status=status.HTTP_201_CREATED,
            )

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
    def start_checkin(self, request, pk=None):
        trip = self.get_object()
        TripService.start_checkin(trip)

        from apps.notifications.services.notification_service import NotificationService

        NotificationService.notify_trip_users(
            trip,
            {
                "head": "Check-in iniciado",
                "body": (
                    f"O motorista iniciou o check-in para a viagem "
                    f"de {trip.route.origin} para {trip.route.destiny}."
                ),
                "url": f"/app/driver/viagem/{trip.id}",
            },
        )
        NotificationService.notify_route_admin(
            trip,
            {
                "head": "Check-in iniciado",
                "body": (
                    f"O motorista iniciou o check-in para a viagem "
                    f"de {trip.route.origin} para {trip.route.destiny}."
                ),
                "url": f"/app/admin/viagem/{trip.id}",
            },
        )

        serializer = TripSerializer(trip, context={"request": request})
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(detail=True, methods=["post"])
    def finish_trip(self, request, pk=None):
        trip = self.get_object()
        if trip.driver != request.user.driver_profile:
            return Response(
                {"error": "Você não é o motorista desta viagem."},
                status=status.HTTP_403_FORBIDDEN,
            )
        TripService.finish_trip(trip)
        return Response("trip concluída com sucesso", status.HTTP_200_OK)

    @action(detail=True, methods=["post"])
    def start_trip(self, request, pk=None):
        trip = self.get_object()
        TripService.start_trip(trip)
        return Response("trip iniciada com sucesso", status.HTTP_200_OK)

    @action(detail=True, methods=["get"])
    def reservations(self, request, pk=None):
        trip = self.get_object()
        reservations = (
            Reservation.objects
            .with_passenger_details()
            .for_trip(trip)
            .order_by("status", "checkin_date", "id")
        )

        data = []
        for res in reservations:
            passenger_name = "Passageiro"
            kind = None

            if res.student_id:
                print(res.student_id)
                passenger_name = res.student.user.full_name
                kind = "Aluno"
            elif res.civil_servant_id:
                passenger_name = res.civil_servant.user.full_name
                kind = "Servidor"
            elif res.guest_passenger_id:
                passenger_name = res.guest_passenger.full_name or "Convidado"
                kind = "Convidado"

            data.append({
                "id": res.id,
                "passenger_name": passenger_name,
                "kind": kind,
                "status": res.status,
                "check_in": res.check_in,
                "checkin_date": res.checkin_date,
                "created_at": res.created_at,
            })

        return Response(data)

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
                trip_id=pk,
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

        if trip.driver == driver and trip.status == "EM ANDAMENTO":
            return Response(
                {
                    "error": (
                        "Não é possível desassociar o motorista de"
                        " uma viagem em andamento."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

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

    @action(detail=True, methods=["get"], permission_classes=[permissions.IsAdminUser])
    def admin_detail(self, request, pk=None):
        trip = self.get_object()
        serializer = AdminTripDetailSerializer(trip)
        return Response(serializer.data)

    @action(detail=True, methods=["get"], permission_classes=[permissions.IsAdminUser])
    def export_passengers(self, request, pk=None):
        trip = self.get_object()
        fmt = request.query_params.get("format", "csv")
        return export_trip_passengers(trip, fmt)

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

        if not TripService.can_unassign_bus(trip, driver):
            return Response(
                {"error": "Você não é o motorista desta viagem."},
                status=status.HTTP_403_FORBIDDEN,
            )

        TripService.unassign_bus(trip)
        return Response(
            {"status": "Onibus desassociado com sucesso."},
            status=status.HTTP_200_OK,
        )

    @action(detail=True, methods=["post"], permission_classes=[permissions.IsAdminUser])
    def admin_assign_driver(self, request, pk=None):
        driver_id = request.data.get("driver_id")
        if not driver_id:
            return Response(
                {"error": "O campo 'driver_id' é obrigatório."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            driver = DriverProfile.objects.get(id=driver_id)
        except DriverProfile.DoesNotExist:
            return Response(
                {"error": "Motorista não encontrado."},
                status=status.HTTP_404_NOT_FOUND,
            )
        trip = self.get_object()
        if trip.status in ["EM ANDAMENTO", "CANCELADA"]:
            return Response(
                {
                    "error": (
                        "Não é possível alterar o motorista de"
                        " uma viagem em andamento ou cancelada."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )
        trip.driver = driver
        trip.save()
        return Response({"status": "Motorista atribuído com sucesso."})

    @action(detail=True, methods=["post"], permission_classes=[permissions.IsAdminUser])
    def admin_unassign_driver(self, request, pk=None):
        trip = self.get_object()
        if trip.status in ["EM ANDAMENTO", "CANCELADA"]:
            return Response(
                {
                    "error": (
                        "Não é possível remover o motorista de"
                        " uma viagem em andamento ou cancelada."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )
        trip.driver = None
        trip.save()
        return Response({"status": "Motorista removido com sucesso."})

    @action(detail=True, methods=["post"], permission_classes=[permissions.IsAdminUser])
    def admin_assign_bus(self, request, pk=None):
        bus_id = request.data.get("bus_id")
        if not bus_id:
            return Response(
                {"error": "O campo 'bus_id' é obrigatório."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            bus = Bus.objects.get(id=bus_id)
        except Bus.DoesNotExist:
            return Response(
                {"error": "Ônibus não encontrado."},
                status=status.HTTP_404_NOT_FOUND,
            )
        trip = self.get_object()
        if trip.status in ["EM ANDAMENTO", "CANCELADA"]:
            return Response(
                {
                    "error": (
                        "Não é possível alterar o ônibus de"
                        " uma viagem em andamento ou cancelada."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )
        trip.bus = bus
        trip.seating_capacity = bus.seating_capacity
        trip.save()
        return Response({"status": "Ônibus atribuído com sucesso."})

    @action(detail=True, methods=["post"], permission_classes=[permissions.IsAdminUser])
    def admin_unassign_bus(self, request, pk=None):
        trip = self.get_object()
        if trip.status in ["EM ANDAMENTO", "CANCELADA"]:
            return Response(
                {
                    "error": (
                        "Não é possível remover o ônibus de"
                        " uma viagem em andamento ou cancelada."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )
        trip.bus = None
        trip.save()
        return Response({"status": "Ônibus removido com sucesso."})

    @action(detail=False, methods=["post"], url_path="bulk-delete")
    def bulk_delete(self, request):
        ids = request.data.get("ids", [])
        if not ids or not isinstance(ids, list):
            return Response(
                {"detail": "Lista de IDs inválida."}, status=status.HTTP_400_BAD_REQUEST
            )
        deleted, _ = Trip.objects.filter(id__in=ids).delete()
        return Response({"deleted": deleted}, status=status.HTTP_200_OK)

    def get_permissions(self):
        if self.action in ["list", "retrieve"]:
            self.permission_classes = [permissions.IsAuthenticated]
        elif self.action in [
            "finish_trip",
            "start_trip",
            "start_checkin",
            "check_in",
            "assign_bus",
            "unassign_bus",
            "assign_driver",
            "unassign_driver",
            "unassign_driver",
        ]:
            self.permission_classes = [IsDriver]
        elif self.action in [
            "admin_assign_driver",
            "admin_unassign_driver",
            "admin_assign_bus",
            "admin_unassign_bus",
        ]:
            self.permission_classes = [permissions.IsAdminUser]
        elif self.action == "reservations":
            self.permission_classes = [IsDriver | permissions.IsAdminUser]
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
                Trip.objects
                .filter(user_trip_filter)
                .running()
                .by_date_gte(yesterday)
                .distinct()
            )

            base_next_query = (
                Trip.objects
                .filter(user_trip_filter)
                .upcoming()
                .by_date_gte(today)
                .distinct()
            )

        running_trips = base_running_query.order_by(
            "trip_date", "route__departure_time"
        )

        for trip1 in running_trips:
            updated_trip = TripStatusService.compute_status(trip1)
            if updated_trip.status == "EM ANDAMENTO":
                serializer = TripCurrentScreenSerializer(
                    updated_trip, context={"request": request}
                )
                return Response(serializer.data)

        next_trips = base_next_query.order_by("trip_date", "route__departure_time")

        for trip2 in next_trips:
            updated_trip = TripStatusService.compute_status(trip2)
            if updated_trip.status not in ["CONCLUÍDA", "CANCELADA"]:
                serializer = TripCurrentScreenSerializer(
                    updated_trip, context={"request": request}
                )
                return Response(serializer.data)

        return Response({"detail": "Nenhuma viagem próxima."}, status=404)


class GuestPassengerView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = GuestPassengerSerializer
    # queryset = GuestPassenger.objects.all()

    @transaction.atomic
    def post(self, request):
        if not hasattr(request.user, "civil_servant_profile"):
            return Response(
                {"detail": "Apenas servidores podem adicionar convidados."},
                status=status.HTTP_403_FORBIDDEN,
            )

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

        try:
            trip = Trip.objects.get(id=trip_id)
        except Trip.DoesNotExist:
            return Response(
                {"trip": ["Viagem nao encontrada."]},
                status=status.HTTP_404_NOT_FOUND,
            )

        passenger = GuestPassenger.objects.create(
            cpf=cpf,
            trip=trip,
            email=email,
            recorded_by=request.user.civil_servant_profile,
            full_name=request.data.get("full_name"),
        )

        ReservationService.create_for_guest(passenger, trip)
        transaction.on_commit(
            lambda: send_qr_code_email(email, build_guest_qr_code_link(passenger))
        )

        serializer = GuestPassengerSerializer(passenger)
        TripStatusService.sync_trip_status(trip)
        return Response({"passenger": serializer.data}, status=status.HTTP_201_CREATED)


class GuestHistoryView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        if not hasattr(request.user, "civil_servant_profile"):
            return Response(
                {"detail": "Apenas servidores podem acessar o histórico."},
                status=status.HTTP_403_FORBIDDEN,
            )

        guests = (
            GuestPassenger.objects
            .filter(recorded_by=request.user.civil_servant_profile)
            .select_related("trip__route")
            .order_by("-trip__trip_date")
        )

        serializer = GuestHistorySerializer(guests, many=True)
        return Response(serializer.data)


class GuestPassengerDetailView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request, guest_id):
        try:
            guest = GuestPassenger.objects.get(id=guest_id)
            serializer = GuestPassengerSerializer(guest)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except GuestPassenger.DoesNotExist:
            return Response(
                {"error": "Convidado não encontrado"}, status=status.HTTP_404_NOT_FOUND
            )
