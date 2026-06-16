const API_BASE = (
  import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1"
).replace(/\/api\/v1\/?$/, "");

export function mediaUrl(path) {
  if (!path) return null;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  const normalized = path.startsWith("/") ? path.slice(1) : path;
  return `${API_BASE}/${normalized}`;
}
