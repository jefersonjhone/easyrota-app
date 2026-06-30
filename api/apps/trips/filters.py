from rest_framework import filters


class FilterTripViewSet(filters.BaseFilterBackend):
    """A filter backend for the TripViewSet that allows filtering
    by status and excluding statuses."""

    def filter_queryset(self, request, queryset, view):
        """define queryset filtering logic by status and
        exclude_statuses query parameters"""

        status = request.query_params.get("status")
        if status:
            queryset = queryset.filter(status=status)

        exclude_statuses = request.query_params.get("exclude_statuses")
        if exclude_statuses:
            statuses = [s.strip() for s in exclude_statuses.split(",")]
            queryset = queryset.exclude(status__in=statuses)

        date_order = request.query_params.get("date_order")
        if date_order in {"recent", "recentes", "mais_recentes", "desc"}:
            queryset = queryset.order_by("-trip_date", "-route__departure_time", "-id")
        elif date_order in {"distant", "distantes", "mais_distantes", "asc"}:
            queryset = queryset.order_by("trip_date", "route__departure_time", "id")

        return queryset
