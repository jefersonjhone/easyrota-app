import pytest
from datetime import date, time, timedelta
from django.utils import timezone
from django.contrib.auth import get_user_model
from apps.trips.models import Bus, Route, Trip
from apps.reservations.models import Reservation
from apps.users.models.profiles import StudentProfile, CivilServantProfile, AdministratorProfile
from apps.reservations.services import trip_has_capacity

User = get_user_model()

@pytest.fixture
def superadmin(db):
    user = User.objects.create_user(email="admin_test@test.com", password="password123", full_name="Ricardo Admin")
    AdministratorProfile.objects.create(user=user, level=AdministratorProfile.Level.SUPERADMIN)
    return user

@pytest.fixture
def route(db, superadmin):
    return Route.objects.create(
        origin="A", destiny="B", 
        departure_time=time(10, 0), arrival_time=time(12, 0),
        administrator=superadmin.admin_profile
    )

@pytest.fixture
def bus(db, superadmin):
    return Bus.objects.create(
        number_plate="BUS-001", seating_capacity=2, brand="Test",
        status="ATIVO", administrator=superadmin.admin_profile
    )

@pytest.fixture
def trip(db, bus, route):
    return Trip.objects.create(
        trip_date=date.today() + timedelta(days=1),
        bus=bus,
        route=route,
        status="CONFIRMADA"
    )

@pytest.fixture
def student_user(db):
    user = User.objects.create_user(email="student@test.com", password="password123", full_name="Student One")
    StudentProfile.objects.create(user=user, student_id="ST001")
    return user

@pytest.fixture
def server_user(db):
    user = User.objects.create_user(email="server@test.com", password="password123", full_name="Server One")
    CivilServantProfile.objects.create(user=user, civil_servant_id="CS001")
    return user

@pytest.mark.django_db
def test_civil_servant_displaces_student(trip, student_user, server_user):
    from apps.reservations.services import sync_trip_status
    # Fill trip with students (capacity is 2)
    s2_user = User.objects.create_user(email="student2@test.com", password="password123", full_name="Student Two")
    StudentProfile.objects.create(user=s2_user, student_id="ST002")
    
    Reservation.objects.create(trip=trip, student=student_user.student_profile, status="CONFIRMADA")
    Reservation.objects.create(trip=trip, student=s2_user.student_profile, status="CONFIRMADA")
    sync_trip_status(trip)
    
    assert not trip_has_capacity(trip)
    
    # Civil servant attempts to reserve
    from apps.reservations.serializers import ReservationSerializer
    from rest_framework.test import APIRequestFactory
    
    factory = APIRequestFactory()
    request = factory.post('/api/reservations/')
    request.user = server_user
    
    serializer = ReservationSerializer(data={'trip': trip.id}, context={'request': request})
    assert serializer.is_valid()
    
    reservation = serializer.save()
    
    # Assertions
    assert reservation.status == "CONFIRMADA"
    assert reservation.civil_servant == server_user.civil_servant_profile
    
    # One student should have been displaced
    displaced = Reservation.objects.filter(trip=trip, student=s2_user.student_profile).first()
    assert displaced.status == "LISTA SECUNDÁRIA"

@pytest.mark.django_db
def test_civil_servant_to_waitlist_when_only_servers(trip, server_user, superadmin):
    from apps.reservations.services import sync_trip_status
    # Fill trip with civil servants
    s2_user = User.objects.create_user(email="server2@test.com", password="password123", full_name="Server Two")
    CivilServantProfile.objects.create(user=s2_user, civil_servant_id="CS002")
    
    Reservation.objects.create(trip=trip, civil_servant=server_user.civil_servant_profile, status="CONFIRMADA")
    Reservation.objects.create(trip=trip, civil_servant=s2_user.civil_servant_profile, status="CONFIRMADA")
    sync_trip_status(trip)
    
    assert not trip_has_capacity(trip)
    
    # Third civil servant attempts to reserve
    s3_user = User.objects.create_user(email="server3@test.com", password="password123", full_name="Server Three")
    CivilServantProfile.objects.create(user=s3_user, civil_servant_id="CS003")
    
    # Ensure there's another bus available for the alert logic
    Bus.objects.create(number_plate="BUS-002", seating_capacity=10, brand="Extra", status="ATIVO", administrator=superadmin.admin_profile)
    
    from apps.reservations.serializers import ReservationSerializer
    from rest_framework.test import APIRequestFactory
    
    factory = APIRequestFactory()
    request = factory.post('/api/reservations/')
    request.user = s3_user
    
    serializer = ReservationSerializer(data={'trip': trip.id}, context={'request': request})
    assert serializer.is_valid()
    
    reservation = serializer.save()
    
    # Assertions
    assert reservation.status == "LISTA SECUNDÁRIA"
    assert reservation.civil_servant == s3_user.civil_servant_profile

@pytest.mark.django_db
def test_is_reservable_for_server_with_available_bus(trip, server_user, superadmin):
    from apps.reservations.services import sync_trip_status
    # Fill trip
    Reservation.objects.create(trip=trip, status="CONFIRMADA", civil_servant=server_user.civil_servant_profile)
    s2_user = User.objects.create_user(email="server2@test.com", password="password123", full_name="Server Two")
    CivilServantProfile.objects.create(user=s2_user, civil_servant_id="CS002")
    Reservation.objects.create(trip=trip, status="CONFIRMADA", civil_servant=s2_user.civil_servant_profile)
    sync_trip_status(trip)
    
    from apps.reservations.serializers import AvailableTripSerializer
    from rest_framework.test import APIRequestFactory
    
    factory = APIRequestFactory()
    request = factory.get('/')
    request.user = server_user
    
    # No other bus available
    serializer = AvailableTripSerializer(trip, context={'request': request})
    assert serializer.data['is_reservable'] is False
    
    # Now add an available bus
    Bus.objects.create(number_plate="BUS-003", seating_capacity=10, brand="Extra", status="ATIVO", administrator=superadmin.admin_profile)
    
    serializer = AvailableTripSerializer(trip, context={'request': request})
    assert serializer.data['is_reservable'] is True

@pytest.mark.django_db
def test_role_based_available_seats(trip, student_user, server_user):
    from apps.reservations.services import sync_trip_status
    # Trip capacity is 2. 
    # 1 student reserved.
    Reservation.objects.create(trip=trip, student=student_user.student_profile, status="CONFIRMADA")
    sync_trip_status(trip)
    
    from apps.reservations.serializers import AvailableTripSerializer
    from rest_framework.test import APIRequestFactory
    factory = APIRequestFactory()

    # Case 1: Student viewing
    req_student = factory.get('/')
    req_student.user = student_user
    ser_student = AvailableTripSerializer(trip, context={'request': req_student})
    # Total capacity 2 - 1 student = 1 seat left
    assert ser_student.data['available_seats'] == 1

    # Case 2: Server viewing
    req_server = factory.get('/')
    req_server.user = server_user
    ser_server = AvailableTripSerializer(trip, context={'request': req_server})
    # Total capacity 2 - 0 servers = 2 seats left (student doesn't count for server)
    assert ser_server.data['available_seats'] == 2

    # Case 3: 1 server joins
    Reservation.objects.create(trip=trip, civil_servant=server_user.civil_servant_profile, status="CONFIRMADA")
    sync_trip_status(trip)
    
    # Student sees 0 seats left (1 student + 1 server = 2)
    ser_student = AvailableTripSerializer(trip, context={'request': req_student})
    assert ser_student.data['available_seats'] == 0
    
    # Server sees 1 seat left (only the other server counts)
    ser_server = AvailableTripSerializer(trip, context={'request': req_server})
    assert ser_server.data['available_seats'] == 1
