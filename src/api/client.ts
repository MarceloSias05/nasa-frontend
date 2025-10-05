import axios from "axios";

// Support both Vite and CRA style env vars
const viteUrl = (import.meta as any)?.env?.VITE_API_URL;
const craUrl = process.env.REACT_APP_BACKEND_URL;
const API_BASE_URL = viteUrl || craUrl || "http://localhost:8001/api";

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
});
