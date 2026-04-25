from django.urls import path
from .views import RouteListCreateView, RouteDetailView

urlpatterns = [
    path('routes/', RouteListCreateView.as_view(), name='route-list-create'),
    path('routes/<int:pk>/', RouteDetailView.as_view(), name='route-detail'),
]