from django.urls import path
from .views import RegisterView, health_check

urlpatterns = [
    path("health/", health_check),
    path("register/", RegisterView.as_view(), name="register"),
]
