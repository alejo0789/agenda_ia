// Tipos para el módulo de Especialistas

export interface Especialista {
    id: number;
    nombre: string;
    apellido: string;
    nombre_completo?: string;
    documento_identidad?: string;
    telefono?: string;
    email?: string;
    foto?: string;
    documentacion?: string;
    estado: 'activo' | 'inactivo';
    fecha_ingreso?: string;
    fecha_creacion: string;
    fecha_actualizacion: string;
}

export interface EspecialistaFormData {
    nombre: string;
    apellido: string;
    documento_identidad?: string;
    telefono?: string;
    email?: string;
    password?: string;
    foto?: string;
    fecha_ingreso?: string;
    estado?: 'activo' | 'inactivo';
}

export interface Horario {
    id: number;
    especialista_id: number;
    dia_semana: number; // 0=Domingo, 6=Sábado
    hora_inicio: string; // HH:MM
    hora_fin: string; // HH:MM
    activo: boolean;
    fecha_creacion: string;
}

export interface HorarioFormData {
    dia_semana: number;
    hora_inicio: string;
    hora_fin: string;
    activo?: boolean;
}

export interface Bloqueo {
    id: number;
    especialista_id: number;
    fecha_inicio: string;
    fecha_fin: string;
    hora_inicio?: string;
    hora_fin?: string;
    motivo?: string;
    es_recurrente: boolean;
    dias_semana?: number[];
    fecha_creacion: string;
}

export interface BloqueoFormData {
    fecha_inicio: string;
    fecha_fin: string;
    hora_inicio?: string;
    hora_fin?: string;
    motivo?: string;
    es_recurrente?: boolean;
    dias_semana?: number[];
}

export interface EspecialistaServicio {
    especialista_id: number;
    servicio_id: number;
    tipo_comision: 'porcentaje' | 'fijo';
    valor_comision: number;
    fecha_creacion: string;
    // Campos adicionales para mostrar
    servicio_nombre?: string;
    precio_base?: number;
}

export interface EspecialistaServicioFormData {
    servicio_id: number;
    tipo_comision: 'porcentaje' | 'fijo';
    valor_comision: number;
}

export interface EspecialistaFilters {
    estado?: 'activo' | 'inactivo';
    search?: string;
}

export interface PaginationParams {
    skip?: number;
    limit?: number;
}
