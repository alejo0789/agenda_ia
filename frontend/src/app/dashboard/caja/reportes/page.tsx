'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatPrecio } from '@/types/caja';
import type { VentasDia, VentasPorMetodoPago, ResumenComisiones } from '@/types/caja';
import { ventasApi, comisionesApi } from '@/lib/api/caja';
import {
    BarChart3,
    TrendingUp,
    DollarSign,
    CreditCard,
    Scissors,
    Package,
    ArrowLeft,
    Loader2,
    Calendar,
    Users,
} from 'lucide-react';
import Link from 'next/link';

export default function ReportesPage() {
    const [isLoading, setIsLoading] = useState(true);
    const [fechaDesde, setFechaDesde] = useState(() => {
        const d = new Date();
        d.setDate(1);
        return d.toISOString().split('T')[0];
    });
    const [fechaHasta, setFechaHasta] = useState(() => {
        return new Date().toISOString().split('T')[0];
    });

    const [ventasPeriodo, setVentasPeriodo] = useState<VentasDia[]>([]);
    const [ventasMetodo, setVentasMetodo] = useState<VentasPorMetodoPago[]>([]);
    const [comisiones, setComisiones] = useState<ResumenComisiones | null>(null);

    useEffect(() => {
        const cargarDatos = async () => {
            setIsLoading(true);
            try {
                const [ventas, metodos, comis] = await Promise.all([
                    ventasApi.ventasPeriodo(fechaDesde, fechaHasta),
                    ventasApi.ventasPorMetodoPago(fechaDesde, fechaHasta),
                    comisionesApi.resumenComisiones(fechaDesde, fechaHasta),
                ]);
                setVentasPeriodo(ventas);
                setVentasMetodo(metodos);
                setComisiones(comis);
            } catch (err) {
                console.error('Error cargando reportes:', err);
            } finally {
                setIsLoading(false);
            }
        };

        cargarDatos();
    }, [fechaDesde, fechaHasta]);

    // Calcular totales
    const totales = ventasPeriodo.reduce((acc, v) => ({
        ventas: acc.ventas + v.total_ventas,
        servicios: acc.servicios + v.total_servicios,
        productos: acc.productos + v.total_productos,
        facturas: acc.facturas + v.cantidad_facturas,
    }), { ventas: 0, servicios: 0, productos: 0, facturas: 0 });

    const maxVenta = Math.max(...ventasPeriodo.map(v => v.total_ventas), 1);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link
                        href="/dashboard/caja"
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                            Reportes de Ventas
                        </h1>
                        <p className="text-gray-500 text-sm">
                            Análisis de ventas y comisiones
                        </p>
                    </div>
                </div>

                {/* Filtro de fechas */}
                <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <input
                        type="date"
                        value={fechaDesde}
                        onChange={(e) => setFechaDesde(e.target.value)}
                        className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    <span className="text-gray-400">-</span>
                    <input
                        type="date"
                        value={fechaHasta}
                        onChange={(e) => setFechaHasta(e.target.value)}
                        className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                </div>
            </div>

            {isLoading ? (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
                </div>
            ) : (
                <>
                    {/* Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20 border-emerald-200 dark:border-emerald-800">
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-xs text-emerald-600 uppercase tracking-wide">Total Ventas</p>
                                        <p className="text-xl font-bold text-emerald-900 dark:text-emerald-100">
                                            {formatPrecio(totales.ventas)}
                                        </p>
                                    </div>
                                    <div className="p-2.5 rounded-lg bg-emerald-200 dark:bg-emerald-800/50">
                                        <DollarSign className="w-5 h-5 text-emerald-600" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-800">
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-xs text-blue-600 uppercase tracking-wide">Servicios</p>
                                        <p className="text-xl font-bold text-blue-900 dark:text-blue-100">
                                            {formatPrecio(totales.servicios)}
                                        </p>
                                    </div>
                                    <div className="p-2.5 rounded-lg bg-blue-200 dark:bg-blue-800/50">
                                        <Scissors className="w-5 h-5 text-blue-600" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-purple-200 dark:border-purple-800">
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-xs text-purple-600 uppercase tracking-wide">Productos</p>
                                        <p className="text-xl font-bold text-purple-900 dark:text-purple-100">
                                            {formatPrecio(totales.productos)}
                                        </p>
                                    </div>
                                    <div className="p-2.5 rounded-lg bg-purple-200 dark:bg-purple-800/50">
                                        <Package className="w-5 h-5 text-purple-600" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20 border-amber-200 dark:border-amber-800">
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-xs text-amber-600 uppercase tracking-wide">Comisiones</p>
                                        <p className="text-xl font-bold text-amber-900 dark:text-amber-100">
                                            {formatPrecio(comisiones?.total_general ?? 0)}
                                        </p>
                                    </div>
                                    <div className="p-2.5 rounded-lg bg-amber-200 dark:bg-amber-800/50">
                                        <Users className="w-5 h-5 text-amber-600" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Gráfico de ventas */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <BarChart3 className="w-5 h-5 text-emerald-600" />
                                    Ventas por Día
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {ventasPeriodo.length === 0 ? (
                                    <p className="text-center py-8 text-gray-500">No hay datos para este período</p>
                                ) : (
                                    <div className="space-y-2">
                                        {ventasPeriodo.slice(-10).map((dia) => (
                                            <div key={dia.fecha} className="flex items-center gap-3">
                                                <span className="text-xs text-gray-500 w-16">
                                                    {new Date(dia.fecha).toLocaleDateString('es-CO', {
                                                        day: '2-digit',
                                                        month: 'short',
                                                    })}
                                                </span>
                                                <div className="flex-1 h-6 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full"
                                                        style={{ width: `${(dia.total_ventas / maxVenta) * 100}%` }}
                                                    />
                                                </div>
                                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300 w-24 text-right">
                                                    {formatPrecio(dia.total_ventas)}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Ventas por método de pago */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <CreditCard className="w-5 h-5 text-blue-600" />
                                    Por Método de Pago
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {ventasMetodo.length === 0 ? (
                                    <p className="text-center py-8 text-gray-500">No hay datos para este período</p>
                                ) : (
                                    <div className="space-y-3">
                                        {ventasMetodo.map((metodo, index) => {
                                            const colors = [
                                                'bg-emerald-500',
                                                'bg-blue-500',
                                                'bg-purple-500',
                                                'bg-amber-500',
                                                'bg-pink-500',
                                            ];
                                            const totalMetodos = ventasMetodo.reduce((acc, m) => acc + m.total, 0);
                                            const porcentaje = totalMetodos > 0 ? (metodo.total / totalMetodos) * 100 : 0;

                                            return (
                                                <div key={metodo.metodo_pago_id} className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-3 h-3 rounded-full ${colors[index % colors.length]}`} />
                                                        <span className="text-gray-700 dark:text-gray-300">
                                                            {metodo.metodo_pago_nombre}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-4">
                                                        <span className="text-sm text-gray-500">
                                                            {porcentaje.toFixed(1)}%
                                                        </span>
                                                        <span className="font-semibold text-gray-900 dark:text-gray-100">
                                                            {formatPrecio(metodo.total)}
                                                        </span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Comisiones por especialista */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Users className="w-5 h-5 text-amber-600" />
                                Comisiones por Especialista
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {!comisiones || comisiones.detalle_por_especialista.filter(e => e.cantidad_items > 0).length === 0 ? (
                                <p className="text-center py-8 text-gray-500">No hay comisiones en este período</p>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="border-b border-gray-200 dark:border-gray-700">
                                                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Especialista</th>
                                                <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Servicios</th>
                                                <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Productos</th>
                                                <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Total Comisión</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {comisiones.detalle_por_especialista
                                                .filter(e => e.cantidad_items > 0)
                                                .map((esp) => (
                                                    <tr key={esp.especialista_id} className="border-b border-gray-100 dark:border-gray-800">
                                                        <td className="py-3 px-4 font-medium text-gray-900 dark:text-gray-100">
                                                            {esp.especialista_nombre}
                                                        </td>
                                                        <td className="py-3 px-4 text-right text-gray-600 dark:text-gray-400">
                                                            {formatPrecio(esp.total_servicios)}
                                                        </td>
                                                        <td className="py-3 px-4 text-right text-gray-600 dark:text-gray-400">
                                                            {formatPrecio(esp.total_productos)}
                                                        </td>
                                                        <td className="py-3 px-4 text-right font-bold text-emerald-600">
                                                            {formatPrecio(esp.total_comision)}
                                                        </td>
                                                    </tr>
                                                ))}
                                        </tbody>
                                        <tfoot>
                                            <tr className="bg-gray-50 dark:bg-gray-800">
                                                <td className="py-3 px-4 font-bold text-gray-900 dark:text-gray-100">
                                                    Total
                                                </td>
                                                <td className="py-3 px-4 text-right font-medium text-gray-600 dark:text-gray-400">
                                                    {formatPrecio(comisiones.detalle_por_especialista.reduce((acc, e) => acc + e.total_servicios, 0))}
                                                </td>
                                                <td className="py-3 px-4 text-right font-medium text-gray-600 dark:text-gray-400">
                                                    {formatPrecio(comisiones.detalle_por_especialista.reduce((acc, e) => acc + e.total_productos, 0))}
                                                </td>
                                                <td className="py-3 px-4 text-right font-bold text-emerald-600">
                                                    {formatPrecio(comisiones.total_general)}
                                                </td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </>
            )}
        </div>
    );
}
