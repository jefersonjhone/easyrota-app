from datetime import datetime, timedelta
from django.utils import timezone
from .models import Bus, Trip

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
    overlapping_trips = Trip.objects.filter(trip_date__in=date_range).exclude(bus__isnull=True)
    
    tz = timezone.get_current_timezone()
    new_start = timezone.make_aware(datetime.combine(trip_date, route.departure_time), tz)
    new_end = timezone.make_aware(datetime.combine(trip_date, route.arrival_time), tz)

    if new_end <= new_start:
        new_end += timedelta(days=1)

    busy_bus_ids = set()
    for existing_trip in overlapping_trips:
        ex_start = timezone.make_aware(
            datetime.combine(existing_trip.trip_date, existing_trip.route.departure_time), tz
        )
        ex_end = timezone.make_aware(
            datetime.combine(existing_trip.trip_date, existing_trip.route.arrival_time), tz
        )
        
        if ex_end <= ex_start:
            ex_end += timedelta(days=1)

        # Check for time intersection
        if new_start < ex_end and new_end > ex_start:
            busy_bus_ids.add(existing_trip.bus_id)
            
    # If there is any active bus that is not in the set of busy buses, return True
    return active_buses.exclude(id__in=busy_bus_ids).exists()
