"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const checkLoginStatus = () => {
      const accessToken = localStorage.getItem("access_token");
      console.log("Token check:", accessToken); // Debugging log
      setIsLoggedIn(accessToken !== null && accessToken !== ""); // Ensure it updates
    };

    checkLoginStatus(); // Run on mount

    // Listen for changes in localStorage
    const handleStorageChange = () => checkLoginStatus();
    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  const handleLogout = () => {
    console.log("Logging out...");

    // Clear tokens
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user");

    setIsLoggedIn(false); // Update state immediately

    // Redirect to Spotify logout
    const SPOTIFY_LOGOUT_URL = "https://accounts.spotify.com/en/logout";
    const REDIRECT_AFTER_LOGOUT = window.location.origin + "/login";
    window.location.href = `${SPOTIFY_LOGOUT_URL}?continue=${encodeURIComponent(
      REDIRECT_AFTER_LOGOUT
    )}`;
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
          <>
            <Link href="/login">
              <button className="px-6 py-3 cursor-pointer bg-green-600 text-white rounded-3xl hover:bg-green-500 transition duration-300">
                Log in
              </button>
            </Link>
            <Link href="https://accounts.spotify.com/en/signup" target="_blank">
              <button className="px-6 py-3 cursor-pointer bg-green-600 text-white rounded-3xl hover:bg-green-500 transition duration-300">
                Sign up
              </button>
            </Link>
          </>
        )}
      </div>

      {/* Main Content */}
      <h1 className="text-3xl font-bold text-white">Welcome to Albufy</h1>
      <Link href="/action">
        <button className="mt-4 px-6 py-3 cursor-pointer bg-green-600 text-white rounded-3xl hover:bg-green-500 transition duration-300">
          Start Now
        </button>
      </Link>
    </div>
  );
}
