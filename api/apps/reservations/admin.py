from django.contrib import admin

from .models import Guest, Punishment, Reservation

# Register your models here.


class ReservationList(admin.ModelAdmin):
    list_display = (
        "id",
        "checkin_date",
        "check_in",
        "status",
        "student",
        "civil_servant",
        "trip",
    )
    list_display_links = ("id",)
    list_editable = ("status",)
    list_filter = (
        "status",
        "trip",
    )
    list_per_page = 3


class GuestList(admin.ModelAdmin):
    list_display = ("name", "cpf", "civil_servant")
    search_fields = ("name", "cpf")
    list_filter = ("civil_servant",)
    list_per_page = 10


class PunishmentList(admin.ModelAdmin):
    list_display = ("id", "student", "is_active", "reservation", "description")
    list_filter = ("student", "is_active")
    search_fields = ("student__user__full_name", "description")
    list_per_page = 10


admin.site.register(Reservation, ReservationList)
admin.site.register(Guest, GuestList)
admin.site.register(Punishment, PunishmentList)
