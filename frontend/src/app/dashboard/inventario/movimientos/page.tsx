'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useProductoStore, useUbicacionStore } from '@/stores/inventarioStore';
import { movimientosApi } from '@/lib/api/inventario';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import {
    MovimientoInventario,
    TipoMovimiento,
    TIPO_MOVIMIENTO_LABELS,
    formatPrecio,
    Producto,
} from '@/types/inventario';
import {
    ArrowRightLeft,
    Search,
    Loader2,
    RefreshCw,
    X,
    ChevronRight,
    ArrowDownCircle,
    ArrowUpCircle,
    Package,
    Calendar,
    TrendingUp,
    TrendingDown,
    ArrowLeftRight,
    Save,
    Trash2,
    ShoppingCart,
    Plus,
    Minus,
    CheckCircle2,
    History,
    ClipboardList,
} from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

// Tipo para los items pendientes de registro
interface MovimientoPendiente {
    producto: Producto;
    cantidad: number;
    tipoAjuste: 'sumar' | 'restar';
}

// Colores y iconos para tipos de movimiento
const TIPO_MOVIMIENTO_CONFIG: Record<TipoMovimiento, {
    icon: typeof ArrowDownCircle;
    color: string;
    bgColor: string;
}> = {
    compra: { icon: ArrowDownCircle, color: 'text-emerald-600', bgColor: 'bg-emerald-100 dark:bg-emerald-900/20' },
    venta: { icon: ArrowUpCircle, color: 'text-purple-600', bgColor: 'bg-purple-100 dark:bg-purple-900/20' },
    ajuste_positivo: { icon: ArrowDownCircle, color: 'text-green-600', bgColor: 'bg-green-100 dark:bg-green-900/20' },
    ajuste_negativo: { icon: ArrowUpCircle, color: 'text-red-600', bgColor: 'bg-red-100 dark:bg-red-900/20' },
    transferencia: { icon: ArrowLeftRight, color: 'text-blue-600', bgColor: 'bg-blue-100 dark:bg-blue-900/20' },
    uso_interno: { icon: ArrowUpCircle, color: 'text-amber-600', bgColor: 'bg-amber-100 dark:bg-amber-900/20' },
    devolucion: { icon: ArrowDownCircle, color: 'text-cyan-600', bgColor: 'bg-cyan-100 dark:bg-cyan-900/20' },
    merma: { icon: ArrowUpCircle, color: 'text-red-600', bgColor: 'bg-red-100 dark:bg-red-900/20' },
    muestra: { icon: ArrowUpCircle, color: 'text-orange-600', bgColor: 'bg-orange-100 dark:bg-orange-900/20' },
    donacion: { icon: ArrowUpCircle, color: 'text-pink-600', bgColor: 'bg-pink-100 dark:bg-pink-900/20' },
};

export default function MovimientosPage() {
    const { productos, fetchProductos, isLoading: loadingProductos } = useProductoStore();
    const { ubicaciones, fetchUbicaciones } = useUbicacionStore();

    // Vista actual: 'registrar' o 'historial'
    const [vistaActual, setVistaActual] = useState<'registrar' | 'historial'>('registrar');

    // Historial de movimientos
    const [movimientos, setMovimientos] = useState<MovimientoInventario[]>([]);
    const [loadingMovimientos, setLoadingMovimientos] = useState(false);

    // Búsqueda de productos
    const [searchValue, setSearchValue] = useState('');

    // Movimientos pendientes (carrito)
    const [movimientosPendientes, setMovimientosPendientes] = useState<MovimientoPendiente[]>([]);

    // Referencia general para el lote
    const [referenciaLote, setReferenciaLote] = useState('');
    const [ubicacionId, setUbicacionId] = useState<number | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    // Cargar datos iniciales
    useEffect(() => {
        fetchProductos();
        fetchUbicaciones();
    }, [fetchProductos, fetchUbicaciones]);

    // Establecer ubicación inicial
    useEffect(() => {
        if (ubicaciones.length > 0 && !ubicacionId) {
            setUbicacionId(ubicaciones[0].id);
        }
    }, [ubicaciones, ubicacionId]);

    // Cargar historial cuando se cambia a esa vista
    useEffect(() => {
        if (vistaActual === 'historial') {
            loadMovimientos();
        }
    }, [vistaActual]);

    const loadMovimientos = async () => {
        setLoadingMovimientos(true);
        try {
            const data = await movimientosApi.getAll();
            setMovimientos(data);
        } catch (err) {
            console.error('Error loading movimientos:', err);
            toast.error('Error al cargar el historial');
        } finally {
            setLoadingMovimientos(false);
        }
    };

    // Filtrar productos activos por búsqueda
    const productosFiltrados = useMemo(() => {
        const activos = productos.filter(p => p.estado === 'activo');
        if (!searchValue.trim()) return activos;

        const searchLower = searchValue.toLowerCase();
        return activos.filter(p =>
            p.nombre.toLowerCase().includes(searchLower) ||
            p.codigo?.toLowerCase().includes(searchLower)
        );
    }, [productos, searchValue]);

    // Agregar producto al carrito
    const agregarProducto = useCallback((producto: Producto, tipoAjuste: 'sumar' | 'restar') => {
        setMovimientosPendientes(prev => {
            // Verificar si ya existe
            const existente = prev.find(m => m.producto.id === producto.id);
            if (existente) {
                // Si el tipo es diferente, reemplazamos
                if (existente.tipoAjuste !== tipoAjuste) {
                    return prev.map(m =>
                        m.producto.id === producto.id
                            ? { ...m, tipoAjuste, cantidad: 1 }
                            : m
                    );
                }
                // Si es el mismo tipo, incrementamos
                return prev.map(m =>
                    m.producto.id === producto.id
                        ? { ...m, cantidad: m.cantidad + 1 }
                        : m
                );
            }
            // Agregar nuevo
            return [...prev, { producto, cantidad: 1, tipoAjuste }];
        });
    }, []);

    // Modificar cantidad en el carrito
    const modificarCantidad = useCallback((productoId: number, nuevaCantidad: number) => {
        if (nuevaCantidad <= 0) {
            setMovimientosPendientes(prev => prev.filter(m => m.producto.id !== productoId));
        } else {
            setMovimientosPendientes(prev =>
                prev.map(m =>
                    m.producto.id === productoId
                        ? { ...m, cantidad: nuevaCantidad }
                        : m
                )
            );
        }
    }, []);

    // Eliminar del carrito
    const eliminarDelCarrito = useCallback((productoId: number) => {
        setMovimientosPendientes(prev => prev.filter(m => m.producto.id !== productoId));
    }, []);

    // Cambiar tipo de ajuste
    const cambiarTipoAjuste = useCallback((productoId: number) => {
        setMovimientosPendientes(prev =>
            prev.map(m =>
                m.producto.id === productoId
                    ? { ...m, tipoAjuste: m.tipoAjuste === 'sumar' ? 'restar' : 'sumar' }
                    : m
            )
        );
    }, []);

    // Limpiar carrito
    const limpiarCarrito = () => {
        setMovimientosPendientes([]);
        setReferenciaLote('');
    };

    // Guardar todos los movimientos
    const guardarMovimientos = async () => {
        if (movimientosPendientes.length === 0) {
            toast.error('No hay movimientos para registrar');
            return;
        }

        // Validar que al restar no supere el stock
        for (const mov of movimientosPendientes) {
            if (mov.tipoAjuste === 'restar' && mov.cantidad > (mov.producto.stock_total ?? 0)) {
                toast.error(`"${mov.producto.nombre}" no tiene suficiente stock (Stock: ${mov.producto.stock_total ?? 0})`);
                return;
            }
        }

        setIsSaving(true);
        try {
            if (!ubicacionId) {
                toast.error('Debe seleccionar una ubicación');
                return;
            }

            // Registrar cada movimiento
            const promesas = movimientosPendientes.map(mov => {
                const tipoMovimiento: TipoMovimiento = mov.tipoAjuste === 'sumar' ? 'ajuste_positivo' : 'ajuste_negativo';
                return movimientosApi.create({
                    producto_id: mov.producto.id,
                    ubicacion_destino_id: mov.tipoAjuste === 'sumar' ? ubicacionId : undefined,
                    ubicacion_origen_id: mov.tipoAjuste === 'restar' ? ubicacionId : undefined,
                    tipo_movimiento: tipoMovimiento,
                    cantidad: mov.cantidad,
                    referencia: referenciaLote || `Lote ${new Date().toLocaleDateString()}`,
                    motivo: 'Ajuste manual de inventario',
                });
            });

            await Promise.all(promesas);

            toast.success(`${movimientosPendientes.length} movimientos registrados correctamente`);
            limpiarCarrito();
            fetchProductos(); // Recargar productos para actualizar stock
        } catch (error) {
            console.error('Error al guardar movimientos:', error);
            toast.error('Error al registrar los movimientos');
        } finally {
            setIsSaving(false);
        }
    };

    // Verificar si un producto está en el carrito
    const getProductoEnCarrito = (productoId: number) => {
        return movimientosPendientes.find(m => m.producto.id === productoId);
    };

    const formatFecha = (fecha: string) => {
        return new Date(fecha).toLocaleDateString('es-CO', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    // Resumen del carrito
    const resumenCarrito = useMemo(() => {
        const entradas = movimientosPendientes.filter(m => m.tipoAjuste === 'sumar').reduce((acc, m) => acc + m.cantidad, 0);
        const salidas = movimientosPendientes.filter(m => m.tipoAjuste === 'restar').reduce((acc, m) => acc + m.cantidad, 0);
        return { entradas, salidas, total: movimientosPendientes.length };
    }, [movimientosPendientes]);

    return (
        <div className="flex flex-col h-[calc(100vh-120px)]">
            {/* Breadcrumb */}
            <div className="flex items-center text-sm text-gray-500 mb-4">
                <Link href="/dashboard/inventario" className="hover:text-amber-600 transition-colors">
                    Inventario
                </Link>
                <ChevronRight className="w-4 h-4 mx-2" />
                <span className="text-gray-900 dark:text-gray-100 font-medium">Movimientos</span>
            </div>

            {/* Header con tabs */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                        Movimientos de Inventario
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">
                        {vistaActual === 'registrar'
                            ? 'Registra entradas y salidas de múltiples productos'
                            : 'Historial de movimientos realizados'
                        }
                    </p>
                </div>

                {/* Tabs de vista */}
                <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
                    <button
                        onClick={() => setVistaActual('registrar')}
                        className={cn(
                            'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
                            vistaActual === 'registrar'
                                ? 'bg-white dark:bg-gray-700 shadow text-amber-600'
                                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
                        )}
                    >
                        <ClipboardList className="w-4 h-4" />
                        Registrar
                    </button>
                    <button
                        onClick={() => setVistaActual('historial')}
                        className={cn(
                            'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
                            vistaActual === 'historial'
                                ? 'bg-white dark:bg-gray-700 shadow text-amber-600'
                                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
                        )}
                    >
                        <History className="w-4 h-4" />
                        Historial
                    </button>
                </div>
            </div>

            {vistaActual === 'registrar' ? (
                /* VISTA: REGISTRAR MOVIMIENTOS */
                <div className="flex flex-1 gap-6 min-h-0">
                    {/* Panel izquierdo: Lista de productos */}
                    <div className="flex-1 flex flex-col bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden">
                        {/* Búsqueda */}
                        <div className="p-4 border-b border-gray-200 dark:border-gray-800">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <Input
                                    placeholder="Buscar producto por nombre o código..."
                                    value={searchValue}
                                    onChange={(e) => setSearchValue(e.target.value)}
                                    className="pl-10"
                                    autoFocus
                                />
                            </div>
                            <p className="text-xs text-gray-500 mt-2">
                                Haz clic en <span className="text-green-600 font-medium">+</span> para entrada o <span className="text-red-600 font-medium">−</span> para salida
                            </p>
                        </div>

                        {/* Lista de productos */}
                        <div className="flex-1 overflow-y-auto">
                            {loadingProductos ? (
                                <div className="flex items-center justify-center h-32">
                                    <Loader2 className="w-6 h-6 animate-spin text-amber-600" />
                                </div>
                            ) : productosFiltrados.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-32 text-gray-500">
                                    <Package className="w-8 h-8 mb-2 opacity-50" />
                                    <p>No se encontraron productos</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-gray-100 dark:divide-gray-800">
                                    {productosFiltrados.map((producto) => {
                                        const enCarrito = getProductoEnCarrito(producto.id);
                                        const stockActual = producto.stock_total ?? 0;

                                        return (
                                            <div
                                                key={producto.id}
                                                className={cn(
                                                    'flex items-center justify-between px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors',
                                                    enCarrito && 'bg-amber-50/50 dark:bg-amber-900/10'
                                                )}
                                            >
                                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                                    <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center flex-shrink-0">
                                                        <Package className="w-5 h-5 text-purple-600" />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="font-medium text-gray-900 dark:text-gray-100 truncate">
                                                            {producto.nombre}
                                                        </p>
                                                        <div className="flex items-center gap-2 text-xs text-gray-500">
                                                            {producto.codigo && <span className="font-mono">{producto.codigo}</span>}
                                                            <span className={cn(
                                                                'px-1.5 py-0.5 rounded-full',
                                                                stockActual === 0
                                                                    ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                                                    : stockActual < (producto.stock_minimo || 5)
                                                                        ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                                                                        : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                                            )}>
                                                                Stock: {stockActual}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Botones de acción rápida */}
                                                <div className="flex items-center gap-1">
                                                    {enCarrito && (
                                                        <span className={cn(
                                                            'px-2 py-1 rounded text-xs font-bold mr-2',
                                                            enCarrito.tipoAjuste === 'sumar'
                                                                ? 'bg-green-100 text-green-700'
                                                                : 'bg-red-100 text-red-700'
                                                        )}>
                                                            {enCarrito.tipoAjuste === 'sumar' ? '+' : '-'}{enCarrito.cantidad}
                                                        </span>
                                                    )}
                                                    <button
                                                        onClick={() => agregarProducto(producto, 'sumar')}
                                                        className="p-2 rounded-lg bg-green-100 hover:bg-green-200 dark:bg-green-900/30 dark:hover:bg-green-900/50 text-green-600 transition-colors"
                                                        title="Agregar entrada"
                                                    >
                                                        <Plus className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => agregarProducto(producto, 'restar')}
                                                        disabled={stockActual === 0}
                                                        className={cn(
                                                            'p-2 rounded-lg transition-colors',
                                                            stockActual === 0
                                                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                                                : 'bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-900/50 text-red-600'
                                                        )}
                                                        title="Agregar salida"
                                                    >
                                                        <Minus className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Panel derecho: Carrito de movimientos */}
                    <div className="w-96 flex flex-col bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden">
                        {/* Header del carrito */}
                        <div className="p-4 border-b border-gray-200 dark:border-gray-800 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <ShoppingCart className="w-5 h-5 text-amber-600" />
                                    <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                                        Movimientos Pendientes
                                    </h3>
                                </div>
                                {movimientosPendientes.length > 0 && (
                                    <span className="bg-amber-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                                        {movimientosPendientes.length}
                                    </span>
                                )}
                            </div>

                            {/* Resumen */}
                            {movimientosPendientes.length > 0 && (
                                <div className="flex gap-4 mt-3 text-sm">
                                    <div className="flex items-center gap-1 text-green-600">
                                        <TrendingUp className="w-4 h-4" />
                                        <span>+{resumenCarrito.entradas} entradas</span>
                                    </div>
                                    <div className="flex items-center gap-1 text-red-600">
                                        <TrendingDown className="w-4 h-4" />
                                        <span>-{resumenCarrito.salidas} salidas</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Lista del carrito */}
                        <div className="flex-1 overflow-y-auto">
                            {movimientosPendientes.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full text-gray-400 p-6">
                                    <ShoppingCart className="w-12 h-12 mb-3 opacity-30" />
                                    <p className="text-center">
                                        Selecciona productos de la lista para agregar movimientos
                                    </p>
                                </div>
                            ) : (
                                <div className="divide-y divide-gray-100 dark:divide-gray-800">
                                    {movimientosPendientes.map((mov) => (
                                        <div key={mov.producto.id} className="p-4">
                                            <div className="flex items-start justify-between gap-2 mb-2">
                                                <p className="font-medium text-gray-900 dark:text-gray-100 text-sm line-clamp-2">
                                                    {mov.producto.nombre}
                                                </p>
                                                <button
                                                    onClick={() => eliminarDelCarrito(mov.producto.id)}
                                                    className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                {/* Toggle sumar/restar */}
                                                <button
                                                    onClick={() => cambiarTipoAjuste(mov.producto.id)}
                                                    className={cn(
                                                        'px-3 py-1 rounded-lg text-xs font-bold transition-colors',
                                                        mov.tipoAjuste === 'sumar'
                                                            ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                                            : 'bg-red-100 text-red-700 hover:bg-red-200'
                                                    )}
                                                >
                                                    {mov.tipoAjuste === 'sumar' ? 'Entrada' : 'Salida'}
                                                </button>

                                                {/* Control de cantidad */}
                                                <div className="flex items-center gap-1 flex-1">
                                                    <button
                                                        onClick={() => modificarCantidad(mov.producto.id, mov.cantidad - 1)}
                                                        className="p-1 rounded border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800"
                                                    >
                                                        <Minus className="w-3 h-3" />
                                                    </button>
                                                    <Input
                                                        type="number"
                                                        min="1"
                                                        value={mov.cantidad}
                                                        onChange={(e) => modificarCantidad(mov.producto.id, parseInt(e.target.value) || 0)}
                                                        className="w-16 h-8 text-center text-sm font-semibold"
                                                    />
                                                    <button
                                                        onClick={() => modificarCantidad(mov.producto.id, mov.cantidad + 1)}
                                                        className="p-1 rounded border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800"
                                                    >
                                                        <Plus className="w-3 h-3" />
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Vista previa del nuevo stock */}
                                            <div className="mt-2 text-xs text-gray-500 flex justify-between">
                                                <span>Stock actual: {mov.producto.stock_total ?? 0}</span>
                                                <span className={cn(
                                                    'font-medium',
                                                    mov.tipoAjuste === 'sumar' ? 'text-green-600' : 'text-red-600'
                                                )}>
                                                    → {mov.tipoAjuste === 'sumar'
                                                        ? (mov.producto.stock_total ?? 0) + mov.cantidad
                                                        : Math.max(0, (mov.producto.stock_total ?? 0) - mov.cantidad)
                                                    }
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Footer del carrito */}
                        {movimientosPendientes.length > 0 && (
                            <div className="p-4 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 space-y-3">
                                {/* Referencia del lote */}
                                <Input
                                    value={referenciaLote}
                                    onChange={(e) => setReferenciaLote(e.target.value)}
                                    placeholder="Referencia del lote (opcional)"
                                    className="text-sm"
                                />

                                {/* Selector de Ubicación */}
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-gray-500">Ubicación</label>
                                    <select
                                        value={ubicacionId || ''}
                                        onChange={(e) => setUbicacionId(Number(e.target.value))}
                                        className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 outline-none focus:ring-2 focus:ring-amber-500"
                                    >
                                        <option value="">Seleccionar ubicación</option>
                                        {ubicaciones.map(u => (
                                            <option key={u.id} value={u.id}>{u.nombre}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        onClick={limpiarCarrito}
                                        disabled={isSaving}
                                        className="flex-1"
                                    >
                                        <Trash2 className="w-4 h-4 mr-2" />
                                        Limpiar
                                    </Button>
                                    <Button
                                        onClick={guardarMovimientos}
                                        disabled={isSaving}
                                        className="flex-1 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
                                    >
                                        {isSaving ? (
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        ) : (
                                            <CheckCircle2 className="w-4 h-4 mr-2" />
                                        )}
                                        Registrar Todo
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                /* VISTA: HISTORIAL DE MOVIMIENTOS */
                <div className="flex-1 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden">
                    {/* Header */}
                    <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
                        <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                            Historial de Movimientos
                        </h3>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={loadMovimientos}
                            disabled={loadingMovimientos}
                        >
                            <RefreshCw className={cn('w-4 h-4 mr-2', loadingMovimientos && 'animate-spin')} />
                            Actualizar
                        </Button>
                    </div>

                    {/* Tabla de historial */}
                    <div className="overflow-auto flex-1">
                        {loadingMovimientos ? (
                            <div className="flex items-center justify-center h-64">
                                <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
                            </div>
                        ) : movimientos.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                                <ArrowRightLeft className="w-12 h-12 mb-3 opacity-30" />
                                <p>No hay movimientos registrados</p>
                            </div>
                        ) : (
                            <table className="w-full">
                                <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                                            Fecha
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                                            Tipo
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                                            Producto
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                                            Cantidad
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                                            Referencia
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                    {movimientos.map((mov) => {
                                        const config = TIPO_MOVIMIENTO_CONFIG[mov.tipo_movimiento];
                                        const Icon = config?.icon || ArrowRightLeft;
                                        const isEntrada = ['compra', 'ajuste_positivo', 'devolucion'].includes(mov.tipo_movimiento);

                                        return (
                                            <tr key={mov.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                                <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                                                    <div className="flex items-center gap-2">
                                                        <Calendar className="w-4 h-4 text-gray-400" />
                                                        {formatFecha(mov.fecha_movimiento)}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className={cn(
                                                        'inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium',
                                                        config?.bgColor || 'bg-gray-100',
                                                        config?.color || 'text-gray-600'
                                                    )}>
                                                        <Icon className="w-3 h-3" />
                                                        {TIPO_MOVIMIENTO_LABELS[mov.tipo_movimiento]}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-2">
                                                        <Package className="w-4 h-4 text-purple-500" />
                                                        <span className="font-medium text-gray-900 dark:text-gray-100">
                                                            {mov.producto?.nombre || `Producto #${mov.producto_id}`}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className={cn(
                                                        'font-semibold',
                                                        isEntrada ? 'text-green-600' : 'text-red-600'
                                                    )}>
                                                        {isEntrada ? '+' : '-'}{mov.cantidad}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 truncate max-w-[200px]">
                                                    {mov.referencia || mov.notas || '-'}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
