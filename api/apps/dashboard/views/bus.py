from rest_framework import permissions
from rest_framework.response import Response
from rest_framework.views import APIView

from ..selectors.bus import BusSelector


class BusStatsView(APIView):
    permission_classes = [permissions.IsAdminUser]

    def get(self, request):
        return Response(BusSelector.get_bus_stats())
