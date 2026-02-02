import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Usuario } from '@/types/usuario';

interface AuthState {
    user: Usuario | null;
    token: string | null;
    refreshToken: string | null;
    isAuthenticated: boolean;
    setAuth: (user: Usuario, token: string, refreshToken: string) => void;
    clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            user: null,
            token: null,
            refreshToken: null,
            isAuthenticated: false,
            setAuth: (user, token, refreshToken) => {
                localStorage.setItem('access_token', token);
                localStorage.setItem('refresh_token', refreshToken);
                localStorage.setItem('user', JSON.stringify(user));
                set({ user, token, refreshToken, isAuthenticated: true });
            },
            clearAuth: () => {
                localStorage.removeItem('access_token');
                localStorage.removeItem('refresh_token');
                localStorage.removeItem('user');
                set({ user: null, token: null, refreshToken: null, isAuthenticated: false });
            },
        }),
        {
            name: 'auth-storage',
        }
    )
);
