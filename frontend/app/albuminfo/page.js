"use client";
import { useState } from "react";

export default function PlaylistForm() {
  const [description, setDescription] = useState(""); // For capturing the playlist description input
  const [loading, setLoading] = useState(false); // To track the loading state during API call
  const [playlistLink, setPlaylistLink] = useState(""); // To store the generated playlist link after success

  // Handle form submission and send description to the backend
  const handleSubmit = async (e) => {
    e.preventDefault(); // Prevent default form submission behavior
    setLoading(true); // Set loading to true to indicate that the request is in progress

    // Make the POST request to the backend API
    const res = await fetch("http://localhost:8000/api/create-playlist/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json", // Content-Type is application/json
      },
      body: JSON.stringify({ description }), // Send the description in the request body as JSON
    });

    // Parse the JSON response from the backend
    const data = await res.json();

    // If successful, store the playlist URL to display the link
    if (res.ok) {
      setPlaylistLink(data.playlist_url);
    } else {
      console.error("Error creating playlist:", data); // Error handling in case of failure
    }

    setLoading(false); // Set loading to false after the request is complete
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-600 to-black p-4">
      <div className="w-full max-w-md bg-black/70 p-6 rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold text-white text-center mb-6">
          Create a Spotify Playlist
        </h2>

        {/* Form to submit playlist description */}
        <form onSubmit={handleSubmit}>
          {/* Input field to enter playlist description */}
          <input
            className="w-full bg-black/70 p-4 text-white rounded-lg border border-gray-900 mb-4"
            type="text"
            placeholder="Describe your playlist..."
            value={description}
            onChange={(e) => setDescription(e.target.value)} // Update the description state as the user types
          />

          {/* Submit button to create the playlist */}
          <button
            type="submit"
            disabled={loading} // Disable the button when loading
            className="w-full px-6 cursor-pointer py-3 bg-green-700 text-white rounded-lg hover:bg-green-600 transition duration-300 disabled:opacity-50"
          >
            {loading ? "Creating..." : "Generate Playlist"}
          </button>
        </form>

        {/* Display the playlist link after the request is successful */}
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
