from django.urls import include
from django.urls import path
from rest_framework.routers import DefaultRouter

from .views import BusViewSet
from .views import RouteDetailView
from .views import RouteListCreateView


router = DefaultRouter()
router.register(r"", BusViewSet, basename="bus")

urlpatterns = [
    path("", include(router.urls)),
    path("routes/", RouteListCreateView.as_view(), name="route-list-create"),
    path("routes/<int:pk>/", RouteDetailView.as_view(), name="route-detail"),
]
