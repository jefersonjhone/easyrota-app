from rest_framework import permissions
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.dashboard.selectors.reservation import ReservationSelectors


class ReservationsVolumeView(APIView):
    permission_classes = [permissions.IsAdminUser]

    def get(self, request):
        days = int(request.query_params.get("days", 7))

        return Response(ReservationSelectors.get_reservations_volume(days=days))


class ReservationsByStatusView(APIView):
    permission_classes = [permissions.IsAdminUser]

    def get(self, request):
        days = int(request.query_params.get("days", 7))

        return Response(ReservationSelectors.get_reservations_by_status(days=days))


class ReservationsCheckinStatsView(APIView):
    permission_classes = [permissions.IsAdminUser]

    def get(self, request):
        days = int(request.query_params.get("days", 7))

        return Response(ReservationSelectors.get_checkin_stats(days=days))


class ReservationsMostReservedTripsView(APIView):
    permission_classes = [permissions.IsAdminUser]

    def get(self, request):
        days = int(request.query_params.get("days", 7))

        return Response(ReservationSelectors.get_most_reserved_trips(days=days))
