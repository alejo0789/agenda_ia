'use client';

import { useEffect } from 'react';
import { useCajaStore } from '@/stores/cajaStore';
import { Card, CardContent } from '@/components/ui/card';
import { formatPrecio, getEstadoCajaColor } from '@/types/caja';
import type { Caja } from '@/types/caja';
import {
    ArrowLeft,
    Loader2,
    Calendar,
    User,
    DollarSign,
    Clock,
    CheckCircle,
    Eye,
} from 'lucide-react';
import Link from 'next/link';

export default function HistorialCajasPage() {
    const { cajas, fetchCajas, isLoading } = useCajaStore();

    useEffect(() => {
        fetchCajas('todos');
    }, [fetchCajas]);

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
                        Historial de Cajas
                    </h1>
                    <p className="text-gray-500 text-sm">
                        Registro de aperturas y cierres de caja
                    </p>
                </div>
            </div>

            {/* Lista */}
            {isLoading ? (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
                </div>
            ) : cajas.length === 0 ? (
                <Card>
                    <CardContent className="p-12 text-center">
                        <Clock className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                            No hay registros de caja
                        </h3>
                        <p className="text-gray-500">
                            Aún no se han abierto cajas en el sistema
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-3">
                    {cajas.map((caja) => (
                        <CajaCard key={caja.id} caja={caja} />
                    ))}
                </div>
            )}
        </div>
    );
}

function CajaCard({ caja }: { caja: Caja }) {
    const diferencia = caja.estado === 'cerrada' && caja.monto_cierre !== undefined
        ? caja.monto_cierre - caja.monto_apertura
        : null;

    return (
        <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${caja.estado === 'abierta'
                                ? 'bg-green-100 dark:bg-green-900/20'
                                : 'bg-gray-100 dark:bg-gray-800'
                            }`}>
                            {caja.estado === 'abierta' ? (
                                <DollarSign className="w-6 h-6 text-green-600" />
                            ) : (
                                <CheckCircle className="w-6 h-6 text-gray-500" />
                            )}
                        </div>
                        <div>
                            <div className="flex items-center gap-3">
                                <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                                    {caja.nombre}
                                </h3>
                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getEstadoCajaColor(caja.estado)}`}>
                                    {caja.estado.toUpperCase()}
                                </span>
                            </div>
                            <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                                <span className="flex items-center gap-1">
                                    <Calendar className="w-3.5 h-3.5" />
                                    {new Date(caja.fecha_apertura).toLocaleDateString('es-CO')}
                                </span>
                                <span>
                                    {new Date(caja.fecha_apertura).toLocaleTimeString('es-CO', {
                                        hour: '2-digit',
                                        minute: '2-digit',
                                    })}
                                    {caja.fecha_cierre && (
                                        <> - {new Date(caja.fecha_cierre).toLocaleTimeString('es-CO', {
                                            hour: '2-digit',
                                            minute: '2-digit',
                                        })}</>
                                    )}
                                </span>
                                {caja.usuario_apertura_nombre && (
                                    <span className="flex items-center gap-1">
                                        <User className="w-3.5 h-3.5" />
                                        {caja.usuario_apertura_nombre}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="text-right">
                            <p className="text-xs text-gray-500">Apertura</p>
                            <p className="font-medium text-gray-900 dark:text-gray-100">
                                {formatPrecio(caja.monto_apertura)}
                            </p>
                        </div>

                        {caja.estado === 'cerrada' && caja.monto_cierre !== undefined && (
                            <>
                                <div className="text-right">
                                    <p className="text-xs text-gray-500">Cierre</p>
                                    <p className="font-medium text-gray-900 dark:text-gray-100">
                                        {formatPrecio(caja.monto_cierre)}
                                    </p>
                                </div>

                                {diferencia !== null && (
                                    <div className="text-right">
                                        <p className="text-xs text-gray-500">Diferencia</p>
                                        <p className={`font-medium ${diferencia === 0
                                                ? 'text-green-600'
                                                : diferencia > 0
                                                    ? 'text-blue-600'
                                                    : 'text-red-600'
                                            }`}>
                                            {diferencia >= 0 ? '+' : ''}{formatPrecio(diferencia)}
                                        </p>
                                    </div>
                                )}
                            </>
                        )}

                        <Link
                            href={`/dashboard/caja/historial/${caja.id}`}
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
