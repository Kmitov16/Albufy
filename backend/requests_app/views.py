import requests
import os
from django.conf import settings
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
import openai
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.generics import CreateAPIView
from .models import PlaylistRequest
from .serializers import PlaylistRequestSerializer

SPOTIFY_CLIENT_SECRET = os.getenv("NEXT_PUBLIC_SPOTIFY_CLIENT_SECRET")
SPOTIFY_CLIENT_ID = os.getenv("NEXT_PUBLIC_SPOTIFY_CLIENT_ID")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
SPOTIFY_AUTH_URL = "https://accounts.spotify.com/authorize"
SPOTIFY_TOKEN_URL = "https://accounts.spotify.com/api/token"
SPOTIFY_API_BASE_URL = "https://api.spotify.com/v1/"

class PlaylistRequestView(CreateAPIView):
    queryset = PlaylistRequest.objects.all()
    serializer_class = PlaylistRequestSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        """Handles playlist request creation and OpenAI recommendations."""
        playlist_request = serializer.save(user=self.request.user)

        # Generate recommendations based on the description and the 5 songs
        recommendations = self.post(
            playlist_request.song_ids, playlist_request.description
        )

        # Combine the 5 picked songs with the recommended ones
        final_playlist = playlist_request.song_ids + recommendations[:15]  # Limit to 10 songs
        playlist_request.song_ids = final_playlist
        playlist_request.save()

    def post(self, request):
        description = request.data.get("description")
        song_ids = request.data.get("song_ids")
        """Uses OpenAI API to recommend songs based on user selection + description."""
        song_list = ", ".join(song_ids)
        prompt = (
            f"The user has selected these 5 songs: {song_list}. "
            f"They want a playlist with this vibe: {description}. "
            f"Recommend 15 more songs that match the mood."
        )

        response = openai.ChatCompletion.create(
            model="gpt-4",
            messages=[{"role": "user", "content": prompt}]
        )

        return response["choices"][0]["message"]["content"].split("\n")

class SpotifyLoginView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        """Generates the Spotify login URL."""
        scope = "playlist-modify-public playlist-modify-private"
        auth_url = (
            f"{SPOTIFY_AUTH_URL}?client_id={SPOTIFY_CLIENT_ID}"
            f"&response_type=code&redirect_uri={settings.SPOTIFY_REDIRECT_URI}"
            f"&scope={scope}"
        )
        return Response({"auth_url": auth_url})


class SpotifyCallbackView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        """Handles Spotify OAuth2 callback and retrieves access token."""
        code = request.GET.get("code")
        if not code:
            return Response({"error": "No code provided"}, status=400)

        data = {
            "grant_type": "authorization_code",
            "code": code,
            "redirect_uri": settings.SPOTIFY_REDIRECT_URI,
            "client_id": SPOTIFY_CLIENT_ID,
            "client_secret": settings.SPOTIFY_CLIENT_SECRET,
        }
        headers = {"Content-Type": "application/x-www-form-urlencoded"}

        response = requests.post(SPOTIFY_TOKEN_URL, data=data, headers=headers)
        token_info = response.json()

        return Response(token_info)

class CreateSpotifyPlaylistView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        """Creates a playlist on Spotify using the user's access token."""
        access_token = request.data.get("access_token")
        name = request.data.get("name")
        track_ids = request.data.get("track_ids")  # Now includes the original 5 songs + AI picks

        if not access_token or not name or not track_ids:
            return Response({"error": "Missing required fields"}, status=400)

        playlist_id = self.create_spotify_playlist(access_token, name, track_ids)

        return Response({"playlist_id": playlist_id})

    def create_spotify_playlist(self, access_token, name, track_ids):
        """Creates a new Spotify playlist and adds tracks."""
        headers = {"Authorization": f"Bearer {access_token}", "Content-Type": "application/json"}

        # Get user ID
        user_resp = requests.get(SPOTIFY_API_BASE_URL + "me", headers=headers)
        user_id = user_resp.json()["id"]

        # Create playlist
        playlist_data = {"name": name, "public": False}
        playlist_resp = requests.post(
            SPOTIFY_API_BASE_URL + f"users/{user_id}/playlists",
            headers=headers,
            json=playlist_data,
        )
        playlist_id = playlist_resp.json()["id"]

        # Add tracks
        track_uris = [f"spotify:track:{track_id}" for track_id in track_ids]
        requests.post(
            SPOTIFY_API_BASE_URL + f"playlists/{playlist_id}/tracks",
            headers=headers,
            json={"uris": track_uris},
        )

        return playlist_id
