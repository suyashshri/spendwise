export const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

export interface BackendErrorBody {
  error?: { message?: string; code?: string };
}
