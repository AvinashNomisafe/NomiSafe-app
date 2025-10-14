export interface OTPRequestResponse {
  detail: string;
}

export interface OTPVerifyResponse {
  id: number;
  phone_number: string;
  access: string;
  refresh: string;
  created: boolean;
}

export interface AuthState {
  isAuthenticated: boolean;
  accessToken: string | null;
  refreshToken: string | null;
  userId: number | null;
  phoneNumber: string | null;
}

export interface AuthError {
  message: string;
  code?: string;
}
