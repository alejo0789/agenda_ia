import { apiClient } from './client';

// ============================================
// TIPOS
// ============================================

export interface CitaCreate {
    cliente_id: number;
    especialista_id: number;
    servicio_id: number;
    fecha: string; // YYYY-MM-DD
    hora_inicio: string; // HH:MM
    notas?: string;
    monto_abono?: number;
    metodo_pago_id?: number;
    referencia_pago?: string;
    concepto_abono?: string;
}

export interface CitaUpdate {
    cliente_id?: number;
    especialista_id?: number;
    servicio_id?: number;
    fecha?: string;
    hora_inicio?: string;
    notas?: string;
    notas_internas?: string;
    estado?: string;
}

export interface ClienteSimple {
    id: number;
    nombre: string;
    apellido?: string | null;
    telefono?: string | null;
}

export interface EspecialistaSimple {
    id: number;
    nombre: string;
    apellido?: string | null;
    color?: string | null;
}

export interface ServicioSimple {
    id: number;
    nombre: string;
    duracion_minutos: number;
    precio_base: number;
    color_calendario?: string | null;
}

export interface Cita {
    id: number;
    cliente_id: number;
    especialista_id: number;
    servicio_id: number;
    fecha: string;
    hora_inicio: string;
    hora_fin: string;
    duracion_minutos: number;
    estado: string;
    notas?: string | null;
    notas_internas?: string | null;
    precio: number;
    fecha_creacion: string;
    fecha_actualizacion: string;
    cliente?: ClienteSimple | null;
    especialista?: EspecialistaSimple | null;
    servicio?: ServicioSimple | null;
}

export interface CitaListItem {
    id: number;
    cliente_id: number;
    especialista_id: number;
    servicio_id: number;
    fecha: string;
    hora_inicio: string;
    hora_fin: string;
    duracion_minutos: number;
    estado: string;
    notas?: string | null;
    cliente_nombre: string;
    cliente_telefono?: string | null;
    especialista_nombre: string;
    servicio_nombre: string;
    servicio_color?: string | null;
}

// ============================================
// API DE CITAS
// ============================================

export const citasApi = {
    /**
     * Listar citas por rango de fechas
     */
    getByFecha: async (
        fechaInicio: string,
        fechaFin?: string,
        especialistaId?: number,
        estado?: string
    ): Promise<CitaListItem[]> => {
        const params: Record<string, any> = { fecha_inicio: fechaInicio };
        if (fechaFin) params.fecha_fin = fechaFin;
        if (especialistaId) params.especialista_id = especialistaId;
        if (estado) params.estado = estado;

        const response = await apiClient.get('/citas', { params });
        return response.data;
    },

    /**
     * Obtener una cita por ID
     */
    getById: async (id: number): Promise<Cita> => {
        const response = await apiClient.get(`/citas/${id}`);
        return response.data;
    },

    /**
     * Crear una nueva cita
     */
    create: async (data: CitaCreate): Promise<Cita> => {
        const response = await apiClient.post('/citas', data);
        return response.data;
    },

    /**
     * Actualizar una cita
     */
    update: async (id: number, data: CitaUpdate): Promise<Cita> => {
        const response = await apiClient.put(`/citas/${id}`, data);
        return response.data;
    },

    /**
     * Cambiar estado de una cita
     */
    cambiarEstado: async (id: number, estado: string, notas?: string): Promise<Cita> => {
        const response = await apiClient.patch(`/citas/${id}/estado`, {
            estado,
            notas_internas: notas
        });
        return response.data;
    },

    /**
     * Eliminar una cita
     */
    delete: async (id: number): Promise<void> => {
        await apiClient.delete(`/citas/${id}`);
    },

    /**
     * Listar citas de un cliente
     */
    getByCliente: async (clienteId: number, limit: number = 50): Promise<CitaListItem[]> => {
        const response = await apiClient.get(`/citas/cliente/${clienteId}`, {
            params: { limit }
        });
        return response.data;
    },

    /**
     * Listar citas de un especialista en una fecha
     */
    getByEspecialista: async (especialistaId: number, fecha: string): Promise<CitaListItem[]> => {
        const response = await apiClient.get(`/citas/especialista/${especialistaId}/fecha/${fecha}`);
        return response.data;
    }
};
