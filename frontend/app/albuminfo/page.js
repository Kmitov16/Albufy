"use client";
import { useState, useEffect } from "react";

export default function PlaylistForm() {
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [finalPlaylist, setFinalPlaylist] = useState([]);

  useEffect(() => {
    // Fetch selected songs from local storage (set in the previous step)
    const storedSongs = localStorage.getItem("selected_songs");
    if (storedSongs) {
      setFinalPlaylist(JSON.parse(storedSongs));
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const authToken = localStorage.getItem("access"); // User authentication token
    if (!authToken) {
      console.error("User is not authenticated.");
      setLoading(false);
      return;
    }

    // Prepare request body
    const data = {
      song_ids: finalPlaylist, // Send the selected song IDs
      description: description, // Send the description
    };

    try {
      const res = await fetch("http://127.0.0.1:8000/api/playlist-request/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(data),
      });

      const responseData = await res.json();
      if (res.ok) {
        console.log("Generated Playlist:", responseData.song_ids);
        setFinalPlaylist(responseData.song_ids); // Store AI-generated playlist
      } else {
        console.error("Error generating playlist:", responseData);
      }
    } catch (error) {
      console.error("Request failed:", error);
    }

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
            disabled={loading}
            className="w-full px-6 cursor-pointer py-3 bg-green-700 text-white rounded-lg hover:bg-green-600 transition duration-300 disabled:opacity-50"
          >
            {loading ? "Creating..." : "Generate Playlist"}
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
