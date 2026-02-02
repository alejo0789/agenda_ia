import api from './client';

export interface DashboardStats {
    citas_hoy: number;
    clientes_activos: number;
    especialistas_activos: number;
    ingresos_mes: number | null;
}

export const dashboardApi = {
    getStats: async (): Promise<DashboardStats> => {
        const response = await api.get('/dashboard/stats');
        return response.data;
    },
};
