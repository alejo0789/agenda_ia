import { create } from 'zustand';
import { categoriasApi, serviciosApi } from '@/lib/api/servicios';
import {
    Categoria,
    CategoriaFormData,
    Servicio,
    ServicioFormData,
    ServicioFilters,
} from '@/types/servicio';

interface ServicioState {
    // Estado
    servicios: Servicio[];
    categorias: Categoria[];
    selectedServicio: Servicio | null;
    selectedCategoria: Categoria | null;
    isLoading: boolean;
    error: string | null;
    filters: ServicioFilters;

    // ============================================
    // ACCIONES DE CATEGORÍAS
    // ============================================
    fetchCategorias: () => Promise<void>;
    createCategoria: (data: CategoriaFormData) => Promise<Categoria>;
    updateCategoria: (id: number, data: Partial<CategoriaFormData>) => Promise<Categoria>;
    deleteCategoria: (id: number) => Promise<void>;
    setSelectedCategoria: (categoria: Categoria | null) => void;

    // ============================================
    // ACCIONES DE SERVICIOS
    // ============================================
    fetchServicios: (params?: ServicioFilters) => Promise<void>;
    fetchServicio: (id: number) => Promise<void>;
    createServicio: (data: ServicioFormData) => Promise<Servicio>;
    updateServicio: (id: number, data: Partial<ServicioFormData>) => Promise<Servicio>;
    deleteServicio: (id: number) => Promise<void>;
    activateServicio: (id: number) => Promise<void>;
    setFilters: (filters: Partial<ServicioFilters>) => void;
    resetFilters: () => void;
    setSelectedServicio: (servicio: Servicio | null) => void;
    clearSelectedServicio: () => void;

    // Control de estado
    clearError: () => void;
}

const defaultFilters: ServicioFilters = {
    skip: 0,
    limit: 100,
};

export const useServicioStore = create<ServicioState>((set, get) => ({
    // Estado inicial
    servicios: [],
    categorias: [],
    selectedServicio: null,
    selectedCategoria: null,
    isLoading: false,
    error: null,
    filters: defaultFilters,

    // ============================================
    // CATEGORÍAS
    // ============================================

    fetchCategorias: async () => {
        set({ isLoading: true, error: null });
        try {
            const categorias = await categoriasApi.getAll();
            set({ categorias, isLoading: false });
        } catch (error: any) {
            set({
                error: error.response?.data?.detail || 'Error al cargar categorías',
                isLoading: false,
            });
        }
    },

    createCategoria: async (data) => {
        set({ isLoading: true, error: null });
        try {
            const newCategoria = await categoriasApi.create(data);
            set((state) => ({
                categorias: [...state.categorias, newCategoria],
                isLoading: false,
            }));
            return newCategoria;
        } catch (error: any) {
            set({
                error: error.response?.data?.detail || 'Error al crear categoría',
                isLoading: false,
            });
            throw error;
        }
    },

    updateCategoria: async (id, data) => {
        set({ isLoading: true, error: null });
        try {
            const updated = await categoriasApi.update(id, data);
            set((state) => ({
                categorias: state.categorias.map((cat) =>
                    cat.id === id ? updated : cat
                ),
                selectedCategoria: state.selectedCategoria?.id === id
                    ? updated
                    : state.selectedCategoria,
                isLoading: false,
            }));
            return updated;
        } catch (error: any) {
            set({
                error: error.response?.data?.detail || 'Error al actualizar categoría',
                isLoading: false,
            });
            throw error;
        }
    },

    deleteCategoria: async (id) => {
        set({ isLoading: true, error: null });
        try {
            await categoriasApi.delete(id);
            set((state) => ({
                categorias: state.categorias.filter((cat) => cat.id !== id),
                isLoading: false,
            }));
        } catch (error: any) {
            set({
                error: error.response?.data?.detail || 'Error al eliminar categoría',
                isLoading: false,
            });
            throw error;
        }
    },

    setSelectedCategoria: (categoria) => {
        set({ selectedCategoria: categoria });
    },

    // ============================================
    // SERVICIOS
    // ============================================

    fetchServicios: async (params) => {
        set({ isLoading: true, error: null });
        try {
            const finalParams = { ...get().filters, ...params };
            const servicios = await serviciosApi.getAll(finalParams);
            set({ servicios, isLoading: false });
        } catch (error: any) {
            set({
                error: error.response?.data?.detail || 'Error al cargar servicios',
                isLoading: false,
            });
        }
    },

    fetchServicio: async (id) => {
        set({ isLoading: true, error: null });
        try {
            const servicio = await serviciosApi.getById(id);
            set({ selectedServicio: servicio, isLoading: false });
        } catch (error: any) {
            set({
                error: error.response?.data?.detail || 'Error al cargar servicio',
                isLoading: false,
            });
        }
    },

    createServicio: async (data) => {
        set({ isLoading: true, error: null });
        try {
            const newServicio = await serviciosApi.create(data);
            set((state) => ({
                servicios: [...state.servicios, newServicio],
                isLoading: false,
            }));
            return newServicio;
        } catch (error: any) {
            set({
                error: error.response?.data?.detail || 'Error al crear servicio',
                isLoading: false,
            });
            throw error;
        }
    },

    updateServicio: async (id, data) => {
        set({ isLoading: true, error: null });
        try {
            const updated = await serviciosApi.update(id, data);
            set((state) => ({
                servicios: state.servicios.map((srv) =>
                    srv.id === id ? updated : srv
                ),
                selectedServicio: state.selectedServicio?.id === id
                    ? updated
                    : state.selectedServicio,
                isLoading: false,
            }));
            return updated;
        } catch (error: any) {
            set({
                error: error.response?.data?.detail || 'Error al actualizar servicio',
                isLoading: false,
            });
            throw error;
        }
    },

    deleteServicio: async (id) => {
        set({ isLoading: true, error: null });
        try {
            await serviciosApi.delete(id);
            set((state) => ({
                servicios: state.servicios.map((srv) =>
                    srv.id === id ? { ...srv, estado: 'inactivo' as const } : srv
                ),
                isLoading: false,
            }));
        } catch (error: any) {
            set({
                error: error.response?.data?.detail || 'Error al desactivar servicio',
                isLoading: false,
            });
            throw error;
        }
    },

    activateServicio: async (id) => {
        set({ isLoading: true, error: null });
        try {
            const activated = await serviciosApi.activate(id);
            set((state) => ({
                servicios: state.servicios.map((srv) =>
                    srv.id === id ? activated : srv
                ),
                selectedServicio: state.selectedServicio?.id === id
                    ? activated
                    : state.selectedServicio,
                isLoading: false,
            }));
        } catch (error: any) {
            set({
                error: error.response?.data?.detail || 'Error al activar servicio',
                isLoading: false,
            });
            throw error;
        }
    },

    setFilters: (filters) => {
        set({ filters: { ...get().filters, ...filters } });
    },

    resetFilters: () => {
        set({ filters: defaultFilters });
    },

    setSelectedServicio: (servicio) => {
        set({ selectedServicio: servicio });
    },

    clearSelectedServicio: () => {
        set({ selectedServicio: null });
    },

    // ============================================
    // CONTROL DE ESTADO
    // ============================================

    clearError: () => set({ error: null }),
}));
