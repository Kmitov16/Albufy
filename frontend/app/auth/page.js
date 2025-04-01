"use client";

import { useRouter } from "next/router";
import { useEffect } from "react";

export default function SpotifyCallback() {
  const router = useRouter();

  useEffect(() => {
    async function fetchAccessToken() {
      const code = new URLSearchParams(window.location.search).get("code");
      if (!code) {
        console.error("No authorization code found!");
        return;
      }

      try {
        const response = await fetch(
          `http://localhost:8000/api/spotify-callback/?code=${code}`
        );
        const data = await response.json();

        if (data.access_token) {
          // Store token & user info in localStorage
          localStorage.setItem("access_token", data.access_token);
          localStorage.setItem("refresh_token", data.refresh_token);
          localStorage.setItem("user", JSON.stringify(data.user));

          // Redirect to homepage
          router.push("/");
        } else {
          console.error("Failed to retrieve access token");
        }
      } catch (error) {
        console.error("OAuth Error:", error);
      }
    }

    fetchAccessToken();
  }, [router]);

  return (
    <div className="text-white text-center mt-10">
      <h1>Logging in...</h1>
    </div>
  );
}
