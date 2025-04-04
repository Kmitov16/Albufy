"use client";
import { useState, useEffect } from "react";
import apiFetch from "@/app/apifetch";

export default function PlaylistForm() {
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [finalPlaylist, setFinalPlaylist] = useState([]);
  const [selectedSongIds, setSelectedSongIds] = useState([]);

  useEffect(() => {
    // Get selected songs from localStorage
    const storedSongs = localStorage.getItem("selected_song_ids");
    if (storedSongs) {
      const parsedSongs = JSON.parse(storedSongs);
      setSelectedSongIds(parsedSongs);
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const accessToken = localStorage.getItem("access");
    if (!accessToken) {
      console.error("No access token available!");
      setLoading(false);
      return;
    }

    const data = {
      song_ids: selectedSongIds,
      description: description,
    };

    try {
      const res = await apiFetch("http://127.0.0.1:8000/api/playlist-request/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(data),
      });

      const responseData = await res.json();
      if (res.ok) {
        console.log("Generated Playlist:", responseData.song_ids);
        setFinalPlaylist(responseData.song_ids); // Show the generated playlist
      } else {
        console.error("Error generating playlist:", responseData);
      }
    } catch (error) {
      console.error("Request failed:", error);
    }

    localStorage.removeItem("selected_song_ids"); // Clear selected songs from localStorage
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-600 to-black p-4">
      <div className="w-full max-w-md bg-black/70 p-6 rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold text-white text-center mb-6">
          Create a Spotify Playlist
        </h2>

        <form onSubmit={handleSubmit}>
          <input
            className="w-full bg-black/70 p-4 text-white rounded-lg border border-gray-900 mb-4"
            type="text"
            placeholder="Describe your playlist..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <button
            type="submit"
            className="w-full px-6 cursor-pointer py-3 bg-green-700 text-white rounded-lg hover:bg-green-600 transition duration-300 disabled:opacity-50"
            disabled={loading || selectedSongIds.length !== 5 || !description}
          >
            {loading ? "Generating..." : "Generate Playlist"}
          </button>
        </form>

        {finalPlaylist.length > 0 && (
          <div className="mt-6">
            <h3 className="text-xl text-white text-center">Your Final Playlist</h3>
            <ul className="text-white text-center mt-2">
              {finalPlaylist.map((songId, index) => (
                <li key={index} className="py-1">{songId}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
