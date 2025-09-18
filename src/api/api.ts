// src/api/api.ts
import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL, 
  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptor de request (para token, logs, etc.)
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Interceptor de response (manejo de errores global)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // puedes manejar errores globales aquí
    return Promise.reject(error);
  }
);

export default api;
