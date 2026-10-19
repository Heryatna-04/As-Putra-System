"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";

export interface UserProfile {
  id: string;
  email: string;
  role: "ADMIN" | "KEPALA_BENGKEL" | "CRM";
  nama?: string;
}

interface AuthContextType {
  token: string | null;
  user: UserProfile | null;
  isLoading: boolean;
  login: (token: string, user: UserProfile, refreshToken?: string) => void;
  logout: () => Promise<void>;
  authFetch: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const router = useRouter();

  const baseUrl =
    process.env.NEXT_PUBLIC_API_URL || "https://backend-beta-murex-36.vercel.app/api/v1";

  const getCookieOptions = useCallback((days = 7) => {
    const isSecure = typeof window !== "undefined" && window.location.protocol === "https:";
    return {
      expires: days,
      path: "/",
      sameSite: "lax" as const,
      secure: isSecure,
    };
  }, []);

  const refreshAccessToken = useCallback(async (rToken: string): Promise<string | null> => {
    try {
      const res = await fetch(`${baseUrl}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token: rToken }),
      });
      const data = await res.json();
      if (res.ok && data.success && data.data?.access_token) {
        const tokenOpt = getCookieOptions(7);
        const refreshOpt = getCookieOptions(30);

        Cookies.set("as_putra_token", data.data.access_token, tokenOpt);
        if (data.data.refresh_token) {
          Cookies.set("as_putra_refresh_token", data.data.refresh_token, refreshOpt);
        }
        setToken(data.data.access_token);
        if (data.data.user) {
          setUser(data.data.user);
          Cookies.set("as_putra_user", JSON.stringify(data.data.user), tokenOpt);
        }
        return data.data.access_token;
      }
    } catch (err) {
      console.error("Silent token refresh failed", err);
    }
    return null;
  }, [baseUrl, getCookieOptions]);

  const clearAuthCookies = useCallback(() => {
    const clearOpt = { path: "/", sameSite: "lax" as const };
    Cookies.remove("as_putra_token", clearOpt);
    Cookies.remove("as_putra_user", clearOpt);
    Cookies.remove("as_putra_refresh_token", clearOpt);
  }, []);

  const logout = useCallback(async () => {
    const currentToken = Cookies.get("as_putra_token");
    if (currentToken) {
      try {
        await fetch(`${baseUrl}/auth/logout`, {
          method: "POST",
          headers: { Authorization: `Bearer ${currentToken}` },
        });
      } catch (err) {
        console.error("Logout API call failed", err);
      }
    }

    setToken(null);
    setUser(null);
    clearAuthCookies();
    router.push("/admin/login");
  }, [baseUrl, clearAuthCookies, router]);

  // Proactive check & refresh routine
  const checkAndRefreshToken = useCallback(async () => {
    const savedToken = Cookies.get("as_putra_token");
    const savedRefreshToken = Cookies.get("as_putra_refresh_token");

    if (!savedToken && !savedRefreshToken) return;

    if (savedToken) {
      try {
        const payload = JSON.parse(atob(savedToken.split(".")[1].replace(/-/g, "+").replace(/_/g, "/"))) as { exp?: number };
        const isExpiringSoon = payload.exp && payload.exp * 1000 < Date.now() + 5 * 60 * 1000;

        if (isExpiringSoon && savedRefreshToken) {
          await refreshAccessToken(savedRefreshToken);
        }
      } catch {
        if (savedRefreshToken) {
          await refreshAccessToken(savedRefreshToken);
        }
      }
    } else if (savedRefreshToken) {
      await refreshAccessToken(savedRefreshToken);
    }
  }, [refreshAccessToken]);

  useEffect(() => {
    const initAuth = async () => {
      const savedToken = Cookies.get("as_putra_token");
      const savedUser = Cookies.get("as_putra_user");
      const savedRefreshToken = Cookies.get("as_putra_refresh_token");

      if (savedToken && savedUser) {
        try {
          const payload = JSON.parse(atob(savedToken.split(".")[1].replace(/-/g, "+").replace(/_/g, "/"))) as { exp?: number };
          const isExpiredOrNearing = payload.exp && payload.exp * 1000 < Date.now() + 5 * 60 * 1000;

          if (isExpiredOrNearing && savedRefreshToken) {
            const refreshed = await refreshAccessToken(savedRefreshToken);
            if (!refreshed) {
              clearAuthCookies();
              setIsLoading(false);
              router.push("/admin/login");
              return;
            }
          } else if (payload.exp && payload.exp * 1000 < Date.now()) {
            clearAuthCookies();
            setIsLoading(false);
            router.push("/admin/login");
            return;
          } else {
            setToken(savedToken);
            setUser(JSON.parse(savedUser));
          }
        } catch (err) {
          console.error("Failed to parse saved user from cookies", err);
          clearAuthCookies();
        }
      } else if (!savedToken && savedRefreshToken) {
        // Recover session if refresh token exists
        const refreshed = await refreshAccessToken(savedRefreshToken);
        if (!refreshed) {
          clearAuthCookies();
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, [router, refreshAccessToken, clearAuthCookies]);

  // Periodic heartbeat (every 10 minutes) + Tab focus revalidation
  useEffect(() => {
    if (!token) return;

    // Heartbeat every 10 minutes
    const interval = setInterval(() => {
      checkAndRefreshToken();
    }, 10 * 60 * 1000);

    // Revalidate on visibilitychange (tab refocus)
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        checkAndRefreshToken();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [token, checkAndRefreshToken]);

  const login = (newToken: string, newUser: UserProfile, refreshToken?: string) => {
    setToken(newToken);
    setUser(newUser);

    const tokenOpt = getCookieOptions(7);
    const refreshOpt = getCookieOptions(30);

    Cookies.set("as_putra_token", newToken, tokenOpt);
    Cookies.set("as_putra_user", JSON.stringify(newUser), tokenOpt);
    if (refreshToken) {
      Cookies.set("as_putra_refresh_token", refreshToken, refreshOpt);
    }
  };

  /**
   * Seamless authenticated fetch wrapper:
   * 1. Pre-flight token expiration check (< 60s remaining -> proactive refresh)
   * 2. Auto-injects Authorization Bearer header
   * 3. Reactive 401 recovery (transparently refreshes token & retries original request)
   */
  const authFetch = useCallback(async (input: RequestInfo | URL, init: RequestInit = {}): Promise<Response> => {
    let activeToken = token;
    const savedRefreshToken = Cookies.get("as_putra_refresh_token");

    // Pre-flight expiration check (< 60s)
    if (activeToken) {
      try {
        const payload = JSON.parse(atob(activeToken.split(".")[1].replace(/-/g, "+").replace(/_/g, "/"))) as { exp?: number };
        if (payload.exp && payload.exp * 1000 < Date.now() + 60 * 1000 && savedRefreshToken) {
          const refreshed = await refreshAccessToken(savedRefreshToken);
          if (refreshed) {
            activeToken = refreshed;
          }
        }
      } catch {
        // Fallback to activeToken
      }
    }

    const headers = new Headers(init.headers || {});
    if (activeToken) {
      headers.set("Authorization", `Bearer ${activeToken}`);
    }

    let response = await fetch(input, { ...init, headers });

    // Reactive 401 recovery
    if (response.status === 401 && savedRefreshToken) {
      const refreshed = await refreshAccessToken(savedRefreshToken);
      if (refreshed) {
        headers.set("Authorization", `Bearer ${refreshed}`);
        response = await fetch(input, { ...init, headers });
      } else {
        await logout();
      }
    }

    return response;
  }, [token, refreshAccessToken, logout]);

  return (
    <AuthContext.Provider value={{ token, user, isLoading, login, logout, authFetch }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
