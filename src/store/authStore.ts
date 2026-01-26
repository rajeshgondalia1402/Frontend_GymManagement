import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, AuthState } from '@/types';

interface AuthStore extends AuthState {
  setAuth: (user: User, accessToken: string, refreshToken: string) => void;
  setAccessToken: (token: string) => void;
  logout: () => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: true,

      setAuth: (user, accessToken, refreshToken) => {
        // Normalize role formats from backend (e.g. 'ROLE_ADMIN' or 'admin' or 'trainer')
        let normalizedRole = (user.role as string)
          .toUpperCase()
          .replace(/^ROLE_/, '') as any;
        
        // Handle variations of role names
        const roleMapping: Record<string, string> = {
          'ADMIN': 'ADMIN',
          'GYM_OWNER': 'GYM_OWNER',
          'GYMOWNER': 'GYM_OWNER',
          'OWNER': 'GYM_OWNER',
          'TRAINER': 'TRAINER',
          'PT_TRAINER': 'TRAINER',
          'PTTRAINER': 'TRAINER',
          'MEMBER': 'MEMBER',
          'PT_MEMBER': 'PT_MEMBER',
          'PTMEMBER': 'PT_MEMBER',
        };
        
        normalizedRole = roleMapping[normalizedRole] || normalizedRole;

        set({
          user: { ...user, role: normalizedRole },
          accessToken,
          refreshToken,
          isAuthenticated: true,
          isLoading: false,
        });
      },

      setAccessToken: (accessToken) => {
        set({ accessToken });
      },

      logout: () => {
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
          isLoading: false,
        });
      },

      setLoading: (isLoading) => {
        set({ isLoading });
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        // After rehydration from localStorage, set loading to false
        if (state) {
          state.setLoading(false);
        }
      },
    }
  )
);
