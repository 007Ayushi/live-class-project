import axios from "axios";

// ✅ Base URL with fallback
const BASE_URL =
  process.env.REACT_APP_API_URL || "https://live-class-project.onrender.com/api";

// 🔍 Debug log (VERY IMPORTANT)
console.log("✅ API BASE URL:", BASE_URL);

// Create axios instance
const api = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
});

// Request interceptor
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

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.log("❌ API ERROR:", error?.response); // debug

    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      window.location.href = "/login";
    }

    return Promise.reject(error);
  }
);

export default api;