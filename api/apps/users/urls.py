from django.urls import path

from .views import LoginView
from .views import RegisterView
from .views import health_check


urlpatterns = [
    path("health/", health_check),
    path("register/", RegisterView.as_view(), name="register"),
    path("login/", LoginView.as_view(), name="login"),
]
