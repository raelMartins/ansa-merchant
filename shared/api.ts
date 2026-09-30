import { meMerchant } from "./merchantPath";

export const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:5000";

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

type Envelope<T> = { data?: T; error?: { code: string; message: string; details?: { path: string; message: string }[] } };

const accessKey = "ansa.shop.accessToken";
const refreshKey = "ansa.shop.refreshToken";

export function getAccessToken(): string | null {
  return localStorage.getItem(accessKey);
}

export function setTokens(access: string, refresh: string): void {
  localStorage.setItem(accessKey, access);
  localStorage.setItem(refreshKey, refresh);
}

export function clearTokens(): void {
  localStorage.removeItem(accessKey);
  localStorage.removeItem(refreshKey);
}

export async function signOut(): Promise<void> {
  const refreshToken = localStorage.getItem(refreshKey);
  clearTokens();
  if (refreshToken) {
    await fetch(`${API_URL}/v1/auth/logout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    }).catch(() => undefined);
  }
}

async function refreshAccess(): Promise<string | null> {
  const refreshToken = localStorage.getItem(refreshKey);
  if (!refreshToken) return null;
  const res = await fetch(`${API_URL}/v1/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
  });
  const json = (await res.json().catch(() => ({}))) as Envelope<{ tokens: { accessToken: string; refreshToken: string } }>;
  if (!res.ok || !json.data?.tokens) {
    clearTokens();
    return null;
  }
  setTokens(json.data.tokens.accessToken, json.data.tokens.refreshToken);
  return json.data.tokens.accessToken;
}

export async function api<T>(path: string, init: RequestInit = {}, retry = true): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  const token = getAccessToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);

  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, { ...init, headers });
  } catch {
    throw new ApiError(0, "NETWORK", "Can't reach us right now. Check your connection and that the API is running.");
  }
  const json = (await res.json().catch(() => ({}))) as Envelope<T>;

  if (res.status === 401 && retry && localStorage.getItem(refreshKey)) {
    const next = await refreshAccess();
    if (next) return api<T>(path, init, false);
  }

  if (!res.ok) {
    const detail = json.error?.details?.[0];
    const message = detail ? `${detail.path ? `${detail.path}: ` : ""}${detail.message}` : json.error?.message;
    throw new ApiError(res.status, json.error?.code ?? "ERROR", message ?? res.statusText);
  }
  if (json.data === undefined) {
    throw new ApiError(res.status, "ERROR", "Empty response");
  }
  return json.data;
}

export function post<T>(path: string, body?: unknown): Promise<T> {
  return api<T>(path, { method: "POST", body: JSON.stringify(body ?? {}) });
}

export function patch<T>(path: string, body: unknown): Promise<T> {
  return api<T>(path, { method: "PATCH", body: JSON.stringify(body) });
}

export function errorMessage(err: unknown, fallback = "Something went wrong"): string {
  return err instanceof Error && err.message ? err.message : fallback;
}

/** Uploaded media is served by the API as `/uploads/...`; remote URLs pass through. */
export function mediaUrl(src: string | null | undefined): string | undefined {
  if (!src) return undefined;
  if (src.startsWith("/uploads/")) return `${API_URL}${src}`;
  return src;
}

/** PROTOTYPE: local disk upload via the API. Swap for object storage later. */
export async function uploadImage(file: File): Promise<string> {
  if (file.size > 4_000_000) throw new Error("Image is too large (max 4MB)");
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Could not read image"));
    reader.readAsDataURL(file);
  });
  const { url } = await post<{ url: string }>(meMerchant("/media"), { dataUrl });
  return url;
}
