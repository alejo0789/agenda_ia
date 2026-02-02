import apiClient from './client';
import { Usuario, UsuarioFormData, Rol } from '@/types/usuario';

export const usuariosApi = {
    getAll: async (sedeId?: number) => {
        const params = new URLSearchParams();
        if (sedeId) params.append('sede_id', sedeId.toString());

        const response = await apiClient.get<Usuario[]>(`/usuarios?${params.toString()}`);
        return response.data;
    },

    getById: async (id: number) => {
        const response = await apiClient.get<Usuario>(`/usuarios/${id}`);
        return response.data;
    },

    create: async (data: UsuarioFormData) => {
        const response = await apiClient.post<Usuario>('/usuarios', data);
        return response.data;
    },

    update: async (id: number, data: Partial<UsuarioFormData>) => {
        const response = await apiClient.put<Usuario>(`/usuarios/${id}`, data);
        return response.data;
    },

    changeStatus: async (id: number, estado: string) => {
        const response = await apiClient.put<Usuario>(`/usuarios/${id}/estado?estado=${estado}`);
        return response.data;
    },

    getRoles: async () => {
        const response = await apiClient.get<Rol[]>('/roles');
        return response.data;
    },

    // Auth related
    checkFirstAccess: async (username: string) => {
        const response = await apiClient.post<{ is_first_access: boolean, user_id: number }>('/auth/check-first-access', { username });
        return response.data;
    },

    setupPassword: async (data: any) => {
        const response = await apiClient.post('/auth/setup-password', data);
        return response.data;
    }
};
