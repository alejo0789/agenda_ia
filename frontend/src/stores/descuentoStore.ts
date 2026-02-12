import { create } from 'zustand';
import { descuentosApi, Descuento, DescuentoCreate, DescuentoUpdate } from '@/lib/api/descuentos';

interface DescuentoStore {
    descuentos: Descuento[];
    descuentosActivos: Descuento[];
    isLoading: boolean;
    error: string | null;

    fetchDescuentos: () => Promise<void>;
    fetchDescuentosActivos: () => Promise<void>;
    createDescuento: (data: DescuentoCreate) => Promise<Descuento>;
    updateDescuento: (id: number, data: DescuentoUpdate) => Promise<Descuento>;
    deleteDescuento: (id: number) => Promise<void>;
}

export const useDescuentoStore = create<DescuentoStore>((set, get) => ({
    descuentos: [],
    descuentosActivos: [],
    isLoading: false,
    error: null,

    fetchDescuentos: async () => {
        set({ isLoading: true, error: null });
        try {
            const data = await descuentosApi.getAll();
            set({ descuentos: data, isLoading: false });
        } catch (error: any) {
            set({
                error: error.message || 'Error al cargar descuentos',
                isLoading: false
            });
        }
    },

    fetchDescuentosActivos: async () => {
        // Don't set global isLoading to avoid UI flicker in POS if fetching in parallel
        try {
            const data = await descuentosApi.getActivos();
            set({ descuentosActivos: data });
        } catch (error: any) {
            console.error('Error fetching valids:', error);
        }
    },

    createDescuento: async (data) => {
        set({ isLoading: true, error: null });
        try {
            const nuevo = await descuentosApi.create(data);
            set(state => ({
                descuentos: [...state.descuentos, nuevo],
                isLoading: false
            }));
            return nuevo;
        } catch (error: any) {
            set({
                error: error.message || 'Error al crear descuento',
                isLoading: false
            });
            throw error;
        }
    },

    updateDescuento: async (id, data) => {
        set({ isLoading: true, error: null });
        try {
            const actualizado = await descuentosApi.update(id, data);
            set(state => ({
                descuentos: state.descuentos.map(d => d.id === id ? actualizado : d),
                isLoading: false
            }));
            return actualizado;
        } catch (error: any) {
            set({
                error: error.message || 'Error al actualizar descuento',
                isLoading: false
            });
            throw error;
        }
    },

    deleteDescuento: async (id) => {
        set({ isLoading: true, error: null });
        try {
            await descuentosApi.delete(id);
            set(state => ({
                descuentos: state.descuentos.filter(d => d.id !== id),
                isLoading: false
            }));
        } catch (error: any) {
            set({
                error: error.message || 'Error al eliminar descuento',
                isLoading: false
            });
            throw error;
        }
    }
}));
