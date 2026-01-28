from django.urls import path
from .views import IndexView, LoadListCreateView, LoadDetailView

urlpatterns = [
    path("", IndexView.as_view(), name="index"),
    path("api/loads/", LoadListCreateView.as_view(), name="load-list"),
    path("api/loads/<str:load_id>/", LoadDetailView.as_view(), name="load-detail"),
]
