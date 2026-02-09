import api from './client';

export interface CitaDashboard {
    id: number;
    hora: string;
    cliente: string;
    servicio: string;
    especialista: string;
    estado: string;
}

export interface DashboardStats {
    citas_hoy: number;
    clientes_activos: number;
    especialistas_activos: number;
    ingresos_mes: number | null;
    proximas_citas: CitaDashboard[];
}

export const dashboardApi = {
    getStats: async (): Promise<DashboardStats> => {
        const response = await api.get('/dashboard/stats');
        return response.data;
    },
};
