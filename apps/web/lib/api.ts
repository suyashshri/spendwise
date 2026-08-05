import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";
import { useAuthStore } from "@/store/authStore";
import { BACKEND_URL } from "./backend";

// Calls the Express backend directly from the browser (not proxied through Next.js) — CORS on the
// backend is permissive by default and this only ever sends a Bearer token, never cookies, so no
// `credentials`/origin-allowlist wiring is needed. Only auth (login/register/refresh/logout) goes
// through Next.js route handlers, since only those need to touch the httpOnly refresh cookie.
export const api = axios.create({ baseURL: BACKEND_URL });

api.interceptors.request.use((config) => {
  const { accessToken } = useAuthStore.getState();
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

interface RetriableConfig extends InternalAxiosRequestConfig {
  _retried?: boolean;
}

let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const res = await fetch("/api/auth/refresh", { method: "POST" });
  if (!res.ok) {
    useAuthStore.getState().clearSession();
    return null;
  }
  const data = (await res.json()) as { accessToken: string };
  useAuthStore.getState().setAccessToken(data.accessToken);
  return data.accessToken;
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const config = error.config as RetriableConfig | undefined;

    if (error.response?.status !== 401 || !config || config._retried) {
      throw error;
    }
    config._retried = true;

    refreshPromise ??= refreshAccessToken().finally(() => {
      refreshPromise = null;
    });
    const token = await refreshPromise;
    if (!token) {
      throw error;
    }

    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
    return api(config);
  }
);

export function extractApiErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const message = (error.response?.data as { error?: { message?: string } } | undefined)?.error?.message;
    if (message) return message;
  }
  return "Something went wrong. Please try again.";
}
