from rest_framework import permissions


class IsDriverReadOnly(permissions.BasePermission):
    """Allows read-only access to drivers."""

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and getattr(request.user, "driver_profile", None) is not None
            and request.method in permissions.SAFE_METHODS
        )
