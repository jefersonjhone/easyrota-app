from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.contrib.auth.forms import UserChangeForm, UserCreationForm

from .models import (
    AdministratorProfile,
    AllowedStaff,
    CivilServantProfile,
    CustomUser,
    DriverProfile,
    StudentProfile,
)

# Register your models here.


class CustomUserCreationForm(UserCreationForm):
    class Meta(UserCreationForm.Meta):
        model = CustomUser
        fields = ("email",)


class CustomUserChangeForm(UserChangeForm):
    class Meta(UserChangeForm.Meta):
        model = CustomUser
        fields = ("email",)


class CustomUserList(UserAdmin):
    form = CustomUserChangeForm
    add_form = CustomUserCreationForm

    list_display = ("email", "full_name", "is_staff", "is_active", "date_joined")
    list_filter = ("is_staff", "is_active")
    search_fields = ("email", "full_name")
    ordering = ("email",)

    fieldsets = (
        ("Credentials", {"fields": ("email", "password")}),
        ("Personal Info", {"fields": ("full_name",)}),
        (
            "Permissions",
            {
                "fields": (
                    "is_active",
                    "is_staff",
                )
            },
        ),
        ("Important dates", {"fields": ("last_login", "date_joined")}),
    )
    add_fieldsets = (
        (
            None,
            {
                "classes": ("wide",),
                "fields": ("email", "password1", "password2", "full_name"),
            },
        ),
    )
    readonly_fields = ("date_joined", "last_login")


class StudentProfileList(admin.ModelAdmin):
    list_display = ("student_id", "get_email", "get_name")
    search_fields = ("student_id", "user__email", "user__full_name")

    @admin.display(description="Email", ordering="user__email")
    def get_email(self, obj):
        return obj.user.email

    @admin.display(description="Full Name", ordering="user__full_name")
    def get_name(self, obj):
        return obj.user.full_name


class DriverProfileList(admin.ModelAdmin):
    list_display = ("cnh", "get_email")
    search_fields = ("cnh", "user__email")

    @admin.display(description="Email")
    def get_email(self, obj):
        return obj.user.email


class AllowedStaffList(admin.ModelAdmin):
    list_display = ("name", "registration_number")
    search_fields = ("name", "registration_number")
    ordering = ("name",)


admin.site.register(CustomUser, CustomUserList)
admin.site.register(StudentProfile, StudentProfileList)
admin.site.register(CivilServantProfile)
admin.site.register(DriverProfile, DriverProfileList)
admin.site.register(AdministratorProfile)
admin.site.register(AllowedStaff, AllowedStaffList)
