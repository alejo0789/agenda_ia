'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useCajaStore, useFacturaStore } from '@/stores/cajaStore';
import { CajaDetalle, MovimientoCaja, Factura } from '@/types/caja';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatPrecio, getEstadoCajaColor, getEstadoFacturaColor } from '@/types/caja';
import {
    DollarSign,
    Loader2,
    ArrowLeft,
    Calendar,
    User,
    TrendingUp,
    ArrowUpCircle,
    ArrowDownCircle,
    Receipt,
    History,
    FileText,
    Info,
    CheckCircle,
    XCircle,
    ShoppingBag
} from 'lucide-react';
import Link from 'next/link';
import { cajasApi, facturasApi } from '@/lib/api/caja';

export default function CajaDetailPage() {
    const { id } = useParams();
    const router = useRouter();
    const cajaId = Number(id);

    const [caja, setCaja] = useState<CajaDetalle | null>(null);
    const [movimientos, setMovimientos] = useState<MovimientoCaja[]>([]);
    const [facturas, setFacturas] = useState<Factura[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const cargarDatos = async () => {
            if (!cajaId) return;
            setIsLoading(true);
            setError(null);
            try {
                const [cajaData, movsData, factsData] = await Promise.all([
                    cajasApi.obtenerCaja(cajaId),
                    cajasApi.listarMovimientos(cajaId),
                    facturasApi.listarFacturas({ caja_id: cajaId, por_pagina: 100 })
                ]);
                setCaja(cajaData);
                setMovimientos(movsData);
                setFacturas(factsData.items);
            } catch (err) {
                console.error('Error cargando detalle de caja:', err);
                setError('No se pudo cargar la información de la caja.');
            } finally {
                setIsLoading(false);
            }
        };

        cargarDatos();
    }, [cajaId]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
            </div>
        );
    }

    if (error || !caja) {
        return (
            <div className="max-w-md mx-auto pt-12 text-center">
                <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">Error</h2>
                <p className="text-gray-500 mb-6">{error || 'Caja no encontrada'}</p>
                <Link
                    href="/dashboard/caja/historial"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Volver al Historial
                </Link>
            </div>
        );
    }

    const diferencia = caja.monto_cierre !== undefined
        ? caja.monto_cierre - (caja.total_efectivo_teorico || 0)
        : null;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Link
                        href="/dashboard/caja/historial"
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                                {caja.nombre}
                            </h1>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getEstadoCajaColor(caja.estado)}`}>
                                {caja.estado.toUpperCase()}
                            </span>
                        </div>
                        <p className="text-gray-500 text-sm flex items-center gap-2 mt-1">
                            <Calendar className="w-4 h-4" />
                            {new Date(caja.fecha_apertura).toLocaleDateString('es-CO', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                            })}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="text-right hidden md:block">
                        <p className="text-xs text-gray-500">ID de Caja</p>
                        <p className="font-mono text-sm font-medium">#{caja.id}</p>
                    </div>
                </div>
            </div>

            {/* Grid de Resumen Financiero */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="bg-emerald-50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/50">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium uppercase tracking-wider">Apertura (Base)</p>
                                <p className="text-xl font-bold text-emerald-900 dark:text-emerald-100 mt-1">
                                    {formatPrecio(caja.monto_apertura)}
                                </p>
                            </div>
                            <div className="p-2 bg-emerald-100 dark:bg-emerald-900/40 rounded-lg">
                                <DollarSign className="w-5 h-5 text-emerald-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-100 dark:border-blue-900/50">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs text-blue-600 dark:text-blue-400 font-medium uppercase tracking-wider">Efectivo Esperado</p>
                                <p className="text-xl font-bold text-blue-900 dark:text-blue-100 mt-1">
                                    {formatPrecio(caja.total_efectivo_teorico || 0)}
                                </p>
                            </div>
                            <div className="p-2 bg-blue-100 dark:bg-blue-900/40 rounded-lg">
                                <TrendingUp className="w-5 h-5 text-blue-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {caja.estado === 'cerrada' && (
                    <>
                        <Card className="bg-purple-50 dark:bg-purple-950/20 border-purple-100 dark:border-purple-900/50">
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-xs text-purple-600 dark:text-purple-400 font-medium uppercase tracking-wider">Efectivo Real (Cierre)</p>
                                        <p className="text-xl font-bold text-purple-900 dark:text-purple-100 mt-1">
                                            {formatPrecio(caja.monto_cierre || 0)}
                                        </p>
                                    </div>
                                    <div className="p-2 bg-purple-100 dark:bg-purple-900/40 rounded-lg">
                                        <CheckCircle className="w-5 h-5 text-purple-600" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className={`${(diferencia || 0) >= 0 ? 'bg-amber-50 dark:bg-amber-950/20 border-amber-100' : 'bg-rose-50 dark:bg-rose-950/20 border-rose-100'} border dark:border-amber-900/50`}>
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className={`text-xs font-medium uppercase tracking-wider ${(diferencia || 0) >= 0 ? 'text-amber-600' : 'text-rose-600'}`}>Diferencia</p>
                                        <p className={`text-xl font-bold mt-1 ${(diferencia || 0) === 0 ? 'text-gray-500' : (diferencia || 0) > 0 ? 'text-amber-700' : 'text-rose-700'}`}>
                                            {(diferencia || 0) > 0 ? '+' : ''}{formatPrecio(diferencia || 0)}
                                        </p>
                                    </div>
                                    <div className={`p-2 rounded-lg ${(diferencia || 0) >= 0 ? 'bg-amber-100 dark:bg-amber-900/40' : 'bg-rose-100 dark:bg-rose-900/40'}`}>
                                        <Info className={`w-5 h-5 ${(diferencia || 0) >= 0 ? 'text-amber-600' : 'text-rose-600'}`} />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Columna Izquierda: Información y Movimientos */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Información de Sesión */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-semibold flex items-center gap-2">
                                <Info className="w-4 h-4 text-emerald-600" />
                                Información de la Sesión
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-3">
                                <div className="flex items-center justify-between py-2 border-b border-gray-50 dark:border-gray-800">
                                    <span className="text-sm text-gray-500">Usuario Apertura:</span>
                                    <span className="text-sm font-medium flex items-center gap-2">
                                        <User className="w-3.5 h-3.5" />
                                        {caja.usuario_apertura_nombre || 'N/A'}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between py-2 border-b border-gray-50 dark:border-gray-800">
                                    <span className="text-sm text-gray-500">Fecha Apertura:</span>
                                    <span className="text-sm font-medium">
                                        {new Date(caja.fecha_apertura).toLocaleString('es-CO')}
                                    </span>
                                </div>
                            </div>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between py-2 border-b border-gray-50 dark:border-gray-800">
                                    <span className="text-sm text-gray-500">Usuario Cierre:</span>
                                    <span className="text-sm font-medium flex items-center gap-2">
                                        {caja.usuario_cierre_nombre ? (
                                            <>
                                                <User className="w-3.5 h-3.5" />
                                                {caja.usuario_cierre_nombre}
                                            </>
                                        ) : 'Aún abierta'}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between py-2 border-b border-gray-50 dark:border-gray-800">
                                    <span className="text-sm text-gray-500">Fecha Cierre:</span>
                                    <span className="text-sm font-medium">
                                        {caja.fecha_cierre ? new Date(caja.fecha_cierre).toLocaleString('es-CO') : '---'}
                                    </span>
                                </div>
                            </div>
                            {caja.notas && (
                                <div className="col-span-full mt-2 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                                    <p className="text-xs text-gray-500 mb-1 uppercase tracking-wider font-semibold">Notas de la caja:</p>
                                    <p className="text-sm text-gray-700 dark:text-gray-300 italic">"{caja.notas}"</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Lista de Movimientos */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-semibold flex items-center gap-2">
                                <History className="w-4 h-4 text-emerald-600" />
                                Movimientos de Caja
                            </CardTitle>
                            <span className="text-xs font-medium px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
                                {movimientos.length} movimientos
                            </span>
                        </CardHeader>
                        <CardContent>
                            {movimientos.length === 0 ? (
                                <div className="py-8 text-center">
                                    <p className="text-gray-500 text-sm">No hay movimientos registrados en esta sesión.</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm text-left">
                                        <thead>
                                            <tr className="border-b border-gray-100 dark:border-gray-800">
                                                <th className="py-3 font-semibold text-gray-500">Concepto</th>
                                                <th className="py-3 font-semibold text-gray-500">Tipo</th>
                                                <th className="py-3 font-semibold text-gray-500 text-right">Monto</th>
                                                <th className="py-3 font-semibold text-gray-500 text-right">Fecha</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                                            {movimientos.map((mov) => (
                                                <tr key={mov.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50">
                                                    <td className="py-3 font-medium">{mov.concepto}</td>
                                                    <td className="py-3">
                                                        <span className={`flex items-center gap-1 w-fit px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${mov.tipo === 'ingreso' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                                            }`}>
                                                            {mov.tipo === 'ingreso' ? <ArrowUpCircle className="w-3 h-3" /> : <ArrowDownCircle className="w-3 h-3" />}
                                                            {mov.tipo}
                                                        </span>
                                                    </td>
                                                    <td className={`py-3 text-right font-bold ${mov.tipo === 'ingreso' ? 'text-green-600' : 'text-red-600'}`}>
                                                        {mov.tipo === 'egreso' ? '-' : ''}{formatPrecio(mov.monto)}
                                                    </td>
                                                    <td className="py-3 text-right text-gray-500 text-xs">
                                                        {new Date(mov.fecha).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Columna Derecha: Facturas */}
                <div className="space-y-6">
                    <Card className="h-full">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-semibold flex items-center gap-2">
                                <Receipt className="w-4 h-4 text-emerald-600" />
                                Facturas Emitidas
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {facturas.length === 0 ? (
                                <div className="py-8 text-center">
                                    <ShoppingBag className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                                    <p className="text-gray-500 text-sm">No se emitieron facturas en esta sesión.</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {facturas.map((fac) => (
                                        <Link
                                            key={fac.id}
                                            href={`/dashboard/caja/facturas/${fac.id}`}
                                            className="block p-3 border border-gray-100 dark:border-gray-800 rounded-xl hover:border-emerald-200 dark:hover:border-emerald-800 hover:bg-emerald-50/30 transition-all group"
                                        >
                                            <div className="flex justify-between items-start mb-1">
                                                <span className="font-bold text-sm group-hover:text-emerald-600 transition-colors">
                                                    {fac.numero_factura}
                                                </span>
                                                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold uppercase ${getEstadoFacturaColor(fac.estado)}`}>
                                                    {fac.estado}
                                                </span>
                                            </div>
                                            <div className="flex justify-between items-end">
                                                <div className="text-[11px] text-gray-500 truncate max-w-[120px]">
                                                    {fac.cliente_nombre || 'Cliente Final'}
                                                </div>
                                                <div className="font-bold text-sm text-gray-900 dark:text-gray-100">
                                                    {formatPrecio(fac.total)}
                                                </div>
                                            </div>
                                        </Link>
                                    ))}
                                    {facturas.length >= 20 && (
                                        <Link
                                            href={`/dashboard/caja/facturas?caja_id=${cajaId}`}
                                            className="block text-center text-xs text-emerald-600 hover:underline pt-2"
                                        >
                                            Ver todas las facturas
                                        </Link>
                                    )}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
