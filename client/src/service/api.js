import axios from "axios";

// 🔥 Always prefer env variable (important for Render)
const BASE_URL = process.env.REACT_APP_API_URL;

// 🛑 If env is missing, log error clearly
if (!BASE_URL) {
  console.error("❌ REACT_APP_API_URL is NOT set in environment variables");
}

console.log("✅ API BASE URL:", BASE_URL);

// Create axios instance
const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// 🔐 Attach token automatically
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// ⚠️ Handle errors globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.log("❌ API ERROR:", error?.response || error);

    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      window.location.href = "/login";
    }

    return Promise.reject(error);
  }
);

export default api;