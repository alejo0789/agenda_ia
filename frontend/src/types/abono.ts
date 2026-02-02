/**
 * Tipos para el módulo de Abonos
 */

// Estado de un abono
export type EstadoAbono = 'disponible' | 'usado' | 'anulado';

// Abono completo
export interface Abono {
    id: number;
    cliente_id: number;
    cliente_nombre: string;
    monto: number;
    saldo_disponible: number;
    cita_id: number | null;
    metodo_pago_id: number;
    metodo_pago_nombre: string;
    referencia_pago: string | null;
    estado: EstadoAbono;
    concepto: string | null;
    fecha_creacion: string;
}

// Abono para listado
export interface AbonoListItem {
    id: number;
    cliente_id: number;
    cliente_nombre: string;
    monto: number;
    saldo_disponible: number;
    estado: EstadoAbono;
    cita_id: number | null;
    concepto: string | null;
    fecha_creacion: string;
}

// Resumen de abonos de un cliente
export interface AbonoClienteResumen {
    cliente_id: number;
    cliente_nombre: string;
    total_abonos: number;
    saldo_disponible: number;
    cantidad_abonos: number;
    abonos: AbonoListItem[];
}

// Abono disponible para aplicar en factura
export interface AbonoParaFactura {
    id: number;
    monto_original: number;
    saldo_disponible: number;
    concepto: string | null;
    fecha_creacion: string;
    cita_id: number | null;
}

// Abonos disponibles para facturación
export interface AbonosClienteFactura {
    cliente_id: number;
    cliente_nombre: string;
    saldo_total_disponible: number;
    abonos: AbonoParaFactura[];
}

// DTO para crear abono
export interface AbonoCreateDTO {
    cliente_id: number;
    monto: number;
    metodo_pago_id: number;
    referencia_pago?: string;
    cita_id?: number;
    concepto?: string;
}

// DTO para aplicar abono a factura
export interface AbonoAplicarDTO {
    abono_id: number;
    monto: number;
}

// DTO para anular abono
export interface AbonoAnularDTO {
    motivo: string;
}

// Abono aplicado a una factura (respuesta)
export interface AbonoAplicado {
    abono_id: number;
    monto_aplicado: number;
    fecha_aplicacion: string;
}
