export interface Sede {
    id: number;
    codigo: string;
    nombre: string;
    direccion?: string;
    telefono?: string;
    email?: string;
    estado: 'activa' | 'inactiva';
    es_principal: boolean;
    fecha_creacion: string;
    fecha_actualizacion: string;
}

export interface SedeFormData {
    codigo: string;
    nombre: string;
    direccion?: string;
    telefono?: string;
    email?: string;
    estado?: 'activa' | 'inactiva';
    es_principal?: boolean;
}
