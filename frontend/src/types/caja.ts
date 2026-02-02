// Tipos para el módulo de Caja/POS

// ========== MÉTODOS DE PAGO ==========
export interface MetodoPago {
    id: number;
    nombre: string;
    activo: boolean;
    requiere_referencia: boolean;
}

// ========== CAJA ==========
export interface Caja {
    id: number;
    nombre: string;
    estado: 'abierta' | 'cerrada';
    fecha_apertura: string;
    monto_apertura: number;
    fecha_cierre?: string;
    monto_cierre?: number;
    usuario_apertura_nombre?: string;
    usuario_cierre_nombre?: string;
}

export interface CajaDetalle extends Caja {
    total_efectivo_teorico: number;
    total_ventas: number;
    total_servicios: number;
    total_productos: number;
    cantidad_facturas: number;
    diferencia: number;
}

export interface CajaAperturaCreate {
    nombre?: string;
    monto_apertura: number;
    notas?: string;
}

export interface CajaCierreCreate {
    monto_cierre: number;
    notas?: string;
}

export interface CajaCuadre {
    caja_id: number;
    monto_apertura: number;
    monto_cierre?: number;
    total_ingresos: number;
    total_egresos: number;
    efectivo_teorico: number;
    diferencia: number;
    resumen_ventas: {
        total: number;
        efectivo: number;
        otros_metodos: number;
    };
}

// ========== MOVIMIENTOS DE CAJA ==========
export interface MovimientoCaja {
    id: number;
    caja_id: number;
    tipo: 'ingreso' | 'egreso';
    monto: number;
    concepto: string;
    factura_id?: number;
    usuario_id: number;
    usuario_nombre?: string;
    fecha: string;
}

export interface MovimientoCajaCreate {
    tipo: 'ingreso' | 'egreso';
    monto: number;
    concepto: string;
}

// ========== FACTURAS ==========
export interface DetalleFacturaCreate {
    tipo: 'servicio' | 'producto';
    item_id: number;
    cantidad?: number;
    precio_unitario: number;
    descuento_linea?: number;
    especialista_id: number;
    cita_id?: number;
}

export interface PagoFacturaCreate {
    metodo_pago_id: number;
    monto: number;
    referencia_pago?: string;
}

// Abono a aplicar en factura
export interface AbonoAplicarCreate {
    abono_id: number;
    monto: number;
}

export interface FacturaCreate {
    cliente_id?: number;
    detalle: DetalleFacturaCreate[];
    pagos: PagoFacturaCreate[];
    abonos_aplicar?: AbonoAplicarCreate[];
    descuento?: number;
    aplicar_impuestos?: boolean;
    notas?: string;
    facturas_pendientes_ids?: number[];
    factura_id_remplazar?: number;
}

export interface DetalleFacturaUpdate {
    id?: number;
    cantidad?: number;
    precio_unitario?: number;
    descuento_linea?: number;
    especialista_id?: number;
    // Campos para creación de nuevos items o referencia
    tipo?: 'servicio' | 'producto';
    item_id?: number;
    item_nombre?: string;
}

export interface PagoFacturaUpdate {
    id?: number;
    metodo_pago_id: number;
    monto: number;
    referencia_pago?: string;
}

export interface AbonoFacturaUpdate {
    id?: number; // ID de relación (redencion)
    abono_id: number;
    monto_aplicado: number;
}

export interface FacturaUpdate {
    detalle: DetalleFacturaUpdate[];
    pagos?: PagoFacturaUpdate[];
    abonos?: AbonoFacturaUpdate[];
    notas?: string;
    aplicar_impuestos?: boolean;
}

export interface DetalleFacturaResponse {
    id: number;
    tipo: 'servicio' | 'producto';
    item_id: number;
    item_nombre: string;
    cantidad: number;
    precio_unitario: number;
    descuento_linea: number;
    subtotal: number;
    especialista_id?: number;
    especialista_nombre?: string;
    cita_id?: number;
    comision?: {
        tipo_comision: string;
        valor_comision: number;
        monto_comision: number;
    };
}

export interface PagoFacturaResponse {
    id: number;
    metodo_pago_id: number;
    metodo_pago_nombre: string;
    monto: number;
    referencia_pago?: string;
    fecha_pago: string;
}

// Abono aplicado a una factura
export interface AbonoAplicadoResponse {
    id: number;
    abono_id: number;
    monto_aplicado: number;
    fecha_aplicacion: string;
}

export interface Factura {
    id: number;
    numero_factura: string;
    cliente_id?: number;
    cliente_nombre?: string;
    fecha: string;
    subtotal: number;
    descuento: number;
    impuestos: number;
    total: number;
    estado: 'pendiente' | 'pagada' | 'anulada';
    total_pagado: number;
}

export interface FacturaDetalle extends Factura {
    detalle: DetalleFacturaResponse[];
    pagos: PagoFacturaResponse[];
    abonos_aplicados?: AbonoAplicadoResponse[];
    total_abonos_aplicados?: number;
    saldo_pendiente: number;
    caja_id: number;
    usuario_id: number;
    notas?: string;
}

// ========== FACTURAS PENDIENTES ==========
export interface FacturaPendiente {
    id: number;
    especialista_id: number;
    especialista_nombre: string;
    cliente_id?: number;
    cliente_nombre?: string;
    tipo: 'servicio' | 'producto';
    servicio_id: number | null;
    producto_id: number | null;
    servicio_nombre: string;
    servicio_precio: number;
    cantidad: number;
    fecha_servicio: string;
    estado: 'pendiente' | 'aprobada' | 'rechazada' | 'facturada';
    notas?: string;
    fecha_creacion: string;
}

export interface FacturaPendienteResumen {
    cliente_id: number;
    cliente_nombre: string;
    total_servicios: number;
    total_monto: number;
    servicios: FacturaPendiente[];
}

// ========== VENTAS ==========
export interface VentasDia {
    fecha: string;
    total_ventas: number;
    total_servicios: number;
    total_productos: number;
    cantidad_facturas: number;
    cantidad_facturas_anuladas: number;
}

export interface VentasPorMetodoPago {
    metodo_pago_id: number;
    metodo_pago_nombre: string;
    total: number;
    cantidad: number;
}

// ========== COMISIONES ==========
export interface ComisionEspecialista {
    especialista_id: number;
    especialista_nombre: string;
    total_servicios: number;
    total_productos: number;
    total_comision: number;
    cantidad_items: number;
}

export interface ResumenComisiones {
    fecha_desde: string;
    fecha_hasta: string;
    total_general: number;
    cantidad_especialistas: number;
    detalle_por_especialista: ComisionEspecialista[];
}

// ========== ITEM CARRITO (para POS) ==========
export interface ItemCarrito {
    id: string; // ID único en carrito (uuid)
    detalle_id?: number; // ID real en base de datos (para edición)
    tipo: 'servicio' | 'producto';
    item_id: number;
    nombre: string;
    cantidad: number;
    precio_unitario: number;
    descuento: number;
    especialista_id: number;
    especialista_nombre: string;
    cita_id?: number;
    factura_pendiente_id?: number; // ID del servicio pendiente (si viene de facturas en espera)
}

// ========== PAGINACIÓN ==========
export interface FacturasPaginadas {
    total: number;
    pagina: number;
    por_pagina: number;
    total_paginas: number;
    items: Factura[];
}

export interface CajasPaginadas {
    total: number;
    pagina: number;
    por_pagina: number;
    total_paginas: number;
    items: Caja[];
}

// ========== UTILS ==========
export function formatPrecio(precio: number): string {
    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(precio);
}

export function getEstadoFacturaColor(estado: Factura['estado']): string {
    switch (estado) {
        case 'pagada':
            return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
        case 'pendiente':
            return 'bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-400';
        case 'anulada':
            return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
        default:
            return 'bg-gray-100 text-gray-800';
    }
}

export function getEstadoCajaColor(estado: Caja['estado']): string {
    switch (estado) {
        case 'abierta':
            return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
        case 'cerrada':
            return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
        default:
            return 'bg-gray-100 text-gray-800';
    }
}
