"use client";

import { useEffect, useState } from "react";

// Define API key for the NewsAPI
const apiKey = "9827c63555714b79adb5ed9b39fb9fc8";
const url = `https://newsapi.org/v2/everything?q=album&apiKey=${apiKey}`;

export default function News() {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [visibleNews, setVisibleNews] = useState(8); // Initially show 8 articles

  // Fetch music news articles
  const fetchNews = async () => {
    try {
      const response = await fetch(url);
      const data = await response.json();
      setNews(data.articles || []);
    } catch (error) {
      console.error("Error fetching news:", error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch music news when the component loads
  useEffect(() => {
    fetchNews();
  }, []);

  // Load more news articles
  const loadMoreNews = () => {
    setVisibleNews((prev) => prev + 4); // Load 8 more articles
  };

  // Show fewer news articles
  const showLessNews = () => {
    setVisibleNews((prev) => prev - 4); // Reset back to the initial 8 articles
  };

  return (
    <div className="flex flex-col items-center min-h-screen bg-gradient-to-br from-green-600 to-black p-4">
      <h1 className="text-white text-3xl font-bold mb-6">Music News</h1>

      {loading ? (
        <p className="text-white">Loading news...</p>
      ) : news.length > 0 ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 w-full max-w-7xl">
            {news.slice(0, visibleNews).map((article, index) => (
              <div
                key={index}
                className="bg-black/80 p-6 rounded-lg shadow-lg border-l-4 border-green-500 w-full"
              >
                <h2 className="text-xl font-bold text-white">
                  {article.title}
                </h2>
                {article.description && (
                  <p className="text-gray-300 mt-2">{article.description}</p>
                )}

                <a
                  href={article.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-green-600 font-semibold mt-2 inline-block"
                >
                  Read more →
                </a>
              </div>
            ))}
          </div>

          {/* Toggle News Buttons */}
          <div className="mt-6 flex items-center justify-center space-x-4">
            {/* "See More" button */}
            {visibleNews < news.length && (
              <button
                onClick={loadMoreNews}
                className="bg-transparent text-green-400 cursor-pointer flex items-center hover: hover:text-green-600 rounded-full"
              >
                <span className="mr-2">See More</span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  width="24"
                  height="24"
                  fill="currentColor"
                  className="text-white"
                >
                  <path fill="none" d="M0 0h24v24H0z" />
                  <path d="M12 4v16m8-8H4" />
                </svg>
              </button>
            )}

            {/* "See Less" button */}
            {visibleNews > 8 && (
              <button
                onClick={showLessNews}
                className=" bg-transparent text-green-400 cursor-pointer flex items-center hover: hover:text-green-600 rounded-full"
              >
                <span className="mr-2">See Less</span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  width="24"
                  height="24"
                  fill="currentColor"
                  className="text-white"
                >
                  <path fill="none" d="M0 0h24v24H0z" />
                  <path d="M12 4v16m8-8H4" />
                </svg>
              </button>
            )}
          </div>
        </>
      ) : (
        <p className="text-white">No news found.</p>
      )}
    </div>
  );
}
