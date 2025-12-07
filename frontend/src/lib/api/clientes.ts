import { apiClient } from './client';
import {
    Cliente,
    ClienteListItem,
    ClienteCreateDTO,
    ClienteUpdateDTO,
    ClientesPaginados,
    ClienteFilters,
    ClientePreferencia,
    ClientePreferenciaUpdateDTO,
    ClienteEtiqueta,
    ClienteEtiquetaCreateDTO,
    ClienteEtiquetaUpdateDTO,
} from '@/types/cliente';

// Helper para limpiar parámetros - elimina undefined/null y convierte números
function cleanParams(params?: ClienteFilters): Record<string, string | number> | undefined {
    if (!params) return undefined;

    const cleaned: Record<string, string | number> = {};

    Object.entries(params).forEach(([key, value]) => {
        // Ignorar valores undefined, null y strings vacíos
        if (value === undefined || value === null || value === '') {
            return;
        }

        // Asegurar que los números sean números
        if (['pagina', 'por_pagina', 'etiqueta_id', 'min_visitas', 'max_visitas'].includes(key)) {
            const numValue = Number(value);
            if (!isNaN(numValue)) {
                cleaned[key] = numValue;
            }
        } else {
            cleaned[key] = value;
        }
    });

    return Object.keys(cleaned).length > 0 ? cleaned : undefined;
}

// ============================================
// API DE CLIENTES
// ============================================

export const clientesApi = {
    /**
     * Listar clientes con filtros y paginación
     */
    getAll: async (params?: ClienteFilters): Promise<ClientesPaginados> => {
        const response = await apiClient.get('/clientes', { params: cleanParams(params) });
        return response.data;
    },

    /**
     * Obtener clientes activos (para selectores)
     */
    getActivos: async (): Promise<ClienteListItem[]> => {
        const response = await apiClient.get('/clientes/activos');
        return response.data;
    },

    /**
     * Búsqueda rápida de clientes (autocompletado)
     */
    busquedaRapida: async (q: string, limite: number = 10): Promise<ClienteListItem[]> => {
        const response = await apiClient.get('/clientes/buscar/rapida', {
            params: { q, limite }
        });
        return response.data;
    },

    /**
     * Obtener un cliente por ID
     */
    getById: async (id: number): Promise<Cliente> => {
        const response = await apiClient.get(`/clientes/${id}`);
        return response.data;
    },

    /**
     * Crear un nuevo cliente
     */
    create: async (data: ClienteCreateDTO): Promise<Cliente> => {
        const response = await apiClient.post('/clientes', data);
        return response.data;
    },

    /**
     * Actualizar un cliente
     */
    update: async (id: number, data: ClienteUpdateDTO): Promise<Cliente> => {
        const response = await apiClient.put(`/clientes/${id}`, data);
        return response.data;
    },

    /**
     * Desactivar un cliente (soft delete)
     */
    delete: async (id: number): Promise<void> => {
        await apiClient.delete(`/clientes/${id}`);
    },

    /**
     * Reactivar un cliente
     */
    reactivar: async (id: number): Promise<Cliente> => {
        const response = await apiClient.post(`/clientes/${id}/reactivar`);
        return response.data;
    },

    // ============================================
    // PREFERENCIAS
    // ============================================

    /**
     * Obtener preferencias del cliente
     */
    getPreferencias: async (clienteId: number): Promise<ClientePreferencia> => {
        const response = await apiClient.get(`/clientes/${clienteId}/preferencias`);
        return response.data;
    },

    /**
     * Actualizar preferencias del cliente
     */
    updatePreferencias: async (
        clienteId: number,
        data: ClientePreferenciaUpdateDTO
    ): Promise<ClientePreferencia> => {
        const response = await apiClient.put(`/clientes/${clienteId}/preferencias`, data);
        return response.data;
    },

    // ============================================
    // ETIQUETAS DEL CLIENTE
    // ============================================

    /**
     * Asignar etiquetas a un cliente
     */
    asignarEtiquetas: async (clienteId: number, etiquetaIds: number[]): Promise<Cliente> => {
        const response = await apiClient.post(`/clientes/${clienteId}/etiquetas`, {
            etiqueta_ids: etiquetaIds
        });
        return response.data;
    },

    /**
     * Remover una etiqueta de un cliente
     */
    removerEtiqueta: async (clienteId: number, etiquetaId: number): Promise<void> => {
        await apiClient.delete(`/clientes/${clienteId}/etiquetas/${etiquetaId}`);
    },
};

// ============================================
// API DE ETIQUETAS
// ============================================

export const etiquetasApi = {
    /**
     * Listar todas las etiquetas
     */
    getAll: async (incluirTotales: boolean = true): Promise<ClienteEtiqueta[]> => {
        const response = await apiClient.get('/clientes/etiquetas', {
            params: { incluir_totales: incluirTotales }
        });
        return response.data;
    },

    /**
     * Crear nueva etiqueta
     */
    create: async (data: ClienteEtiquetaCreateDTO): Promise<ClienteEtiqueta> => {
        const response = await apiClient.post('/clientes/etiquetas', data);
        return response.data;
    },

    /**
     * Actualizar etiqueta
     */
    update: async (id: number, data: ClienteEtiquetaUpdateDTO): Promise<ClienteEtiqueta> => {
        const response = await apiClient.put(`/clientes/etiquetas/${id}`, data);
        return response.data;
    },

    /**
     * Eliminar etiqueta
     */
    delete: async (id: number): Promise<void> => {
        await apiClient.delete(`/clientes/etiquetas/${id}`);
    },
};

export default clientesApi;
