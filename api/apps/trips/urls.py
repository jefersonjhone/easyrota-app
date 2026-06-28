from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    BusViewSet,
    GuestHistoryView,
    GuestPassengerView,
    MyNextTripView,
    RouteDetailView,
    RouteListCreateView,
    TripViewSet,
    TripRequestViewSet,
    PrivateTripDetailView,
)

router = DefaultRouter()
router.register(r"buses", BusViewSet, basename="bus")
router.register(r"trips", TripViewSet, basename="trip")
router.register(r"trip-requests", TripRequestViewSet, basename="trip-request")

urlpatterns = [
    path("routes/", RouteListCreateView.as_view(), name="route-list-create"),
    path("routes/<uuid:pk>/", RouteDetailView.as_view(), name="route-detail"),
    path("trips/current/", MyNextTripView.as_view(), name="trip-current"),
    path("trips/guest/", GuestPassengerView.as_view(), name="trip-guest"),
    path("guests/history/", GuestHistoryView.as_view(), name="guest-history"),
    path("trips/private/", PrivateTripDetailView.as_view(), name="trip-private"),
    path("", include(router.urls)),
]
