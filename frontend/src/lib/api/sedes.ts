import apiClient from './client';
import { Sede, SedeFormData } from '@/types/sede';

export const sedesApi = {
    getAll: async (estado?: string) => {
        const params = new URLSearchParams();
        if (estado) params.append('estado', estado);

        const response = await apiClient.get<Sede[]>(`/sedes?${params.toString()}`);
        return response.data;
    },

    getById: async (id: number) => {
        const response = await apiClient.get<Sede>(`/sedes/${id}`);
        return response.data;
    },

    create: async (data: SedeFormData) => {
        const response = await apiClient.post<Sede>('/sedes', data);
        return response.data;
    },

    update: async (id: number, data: Partial<SedeFormData>) => {
        const response = await apiClient.put<Sede>(`/sedes/${id}`, data);
        return response.data;
    },

    changeStatus: async (id: number, estado: 'activa' | 'inactiva') => {
        const response = await apiClient.put<Sede>(`/sedes/${id}/estado?estado=${estado}`);
        return response.data;
    }
};
