'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCajaStore } from '@/stores/cajaStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatPrecio } from '@/types/caja';
import {
    DollarSign,
    Lock,
    Loader2,
    ArrowLeft,
    AlertCircle,
} from 'lucide-react';
import Link from 'next/link';

export default function AbrirCajaPage() {
    const router = useRouter();
    const { abrirCaja, isLoading, error, clearError } = useCajaStore();

    const [montoApertura, setMontoApertura] = useState('');
    const [notas, setNotas] = useState('');
    const [localError, setLocalError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        clearError();
        setLocalError('');

        // Remover todo excepto números para obtener el valor real integer
        const rawValue = montoApertura.replace(/[^0-9]/g, '');
        const monto = parseInt(rawValue, 10);

        if (isNaN(monto) || monto < 0) {
            setLocalError('Por favor ingresa un monto válido');
            return;
        }

        try {
            await abrirCaja({
                monto_apertura: monto,
                notas: notas || undefined,
            });
            router.push('/dashboard/caja');
        } catch {
            // Error ya manejado por el store
        }
    };

    const formatInputMoney = (value: string) => {
        // Remover caracteres no numéricos
        const numericValue = value.replace(/[^0-9]/g, '');
        const number = parseInt(numericValue, 10);

        if (isNaN(number)) return '';

        return new Intl.NumberFormat('es-CO').format(number);
    };

    return (
        <div className="max-w-xl mx-auto">
            <div className="mb-6">
                <Link
                    href="/dashboard/caja"
                    className="flex items-center gap-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Volver a Caja
                </Link>
            </div>

            <Card className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-gray-800 dark:to-gray-900 border-emerald-200 dark:border-emerald-800">
                <CardHeader className="text-center pb-2">
                    <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center mb-4 shadow-lg">
                        <Lock className="w-8 h-8 text-white" />
                    </div>
                    <CardTitle className="text-2xl text-gray-900 dark:text-gray-100">
                        Abrir Caja
                    </CardTitle>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                        Registra el monto inicial para comenzar el día
                    </p>
                </CardHeader>
                <CardContent className="pt-6">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Monto de apertura */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Monto de Apertura
                            </label>
                            <div className="relative">
                                <div className="absolute left-3 top-1/2 -translate-y-1/2">
                                    <DollarSign className="w-5 h-5 text-gray-400" />
                                </div>
                                <input
                                    type="text"
                                    value={montoApertura}
                                    onChange={(e) => setMontoApertura(formatInputMoney(e.target.value))}
                                    placeholder="0"
                                    className="w-full pl-10 pr-16 py-4 text-2xl font-bold text-center bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                                />
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">
                                    COP
                                </div>
                            </div>
                            <p className="text-xs text-gray-500 mt-2 text-center">
                                Cuenta el efectivo en caja antes de abrir
                            </p>
                        </div>

                        {/* Notas */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Notas (opcional)
                            </label>
                            <textarea
                                value={notas}
                                onChange={(e) => setNotas(e.target.value)}
                                placeholder="Observaciones sobre la apertura..."
                                rows={3}
                                className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
                            />
                        </div>

                        {/* Error */}
                        {(error || localError) && (
                            <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-700 dark:text-red-400">
                                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                                <span className="text-sm">{error || localError}</span>
                            </div>
                        )}

                        {/* Preview */}
                        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                            <p className="text-sm text-gray-500 text-center mb-1">
                                Monto inicial de caja
                            </p>
                            <p className="text-3xl font-bold text-center text-emerald-600 dark:text-emerald-400">
                                {montoApertura ? formatPrecio(parseInt(montoApertura.replace(/[^0-9]/g, ''), 10)) : formatPrecio(0)}
                            </p>
                        </div>

                        {/* Botón */}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold rounded-xl hover:from-emerald-600 hover:to-teal-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Abriendo caja...
                                </>
                            ) : (
                                <>
                                    <Lock className="w-5 h-5" />
                                    Abrir Caja
                                </>
                            )}
                        </button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
