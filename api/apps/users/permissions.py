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


class IsAdminOrReadOnly(BasePermission):
    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return True
        return isinstance(request.user, AdministratorProfile)
