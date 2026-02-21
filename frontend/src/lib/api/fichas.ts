import { apiClient } from './client';

// ============================================
// TIPOS
// ============================================

export interface CampoFicha {
    id?: number;
    nombre: string;
    tipo: 'texto_corto' | 'texto_largo' | 'numero' | 'opcion_multiple' | 'casillas' | 'fecha' | 'informativo';
    opciones?: string; // Separadas por coma
    requerido: boolean;
    orden: number;
}

export interface PlantillaFicha {
    id: number;
    nombre: string;
    descripcion?: string;
    activa: boolean;
    sede_id?: number | null;
    fecha_creacion: string;
    fecha_actualizacion: string;
    campos: CampoFicha[];
}

export interface PlantillaFichaCreate {
    nombre: string;
    descripcion?: string;
    activa: boolean;
    sede_id?: number | null;
    campos: CampoFicha[];
}

export interface PlantillaFichaUpdate {
    nombre?: string;
    descripcion?: string;
    activa?: boolean;
    sede_id?: number | null;
}

export interface RespuestaFicha {
    id?: number;
    campo_id: number;
    valor?: string;
}

export interface CitaFicha {
    id: number;
    cita_id: number;
    plantilla_id: number;
    plantilla_nombre?: string;
    estado: 'pendiente' | 'enviada' | 'diligenciada';
    token_publico: string;
    fecha_envio?: string | null;
    fecha_diligenciamiento?: string | null;
    fecha_creacion: string;
    respuestas: RespuestaFicha[];
}

// ============================================
// API
// ============================================

export const fichasApi = {
    // --- Plantillas ---
    getPlantillas: async (activa?: boolean): Promise<PlantillaFicha[]> => {
        const response = await apiClient.get('/fichas/plantillas', {
            params: activa !== undefined ? { activa } : {}
        });
        return response.data;
    },

    getPlantilla: async (id: number): Promise<PlantillaFicha> => {
        const response = await apiClient.get(`/fichas/plantillas/${id}`);
        return response.data;
    },

    createPlantilla: async (data: PlantillaFichaCreate): Promise<PlantillaFicha> => {
        const response = await apiClient.post('/fichas/plantillas', data);
        return response.data;
    },

    updatePlantilla: async (id: number, data: PlantillaFichaUpdate): Promise<PlantillaFicha> => {
        const response = await apiClient.put(`/fichas/plantillas/${id}`, data);
        return response.data;
    },

    // --- Vinculación con Citas ---
    vincularFicha: async (citaId: number, plantillaId: number): Promise<CitaFicha> => {
        const response = await apiClient.post('/fichas/cita-ficha', {
            cita_id: citaId,
            plantilla_id: plantillaId
        });
        return response.data;
    },

    getFichasPorCita: async (citaId: number): Promise<CitaFicha[]> => {
        const response = await apiClient.get(`/fichas/cita-ficha/${citaId}`);
        return response.data;
    },

    marcarComoEnviada: async (citaFichaId: number): Promise<CitaFicha> => {
        const response = await apiClient.post(`/fichas/cita-ficha/${citaFichaId}/marcar-enviada`);
        return response.data;
    },

    // --- Portal Público ---
    // NOTA: Para llamadas públicas no se debería usar apiClient si este intercepta JWT siempre,
    // pero si el backend no requiere auth para esa ruta, enviarlo no daña nada.
    // Sin embargo, es mejor tener una función separada en Axios si no queremos enviar el token.
    getFormularioPublico: async (token: string): Promise<any> => {
        const response = await apiClient.get(`/fichas/publico/${token}`);
        return response.data;
    },

    enviarRespuestasPublicas: async (token: string, respuestas: { campo_id: number; valor: string | undefined }[]): Promise<void> => {
        await apiClient.post(`/fichas/publico/${token}/submit`, { respuestas });
    }
};
