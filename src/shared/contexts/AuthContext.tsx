"use client";
import React, { createContext, useContext, useEffect, useState } from "react";
import { setToken, clearToken, setUnauthorizedHandler } from "@/shared/api/apiClient";
import { login as loginApi } from "@/features/auth/api/authApi";
import type { AuthUser } from "@/features/auth/models/auth.models";

function isJwtExpired(token: string): boolean {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return false;
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(base64.length + (4 - (base64.length % 4)) % 4, "=");
    const payload = JSON.parse(atob(padded)) as Record<string, unknown>;
    if (typeof payload.exp !== "number") return false;
    return payload.exp * 1000 < Date.now();
  } catch {
    return false;
  }
}

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  sessionExpired: boolean;
  isPlatformAdmin: boolean;
  isOrgAdmin: boolean;
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
      if (isJwtExpired(stored)) {
        clearToken();
        setSessionExpired(true);
      } else {
        setTokenState(stored);
        setUser(JSON.parse(storedUser));
      }
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

  const isPlatformAdmin = user?.userType === "platform_admin";
  const isOrgAdmin = isPlatformAdmin || (user?.isOrgAdmin ?? false);

  return (
    <AuthContext.Provider
      value={{ user, token, isLoading, sessionExpired, isPlatformAdmin, isOrgAdmin, login, logout }}
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

