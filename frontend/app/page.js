"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkLoginStatus = () => {
      const accessToken = localStorage.getItem("access");
      const refreshToken = localStorage.getItem("refresh");
      if (!accessToken || !refreshToken) {
        router.push("/login"); // Redirect if not authenticated
      } else {
        setIsLoggedIn(true);
      }
    };

    checkLoginStatus();

    // Listen for logout changes (e.g., logout from another tab)
    const handleStorageChange = () => checkLoginStatus();
    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [router]);

  const handleStartNow = () => {
    if (isLoggedIn) {
      router.push("/action"); // Redirect to the actual page
    } else {
      router.push("/login"); // Redirect to login if not authenticated
    }
  };

  const handleLogout = () => {
    console.log("Logging out...");

    // Clear tokens
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");

    setIsLoggedIn(false); // Update state immediately

    // Redirect to Spotify logout
    const SPOTIFY_LOGOUT_URL = "https://accounts.spotify.com/en/logout";
    const REDIRECT_AFTER_LOGOUT = window.location.origin + "/login";
    window.location.href = `${SPOTIFY_LOGOUT_URL}?continue=${encodeURIComponent(
      REDIRECT_AFTER_LOGOUT
    )}`;
    router.push("/login");
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
          <button
            onClick={() => router.push("/login")}
            className="px-6 py-3 cursor-pointer bg-green-600 text-white rounded-3xl hover:bg-green-500 transition duration-300"
          >
            Log in
          </button>
        )}
      </div>

      {/* Main Content */}
      <h1 className="text-3xl font-bold text-white">Welcome to Albufy</h1>
      <button
        onClick={handleStartNow}
        className={`mt-4 px-6 py-3 cursor-pointer rounded-3xl transition duration-300 ${
          isLoggedIn
            ? "bg-green-600 text-white hover:bg-green-500"
            : "bg-gray-500 text-gray-300 cursor-not-allowed"
        }`}
      >
        Start Now
      </button>
    </div>
  );
}
