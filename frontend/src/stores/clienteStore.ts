import { create } from 'zustand';
import { clientesApi, etiquetasApi } from '@/lib/api/clientes';
import {
    Cliente,
    ClienteListItem,
    ClienteCreateDTO,
    ClienteUpdateDTO,
    ClientesPaginados,
    ClienteFilters,
    ClientePreferencia,
    ClientePreferenciaUpdateDTO,
    ClienteEtiqueta,
    ClienteEtiquetaCreateDTO,
    ClienteEtiquetaUpdateDTO,
} from '@/types/cliente';

// Helper para extraer mensaje de error legible
function getErrorMessage(error: any, defaultMsg: string): string {
    const detail = error.response?.data?.detail;

    // Si detail es un string, lo retornamos directamente
    if (typeof detail === 'string') {
        return detail;
    }

    // Si detail es un array (errores de validación de Pydantic)
    if (Array.isArray(detail)) {
        return detail.map((err: any) => {
            if (typeof err === 'string') return err;
            // Formato típico de error de validación: {type, loc, msg, input}
            if (err.msg) return err.msg;
            return JSON.stringify(err);
        }).join('. ');
    }

    // Si detail es un objeto con msg
    if (detail?.msg) {
        return detail.msg;
    }

    // Fallback al mensaje por defecto
    return defaultMsg;
}

interface ClienteState {
    // Estado
    clientes: ClienteListItem[];
    selectedCliente: Cliente | null;
    isLoading: boolean;
    error: string | null;

    // Paginación
    total: number;
    pagina: number;
    porPagina: number;
    totalPaginas: number;

    // Filtros
    filters: ClienteFilters;

    // Etiquetas
    etiquetas: ClienteEtiqueta[];
    isLoadingEtiquetas: boolean;

    // Preferencias del cliente seleccionado
    preferencias: ClientePreferencia | null;

    // Acciones de Lista
    fetchClientes: (params?: ClienteFilters) => Promise<void>;
    setFilters: (filters: Partial<ClienteFilters>) => void;
    resetFilters: () => void;

    // Acciones de Cliente Individual
    fetchCliente: (id: number) => Promise<void>;
    createCliente: (data: ClienteCreateDTO) => Promise<Cliente>;
    updateCliente: (id: number, data: ClienteUpdateDTO) => Promise<Cliente>;
    deleteCliente: (id: number) => Promise<void>;
    reactivarCliente: (id: number) => Promise<void>;
    clearSelectedCliente: () => void;

    // Acciones de Preferencias
    fetchPreferencias: (clienteId: number) => Promise<void>;
    updatePreferencias: (clienteId: number, data: ClientePreferenciaUpdateDTO) => Promise<void>;

    // Acciones de Etiquetas
    fetchEtiquetas: () => Promise<void>;
    createEtiqueta: (data: ClienteEtiquetaCreateDTO) => Promise<ClienteEtiqueta>;
    updateEtiqueta: (id: number, data: ClienteEtiquetaUpdateDTO) => Promise<ClienteEtiqueta>;
    deleteEtiqueta: (id: number) => Promise<void>;

    // Acciones de Etiquetas del Cliente
    asignarEtiquetas: (clienteId: number, etiquetaIds: number[]) => Promise<void>;
    removerEtiqueta: (clienteId: number, etiquetaId: number) => Promise<void>;

    // Control de estado
    clearError: () => void;
}

const defaultFilters: ClienteFilters = {
    estado: 'activo',
    pagina: 1,
    por_pagina: 20,
    ordenar_por: 'nombre',
    orden: 'asc',
};

export const useClienteStore = create<ClienteState>((set, get) => ({
    // Estado inicial
    clientes: [],
    selectedCliente: null,
    isLoading: false,
    error: null,
    total: 0,
    pagina: 1,
    porPagina: 20,
    totalPaginas: 1,
    filters: defaultFilters,
    etiquetas: [],
    isLoadingEtiquetas: false,
    preferencias: null,

    // ============================================
    // LISTA DE CLIENTES
    // ============================================

    fetchClientes: async (params) => {
        set({ isLoading: true, error: null });
        try {
            const filterParams = { ...get().filters, ...params };
            const response: ClientesPaginados = await clientesApi.getAll(filterParams);
            set({
                clientes: response.items,
                total: response.total,
                pagina: response.pagina,
                porPagina: response.por_pagina,
                totalPaginas: response.total_paginas,
                isLoading: false,
            });
        } catch (error: any) {
            set({
                error: getErrorMessage(error, 'Error al cargar clientes'),
                isLoading: false,
            });
        }
    },

    setFilters: (filters) => {
        set((state) => ({
            filters: { ...state.filters, ...filters, pagina: 1 }, // Reset página al cambiar filtros
        }));
    },

    resetFilters: () => {
        set({ filters: defaultFilters });
    },

    // ============================================
    // CLIENTE INDIVIDUAL
    // ============================================

    fetchCliente: async (id) => {
        set({ isLoading: true, error: null });
        try {
            const cliente = await clientesApi.getById(id);
            set({ selectedCliente: cliente, isLoading: false });
        } catch (error: any) {
            set({
                error: getErrorMessage(error, 'Error al cargar cliente'),
                isLoading: false,
            });
        }
    },

    createCliente: async (data) => {
        set({ isLoading: true, error: null });
        try {
            const newCliente = await clientesApi.create(data);
            // Recargar lista
            await get().fetchClientes();
            set({ isLoading: false });
            return newCliente;
        } catch (error: any) {
            set({
                error: getErrorMessage(error, 'Error al crear cliente'),
                isLoading: false,
            });
            throw error;
        }
    },

    updateCliente: async (id, data) => {
        set({ isLoading: true, error: null });
        try {
            const updated = await clientesApi.update(id, data);

            // Actualizar lista local
            set((state) => ({
                clientes: state.clientes.map((c) =>
                    c.id === id ? { ...c, ...data } : c
                ),
                selectedCliente: state.selectedCliente?.id === id
                    ? updated
                    : state.selectedCliente,
                isLoading: false,
            }));
            return updated;
        } catch (error: any) {
            set({
                error: getErrorMessage(error, 'Error al actualizar cliente'),
                isLoading: false,
            });
            throw error;
        }
    },

    deleteCliente: async (id) => {
        set({ isLoading: true, error: null });
        try {
            await clientesApi.delete(id);
            // Recargar lista para reflejar cambio de estado
            await get().fetchClientes();
            set({ isLoading: false });
        } catch (error: any) {
            set({
                error: getErrorMessage(error, 'Error al desactivar cliente'),
                isLoading: false,
            });
            throw error;
        }
    },

    reactivarCliente: async (id) => {
        set({ isLoading: true, error: null });
        try {
            const reactivated = await clientesApi.reactivar(id);
            set((state) => ({
                clientes: state.clientes.map((c) =>
                    c.id === id ? { ...c, estado: 'activo' } : c
                ),
                selectedCliente: state.selectedCliente?.id === id
                    ? reactivated
                    : state.selectedCliente,
                isLoading: false,
            }));
        } catch (error: any) {
            set({
                error: getErrorMessage(error, 'Error al reactivar cliente'),
                isLoading: false,
            });
            throw error;
        }
    },

    clearSelectedCliente: () => {
        set({ selectedCliente: null, preferencias: null });
    },

    // ============================================
    // PREFERENCIAS
    // ============================================

    fetchPreferencias: async (clienteId) => {
        try {
            const preferencias = await clientesApi.getPreferencias(clienteId);
            set({ preferencias });
        } catch (error: any) {
            set({ error: getErrorMessage(error, 'Error al cargar preferencias') });
        }
    },

    updatePreferencias: async (clienteId, data) => {
        set({ isLoading: true, error: null });
        try {
            const updated = await clientesApi.updatePreferencias(clienteId, data);
            set({ preferencias: updated, isLoading: false });
        } catch (error: any) {
            set({
                error: getErrorMessage(error, 'Error al actualizar preferencias'),
                isLoading: false,
            });
            throw error;
        }
    },

    // ============================================
    // ETIQUETAS
    // ============================================

    fetchEtiquetas: async () => {
        set({ isLoadingEtiquetas: true });
        try {
            const etiquetas = await etiquetasApi.getAll();
            set({ etiquetas, isLoadingEtiquetas: false });
        } catch (error: any) {
            set({
                error: getErrorMessage(error, 'Error al cargar etiquetas'),
                isLoadingEtiquetas: false,
            });
        }
    },

    createEtiqueta: async (data) => {
        set({ isLoading: true, error: null });
        try {
            const newEtiqueta = await etiquetasApi.create(data);
            set((state) => ({
                etiquetas: [...state.etiquetas, newEtiqueta],
                isLoading: false,
            }));
            return newEtiqueta;
        } catch (error: any) {
            set({
                error: getErrorMessage(error, 'Error al crear etiqueta'),
                isLoading: false,
            });
            throw error;
        }
    },

    updateEtiqueta: async (id, data) => {
        set({ isLoading: true, error: null });
        try {
            const updated = await etiquetasApi.update(id, data);
            set((state) => ({
                etiquetas: state.etiquetas.map((e) => (e.id === id ? updated : e)),
                isLoading: false,
            }));
            return updated;
        } catch (error: any) {
            set({
                error: getErrorMessage(error, 'Error al actualizar etiqueta'),
                isLoading: false,
            });
            throw error;
        }
    },

    deleteEtiqueta: async (id) => {
        set({ isLoading: true, error: null });
        try {
            await etiquetasApi.delete(id);
            set((state) => ({
                etiquetas: state.etiquetas.filter((e) => e.id !== id),
                isLoading: false,
            }));
        } catch (error: any) {
            set({
                error: getErrorMessage(error, 'Error al eliminar etiqueta'),
                isLoading: false,
            });
            throw error;
        }
    },

    // ============================================
    // ETIQUETAS DEL CLIENTE
    // ============================================

    asignarEtiquetas: async (clienteId, etiquetaIds) => {
        set({ isLoading: true, error: null });
        try {
            const updated = await clientesApi.asignarEtiquetas(clienteId, etiquetaIds);
            set((state) => ({
                selectedCliente: state.selectedCliente?.id === clienteId
                    ? updated
                    : state.selectedCliente,
                isLoading: false,
            }));
            // Recargar lista para actualizar etiquetas
            await get().fetchClientes();
        } catch (error: any) {
            set({
                error: getErrorMessage(error, 'Error al asignar etiquetas'),
                isLoading: false,
            });
            throw error;
        }
    },

    removerEtiqueta: async (clienteId, etiquetaId) => {
        set({ isLoading: true, error: null });
        try {
            await clientesApi.removerEtiqueta(clienteId, etiquetaId);

            // Actualizar cliente seleccionado
            set((state) => {
                if (state.selectedCliente?.id === clienteId) {
                    return {
                        selectedCliente: {
                            ...state.selectedCliente,
                            etiquetas: state.selectedCliente.etiquetas?.filter(
                                (e) => e.id !== etiquetaId
                            ),
                        },
                        isLoading: false,
                    };
                }
                return { isLoading: false };
            });

            // Recargar lista para actualizar etiquetas
            await get().fetchClientes();
        } catch (error: any) {
            set({
                error: getErrorMessage(error, 'Error al remover etiqueta'),
                isLoading: false,
            });
            throw error;
        }
    },

    // ============================================
    // CONTROL DE ESTADO
    // ============================================

    clearError: () => set({ error: null }),
}));
