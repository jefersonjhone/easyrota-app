from django.contrib import admin

from .models import Bus, Occurrence, Route, Trip

# Register your models here.


class BusList(admin.ModelAdmin):
    list_display = ("number_plate", "seating_capacity", "driver", "administrator")
    search_fields = ("number_plate", "driver__user__full_name")
    list_filter = ("seating_capacity",)


class RouteList(admin.ModelAdmin):
    list_display = ("origin", "destiny", "departure_time", "arrival_time")
    list_filter = ("origin", "destiny")
    search_fields = ("origin", "destiny")


class TripList(admin.ModelAdmin):
    list_display = ("trip_date", "route", "bus", "status", "departure_timestamp")
    list_editable = ("status",)
    list_filter = ("status", "trip_date", "route")
    search_fields = ("bus__number_plate", "route__origin", "route__destiny")
    date_hierarchy = "trip_date"


class OccurrenceList(admin.ModelAdmin):
    list_display = ("title", "event_date", "status", "trip")
    list_editable = ("status",)
    list_filter = ("status", "event_date")
    search_fields = ("title", "description", "trip__route__origin")


admin.site.register(Bus, BusList)
admin.site.register(Route, RouteList)
admin.site.register(Trip, TripList)
admin.site.register(Occurrence, OccurrenceList)
