"use client";
import { useState } from "react";

export default function PlaylistForm() {
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [playlistLink, setPlaylistLink] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const res = await fetch("http://localhost:8000/api/create-playlist/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ description }),
    });

    const data = await res.json();
    setPlaylistLink(data.playlist_url);
    setLoading(false);
  };


  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-600 to-black p-4">
      <div className="w-full max-w-md bg-black/70 p-6 rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold text-white text-center mb-6">Create a Spotify Playlist</h2>
        <form onSubmit={handleSubmit}>
          {/* Input field */}
          <input
            className="w-full bg-black/70 p-4 text-white rounded-lg border border-gray-900 mb-4"
            type="text"
            placeholder="Describe your playlist..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          
          {/* Generate Playlist button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full px-6 cursor-pointer py-3 bg-green-700 text-white rounded-lg hover:bg-green-600 transition duration-300 disabled:opacity-50"
          >
            {loading ? "Creating..." : "Generate Playlist"}
          </button>
        </form>
        
        {/* Link to view the generated playlist */}
        {playlistLink && (
          <a
            href={playlistLink}
            target="_blank"
            className="block text-center text-green-500 mt-4 hover:underline"
          >
            View Playlist
          </a>
        )}
      </div>
    </div>
  );
}
