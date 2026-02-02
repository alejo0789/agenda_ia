import { Sede } from './sede';

export interface Permiso {
    id: number;
    codigo: string;
    nombre: string;
    modulo: string;
    descripcion?: string;
}

export interface Rol {
    id: number;
    nombre: string;
    descripcion?: string;
    es_sistema: boolean;
    permisos?: Permiso[];
}

export interface Usuario {
    id: number;
    username: string;
    email: string;
    nombre: string;
    rol_id: number;
    rol: Rol;
    sede_id?: number | null;
    sede?: Sede | null;
    especialista_id?: number | null;
    estado: 'activo' | 'inactivo' | 'bloqueado';
    primer_acceso: boolean;
    requiere_cambio_password: boolean;
    ultimo_acceso?: string;
    fecha_creacion: string;
}

export interface UsuarioFormData {
    nombre: string;
    username: string;
    email: string;
    password?: string;
    rol_id: number;
    sede_id?: number;
    especialista_id?: number;
    estado?: 'activo' | 'inactivo';
    primer_acceso?: boolean;
    requiere_cambio_password?: boolean;
}
