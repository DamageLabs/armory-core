export interface User {
  id: string;
  email: string;
  username: string;
  first_name: string;
  last_name: string;
  role: 'admin' | 'user';
  created_at: string;
  updated_at: string;
  verified: boolean;
}