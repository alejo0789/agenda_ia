// Tipos para el módulo de Servicios
// Alineados con el backend FastAPI

// ============================================
// CATEGORÍAS DE SERVICIOS
// ============================================

export interface Categoria {
    id: number;
    nombre: string;
    descripcion?: string;
    orden_visualizacion: number;
    fecha_creacion: string;
}

export interface CategoriaFormData {
    nombre: string;
    descripcion?: string;
    orden_visualizacion?: number;
}

// ============================================
// SERVICIOS
// ============================================

export interface Servicio {
    id: number;
    nombre: string;
    descripcion?: string;
    categoria_id?: number | null;
    categoria?: Categoria | null;
    duracion_minutos: number;
    precio_base: number;
    requiere_producto?: boolean;
    estado: 'activo' | 'inactivo';
    color_calendario?: string;
    tipo_comision: 'porcentaje' | 'fijo';
    valor_comision: number;
    fecha_creacion: string;
    fecha_actualizacion: string;
}

export interface ServicioFormData {
    nombre: string;
    descripcion?: string;
    categoria_id?: number | null;
    duracion_minutos: number;
    precio_base: number;
    requiere_producto?: boolean;
    estado?: 'activo' | 'inactivo';
    color_calendario?: string;
    tipo_comision?: 'porcentaje' | 'fijo';
    valor_comision?: number;
}

// ============================================
// COMISIONES DE ESPECIALISTAS
// ============================================

export interface ServicioEspecialista {
    especialista_id: number;
    especialista_nombre: string;
    especialista_apellido: string;
    tipo_comision: 'porcentaje' | 'fijo';
    valor_comision: number;
}

export interface AsignarComisionFormData {
    especialista_id: number;
    tipo_comision: 'porcentaje' | 'fijo';
    valor_comision: number;
}

// ============================================
// FILTROS Y PAGINACIÓN
// ============================================

export interface ServicioFilters {
    skip?: number;
    limit?: number;
    categoria_id?: number;
    estado?: 'activo' | 'inactivo';
}

export interface PaginatedResponse<T> {
    items: T[];
    total: number;
    page: number;
    per_page: number;
    total_pages: number;
}

// ============================================
// CONSTANTES
// ============================================

export const DURACION_OPTIONS = [
    { value: 15, label: '15 min' },
    { value: 30, label: '30 min' },
    { value: 45, label: '45 min' },
    { value: 60, label: '1 hora' },
    { value: 75, label: '1h 15min' },
    { value: 90, label: '1h 30min' },
    { value: 105, label: '1h 45min' },
    { value: 120, label: '2 horas' },
    { value: 150, label: '2h 30min' },
    { value: 180, label: '3 horas' },
    { value: 210, label: '3h 30min' },
    { value: 240, label: '4 horas' },
];

export const DEFAULT_COLORS = [
    '#8B5CF6', // Purple
    '#EC4899', // Pink
    '#3B82F6', // Blue
    '#10B981', // Emerald
    '#F59E0B', // Amber
    '#EF4444', // Red
    '#06B6D4', // Cyan
    '#84CC16', // Lime
    '#F97316', // Orange
    '#6366F1', // Indigo
];

// ============================================
// HELPERS
// ============================================

export const formatDuracion = (minutos: number): string => {
    if (minutos < 60) return `${minutos} min`;
    const horas = Math.floor(minutos / 60);
    const mins = minutos % 60;
    if (mins === 0) return `${horas}h`;
    return `${horas}h ${mins}min`;
};

export const formatPrecio = (precio: number): string => {
    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(precio);
};

export const calcularComisionPesos = (
    tipoComision: 'porcentaje' | 'fijo',
    valorComision: number,
    precioServicio: number
): number => {
    if (tipoComision === 'porcentaje') {
        return Math.round((precioServicio * valorComision) / 100);
    }
    return Math.round(valorComision);
};
