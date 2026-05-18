from rest_framework import filters 


class FilterTripViewSet(filters.BaseFilterBackend):
    """A filter backend for the TripViewSet that allows filtering 
    by status and excluding statuses."""
    
    def filter_queryset(self, request, queryset, view):
        """define queryset filtering logic by status and 
        exclude_statuses query parameters"""
        
        status = request.query_params.get("status")
        if status:
            return queryset.filter(status=status)
        
        exclude_statuses = request.query_params.get("exclude_statuses")    
        if exclude_statuses:
            statuses = [s.strip() for s in exclude_statuses.split(",")]
            queryset = queryset.exclude(status__in=statuses)
        return queryset