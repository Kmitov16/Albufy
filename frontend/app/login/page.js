"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function Login() {
  const router = useRouter();
  const [error, setError] = useState(null);

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

  useEffect(() => {
    async function fetchToken() {
      const code = new URLSearchParams(window.location.search).get("code");
      if (!code) return;

      try {
        const res = await fetch("http://localhost:8000/api/spotify-login/", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code }),
        });
        
        const data = await res.json();

        if (res.ok) {
          localStorage.setItem("access", data.jwt_access);
          localStorage.setItem("spotify_access_token", data.spotify_access_token);
          localStorage.setItem("spotify_refresh_token", data.spotify_refresh_token);

          router.push("/"); // Redirect to dashboard after login
        } else {
          setError(data.error || "Failed to authenticate with Spotify");
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
        <h2 className="text-2xl font-bold mb-4 text-center">
          Log in with Spotify
        </h2>
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
