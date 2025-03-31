from django.urls import path
from . import views

urlpatterns = [
    path('spotify-login/', views.SpotifyLoginView.as_view(), name='spotify-login'),
    path('callback/', views.SpotifyCallbackView.as_view(), name='spotify-callback'),
    path('playlist-request/', views.PlaylistRequestView.as_view(), name='playlist-request'),
    path('create-spotify-playlist/', views.CreateSpotifyPlaylistView.as_view(), name='create-spotify-playlist'),
]
