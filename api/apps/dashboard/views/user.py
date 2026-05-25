from rest_framework import permissions
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.dashboard.selectors.user import UserSelectors


class UsersDistributionView(APIView):
    permission_classes = [permissions.IsAdminUser]

    def get(self, request):
        return Response(UserSelectors.get_users_distribution())


class UsersGrowthView(APIView):
    permission_classes = [permissions.IsAdminUser]

    def get(self, request):
        days = int(request.query_params.get("days", 7))

        return Response(UserSelectors.get_users_growth(days=days))


class DriversCountView(APIView):
    permission_classes = [permissions.IsAdminUser]

    def get(self, request):
        return Response(UserSelectors.get_drivers_count())
