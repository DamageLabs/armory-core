export interface User {
  id: string;
  email: string;
  username: string;
  first_name: string;
  last_name: string;
  role: 'admin' | 'user';
  createdAt: string;
  updatedAt: string;
  verified: boolean;
}