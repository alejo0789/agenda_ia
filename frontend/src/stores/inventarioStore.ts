import { create } from 'zustand';
import {
    Proveedor,
    ProveedorCreate,
    ProveedorUpdate,
    ProveedorFilters,
    Producto,
    ProductoCreate,
    ProductoUpdate,
    ProductoFilters,
    UbicacionInventario,
} from '@/types/inventario';
import { proveedoresApi, productosApi, ubicacionesApi } from '@/lib/api/inventario';

// ============================================
// STORE DE PROVEEDORES
// ============================================

interface ProveedorStoreState {
    proveedores: Proveedor[];
    proveedorSeleccionado: Proveedor | null;
    isLoading: boolean;
    error: string | null;
    filters: ProveedorFilters;

    // Actions
    fetchProveedores: (filters?: ProveedorFilters) => Promise<void>;
    fetchProveedorById: (id: number) => Promise<Proveedor | null>;
    createProveedor: (data: ProveedorCreate) => Promise<Proveedor>;
    updateProveedor: (id: number, data: ProveedorUpdate) => Promise<Proveedor>;
    deleteProveedor: (id: number) => Promise<void>;
    setFilters: (filters: ProveedorFilters) => void;
    clearError: () => void;
}

export const useProveedorStore = create<ProveedorStoreState>((set, get) => ({
    proveedores: [],
    proveedorSeleccionado: null,
    isLoading: false,
    error: null,
    filters: {},

    fetchProveedores: async (filters?: ProveedorFilters) => {
        set({ isLoading: true, error: null });
        try {
            const currentFilters = filters || get().filters;
            const proveedores = await proveedoresApi.getAll(currentFilters);
            set({ proveedores, isLoading: false });
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Error al cargar proveedores';
            set({ error: message, isLoading: false });
        }
    },

    fetchProveedorById: async (id: number) => {
        set({ isLoading: true, error: null });
        try {
            const proveedor = await proveedoresApi.getById(id);
            set({ proveedorSeleccionado: proveedor, isLoading: false });
            return proveedor;
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Error al cargar proveedor';
            set({ error: message, isLoading: false });
            return null;
        }
    },

    createProveedor: async (data: ProveedorCreate) => {
        set({ isLoading: true, error: null });
        try {
            const proveedor = await proveedoresApi.create(data);
            const proveedores = [...get().proveedores, proveedor];
            set({ proveedores, isLoading: false });
            return proveedor;
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Error al crear proveedor';
            set({ error: message, isLoading: false });
            throw error;
        }
    },

    updateProveedor: async (id: number, data: ProveedorUpdate) => {
        set({ isLoading: true, error: null });
        try {
            const proveedor = await proveedoresApi.update(id, data);
            const proveedores = get().proveedores.map(p => p.id === id ? proveedor : p);
            set({ proveedores, proveedorSeleccionado: proveedor, isLoading: false });
            return proveedor;
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Error al actualizar proveedor';
            set({ error: message, isLoading: false });
            throw error;
        }
    },

    deleteProveedor: async (id: number) => {
        set({ isLoading: true, error: null });
        try {
            await proveedoresApi.delete(id);
            const proveedores = get().proveedores.filter(p => p.id !== id);
            set({ proveedores, isLoading: false });
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Error al eliminar proveedor';
            set({ error: message, isLoading: false });
            throw error;
        }
    },

    setFilters: (filters: ProveedorFilters) => {
        set({ filters });
    },

    clearError: () => set({ error: null }),
}));

// ============================================
// STORE DE PRODUCTOS
// ============================================

interface ProductoStoreState {
    productos: Producto[];
    productoSeleccionado: Producto | null;
    isLoading: boolean;
    error: string | null;
    filters: ProductoFilters;

    // Actions
    fetchProductos: (filters?: ProductoFilters) => Promise<void>;
    fetchProductoById: (id: number) => Promise<Producto | null>;
    createProducto: (data: ProductoCreate) => Promise<Producto>;
    updateProducto: (id: number, data: ProductoUpdate) => Promise<Producto>;
    deleteProducto: (id: number) => Promise<void>;
    activateProducto: (id: number) => Promise<void>;
    setFilters: (filters: ProductoFilters) => void;
    clearError: () => void;
    resetFilters: () => void;
}

export const useProductoStore = create<ProductoStoreState>((set, get) => ({
    productos: [],
    productoSeleccionado: null,
    isLoading: false,
    error: null,
    filters: {},

    fetchProductos: async (filters?: ProductoFilters) => {
        set({ isLoading: true, error: null });
        try {
            const currentFilters = filters || get().filters;
            const productos = await productosApi.getAll(currentFilters);
            set({ productos, isLoading: false });
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Error al cargar productos';
            set({ error: message, isLoading: false });
        }
    },

    fetchProductoById: async (id: number) => {
        set({ isLoading: true, error: null });
        try {
            const producto = await productosApi.getById(id);
            set({ productoSeleccionado: producto, isLoading: false });
            return producto;
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Error al cargar producto';
            set({ error: message, isLoading: false });
            return null;
        }
    },

    createProducto: async (data: ProductoCreate) => {
        set({ isLoading: true, error: null });
        try {
            const producto = await productosApi.create(data);
            const productos = [...get().productos, producto];
            set({ productos, isLoading: false });
            return producto;
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Error al crear producto';
            set({ error: message, isLoading: false });
            throw error;
        }
    },

    updateProducto: async (id: number, data: ProductoUpdate) => {
        set({ isLoading: true, error: null });
        try {
            const producto = await productosApi.update(id, data);
            const productos = get().productos.map(p => p.id === id ? producto : p);
            set({ productos, productoSeleccionado: producto, isLoading: false });
            return producto;
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Error al actualizar producto';
            set({ error: message, isLoading: false });
            throw error;
        }
    },

    deleteProducto: async (id: number) => {
        set({ isLoading: true, error: null });
        try {
            await productosApi.delete(id);
            // Actualizar el estado del producto a inactivo
            const productos = get().productos.map(p =>
                p.id === id ? { ...p, estado: 'inactivo' as const } : p
            );
            set({ productos, isLoading: false });
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Error al desactivar producto';
            set({ error: message, isLoading: false });
            throw error;
        }
    },

    activateProducto: async (id: number) => {
        set({ isLoading: true, error: null });
        try {
            const producto = await productosApi.activate(id);
            const productos = get().productos.map(p => p.id === id ? producto : p);
            set({ productos, isLoading: false });
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Error al activar producto';
            set({ error: message, isLoading: false });
            throw error;
        }
    },

    setFilters: (filters: ProductoFilters) => {
        set({ filters });
    },

    clearError: () => set({ error: null }),

    resetFilters: () => set({ filters: {} }),
}));

// ============================================
// STORE DE UBICACIONES
// ============================================

interface UbicacionStoreState {
    ubicaciones: UbicacionInventario[];
    isLoading: boolean;
    error: string | null;

    // Actions
    fetchUbicaciones: () => Promise<void>;
    clearError: () => void;
}

export const useUbicacionStore = create<UbicacionStoreState>((set) => ({
    ubicaciones: [],
    isLoading: false,
    error: null,

    fetchUbicaciones: async () => {
        set({ isLoading: true, error: null });
        try {
            const ubicaciones = await ubicacionesApi.getAll();
            set({ ubicaciones, isLoading: false });
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Error al cargar ubicaciones';
            set({ error: message, isLoading: false });
        }
    },

    clearError: () => set({ error: null }),
}));
