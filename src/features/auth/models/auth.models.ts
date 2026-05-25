export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthUser {
  userId: number;
  email: string;
  firstName: string;
  lastName: string;
  userType: string;
  isOrgAdmin: boolean;
}

export interface AuthResponse {
  token: string;
  user: AuthUser;
}
