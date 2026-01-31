import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { User } from '@/types/api';
import { syncTokensToCookies, clearAuthCookies } from '@/lib/cookies';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  _hasHydrated: boolean;
  
  setUser: (user: User) => void;
  setTokens: (access: string, refresh: string) => void;
  login: (user: User, accessToken: string, refreshToken: string) => void;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
  setHasHydrated: (state: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      _hasHydrated: false,
      
      setUser: (user) => set({ user, isAuthenticated: true }),
      
      setTokens: (accessToken, refreshToken) => {
        syncTokensToCookies(accessToken, refreshToken);
        set({ accessToken, refreshToken });
      },
      
      login: (user, accessToken, refreshToken) => {
        syncTokensToCookies(accessToken, refreshToken);
        set({ user, accessToken, refreshToken, isAuthenticated: true });
      },
      
      logout: () => {
        clearAuthCookies();
        set({ 
          user: null, 
          accessToken: null, 
          refreshToken: null, 
          isAuthenticated: false 
        });
      },
      
      updateUser: (updates) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...updates } : null,
        })),
        
      setHasHydrated: (state) => set({ _hasHydrated: state }),
    }),
    { 
      name: 'admin-auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        // Sync cookies on rehydration
        if (state) {
          syncTokensToCookies(state.accessToken, state.refreshToken);
          state.setHasHydrated(true);
        }
      },
    }
  )
);

// Hook to wait for hydration
export const useAuthHydration = () => useAuthStore((state) => state._hasHydrated);
