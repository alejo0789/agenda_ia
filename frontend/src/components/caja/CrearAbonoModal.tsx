'use client';

import { useState, useEffect } from 'react';
import { X, Loader2, Wallet, CreditCard, Banknote, CheckCircle } from 'lucide-react';
import { abonosApi } from '@/lib/api/abonos';
import { metodosPagoApi } from '@/lib/api/caja';
import type { AbonoCreateDTO, Abono } from '@/types/abono';
import type { MetodoPago } from '@/types/caja';
import { formatPrecio } from '@/types/caja';
import { toast } from 'sonner';

interface CrearAbonoModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: (abono: Abono) => void;
    clienteId: number;
    clienteNombre: string;
    citaId?: number;
    montoSugerido?: number;
}

export default function CrearAbonoModal({
    isOpen,
    onClose,
    onSuccess,
    clienteId,
    clienteNombre,
    citaId,
    montoSugerido = 0
}: CrearAbonoModalProps) {
    const [monto, setMonto] = useState<string>(montoSugerido > 0 ? montoSugerido.toString() : '');
    const [metodoPagoId, setMetodoPagoId] = useState<number | null>(null);
    const [referencia, setReferencia] = useState('');
    const [concepto, setConcepto] = useState(citaId ? `Abono para cita #${citaId}` : '');
    const [metodosPago, setMetodosPago] = useState<MetodoPago[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingMetodos, setIsLoadingMetodos] = useState(true);
    const [success, setSuccess] = useState(false);

    // Cargar métodos de pago
    useEffect(() => {
        if (isOpen) {
            cargarMetodosPago();
            // Reset form
            setMonto(montoSugerido > 0 ? montoSugerido.toString() : '');
            setReferencia('');
            setConcepto(citaId ? `Abono para cita #${citaId}` : '');
            setSuccess(false);
        }
    }, [isOpen, montoSugerido, citaId]);

    const cargarMetodosPago = async () => {
        setIsLoadingMetodos(true);
        try {
            const metodos = await metodosPagoApi.listarMetodos(true);
            setMetodosPago(metodos);
            // Seleccionar efectivo por defecto
            const efectivo = metodos.find(m => m.nombre.toLowerCase() === 'efectivo');
            if (efectivo) {
                setMetodoPagoId(efectivo.id);
            } else if (metodos.length > 0) {
                setMetodoPagoId(metodos[0].id);
            }
        } catch (error) {
            console.error('Error cargando métodos de pago:', error);
            toast.error('Error al cargar métodos de pago');
        } finally {
            setIsLoadingMetodos(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const montoNum = parseFloat(monto);
        if (!montoNum || montoNum <= 0) {
            toast.error('El monto debe ser mayor a 0');
            return;
        }

        if (!metodoPagoId) {
            toast.error('Selecciona un método de pago');
            return;
        }

        setIsLoading(true);
        try {
            const data: AbonoCreateDTO = {
                cliente_id: clienteId,
                monto: montoNum,
                metodo_pago_id: metodoPagoId,
                referencia_pago: referencia || undefined,
                cita_id: citaId,
                concepto: concepto || undefined
            };

            const abono = await abonosApi.crear(data);
            setSuccess(true);
            toast.success(`Abono de ${formatPrecio(montoNum)} creado exitosamente`);

            setTimeout(() => {
                onSuccess?.(abono);
                onClose();
            }, 1500);
        } catch (error: any) {
            console.error('Error creando abono:', error);
            const msg = error.response?.data?.detail;
            toast.error(typeof msg === 'string' ? msg : 'Error al crear el abono');
        } finally {
            setIsLoading(false);
        }
    };

    const metodoSeleccionado = metodosPago.find(m => m.id === metodoPagoId);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Overlay */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
                {/* Header con gradiente */}
                <div className="bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-white/20 rounded-lg">
                                <Wallet className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-white">Registrar Abono</h2>
                                <p className="text-emerald-100 text-sm">{clienteNombre}</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                        >
                            <X className="w-5 h-5 text-white" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                {success ? (
                    <div className="p-8 text-center">
                        <div className="w-16 h-16 mx-auto mb-4 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center">
                            <CheckCircle className="w-8 h-8 text-emerald-500" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                            ¡Abono Registrado!
                        </h3>
                        <p className="text-gray-500">
                            El abono de <span className="font-semibold text-emerald-600">{formatPrecio(parseFloat(monto))}</span> ha sido registrado.
                        </p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="p-6 space-y-5">
                        {/* Monto */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Monto del Abono
                            </label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">$</span>
                                <input
                                    type="number"
                                    value={monto}
                                    onChange={(e) => setMonto(e.target.value)}
                                    placeholder="0"
                                    min="0"
                                    step="100"
                                    required
                                    className="w-full pl-8 pr-4 py-3 text-2xl font-bold text-center bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                />
                            </div>
                        </div>

                        {/* Métodos de pago */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Método de Pago
                            </label>
                            {isLoadingMetodos ? (
                                <div className="flex justify-center py-4">
                                    <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                                </div>
                            ) : (
                                <div className="grid grid-cols-3 gap-2">
                                    {metodosPago.map((metodo) => (
                                        <button
                                            key={metodo.id}
                                            type="button"
                                            onClick={() => setMetodoPagoId(metodo.id)}
                                            className={`
                                                p-3 rounded-xl border-2 transition-all text-center
                                                ${metodoPagoId === metodo.id
                                                    ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                                                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                                                }
                                            `}
                                        >
                                            <div className="flex flex-col items-center gap-1">
                                                {metodo.nombre.toLowerCase() === 'efectivo' ? (
                                                    <Banknote className={`w-5 h-5 ${metodoPagoId === metodo.id ? 'text-emerald-600' : 'text-gray-400'}`} />
                                                ) : (
                                                    <CreditCard className={`w-5 h-5 ${metodoPagoId === metodo.id ? 'text-emerald-600' : 'text-gray-400'}`} />
                                                )}
                                                <span className={`text-xs font-medium ${metodoPagoId === metodo.id ? 'text-emerald-600' : 'text-gray-600 dark:text-gray-400'}`}>
                                                    {metodo.nombre}
                                                </span>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Referencia (si el método lo requiere) */}
                        {metodoSeleccionado?.requiere_referencia && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Referencia de Pago
                                </label>
                                <input
                                    type="text"
                                    value={referencia}
                                    onChange={(e) => setReferencia(e.target.value)}
                                    placeholder="Número de transacción"
                                    required
                                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                />
                            </div>
                        )}

                        {/* Concepto */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Concepto (opcional)
                            </label>
                            <input
                                type="text"
                                value={concepto}
                                onChange={(e) => setConcepto(e.target.value)}
                                placeholder="Ej: Abono para tratamiento"
                                className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            />
                        </div>

                        {/* Botones */}
                        <div className="flex gap-3 pt-2">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 py-3 px-4 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors font-medium"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                disabled={isLoading || !monto || parseFloat(monto) <= 0 || !metodoPagoId}
                                className="flex-1 py-3 px-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl hover:from-emerald-600 hover:to-teal-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium flex items-center justify-center gap-2"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Procesando...
                                    </>
                                ) : (
                                    <>
                                        <Wallet className="w-4 h-4" />
                                        Registrar Abono
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}
