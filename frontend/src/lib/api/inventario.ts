import { apiClient } from './client';
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
    Inventario,
    MovimientoInventario,
    MovimientoCreate,
    MovimientoFilters,
} from '@/types/inventario';

// ============================================
// API DE PROVEEDORES
// ============================================

export const proveedoresApi = {
    // Listar todos los proveedores con filtros
    getAll: async (params?: ProveedorFilters): Promise<Proveedor[]> => {
        const response = await apiClient.get('/productos/proveedores', { params });
        return response.data;
    },

    // Obtener un proveedor por ID
    getById: async (id: number): Promise<Proveedor> => {
        const response = await apiClient.get(`/productos/proveedores/${id}`);
        return response.data;
    },

    // Crear un nuevo proveedor
    create: async (data: ProveedorCreate): Promise<Proveedor> => {
        const response = await apiClient.post('/productos/proveedores', data);
        return response.data;
    },

    // Actualizar un proveedor
    update: async (id: number, data: ProveedorUpdate): Promise<Proveedor> => {
        const response = await apiClient.put(`/productos/proveedores/${id}`, data);
        return response.data;
    },

    // Eliminar un proveedor
    delete: async (id: number): Promise<void> => {
        await apiClient.delete(`/productos/proveedores/${id}`);
    },
};

// ============================================
// API DE PRODUCTOS
// ============================================

export const productosApi = {
    // Listar todos los productos con filtros (el backend devuelve paginado)
    getAll: async (params?: ProductoFilters): Promise<Producto[]> => {
        const response = await apiClient.get('/productos', { params });
        // El backend devuelve { items: [...], total, pagina, ... }
        return response.data.items || response.data;
    },

    // Obtener un producto por ID
    getById: async (id: number): Promise<Producto> => {
        const response = await apiClient.get(`/productos/${id}`);
        return response.data;
    },

    // Crear un nuevo producto
    create: async (data: ProductoCreate): Promise<Producto> => {
        const response = await apiClient.post('/productos', data);
        return response.data;
    },

    // Actualizar un producto
    update: async (id: number, data: ProductoUpdate): Promise<Producto> => {
        const response = await apiClient.put(`/productos/${id}`, data);
        return response.data;
    },

    // Eliminar un producto (soft delete)
    delete: async (id: number): Promise<void> => {
        await apiClient.delete(`/productos/${id}`);
    },

    // Activar un producto
    activate: async (id: number): Promise<Producto> => {
        const response = await apiClient.put(`/productos/${id}/activar`);
        return response.data;
    },
};

// ============================================
// API DE UBICACIONES
// ============================================

export const ubicacionesApi = {
    // Listar todas las ubicaciones
    getAll: async (): Promise<UbicacionInventario[]> => {
        const response = await apiClient.get('/inventario/ubicaciones');
        return response.data;
    },

    // Obtener una ubicación por ID
    getById: async (id: number): Promise<UbicacionInventario> => {
        const response = await apiClient.get(`/inventario/ubicaciones/${id}`);
        return response.data;
    },

    // Inicializar ubicaciones por defecto
    inicializar: async (): Promise<void> => {
        await apiClient.post('/inventario/inicializar-ubicaciones');
    },
};

// ============================================
// API DE INVENTARIO
// ============================================

export const inventarioApi = {
    // Listar inventario
    getAll: async (params?: { producto_id?: number; ubicacion_id?: number }): Promise<Inventario[]> => {
        const response = await apiClient.get('/inventario', { params });
        return response.data;
    },

    // Obtener inventario por producto
    getByProducto: async (productoId: number): Promise<Inventario[]> => {
        const response = await apiClient.get('/inventario', { params: { producto_id: productoId } });
        return response.data;
    },

    // Obtener inventario por ubicación
    getByUbicacion: async (ubicacionId: number): Promise<Inventario[]> => {
        const response = await apiClient.get('/inventario', { params: { ubicacion_id: ubicacionId } });
        return response.data;
    },

    // Obtener resumen de inventario
    getResumen: async (): Promise<{ total_productos: number; total_unidades: number; valor_total: number }> => {
        const response = await apiClient.get('/inventario/reportes/resumen-inventario');
        return response.data;
    },

    // Ajustar inventario
    ajustar: async (data: { producto_id: number; ubicacion_id: number; cantidad_nueva: number; motivo: string }): Promise<void> => {
        await apiClient.post('/inventario/ajustar', data);
    },
};

// ============================================
// API DE MOVIMIENTOS
// ============================================

export const movimientosApi = {
    // Listar movimientos con filtros
    getAll: async (params?: MovimientoFilters): Promise<MovimientoInventario[]> => {
        const response = await apiClient.get('/inventario/movimientos', { params });
        // El backend devuelve paginado { items: [...], total, ... }
        return response.data.items || response.data;
    },

    // Obtener un movimiento por ID
    getById: async (id: number): Promise<MovimientoInventario> => {
        const response = await apiClient.get(`/inventario/movimientos/${id}`);
        return response.data;
    },

    // Crear un movimiento
    create: async (data: MovimientoCreate): Promise<MovimientoInventario> => {
        const response = await apiClient.post('/inventario/movimientos', data);
        return response.data;
    },

    // Registrar una compra
    registrarCompra: async (data: { producto_id: number; cantidad: number; costo_unitario: number; ubicacion_destino_id: number; referencia?: string; motivo?: string }): Promise<MovimientoInventario> => {
        const response = await apiClient.post('/inventario/movimientos/compra', data);
        return response.data;
    },

    // Realizar transferencia entre ubicaciones
    transferir: async (data: { producto_id: number; ubicacion_origen_id: number; ubicacion_destino_id: number; cantidad: number; motivo?: string }): Promise<{ mensaje: string; movimiento_id: number }> => {
        const response = await apiClient.post('/inventario/transferir', data);
        return response.data;
    },
};

export default {
    proveedores: proveedoresApi,
    productos: productosApi,
    ubicaciones: ubicacionesApi,
    inventario: inventarioApi,
    movimientos: movimientosApi,
};
