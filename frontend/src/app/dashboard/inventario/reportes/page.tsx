'use client';

import { useEffect, useState, useMemo } from 'react';
import { useProductoStore, useUbicacionStore } from '@/stores/inventarioStore';
import { inventarioApi } from '@/lib/api/inventario';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatPrecio, getStockStatus } from '@/types/inventario';
import Link from 'next/link';
import {
    ChevronRight,
    BarChart3,
    Package,
    Boxes,
    DollarSign,
    AlertTriangle,
    TrendingUp,
    MapPin,
    Loader2,
    RefreshCw,
    PackageX,
} from 'lucide-react';

interface ResumenUbicacion {
    ubicacion_id: number;
    ubicacion_nombre: string;
    total_productos: number;
    total_unidades: number;
    valor_al_costo: number;
    valor_al_precio_venta: number;
    productos_stock_bajo: number;
    productos_sin_stock: number;
}

export default function ReportesInventarioPage() {
    const { productos, fetchProductos, isLoading: loadingProductos } = useProductoStore();
    const { ubicaciones, fetchUbicaciones } = useUbicacionStore();
    const [resumenData, setResumenData] = useState<{ ubicaciones: ResumenUbicacion[]; totales: Record<string, number> } | null>(null);
    const [loadingResumen, setLoadingResumen] = useState(false);

    useEffect(() => {
        fetchProductos();
        fetchUbicaciones();
        loadResumen();
    }, [fetchProductos, fetchUbicaciones]);

    const loadResumen = async () => {
        setLoadingResumen(true);
        try {
            const data = await inventarioApi.getResumen();
            setResumenData(data as unknown as { ubicaciones: ResumenUbicacion[]; totales: Record<string, number> });
        } catch (err) {
            console.error('Error cargando resumen:', err);
        } finally {
            setLoadingResumen(false);
        }
    };

    // Estadísticas calculadas desde productos
    const stats = useMemo(() => {
        const activos = productos.filter(p => p.estado === 'activo');
        const stockBajo = activos.filter(p => {
            const stock = p.stock_total ?? 0;
            return getStockStatus(stock, p.stock_minimo) === 'bajo';
        });
        const sinStock = activos.filter(p => {
            const stock = p.stock_total ?? 0;
            return getStockStatus(stock, p.stock_minimo) === 'sin_stock';
        });
        const valorVenta = activos.reduce((acc, p) => acc + ((p.stock_total ?? 0) * p.precio_venta), 0);
        const valorCosto = activos.reduce((acc, p) => acc + ((p.stock_total ?? 0) * p.precio_compra), 0);
        const totalUnidades = activos.reduce((acc, p) => acc + (p.stock_total ?? 0), 0);

        return {
            totalProductos: activos.length,
            totalUnidades,
            valorVenta,
            valorCosto,
            gananciaEstimada: valorVenta - valorCosto,
            stockBajo: stockBajo.length,
            sinStock: sinStock.length,
            productosStockBajo: stockBajo.slice(0, 10),
            productosSinStock: sinStock.slice(0, 10),
        };
    }, [productos]);

    const isLoading = loadingProductos || loadingResumen;

    return (
        <div className="space-y-6">
            {/* Breadcrumb */}
            <div className="flex items-center text-sm text-gray-500">
                <Link href="/dashboard/inventario" className="hover:text-emerald-600 transition-colors">
                    Inventario
                </Link>
                <ChevronRight className="w-4 h-4 mx-2" />
                <span className="text-gray-900 dark:text-gray-100 font-medium">Reportes</span>
            </div>

            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                        Reportes de Inventario
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">
                        Resumen y análisis del inventario
                    </p>
                </div>
                <Button variant="outline" onClick={loadResumen} disabled={isLoading}>
                    <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                    Actualizar
                </Button>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-purple-200 dark:border-purple-800">
                    <CardContent className="p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-purple-600 dark:text-purple-400">Total Productos</p>
                                {isLoading ? (
                                    <Loader2 className="w-5 h-5 animate-spin text-purple-600 mt-1" />
                                ) : (
                                    <p className="text-3xl font-bold text-purple-900 dark:text-purple-100">{stats.totalProductos}</p>
                                )}
                            </div>
                            <div className="p-3 rounded-xl bg-purple-200 dark:bg-purple-800/50">
                                <Boxes className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-800">
                    <CardContent className="p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-blue-600 dark:text-blue-400">Total Unidades</p>
                                {isLoading ? (
                                    <Loader2 className="w-5 h-5 animate-spin text-blue-600 mt-1" />
                                ) : (
                                    <p className="text-3xl font-bold text-blue-900 dark:text-blue-100">{stats.totalUnidades.toLocaleString()}</p>
                                )}
                            </div>
                            <div className="p-3 rounded-xl bg-blue-200 dark:bg-blue-800/50">
                                <Package className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20 border-emerald-200 dark:border-emerald-800">
                    <CardContent className="p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-emerald-600 dark:text-emerald-400">Valor Inventario</p>
                                {isLoading ? (
                                    <Loader2 className="w-5 h-5 animate-spin text-emerald-600 mt-1" />
                                ) : (
                                    <p className="text-2xl font-bold text-emerald-900 dark:text-emerald-100">{formatPrecio(stats.valorVenta)}</p>
                                )}
                            </div>
                            <div className="p-3 rounded-xl bg-emerald-200 dark:bg-emerald-800/50">
                                <DollarSign className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-800">
                    <CardContent className="p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-green-600 dark:text-green-400">Ganancia Estimada</p>
                                {isLoading ? (
                                    <Loader2 className="w-5 h-5 animate-spin text-green-600 mt-1" />
                                ) : (
                                    <p className="text-2xl font-bold text-green-900 dark:text-green-100">{formatPrecio(stats.gananciaEstimada)}</p>
                                )}
                            </div>
                            <div className="p-3 rounded-xl bg-green-200 dark:bg-green-800/50">
                                <TrendingUp className="w-6 h-6 text-green-600 dark:text-green-400" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Ubicaciones y Alertas */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Resumen por Ubicación */}
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center gap-2 mb-4">
                            <MapPin className="w-5 h-5 text-blue-500" />
                            <h3 className="font-semibold text-gray-900 dark:text-gray-100">Inventario por Ubicación</h3>
                        </div>
                        {isLoading ? (
                            <div className="flex justify-center py-8">
                                <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                            </div>
                        ) : ubicaciones.length === 0 ? (
                            <p className="text-gray-500 text-center py-8">No hay ubicaciones configuradas</p>
                        ) : (
                            <div className="space-y-3">
                                {ubicaciones.map((ubicacion) => {
                                    const productosEnUbicacion = productos.filter(p => p.estado === 'activo');
                                    return (
                                        <div key={ubicacion.id} className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="font-medium text-gray-900 dark:text-gray-100">{ubicacion.nombre}</span>
                                                <span className="text-xs px-2 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">
                                                    {ubicacion.tipo}
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-500">{ubicacion.descripcion || 'Sin descripción'}</p>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Alertas de Stock */}
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <AlertTriangle className="w-5 h-5 text-amber-500" />
                                <h3 className="font-semibold text-gray-900 dark:text-gray-100">Alertas de Stock</h3>
                            </div>
                            <div className="flex gap-2">
                                <span className="text-xs px-2 py-1 rounded-full bg-amber-100 text-amber-700">
                                    {stats.stockBajo} bajo
                                </span>
                                <span className="text-xs px-2 py-1 rounded-full bg-red-100 text-red-700">
                                    {stats.sinStock} sin stock
                                </span>
                            </div>
                        </div>
                        {isLoading ? (
                            <div className="flex justify-center py-8">
                                <Loader2 className="w-6 h-6 animate-spin text-amber-600" />
                            </div>
                        ) : stats.productosSinStock.length === 0 && stats.productosStockBajo.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">
                                <Package className="w-12 h-12 mx-auto mb-2 opacity-30" />
                                <p>¡Excelente! No hay alertas de stock</p>
                            </div>
                        ) : (
                            <div className="space-y-2 max-h-64 overflow-y-auto">
                                {stats.productosSinStock.map((p) => (
                                    <div key={p.id} className="flex items-center justify-between p-3 rounded-lg bg-red-50 dark:bg-red-900/10">
                                        <div className="flex items-center gap-2">
                                            <PackageX className="w-4 h-4 text-red-500" />
                                            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{p.nombre}</span>
                                        </div>
                                        <span className="text-xs text-red-600 font-semibold">Sin stock</span>
                                    </div>
                                ))}
                                {stats.productosStockBajo.map((p) => (
                                    <div key={p.id} className="flex items-center justify-between p-3 rounded-lg bg-amber-50 dark:bg-amber-900/10">
                                        <div className="flex items-center gap-2">
                                            <AlertTriangle className="w-4 h-4 text-amber-500" />
                                            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{p.nombre}</span>
                                        </div>
                                        <span className="text-xs text-amber-600 font-semibold">
                                            {p.stock_total ?? 0} / {p.stock_minimo} min
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Análisis de Valor */}
            <Card>
                <CardContent className="p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <BarChart3 className="w-5 h-5 text-emerald-500" />
                        <h3 className="font-semibold text-gray-900 dark:text-gray-100">Análisis de Valor</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800">
                            <p className="text-sm text-gray-500 mb-1">Valor al Costo</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{formatPrecio(stats.valorCosto)}</p>
                        </div>
                        <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800">
                            <p className="text-sm text-gray-500 mb-1">Valor de Venta</p>
                            <p className="text-2xl font-bold text-emerald-600">{formatPrecio(stats.valorVenta)}</p>
                        </div>
                        <div className="p-4 rounded-lg bg-green-50 dark:bg-green-900/20">
                            <p className="text-sm text-green-600 mb-1">Margen Bruto</p>
                            <p className="text-2xl font-bold text-green-600">
                                {stats.valorCosto > 0 ? ((stats.gananciaEstimada / stats.valorCosto) * 100).toFixed(1) : 0}%
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
