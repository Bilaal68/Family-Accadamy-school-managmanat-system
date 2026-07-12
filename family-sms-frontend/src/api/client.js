import axios from "axios";

import { clearTokens, getToken } from "./tokenStore";

const baseURL = (
  import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1"
).replace(/\/+$/, "");

const client = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
  },
});

client.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  if (config.data instanceof FormData) {
    delete config.headers["Content-Type"];
  }
  return config;
});

let isRefreshing = false;
let failedQueue = [];
let logoutScheduled = false;

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });

  isRefreshing = false;
  failedQueue = [];
};

client.interceptors.response.use(
  (response) => response,
  (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers["Authorization"] = `Bearer ${token}`;
            return client(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      // Only trigger one logout even if multiple 401s occur
      if (!logoutScheduled) {
        logoutScheduled = true;
        
        // Small delay to batch any concurrent 401 errors
        setTimeout(() => {
          clearTokens();
          processQueue(error, null);
          logoutScheduled = false;
          
          if (window.location.pathname !== "/login") {
            window.location.href = "/login";
          }
        }, 100);
      }
    }

    return Promise.reject(error);
  }
);

export default client;
