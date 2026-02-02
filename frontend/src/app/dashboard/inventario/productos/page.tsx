'use client';

import { useEffect, useState, useMemo } from 'react';
import { useProductoStore, useProveedorStore } from '@/stores/inventarioStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { formatPrecio, getStockStatus, ESTADO_PRODUCTO_LABELS } from '@/types/inventario';
import { cn } from '@/lib/utils';
import {
    Package,
    Plus,
    Search,
    Loader2,
    Edit,
    Power,
    RefreshCw,
    X,
    Grid3X3,
    List,
    AlertTriangle,
    TrendingUp,
    DollarSign,
    Boxes,
    Truck,
    PlusCircle,
    MinusCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import ProductoModal from '@/components/inventario/ProductoModal';
import AjusteStockModal from '@/components/inventario/AjusteStockModal';
import HistorialProductoModal from '@/components/inventario/HistorialProductoModal';
import { Producto } from '@/types/inventario';

export default function ProductosPage() {
    const {
        productos,
        isLoading,
        error,
        fetchProductos,
        deleteProducto,
        activateProducto,
        resetFilters,
        clearError,
    } = useProductoStore();

    const { proveedores, fetchProveedores } = useProveedorStore();

    const [searchValue, setSearchValue] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingProducto, setEditingProducto] = useState<number | null>(null);
    const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
    const [selectedProveedorFilter, setSelectedProveedorFilter] = useState<number | null>(null);
    const [selectedEstadoFilter, setSelectedEstadoFilter] = useState<'todos' | 'activo' | 'inactivo' | 'descontinuado'>('todos');
    const [selectedStockFilter, setSelectedStockFilter] = useState<'todos' | 'bajo' | 'sin_stock'>('todos');

    // Estado para el modal de ajuste de stock
    const [showAjusteModal, setShowAjusteModal] = useState(false);
    const [productoParaAjuste, setProductoParaAjuste] = useState<Producto | null>(null);

    // Estado para el modal de historial
    const [showHistorialModal, setShowHistorialModal] = useState(false);
    const [productoParaHistorial, setProductoParaHistorial] = useState<Producto | null>(null);

    // Cargar datos iniciales
    useEffect(() => {
        fetchProductos();
        fetchProveedores();
    }, [fetchProductos, fetchProveedores]);

    // Filtrar productos localmente
    const filteredProductos = useMemo(() => {
        return productos.filter((producto) => {
            // Filtrar por búsqueda
            if (searchValue) {
                const searchLower = searchValue.toLowerCase();
                const matchesNombre = producto.nombre.toLowerCase().includes(searchLower);
                const matchesCodigo = producto.codigo?.toLowerCase().includes(searchLower);
                if (!matchesNombre && !matchesCodigo) return false;
            }
            // Filtrar por proveedor
            if (selectedProveedorFilter && producto.proveedor_id !== selectedProveedorFilter) {
                return false;
            }
            // Filtrar por estado
            if (selectedEstadoFilter !== 'todos' && producto.estado !== selectedEstadoFilter) {
                return false;
            }
            // Filtrar por stock
            if (selectedStockFilter !== 'todos') {
                const stockTotal = producto.stock_total ?? 0;
                const stockStatus = getStockStatus(stockTotal, producto.stock_minimo);
                if (selectedStockFilter === 'bajo' && stockStatus !== 'bajo') return false;
                if (selectedStockFilter === 'sin_stock' && stockStatus !== 'sin_stock') return false;
            }
            return true;
        });
    }, [productos, searchValue, selectedProveedorFilter, selectedEstadoFilter, selectedStockFilter]);

    // Estadísticas
    const stats = useMemo(() => {
        const activos = productos.filter(p => p.estado === 'activo').length;
        const stockBajo = productos.filter(p => {
            const stock = p.stock_total ?? 0;
            return getStockStatus(stock, p.stock_minimo) === 'bajo';
        }).length;
        const sinStock = productos.filter(p => {
            const stock = p.stock_total ?? 0;
            return getStockStatus(stock, p.stock_minimo) === 'sin_stock';
        }).length;
        const valorTotal = productos.reduce((acc, p) => {
            const stock = p.stock_total ?? 0;
            return acc + (stock * p.precio_venta);
        }, 0);

        return { activos, stockBajo, sinStock, valorTotal };
    }, [productos]);

    const handleNuevoProducto = () => {
        setEditingProducto(null);
        setShowModal(true);
    };

    const handleEditarProducto = (id: number) => {
        setEditingProducto(id);
        setShowModal(true);
    };

    const handleToggleActivo = async (id: number, estadoActual: string) => {
        try {
            if (estadoActual === 'activo') {
                await deleteProducto(id);
                toast.success('Producto desactivado');
            } else {
                await activateProducto(id);
                toast.success('Producto activado');
            }
        } catch {
            toast.error('Error al cambiar estado del producto');
        }
    };

    const handleClearFilters = () => {
        setSearchValue('');
        setSelectedProveedorFilter(null);
        setSelectedEstadoFilter('todos');
        setSelectedStockFilter('todos');
        resetFilters();
    };

    const handleAjustarStock = (producto: Producto) => {
        setProductoParaAjuste(producto);
        setShowAjusteModal(true);
    };

    const handleVerHistorial = (producto: Producto) => {
        setProductoParaHistorial(producto);
        setShowHistorialModal(true);
    };

    const getProveedorNombre = (proveedorId: number | null): string => {
        if (!proveedorId) return 'Sin proveedor';
        const proveedor = proveedores.find((p) => p.id === proveedorId);
        return proveedor?.nombre || 'Sin proveedor';
    };

    const getStockBadgeStyles = (producto: typeof productos[0]) => {
        const stock = producto.stock_total ?? 0;
        const status = getStockStatus(stock, producto.stock_minimo);

        switch (status) {
            case 'sin_stock':
                return 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-400';
            case 'bajo':
                return 'bg-amber-100 dark:bg-amber-900/20 text-amber-800 dark:text-amber-400';
            default:
                return 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400';
        }
    };

    if (isLoading && productos.length === 0) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                        Gestión de Productos
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">
                        Administra el catálogo de productos del inventario
                    </p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <Button
                        onClick={handleNuevoProducto}
                        className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Nuevo Producto
                    </Button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-purple-200 dark:border-purple-800">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-purple-600 dark:text-purple-400">Total Productos</p>
                                <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                                    {productos.length}
                                </p>
                            </div>
                            <div className="p-3 rounded-lg bg-purple-200 dark:bg-purple-800/50">
                                <Boxes className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-800">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-green-600 dark:text-green-400">Productos Activos</p>
                                <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                                    {stats.activos}
                                </p>
                            </div>
                            <div className="p-3 rounded-lg bg-green-200 dark:bg-green-800/50">
                                <TrendingUp className="w-6 h-6 text-green-600 dark:text-green-400" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20 border-amber-200 dark:border-amber-800">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-amber-600 dark:text-amber-400">Stock Bajo / Sin Stock</p>
                                <p className="text-2xl font-bold text-amber-900 dark:text-amber-100">
                                    {stats.stockBajo} / {stats.sinStock}
                                </p>
                            </div>
                            <div className="p-3 rounded-lg bg-amber-200 dark:bg-amber-800/50">
                                <AlertTriangle className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20 border-emerald-200 dark:border-emerald-800">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-emerald-600 dark:text-emerald-400">Valor Inventario</p>
                                <p className="text-xl font-bold text-emerald-900 dark:text-emerald-100">
                                    {formatPrecio(stats.valorTotal)}
                                </p>
                            </div>
                            <div className="p-3 rounded-lg bg-emerald-200 dark:bg-emerald-800/50">
                                <DollarSign className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Toolbar: Search & Filters */}
            <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-4">
                <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                    {/* Search */}
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                            placeholder="Buscar productos por nombre o código..."
                            value={searchValue}
                            onChange={(e) => setSearchValue(e.target.value)}
                            className="pl-10"
                        />
                    </div>

                    {/* Filter buttons */}
                    <div className="flex flex-wrap gap-2">
                        {/* Proveedor Filter */}
                        <select
                            value={selectedProveedorFilter || ''}
                            onChange={(e) => setSelectedProveedorFilter(e.target.value ? Number(e.target.value) : null)}
                            className="px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                        >
                            <option value="">Todos los proveedores</option>
                            {proveedores.map((prov) => (
                                <option key={prov.id} value={prov.id}>{prov.nombre}</option>
                            ))}
                        </select>

                        {/* Estado Filter */}
                        <select
                            value={selectedEstadoFilter}
                            onChange={(e) => setSelectedEstadoFilter(e.target.value as typeof selectedEstadoFilter)}
                            className="px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                        >
                            <option value="todos">Todos los estados</option>
                            <option value="activo">Activos</option>
                            <option value="inactivo">Inactivos</option>
                            <option value="descontinuado">Descontinuados</option>
                        </select>

                        {/* Stock Filter */}
                        <select
                            value={selectedStockFilter}
                            onChange={(e) => setSelectedStockFilter(e.target.value as typeof selectedStockFilter)}
                            className="px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                        >
                            <option value="todos">Todo el stock</option>
                            <option value="bajo">Stock bajo</option>
                            <option value="sin_stock">Sin stock</option>
                        </select>

                        {/* View mode toggle */}
                        <div className="flex border border-gray-200 dark:border-gray-700 rounded-md">
                            <button
                                onClick={() => setViewMode('table')}
                                className={cn(
                                    'p-2 transition-colors',
                                    viewMode === 'table'
                                        ? 'bg-purple-100 dark:bg-purple-900/20 text-purple-600'
                                        : 'text-gray-400 hover:text-gray-600'
                                )}
                            >
                                <List className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => setViewMode('cards')}
                                className={cn(
                                    'p-2 transition-colors',
                                    viewMode === 'cards'
                                        ? 'bg-purple-100 dark:bg-purple-900/20 text-purple-600'
                                        : 'text-gray-400 hover:text-gray-600'
                                )}
                            >
                                <Grid3X3 className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Clear filters */}
                        {(searchValue || selectedProveedorFilter || selectedEstadoFilter !== 'todos' || selectedStockFilter !== 'todos') && (
                            <Button variant="ghost" size="sm" onClick={handleClearFilters}>
                                <X className="w-4 h-4 mr-1" />
                                Limpiar
                            </Button>
                        )}

                        {/* Refresh */}
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => fetchProductos()}
                            disabled={isLoading}
                        >
                            <RefreshCw className={cn('w-4 h-4', isLoading && 'animate-spin')} />
                        </Button>
                    </div>
                </div>
            </div>

            {/* Error */}
            {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                    <p className="text-red-600 dark:text-red-400">{error}</p>
                    <Button variant="ghost" size="sm" onClick={clearError} className="mt-2">
                        Cerrar
                    </Button>
                </div>
            )}

            {/* Content */}
            {filteredProductos.length === 0 ? (
                <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-12 text-center">
                    <Package className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                        No hay productos
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400 mb-4">
                        {searchValue || selectedProveedorFilter || selectedEstadoFilter !== 'todos' || selectedStockFilter !== 'todos'
                            ? 'No se encontraron productos con los filtros aplicados'
                            : 'Comienza creando tu primer producto'}
                    </p>
                    <Button onClick={handleNuevoProducto} className="bg-gradient-to-r from-purple-600 to-pink-600">
                        <Plus className="w-4 h-4 mr-2" />
                        Crear primer producto
                    </Button>
                </div>
            ) : viewMode === 'table' ? (
                /* Table View */
                <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 dark:bg-gray-800">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        Producto
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        Código
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        Proveedor
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        Precio Venta
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        Stock
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        Estado
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        Acciones
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                {filteredProductos.map((producto) => (
                                    <tr
                                        key={producto.id}
                                        className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                                        onClick={() => handleVerHistorial(producto)}
                                    >
                                        <td className="px-6 py-4">
                                            <div className="flex items-center">
                                                <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center mr-3">
                                                    <Package className="w-5 h-5 text-purple-600" />
                                                </div>
                                                <div>
                                                    <p className="font-medium text-gray-900 dark:text-gray-100">
                                                        {producto.nombre}
                                                    </p>
                                                    {producto.descripcion && (
                                                        <p className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-[200px]">
                                                            {producto.descripcion}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-sm font-mono text-gray-600 dark:text-gray-400">
                                                {producto.codigo || '-'}
                                            </p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center text-gray-600 dark:text-gray-400">
                                                <Truck className="w-4 h-4 mr-1.5" />
                                                <span className="text-sm">{getProveedorNombre(producto.proveedor_id)}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="font-semibold text-gray-900 dark:text-gray-100">
                                                {formatPrecio(producto.precio_venta)}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                Compra: {formatPrecio(producto.precio_compra)}
                                            </p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleAjustarStock(producto);
                                                }}
                                                className={cn(
                                                    'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium cursor-pointer hover:ring-2 hover:ring-offset-1 hover:ring-purple-400 transition-all',
                                                    getStockBadgeStyles(producto)
                                                )}
                                                title="Click para ajustar stock"
                                            >
                                                {producto.stock_total ?? 0} unidades
                                            </button>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span
                                                className={cn(
                                                    'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium',
                                                    producto.estado === 'activo'
                                                        ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400'
                                                        : producto.estado === 'descontinuado'
                                                            ? 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-400'
                                                            : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                                                )}
                                            >
                                                {ESTADO_PRODUCTO_LABELS[producto.estado]}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-end space-x-1">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleAjustarStock(producto);
                                                    }}
                                                    className="text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                                                    title="Ajustar stock"
                                                >
                                                    <PlusCircle className="w-4 h-4" />
                                                    <MinusCircle className="w-4 h-4 -ml-2" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleEditarProducto(producto.id)}
                                                    title="Editar producto"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleToggleActivo(producto.id, producto.estado)}
                                                    className={cn(
                                                        producto.estado === 'activo'
                                                            ? 'text-red-600 hover:text-red-700 hover:bg-red-50'
                                                            : 'text-green-600 hover:text-green-700 hover:bg-green-50'
                                                    )}
                                                    title={producto.estado === 'activo' ? 'Desactivar' : 'Activar'}
                                                >
                                                    <Power className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                /* Cards View */
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {filteredProductos.map((producto) => (
                        <Card
                            key={producto.id}
                            className={cn(
                                'hover:shadow-lg transition-all cursor-pointer group',
                                producto.estado !== 'activo' && 'opacity-60'
                            )}
                            onClick={() => handleVerHistorial(producto)}
                        >
                            <CardContent className="p-4">
                                <div className="flex items-start justify-between mb-3">
                                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 flex items-center justify-center">
                                        <Package className="w-6 h-6 text-purple-600" />
                                    </div>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleAjustarStock(producto);
                                        }}
                                        className={cn(
                                            'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium hover:ring-2 hover:ring-offset-1 hover:ring-purple-400 transition-all',
                                            getStockBadgeStyles(producto)
                                        )}
                                        title="Click para ajustar stock"
                                    >
                                        {producto.stock_total ?? 0} uds
                                    </button>
                                </div>

                                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1 group-hover:text-purple-600 transition-colors line-clamp-1">
                                    {producto.nombre}
                                </h3>

                                {producto.codigo && (
                                    <p className="text-xs font-mono text-gray-500 mb-2">
                                        {producto.codigo}
                                    </p>
                                )}

                                <div className="flex items-center text-xs text-gray-500 mb-3">
                                    <Truck className="w-3 h-3 mr-1" />
                                    <span className="truncate">{getProveedorNombre(producto.proveedor_id)}</span>
                                </div>

                                <div className="flex items-center justify-between text-sm">
                                    <span
                                        className={cn(
                                            'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
                                            producto.estado === 'activo'
                                                ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400'
                                                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                                        )}
                                    >
                                        {producto.estado}
                                    </span>
                                    <div className="font-semibold text-purple-600">
                                        {formatPrecio(producto.precio_venta)}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Modal de Producto */}
            <ProductoModal
                isOpen={showModal}
                onClose={() => {
                    setShowModal(false);
                    setEditingProducto(null);
                }}
                productoId={editingProducto}
            />

            {/* Modal de Ajuste de Stock */}
            <AjusteStockModal
                isOpen={showAjusteModal}
                onClose={() => {
                    setShowAjusteModal(false);
                    setProductoParaAjuste(null);
                }}
                producto={productoParaAjuste}
                onSuccess={() => {
                    fetchProductos();
                }}
            />

            {/* Modal de Historial */}
            <HistorialProductoModal
                isOpen={showHistorialModal}
                onClose={() => {
                    setShowHistorialModal(false);
                    setProductoParaHistorial(null);
                }}
                productoId={productoParaHistorial?.id || null}
                productoNombre={productoParaHistorial?.nombre || ''}
            />
        </div>
    );
}
