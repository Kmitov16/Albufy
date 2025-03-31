"use client";
import React from "react";
import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-green-600 to-black relative">
      {/* Top Right Buttons */}
      <div className="absolute top-4 right-4 flex space-x-4">
        <Link href="/login">
          <button className="px-6 py-3 cursor-pointer bg-green-600 text-white rounded-3xl hover:bg-green-500 transition duration-300">
            Log in
          </button>
        </Link>
        <Link href="/signup">
          <button className="px-6 py-3 cursor-pointer bg-green-600 text-white rounded-3xl hover:bg-green-500 transition duration-300">
            Sign up
          </button>
        </Link>
      </div>

      {/* Main Content */}
      <h1 className="text-3xl font-bold text-white">Welcome to Albufy</h1>
      <Link href="/songinfo">
        <button className="mt-4 px-6 py-3 cursor-pointer bg-green-600 text-white rounded-3xl hover:bg-green-500 transition duration-300">
          Start Now
        </button>
      </Link>
    </div>
  );
}
