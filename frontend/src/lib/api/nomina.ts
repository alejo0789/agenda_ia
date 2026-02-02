import api from './client';

export interface NominaItem {
    fecha: string;
    factura_numero: string;
    item_nombre: string;
    tipo: 'servicio' | 'producto';
    cantidad: number;
    precio_unitario: number;
    subtotal: number;
    comision_porcentaje: number;
    comision_valor: number;
}

export interface NominaResumenEspecialista {
    especialista_id: number;
    nombre: string;
    apellido: string;
    total_servicios: number;
    total_productos: number;
    comision_servicios: number;
    comision_productos: number;
    total_comision: number;
    items?: NominaItem[];
}

export interface NominaResponse {
    fecha_inicio: string;
    fecha_fin: string;
    resumen: NominaResumenEspecialista[];
}

export const nominaService = {
    getResumen: async (fechaInicio: string, fechaFin: string, sedeId?: number) => {
        const params = new URLSearchParams({
            fecha_inicio: fechaInicio,
            fecha_fin: fechaFin,
        });
        if (sedeId) params.append('sede_id', sedeId.toString());

        const response = await api.get<NominaResponse>(`/nomina/resumen?${params.toString()}`);
        return response.data;
    },

    getDetalleEspecialista: async (id: number, fechaInicio: string, fechaFin: string) => {
        const params = new URLSearchParams({
            fecha_inicio: fechaInicio,
            fecha_fin: fechaFin,
        });
        const response = await api.get<NominaResumenEspecialista>(`/nomina/detalle/${id}?${params.toString()}`);
        return response.data;
    }
};
