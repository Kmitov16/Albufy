"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function Login() {
  const router = useRouter();
  const [error, setError] = useState(null);

  // Function to initiate the Spotify login process
  const handleSpotifyLogin = () => {
    const clientId = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID;
    const redirectUri = process.env.NEXT_PUBLIC_SPOTIFY_REDIRECT_URI;
    const scope =
      "user-read-private user-read-email playlist-modify-public playlist-modify-private";

    const authUrl = `https://accounts.spotify.com/authorize?client_id=${clientId}&response_type=code&redirect_uri=${redirectUri}&scope=${encodeURIComponent(
      scope
    )}`;

    window.location.href = authUrl;
  };

  // This hook is used to handle the Spotify callback once user is redirected back
  useEffect(() => {
    async function fetchToken() {
      const code = new URLSearchParams(window.location.search).get("code");
      if (!code) return;

      try {
        // Send the code to the backend to get the access token and JWT token
        const res = await fetch(
          `http://localhost:8000/api/spotify-callback/?code=${code}`
        );
        const data = await res.json();

        // Check if the response contains an access token and store it
        if (data.access_token && data.jwt_token) {
          // Store the tokens and user info in localStorage
          localStorage.setItem("access_token", data.access_token);
          localStorage.setItem("refresh_token", data.refresh_token);
          localStorage.setItem("jwt_token", data.jwt_token);
          localStorage.setItem("user", JSON.stringify(data.user));

          // Redirect to the dashboard (or any other page after successful login)
          router.push("/");
        } else {
          // If the tokens are not present in the response, show error
          setError("Failed to authenticate with Spotify");
        }
      } catch (err) {
        console.error("OAuth Error:", err);
        setError("Something went wrong");
      }
    }

    fetchToken();
  }, [router]);

  return (
    <div className="flex justify-center items-center h-screen bg-gradient-to-br from-green-600 to-black p-4">
      <div className="bg-black/80 border border-[#1a1a1a] p-8 rounded-xl shadow-lg w-80 text-white">
        <h2 className="text-2xl font-bold mb-4 text-center">Log in with Spotify</h2>
        
        {error && (
          <p className="text-red-500 text-sm mb-3 text-center">{error}</p>
        )}

        <div className="flex justify-center">
          <button
            onClick={handleSpotifyLogin}
            className="w-40 cursor-pointer bg-green-500 p-2 rounded-xl hover:bg-green-400 transition duration-300 text-white"
          >
            Login with Spotify
          </button>
        </div>
      </div>
    </div>
  );
}
