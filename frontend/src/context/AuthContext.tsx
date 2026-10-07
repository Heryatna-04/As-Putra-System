"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
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
  login: (token: string, user: UserProfile) => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const router = useRouter();

  useEffect(() => {
    // Read from cookies instead of localStorage
    const savedToken = Cookies.get("as_putra_token");
    const savedUser = Cookies.get("as_putra_user");

    if (savedToken && savedUser) {
      try {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
      } catch (err) {
        console.error("Failed to parse saved user from cookies", err);
        Cookies.remove("as_putra_token");
        Cookies.remove("as_putra_user");
      }
    }
    setIsLoading(false);
  }, []);

  const login = (newToken: string, newUser: UserProfile) => {
    setToken(newToken);
    setUser(newUser);
    
    // Store in cookies for middleware and client access
    Cookies.set("as_putra_token", newToken, { expires: 7 }); // Expires in 7 days
    Cookies.set("as_putra_user", JSON.stringify(newUser), { expires: 7 });
  };

  const logout = async () => {
    const currentToken = Cookies.get("as_putra_token");
    if (currentToken) {
      try {
        const baseUrl =
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";
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
    Cookies.remove("as_putra_token");
    Cookies.remove("as_putra_user");
    router.push("/admin/login");
  };

  return (
    <AuthContext.Provider value={{ token, user, isLoading, login, logout }}>
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
