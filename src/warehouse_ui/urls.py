from django.urls import path
from .views import (
    IndexView,
    LoadListCreateView,
    LoadDetailView,
    GroupListCreateView,
    GroupDetailView,
)

urlpatterns = [
    path("", IndexView.as_view(), name="index"),
    path("api/loads/", LoadListCreateView.as_view(), name="load-list"),
    path("api/loads/<str:load_id>/", LoadDetailView.as_view(), name="load-detail"),
    path("api/groups/", GroupListCreateView.as_view(), name="group-list"),
    path("api/groups/<str:group_id>/", GroupDetailView.as_view(), name="group-detail"),
]
