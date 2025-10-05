import axios from "axios";

const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || "http://localhost:8001/api";

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
});
