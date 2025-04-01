import requests
import os
from django.conf import settings
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
import openai
from django.contrib.auth.models import User
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.generics import CreateAPIView, ListAPIView
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

        # Generate recommendations
        recommendations = self.generate_recommendations(
            playlist_request.song_ids, playlist_request.description
        )

        # Combine the 5 picked songs with the recommended ones
        final_playlist = playlist_request.song_ids + recommendations[:15]  # Limit to 15 AI picks
        playlist_request.song_ids = final_playlist
        playlist_request.save()

    def generate_recommendations(self, song_ids, description):
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


class SpotifyAuthCallback(APIView):
    def get(self, request):
        code = request.GET.get("code")
        if not code:
            return Response({"error": "Authorization code missing"}, status=400)

        # Spotify API credentials
        client_id = settings.SPOTIFY_CLIENT_ID
        client_secret = settings.SPOTIFY_CLIENT_SECRET
        redirect_uri = settings.SPOTIFY_REDIRECT_URI

        # Exchange authorization code for access token
        token_url = "https://accounts.spotify.com/api/token"
        payload = {
            "grant_type": "authorization_code",
            "code": code,
            "redirect_uri": redirect_uri,
            "client_id": client_id,
            "client_secret": client_secret,
        }

        headers = {"Content-Type": "application/x-www-form-urlencoded"}
        token_response = requests.post(token_url, data=payload, headers=headers)
        token_data = token_response.json()

        if "access_token" not in token_data:
            return Response({"error": "Failed to get Spotify token"}, status=400)

        # Fetch user info from Spotify
        user_info_url = "https://api.spotify.com/v1/me"
        headers = {"Authorization": f"Bearer {token_data['access_token']}"}
        user_response = requests.get(user_info_url, headers=headers)
        user_data = user_response.json()

        if "id" not in user_data:
            return Response({"error": "Failed to get user info from Spotify"}, status=400)

        # Get or create user in Django
        user, created = User.objects.get_or_create(
            username=user_data["id"],
            defaults={"email": user_data.get("email", "")},
        )

        # Generate JWT token for user
        refresh = RefreshToken.for_user(user)
        jwt_access_token = str(refresh.access_token)

        return Response({
            "access_token": token_data["access_token"],
            "refresh_token": token_data["refresh_token"],
            "jwt_token": jwt_access_token,
            "user": {
                "id": user.id,
                "username": user.username,
                "password": user.password,
            },
        })


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
    

class SpotifyAuthView(APIView):
    def post(self, request):
        code = request.data.get("code")
        redirect_uri = "http://localhost:3000/albuminfo"  # Must match Spotify settings

        token_url = "https://accounts.spotify.com/api/token"
        client_id = os.getenv("SPOTIFY_CLIENT_ID")
        client_secret = os.getenv("SPOTIFY_CLIENT_SECRET")

        payload = {
            "grant_type": "authorization_code",
            "code": code,
            "redirect_uri": redirect_uri,
            "client_id": client_id,
            "client_secret": client_secret,
        }

        headers = {"Content-Type": "application/x-www-form-urlencoded"}
        response = requests.post(token_url, data=payload, headers=headers)
        spotify_data = response.json()

        if "access_token" not in spotify_data:
            return Response({"error": "Invalid Spotify Auth"}, status=400)

        access_token = spotify_data["access_token"]
        refresh_token = spotify_data["refresh_token"]

        # Fetch user data from Spotify
        spotify_user_url = "https://api.spotify.com/v1/me"
        headers = {"Authorization": f"Bearer {access_token}"}
        spotify_user_data = requests.get(spotify_user_url, headers=headers).json()

        spotify_id = spotify_user_data["id"]
        email = spotify_user_data.get("email", f"{spotify_id}@spotify.com")

        # Check if user exists, else create new user
        user, created = User.objects.get_or_create(username=spotify_id, defaults={"email": email})

        # Generate JWT Token
        refresh = RefreshToken.for_user(user)

        return Response({
            "jwt_access": str(refresh.access_token),
            "jwt_refresh": str(refresh),
            "spotify_access_token": access_token,
            "spotify_refresh_token": refresh_token,
        })


class PlaylistListView(ListAPIView):
    queryset = PlaylistRequest.objects.all()
    serializer_class = PlaylistRequestSerializer
    permission_classes = [AllowAny]