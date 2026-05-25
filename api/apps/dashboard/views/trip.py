from rest_framework import permissions
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.dashboard.selectors.trip import TripsSelectors


class TripsStatsByStatusView(APIView):
    permission_classes = [permissions.IsAdminUser]

    def get(self, request):
        days = int(request.query_params.get("days", 7))

        return Response(TripsSelectors.get_trips_stats_by_status(days=days))


class TripsStatsByRouteView(APIView):
    permission_classes = [permissions.IsAdminUser]

    def get(self, request):
        days = int(request.query_params.get("days", 7))

        return Response(TripsSelectors.get_trips_stats_by_route(days=days))


class TripsStatsByDateView(APIView):
    permission_classes = [permissions.IsAdminUser]

    def get(self, request):
        days = int(request.query_params.get("days", 7))

        return Response(TripsSelectors.get_trips_stats_by_date(days=days))


class TripsStatsByBusView(APIView):
    permission_classes = [permissions.IsAdminUser]

    def get(self, request):

        return Response(TripsSelectors.get_trips_stats_by_bus())


class TripsStatsByCreatedView(APIView):
    permission_classes = [permissions.IsAdminUser]

    def get(self, request):
        days = int(request.query_params.get("days", 7))

        return Response(TripsSelectors.get_created_trips(days=days))


class TripsInProgressView(APIView):
    permission_classes = [permissions.IsAdminUser]

    def get(self, request):
        return Response(TripsSelectors.get_trips_in_progress())
