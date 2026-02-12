// Tipos para el módulo de Clientes

/**
 * Etiqueta para segmentación de clientes
 */
export interface ClienteEtiqueta {
    id: number;
    nombre: string;
    color: string; // HEX color
    fecha_creacion?: string;
    total_clientes?: number;
}

/**
 * Preferencias del cliente
 */
export interface ClientePreferencia {
    id: number;
    cliente_id: number;
    productos_favoritos: number[] | null;
    alergias: string | null;
    notas_servicio: string | null;
    fecha_actualizacion?: string;
}

/**
 * Cliente - Entidad principal
 */
export interface Cliente {
    id: number;
    nombre: string;
    apellido: string | null;
    cedula: string | null;
    nombre_completo?: string;
    telefono: string | null;
    email: string | null;
    fecha_nacimiento: string | null;
    direccion: string | null;
    notas: string | null;

    // Estadísticas
    fecha_primera_visita: string | null;
    ultima_visita: string | null;
    total_visitas: number;

    // Estado
    estado: 'activo' | 'inactivo';
    es_colaborador: boolean;

    // Timestamps
    fecha_creacion: string;
    fecha_actualizacion: string;

    // Relaciones
    etiquetas?: ClienteEtiqueta[];
    preferencias?: ClientePreferencia;
}

/**
 * Cliente simplificado para listas
 */
export interface ClienteListItem {
    id: number;
    nombre: string;
    apellido: string | null;
    cedula: string | null;
    telefono: string | null;
    email: string | null;
    total_visitas: number;
    ultima_visita: string | null;
    etiquetas: ClienteEtiqueta[];
    estado: 'activo' | 'inactivo';
    es_colaborador: boolean;
}

/**
 * DTO para crear cliente
 */
export interface ClienteCreateDTO {
    nombre: string;
    apellido?: string;
    cedula?: string;
    telefono?: string;
    email?: string;
    fecha_nacimiento?: string;
    direccion?: string;
    notas?: string;
    es_colaborador?: boolean;
}

/**
 * DTO para actualizar cliente
 */
export interface ClienteUpdateDTO {
    nombre?: string;
    apellido?: string;
    cedula?: string;
    telefono?: string;
    email?: string;
    fecha_nacimiento?: string;
    direccion?: string;
    notas?: string;
    estado?: 'activo' | 'inactivo';
    es_colaborador?: boolean;
}

/**
 * Respuesta paginada de clientes
 */
export interface ClientesPaginados {
    total: number;
    pagina: number;
    por_pagina: number;
    total_paginas: number;
    items: ClienteListItem[];
}

/**
 * Parámetros de filtros para listar clientes
 */
export interface ClienteFilters {
    query?: string;
    estado?: 'activo' | 'inactivo' | 'todos';
    etiqueta_id?: number;
    min_visitas?: number;
    max_visitas?: number;
    pagina?: number;
    por_pagina?: number;
    ordenar_por?: 'nombre' | 'fecha_creacion' | 'ultima_visita' | 'total_visitas';
    orden?: 'asc' | 'desc';
}

/**
 * Datos del formulario de cliente
 */
export interface ClienteFormData {
    nombre: string;
    apellido: string;
    cedula: string;
    telefono: string;
    email: string;
    fecha_nacimiento: string;
    direccion: string;
    notas: string;
    es_colaborador: boolean;
}

/**
 * DTO para actualizar preferencias
 */
export interface ClientePreferenciaUpdateDTO {
    productos_favoritos?: number[] | null;
    alergias?: string | null;
    notas_servicio?: string | null;
}

/**
 * DTO para crear etiqueta
 */
export interface ClienteEtiquetaCreateDTO {
    nombre: string;
    color: string;
}

/**
 * DTO para actualizar etiqueta
 */
export interface ClienteEtiquetaUpdateDTO {
    nombre?: string;
    color?: string;
}
