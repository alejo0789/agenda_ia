// Tipos para el módulo de Inventario
// Alineados con el backend FastAPI

// ============================================
// PROVEEDORES
// ============================================

export type EstadoProveedor = 'activo' | 'inactivo';

export interface Proveedor {
    id: number;
    nombre: string;
    contacto: string | null;
    telefono: string | null;
    email: string | null;
    direccion: string | null;
    notas: string | null;
    estado: EstadoProveedor;
    fecha_creacion: string;
    fecha_actualizacion: string;
    // Campo calculado
    total_productos?: number;
}

export interface ProveedorCreate {
    nombre: string;
    contacto?: string;
    telefono?: string;
    email?: string;
    direccion?: string;
    notas?: string;
    estado?: EstadoProveedor;
}

export interface ProveedorUpdate {
    nombre?: string;
    contacto?: string;
    telefono?: string;
    email?: string;
    direccion?: string;
    notas?: string;
    estado?: EstadoProveedor;
}

// ============================================
// PRODUCTOS
// ============================================

export type EstadoProducto = 'activo' | 'inactivo' | 'descontinuado';

export interface Producto {
    id: number;
    nombre: string;
    codigo: string | null;
    codigo_barras: string | null;
    descripcion: string | null;
    precio_compra: number;
    precio_venta: number;
    precio_colaborador: number | null;
    comision_porcentaje: number | null;
    proveedor_id: number | null;
    stock_minimo: number;
    stock_maximo: number | null;
    fecha_vencimiento: string | null;
    lote: string | null;
    imagen_url: string | null;
    estado: EstadoProducto;
    fecha_creacion: string;
    fecha_actualizacion: string;
    // Relaciones
    proveedor?: Proveedor;
    // Campos calculados
    stock_total?: number;
    stock_bodega?: number;
    stock_vitrina?: number;
    margen_ganancia?: number;
}

export interface ProductoCreate {
    nombre: string;
    codigo?: string;
    codigo_barras?: string;
    descripcion?: string;
    precio_compra: number;
    precio_venta: number;
    precio_colaborador?: number;
    comision_porcentaje?: number;
    proveedor_id?: number | null;
    stock_minimo?: number;
    stock_maximo?: number;
    fecha_vencimiento?: string;
    lote?: string;
    imagen_url?: string;
    estado?: EstadoProducto;
}

export interface ProductoUpdate {
    nombre?: string;
    codigo?: string;
    codigo_barras?: string;
    descripcion?: string;
    precio_compra?: number;
    precio_venta?: number;
    precio_colaborador?: number;
    comision_porcentaje?: number;
    proveedor_id?: number | null;
    stock_minimo?: number;
    stock_maximo?: number;
    fecha_vencimiento?: string;
    lote?: string;
    imagen_url?: string;
    estado?: EstadoProducto;
}

// ============================================
// UBICACIONES DE INVENTARIO
// ============================================

export type TipoUbicacion = 'bodega' | 'vitrina' | 'otro';
export type EstadoUbicacion = 'activo' | 'inactivo';

export interface UbicacionInventario {
    id: number;
    nombre: string;
    descripcion: string | null;
    tipo: TipoUbicacion;
    estado: EstadoUbicacion;
    fecha_creacion: string;
    fecha_actualizacion: string;
}

// ============================================
// INVENTARIO
// ============================================

export interface Inventario {
    id: number;
    producto_id: number;
    ubicacion_id: number;
    cantidad: number;
    fecha_actualizacion: string;
    // Relaciones
    producto?: Producto;
    ubicacion?: UbicacionInventario;
}

export interface InventarioDetalle {
    producto: Producto;
    ubicaciones: {
        ubicacion_id: number;
        ubicacion_nombre: string;
        cantidad: number;
    }[];
    stock_total: number;
}

// ============================================
// MOVIMIENTOS DE INVENTARIO
// ============================================

export type TipoMovimiento =
    | 'compra'
    | 'venta'
    | 'ajuste_positivo'
    | 'ajuste_negativo'
    | 'transferencia'
    | 'uso_interno'
    | 'devolucion'
    | 'merma'
    | 'muestra'
    | 'donacion';

export interface MovimientoInventario {
    id: number;
    producto_id: number;
    ubicacion_id: number;
    tipo_movimiento: TipoMovimiento;
    cantidad: number;
    precio_unitario: number | null;
    valor_total: number | null;
    especialista_id: number | null;
    usuario_id: number;
    referencia: string | null;
    notas: string | null;
    fecha_movimiento: string;
    fecha_creacion: string;
    // Relaciones
    producto?: Producto;
    ubicacion?: UbicacionInventario;
    especialista?: { id: number; nombre: string };
    usuario?: { id: number; nombre: string };
}

export interface MovimientoCreate {
    producto_id: number;
    tipo_movimiento: TipoMovimiento;
    cantidad: number;
    ubicacion_origen_id?: number;
    ubicacion_destino_id?: number;
    costo_unitario?: number;
    motivo?: string;
    referencia?: string;
    venta_id?: number;
}

// ============================================
// FILTROS Y PAGINACIÓN
// ============================================

export interface ProveedorFilters {
    search?: string;
    estado?: EstadoProveedor;
    skip?: number;
    limit?: number;
}

export interface ProductoFilters {
    search?: string;
    estado?: EstadoProducto;
    proveedor_id?: number;
    stock_bajo?: boolean;
    sin_stock?: boolean;
    skip?: number;
    limit?: number;
}

export interface MovimientoFilters {
    fecha_desde?: string;
    fecha_hasta?: string;
    tipo_movimiento?: TipoMovimiento;
    producto_id?: number;
    ubicacion_id?: number;
    especialista_id?: number;
    skip?: number;
    limit?: number;
}

export interface PaginatedResponse<T> {
    items: T[];
    total: number;
    page: number;
    page_size: number;
    pages: number;
}

// ============================================
// HELPERS
// ============================================

export const formatPrecio = (precio: number): string => {
    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(precio);
};

export const calcularMargen = (precioCompra: number, precioVenta: number): number => {
    if (precioCompra <= 0) return 0;
    return ((precioVenta - precioCompra) / precioCompra) * 100;
};

export const getStockStatus = (cantidad: number, stockMinimo: number): 'sin_stock' | 'bajo' | 'normal' => {
    if (cantidad <= 0) return 'sin_stock';
    if (cantidad <= stockMinimo) return 'bajo';
    return 'normal';
};

export const ESTADO_PRODUCTO_LABELS: Record<EstadoProducto, string> = {
    activo: 'Activo',
    inactivo: 'Inactivo',
    descontinuado: 'Descontinuado',
};

export const TIPO_MOVIMIENTO_LABELS: Record<TipoMovimiento, string> = {
    compra: 'Compra',
    venta: 'Venta',
    ajuste_positivo: 'Ajuste (+)',
    ajuste_negativo: 'Ajuste (-)',
    transferencia: 'Transferencia',
    uso_interno: 'Uso Interno',
    devolucion: 'Devolución',
    merma: 'Merma',
    muestra: 'Muestra',
    donacion: 'Donación',
};
