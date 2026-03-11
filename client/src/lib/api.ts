// Custom fetch wrapper to inject auth tokens for admin routes
export const getAuthToken = () => localStorage.getItem("admin_token");
export const setAuthToken = (token: string) => localStorage.setItem("admin_token", token);
export const clearAuthToken = () => localStorage.removeItem("admin_token");

const API_BASE = import.meta.env?.VITE_API_BASE || "";

export async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const token = getAuthToken();
  const headers = new Headers(options.headers);

  if (!headers.has("Content-Type") && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const fullUrl = url.startsWith("http") ? url : `${API_BASE}${url}`;
  const response = await fetch(fullUrl, {
    ...options,
    headers,
    credentials: options.credentials ?? "include",
  });

  if (response.status === 401) {
    const refreshed = await tryRefreshToken();
    if (refreshed && token !== refreshed) {
      setAuthToken(refreshed);
      return fetchWithAuth(url, options);
    }
    clearAuthToken();
    if (
      window.location.pathname.startsWith("/admin") &&
      window.location.pathname !== "/admin/login" &&
      window.location.pathname !== "/admin/2fa"
    ) {
      window.location.href = "/admin/login";
    }
    if (
      window.location.pathname.startsWith("/user") &&
      window.location.pathname !== "/user/login"
    ) {
      window.location.href = "/user/login";
    }
  }

  return response;
}

async function tryRefreshToken(): Promise<string | null> {
  try {
    const res = await fetch(`${API_BASE}/api/auth/refresh-token`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
    });
    const json = await res.json();
    if (json.success && json.accessToken) return json.accessToken;
  } catch {
    // ignore
  }
  return null;
}
