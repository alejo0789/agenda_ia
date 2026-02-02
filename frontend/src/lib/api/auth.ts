import apiClient from './client';
import { Usuario } from '@/types/usuario';

export interface LoginCredentials {
    username: string;
    password: string;
}

export interface TokenResponse {
    access_token: string;
    refresh_token: string;
    token_type: string;
}

export interface LoginResponse {
    access_token: string;
    refresh_token: string;
    token_type: string;
    user: Usuario;
}

export const authApi = {
    login: async (credentials: LoginCredentials): Promise<LoginResponse> => {
        // Paso 1: Hacer login y obtener el token
        const formData = new FormData();
        formData.append('username', credentials.username);
        formData.append('password', credentials.password);

        const tokenResponse = await apiClient.post<TokenResponse>('/auth/login', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });

        // Paso 2: Guardar el token temporalmente para la siguiente petición
        const token = tokenResponse.data.access_token;
        localStorage.setItem('access_token', token);

        // Paso 3: Obtener la información del usuario
        const userResponse = await apiClient.get<Usuario>('/usuarios/me');

        // Paso 4: Retornar todo junto
        return {
            access_token: tokenResponse.data.access_token,
            refresh_token: tokenResponse.data.refresh_token,
            token_type: tokenResponse.data.token_type,
            user: userResponse.data,
        };
    },

    logout: async () => {
        try {
            // Intentar hacer logout en el backend
            await apiClient.post('/auth/logout');
        } catch (error) {
            console.error('Error during logout:', error);
        } finally {
            // Siempre limpiar el localStorage
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            localStorage.removeItem('user');
        }
    },

    getCurrentUser: () => {
        const userStr = localStorage.getItem('user');
        return userStr ? JSON.parse(userStr) : null;
    },

    isAuthenticated: () => {
        return !!localStorage.getItem('access_token');
    },

    refreshToken: async (refreshToken: string): Promise<string> => {
        const response = await apiClient.post<{ access_token: string; token_type: string }>(
            '/auth/refresh',
            { refresh_token: refreshToken }
        );
        return response.data.access_token;
    },

    changePassword: async (data: any) => {
        const response = await apiClient.put('/auth/change-password', data);
        return response.data;
    }
};
