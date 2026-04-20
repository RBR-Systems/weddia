const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "";
const TOKEN_KEY = "rbr_token";

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    method: string,
    path: string,
    detail: string,
  ) {
    super(`API ${method} ${path} → ${status}: ${detail}`);
    this.name = "ApiError";
  }
}

// AuthContext registers this to force logout on 401
let onUnauthorized: (() => void) | null = null;
export function setUnauthorizedHandler(fn: () => void) {
  onUnauthorized = fn;
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem("rbr_user");
}

function authHeaders(): HeadersInit {
  const token = getToken();
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

/** Pass `{ silent401: true }` to suppress the global logout handler on 401.
 *  Pass `{ signal }` to support AbortController cancellation. */
type RequestOptions = { silent401?: boolean; signal?: AbortSignal };

/** Returns true when an error is from an aborted fetch — should be silently ignored. */
export function isAbortError(err: unknown): boolean {
  return err instanceof DOMException && err.name === "AbortError";
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  options: RequestOptions = {},
): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: authHeaders(),
    signal: options.signal,
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    if (res.status === 401 && !options.silent401) {
      clearToken();
      onUnauthorized?.();
    }
    throw new ApiError(res.status, method, path, text);
  }

  // Handle no-content responses (DELETE 204, PUT with empty body, etc.)
  if (res.status === 204) return undefined as T;
  const contentType = res.headers.get("content-type") ?? "";
  const text = await res.text();
  if (!text || !contentType.includes("application/json")) return undefined as T;
  return JSON.parse(text) as T;
}

export const apiGet    = <T>(path: string, o?: RequestOptions) => request<T>("GET",    path, undefined, o);
export const apiPost   = <T>(path: string, body: unknown, o?: RequestOptions) => request<T>("POST",   path, body, o);
export const apiPut    = <T>(path: string, body: unknown, o?: RequestOptions) => request<T>("PUT",    path, body, o);
export const apiPatch  = <T>(path: string, body: unknown, o?: RequestOptions) => request<T>("PATCH",  path, body, o);
export const apiDelete = <T>(path: string, o?: RequestOptions) => request<T>("DELETE", path, undefined, o);
