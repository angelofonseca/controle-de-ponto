import { writable, derived } from 'svelte/store';
import type { User } from '$lib/types';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  loading: boolean;
}

function createAuthStore() {
  const { subscribe, set, update } = writable<AuthState>({
    user: null,
    accessToken: null,
    refreshToken: null,
    loading: false,
  });

  return {
    subscribe,
    setAuth: (user: User, accessToken: string, refreshToken: string) => {
      set({ user, accessToken, refreshToken, loading: false });
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
        localStorage.setItem('user', JSON.stringify(user));
      }
    },
    clearAuth: () => {
      set({ user: null, accessToken: null, refreshToken: null, loading: false });
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
      }
    },
    setLoading: (loading: boolean) => update((state) => ({ ...state, loading })),
    loadFromStorage: () => {
      if (typeof localStorage === 'undefined') return;
      const accessToken = localStorage.getItem('accessToken');
      const refreshToken = localStorage.getItem('refreshToken');
      const userStr = localStorage.getItem('user');

      if (accessToken && refreshToken && userStr) {
        try {
          const user = JSON.parse(userStr) as User;
          set({ user, accessToken, refreshToken, loading: false });
        } catch {
          // Invalid stored data
        }
      }
    },
  };
}

export const authStore = createAuthStore();

export const isAuthenticated = derived(
  authStore,
  ($auth) => !!$auth.accessToken && !!$auth.user,
);

export const isAdmin = derived(
  authStore,
  ($auth) => $auth.user?.role === 'COMPANY_ADMIN',
);

export const currentUser = derived(authStore, ($auth) => $auth.user);
