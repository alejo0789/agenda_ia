import { apiClient } from './client';

export interface EspecialistaMappingData {
    especialista_id: number;
    lizto_staff_id: number;
    lizto_staff_name?: string | null;
}

export interface ServicioMappingData {
    servicio_id: number;
    lizto_service_id: number;
    lizto_price_id: number;
    lizto_price_value: number;
    lizto_service_name?: string | null;
}

export const liztoApi = {
    // 1. Publicar Cita
    publicarCita: async (citaId: number) => {
        const response = await apiClient.post(`/lizto/publicar/${citaId}`);
        return response.data;
    },

    // 2. Gestion Mapping Especialistas
    listarMappingEspecialistas: async (): Promise<EspecialistaMappingData[]> => {
        const response = await apiClient.get('/lizto/mapping/especialistas');
        return response.data;
    },
    guardarMappingEspecialista: async (data: EspecialistaMappingData) => {
        const response = await apiClient.post('/lizto/mapping/especialistas', data);
        return response.data;
    },

    // 3. Gestion Mapping Servicios
    listarMappingServicios: async (): Promise<ServicioMappingData[]> => {
        const response = await apiClient.get('/lizto/mapping/servicios');
        return response.data;
    },
    guardarMappingServicio: async (data: ServicioMappingData) => {
        const response = await apiClient.post('/lizto/mapping/servicios', data);
        return response.data;
    },

    // 4. API de Lizto (proxy)
    listarStaffLizto: async () => {
        const response = await apiClient.get('/lizto/staff');
        return response.data.items || [];
    },
    listarServiciosLizto: async () => {
        const response = await apiClient.get('/lizto/services');
        return response.data.items || [];
    },

    // 5. Config
    getConfig: async () => {
        const response = await apiClient.get('/lizto/config');
        return response.data;
    },
    updateConfig: async (key: string, value: string) => {
        const response = await apiClient.put('/lizto/config', { key, value });
        return response.data;
    }
};
