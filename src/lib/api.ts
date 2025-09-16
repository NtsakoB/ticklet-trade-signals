// Same-origin by default (Vercel rewrites /api/* → Render).
// In local dev, set VITE_API_BASE_URL=http://localhost:8000
export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "/api";

export async function apiFetch(path: string, init?: RequestInit) {
  const base = API_BASE_URL.endsWith("/") ? API_BASE_URL.slice(0, -1) : API_BASE_URL;
  const url = path.startsWith("http") ? path : `${base}${path}`;
  const res = await fetch(url, {
    // include credentials only if your API sets cookies; harmless otherwise
    credentials: "include",
    ...init,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status} ${res.statusText} :: ${text}`);
  }
  const ct = res.headers.get("content-type") || "";
  return ct.includes("application/json") ? res.json() : res.text();
}