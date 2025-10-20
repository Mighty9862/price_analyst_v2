export interface User {
  token?: string;
  role?: "USER" | "ADMIN";
}

export interface LoginFormData {
  phone: string;
  password: string;
}

export interface RegisterFormData {
  inn: string;
  fullName: string;
  phone: string;
  password: string;
  confirmPassword: string;
}

export interface AuthResponse {
  token: string;
  role: "USER" | "ADMIN";
}
