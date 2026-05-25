import { apiPost } from "@/shared/api/apiClient";
import type { AuthResponse } from "../models/auth.models";

export async function login(
  email: string,
  password: string,
): Promise<AuthResponse> {
  return apiPost<AuthResponse>("/api/auth/login", { email, password });
}
