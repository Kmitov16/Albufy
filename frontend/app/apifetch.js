const API_URL = "http://127.0.0.1:8000/auth";

let isRefreshing = false;
let refreshSubscribers = [];

const onRefreshed = (token) => {
  refreshSubscribers.forEach((callback) => callback(token));
  refreshSubscribers = [];
};

export default async function apiFetch(url, options = {}) {
  const accessToken = localStorage.getItem("access");
  const refreshToken = localStorage.getItem("refresh");

  const attachAuthHeader = (token) => ({
    ...options.headers,
    Authorization: `Bearer ${token}`,
  });

  const makeRequest = async (token) =>
    fetch(url, {
      ...options,
      headers: attachAuthHeader(token),
    });

  try {
    if (!accessToken) throw new Error("No access token found");

    let response = await makeRequest(accessToken);

    if (response.status !== 401) return response;

    // 401 means token is expired, try to refresh
    if (!refreshToken) throw new Error("No refresh token available");

    if (!isRefreshing) {
      isRefreshing = true;

      try {
        const refreshResponse = await fetch(`${API_URL}/token/refresh/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refresh: refreshToken }),
        });

        if (!refreshResponse.ok) throw new Error("Failed to refresh token");

        const { access: newAccessToken } = await refreshResponse.json();
        localStorage.setItem("access", newAccessToken);
        onRefreshed(newAccessToken);

        return makeRequest(newAccessToken); // Retry with new token
      } catch (err) {
        refreshSubscribers = [];
        localStorage.clear();
        window.location.href = "/login";
        throw err;
      } finally {
        isRefreshing = false;
      }
    } else {
      // Wait for ongoing refresh
      const newToken = await new Promise((resolve) =>
        refreshSubscribers.push(resolve)
      );
      return makeRequest(newToken); // Retry with new token
    }
  } catch (error) {
    if (
      error.message.includes("No access token") ||
      error.message.includes("Failed to refresh token")
    ) {
      window.location.href = "/login";
    }
    throw error;
  }
}
