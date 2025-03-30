from django.urls import path

from . import views

urlpatterns = [
    path("requests/", views.RequestListView.as_view(), name="request-list"),
    path("requests/<int:pk>/", views.RequestDetailView.as_view(), name="request-detail"),
    path("requests/<int:pk>/accept/", views.AcceptRequestView.as_view(), name="accept-request"),
    path("requests/<int:pk>/reject/", views.RejectRequestView.as_view(), name="reject-request"),
    path("requests/<int:pk>/complete/", views.CompleteRequestView.as_view(), name="complete-request"),
]
