// Core application types
// Extend this file with domain-specific types as the MVP grows

export type User = {
  id: string;
  email: string;
  created_at: string;
};

export type ApiResponse<T = unknown> = {
  success: boolean;
  data?: T;
  error?: string;
};
