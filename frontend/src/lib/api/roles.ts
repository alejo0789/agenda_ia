import api from './client';

export interface Permiso {
    id: number;
    codigo: string;
    descripcion: string;
    modulo: string;
}

export interface Rol {
    id: number;
    nombre: string;
    descripcion: string;
    es_sistema: boolean;
    permisos: Permiso[];
}

export interface RolCreate {
    nombre: string;
    descripcion: string;
}

export interface RolUpdate {
    nombre: string;
    descripcion: string;
}

export const rolesApi = {
    // Listar todos los roles
    listar: async () => {
        const response = await api.get<Rol[]>('/roles');
        return response.data;
    },

    // Obtener un rol por ID
    obtener: async (id: number) => {
        const response = await api.get<Rol>(`/roles/${id}`);
        return response.data;
    },

    // Crear un nuevo rol
    crear: async (data: RolCreate) => {
        const response = await api.post<Rol>('/roles', data);
        return response.data;
    },

    // Actualizar un rol existente
    actualizar: async (id: number, data: RolUpdate) => {
        const response = await api.put<Rol>(`/roles/${id}`, data);
        return response.data;
    },

    // Eliminar un rol
    eliminar: async (id: number) => {
        await api.delete(`/roles/${id}`);
    },

    // Listar todos los permisos disponibles
    listarPermisos: async () => {
        const response = await api.get<Permiso[]>('/permisos');
        return response.data;
    },

    // Asignar permisos a un rol
    asignarPermisos: async (rolId: number, permisoIds: number[]) => {
        await api.put(`/roles/${rolId}/permisos`, permisoIds);
    }
};
