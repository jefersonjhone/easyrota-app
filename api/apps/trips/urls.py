from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import BusViewSet, RouteDetailView, RouteListCreateView

router = DefaultRouter()
router.register(r"", BusViewSet, basename="bus")

urlpatterns = [
    path("", include(router.urls)),
    path("routes/", RouteListCreateView.as_view(), name="route-list-create"),
    path("routes/<int:pk>/", RouteDetailView.as_view(), name="route-detail"),
]
