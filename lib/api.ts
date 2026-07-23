const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export async function getValidToken(): Promise<string | null> {
  const token = localStorage.getItem("tc_token");
  if (!token) return null;

  try {
    const test = await fetch(`${API}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (test.ok) return token;

    const refresh = await fetch(`${API}/api/auth/refresh`, {
      method: "POST",
      credentials: "include",
    });
    if (!refresh.ok) {
      localStorage.removeItem("tc_token");
      localStorage.removeItem("tc_user");
      return null;
    }

    const data = await refresh.json();
    localStorage.setItem("tc_token", data.token);
    return data.token;
  } catch {
    // backend unreachable
    return null;
  }
}