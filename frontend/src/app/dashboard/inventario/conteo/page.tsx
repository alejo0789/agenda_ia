'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useProductoStore, useUbicacionStore } from '@/stores/inventarioStore';
import { inventarioApi, movimientosApi } from '@/lib/api/inventario';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatPrecio, Producto } from '@/types/inventario';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import {
    ChevronRight,
    ClipboardCheck,
    Package,
    Search,
    Download,
    Save,
    Loader2,
    RefreshCw,
    AlertTriangle,
    CheckCircle2,
    XCircle,
    Filter,
    Calendar,
    FileSpreadsheet,
    ArrowUpDown,
    Minus,
    Plus,
} from 'lucide-react';
import { toast } from 'sonner';

interface ConteoItem {
    producto: Producto;
    stockEsperado: number;
    cantidadContada: number | null;
    diferencia: number | null;
    estado: 'pendiente' | 'correcto' | 'diferencia';
}

export default function ConteoFisicoPage() {
    const { productos, fetchProductos, isLoading: loadingProductos } = useProductoStore();
    const { ubicaciones, fetchUbicaciones } = useUbicacionStore();

    const [conteoItems, setConteoItems] = useState<ConteoItem[]>([]);
    const [searchValue, setSearchValue] = useState('');
    const [ubicacionFilter, setUbicacionFilter] = useState<number | 'todas'>('todas');
    const [estadoFilter, setEstadoFilter] = useState<'todos' | 'pendiente' | 'correcto' | 'diferencia'>('todos');
    const [fechaCorte, setFechaCorte] = useState(new Date().toISOString().split('T')[0]);
    const [isSaving, setIsSaving] = useState(false);
    const [sortBy, setSortBy] = useState<'nombre' | 'diferencia'>('nombre');
    const [ubicacionId, setUbicacionId] = useState<number | null>(null);

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

    // Inicializar items de conteo cuando cargan los productos
    useEffect(() => {
        if (productos.length > 0) {
            const items: ConteoItem[] = productos
                .filter(p => p.estado === 'activo')
                .map(p => ({
                    producto: p,
                    stockEsperado: p.stock_total ?? 0,
                    cantidadContada: null,
                    diferencia: null,
                    estado: 'pendiente' as const,
                }));
            setConteoItems(items);
        }
    }, [productos]);

    // Actualizar cantidad contada
    const actualizarConteo = useCallback((productoId: number, cantidad: number | null) => {
        setConteoItems(prev => prev.map(item => {
            if (item.producto.id !== productoId) return item;

            const cantidadContada = cantidad;
            const diferencia = cantidadContada !== null ? cantidadContada - item.stockEsperado : null;
            const estado: 'pendiente' | 'correcto' | 'diferencia' =
                cantidadContada === null ? 'pendiente' :
                    diferencia === 0 ? 'correcto' : 'diferencia';

            return { ...item, cantidadContada, diferencia, estado };
        }));
    }, []);

    // Filtrar y ordenar items
    const filteredItems = useMemo(() => {
        let items = [...conteoItems];

        // Filtrar por búsqueda
        if (searchValue) {
            const search = searchValue.toLowerCase();
            items = items.filter(item =>
                item.producto.nombre.toLowerCase().includes(search) ||
                item.producto.codigo?.toLowerCase().includes(search)
            );
        }

        // Filtrar por estado
        if (estadoFilter !== 'todos') {
            items = items.filter(item => item.estado === estadoFilter);
        }

        // Ordenar
        if (sortBy === 'nombre') {
            items.sort((a, b) => a.producto.nombre.localeCompare(b.producto.nombre));
        } else if (sortBy === 'diferencia') {
            items.sort((a, b) => {
                const diffA = a.diferencia ?? 0;
                const diffB = b.diferencia ?? 0;
                return Math.abs(diffB) - Math.abs(diffA);
            });
        }

        return items;
    }, [conteoItems, searchValue, estadoFilter, sortBy]);

    // Estadísticas
    const stats = useMemo(() => {
        const total = conteoItems.length;
        const contados = conteoItems.filter(i => i.cantidadContada !== null).length;
        const correctos = conteoItems.filter(i => i.estado === 'correcto').length;
        const conDiferencia = conteoItems.filter(i => i.estado === 'diferencia').length;
        const pendientes = conteoItems.filter(i => i.estado === 'pendiente').length;
        const diferenciaTotal = conteoItems.reduce((acc, i) => acc + (i.diferencia ?? 0), 0);
        const valorDiferencia = conteoItems.reduce((acc, i) => {
            if (i.diferencia) return acc + (i.diferencia * i.producto.precio_venta);
            return acc;
        }, 0);

        return { total, contados, correctos, conDiferencia, pendientes, diferenciaTotal, valorDiferencia };
    }, [conteoItems]);

    // Exportar a Excel
    const exportarExcel = () => {
        const headers = ['Código', 'Producto', 'Stock Esperado', 'Cantidad Contada', 'Diferencia', 'Precio Venta', 'Valor Diferencia', 'Estado'];
        const rows = filteredItems.map(item => [
            item.producto.codigo || '',
            item.producto.nombre,
            item.stockEsperado,
            item.cantidadContada ?? '',
            item.diferencia ?? '',
            item.producto.precio_venta,
            item.diferencia ? item.diferencia * item.producto.precio_venta : '',
            item.estado === 'pendiente' ? 'Pendiente' : item.estado === 'correcto' ? 'Correcto' : 'Diferencia',
        ]);

        // Crear CSV
        const csvContent = [
            `Conteo Físico - Fecha de Corte: ${fechaCorte}`,
            '',
            headers.join(','),
            ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
            '',
            `Total productos: ${stats.total}`,
            `Contados: ${stats.contados}`,
            `Correctos: ${stats.correctos}`,
            `Con diferencia: ${stats.conDiferencia}`,
            `Diferencia total unidades: ${stats.diferenciaTotal}`,
            `Valor diferencia: ${stats.valorDiferencia}`,
        ].join('\n');

        // Descargar
        const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `conteo_fisico_${fechaCorte}.csv`;
        link.click();
        toast.success('Archivo exportado correctamente');
    };

    // Guardar ajustes
    const guardarAjustes = async () => {
        const itemsConDiferencia = conteoItems.filter(i => i.estado === 'diferencia' && i.diferencia !== null);

        if (itemsConDiferencia.length === 0) {
            toast.info('No hay diferencias para ajustar');
            return;
        }

        setIsSaving(true);
        try {
            if (!ubicacionId) {
                toast.error('Debe seleccionar una ubicación');
                return;
            }

            // Crear ajustes para cada diferencia
            for (const item of itemsConDiferencia) {
                if (item.diferencia === null || item.cantidadContada === null) continue;

                await inventarioApi.ajustar({
                    producto_id: item.producto.id,
                    ubicacion_id: ubicacionId,
                    cantidad_nueva: item.cantidadContada,
                    motivo: `Conteo físico ${fechaCorte} - Diferencia: ${item.diferencia}`,
                });
            }

            toast.success(`${itemsConDiferencia.length} ajustes realizados correctamente`);
            fetchProductos(); // Recargar productos
        } catch (error) {
            console.error('Error al guardar ajustes:', error);
            toast.error('Error al guardar los ajustes');
        } finally {
            setIsSaving(false);
        }
    };

    // Marcar todos como contados (igual al esperado)
    const marcarTodosCorrecto = () => {
        setConteoItems(prev => prev.map(item => ({
            ...item,
            cantidadContada: item.stockEsperado,
            diferencia: 0,
            estado: 'correcto' as const,
        })));
        toast.success('Todos los productos marcados como correctos');
    };

    // Reiniciar conteo
    const reiniciarConteo = () => {
        setConteoItems(prev => prev.map(item => ({
            ...item,
            cantidadContada: null,
            diferencia: null,
            estado: 'pendiente' as const,
        })));
        toast.info('Conteo reiniciado');
    };

    return (
        <div className="space-y-6">
            {/* Breadcrumb */}
            <div className="flex items-center text-sm text-gray-500">
                <Link href="/dashboard/inventario" className="hover:text-purple-600 transition-colors">
                    Inventario
                </Link>
                <ChevronRight className="w-4 h-4 mx-2" />
                <Link href="/dashboard/inventario/reportes" className="hover:text-purple-600 transition-colors">
                    Reportes
                </Link>
                <ChevronRight className="w-4 h-4 mx-2" />
                <span className="text-gray-900 dark:text-gray-100 font-medium">Conteo Físico</span>
            </div>

            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                        Conteo Físico de Inventario
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">
                        Compara el stock esperado con el conteo real
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2 bg-white dark:bg-gray-800 rounded-lg border px-3 py-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <input
                            type="date"
                            value={fechaCorte}
                            onChange={(e) => setFechaCorte(e.target.value)}
                            className="bg-transparent text-sm outline-none"
                        />
                    </div>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200">
                    <CardContent className="p-4">
                        <p className="text-xs text-blue-600 uppercase">Total</p>
                        <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">{stats.total}</p>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-purple-200">
                    <CardContent className="p-4">
                        <p className="text-xs text-purple-600 uppercase">Contados</p>
                        <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">{stats.contados}</p>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200">
                    <CardContent className="p-4">
                        <p className="text-xs text-green-600 uppercase">Correctos</p>
                        <p className="text-2xl font-bold text-green-900 dark:text-green-100">{stats.correctos}</p>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20 border-amber-200">
                    <CardContent className="p-4">
                        <p className="text-xs text-amber-600 uppercase">Pendientes</p>
                        <p className="text-2xl font-bold text-amber-900 dark:text-amber-100">{stats.pendientes}</p>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 border-red-200">
                    <CardContent className="p-4">
                        <p className="text-xs text-red-600 uppercase">Diferencias</p>
                        <p className="text-2xl font-bold text-red-900 dark:text-red-100">{stats.conDiferencia}</p>
                    </CardContent>
                </Card>
                <Card className={cn(
                    "border",
                    stats.valorDiferencia < 0
                        ? "bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 border-red-200"
                        : stats.valorDiferencia > 0
                            ? "bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200"
                            : "bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900/20 dark:to-gray-800/20 border-gray-200"
                )}>
                    <CardContent className="p-4">
                        <p className="text-xs text-gray-600 uppercase">Valor Dif.</p>
                        <p className={cn(
                            "text-lg font-bold",
                            stats.valorDiferencia < 0 ? "text-red-600" : stats.valorDiferencia > 0 ? "text-green-600" : "text-gray-600"
                        )}>
                            {formatPrecio(stats.valorDiferencia)}
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Toolbar */}
            <div className="bg-white dark:bg-gray-900 rounded-lg border p-4">
                <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                            placeholder="Buscar producto..."
                            value={searchValue}
                            onChange={(e) => setSearchValue(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <div className="flex items-center gap-2 bg-white dark:bg-gray-800 rounded-lg border px-3 py-2">
                            <span className="text-sm font-medium text-gray-500">Ubicación:</span>
                            <select
                                value={ubicacionId || ''}
                                onChange={(e) => setUbicacionId(Number(e.target.value))}
                                className="bg-transparent text-sm outline-none font-medium text-gray-900 dark:text-gray-100"
                            >
                                {ubicaciones.map(u => (
                                    <option key={u.id} value={u.id}>{u.nombre}</option>
                                ))}
                            </select>
                        </div>

                        <select
                            value={estadoFilter}
                            onChange={(e) => setEstadoFilter(e.target.value as typeof estadoFilter)}
                            className="px-3 py-2 text-sm border rounded-md bg-white dark:bg-gray-800"
                        >
                            <option value="todos">Todos los estados</option>
                            <option value="pendiente">Pendientes</option>
                            <option value="correcto">Correctos</option>
                            <option value="diferencia">Con diferencia</option>
                        </select>
                        <Button variant="outline" size="sm" onClick={() => setSortBy(sortBy === 'nombre' ? 'diferencia' : 'nombre')}>
                            <ArrowUpDown className="w-4 h-4 mr-1" />
                            {sortBy === 'nombre' ? 'Por nombre' : 'Por diferencia'}
                        </Button>
                        <Button variant="outline" size="sm" onClick={marcarTodosCorrecto}>
                            <CheckCircle2 className="w-4 h-4 mr-1" />
                            Todos correctos
                        </Button>
                        <Button variant="outline" size="sm" onClick={reiniciarConteo}>
                            <RefreshCw className="w-4 h-4 mr-1" />
                            Reiniciar
                        </Button>
                        <Button variant="outline" size="sm" onClick={exportarExcel}>
                            <FileSpreadsheet className="w-4 h-4 mr-1" />
                            Exportar Excel
                        </Button>
                        <Button
                            onClick={guardarAjustes}
                            disabled={isSaving || stats.conDiferencia === 0}
                            className="bg-gradient-to-r from-purple-600 to-pink-600"
                        >
                            {isSaving ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Save className="w-4 h-4 mr-1" />}
                            Guardar Ajustes ({stats.conDiferencia})
                        </Button>
                    </div>
                </div>
            </div>

            {/* Tabla de conteo */}
            <div className="bg-white dark:bg-gray-900 rounded-lg border overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 dark:bg-gray-800">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Producto</th>
                                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase w-32">Stock Esperado</th>
                                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase w-40">Cantidad Contada</th>
                                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase w-28">Diferencia</th>
                                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase w-28">Estado</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                            {loadingProductos ? (
                                <tr>
                                    <td colSpan={5} className="px-4 py-12 text-center">
                                        <Loader2 className="w-8 h-8 animate-spin text-purple-600 mx-auto" />
                                    </td>
                                </tr>
                            ) : filteredItems.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-4 py-12 text-center text-gray-500">
                                        No se encontraron productos
                                    </td>
                                </tr>
                            ) : (
                                filteredItems.map((item) => (
                                    <tr key={item.producto.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                                                    <Package className="w-5 h-5 text-purple-600" />
                                                </div>
                                                <div>
                                                    <p className="font-medium text-gray-900 dark:text-gray-100">{item.producto.nombre}</p>
                                                    <p className="text-xs text-gray-500">{item.producto.codigo || 'Sin código'}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <span className="font-semibold text-gray-900 dark:text-gray-100">{item.stockEsperado}</span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center justify-center gap-1">
                                                <button
                                                    onClick={() => actualizarConteo(item.producto.id, Math.max(0, (item.cantidadContada ?? item.stockEsperado) - 1))}
                                                    className="p-1 rounded bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700"
                                                >
                                                    <Minus className="w-4 h-4" />
                                                </button>
                                                <Input
                                                    type="number"
                                                    min="0"
                                                    value={item.cantidadContada ?? ''}
                                                    onChange={(e) => actualizarConteo(item.producto.id, e.target.value === '' ? null : parseInt(e.target.value))}
                                                    placeholder={String(item.stockEsperado)}
                                                    className="w-20 text-center font-semibold"
                                                />
                                                <button
                                                    onClick={() => actualizarConteo(item.producto.id, (item.cantidadContada ?? item.stockEsperado) + 1)}
                                                    className="p-1 rounded bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700"
                                                >
                                                    <Plus className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            {item.diferencia !== null && (
                                                <span className={cn(
                                                    'font-bold',
                                                    item.diferencia > 0 ? 'text-green-600' : item.diferencia < 0 ? 'text-red-600' : 'text-gray-500'
                                                )}>
                                                    {item.diferencia > 0 ? '+' : ''}{item.diferencia}
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            {item.estado === 'pendiente' && (
                                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                                                    <AlertTriangle className="w-3 h-3" />
                                                    Pendiente
                                                </span>
                                            )}
                                            {item.estado === 'correcto' && (
                                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                                                    <CheckCircle2 className="w-3 h-3" />
                                                    Correcto
                                                </span>
                                            )}
                                            {item.estado === 'diferencia' && (
                                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                                                    <XCircle className="w-3 h-3" />
                                                    Diferencia
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
