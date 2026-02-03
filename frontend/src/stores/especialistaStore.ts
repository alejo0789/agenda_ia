import { create } from 'zustand';
import { especialistasApi } from '@/lib/api/especialistas';
import {
    Especialista,
    EspecialistaFormData,
    Horario,
    HorarioFormData,
    Bloqueo,
    BloqueoFormData,
    EspecialistaServicio,
    EspecialistaServicioFormData,
    EspecialistaFilters,
} from '@/types/especialista';

interface EspecialistaState {
    // Estado
    especialistas: Especialista[];
    selectedEspecialista: Especialista | null;
    isLoading: boolean;
    isEspecialistasLoading: boolean;
    error: string | null;
    filters: EspecialistaFilters;

    // Horarios, Bloqueos, Servicios del especialista seleccionado
    horarios: Horario[];
    bloqueos: Bloqueo[];
    servicios: EspecialistaServicio[];

    // Acciones de Lista
    fetchEspecialistas: (params?: { estado?: string }) => Promise<void>;
    setFilters: (filters: Partial<EspecialistaFilters>) => void;

    // Acciones de Especialista Individual
    fetchEspecialista: (id: number) => Promise<void>;
    createEspecialista: (data: EspecialistaFormData) => Promise<Especialista>;
    updateEspecialista: (id: number, data: Partial<EspecialistaFormData>) => Promise<Especialista>;
    deleteEspecialista: (id: number) => Promise<void>;
    activateEspecialista: (id: number) => Promise<void>;
    clearSelectedEspecialista: () => void;

    // Acciones de Horarios
    fetchHorarios: (especialistaId: number) => Promise<void>;
    saveHorarios: (especialistaId: number, horarios: HorarioFormData[]) => Promise<void>;

    // Acciones de Bloqueos
    fetchBloqueos: (especialistaId: number) => Promise<void>;
    createBloqueo: (especialistaId: number, data: BloqueoFormData) => Promise<Bloqueo>;
    updateBloqueo: (especialistaId: number, bloqueoId: number, data: Partial<BloqueoFormData>) => Promise<Bloqueo>;
    deleteBloqueo: (especialistaId: number, bloqueoId: number) => Promise<void>;

    // Acciones de Servicios
    fetchServicios: (especialistaId: number) => Promise<void>;
    assignServicio: (especialistaId: number, data: EspecialistaServicioFormData) => Promise<void>;
    updateServicio: (especialistaId: number, servicioId: number, data: Partial<EspecialistaServicioFormData>) => Promise<void>;
    removeServicio: (especialistaId: number, servicioId: number) => Promise<void>;

    // Control de estado
    clearError: () => void;
}

export const useEspecialistaStore = create<EspecialistaState>((set, get) => ({
    // Estado inicial
    especialistas: [],
    selectedEspecialista: null,
    isLoading: false,
    isEspecialistasLoading: false,
    error: null,
    filters: {},
    horarios: [],
    bloqueos: [],
    servicios: [],

    // ============================================
    // LISTA DE ESPECIALISTAS
    // ============================================

    fetchEspecialistas: async (params) => {
        set({ isEspecialistasLoading: true, isLoading: true, error: null });
        try {
            const especialistas = await especialistasApi.getAll(params);
            set({ especialistas, isEspecialistasLoading: false, isLoading: false });
        } catch (error: any) {
            set({
                error: error.response?.data?.detail || 'Error al cargar especialistas',
                isEspecialistasLoading: false,
                isLoading: false,
            });
        }
    },

    setFilters: (filters) => {
        set({ filters: { ...get().filters, ...filters } });
    },

    // ============================================
    // ESPECIALISTA INDIVIDUAL
    // ============================================

    fetchEspecialista: async (id) => {
        set({ isLoading: true, error: null });
        try {
            const especialista = await especialistasApi.getById(id);
            set({ selectedEspecialista: especialista, isLoading: false });
        } catch (error: any) {
            set({
                error: error.response?.data?.detail || 'Error al cargar especialista',
                isLoading: false,
            });
        }
    },

    createEspecialista: async (data) => {
        set({ isLoading: true, error: null });
        try {
            const newEspecialista = await especialistasApi.create(data);
            set((state) => ({
                especialistas: [...state.especialistas, newEspecialista],
                isLoading: false,
            }));
            return newEspecialista;
        } catch (error: any) {
            set({
                error: error.response?.data?.detail || 'Error al crear especialista',
                isLoading: false,
            });
            throw error;
        }
    },

    updateEspecialista: async (id, data) => {
        set({ isLoading: true, error: null });
        try {
            const updated = await especialistasApi.update(id, data);
            set((state) => ({
                especialistas: state.especialistas.map((esp) =>
                    esp.id === id ? updated : esp
                ),
                selectedEspecialista: state.selectedEspecialista?.id === id
                    ? updated
                    : state.selectedEspecialista,
                isLoading: false,
            }));
            return updated;
        } catch (error: any) {
            set({
                error: error.response?.data?.detail || 'Error al actualizar especialista',
                isLoading: false,
            });
            throw error;
        }
    },

    deleteEspecialista: async (id) => {
        set({ isLoading: true, error: null });
        try {
            await especialistasApi.delete(id);
            set((state) => ({
                especialistas: state.especialistas.filter((esp) => esp.id !== id),
                isLoading: false,
            }));
        } catch (error: any) {
            set({
                error: error.response?.data?.detail || 'Error al desactivar especialista',
                isLoading: false,
            });
            throw error;
        }
    },

    activateEspecialista: async (id) => {
        set({ isLoading: true, error: null });
        try {
            const activated = await especialistasApi.activate(id);
            set((state) => ({
                especialistas: state.especialistas.map((esp) =>
                    esp.id === id ? activated : esp
                ),
                selectedEspecialista: state.selectedEspecialista?.id === id
                    ? activated
                    : state.selectedEspecialista,
                isLoading: false,
            }));
        } catch (error: any) {
            set({
                error: error.response?.data?.detail || 'Error al activar especialista',
                isLoading: false,
            });
            throw error;
        }
    },

    clearSelectedEspecialista: () => {
        set({ selectedEspecialista: null, horarios: [], bloqueos: [], servicios: [] });
    },

    // ============================================
    // HORARIOS
    // ============================================

    fetchHorarios: async (especialistaId) => {
        try {
            const horarios = await especialistasApi.getHorarios(especialistaId);
            set({ horarios });
        } catch (error: any) {
            set({ error: error.response?.data?.detail || 'Error al cargar horarios' });
        }
    },

    saveHorarios: async (especialistaId, horarios) => {
        set({ isLoading: true, error: null });
        try {
            const savedHorarios = await especialistasApi.saveHorarios(especialistaId, horarios);
            set({ horarios: savedHorarios, isLoading: false });
        } catch (error: any) {
            set({
                error: error.response?.data?.detail || 'Error al guardar horarios',
                isLoading: false,
            });
            throw error;
        }
    },

    // ============================================
    // BLOQUEOS
    // ============================================

    fetchBloqueos: async (especialistaId) => {
        try {
            const bloqueos = await especialistasApi.getBloqueos(especialistaId);
            set({ bloqueos });
        } catch (error: any) {
            set({ error: error.response?.data?.detail || 'Error al cargar bloqueos' });
        }
    },

    createBloqueo: async (especialistaId, data) => {
        set({ isLoading: true, error: null });
        try {
            const newBloqueo = await especialistasApi.createBloqueo(especialistaId, data);
            set((state) => ({
                bloqueos: [...state.bloqueos, newBloqueo],
                isLoading: false,
            }));
            return newBloqueo;
        } catch (error: any) {
            set({
                error: error.response?.data?.detail || 'Error al crear bloqueo',
                isLoading: false,
            });
            throw error;
        }
    },

    updateBloqueo: async (especialistaId, bloqueoId, data) => {
        set({ isLoading: true, error: null });
        try {
            const updated = await especialistasApi.updateBloqueo(especialistaId, bloqueoId, data);
            set((state) => ({
                bloqueos: state.bloqueos.map((b) => (b.id === bloqueoId ? updated : b)),
                isLoading: false,
            }));
            return updated;
        } catch (error: any) {
            set({
                error: error.response?.data?.detail || 'Error al actualizar bloqueo',
                isLoading: false,
            });
            throw error;
        }
    },

    deleteBloqueo: async (especialistaId, bloqueoId) => {
        set({ isLoading: true, error: null });
        try {
            await especialistasApi.deleteBloqueo(especialistaId, bloqueoId);
            set((state) => ({
                bloqueos: state.bloqueos.filter((b) => b.id !== bloqueoId),
                isLoading: false,
            }));
        } catch (error: any) {
            set({
                error: error.response?.data?.detail || 'Error al eliminar bloqueo',
                isLoading: false,
            });
            throw error;
        }
    },

    // ============================================
    // SERVICIOS
    // ============================================

    fetchServicios: async (especialistaId) => {
        try {
            const servicios = await especialistasApi.getServicios(especialistaId);
            set({ servicios });
        } catch (error: any) {
            set({ error: error.response?.data?.detail || 'Error al cargar servicios' });
        }
    },

    assignServicio: async (especialistaId, data) => {
        set({ isLoading: true, error: null });
        try {
            const newServicio = await especialistasApi.assignServicio(especialistaId, data);
            set((state) => ({
                servicios: [...state.servicios, newServicio],
                isLoading: false,
            }));
        } catch (error: any) {
            set({
                error: error.response?.data?.detail || 'Error al asignar servicio',
                isLoading: false,
            });
            throw error;
        }
    },

    updateServicio: async (especialistaId, servicioId, data) => {
        set({ isLoading: true, error: null });
        try {
            const updated = await especialistasApi.updateServicio(especialistaId, servicioId, data);
            set((state) => ({
                servicios: state.servicios.map((s) =>
                    s.servicio_id === servicioId ? updated : s
                ),
                isLoading: false,
            }));
        } catch (error: any) {
            set({
                error: error.response?.data?.detail || 'Error al actualizar servicio',
                isLoading: false,
            });
            throw error;
        }
    },

    removeServicio: async (especialistaId, servicioId) => {
        set({ isLoading: true, error: null });
        try {
            await especialistasApi.removeServicio(especialistaId, servicioId);
            set((state) => ({
                servicios: state.servicios.filter((s) => s.servicio_id !== servicioId),
                isLoading: false,
            }));
        } catch (error: any) {
            set({
                error: error.response?.data?.detail || 'Error al quitar servicio',
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
