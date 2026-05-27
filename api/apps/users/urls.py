from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views.auth import (
    DeleteOwnAccountView,
    LoginView,
    LoginView2fa,
    LogoutView,
    RefreshTokenView,
    RegisterView,
    ResendOTPView,
    VerifyRegistrationOTPView,
    Verify2FAView,
)
from .views.users import (
    AdminDelegationView,
    AllowedStaffSearchView,
    DriverTripPassengerView,
    DriverViewSet,
    HealthCheckView,
)

router = DefaultRouter()
router.register(r"drivers", DriverViewSet, basename="drivers")

urlpatterns = [
    path("health/", HealthCheckView.as_view()),
    path("register/", RegisterView.as_view(), name="register"),
    path("login/", LoginView.as_view(), name="login"),
    path("admins/", AdminDelegationView.as_view(), name="create-subadmin"),
    # auth views, 2fa enabled to login and register
    path("auth/login/", LoginView2fa.as_view(), name="login-2fa"),
    path("auth/register/", RegisterView.as_view(), name="register-2fa"),
    path("auth/verify-2fa", Verify2FAView.as_view(), name="verify-2fa"),
    path(
        "auth/verify-registration-otp/",
        VerifyRegistrationOTPView.as_view(),
        name="verify-registration-otp",
    ),
    path(
        "auth/resend-otp/",
        ResendOTPView.as_view(),
        name="resend-otp",
    ),
    path("auth/refresh", RefreshTokenView.as_view(), name="refresh-token"),
    path("auth/logout/", LogoutView.as_view(), name="logout"),
    path("auth/delete-account/", DeleteOwnAccountView.as_view(), name="delete-account"),
    path(
        "staff/search/",
        AllowedStaffSearchView.as_view(),
        name="allowed-staff-search",
    ),
    path(
        "staff/passengers/",
        DriverTripPassengerView.as_view(),
        name="trip-passenger-create",
    ),
    path("", include(router.urls)),
]
