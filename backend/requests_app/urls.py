from django.urls import path
from . import views

urlpatterns = [
    path('spotify-login/', views.SpotifyAuthView.as_view(), name='spotify-login'),
    path('spotify-callback/', views.SpotifyAuthCallback.as_view(), name='spotify-callback'),
    path('playlist-request/', views.PlaylistRequestView.as_view(), name='playlist-request'),
    path('create-spotify-playlist/', views.CreateSpotifyPlaylistView.as_view(), name='create-spotify-playlist'),
    path('playlist-list', views.PlaylistListView.as_view(), name='playlist-list'),
]
