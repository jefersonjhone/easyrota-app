import csv
import logging
from datetime import datetime, timedelta

from django.db import transaction
from django.http import HttpResponse
from django.utils import timezone

from apps.notifications.services.notification_service import NotificationService
from apps.reservations.models import Reservation
from apps.trips.models import Bus, Trip, TripPassenger

logger = logging.getLogger("api")


MAX_RECURRING_MONTHS = 3
MAX_RECURRING_DAYS = MAX_RECURRING_MONTHS * 31
RESERVATION_LIMIT_MINUTES = 30
RESERVATION_LIMIT_DAYS = 30
QUORUM_MIN_SERVERS = 1
ACTIVE_RESERVATION_STATUSES = ("CONFIRMADA", "PENDENTE")


class TripService:
    """Core trip business logic: lifecycle, assignment, capacity, validation."""

    # ------------------------------------------------------------------
    # Lifecycle
    # ------------------------------------------------------------------

    @transaction.atomic
    @staticmethod
    def create_recurring_trips(date_start, date_end, weekdays, route, status):
        trips = []
        current = date_start
        while current <= date_end:
            if current.weekday() in weekdays:
                trips.append(Trip(trip_date=current, route=route, status=status))
            current += timedelta(days=1)
        return Trip.objects.bulk_create(trips)

    @staticmethod
    def start_trip(trip):
        """Mark a trip as in-progress and record the departure timestamp."""

        if trip.departure_timestamp:
            return

        dep = TripService._departure_datetime(trip)
        if timezone.now() < dep:
            from rest_framework import serializers

            raise serializers.ValidationError(
                "Viagem não pode ser iniciada antes do horário de partida."
            )

        Trip.objects.filter(id=trip.id).update(
            status="EM ANDAMENTO",
            departure_timestamp=timezone.now(),
        )
        NotificationService.notify_trip_users(trip, {"message": "A viagem começou!"})

    @staticmethod
    def finish_trip(trip):
        """Mark a trip as concluded and record the arrival timestamp.
        Only allowed up to 30 min before the scheduled arrival time.
        """
        arr = TripService._arrival_datetime(trip)
        if timezone.now() < arr - timedelta(minutes=30):
            from rest_framework import serializers

            msg = (
                "Viagem só pode ser finalizada a partir de"
                " 30 minutos antes do horário previsto de término."
            )
            raise serializers.ValidationError(msg)

        from apps.reservations.services.punishment_service import (
            process_trip_punishments,
        )

        Trip.objects.filter(id=trip.id).update(
            status="CONCLUÍDA",
            arrival_timestamp=timezone.now(),
        )
        process_trip_punishments(trip)

    @staticmethod
    def start_checkin(trip):
        """Open check-in for the trip. Only allowed up to 30 min before departure."""
        dep = TripService._departure_datetime(trip)
        if timezone.now() < dep - timedelta(minutes=30):
            from rest_framework import serializers

            msg = (
                "Check-in só pode ser iniciado a partir de"
                " 30 minutos antes do horário de partida."
            )
            raise serializers.ValidationError(msg)

        trip.checkin_started = timezone.now()
        trip.save(update_fields=["checkin_started"])
        NotificationService.notify_trip_users(
            trip,
            {
                "message": (
                    f"o check-in para a viagem {trip.origin}"
                    f" - {trip.destination} foi iniciado!"
                )
            },
        )

    # ------------------------------------------------------------------
    # Driver assignment
    # ------------------------------------------------------------------

    @staticmethod
    def assign_driver(trip, driver):
        """Associate a driver profile with the trip."""
        trip.driver = driver
        trip.save()

    @staticmethod
    def unassign_driver(trip):
        """Remove driver association from the trip."""
        trip.driver = None
        trip.save()

    @staticmethod
    def can_assign_driver(trip, driver):
        """Check whether the given driver can be assigned."""
        return trip.driver is None or trip.driver == driver

    @staticmethod
    def can_unassign_driver(trip, driver):
        """Check whether the given driver can unassign from the trip."""
        return trip.driver and trip.driver == driver

    # ------------------------------------------------------------------
    # Bus assignment
    # ------------------------------------------------------------------

    @staticmethod
    def assign_bus(trip, bus):
        """Associate a bus with the trip and update seating capacity."""
        trip.bus = bus
        trip.seating_capacity = bus.seating_capacity
        trip.save()

    @staticmethod
    def unassign_bus(trip):
        """Remove bus association and reset to default capacity."""
        trip.bus = None
        trip.seating_capacity = 46
        trip.save()

    @staticmethod
    def can_assign_bus(trip, driver):
        """Check whether the driver can assign a bus to this trip."""
        return trip.driver and trip.driver == driver

    @staticmethod
    def can_unassign_bus(trip, driver):
        """Check whether the driver can unassign a bus from this trip."""
        return trip.driver and trip.driver == driver

    # ------------------------------------------------------------------
    # Capacity & quorum
    # ------------------------------------------------------------------

    @staticmethod
    def _departure_datetime(trip):
        """Compute the aware departure datetime from trip_date and route."""
        time_zone = timezone.get_current_timezone()
        return timezone.make_aware(
            datetime.combine(trip.trip_date, trip.route.departure_time),
            time_zone,
        )

    @staticmethod
    def _arrival_datetime(trip):
        """Compute the aware arrival datetime, handling overnight trips."""
        time_zone = timezone.get_current_timezone()
        arr = timezone.make_aware(
            datetime.combine(trip.trip_date, trip.route.arrival_time),
            time_zone,
        )
        dep = TripService._departure_datetime(trip)
        if arr <= dep:
            arr += timedelta(days=1)
        return arr

    @staticmethod
    def reservation_cutoff(trip):
        """Datetime after which reservations are no longer accepted."""
        return TripService._departure_datetime(trip) - timedelta(
            minutes=RESERVATION_LIMIT_MINUTES
        )

    @staticmethod
    def is_reservation_open(trip):
        """Check if reservations are still open for this trip."""
        if trip.status == "CANCELADA":
            return False
        return timezone.now() < TripService.reservation_cutoff(trip)

    @staticmethod
    def _get_active_reservations_queryset(trip):
        return Reservation.objects.filter(
            trip=trip, status__in=ACTIVE_RESERVATION_STATUSES
        )

    @staticmethod
    def get_trip_occupancy(trip):
        """Return (total_passengers, server_count) for the trip."""
        active = TripService._get_active_reservations_queryset(trip)
        total = active.count() + trip.trip_passengers.count()
        servers = (
            active.filter(civil_servant__isnull=False).count()
            + trip.trip_passengers.filter(
                passenger_type=TripPassenger.PassengerType.LOCAL_SERVER
            ).count()
        )
        return total, servers

    @staticmethod
    def trip_has_capacity(trip):
        """Check if there's at least one free seat."""
        if not trip.bus:
            return True
        occupied = (
            TripService._get_active_reservations_queryset(trip).count()
            + trip.trip_passengers.count()
        )
        return occupied < trip.bus.seating_capacity

    @staticmethod
    def has_available_bus(trip_date, route):
        """
        Checks if there is at least one active bus in the fleet that is not
        allocated to a trip during the specified trip_date and route time.
        """
        from datetime import datetime, timedelta

        from django.utils import timezone
    
        from apps.trips.models import Bus, Trip

        active_buses = Bus.objects.filter(status="ATIVO")
        if not active_buses.exists():
            return False
    
        # Define a generous date range to find potentially overlapping trips
        date_range = [
            trip_date - timedelta(days=1),
            trip_date,
            trip_date + timedelta(days=1),
        ]
        overlapping_trips = Trip.objects.filter(trip_date__in=date_range).exclude(
            bus__isnull=True
        )
    
        tz = timezone.get_current_timezone()
        new_start = timezone.make_aware(
            datetime.combine(trip_date, route.departure_time), tz
        )
        new_end = timezone.make_aware(datetime.combine(trip_date, route.arrival_time), 
                                      tz)
    
        if new_end <= new_start:
            new_end += timedelta(days=1)
    
        busy_bus_ids = set()
        for existing_trip in overlapping_trips:
            ex_start = timezone.make_aware(
                datetime.combine(
                    existing_trip.trip_date, existing_trip.route.departure_time
                ),
                tz,
            )
            ex_end = timezone.make_aware(
                datetime.combine(existing_trip.trip_date, 
                                 existing_trip.route.arrival_time),
                tz,
            )
    
            if ex_end <= ex_start:
                ex_end += timedelta(days=1)
    
            # Check for time intersection
            if new_start < ex_end and new_end > ex_start:
                busy_bus_ids.add(existing_trip.bus_id)
    
        # If there is any active bus that is not in the set of busy buses, return True
        return active_buses.exclude(id__in=busy_bus_ids).exists()    

    @staticmethod
    def trip_has_quorum(trip):
        """Check if the minimum number of servers is met."""
        return trip.has_minimum_quorum

    # ------------------------------------------------------------------
    # Validation (from TripSerializer)
    # ------------------------------------------------------------------

    @staticmethod
    def validate_trip(data, instance=None):
        """
        Business rule validation for trip data.
        Raises ValidationError from rest_framework.serializers on failure.
        Returns the (possibly modified) data dict on success.
        """
        from rest_framework import serializers

        bus = data.get("bus", instance.bus if instance else None)
        trip_date = data.get("trip_date", instance.trip_date if instance else None)
        route = data.get("route", instance.route if instance else None)
        status_value = data.get("status", instance.status if instance else None)

        now = timezone.localtime()
        tz = timezone.get_current_timezone()

        # --- date in the past ---
        if trip_date and trip_date < now.date():
            raise serializers.ValidationError({
                "trip_date": "A data da viagem não pode estar no passado."
            })

        if status_value == "EM ANDAMENTO" and trip_date and trip_date < now.date():
            raise serializers.ValidationError({
                "trip_date": "A data da viagem não pode estar no passado."
            })

        # --- grace period for new / changed trips ---
        if trip_date and route:
            expected_dep = timezone.make_aware(
                datetime.combine(trip_date, route.departure_time), tz
            )

            is_new = instance is None
            date_changed = instance and instance.trip_date != trip_date
            route_changed = instance and instance.route != route

            if is_new or date_changed or route_changed:
                grace_limit = expected_dep + timedelta(hours=1)
                if now > grace_limit:
                    raise serializers.ValidationError({
                        "trip_date": "A data da viagem não pode estar no passado."
                    })

        # --- starting trip validation ---
        if status_value == "EM ANDAMENTO":
            if trip_date == now.date() and route:
                expected_dep = timezone.make_aware(
                    datetime.combine(trip_date, route.departure_time), tz
                )
                if now < expected_dep - timedelta(minutes=30):
                    raise serializers.ValidationError({
                        "status": "Muito cedo para iniciar a viagem. "
                        "O horário previsto é {}.".format(
                            route.departure_time.strftime("%H:%M")
                        )
                    })
            elif trip_date and trip_date > now.date():
                raise serializers.ValidationError({
                    "status": "Não é possível iniciar uma viagem "
                    "agendada para o futuro."
                })

            departure = data.get(
                "departure_timestamp",
                instance.departure_timestamp if instance else None,
            )
            if not departure:
                data["departure_timestamp"] = now

        # --- bus overlap check ---
        if bus and trip_date and route:
            overlapping_trips = Trip.objects.with_overlap(
                bus,
                trip_date,
                route,
                exclude_id=instance.id if instance else None,
            )

            new_start = timezone.make_aware(
                datetime.combine(trip_date, route.departure_time), tz
            )
            new_end = timezone.make_aware(
                datetime.combine(trip_date, route.arrival_time), tz
            )
            if new_end <= new_start:
                new_end += timedelta(days=1)

            for existing_trip in overlapping_trips:
                ex_start = timezone.make_aware(
                    datetime.combine(
                        existing_trip.trip_date,
                        existing_trip.route.departure_time,
                    ),
                    tz,
                )
                ex_end = timezone.make_aware(
                    datetime.combine(
                        existing_trip.trip_date,
                        existing_trip.route.arrival_time,
                    ),
                    tz,
                )
                if ex_end <= ex_start:
                    ex_end += timedelta(days=1)

                if new_start < ex_end and new_end > ex_start:
                    raise serializers.ValidationError({
                        "bus": (
                            f"Este ônibus já está alocado para a viagem "
                            f"'{existing_trip.route}' "
                            f"(Data: {existing_trip.trip_date}) "
                            "que conflita com este horário."
                        )
                    })

        return data


def has_available_bus(trip_date, route):
    """
    Checks if there is at least one active bus in the fleet that is not
    allocated to a trip during the specified trip_date and route time.
    """
    active_buses = Bus.objects.filter(status="ATIVO")
    if not active_buses.exists():
        return False

    # Define a generous date range to find potentially overlapping trips
    date_range = [
        trip_date - timedelta(days=1),
        trip_date,
        trip_date + timedelta(days=1),
    ]
    overlapping_trips = Trip.objects.filter(trip_date__in=date_range).exclude(
        bus__isnull=True
    )

    tz = timezone.get_current_timezone()
    new_start = timezone.make_aware(
        datetime.combine(trip_date, route.departure_time), tz
    )
    new_end = timezone.make_aware(datetime.combine(trip_date, route.arrival_time), tz)

    if new_end <= new_start:
        new_end += timedelta(days=1)

    busy_bus_ids = set()
    for existing_trip in overlapping_trips:
        ex_start = timezone.make_aware(
            datetime.combine(
                existing_trip.trip_date, existing_trip.route.departure_time
            ),
            tz,
        )
        ex_end = timezone.make_aware(
            datetime.combine(existing_trip.trip_date, existing_trip.route.arrival_time),
            tz,
        )

        if ex_end <= ex_start:
            ex_end += timedelta(days=1)

        # Check for time intersection
        if new_start < ex_end and new_end > ex_start:
            busy_bus_ids.add(existing_trip.bus_id)

    # If there is any active bus that is not in the set of busy buses, return True
    return active_buses.exclude(id__in=busy_bus_ids).exists()


# mover as funções abaixo para um novo service (algum dia será feito :) )
def export_trip_passengers(trip, fmt="csv"):
    """Gera arquivo CSV ou XLSX com a lista de passageiros da viagem."""
    from apps.reservations.models import Reservation

    reservations = Reservation.objects.filter(trip=trip).select_related(
        "student__user", "civil_servant__user", "guest_passenger"
    )
    trip_passengers = trip.trip_passengers.select_related("allowed_staff")

    fieldnames = ["ID", "Passageiro", "Tipo", "Documento", "Status", "Check-in"]
    rows = []

    for r in reservations:
        if r.student:
            name = r.student.user.full_name
            ptype = "ESTUDANTE"
            doc = r.student.student_id
        elif r.civil_servant:
            name = r.civil_servant.user.full_name
            ptype = "SERVIDOR"
            doc = r.civil_servant.civil_servant_id
        elif r.guest_passenger:
            name = r.guest_passenger.full_name
            ptype = "CONVIDADO"
            doc = r.guest_passenger.cpf
        else:
            continue

        rows.append({
            "ID": r.id,
            "Passageiro": name,
            "Tipo": ptype,
            "Documento": str(doc or "—"),
            "Status": r.status,
            "Check-in": "Sim" if r.check_in else "Não",
        })

    for tp in trip_passengers:
        if (
            tp.passenger_type == TripPassenger.PassengerType.LOCAL_SERVER
            and tp.allowed_staff
        ):
            rows.append({
                "ID": tp.id,
                "Passageiro": tp.allowed_staff.name,
                "Tipo": "SERVIDOR LOCAL",
                "Documento": str(tp.allowed_staff.registration_number or "—"),
                "Status": "CONFIRMADA",
                "Check-in": "Sim",
            })
        elif tp.passenger_type == TripPassenger.PassengerType.LOCAL_GUEST:
            rows.append({
                "ID": tp.id,
                "Passageiro": tp.full_name,
                "Tipo": "CONVIDADO LOCAL",
                "Documento": str(tp.cpf or "—"),
                "Status": "CONFIRMADA",
                "Check-in": "Sim",
            })

    rows.sort(key=lambda p: p["ID"], reverse=True)

    if fmt == "xlsx":
        return _build_xlsx_response(trip.id, rows, fieldnames)

    return _build_csv_response(trip.id, rows, fieldnames)


def _build_csv_response(trip_id, rows, fieldnames):
    response = HttpResponse(content_type="text/csv")
    response["Content-Disposition"] = (
        f'attachment; filename="viagem_{trip_id}_passageiros.csv"'
    )
    writer = csv.DictWriter(response, fieldnames=fieldnames)
    writer.writeheader()
    writer.writerows(rows)
    return response


def _build_xlsx_response(trip_id, rows, fieldnames):
    from openpyxl import Workbook
    from openpyxl.styles import Alignment, Font, PatternFill
    from openpyxl.utils import get_column_letter

    wb = Workbook()
    ws = wb.active
    ws.title = "Passageiros"

    header_font = Font(bold=True, color="FFFFFF")
    header_fill = PatternFill("solid", fgColor="1F2937")
    for col, name in enumerate(fieldnames, 1):
        cell = ws.cell(row=1, column=col, value=name)
        cell.font = header_font
        cell.fill = header_fill
        cell.alignment = Alignment(horizontal="center")

    for r_idx, row in enumerate(rows, 2):
        for c_idx, key in enumerate(fieldnames, 1):
            ws.cell(row=r_idx, column=c_idx, value=row[key])

    for col in range(1, len(fieldnames) + 1):
        max_len = max(
            len(str(ws.cell(row=r, column=col).value or ""))
            for r in range(1, len(rows) + 2)
        )
        ws.column_dimensions[get_column_letter(col)].width = max_len + 2

    response = HttpResponse(
        content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    )
    response["Content-Disposition"] = (
        f'attachment; filename="viagem_{trip_id}_passageiros.xlsx"'
    )
    wb.save(response)
    return response
