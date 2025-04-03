"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function SpotifyCallback() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchToken() {
      const code = searchParams.get("code");
      if (!code) return;

      try {
        const res = await fetch("http://127.0.0.1:8000/api/spotify-callback/", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code }),
        });

        const data = await res.json();

        if (res.ok) {
          localStorage.setItem("access", data.jwt_access_token);
          localStorage.setItem("refresh", data.jwt_refresh_token);
          localStorage.setItem("spotify_access_token", data.spotify_access_token);
          localStorage.setItem("spotify_refresh_token", data.spotify_refresh_token);

          router.push("/"); // Redirect after login
        } else {
          setError(data.error || "Authentication failed");
        }
      } catch (err) {
        console.error("OAuth Error:", err);
        setError("Something went wrong");
      }
    }

    fetchToken();
  }, [router]);

  return (
    <div className="flex justify-center items-center h-screen bg-black text-white">
      <h2>Logging in...</h2>
      {error && <p className="text-red-500">{error}</p>}
    </div>
  );
}
