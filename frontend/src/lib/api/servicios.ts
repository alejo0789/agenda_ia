import { apiClient } from './client';
import {
    Categoria,
    CategoriaFormData,
    Servicio,
    ServicioFormData,
    ServicioFilters,
} from '@/types/servicio';

// ============================================
// API DE CATEGORÍAS DE SERVICIOS
// ============================================

export const categoriasApi = {
    // Listar todas las categorías
    getAll: async (): Promise<Categoria[]> => {
        const response = await apiClient.get('/categorias-servicio');
        return response.data;
    },

    // Obtener una categoría por ID
    getById: async (id: number): Promise<Categoria> => {
        const response = await apiClient.get(`/categorias-servicio/${id}`);
        return response.data;
    },

    // Crear una nueva categoría
    create: async (data: CategoriaFormData): Promise<Categoria> => {
        const response = await apiClient.post('/categorias-servicio', data);
        return response.data;
    },

    // Actualizar una categoría
    update: async (id: number, data: Partial<CategoriaFormData>): Promise<Categoria> => {
        const response = await apiClient.put(`/categorias-servicio/${id}`, data);
        return response.data;
    },

    // Eliminar una categoría
    delete: async (id: number): Promise<void> => {
        await apiClient.delete(`/categorias-servicio/${id}`);
    },
};

// ============================================
// API DE SERVICIOS
// ============================================

export const serviciosApi = {
    // Listar servicios con filtros
    getAll: async (params?: ServicioFilters): Promise<Servicio[]> => {
        const response = await apiClient.get('/servicios', { params });
        return response.data;
    },

    // Obtener servicios activos agrupados por categoría (para agendamiento)
    getActivosPorCategoria: async (): Promise<{ categoria_id: number | null; categoria_nombre: string | null; servicios: Servicio[] }[]> => {
        const response = await apiClient.get('/servicios/activos');
        return response.data;
    },

    // Obtener un servicio por ID
    getById: async (id: number): Promise<Servicio> => {
        const response = await apiClient.get(`/servicios/${id}`);
        return response.data;
    },

    // Crear un nuevo servicio
    create: async (data: ServicioFormData): Promise<Servicio> => {
        const response = await apiClient.post('/servicios', data);
        return response.data;
    },

    // Actualizar un servicio
    update: async (id: number, data: Partial<ServicioFormData>): Promise<Servicio> => {
        const response = await apiClient.put(`/servicios/${id}`, data);
        return response.data;
    },

    // Desactivar un servicio (soft delete)
    delete: async (id: number): Promise<void> => {
        await apiClient.delete(`/servicios/${id}`);
    },

    // Activar un servicio
    activate: async (id: number): Promise<Servicio> => {
        const response = await apiClient.put(`/servicios/${id}/activar`);
        return response.data;
    },
};

export default serviciosApi;
