/**
 * API de Abonos
 * 
 * Endpoints para gestión de abonos/pagos anticipados de clientes
 */
import { apiClient } from './client';
import type {
    Abono,
    AbonoListItem,
    AbonoClienteResumen,
    AbonosClienteFactura,
    AbonoCreateDTO,
    AbonoAnularDTO
} from '@/types/abono';

export const abonosApi = {
    /**
     * Crear un nuevo abono
     */
    crear: async (data: AbonoCreateDTO): Promise<Abono> => {
        const response = await apiClient.post('/abonos', data);
        return response.data;
    },

    /**
     * Listar abonos con filtros
     */
    listar: async (params?: {
        cliente_id?: number;
        estado?: 'disponible' | 'usado' | 'anulado';
        skip?: number;
        limit?: number;
    }): Promise<AbonoListItem[]> => {
        const response = await apiClient.get('/abonos', { params });
        return response.data;
    },

    /**
     * Obtener un abono por ID
     */
    obtener: async (id: number): Promise<Abono> => {
        const response = await apiClient.get(`/abonos/${id}`);
        return response.data;
    },

    /**
     * Obtener resumen de abonos de un cliente
     */
    obtenerResumenCliente: async (clienteId: number): Promise<AbonoClienteResumen> => {
        const response = await apiClient.get(`/abonos/cliente/${clienteId}/resumen`);
        return response.data;
    },

    /**
     * Obtener abonos disponibles para facturación
     */
    obtenerParaFactura: async (clienteId: number): Promise<AbonosClienteFactura> => {
        const response = await apiClient.get(`/abonos/cliente/${clienteId}/para-factura`);
        return response.data;
    },

    /**
     * Anular un abono
     */
    anular: async (id: number, data: AbonoAnularDTO): Promise<Abono> => {
        const response = await apiClient.post(`/abonos/${id}/anular`, data);
        return response.data;
    },
};

export default abonosApi;
