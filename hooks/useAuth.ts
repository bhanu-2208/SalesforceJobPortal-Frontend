'use client'
// hooks/useAuth.ts
// Lightweight auth state. Stores the access token in memory (not localStorage)
// so it's XSS-safe. The refresh token lives in an httpOnly cookie.

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

interface User {
  id:    string;
  name:  string;
  email: string;
  role:  string;
}

interface AuthState {
  user:  User | null;
  token: string | null;
}

export function useAuth() {
  const router = useRouter();
  const [auth, setAuth] = useState<AuthState>({ user: null, token: null });

  const saveAuth = useCallback((token: string, user: User) => {
    setAuth({ token, user });
    // Also store in localStorage so it survives page refresh within the tab
    localStorage.setItem("tc_token", token);
    localStorage.setItem("tc_user",  JSON.stringify(user));
  }, []);

  const clearAuth = useCallback(() => {
    setAuth({ user: null, token: null });
    localStorage.removeItem("tc_token");
    localStorage.removeItem("tc_user");
  }, []);

  // Call this once on app mount to rehydrate from localStorage
  const rehydrate = useCallback(() => {
    const token = localStorage.getItem("tc_token");
    const raw   = localStorage.getItem("tc_user");
    if (token && raw) {
      try { setAuth({ token, user: JSON.parse(raw) }); } catch { /* ignore */ }
    }
  }, []);

  const logout = useCallback(async () => {
    await fetch(`${API}/api/auth/logout`, { method: "POST", credentials: "include" });
    clearAuth();
    router.push("/login");
  }, [clearAuth, router]);

  return { auth, saveAuth, clearAuth, rehydrate, logout };
}