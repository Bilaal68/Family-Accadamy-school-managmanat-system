import axios from "axios";

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
  if (config.data instanceof FormData) {
    delete config.headers["Content-Type"];
  }
  return config;
});

export default client;
