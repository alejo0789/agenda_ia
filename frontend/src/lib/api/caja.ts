// API Client para el módulo de Caja/POS

import { apiClient } from './client';
import type {
    Caja,
    CajaDetalle,
    CajaAperturaCreate,
    CajaCierreCreate,
    CajaCuadre,
    CajasPaginadas,
    MovimientoCaja,
    MovimientoCajaCreate,
    MetodoPago,
    Factura,
    FacturaDetalle,
    FacturaCreate,
    FacturaUpdate,
    FacturasPaginadas,
    FacturaPendiente,
    FacturaPendienteResumen,
    VentasDia,
    VentasPorMetodoPago,
    ResumenComisiones,
    ComisionEspecialista,
} from '@/types/caja';

// ========== CAJAS ==========
export const cajasApi = {
    // Obtener caja abierta actual
    async obtenerCajaActual(): Promise<{ caja: CajaDetalle | null; message?: string }> {
        const { data } = await apiClient.get('/cajas/actual');
        return data;
    },

    // Abrir nueva caja
    async abrirCaja(datos: CajaAperturaCreate): Promise<CajaDetalle> {
        const { data } = await apiClient.post('/cajas/apertura', datos);
        return data;
    },

    // Cerrar caja
    async cerrarCaja(cajaId: number, datos: CajaCierreCreate): Promise<CajaDetalle> {
        const { data } = await apiClient.post(`/cajas/${cajaId}/cierre`, datos);
        return data;
    },

    // Obtener detalle de caja
    async obtenerCaja(cajaId: number): Promise<CajaDetalle> {
        const { data } = await apiClient.get(`/cajas/${cajaId}`);
        return data;
    },

    // Listar cajas
    async listarCajas(params?: {
        estado?: 'abierta' | 'cerrada' | 'todos';
        pagina?: number;
        por_pagina?: number;
    }): Promise<CajasPaginadas> {
        const { data } = await apiClient.get('/cajas', { params });
        return data;
    },

    // Obtener cuadre de caja
    async obtenerCuadre(cajaId: number): Promise<CajaCuadre> {
        const { data } = await apiClient.get(`/cajas/${cajaId}/cuadre`);
        return data;
    },

    // Listar movimientos de una caja
    async listarMovimientos(cajaId: number, tipo?: 'ingreso' | 'egreso' | 'todos'): Promise<MovimientoCaja[]> {
        const { data } = await apiClient.get(`/cajas/${cajaId}/movimientos`, {
            params: tipo ? { tipo } : undefined,
        });
        return data;
    },

    // Registrar movimiento (ingreso/egreso)
    async registrarMovimiento(cajaId: number, datos: MovimientoCajaCreate): Promise<MovimientoCaja> {
        const { data } = await apiClient.post(`/cajas/${cajaId}/movimientos`, datos);
        return data;
    },

    // Obtener resumen de movimientos
    async obtenerResumenMovimientos(cajaId: number): Promise<{
        total_ingresos: number;
        total_egresos: number;
        cantidad_movimientos: number;
    }> {
        const { data } = await apiClient.get(`/cajas/${cajaId}/movimientos/resumen`);
        return data;
    },
};

// ========== FACTURAS ==========
export const facturasApi = {
    // Listar facturas
    async listarFacturas(params?: {
        estado?: 'pendiente' | 'pagada' | 'anulada' | 'todos';
        caja_id?: number;
        cliente_id?: number;
        fecha_desde?: string;
        fecha_hasta?: string;
        pagina?: number;
        por_pagina?: number;
    }): Promise<FacturasPaginadas> {
        const { data } = await apiClient.get('/facturas', { params });
        return data;
    },

    // Obtener detalle de factura
    async obtenerFactura(facturaId: number): Promise<FacturaDetalle> {
        const { data } = await apiClient.get(`/facturas/${facturaId}`);
        return data;
    },

    // Crear factura (flujo directo)
    async crearFactura(datos: FacturaCreate): Promise<FacturaDetalle> {
        const { data } = await apiClient.post('/facturas', datos);
        return data;
    },

    // Crear orden pendiente (Especialistas)
    async crearOrden(datos: FacturaCreate): Promise<FacturaDetalle> {
        const { data } = await apiClient.post('/facturas/orden', datos);
        return data;
    },

    // Crear factura desde pendientes
    async crearFacturaDesdePendientes(datos: {
        cliente_id: number;
        facturas_pendientes_ids: number[];
        detalle_adicional?: FacturaCreate['detalle'];
        pagos: FacturaCreate['pagos'];
        descuento?: number;
        notas?: string;
    }): Promise<FacturaDetalle> {
        const { data } = await apiClient.post('/facturas/desde-pendientes', datos);
        return data;
    },

    // Anular factura
    async anularFactura(facturaId: number, motivo: string): Promise<FacturaDetalle> {
        const { data } = await apiClient.put(`/facturas/${facturaId}/anular`, { motivo });
        return data;
    },

    // Actualizar factura (Admin)
    async actualizarFactura(facturaId: number, datos: FacturaUpdate): Promise<FacturaDetalle> {
        const { data } = await apiClient.put(`/facturas/${facturaId}`, datos);
        return data;
    },
};

// ========== FACTURAS PENDIENTES ==========
export const facturasPendientesApi = {
    // Listar pendientes
    async listarPendientes(params?: {
        estado?: 'pendiente' | 'aprobada' | 'rechazada' | 'todos';
        especialista_id?: number;
        cliente_id?: number;
    }): Promise<FacturaPendiente[]> {
        const { data } = await apiClient.get('/facturas-pendientes', { params });
        return data;
    },

    // Resumen por cliente
    async resumenPorCliente(params?: {
        cliente_id?: number;
        fecha_inicio?: string;
        fecha_fin?: string;
    }): Promise<FacturaPendienteResumen[]> {
        const { data } = await apiClient.get('/facturas-pendientes/resumen-por-cliente', {
            params,
        });
        return data;
    },

    // Obtener detalle de pendiente
    async obtenerPendiente(pendienteId: number): Promise<FacturaPendiente> {
        const { data } = await apiClient.get(`/facturas-pendientes/${pendienteId}`);
        return data;
    },

    // Aprobar pendiente
    async aprobarPendiente(pendienteId: number): Promise<FacturaPendiente> {
        const { data } = await apiClient.post(`/facturas-pendientes/${pendienteId}/aprobar`);
        return data;
    },

    // Rechazar pendiente
    async rechazarPendiente(pendienteId: number, motivo: string): Promise<FacturaPendiente> {
        const { data } = await apiClient.post(`/facturas-pendientes/${pendienteId}/rechazar`, {
            motivo_rechazo: motivo,
        });
        return data;
    },
};

// ========== VENTAS ==========
export const ventasApi = {
    // Ventas del día
    async ventasDia(fecha?: string): Promise<VentasDia> {
        const { data } = await apiClient.get('/ventas/dia', {
            params: fecha ? { fecha } : undefined,
        });
        return data;
    },

    // Ventas por período
    async ventasPeriodo(fechaInicio: string, fechaFin: string): Promise<VentasDia[]> {
        const { data } = await apiClient.get('/ventas/periodo', {
            params: { fecha_inicio: fechaInicio, fecha_fin: fechaFin },
        });
        return data;
    },

    // Ventas por método de pago
    async ventasPorMetodoPago(fechaInicio?: string, fechaFin?: string): Promise<VentasPorMetodoPago[]> {
        const { data } = await apiClient.get('/ventas/metodos-pago', {
            params: { fecha_inicio: fechaInicio, fecha_fin: fechaFin },
        });
        return data;
    },
};

// ========== MÉTODOS DE PAGO ==========
export const metodosPagoApi = {
    // Listar métodos de pago
    async listarMetodos(soloActivos = true): Promise<MetodoPago[]> {
        const { data } = await apiClient.get('/metodos-pago', {
            params: { solo_activos: soloActivos },
        });
        return data;
    },

    // Actualizar método de pago
    async actualizarMetodo(metodoId: number, activo: boolean): Promise<MetodoPago> {
        const { data } = await apiClient.put(`/metodos-pago/${metodoId}`, { activo });
        return data;
    },
};

// ========== COMISIONES ==========
export const comisionesApi = {
    // Comisiones de una factura
    async comisionesFactura(facturaId: number): Promise<{
        factura_id: number;
        numero_factura: string;
        total_factura: number;
        comisiones: Array<{
            detalle_factura_id: number;
            especialista_id: number;
            tipo: string;
            item_id: number;
            subtotal_linea: number;
            tipo_comision: string;
            valor_comision: number;
            monto_comision: number;
        }>;
        resumen_por_especialista: Array<{
            especialista_id: number;
            total_comision: number;
            detalle: unknown[];
        }>;
    }> {
        const { data } = await apiClient.get(`/comisiones/factura/${facturaId}`);
        return data;
    },

    // Comisiones de un especialista
    async comisionesEspecialista(
        especialistaId: number,
        fechaDesde?: string,
        fechaHasta?: string
    ): Promise<{
        especialista: { id: number; nombre: string };
        fecha_desde: string;
        fecha_hasta: string;
        total_servicios: number;
        total_productos: number;
        total_comision: number;
        cantidad_items: number;
        detalle: unknown[];
    }> {
        const { data } = await apiClient.get(`/comisiones/especialista/${especialistaId}`, {
            params: { fecha_desde: fechaDesde, fecha_hasta: fechaHasta },
        });
        return data;
    },

    // Resumen general de comisiones
    async resumenComisiones(fechaDesde?: string, fechaHasta?: string): Promise<ResumenComisiones> {
        const { data } = await apiClient.get('/comisiones/resumen', {
            params: { fecha_desde: fechaDesde, fecha_hasta: fechaHasta },
        });
        return data;
    },
};
