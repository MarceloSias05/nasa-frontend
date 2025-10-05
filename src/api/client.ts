import axios from "axios";

// Support both Vite and CRA style env vars
const viteUrl = (import.meta as any)?.env?.VITE_API_URL;
const craUrl = process.env.REACT_APP_BACKEND_URL;
// Default to backend root so callers request '/api/v1/...' correctly
const API_BASE_URL = viteUrl || craUrl || "http://127.0.0.1:8000";

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
});

export function setApiBaseUrl(url: string) {
  if (!url) return;
  api.defaults.baseURL = url;
}

export function getApiBaseUrl() {
  return String(api.defaults.baseURL || '');
}
