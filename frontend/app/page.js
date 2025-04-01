"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const router = useRouter();

  useEffect(() => {
    checkLoginStatus();

    // Listen for changes in localStorage
    const handleStorageChange = () => checkLoginStatus();
    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  // Check if user is authenticated
  const checkLoginStatus = () => {
    const jwtToken = localStorage.getItem("jwt_token");
    setIsLoggedIn(!!jwtToken); // Convert to boolean
  };

  const handleStartNow = () => {
    if (isLoggedIn) {
      router.push("/albuminfo"); // Redirect to the actual page
    } else {
      router.push("/login"); // Redirect to login if not authenticated
    }
  };

  const handleLogout = () => {
    console.log("Logging out...");

    // Clear tokens
    localStorage.removeItem("jwt_token");
    localStorage.removeItem("spotify_access_token");
    localStorage.removeItem("spotify_refresh_token");

    setIsLoggedIn(false); // Update state immediately

    // Redirect to Spotify logout
    const SPOTIFY_LOGOUT_URL = "https://accounts.spotify.com/en/logout";
    const REDIRECT_AFTER_LOGOUT = window.location.origin + "/login";
    window.location.href = `${SPOTIFY_LOGOUT_URL}?continue=${encodeURIComponent(
      REDIRECT_AFTER_LOGOUT
    )}`;
    router.push("/login"); // Redirect to login page
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-green-600 to-black relative">
      {/* Top Right Buttons */}
      <div className="absolute top-4 right-4 flex space-x-4">
        {isLoggedIn ? (
          <button
            onClick={handleLogout}
            className="px-6 py-3 cursor-pointer bg-green-600 text-white rounded-3xl hover:bg-green-500 transition duration-300"
          >
            Logout
          </button>
        ) : (
          <Link href="/login">
            <button className="px-6 py-3 cursor-pointer bg-green-600 text-white rounded-3xl hover:bg-green-500 transition duration-300">
              Log in
            </button>
          </Link>
        )}
      </div>

      {/* Main Content */}
      <h1 className="text-3xl font-bold text-white">Welcome to Albufy</h1>
      <button
        onClick={handleStartNow}
        className="mt-4 px-6 py-3 cursor-pointer bg-green-600 text-white rounded-3xl hover:bg-green-500 transition duration-300"
      >
        Start Now
      </button>
    </div>
  );
}
