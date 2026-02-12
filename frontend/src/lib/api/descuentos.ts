import { apiClient } from './client';

export interface Descuento {
    id: number;
    nombre: string;
    codigo?: string;
    descripcion?: string;
    tipo: 'porcentaje' | 'monto_fijo';
    valor: number;
    activo: boolean;
    fecha_inicio?: string;
    fecha_fin?: string;
    sede_id?: number;
    created_at: string;
    updated_at?: string;
}

export interface DescuentoCreate {
    nombre: string;
    codigo?: string;
    descripcion?: string;
    tipo: 'porcentaje' | 'monto_fijo';
    valor: number;
    activo: boolean;
    fecha_inicio?: string;
    fecha_fin?: string;
    sede_id?: number;
}

export interface DescuentoUpdate {
    nombre?: string;
    codigo?: string;
    descripcion?: string;
    tipo?: 'porcentaje' | 'monto_fijo';
    valor?: number;
    activo?: boolean;
    fecha_inicio?: string;
    fecha_fin?: string;
    sede_id?: number;
}

export const descuentosApi = {
    getAll: async () => {
        const response = await apiClient.get<Descuento[]>('/descuentos');
        return response.data;
    },

    getActivos: async () => {
        const response = await apiClient.get<Descuento[]>('/descuentos/activos');
        return response.data;
    },

    create: async (data: DescuentoCreate) => {
        const response = await apiClient.post<Descuento>('/descuentos', data);
        return response.data;
    },

    update: async (id: number, data: DescuentoUpdate) => {
        const response = await apiClient.put<Descuento>(`/descuentos/${id}`, data);
        return response.data;
    },

    delete: async (id: number) => {
        await apiClient.delete(`/descuentos/${id}`);
    }
};
