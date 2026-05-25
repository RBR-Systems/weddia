import { useState } from "react";
import { useAuth } from "@/shared/contexts/AuthContext";
import { useTranslation } from "react-i18next";
import type { LoginCredentials } from "../models/auth.models";

export function useLogin() {
  const { login } = useAuth();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (creds: LoginCredentials) => {
    setError(null);
    setLoading(true);
    try {
      await login(creds.email, creds.password);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("auth.invalidCredentials"));
    } finally {
      setLoading(false);
    }
  };

  return { handleLogin, loading, error, setError } as const;
}
