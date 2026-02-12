// Store Zustand para el módulo de Caja/POS

import { create } from 'zustand';
import {
    Caja,
    CajaDetalle,
    CajaAperturaCreate,
    CajaCierreCreate,
    MovimientoCaja,
    MovimientoCajaCreate,
    MetodoPago,
    Factura,
    FacturaDetalle,
    FacturaCreate,
    FacturaUpdate,
    FacturaPendiente,
    FacturaPendienteResumen,
    ItemCarrito,
    VentasDia,
} from '@/types/caja';
import {
    cajasApi,
    facturasApi,
    facturasPendientesApi,
    ventasApi,
    metodosPagoApi,
} from '@/lib/api/caja';

// ============================================
// STORE DE CAJA
// ============================================

interface CajaStoreState {
    // Estado de caja
    cajaActual: CajaDetalle | null;
    cajas: Caja[];
    isLoading: boolean;
    error: string | null;

    // Métodos de pago
    metodosPago: MetodoPago[];

    // Movimientos
    movimientos: MovimientoCaja[];

    // Actions
    fetchCajaActual: () => Promise<void>;
    abrirCaja: (datos: CajaAperturaCreate) => Promise<CajaDetalle>;
    cerrarCaja: (cajaId: number, datos: CajaCierreCreate) => Promise<CajaDetalle>;
    fetchCajas: (estado?: 'abierta' | 'cerrada' | 'todos') => Promise<void>;
    fetchMetodosPago: () => Promise<void>;
    fetchMovimientos: (cajaId: number) => Promise<void>;
    registrarMovimiento: (cajaId: number, datos: MovimientoCajaCreate) => Promise<void>;
    clearError: () => void;
}

export const useCajaStore = create<CajaStoreState>((set, get) => ({
    cajaActual: null,
    cajas: [],
    isLoading: false,
    error: null,
    metodosPago: [],
    movimientos: [],

    fetchCajaActual: async () => {
        set({ isLoading: true, error: null });
        try {
            const result = await cajasApi.obtenerCajaActual();
            set({ cajaActual: result.caja, isLoading: false });
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Error al cargar caja';
            set({ error: message, isLoading: false, cajaActual: null });
        }
    },

    abrirCaja: async (datos: CajaAperturaCreate) => {
        set({ isLoading: true, error: null });
        try {
            const caja = await cajasApi.abrirCaja(datos);
            set({ cajaActual: caja, isLoading: false });
            return caja;
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Error al abrir caja';
            set({ error: message, isLoading: false });
            throw error;
        }
    },

    cerrarCaja: async (cajaId: number, datos: CajaCierreCreate) => {
        set({ isLoading: true, error: null });
        try {
            const caja = await cajasApi.cerrarCaja(cajaId, datos);
            set({ cajaActual: null, isLoading: false });
            return caja;
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Error al cerrar caja';
            set({ error: message, isLoading: false });
            throw error;
        }
    },

    fetchCajas: async (estado) => {
        set({ isLoading: true, error: null });
        try {
            const result = await cajasApi.listarCajas({ estado, por_pagina: 50 });
            set({ cajas: result.items, isLoading: false });
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Error al cargar cajas';
            set({ error: message, isLoading: false });
        }
    },

    fetchMetodosPago: async () => {
        try {
            const metodos = await metodosPagoApi.listarMetodos(true);
            set({ metodosPago: metodos });
        } catch (error) {
            console.error('Error al cargar métodos de pago:', error);
        }
    },

    fetchMovimientos: async (cajaId: number) => {
        try {
            const movimientos = await cajasApi.listarMovimientos(cajaId);
            set({ movimientos });
        } catch (error) {
            console.error('Error al cargar movimientos:', error);
        }
    },

    registrarMovimiento: async (cajaId: number, datos: MovimientoCajaCreate) => {
        set({ isLoading: true, error: null });
        try {
            const mov = await cajasApi.registrarMovimiento(cajaId, datos);
            set({ movimientos: [...get().movimientos, mov], isLoading: false });
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Error al registrar movimiento';
            set({ error: message, isLoading: false });
            throw error;
        }
    },

    clearError: () => set({ error: null }),
}));

// ============================================
// STORE DE FACTURAS
// ============================================

interface FacturaStoreState {
    facturas: Factura[];
    facturaSeleccionada: FacturaDetalle | null;
    isLoading: boolean;
    error: string | null;

    // Paginación
    totalFacturas: number;
    paginaActual: number;

    // Actions
    fetchFacturas: (params?: {
        estado?: 'pendiente' | 'pagada' | 'anulada' | 'todos';
        caja_id?: number;
        cliente_id?: number;
        fecha_desde?: string;
        fecha_hasta?: string;
        pagina?: number;
    }) => Promise<void>;
    fetchFactura: (id: number) => Promise<FacturaDetalle | null>;
    crearFactura: (datos: FacturaCreate) => Promise<FacturaDetalle>;
    crearOrden: (datos: FacturaCreate) => Promise<FacturaDetalle>; // NEW
    actualizarFactura: (id: number, datos: FacturaUpdate) => Promise<FacturaDetalle>;
    anularFactura: (id: number, motivo: string) => Promise<void>;
    clearError: () => void;
}

export const useFacturaStore = create<FacturaStoreState>((set, get) => ({
    facturas: [],
    facturaSeleccionada: null,
    isLoading: false,
    error: null,
    totalFacturas: 0,
    paginaActual: 1,

    fetchFacturas: async (params) => {
        set({ isLoading: true, error: null });
        try {
            const result = await facturasApi.listarFacturas({ ...params, por_pagina: 20 });
            set({
                facturas: result.items,
                totalFacturas: result.total,
                paginaActual: result.pagina,
                isLoading: false,
            });
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Error al cargar facturas';
            set({ error: message, isLoading: false });
        }
    },

    fetchFactura: async (id: number) => {
        set({ isLoading: true, error: null });
        try {
            const factura = await facturasApi.obtenerFactura(id);
            set({ facturaSeleccionada: factura, isLoading: false });
            return factura;
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Error al cargar factura';
            set({ error: message, isLoading: false });
            return null;
        }
    },

    crearFactura: async (datos: FacturaCreate) => {
        set({ isLoading: true, error: null });
        try {
            const factura = await facturasApi.crearFactura(datos);
            set({
                facturas: [factura, ...get().facturas],
                isLoading: false,
            });
            return factura;
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Error al crear factura';
            set({ error: message, isLoading: false });
            throw error;
        }
    },

    crearOrden: async (datos: FacturaCreate) => {
        set({ isLoading: true, error: null });
        try {
            const factura = await facturasApi.crearOrden(datos);
            set({
                // No necesariamente agregamos a facturas si no estamos en vista de pendientes
                isLoading: false,
            });
            return factura;
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Error al crear orden';
            set({ error: message, isLoading: false });
            throw error;
        }
    },

    actualizarFactura: async (id: number, datos: FacturaUpdate) => {
        set({ isLoading: true, error: null });
        try {
            const factura = await facturasApi.actualizarFactura(id, datos);
            set({
                facturaSeleccionada: factura,
                isLoading: false,
            });
            return factura;
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Error al actualizar factura';
            set({ error: message, isLoading: false });
            throw error;
        }
    },

    anularFactura: async (id: number, motivo: string) => {
        set({ isLoading: true, error: null });
        try {
            const factura = await facturasApi.anularFactura(id, motivo);
            set({
                facturas: get().facturas.map((f) => (f.id === id ? { ...f, estado: 'anulada' } : f)),
                facturaSeleccionada: factura,
                isLoading: false,
            });
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Error al anular factura';
            set({ error: message, isLoading: false });
            throw error;
        }
    },

    clearError: () => set({ error: null }),
}));

// ============================================
// STORE DE CARRITO (POS)
// ============================================

interface CarritoStoreState {
    items: ItemCarrito[];
    clienteId: number | null;
    clienteNombre: string | null;
    clienteEsColaborador: boolean;
    descuentoGeneral: number;
    notas: string;
    aplicarImpuestos: boolean;
    facturaEdicionId: number | null;
    facturasPendientesIds: number[];

    aplicarPrecioColaborador: boolean; // Nuevo estado

    // Cálculos
    subtotal: number;
    iva: number;
    total: number;

    // Actions
    agregarItem: (item: Omit<ItemCarrito, 'id'>) => void;
    actualizarItem: (id: string, cambios: Partial<ItemCarrito>) => void;
    eliminarItem: (id: string) => void;
    setCliente: (id: number | null, nombre: string | null, esColaborador?: boolean) => void;
    togglePrecioColaborador: () => void; // Nueva acción
    setFacturasPendientesIds: (ids: number[]) => void;
    setDescuentoGeneral: (descuento: number) => void;
    setAplicarImpuestos: (aplicar: boolean) => void;
    setNotas: (notas: string) => void;
    limpiarCarrito: () => void;
    calcularTotales: () => void;
    setFacturaEdicion: (id: number | null) => void;
}

export const useCarritoStore = create<CarritoStoreState>((set, get) => ({
    items: [],
    clienteId: null,
    clienteNombre: null,
    clienteEsColaborador: false,
    aplicarPrecioColaborador: false, // Inicializar en false
    descuentoGeneral: 0,
    notas: '',
    aplicarImpuestos: false,
    facturaEdicionId: null,
    facturasPendientesIds: [],
    subtotal: 0,
    iva: 0,
    total: 0,

    agregarItem: (item) => {
        // Generar ID único compatible con todos los navegadores (incluso no-seguros HTTP)
        const generateId = () => {
            return Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
        };
        const id = generateId();

        const nuevoItem = { ...item, id };

        // Aplicar precio colaborador si está activado el switch manual
        // OJO: El switch (aplicarPrecioColaborador) es el que manda ahora.
        // Se activa automáticamente al seleccionar un colaborador, pero se puede togglear.
        if (get().aplicarPrecioColaborador && nuevoItem.precio_colaborador) {
            nuevoItem.precio_colaborador_aplicado = true;
            nuevoItem.precio_unitario = nuevoItem.precio_colaborador;
        }

        const newItems = [...get().items, nuevoItem];
        set({ items: newItems });
        get().calcularTotales();
    },

    actualizarItem: (id, cambios) => {
        const items = get().items;
        const index = items.findIndex((i) => i.id === id);
        if (index === -1) return;

        const item = items[index];
        const nuevoItem = { ...item, ...cambios };

        // 1. Recalcular precio unitario si cambia "precio_colaborador_aplicado"
        if (cambios.precio_colaborador_aplicado !== undefined) {
            if (nuevoItem.precio_colaborador_aplicado) {
                nuevoItem.precio_unitario = nuevoItem.precio_colaborador ?? nuevoItem.precio_unitario;
            } else {
                nuevoItem.precio_unitario = nuevoItem.precio_regular ?? nuevoItem.precio_unitario;
            }
        }

        // 2. Recalcular descuento si cambia cantidad, valor_descuento, tipo_descuento, o precio_unitario
        if (nuevoItem.tipo_descuento && nuevoItem.valor_descuento) {
            const base = nuevoItem.precio_unitario * nuevoItem.cantidad;
            if (nuevoItem.tipo_descuento === 'porcentaje') {
                nuevoItem.descuento = (base * nuevoItem.valor_descuento) / 100;
            } else {
                // Monto fijo se asume como valor total del descuento para la linea
                nuevoItem.descuento = nuevoItem.valor_descuento;
            }
        } else {
            // Si se quitó el descuento explícitamente (tipo_descuento undefined o valor 0)
            // aseguramos que sea 0, salvo que se haya enviado un cambio directo en 'descuento' (manual override?)
            // Por ahora asumimos que si hay tipo/valor se calcula, si no, es 0.
            if (cambios.descuento === undefined) {
                nuevoItem.descuento = 0;
            }
        }

        const newItems = [...items];
        newItems[index] = nuevoItem;
        set({ items: newItems });
        get().calcularTotales();
    },

    eliminarItem: (id) => {
        const newItems = get().items.filter((item) => item.id !== id);
        set({ items: newItems });
        get().calcularTotales();
    },

    setCliente: (id, nombre, esColaborador = false) => {
        // Al cambiar cliente, actualizamos su estado y también el switch de precio colaborador
        // Si el nuevo cliente ES colaborador, activamos el precio especial por defecto.
        // Si no lo es, lo desactivamos por defecto (aunque el usuario podrá reactivarlo manualmente luego).
        set({
            clienteId: id,
            clienteNombre: nombre,
            clienteEsColaborador: esColaborador,
            aplicarPrecioColaborador: esColaborador // Auto-activar si es colaborador
        });

        // Recalcular precios de items existentes basado en el nuevo valor de aplicarPrecioColaborador
        const aplicarPrecio = esColaborador;
        const items = get().items.map(item => {
            const newItem = { ...item };
            if (aplicarPrecio && newItem.precio_colaborador) {
                newItem.precio_colaborador_aplicado = true;
                newItem.precio_unitario = newItem.precio_colaborador;
            } else {
                // Si ya no aplica, revertimos al precio regular (si estaba aplicado)
                // OJO: Si el usuario había aplicado manualmente precio colaborador a un NO colaborador,
                // al cambiar de cliente se resetea según la lógica de arriba. 
                // Esto es aceptable: nuevo cliente = reset de condiciones.
                if (newItem.precio_colaborador_aplicado) {
                    newItem.precio_colaborador_aplicado = false;
                    newItem.precio_unitario = newItem.precio_regular || newItem.precio_unitario;
                }
            }
            return newItem;
        });

        set({ items });
        get().calcularTotales();
    },

    togglePrecioColaborador: () => {
        const nuevoEstado = !get().aplicarPrecioColaborador;
        set({ aplicarPrecioColaborador: nuevoEstado });

        // Recalcular todos los items
        const items = get().items.map(item => {
            const newItem = { ...item };
            // Si activamos el precio colaborador y el producto tiene uno configurado
            if (nuevoEstado && newItem.precio_colaborador) {
                newItem.precio_colaborador_aplicado = true;
                newItem.precio_unitario = newItem.precio_colaborador;
            }
            // Si desactivamos
            else if (!nuevoEstado && newItem.precio_colaborador_aplicado) {
                newItem.precio_colaborador_aplicado = false;
                newItem.precio_unitario = newItem.precio_regular || newItem.precio_unitario;
            }
            return newItem;
        });

        set({ items });
        get().calcularTotales();
    },

    setFacturasPendientesIds: (ids) => {
        set({ facturasPendientesIds: ids });
    },

    setDescuentoGeneral: (descuento) => {
        set({ descuentoGeneral: descuento });
        get().calcularTotales();
    },

    setAplicarImpuestos: (aplicar) => {
        set({ aplicarImpuestos: aplicar });
        get().calcularTotales();
    },

    setNotas: (notas) => {
        set({ notas });
    },

    setFacturaEdicion: (id) => set({ facturaEdicionId: id }),

    limpiarCarrito: () => {
        set({
            items: [],
            clienteId: null,
            clienteNombre: null,
            clienteEsColaborador: false,
            aplicarPrecioColaborador: false,
            descuentoGeneral: 0,
            notas: '',
            aplicarImpuestos: false,
            facturaEdicionId: null,
            facturasPendientesIds: [],
            subtotal: 0,
            iva: 0,
            total: 0,
        });
    },

    calcularTotales: () => {
        const items = get().items;
        const descuentoGeneral = get().descuentoGeneral;
        const aplicarImpuestos = get().aplicarImpuestos;
        const IVA_PORCENTAJE = 0.19;

        const subtotal = items.reduce((acc, item) => {
            const linea = item.precio_unitario * item.cantidad - item.descuento;
            return acc + linea;
        }, 0);

        const subtotalConDescuento = subtotal - descuentoGeneral;
        const iva = aplicarImpuestos ? subtotalConDescuento * IVA_PORCENTAJE : 0;
        const total = subtotalConDescuento + iva;

        set({ subtotal, iva, total: Math.max(0, total) });
    },
}));

// ============================================
// STORE DE VENTAS/REPORTES
// ============================================

interface VentasStoreState {
    ventasDia: VentasDia | null;
    isLoading: boolean;
    error: string | null;

    fetchVentasDia: (fecha?: string) => Promise<void>;
    clearError: () => void;
}

export const useVentasStore = create<VentasStoreState>((set) => ({
    ventasDia: null,
    isLoading: false,
    error: null,

    fetchVentasDia: async (fecha) => {
        set({ isLoading: true, error: null });
        try {
            const ventas = await ventasApi.ventasDia(fecha);
            set({ ventasDia: ventas, isLoading: false });
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Error al cargar ventas';
            set({ error: message, isLoading: false });
        }
    },

    clearError: () => set({ error: null }),
}));

// ============================================
// STORE DE FACTURAS PENDIENTES
// ============================================

interface FacturasPendientesStoreState {
    pendientes: FacturaPendiente[];
    resumenPendientes: FacturaPendienteResumen[];
    isLoading: boolean;
    error: string | null;

    fetchPendientes: (params?: {
        estado?: 'pendiente' | 'aprobada' | 'rechazada' | 'todos';
        especialista_id?: number;
        cliente_id?: number;
    }) => Promise<void>;
    fetchResumenPorCliente: (params?: {
        cliente_id?: number;
        fecha_inicio?: string;
        fecha_fin?: string;
    }) => Promise<void>;
    aprobarPendiente: (id: number) => Promise<void>;
    rechazarPendiente: (id: number, motivo: string) => Promise<void>;
    clearError: () => void;
}

export const useFacturasPendientesStore = create<FacturasPendientesStoreState>((set, get) => ({
    pendientes: [],
    resumenPendientes: [],
    isLoading: false,
    error: null,

    fetchPendientes: async (params) => {
        set({ isLoading: true, error: null });
        try {
            const pendientes = await facturasPendientesApi.listarPendientes(params);
            set({ pendientes, isLoading: false });
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Error al cargar pendientes';
            set({ error: message, isLoading: false });
        }
    },

    fetchResumenPorCliente: async (params) => {
        set({ isLoading: true, error: null });
        try {
            const resumen = await facturasPendientesApi.resumenPorCliente(params);
            set({ resumenPendientes: resumen, isLoading: false });
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Error al cargar resumen de pendientes';
            set({ error: message, isLoading: false });
        }
    },

    aprobarPendiente: async (id: number) => {
        set({ isLoading: true, error: null });
        try {
            await facturasPendientesApi.aprobarPendiente(id);
            set({
                pendientes: get().pendientes.map((p) =>
                    p.id === id ? { ...p, estado: 'aprobada' } : p
                ),
                isLoading: false,
            });
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Error al aprobar pendiente';
            set({ error: message, isLoading: false });
            throw error;
        }
    },

    rechazarPendiente: async (id: number, motivo: string) => {
        set({ isLoading: true, error: null });
        try {
            await facturasPendientesApi.rechazarPendiente(id, motivo);
            set({
                pendientes: get().pendientes.map((p) =>
                    p.id === id ? { ...p, estado: 'rechazada' } : p
                ),
                isLoading: false,
            });
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Error al rechazar pendiente';
            set({ error: message, isLoading: false });
            throw error;
        }
    },

    clearError: () => set({ error: null }),
}));
