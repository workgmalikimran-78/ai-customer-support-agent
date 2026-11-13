export interface AuthResponse {
  token: string;
  userId: string;
  email: string;
  displayName: string;
  role: string;
  teamId: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}
