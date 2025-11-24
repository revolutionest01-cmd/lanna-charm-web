import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

interface AuthStore {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (name: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

// Mock users database
const mockUsers: User[] = [
  {
    id: '1',
    name: 'ผู้ดูแลระบบ',
    email: 'admin@plernping.com',
    avatar: undefined,
  },
];

export const useAuth = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,

      login: async (email: string, password: string) => {
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 500));

        // Mock authentication - accept any password for demo
        const user = mockUsers.find(u => u.email === email);
        
        if (user) {
          set({ user, isAuthenticated: true });
          return { success: true };
        }

        // If user doesn't exist in mock database, treat it as new registration
        return { success: false, error: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' };
      },

      register: async (name: string, email: string, password: string) => {
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 500));

        // Check if user already exists
        const existingUser = mockUsers.find(u => u.email === email);
        if (existingUser) {
          return { success: false, error: 'อีเมลนี้ถูกใช้งานแล้ว' };
        }

        // Create new user
        const newUser: User = {
          id: Date.now().toString(),
          name,
          email,
          avatar: undefined,
        };

        mockUsers.push(newUser);
        set({ user: newUser, isAuthenticated: true });
        return { success: true };
      },

      logout: () => {
        set({ user: null, isAuthenticated: false });
      },
    }),
    {
      name: 'auth-storage',
    }
  )
);
