"use client";
import React, { createContext, useContext, useEffect, useState } from "react";
import { setToken, clearToken, setUnauthorizedHandler } from "@/shared/api/apiClient";
import { login as loginApi } from "@/features/auth/api/authApi";
import type { AuthUser } from "@/features/auth/models/auth.models";

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  sessionExpired: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setTokenState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sessionExpired, setSessionExpired] = useState(false);

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
      setSessionExpired(true);
      setTokenState(null);
      setUser(null);
    });
  }, []);

  const login = async (email: string, password: string) => {
    setSessionExpired(false);
    const res = await loginApi(email, password);
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
    <AuthContext.Provider
      value={{ user, token, isLoading, sessionExpired, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

