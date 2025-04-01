"use client";

import Link from "next/link";

export default function Action() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-green-600 to-black relative">
      <div className="absolute top-4 right-4 flex space-x-4">
        <Link href="/songinfo">
          <button className="px-6 py-3 cursor-pointer bg-green-600 text-white rounded-3xl hover:bg-green-500 transition duration-300">
            Create a playlist
          </button>
        </Link>
        <Link href="/news">
          <button className="px-6 py-3 cursor-pointer bg-green-600 text-white rounded-3xl hover:bg-green-500 transition duration-300">
            View music news
          </button>
        </Link>
      </div>
    </div>
  );
}
