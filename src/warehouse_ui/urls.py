from django.urls import path
from .views import (
    IndexView,
    LoadListCreateView,
    LoadDetailView,
    GroupListCreateView,
    GroupDetailView,
    ShiftListCreateView,
    ShiftDetailView,
    ConfigView,
)

urlpatterns = [
    path("", IndexView.as_view(), name="index"),
    path("calendar/", IndexView.as_view(), name="calendar"),
    path("api/config/", ConfigView.as_view(), name="config"),
    path("api/loads/", LoadListCreateView.as_view(), name="load-list"),
    path("api/loads/<str:load_id>/", LoadDetailView.as_view(), name="load-detail"),
    path("api/groups/", GroupListCreateView.as_view(), name="group-list"),
    path("api/groups/<str:group_id>/", GroupDetailView.as_view(), name="group-detail"),
    path("api/shifts/", ShiftListCreateView.as_view(), name="shift-list"),
    path("api/shifts/<str:shift_id>/", ShiftDetailView.as_view(), name="shift-detail"),
]
