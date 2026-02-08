import { apiClient } from './client';
import {
    Especialista,
    EspecialistaFormData,
    Horario,
    HorarioFormData,
    Bloqueo,
    BloqueoFormData,
    EspecialistaServicio,
    EspecialistaServicioFormData,
} from '@/types/especialista';

// ============================================
// API DE ESPECIALISTAS
// ============================================

export const especialistasApi = {
    // Listar todos los especialistas
    getAll: async (params?: { skip?: number; limit?: number; estado?: string }): Promise<Especialista[]> => {
        const response = await apiClient.get('/especialistas', { params });
        return response.data;
    },

    // Obtener especialistas activos
    getActivos: async (): Promise<Especialista[]> => {
        const response = await apiClient.get('/especialistas/activos');
        return response.data;
    },

    // Obtener un especialista por ID
    getById: async (id: number): Promise<Especialista> => {
        const response = await apiClient.get(`/especialistas/${id}`);
        return response.data;
    },

    // Crear un nuevo especialista
    create: async (data: EspecialistaFormData): Promise<Especialista> => {
        const response = await apiClient.post('/especialistas', data);
        return response.data;
    },

    // Actualizar un especialista
    update: async (id: number, data: Partial<EspecialistaFormData>): Promise<Especialista> => {
        const response = await apiClient.put(`/especialistas/${id}`, data);
        return response.data;
    },

    // Desactivar un especialista
    delete: async (id: number): Promise<void> => {
        await apiClient.delete(`/especialistas/${id}`);
    },

    // Activar un especialista (cambiar estado a activo)
    activate: async (id: number): Promise<Especialista> => {
        const response = await apiClient.put(`/especialistas/${id}`, { estado: 'activo' });
        return response.data;
    },

    // Subir documentación
    uploadDocumentation: async (id: number, file: File): Promise<{ filename: string; path: string }> => {
        const formData = new FormData();
        formData.append('file', file);
        const response = await apiClient.post(`/especialistas/${id}/documentacion`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    },

    // Listar documentación
    getDocumentation: async (id: number): Promise<{ filename: string; path: string; size: number }[]> => {
        const response = await apiClient.get(`/especialistas/${id}/documentacion`);
        return response.data;
    },

    // Eliminar documentación
    deleteDocumentation: async (id: number, filename: string): Promise<void> => {
        await apiClient.delete(`/especialistas/${id}/documentacion/${filename}`);
    },

    // ============================================
    // HORARIOS
    // ============================================

    // Obtener horarios de un especialista
    getHorarios: async (especialistaId: number): Promise<Horario[]> => {
        const response = await apiClient.get(`/especialistas/${especialistaId}/horarios`);
        return response.data;
    },

    // Guardar horarios en batch (reemplaza todos los existentes)
    saveHorarios: async (especialistaId: number, horarios: HorarioFormData[]): Promise<Horario[]> => {
        const response = await apiClient.put(`/especialistas/${especialistaId}/horarios`, { horarios });
        return response.data;
    },

    // Agregar un horario individual
    addHorario: async (especialistaId: number, horario: HorarioFormData): Promise<Horario> => {
        const response = await apiClient.post(`/especialistas/${especialistaId}/horarios`, horario);
        return response.data;
    },

    // Eliminar un horario
    deleteHorario: async (especialistaId: number, horarioId: number): Promise<void> => {
        await apiClient.delete(`/especialistas/${especialistaId}/horarios/${horarioId}`);
    },

    // ============================================
    // BLOQUEOS
    // ============================================

    // Obtener bloqueos de un especialista
    getBloqueos: async (especialistaId: number): Promise<Bloqueo[]> => {
        const response = await apiClient.get(`/especialistas/${especialistaId}/bloqueos`);
        return response.data;
    },

    // Crear un bloqueo
    createBloqueo: async (especialistaId: number, data: BloqueoFormData): Promise<Bloqueo> => {
        const response = await apiClient.post(`/especialistas/${especialistaId}/bloqueos`, data);
        return response.data;
    },

    // Actualizar un bloqueo
    updateBloqueo: async (especialistaId: number, bloqueoId: number, data: Partial<BloqueoFormData>): Promise<Bloqueo> => {
        const response = await apiClient.put(`/especialistas/${especialistaId}/bloqueos/${bloqueoId}`, data);
        return response.data;
    },

    // Eliminar un bloqueo
    deleteBloqueo: async (especialistaId: number, bloqueoId: number): Promise<void> => {
        await apiClient.delete(`/especialistas/${especialistaId}/bloqueos/${bloqueoId}`);
    },

    // ============================================
    // SERVICIOS ASIGNADOS
    // ============================================

    // Obtener servicios asignados a un especialista
    getServicios: async (especialistaId: number): Promise<EspecialistaServicio[]> => {
        const response = await apiClient.get(`/especialistas/${especialistaId}/servicios`);
        return response.data;
    },

    // Asignar un servicio a un especialista
    assignServicio: async (especialistaId: number, data: EspecialistaServicioFormData): Promise<EspecialistaServicio> => {
        const response = await apiClient.post(`/especialistas/${especialistaId}/servicios`, data);
        return response.data;
    },

    // Actualizar comisión de un servicio
    updateServicio: async (
        especialistaId: number,
        servicioId: number,
        data: Partial<EspecialistaServicioFormData>
    ): Promise<EspecialistaServicio> => {
        const response = await apiClient.put(`/especialistas/${especialistaId}/servicios/${servicioId}`, data);
        return response.data;
    },

    // Quitar un servicio de un especialista
    removeServicio: async (especialistaId: number, servicioId: number): Promise<void> => {
        await apiClient.delete(`/especialistas/${especialistaId}/servicios/${servicioId}`);
    },
};

export default especialistasApi;
