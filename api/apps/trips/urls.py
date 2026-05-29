from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    BusViewSet,
    MyNextTripView,
    RouteDetailView,
    RouteListCreateView,
    TripViewSet,
    TripPassengerView,
)

router = DefaultRouter()
router.register(r"buses", BusViewSet, basename="bus")
router.register(r"trips", TripViewSet, basename="trip")

urlpatterns = [
    path("routes/", RouteListCreateView.as_view(), name="route-list-create"),
    path("routes/<int:pk>/", RouteDetailView.as_view(), name="route-detail"),
    path("trips/current/", MyNextTripView.as_view(), name="trip-current"),
    path("trips/guest/", TripPassengerView.as_view(), name="trip-guest"),
    path("", include(router.urls)),
]
