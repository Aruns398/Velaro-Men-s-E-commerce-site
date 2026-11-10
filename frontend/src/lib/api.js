const configuredApiUrl = import.meta.env.VITE_API_URL
  ?.trim()
  .replace(/\/+$/, "")
  .replace(/\/api$/i, "");

export const API_ORIGIN =
  configuredApiUrl ||
  (import.meta.env.DEV ? "http://localhost:5000" : window.location.origin);

export const API_URL = `${API_ORIGIN}/api`;
