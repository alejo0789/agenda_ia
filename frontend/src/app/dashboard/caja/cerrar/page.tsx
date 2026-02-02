'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCajaStore, useVentasStore } from '@/stores/cajaStore';
import { CajaDetalle } from '@/types/caja';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatPrecio } from '@/types/caja';
import {
    DollarSign,
    LogOut,
    Loader2,
    ArrowLeft,
    AlertCircle,
    CheckCircle,
    TrendingUp,
    ShoppingCart,
    Receipt,
    ArrowUpCircle,
    ArrowDownCircle,
} from 'lucide-react';
import Link from 'next/link';
import { cajasApi } from '@/lib/api/caja';

export default function CerrarCajaPage() {
    const router = useRouter();
    const { cajaActual, fetchCajaActual, cerrarCaja, isLoading, error, clearError } = useCajaStore();
    const { ventasDia, fetchVentasDia } = useVentasStore();

    const [montoCierre, setMontoCierre] = useState('');
    const [notas, setNotas] = useState('');
    const [localError, setLocalError] = useState('');
    const [cuadre, setCuadre] = useState<{
        monto_apertura: number;
        total_ingresos: number;
        total_egresos: number;
        efectivo_teorico: number;
    } | null>(null);
    const [cierreResult, setCierreResult] = useState<CajaDetalle | null>(null);
    const [isLoadingCuadre, setIsLoadingCuadre] = useState(true);

    useEffect(() => {
        const cargarDatos = async () => {
            setIsLoadingCuadre(true);
            await fetchCajaActual();
            await fetchVentasDia();
            setIsLoadingCuadre(false);
        };

        cargarDatos();
    }, [fetchCajaActual, fetchVentasDia]);

    useEffect(() => {
        const cargarCuadre = async () => {
            if (cajaActual?.id) {
                try {
                    const c = await cajasApi.obtenerCuadre(cajaActual.id);
                    setCuadre(c);
                } catch (err) {
                    console.error('Error cargando cuadre:', err);
                }
            }
        };
        cargarCuadre();
    }, [cajaActual]);

    // Redirigir si no hay caja abierta
    useEffect(() => {
        if (!isLoadingCuadre && !cajaActual) {
            router.push('/dashboard/caja');
        }
    }, [cajaActual, isLoadingCuadre, router]);

    const efectivoTeorico = cuadre?.efectivo_teorico ?? cajaActual?.total_efectivo_teorico ?? 0;
    const montoIngresado = parseFloat(montoCierre.replace(/[^0-9.-]+/g, '')) || 0;

    // NOTA: No calculamos ni mostramos la diferencia aquí para mantener el "Cierre Ciego"

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        clearError();
        setLocalError('');

        if (!cajaActual) return;

        if (isNaN(montoIngresado) || montoIngresado < 0) {
            setLocalError('Por favor ingresa un monto válido');
            return;
        }

        try {
            const result = await cerrarCaja(cajaActual.id, {
                monto_cierre: montoIngresado,
                notas: notas || undefined,
            });
            setCierreResult(result);
        } catch {
            // Error ya manejado por el store
        }
    };

    const formatInputMoney = (value: string) => {
        const numericValue = value.replace(/[^0-9]/g, '');
        const number = parseInt(numericValue, 10);
        if (isNaN(number)) return '';
        return new Intl.NumberFormat('es-CO').format(number);
    };

    if (isLoadingCuadre) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
            </div>
        );
    }

    if (cierreResult) {
        return (
            <div className="max-w-md mx-auto pt-10">
                <Card className="bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800">
                    <CardContent className="pt-6 pb-6 text-center space-y-6">
                        <div className="mx-auto w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-800 flex items-center justify-center">
                            <CheckCircle className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
                        </div>

                        <div>
                            <h2 className="text-2xl font-bold text-emerald-800 dark:text-emerald-300">
                                ¡Caja Cerrada!
                            </h2>
                            <p className="text-emerald-600 dark:text-emerald-400 mt-1">
                                El cierre se ha registrado correctamente
                            </p>
                        </div>

                        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 space-y-3 shadow-sm border border-emerald-100 dark:border-emerald-900/50">
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-gray-500">Monto Esperado:</span>
                                <span className="font-semibold text-gray-900 dark:text-gray-100">
                                    {formatPrecio(cierreResult.total_efectivo_teorico)}
                                </span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-gray-500">Monto Ingresado:</span>
                                <span className="font-semibold text-gray-900 dark:text-gray-100">
                                    {formatPrecio(cierreResult.monto_cierre || 0)}
                                </span>
                            </div>
                            <div className="pt-2 border-t border-gray-100 dark:border-gray-700 flex justify-between items-center">
                                <span className="font-medium text-gray-700 dark:text-gray-300">Diferencia:</span>
                                <span className={`font-bold text-lg ${cierreResult.diferencia === 0 ? 'text-green-600' :
                                        cierreResult.diferencia > 0 ? 'text-blue-600' : 'text-red-600'
                                    }`}>
                                    {cierreResult.diferencia > 0 ? '+' : ''}
                                    {formatPrecio(cierreResult.diferencia)}
                                </span>
                            </div>
                        </div>

                        <button
                            onClick={() => router.push('/dashboard/caja')}
                            className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-colors"
                        >
                            Volver al Dashboard
                        </button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto">
            <div className="mb-6">
                <Link
                    href="/dashboard/caja"
                    className="flex items-center gap-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Volver a Caja
                </Link>
            </div>

            {/* Resumen del día */}
            <Card className="mb-6">
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Receipt className="w-5 h-5 text-emerald-600" />
                        Resumen del Día
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-4 text-center">
                            <TrendingUp className="w-6 h-6 text-emerald-600 mx-auto mb-2" />
                            <p className="text-xs text-gray-500 mb-1">Ventas</p>
                            <p className="font-bold text-emerald-700 dark:text-emerald-400">
                                {formatPrecio(ventasDia?.total_ventas ?? 0)}
                            </p>
                        </div>
                        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 text-center">
                            <ShoppingCart className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                            <p className="text-xs text-gray-500 mb-1">Facturas</p>
                            <p className="font-bold text-blue-700 dark:text-blue-400">
                                {ventasDia?.cantidad_facturas ?? 0}
                            </p>
                        </div>
                        <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 text-center">
                            <ArrowUpCircle className="w-6 h-6 text-green-600 mx-auto mb-2" />
                            <p className="text-xs text-gray-500 mb-1">Ingresos</p>
                            <p className="font-bold text-green-700 dark:text-green-400">
                                {formatPrecio(cuadre?.total_ingresos ?? 0)}
                            </p>
                        </div>
                        <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4 text-center">
                            <ArrowDownCircle className="w-6 h-6 text-red-600 mx-auto mb-2" />
                            <p className="text-xs text-gray-500 mb-1">Egresos</p>
                            <p className="font-bold text-red-700 dark:text-red-400">
                                {formatPrecio(cuadre?.total_egresos ?? 0)}
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Formulario de cierre */}
            <Card className="bg-gradient-to-br from-red-50 to-orange-50 dark:from-gray-800 dark:to-gray-900 border-red-200 dark:border-red-800">
                <CardHeader className="text-center pb-2">
                    <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center mb-4 shadow-lg">
                        <LogOut className="w-8 h-8 text-white" />
                    </div>
                    <CardTitle className="text-2xl text-gray-900 dark:text-gray-100">
                        Cerrar Caja
                    </CardTitle>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                        Caja: {cajaActual?.nombre} | Abierta: {cajaActual?.fecha_apertura ? new Date(cajaActual.fecha_apertura).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }) : ''}
                    </p>
                </CardHeader>
                <CardContent className="pt-6">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl mb-4 border border-blue-100 dark:border-blue-800">
                            <p className="text-sm text-blue-700 dark:text-blue-300 text-center">
                                Ingresa el dinero contado en caja. El sistema calculará la diferencia automáticamente al cerrar.
                            </p>
                        </div>

                        {/* Monto de cierre */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Efectivo Contado
                            </label>
                            <div className="relative">
                                <div className="absolute left-3 top-1/2 -translate-y-1/2">
                                    <DollarSign className="w-5 h-5 text-gray-400" />
                                </div>
                                <input
                                    type="text"
                                    value={montoCierre}
                                    onChange={(e) => setMontoCierre(formatInputMoney(e.target.value))}
                                    placeholder="0"
                                    className="w-full pl-10 pr-16 py-4 text-2xl font-bold text-center bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                                />
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">
                                    COP
                                </div>
                            </div>
                        </div>

                        {/* Notas */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Notas de Cierre (opcional)
                            </label>
                            <textarea
                                value={notas}
                                onChange={(e) => setNotas(e.target.value)}
                                placeholder="Observaciones sobre el cierre..."
                                rows={3}
                                className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                            />
                        </div>

                        {/* Error */}
                        {(error || localError) && (
                            <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-700 dark:text-red-400">
                                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                                <span className="text-sm">{error || localError}</span>
                            </div>
                        )}

                        {/* Botones */}
                        <div className="flex gap-3">
                            <Link
                                href="/dashboard/caja"
                                className="flex-1 py-4 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors font-medium text-center"
                            >
                                Cancelar
                            </Link>
                            <button
                                type="submit"
                                disabled={isLoading || !montoCierre}
                                className="flex-1 py-4 bg-gradient-to-r from-red-500 to-orange-500 text-white font-semibold rounded-xl hover:from-red-600 hover:to-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        Cerrando...
                                    </>
                                ) : (
                                    <>
                                        <LogOut className="w-5 h-5" />
                                        Cerrar Caja
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
