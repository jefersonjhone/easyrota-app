// if VITE_API_URL is not set, default to /api that is proxied by the backend
// and avoid CORS issues

export const API_URL =
  import.meta.env.VITE_API_URL ?? "/api";