"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { apiPost, setToken, clearToken, setUnauthorizedHandler } from "@/lib/apiClient";

interface AuthUser {
  userId: number;
  email: string;
  firstName: string;
  lastName: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setTokenState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("rbr_token");
    const storedUser = localStorage.getItem("rbr_user");
    if (stored && storedUser) {
      setTokenState(stored);
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);

    // When any API call returns 401, clear auth state → login page appears
    setUnauthorizedHandler(() => {
      setTokenState(null);
      setUser(null);
    });
  }, []);

  const login = async (email: string, password: string) => {
    const res = await apiPost<{ token: string; user: AuthUser }>(
      "/api/auth/login",
      { email, password },
    );
    setToken(res.token);
    localStorage.setItem("rbr_user", JSON.stringify(res.user));
    setTokenState(res.token);
    setUser(res.user);
  };

  const logout = () => {
    clearToken();
    setTokenState(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
