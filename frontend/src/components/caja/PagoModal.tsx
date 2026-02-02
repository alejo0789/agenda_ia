'use client';

import { useState, useEffect } from 'react';
import { formatPrecio, MetodoPago, AbonoAplicarCreate } from '@/types/caja';
import {
    X,
    CreditCard,
    DollarSign,
    Smartphone,
    Plus,
    Trash2,
    Loader2,
    AlertCircle,
    Gift,
} from 'lucide-react';
import AbonosSelector from './AbonosSelector';

interface PagoModalProps {
    total: number;
    metodosPago: MetodoPago[];
    onClose: () => void;
    onPagar: (
        pagos: Array<{ metodo_pago_id: number; monto: number; referencia_pago?: string }>,
        abonos?: AbonoAplicarCreate[],
        abonosPreviosIds?: number[],
        pagosPrevios?: Array<{ id: number; metodo_pago_id: number; monto: number; referencia_pago?: string }>
    ) => void;
    isLoading: boolean;
    clienteId?: number | null;
    pagosPrevios?: Array<{ id: number; metodo_pago_id: number; metodo_pago_nombre?: string; monto: number; referencia_pago?: string }>;
    abonosPrevios?: Array<{ id: number; abono_id: number; monto_aplicado: number }>;
}

interface PagoItem {
    id: string;
    metodo_pago_id: number;
    monto: string;
    referencia_pago: string;
}

export default function PagoModal({ total, metodosPago, onClose, onPagar, isLoading, clienteId, pagosPrevios = [], abonosPrevios = [] }: PagoModalProps) {
    const [pagos, setPagos] = useState<PagoItem[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [abonosAplicar, setAbonosAplicar] = useState<AbonoAplicarCreate[]>([]);
    const [abonosPreviosActivos, setAbonosPreviosActivos] = useState(abonosPrevios);
    const [pagosPreviosActivos, setPagosPreviosActivos] = useState(pagosPrevios.map(p => ({
        ...p,
        montoStr: new Intl.NumberFormat('es-CO').format(p.monto)
    })));

    // Total de abonos aplicados
    const totalAbonos = abonosAplicar.reduce((acc, a) => acc + a.monto, 0);
    const totalPagadoPrevio = pagosPreviosActivos.reduce((acc, p) => {
        const monto = typeof p.monto === 'string' ? parseInt((p.monto as string).replace(/[^0-9]/g, ''), 10) : p.monto;
        return acc + (monto || 0);
    }, 0);
    const totalAbonosPrevios = abonosPreviosActivos.reduce((acc, a) => acc + a.monto_aplicado, 0);

    // Total restante después de abonos y pagos previos
    const totalRestante = Math.max(0, total - totalAbonos - totalPagadoPrevio - totalAbonosPrevios);

    const generateId = () => {
        return Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
    };

    // Inicializar con un pago en efectivo por el total restante
    useEffect(() => {
        const efectivo = metodosPago.find(m => m.nombre.toLowerCase() === 'efectivo');
        if (efectivo && pagos.length === 0) {
            setPagos([{
                id: generateId(),
                metodo_pago_id: efectivo.id,
                monto: totalRestante > 0 ? new Intl.NumberFormat('es-CO').format(totalRestante) : '',
                referencia_pago: '',
            }]);
        }
    }, [metodosPago, totalRestante, pagos.length]);

    // Actualizar monto del primer pago cuando cambian los abonos o pagos previos
    useEffect(() => {
        if (pagos.length > 0 && totalRestante >= 0) {
            const nuevosPagos = [...pagos];
            // Solo actualizamos si el primer pago aún no ha sido editado manualmente de forma significativa 
            // o si queremos que siempre se ajuste al faltante
            nuevosPagos[0].monto = totalRestante > 0 ? new Intl.NumberFormat('es-CO').format(totalRestante) : '0';
            setPagos(nuevosPagos);
        }
    }, [totalAbonos, totalAbonosPrevios, totalPagadoPrevio, totalRestante]);

    const totalPagado = pagos.reduce((acc, p) => {
        // Remover puntos de miles y otros caracteres no numéricos, mantener solo dígitos
        const monto = parseInt(p.monto.replace(/[^0-9]/g, ''), 10) || 0;
        return acc + monto;
    }, 0);

    const diferencia = totalRestante - totalPagado;

    const agregarPago = () => {
        const efectivo = metodosPago.find(m => m.nombre.toLowerCase() === 'efectivo');
        setPagos([...pagos, {
            id: generateId(),
            metodo_pago_id: efectivo?.id || metodosPago[0]?.id || 1,
            monto: '',
            referencia_pago: '',
        }]);
    };

    const agregarPagoPorFaltante = (tipo: number) => {
        // Encontrar el método de pago adecuado
        let metodoId = metodosPago[0]?.id || 1;

        if (tipo === 1) { // Efectivo
            const efectivo = metodosPago.find(m => m.nombre.toLowerCase().includes('efectivo'));
            if (efectivo) metodoId = efectivo.id;
        } else { // Tarjeta / Otro
            // Intentar encontrar tarjeta o transferencia
            const otro = metodosPago.find(m => !m.nombre.toLowerCase().includes('efectivo'));
            if (otro) metodoId = otro.id;
        }

        // Si ya hay un pagó con monto 0 o vacío, actualizarlo en lugar de crear uno nuevo
        const pagoVacio = pagos.find(p => !p.monto || p.monto === '0');
        if (pagoVacio) {
            actualizarPago(pagoVacio.id, 'metodo_pago_id', metodoId);
            actualizarPago(pagoVacio.id, 'monto', new Intl.NumberFormat('es-CO').format(diferencia));
        } else {
            setPagos([...pagos, {
                id: generateId(),
                metodo_pago_id: metodoId,
                monto: new Intl.NumberFormat('es-CO').format(diferencia),
                referencia_pago: '',
            }]);
        }
    };

    const eliminarPago = (id: string) => {
        setPagos(pagos.filter(p => p.id !== id));
    };

    const actualizarPago = (id: string, campo: keyof PagoItem, valor: string | number) => {
        setPagos(pagos.map(p => p.id === id ? { ...p, [campo]: valor } : p));
    };

    const eliminarAbonoPrevio = (id: number) => {
        setAbonosPreviosActivos(abonosPreviosActivos.filter(a => a.id !== id));
    };

    const eliminarPagoPrevio = (id: number) => {
        setPagosPreviosActivos(pagosPreviosActivos.filter(p => p.id !== id));
    };

    const actualizarPagoPrevio = (id: number, montoStr: string) => {
        const numericValue = montoStr.replace(/[^0-9]/g, '');
        const monto = parseInt(numericValue, 10) || 0;
        setPagosPreviosActivos(pagosPreviosActivos.map(p =>
            p.id === id ? { ...p, monto, montoStr: new Intl.NumberFormat('es-CO').format(monto) } : p
        ));
    };

    const formatInputMoney = (value: string) => {
        const numericValue = value.replace(/[^0-9]/g, '');
        const number = parseInt(numericValue, 10);
        if (isNaN(number)) return '';
        return new Intl.NumberFormat('es-CO').format(number);
    };

    const handleSubmit = () => {
        setError(null);

        // Validar montos - usar parseInt y remover puntos de miles
        const pagosNuevosValidos = pagos.map(p => ({
            metodo_pago_id: p.metodo_pago_id,
            monto: parseInt(p.monto.replace(/[^0-9]/g, ''), 10) || 0,
            referencia_pago: p.referencia_pago || undefined,
        })).filter(p => p.monto > 0);

        const pagosPreviosParaEnviar = pagosPreviosActivos.map(p => ({
            id: p.id,
            metodo_pago_id: p.metodo_pago_id,
            monto: p.monto,
            referencia_pago: p.referencia_pago
        }));

        const totalPagosParaValidar = pagosNuevosValidos.reduce((acc, p) => acc + p.monto, 0) +
            pagosPreviosParaEnviar.reduce((acc, p) => acc + p.monto, 0);

        const totalConAbonos = totalPagosParaValidar + totalAbonos + totalAbonosPrevios;

        // Si no hay pagos, pero el total está cubierto por abonos (nuevos o previos) o pagos previos, permitir continuar
        if (pagosNuevosValidos.length === 0 && totalConAbonos < total) {
            // Solo exigir pago si falta dinero
            setError('Ingresa al menos un monto válido o cubre el total con abonos');
            return;
        }

        // Validar que el total pagado + abonos sea >= total
        // Permitir un pequeño margen de error por redondeo (opcional, aquí estricto)
        if (totalConAbonos < total) {
            setError(`Faltan ${formatPrecio(total - totalConAbonos)} por pagar`);
            return;
        }

        // Validar referencias para métodos que las requieren
        for (const pago of pagos) {
            const metodo = metodosPago.find(m => m.id === pago.metodo_pago_id);
            if (metodo?.requiere_referencia && !pago.referencia_pago && (parseInt(pago.monto.replace(/[^0-9]/g, ''), 10) || 0) > 0) {
                setError(`El método ${metodo.nombre} requiere referencia`);
                return;
            }
        }

        onPagar(
            pagosNuevosValidos,
            abonosAplicar.length > 0 ? abonosAplicar : undefined,
            abonosPreviosActivos.map(a => a.abono_id),
            pagosPreviosParaEnviar // NUEVO ARGUMENTO: pagos previos activos/modificados
        );
    };

    const getIconoMetodo = (nombre: string) => {
        const nombreLower = nombre.toLowerCase();
        if (nombreLower.includes('efectivo')) return <DollarSign className="w-4 h-4" />;
        if (nombreLower.includes('tarjeta')) return <CreditCard className="w-4 h-4" />;
        if (nombreLower.includes('nequi') || nombreLower.includes('daviplata')) return <Smartphone className="w-4 h-4" />;
        return <CreditCard className="w-4 h-4" />;
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-900 rounded-2xl max-w-lg w-full max-h-[90vh] overflow-hidden shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                        Procesar Pago
                    </h2>
                    <button
                        onClick={onClose}
                        disabled={isLoading}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Contenido */}
                <div className="p-4 space-y-4 max-h-[60vh] overflow-y-auto">
                    {/* Total a pagar */}
                    <div className="text-center py-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl">
                        <p className="text-sm text-emerald-600 mb-1">Total a Pagar</p>
                        <p className="text-3xl font-bold text-emerald-700 dark:text-emerald-400">
                            {formatPrecio(total)}
                        </p>
                        {(totalAbonos > 0 || totalPagadoPrevio > 0 || totalAbonosPrevios > 0) && (
                            <div className="mt-2 pt-2 border-t border-emerald-200 dark:border-emerald-800">
                                {totalPagadoPrevio > 0 && (
                                    <p className="text-xs text-blue-600 dark:text-blue-400">
                                        Pagado previo: <span className="font-bold">-{formatPrecio(totalPagadoPrevio)}</span>
                                    </p>
                                )}
                                {totalAbonosPrevios > 0 && (
                                    <p className="text-xs text-purple-600 dark:text-purple-400">
                                        Abonos previos: <span className="font-bold">-{formatPrecio(totalAbonosPrevios)}</span>
                                    </p>
                                )}
                                {totalAbonos > 0 && (
                                    <p className="text-xs text-purple-600 dark:text-purple-400">
                                        Abonos nuevos: <span className="font-bold">-{formatPrecio(totalAbonos)}</span>
                                    </p>
                                )}
                                <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">
                                    Restante: {formatPrecio(totalRestante)}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Selector de abonos */}
                    {clienteId && (
                        <div className="mb-4">
                            <AbonosSelector
                                clienteId={clienteId}
                                onAbonosChange={setAbonosAplicar}
                                totalFactura={total - totalPagadoPrevio - totalAbonosPrevios}
                            />
                        </div>
                    )}

                    {/* Pagos Previos (Solo lectura) */}
                    {pagosPrevios.length > 0 && (
                        <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800">
                            <h4 className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-2 flex items-center gap-2">
                                <CreditCard className="w-4 h-4" />
                                Pagado anteriormente: {formatPrecio(totalPagadoPrevio)}
                            </h4>
                            <div className="space-y-1">
                                {pagosPrevios.map((p, idx) => (
                                    <div key={`prev-${p.id || idx}`} className="text-xs flex justify-between text-blue-700 dark:text-blue-400">
                                        <span>{(p as any).metodo_pago_nombre || (p as any).metodo_nombre || 'Método no esp.'}</span>
                                        <span>{formatPrecio(p.monto)}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Abonos Aplicados Anteriormente */}
                    {abonosPreviosActivos.length > 0 && (
                        <div className="mb-4 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-100 dark:border-purple-800">
                            <h4 className="text-sm font-medium text-purple-800 dark:text-purple-300 mb-2 flex items-center gap-2">
                                <Gift className="w-4 h-4" />
                                Abonos aplicados: {formatPrecio(totalAbonosPrevios)}
                            </h4>
                            <div className="space-y-2">
                                {abonosPreviosActivos.map((a, idx) => (
                                    <div key={`abono-prev-${a.abono_id || idx}`} className="text-xs flex justify-between items-center text-purple-700 dark:text-purple-400 bg-white dark:bg-gray-800 p-2 rounded border border-purple-200 dark:border-purple-700/50">
                                        <div>
                                            <span className="font-semibold block">Abono #{a.abono_id}</span>
                                            <span className="opacity-75">Aplicado previamente</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="font-medium text-sm">{formatPrecio(a.monto_aplicado)}</span>
                                            <button
                                                onClick={() => eliminarAbonoPrevio(a.id)}
                                                className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                                                title="Quitar este abono"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <p className="text-xs text-purple-600 dark:text-purple-400 mt-2 italic flex items-center gap-1">
                                <AlertCircle className="w-3 h-3" />
                                Al quitar un abono, este volverá a estar disponible en la cuenta del cliente.
                            </p>
                        </div>
                    )}

                    {/* Pagos Previos (Editable/Eliminable) */}
                    {pagosPreviosActivos.length > 0 && (
                        <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800">
                            <h4 className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-2 flex items-center gap-2">
                                <CreditCard className="w-4 h-4" />
                                Pagado anteriormente: {formatPrecio(totalPagadoPrevio)}
                            </h4>
                            <div className="space-y-2">
                                {pagosPreviosActivos.map((p, idx) => (
                                    <div key={`prev-${p.id || idx}`} className="bg-white dark:bg-gray-800 border border-blue-200 dark:border-blue-700/50 rounded-lg p-2">
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="text-xs font-semibold text-blue-800 dark:text-blue-300">
                                                {p.metodo_pago_nombre || 'Método previo'}
                                            </span>
                                            <button
                                                onClick={() => eliminarPagoPrevio(p.id)}
                                                className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                                                title="Eliminar este pago"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="relative flex-1">
                                                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500 text-xs">$</span>
                                                <input
                                                    type="text"
                                                    value={p.montoStr}
                                                    onChange={(e) => actualizarPagoPrevio(p.id, e.target.value)}
                                                    className="w-full pl-5 pr-2 py-1 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded text-sm focus:ring-1 focus:ring-blue-500 outline-none"
                                                    placeholder="0.00"
                                                />
                                            </div>
                                            {p.referencia_pago && (
                                                <span className="text-[10px] text-gray-400 truncate max-w-[80px]" title={p.referencia_pago}>
                                                    Ref: {p.referencia_pago}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Lista de pagos */}
                    <div className="space-y-3">
                        {pagos.map((pago, index) => {
                            const metodo = metodosPago.find(m => m.id === pago.metodo_pago_id);
                            return (
                                <div
                                    key={pago.id}
                                    className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 space-y-3 border border-gray-100 dark:border-gray-700"
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">
                                                {getIconoMetodo(metodo?.nombre || '')}
                                            </div>
                                            <span className="font-medium text-gray-700 dark:text-gray-200">
                                                Pago {index + 1}
                                            </span>
                                        </div>
                                        {pagos.length > 1 && (
                                            <button
                                                onClick={() => eliminarPago(pago.id)}
                                                className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                                title="Eliminar pago"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>

                                    {/* Grid de campos */}
                                    <div className="grid grid-cols-2 gap-3">
                                        {/* Selector de Método */}
                                        <div className="col-span-2 sm:col-span-1">
                                            <label className="block text-xs font-medium text-gray-500 mb-1.5">Método de Pago</label>
                                            <select
                                                value={pago.metodo_pago_id}
                                                onChange={(e) => actualizarPago(pago.id, 'metodo_pago_id', parseInt(e.target.value))}
                                                className="w-full h-10 px-3 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                            >
                                                {metodosPago.map((m) => (
                                                    <option key={m.id} value={m.id}>
                                                        {m.nombre}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* Monto */}
                                        <div className="col-span-2 sm:col-span-1">
                                            <label className="block text-xs font-medium text-gray-500 mb-1.5">Monto</label>
                                            <div className="relative">
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium">$</span>
                                                <input
                                                    type="text"
                                                    value={pago.monto}
                                                    onChange={(e) => actualizarPago(pago.id, 'monto', formatInputMoney(e.target.value))}
                                                    placeholder="0"
                                                    className="w-full h-10 pl-7 pr-3 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-right font-bold text-gray-800 dark:text-gray-100"
                                                />
                                            </div>
                                        </div>

                                        {/* Referencia (fila completa si aplica) */}
                                        {metodo?.requiere_referencia && (
                                            <div className="col-span-2">
                                                <label className="block text-xs font-medium text-gray-500 mb-1.5">
                                                    Referencia / N° Aprobación
                                                </label>
                                                <input
                                                    type="text"
                                                    value={pago.referencia_pago}
                                                    onChange={(e) => actualizarPago(pago.id, 'referencia_pago', e.target.value)}
                                                    placeholder="Ej: 123456"
                                                    className="w-full h-10 px-3 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Botones de acción rápida para agregar pagos */}
                    {diferencia > 0 && (
                        <div className="space-y-2 pt-2">
                            <p className="text-xs font-medium text-gray-500 text-center uppercase tracking-wide">
                                Agregar pago por el faltante ({((diferencia / total) * 100).toFixed(0)}%)
                            </p>
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    onClick={() => agregarPagoPorFaltante(1)} // Efectivo
                                    className="p-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 rounded-lg border border-emerald-100 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors text-sm font-medium flex items-center justify-center gap-2"
                                >
                                    <DollarSign className="w-4 h-4" />
                                    + Efectivo ({formatPrecio(diferencia)})
                                </button>
                                <button
                                    onClick={() => agregarPagoPorFaltante(2)} // Tarjeta u otro
                                    className="p-2 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-lg border border-blue-100 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors text-sm font-medium flex items-center justify-center gap-2"
                                >
                                    <CreditCard className="w-4 h-4" />
                                    + Tarjeta / Otro
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Error */}
                    {error && (
                        <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-700 dark:text-red-400">
                            <AlertCircle className="w-5 h-5 flex-shrink-0" />
                            <span className="text-sm">{error}</span>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-200 dark:border-gray-700 space-y-3">
                    {/* Resumen */}
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Total pagos:</span>
                        <span className={`font-medium ${totalPagado >= total ? 'text-emerald-600' : 'text-gray-900 dark:text-gray-100'}`}>
                            {formatPrecio(totalPagado)}
                        </span>
                    </div>
                    {diferencia !== 0 && (
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-500">
                                {diferencia > 0 ? 'Falta:' : 'Cambio a devolver:'}
                            </span>
                            <span className={`font-medium ${diferencia > 0 ? 'text-red-600' : 'text-amber-600'}`}>
                                {formatPrecio(Math.abs(diferencia))}
                            </span>
                        </div>
                    )}

                    {/* Botones */}
                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            disabled={isLoading}
                            className="flex-1 py-3 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors font-medium"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={isLoading || diferencia > 0}
                            className="flex-1 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold rounded-xl hover:from-emerald-600 hover:to-teal-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Procesando...
                                </>
                            ) : (
                                <>
                                    <CreditCard className="w-5 h-5" />
                                    Confirmar Pago
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
