#!/bin/bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
API_DIR="$ROOT_DIR/api"
DB_FILE="$API_DIR/db.sqlite3"

export PATH="$HOME/.local/share/mise/bin:$HOME/.bun/bin:$HOME/.local/bin:$PATH"
export DJANGO_SETTINGS_MODULE="config.settings.development"

echo "--- Verificando ferramentas ---"
for tool in mise bun poetry; do
  if ! command -v "$tool" >/dev/null 2>&1; then
    echo "$tool não encontrado"
    exit 1
  fi
done

echo "--- Garantindo variáveis de ambiente ---"
if [ ! -f "$API_DIR/.env" ]; then
  if [ -f "$API_DIR/.env.development" ]; then
    cp "$API_DIR/.env.development" "$API_DIR/.env"
  else
    cat > "$API_DIR/.env" <<'EOF'
SECRET_KEY='django-insecure-test-key'
DEBUG=True
EOF
  fi
fi

echo "--- Instalando dependências ---"
mise install
bun install --silent
if ! poetry install --no-interaction; then
  echo "Poetry lock incompatível, regenerando lock sem atualizar versões."
  poetry lock --no-update
  poetry install --no-interaction
fi

echo "--- Preparando banco de dados ---"
rm -f "$DB_FILE"
cd "$API_DIR"
poetry run python manage.py migrate
poetry run python manage.py loaddata apps/users/fixtures/allowed_staff.json

echo "--- Populando ambiente de demonstração ---"
poetry run python <<'PY'
from __future__ import annotations

from datetime import datetime, time, timedelta

import django

django.setup()

from django.contrib.auth import get_user_model
from django.db import transaction
from django.utils import timezone

from apps.reservations.models import Punishment, Reservation
from apps.reservations.services import sync_trip_status
from apps.trips.models import Bus, GuestPassenger, Occurrence, Route, Trip, TripPassenger
from apps.users.models import AllowedStaff
from apps.users.models.profiles import (
    AdministratorProfile,
    CivilServantProfile,
    DriverProfile,
    StudentProfile,
)

User = get_user_model()


def backdate_user_joined(user, days_ago):
    User.objects.filter(pk=user.pk).update(date_joined=timezone.now() - timedelta(days=days_ago))


def ensure_user(email, full_name, password, *, is_staff=False, is_superuser=False):
    user, _ = User.objects.get_or_create(
        email=email,
        defaults={
            "full_name": full_name,
            "is_active": True,
            "is_staff": is_staff,
            "is_superuser": is_superuser,
        },
    )
    user.full_name = full_name
    user.is_active = True
    user.is_staff = is_staff or user.is_staff
    user.is_superuser = is_superuser or user.is_superuser
    user.set_password(password)
    user.save()
    return user


def ensure_student(email, full_name, student_id, days_ago):
    user = ensure_user(email, full_name, "password123")
    StudentProfile.objects.update_or_create(user=user, defaults={"student_id": student_id})
    backdate_user_joined(user, days_ago)
    return user


def ensure_civil_servant(email, full_name, civil_servant_id, days_ago):
    user = ensure_user(email, full_name, "password123")
    CivilServantProfile.objects.update_or_create(
        user=user,
        defaults={"civil_servant_id": civil_servant_id},
    )
    backdate_user_joined(user, days_ago)
    return user


def ensure_driver(email, full_name, cnh, days_ago):
    user = ensure_user(email, full_name, "password123")
    profile, _ = DriverProfile.objects.update_or_create(user=user, defaults={"cnh": cnh})
    backdate_user_joined(user, days_ago)
    return profile


def ensure_admin(email, full_name, role, level, days_ago):
    user = ensure_user(
        email,
        full_name,
        "password123",
        is_staff=True,
        is_superuser=(level == AdministratorProfile.Level.SUPERADMIN),
    )
    AdministratorProfile.objects.update_or_create(
        user=user,
        defaults={"role": role, "level": level},
    )
    backdate_user_joined(user, days_ago)
    return user


with transaction.atomic():
    TripPassenger.objects.all().delete()
    GuestPassenger.objects.all().delete()
    Punishment.objects.all().delete()
    Reservation.objects.all().delete()
    Occurrence.objects.all().delete()
    Trip.objects.all().delete()
    Bus.objects.all().delete()
    Route.objects.all().delete()
    AdministratorProfile.objects.all().delete()
    DriverProfile.objects.all().delete()
    CivilServantProfile.objects.all().delete()
    StudentProfile.objects.all().delete()

    superadmin = ensure_admin(
        "admin@test.com",
        "Admin Principal",
        "System Admin",
        AdministratorProfile.Level.SUPERADMIN,
        240,
    )
    subadmin = ensure_admin(
        "gestor@test.com",
        "Gestora de Operacao",
        "Operacao",
        AdministratorProfile.Level.SUBADMIN,
        180,
    )
    driver_1 = ensure_driver("motorista1@test.com", "Joao Motorista", "12345678901", 120)
    driver_2 = ensure_driver("motorista2@test.com", "Maria Motorista", "23456789012", 95)

    civil_1 = ensure_civil_servant("servidor1@test.com", "Ana Servidora", "CS-1001", 60)
    civil_2 = ensure_civil_servant("servidor2@test.com", "Bruno Servidor", "CS-1002", 140)
    civil_3 = ensure_civil_servant("servidor3@test.com", "Carla Servidora", "CS-1003", 220)

    students = [
        ensure_student("aluno1@test.com", "Lucas Estudante", "20240001", 12),
        ensure_student("aluno2@test.com", "Marina Estudante", "20240002", 20),
        ensure_student("aluno3@test.com", "Pedro Estudante", "20240003", 35),
        ensure_student("aluno4@test.com", "Julia Estudante", "20240004", 48),
        ensure_student("aluno5@test.com", "Rafael Estudante", "20240005", 64),
        ensure_student("aluno6@test.com", "Sofia Estudante", "20240006", 76),
        ensure_student("aluno7@test.com", "Diego Estudante", "20240007", 92),
        ensure_student("aluno8@test.com", "Beatriz Estudante", "20240008", 108),
    ]

    allowed_staff = list(AllowedStaff.objects.all()[:12])

    buses = [
        Bus.objects.create(number_plate="EAS-1001", seating_capacity=46, brand="Marcopolo", administrator=superadmin.admin_profile),
        Bus.objects.create(number_plate="EAS-1002", seating_capacity=42, brand="Caio", administrator=superadmin.admin_profile),
        Bus.objects.create(number_plate="EAS-1003", seating_capacity=18, brand="Volare", administrator=subadmin.admin_profile),
    ]

    routes = [
        Route.objects.create(origin="UEFS", destiny="Feira de Santana", departure_time=time(6, 30), arrival_time=time(7, 5), administrator=superadmin.admin_profile),
        Route.objects.create(origin="UEFS", destiny="Santo Antonio de Jesus", departure_time=time(8, 0), arrival_time=time(10, 45), administrator=superadmin.admin_profile),
        Route.objects.create(origin="UEFS", destiny="Salvador", departure_time=time(12, 0), arrival_time=time(14, 20), administrator=subadmin.admin_profile),
        Route.objects.create(origin="Feira de Santana", destiny="Jacobina", departure_time=time(15, 0), arrival_time=time(20, 10), administrator=subadmin.admin_profile),
        Route.objects.create(origin="UEFS", destiny="Alagoinhas", departure_time=time(18, 30), arrival_time=time(21, 15), administrator=superadmin.admin_profile),
        Route.objects.create(origin="UEFS", destiny="Itabuna", departure_time=time(22, 10), arrival_time=time(1, 30), administrator=superadmin.admin_profile),
    ]

    now = timezone.localtime()
    today = now.date()

    trip_specs = [
        {"days": -6, "status": "CONCLUÍDA", "bus": buses[0], "route": routes[0], "driver": driver_1, "reservations": [(students[0], "CONFIRMADA", True), (students[1], "CONFIRMADA", False), (civil_1, "CONFIRMADA", True)]},
        {"days": -5, "status": "CANCELADA", "bus": buses[1], "route": routes[1], "driver": driver_2, "reservations": [(students[2], "PENDENTE", False), (students[3], "PENDENTE", False)]},
        {"days": -3, "status": "CONCLUÍDA", "bus": buses[2], "route": routes[2], "driver": driver_1, "reservations": [(civil_2, "CONFIRMADA", True), (students[4], "CONFIRMADA", True), (students[5], "CONFIRMADA", False)], "locals": [(allowed_staff[0], "LOCAL_SERVER", None, None), (allowed_staff[1], "LOCAL_GUEST", "Convidado Demo 1", "12345678901")], "occurrence": True},
        {"days": -1, "status": "CONFIRMADA", "bus": buses[0], "route": routes[3], "driver": driver_2, "reservations": [(civil_3, "CONFIRMADA", True), (students[6], "PENDENTE", False), (students[7], "LISTA SECUNDÁRIA", False), (students[0], "PENDENTE", False)]},
        {"days": 0, "status": "EM ANDAMENTO", "bus": buses[1], "route": routes[4], "driver": driver_1, "departure_minutes_ago": 52, "reservations": [(civil_1, "CONFIRMADA", True), (students[0], "CONFIRMADA", False), (students[1], "CONFIRMADA", True), (students[2], "PENDENTE", False), (students[3], "LISTA SECUNDÁRIA", False), (students[4], "PENDENTE", False), (civil_2, "CONFIRMADA", True)], "locals": [(allowed_staff[2], "LOCAL_SERVER", None, None), (allowed_staff[3], "LOCAL_GUEST", "Convidada Demo 2", "10987654321")], "guests": [{"name": "Convidado do Dia", "cpf": "11122233344", "checked_in": True}, {"name": "Convidada da Demo", "cpf": "55566677788", "checked_in": False}]},
        {"days": 1, "status": "RISCO DE CANCELAMENTO", "bus": buses[2], "route": routes[5], "driver": driver_2, "reservations": [(students[5], "PENDENTE", False), (students[6], "LISTA SECUNDÁRIA", False)]},
    ]

    demo_trip = None
    for index, spec in enumerate(trip_specs, start=1):
        trip_date = today + timedelta(days=spec["days"])
        departure_timestamp = timezone.make_aware(
            datetime.combine(trip_date, spec["route"].departure_time),
            timezone.get_current_timezone(),
        )
        if spec.get("departure_minutes_ago") is not None:
            departure_timestamp = now - timedelta(minutes=spec["departure_minutes_ago"])

        trip = Trip.objects.create(
            trip_date=trip_date,
            status=spec["status"],
            departure_timestamp=departure_timestamp if spec["status"] in {"EM ANDAMENTO", "CONCLUÍDA"} else None,
            arrival_timestamp=(departure_timestamp + timedelta(hours=2, minutes=10)) if spec["status"] == "CONCLUÍDA" else None,
            bus=spec["bus"],
            route=spec["route"],
            driver=spec["driver"],
        )

        for passenger_index, passenger in enumerate(spec.get("reservations", []), start=1):
            subject, reservation_status, checked_in = passenger
            reservation = Reservation.objects.create(
                trip=trip,
                status=reservation_status,
                check_in=checked_in,
                checkin_date=now - timedelta(minutes=10) if checked_in else None,
                student=getattr(subject, "student_profile", None),
                civil_servant=getattr(subject, "civil_servant_profile", None),
            )
            Reservation.objects.filter(pk=reservation.pk).update(
                created_at=now - timedelta(days=abs(spec["days"]), hours=passenger_index)
            )
            if checked_in:
                reservation.checkin_date = now - timedelta(minutes=passenger_index)
                reservation.save(update_fields=["checkin_date"])

        for local_item in spec.get("locals", []):
            allowed_staff_member, passenger_type, full_name, cpf = local_item
            TripPassenger.objects.create(
                trip=trip,
                allowed_staff=allowed_staff_member,
                passenger_type=passenger_type,
                full_name=full_name or "",
                cpf=cpf or "",
                associated_staff=allowed_staff_member if passenger_type == "LOCAL_GUEST" else None,
            )

        for guest_index, guest_data in enumerate(spec.get("guests", []), start=1):
            guest_passenger = GuestPassenger.objects.create(
                cpf=guest_data["cpf"],
                trip=trip,
                recorded_by=civil_1.civil_servant_profile,
                full_name=guest_data["name"],
            )
            guest_reservation = Reservation.objects.create(
                trip=trip,
                status="CONFIRMADA",
                check_in=guest_data["checked_in"],
                checkin_date=now - timedelta(minutes=15) if guest_data["checked_in"] else None,
                guest_passenger=guest_passenger,
            )
            Reservation.objects.filter(pk=guest_reservation.pk).update(
                created_at=now - timedelta(days=abs(spec["days"]), hours=guest_index + 1)
            )

        if spec.get("occurrence"):
            Occurrence.objects.create(
                title="Pneu trocado no trajeto",
                description="A viagem teve uma parada rápida para manutenção preventiva.",
                event_date=trip.trip_date,
                status="CANCELAMENTO PARCIAL DO ÔNIBUS",
                trip=trip,
                administrator=superadmin.admin_profile,
            )

        sync_trip_status(trip)
        if spec["status"] == "EM ANDAMENTO":
            demo_trip = trip

    if demo_trip is not None:
        demo_trip.quorum_met_notified_at = now - timedelta(minutes=5)
        demo_trip.save(update_fields=["quorum_met_notified_at"])

    historical_trip_date = today - timedelta(days=214)
    historical_trip = Trip.objects.create(
        trip_date=historical_trip_date,
        status="CONCLUÍDA",
        departure_timestamp=timezone.make_aware(
            datetime.combine(historical_trip_date, routes[5].departure_time),
            timezone.get_current_timezone(),
        ),
        arrival_timestamp=timezone.make_aware(
            datetime.combine(historical_trip_date, routes[5].arrival_time),
            timezone.get_current_timezone(),
        ),
        bus=buses[2],
        route=routes[5],
        driver=driver_2,
    )
    hist_reservation = Reservation.objects.create(
        trip=historical_trip,
        status="CONFIRMADA",
        check_in=True,
        checkin_date=timezone.now() - timedelta(days=214),
        student=students[3].student_profile,
    )
    Reservation.objects.filter(pk=hist_reservation.pk).update(created_at=timezone.now() - timedelta(days=214))

    Punishment.objects.get_or_create(
        reservation=Reservation.objects.filter(student=students[2].student_profile).first(),
        defaults={
            "student": students[2].student_profile,
            "description": "Faltou ao check-in em uma viagem anterior da demo.",
            "is_active": True,
        },
    )

print("Demo criada com sucesso:")
print("- Admin: admin@test.com / password123")
print("- Gestor: gestor@test.com / password123")
print("- Motorista: motorista1@test.com / password123")
print("- Aluno destaque: aluno1@test.com / password123")
print("- Servidor destaque: servidor1@test.com / password123")
PY

echo "--- Iniciando aplicação completa ---"
echo "Backend:   http://127.0.0.1:8000"
echo "Frontend:  http://localhost:5173"
echo "Scheduler: Iniciando em 3 segundos..."

trap 'kill 0' EXIT
(poetry run python manage.py runserver) &
(sleep 3 && echo "--- Agendador Ativo ---" && poetry run python manage.py run_scheduler) &
cd "$ROOT_DIR"
bun dev
