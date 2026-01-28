export interface User {
  id: string;
  username: string;
  password: string;
  created_at?: string;
}

export interface LoginFormData {
  username: string;
  password: string;
}
