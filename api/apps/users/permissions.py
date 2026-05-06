from rest_framework.permissions import SAFE_METHODS, BasePermission

from apps.users.models import AdministratorProfile


class IsDriverReadOnly(BasePermission):
    """Allows read-only access to drivers."""

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and getattr(request.user, "driver_profile", None) is not None
            and request.method in SAFE_METHODS
        )


class IsDriver(BasePermission):
    """Allows access to drivers"""

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and hasattr(request.user, "driver_profile")
        )


class IsAdminOrReadOnly(BasePermission):
    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return True
        return (
            request.user
            and request.user.is_authenticated
            and getattr(request.user, "admin_profile", None) is not None
        )


class IsSuperAdmin(BasePermission):
    """Allows access only to authenticated superadmins."""

    def has_permission(self, request, view):
        admin_profile = getattr(request.user, "admin_profile", None)
        return (
            request.user
            and request.user.is_authenticated
            and admin_profile is not None
            and admin_profile.level == AdministratorProfile.Level.SUPERADMIN
        )
