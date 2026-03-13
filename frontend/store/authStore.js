import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authApi, userApi } from '../lib/api';

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isLoading: false,

      login: async (email, password) => {
        set({ isLoading: true });
        try {
          const { data } = await authApi.login({ email, password });
          const { user, accessToken, refreshToken } = data.data;

          if (typeof window !== 'undefined') {
            localStorage.setItem('accessToken', accessToken);
            localStorage.setItem('refreshToken', refreshToken);
          }

          set({ user, accessToken, refreshToken, isLoading: false });
          return { success: true };
        } catch (err) {
          set({ isLoading: false });
          return {
            success: false,
            error: err.response?.data?.error?.message ?? 'Login failed',
          };
        }
      },

      register: async (name, email, password) => {
        set({ isLoading: true });
        try {
          const { data } = await authApi.register({ name, email, password });
          const { user, accessToken, refreshToken } = data.data;

          if (typeof window !== 'undefined') {
            localStorage.setItem('accessToken', accessToken);
            localStorage.setItem('refreshToken', refreshToken);
          }

          set({ user, accessToken, refreshToken, isLoading: false });
          return { success: true };
        } catch (err) {
          set({ isLoading: false });
          return {
            success: false,
            error: err.response?.data?.error?.message ?? 'Registration failed',
          };
        }
      },

      logout: async () => {
        try {
          const { refreshToken } = get();
          if (refreshToken) await authApi.logout(refreshToken);
        } catch {}
        if (typeof window !== 'undefined') {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
        }
        // Lazy import to avoid circular dependency (authStore ↔ chatStore)
        const { useChatStore } = await import('./chatStore');
        useChatStore.getState().clearMessages();
        set({ user: null, accessToken: null, refreshToken: null });
      },

      fetchMe: async () => {
        try {
          const { data } = await userApi.getMe();
          set({ user: data.data });
        } catch {
          set({ user: null });
        }
      },

      setUser: (user) => set({ user }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
      }),
    }
  )
);
