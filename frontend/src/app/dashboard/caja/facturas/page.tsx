'use client';

import { useEffect, useState } from 'react';
import { useFacturaStore } from '@/stores/cajaStore';
import { Card, CardContent } from '@/components/ui/card';
import { formatPrecio, getEstadoFacturaColor } from '@/types/caja';
import type { Factura } from '@/types/caja';
import {
    Search,
    Filter,
    Receipt,
    Eye,
    XCircle,
    ArrowLeft,
    Loader2,
    Calendar,
    User,
    ChevronLeft,
    ChevronRight,
} from 'lucide-react';
import Link from 'next/link';

export default function FacturasPage() {
    const { facturas, fetchFacturas, totalFacturas, paginaActual, isLoading } = useFacturaStore();
    const [busqueda, setBusqueda] = useState('');
    const [filtroEstado, setFiltroEstado] = useState<'todos' | 'pagada' | 'pendiente' | 'anulada'>('todos');
    const [fechaDesde, setFechaDesde] = useState('');
    const [fechaHasta, setFechaHasta] = useState('');

    useEffect(() => {
        fetchFacturas({
            estado: filtroEstado === 'todos' ? undefined : filtroEstado,
            fecha_desde: fechaDesde || undefined,
            fecha_hasta: fechaHasta || undefined,
        });
    }, [filtroEstado, fechaDesde, fechaHasta, fetchFacturas]);

    const facturasFiltradas = facturas.filter(f =>
        f.numero_factura.toLowerCase().includes(busqueda.toLowerCase()) ||
        f.cliente_nombre?.toLowerCase().includes(busqueda.toLowerCase())
    );

    const totalPaginas = Math.ceil(totalFacturas / 20);

    const cambiarPagina = (nuevaPagina: number) => {
        fetchFacturas({
            estado: filtroEstado === 'todos' ? undefined : filtroEstado,
            fecha_desde: fechaDesde || undefined,
            fecha_hasta: fechaHasta || undefined,
            pagina: nuevaPagina,
        });
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link
                    href="/dashboard/caja"
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                        Historial de Facturas
                    </h1>
                    <p className="text-gray-500 text-sm">
                        {totalFacturas} facturas encontradas
                    </p>
                </div>
            </div>

            {/* Filtros */}
            <Card>
                <CardContent className="p-4">
                    <div className="flex flex-wrap gap-4">
                        {/* Búsqueda */}
                        <div className="flex-1 min-w-[200px]">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="text"
                                    value={busqueda}
                                    onChange={(e) => setBusqueda(e.target.value)}
                                    placeholder="Buscar por número o cliente..."
                                    className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                />
                            </div>
                        </div>

                        {/* Filtro estado */}
                        <div className="flex items-center gap-2">
                            <Filter className="w-4 h-4 text-gray-400" />
                            <select
                                value={filtroEstado}
                                onChange={(e) => setFiltroEstado(e.target.value as typeof filtroEstado)}
                                className="px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            >
                                <option value="todos">Todos los estados</option>
                                <option value="pagada">Pagadas</option>
                                <option value="pendiente">Pendientes</option>
                                <option value="anulada">Anuladas</option>
                            </select>
                        </div>

                        {/* Fechas */}
                        <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            <input
                                type="date"
                                value={fechaDesde}
                                onChange={(e) => setFechaDesde(e.target.value)}
                                className="px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            />
                            <span className="text-gray-400">-</span>
                            <input
                                type="date"
                                value={fechaHasta}
                                onChange={(e) => setFechaHasta(e.target.value)}
                                className="px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Lista de facturas */}
            {isLoading ? (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
                </div>
            ) : facturasFiltradas.length === 0 ? (
                <Card>
                    <CardContent className="p-12 text-center">
                        <Receipt className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                            No hay facturas
                        </h3>
                        <p className="text-gray-500">
                            No se encontraron facturas con los filtros aplicados
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-3">
                    {facturasFiltradas.map((factura) => (
                        <FacturaCard key={factura.id} factura={factura} />
                    ))}
                </div>
            )}

            {/* Paginación */}
            {totalPaginas > 1 && (
                <div className="flex items-center justify-center gap-4">
                    <button
                        onClick={() => cambiarPagina(paginaActual - 1)}
                        disabled={paginaActual <= 1}
                        className="p-2 border border-gray-200 dark:border-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-800"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <span className="text-sm text-gray-500">
                        Página {paginaActual} de {totalPaginas}
                    </span>
                    <button
                        onClick={() => cambiarPagina(paginaActual + 1)}
                        disabled={paginaActual >= totalPaginas}
                        className="p-2 border border-gray-200 dark:border-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-800"
                    >
                        <ChevronRight className="w-5 h-5" />
                    </button>
                </div>
            )}
        </div>
    );
}

function FacturaCard({ factura }: { factura: Factura }) {
    return (
        <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/20 flex items-center justify-center">
                            <Receipt className="w-6 h-6 text-emerald-600" />
                        </div>
                        <div>
                            <div className="flex items-center gap-3">
                                <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                                    {factura.numero_factura}
                                </h3>
                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getEstadoFacturaColor(factura.estado)}`}>
                                    {factura.estado.toUpperCase()}
                                </span>
                            </div>
                            <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                                <span className="flex items-center gap-1">
                                    <Calendar className="w-3.5 h-3.5" />
                                    {new Date(factura.fecha).toLocaleDateString('es-CO')}
                                </span>
                                {factura.cliente_nombre && (
                                    <span className="flex items-center gap-1">
                                        <User className="w-3.5 h-3.5" />
                                        {factura.cliente_nombre}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="text-right">
                            <p className="text-sm text-gray-500">Total</p>
                            <p className="text-lg font-bold text-emerald-600">
                                {formatPrecio(factura.total)}
                            </p>
                        </div>

                        <Link
                            href={`/dashboard/caja/facturas/${factura.id}`}
                            className="p-2 bg-gray-100 dark:bg-gray-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/20 rounded-lg transition-colors"
                        >
                            <Eye className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                        </Link>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
