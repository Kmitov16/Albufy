import requests
import os
from dotenv import load_dotenv
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
from django.middleware.csrf import get_token
from django.http import JsonResponse

load_dotenv()

SPOTIFY_CLIENT_SECRET = os.getenv("SPOTIFY_CLIENT_SECRET")
SPOTIFY_CLIENT_ID = os.getenv("SPOTIFY_CLIENT_ID")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
SPOTIFY_AUTH_URL = "https://accounts.spotify.com/authorize"
SPOTIFY_TOKEN_URL = "https://accounts.spotify.com/api/token"
SPOTIFY_API_BASE_URL = "https://api.spotify.com/v1/"
SPOTIFY_REDIRECT_URI = os.getenv("SPOTIFY_REDIRECT_URI")

class SpotifyLoginView(APIView):
    """Generates the Spotify login URL."""
    permission_classes = [AllowAny]

    def get(self, request):
        scope = "user-read-private user-read-email playlist-modify-public playlist-modify-private"
        auth_url = (
            f"{SPOTIFY_AUTH_URL}?client_id={SPOTIFY_CLIENT_ID}"
            f"&response_type=code&redirect_uri={settings.SPOTIFY_REDIRECT_URI}"
            f"&scope={scope}"
        )
        return Response({"auth_url": auth_url})


class SpotifyAuthCallback(APIView):
    """Handles Spotify OAuth callback & user authentication."""
    permission_classes = [AllowAny]

    def post(self, request):  # Allow POST requests
        code = request.data.get("code")  # Get code from request body
        if not code:
            return Response({"error": "Authorization code missing"}, status=400)

        return self.handle_authentication(code)

    def handle_authentication(self, code):
        """Common method to handle token exchange and user authentication."""
        # Exchange authorization code for tokens
        token_data = self.exchange_code_for_tokens(code)
        if "access_token" not in token_data:
            return Response({"error": "Failed to retrieve access token"}, status=400)

        access_token = token_data["access_token"]
        refresh_token = token_data.get("refresh_token")

        # Fetch user info from Spotify
        user_data = self.get_spotify_user(access_token)
        if "id" not in user_data:
            return Response({"error": "Failed to retrieve Spotify user info"}, status=400)

        user, created = User.objects.get_or_create(
            username=user_data["id"],
            defaults={"email": user_data.get("email", "")}
        )

        # Generate JWT tokens for your app
        refresh = RefreshToken.for_user(user)
        jwt_access_token = str(refresh.access_token)
        jwt_refresh_token = str(refresh)

        return Response({
            "spotify_access_token": access_token,
            "spotify_refresh_token": refresh_token,
            "user": {
                "username": user.username,
                "email": user.email,
            },
            "access": jwt_access_token,
            "refresh": jwt_refresh_token,
        })


    def exchange_code_for_tokens(self, code):
        """Exchanges authorization code for Spotify access/refresh tokens."""
        payload = {
            "grant_type": "authorization_code",
            "code": code,
            "redirect_uri": SPOTIFY_REDIRECT_URI,
            "client_id": SPOTIFY_CLIENT_ID,
            "client_secret": SPOTIFY_CLIENT_SECRET,
        }
        headers = {"Content-Type": "application/x-www-form-urlencoded"}
        response = requests.post(SPOTIFY_TOKEN_URL, data=payload, headers=headers)
        token_data = response.json()

        print("Spotify Token Response:", token_data)  # Debugging log
        return token_data

    def get_spotify_user(self, access_token):
        """Fetches Spotify user profile using access token."""
        headers = {"Authorization": f"Bearer {access_token}"}
        response = requests.get(f"{SPOTIFY_API_BASE_URL}me", headers=headers)
        return response.json()


class SpotifyAuthView(APIView):
    """Handles Spotify authentication and issues JWT tokens."""
    permission_classes = [AllowAny]

    def post(self, request):
        code = request.data.get("code")
        if not code:
            return Response({"error": "Authorization code is required"}, status=400)

        # Exchange authorization code for Spotify tokens
        token_data = self.exchange_code_for_tokens(code)
        if "access_token" not in token_data:
            return Response({"error": "Failed to retrieve access token"}, status=400)

        access_token = token_data["access_token"]
        refresh_token = token_data.get("refresh_token")

        # Fetch user data from Spotify
        user_data = self.get_spotify_user(access_token)
        if "id" not in user_data:
            return Response({"error": "Failed to retrieve Spotify user info"}, status=400)

        # Create or get user
        user, created = User.objects.get_or_create(
            username=user_data["id"],
            defaults={"email": user_data.get("email", "")}
        )

        # Generate JWT tokens
        refresh = RefreshToken.for_user(user)
        jwt_access_token = str(refresh.access_token)
        jwt_refresh_token = str(refresh)

        # Return tokens in JSON response (instead of setting HTTP-only cookies)
        return Response({
            "spotify_access_token": access_token,
            "spotify_refresh_token": refresh_token,
            "user": {"username": user.username, "email": user.email},
            "access": jwt_access_token,
            "refresh": jwt_refresh_token,
        })



class CreateSpotifyPlaylistView(APIView):
    """Creates a playlist on Spotify for the authenticated user."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        access_token = request.data.get("access")
        name = request.data.get("name")
        track_ids = request.data.get("track_ids")

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

class PlaylistRequestView(CreateAPIView):
    """Handles playlist request creation and OpenAI recommendations."""
    queryset = PlaylistRequest.objects.all()
    serializer_class = PlaylistRequestSerializer
    permission_classes = [AllowAny]

    def post(self, request):
        song_ids = request.data.get("song_ids")
        description = request.data.get("description")
        playlist_request = PlaylistRequestSerializer.objects.create(
            song_ids=self.song_ids,
            description=self.description
        )
        playlist_request.save()
        
        return self.perform_create(playlist_request)

    def perform_create(self, serializer):
        # Save the initial request (user-picked songs and description)
        playlist_request = serializer.save(user=self.request.user)

        # Generate recommendations based on input
        recommendations = self.generate_recommendations(
            playlist_request.song_ids,
            playlist_request.description
        )

        # Combine selected + recommended (max 15 recommendations)
        final_playlist = playlist_request.song_ids + recommendations[:15]
        playlist_request.song_ids = final_playlist
        playlist_request.save()

    def generate_recommendations(self, song_ids, description):
        song_list = ", ".join(song_ids)
        prompt = (
            f"The user picked these songs: {song_list}.\n"
            f"They want this vibe: '{description}'.\n"
            f"Recommend 15 more Spotify songs (song name and artist) considering the given description and songs. Return one per line."
        )

        response = openai.ChatCompletion.create(
            model="gpt-3.5",
            messages=[{"role": "user", "content": prompt}]
        )

        recommendations_text = response["choices"][0]["message"]["content"]
        recommended_songs = [
            line.strip() for line in recommendations_text.split("\n") if line.strip()
        ]

        return recommended_songs


class PlaylistListView(ListAPIView):
    """Lists all playlist requests."""
    queryset = PlaylistRequest.objects.all()
    serializer_class = PlaylistRequestSerializer
    permission_classes = [AllowAny]