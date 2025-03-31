"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

export default function SpotifySearch() {
  const [query, setQuery] = useState("");
  const [songs, setSongs] = useState([]);
  const [selectedSongs, setSelectedSongs] = useState(new Set());
  const [accessToken, setAccessToken] = useState("");

  // Fetch Access Token from Spotify
  async function getAccessToken() {
    const clientId = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID;
    const clientSecret = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      console.error("Spotify API credentials missing!");
      return;
    }

    const response = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${btoa(clientId + ":" + clientSecret)}`,
      },
      body: "grant_type=client_credentials",
    });

    const data = await response.json();
    setAccessToken(data.access_token);
  }

  // Fetch token on first load
  useEffect(() => {
    getAccessToken();
  }, []);

  // Search for Songs
  async function searchSongs(e) {
    e.preventDefault();
    if (!query) return;
    if (!accessToken) {
      console.error("No access token available!");
      return;
    }

    const response = await fetch(
      `https://api.spotify.com/v1/search?q=${query}&type=track&limit=10`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    const data = await response.json();
    console.log("Spotify API Response:", data);

    setSongs(data.tracks ? data.tracks.items : []);
  }

  // Handle Checkbox Selection
  function toggleSelection(songId) {
    setSelectedSongs((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(songId)) {
        newSet.delete(songId);
      } else {
        newSet.add(songId);
      }
      return newSet;
    });
  }

  return (
    <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-green-600 to-black p-4">
      <div className="bg-black/80 border border-[#1a1a1a] p-8 rounded-xl shadow-lg w-full max-w-lg text-white">
        <h1 className="text-2xl font-bold mb-4 text-center">
          Search Songs on Spotify
        </h1>

        {/* Search Form */}
        <form onSubmit={searchSongs} className="mb-4 flex space-x-4">
          <input
            type="text"
            placeholder="Search for a song..."
            className="w-full p-2 rounded-xl bg-black/90 text-white font-bold border border-[#1a1a1a] outline-none"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button
            type="submit"
            className="w-32 cursor-pointer bg-green-500 text-white px-4 py-2 rounded-2xl hover:bg-green-600 transition duration-300"
          >
            Search
          </button>
        </form>

        {/* Song List */}
        <ul>
          {songs.map((song) => (
            <li
              key={song.id}
              className="flex items-center justify-between p-2 border-b border-[#1a1a1a]"
            >
              <div>
                <p className="font-semibold">{song.name}</p>
                <p className="text-sm text-gray-500">
                  {song.artists.map((a) => a.name).join(", ")}
                </p>

                {/* Audio Player or Embedded Spotify Player */}
                {song.preview_url ? (
                  <audio controls className="mt-2">
                    <source src={song.preview_url} type="audio/mpeg" />
                    Your browser does not support the audio element.
                  </audio>
                ) : song.external_urls?.spotify ? (
                  <iframe
                    src={`https://open.spotify.com/embed/track/${song.id}`}
                    width="300"
                    height="80"
                    frameBorder="0"
                    allow="encrypted-media"
                    className="mt-2"
                  ></iframe>
                ) : (
                  <p className="text-sm text-red-500">No preview available</p>
                )}
              </div>

              {/* Checkbox for selection */}
              <input
                type="checkbox"
                checked={selectedSongs.has(song.id)}
                onChange={() => toggleSelection(song.id)}
                className="cursor-pointer ml-4 h-5 w-5 text-green-600 border-gray-300 rounded peer-checked:bg-green-500 focus:ring-green-500"
              />
            </li>
          ))}
        </ul>

        {/* Continue Button */}
        <div className="flex justify-between mt-4">
          <Link href="/albuminfo">
            <button
              className={`w-32 px-6 py-3 rounded-3xl transition duration-300 ${
                selectedSongs.size >= 5
                  ? "bg-green-600 text-white hover:bg-green-500 cursor-pointer"
                  : "bg-gray-500 text-gray-300 cursor-not-allowed"
              }`}
              disabled={selectedSongs.size < 5}
            >
              Continue
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
