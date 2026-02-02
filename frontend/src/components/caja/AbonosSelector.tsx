'use client';

import { useState, useEffect } from 'react';
import { Wallet, ChevronDown, ChevronUp, Check, Loader2, Plus, Gift } from 'lucide-react';
import { abonosApi } from '@/lib/api/abonos';
import type { AbonosClienteFactura, AbonoParaFactura } from '@/types/abono';
import type { AbonoAplicarCreate } from '@/types/caja';
import { formatPrecio } from '@/types/caja';
import { toast } from 'sonner';

interface AbonosSelectorProps {
    clienteId: number | null;
    onAbonosChange: (abonos: AbonoAplicarCreate[]) => void;
    totalFactura: number;
    className?: string;
}

export default function AbonosSelector({
    clienteId,
    onAbonosChange,
    totalFactura,
    className = ''
}: AbonosSelectorProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [abonosData, setAbonosData] = useState<AbonosClienteFactura | null>(null);
    const [abonosSeleccionados, setAbonosSeleccionados] = useState<Map<number, number>>(new Map());

    // Cargar abonos cuando cambia el cliente
    useEffect(() => {
        if (clienteId) {
            cargarAbonos();
        } else {
            setAbonosData(null);
            setAbonosSeleccionados(new Map());
            onAbonosChange([]);
        }
    }, [clienteId]);

    // Notificar cambios al padre
    useEffect(() => {
        const abonos: AbonoAplicarCreate[] = [];
        abonosSeleccionados.forEach((monto, abonoId) => {
            if (monto > 0) {
                abonos.push({ abono_id: abonoId, monto });
            }
        });
        onAbonosChange(abonos);
    }, [abonosSeleccionados]);

    const cargarAbonos = async () => {
        if (!clienteId) return;

        setIsLoading(true);
        try {
            const data = await abonosApi.obtenerParaFactura(clienteId);
            setAbonosData(data);

            // Auto-expandir si hay abonos disponibles
            if (data.abonos.length > 0) {
                setIsExpanded(true);
            }
        } catch (error) {
            console.error('Error cargando abonos:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const toggleAbono = (abono: AbonoParaFactura) => {
        const nuevoMapa = new Map(abonosSeleccionados);

        if (nuevoMapa.has(abono.id)) {
            // Deseleccionar
            nuevoMapa.delete(abono.id);
        } else {
            // Seleccionar - usar el saldo disponible o lo que falte para completar el total
            const totalAbonosActuales = Array.from(nuevoMapa.values()).reduce((a, b) => a + b, 0);
            const faltante = totalFactura - totalAbonosActuales;
            const montoAplicar = Math.min(abono.saldo_disponible, Math.max(0, faltante));

            if (montoAplicar > 0) {
                nuevoMapa.set(abono.id, montoAplicar);
            }
        }

        setAbonosSeleccionados(nuevoMapa);
    };

    const aplicarTodosLosAbonos = () => {
        if (!abonosData) return;

        const nuevoMapa = new Map<number, number>();
        let restante = totalFactura;

        for (const abono of abonosData.abonos) {
            if (restante <= 0) break;

            const montoAplicar = Math.min(abono.saldo_disponible, restante);
            if (montoAplicar > 0) {
                nuevoMapa.set(abono.id, montoAplicar);
                restante -= montoAplicar;
            }
        }

        setAbonosSeleccionados(nuevoMapa);

        if (restante <= 0) {
            toast.success('Abonos aplicados para cubrir el total');
        }
    };

    const totalAbonosAplicados = Array.from(abonosSeleccionados.values()).reduce((a, b) => a + b, 0);

    // No mostrar si no hay cliente
    if (!clienteId) return null;

    // No mostrar si está cargando o no hay abonos
    if (isLoading) {
        return (
            <div className={`flex items-center gap-2 text-gray-400 text-sm ${className}`}>
                <Loader2 className="w-4 h-4 animate-spin" />
                Verificando abonos...
            </div>
        );
    }

    if (!abonosData || abonosData.abonos.length === 0) {
        return null;
    }

    return (
        <div className={`bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg border border-purple-200 dark:border-purple-800 overflow-hidden ${className}`}>
            {/* Header colapsable */}
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full px-3 py-2 flex items-center justify-between hover:bg-white/50 dark:hover:bg-gray-800/30 transition-colors"
            >
                <div className="flex items-center gap-2">
                    <Gift className="w-4 h-4 text-purple-500" />
                    <span className="font-medium text-purple-700 dark:text-purple-300 text-sm">
                        Abonos disponibles
                    </span>
                    <span className="px-2 py-0.5 bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 text-xs font-bold rounded-full">
                        {formatPrecio(abonosData.saldo_total_disponible)}
                    </span>
                </div>
                {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-purple-500" />
                ) : (
                    <ChevronDown className="w-4 h-4 text-purple-500" />
                )}
            </button>

            {/* Contenido expandible */}
            {isExpanded && (
                <div className="px-3 pb-3 space-y-2">
                    {/* Botón aplicar todos */}
                    {totalAbonosAplicados < totalFactura && (
                        <button
                            onClick={aplicarTodosLosAbonos}
                            className="w-full py-1.5 text-xs font-medium text-purple-600 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-900/30 rounded transition-colors"
                        >
                            Aplicar abonos automáticamente
                        </button>
                    )}

                    {/* Lista de abonos */}
                    <div className="space-y-1.5">
                        {abonosData.abonos.map((abono) => {
                            const isSelected = abonosSeleccionados.has(abono.id);
                            const montoAplicado = abonosSeleccionados.get(abono.id) || 0;

                            return (
                                <button
                                    key={abono.id}
                                    onClick={() => toggleAbono(abono)}
                                    className={`
                                        w-full p-2 rounded-lg border transition-all text-left flex items-center gap-2
                                        ${isSelected
                                            ? 'bg-purple-100 dark:bg-purple-900/40 border-purple-400 dark:border-purple-600'
                                            : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-purple-300'
                                        }
                                    `}
                                >
                                    <div className={`
                                        w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0
                                        ${isSelected
                                            ? 'bg-purple-500 border-purple-500'
                                            : 'border-gray-300 dark:border-gray-600'
                                        }
                                    `}>
                                        {isSelected && <Check className="w-3 h-3 text-white" />}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs text-gray-500 truncate">
                                                {abono.concepto || `Abono #${abono.id}`}
                                            </span>
                                            <span className="text-sm font-bold text-purple-600 dark:text-purple-400">
                                                {formatPrecio(abono.saldo_disponible)}
                                            </span>
                                        </div>
                                        {isSelected && montoAplicado !== abono.saldo_disponible && (
                                            <p className="text-xs text-purple-500">
                                                Aplicando: {formatPrecio(montoAplicado)}
                                            </p>
                                        )}
                                    </div>
                                </button>
                            );
                        })}
                    </div>

                    {/* Total a aplicar */}
                    {totalAbonosAplicados > 0 && (
                        <div className="pt-2 border-t border-purple-200 dark:border-purple-800 flex justify-between items-center">
                            <span className="text-xs text-purple-600 dark:text-purple-400">
                                Total abonos a aplicar:
                            </span>
                            <span className="font-bold text-purple-700 dark:text-purple-300">
                                -{formatPrecio(totalAbonosAplicados)}
                            </span>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
