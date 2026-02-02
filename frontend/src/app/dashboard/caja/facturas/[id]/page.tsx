'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useFacturaStore, useCajaStore } from '@/stores/cajaStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatPrecio, getEstadoFacturaColor } from '@/types/caja';
import {
    Receipt,
    ArrowLeft,
    Loader2,
    Calendar,
    User,
    CreditCard,
    Scissors,
    Package,
    XCircle,
    Printer,
    AlertCircle,
    Wallet,
    Pencil,
    Check,
    X,
} from 'lucide-react';
import Link from 'next/link';
import { useAuthStore } from '@/stores/authStore';
import { toast } from 'sonner';

export default function FacturaDetallePage() {
    const params = useParams();
    const router = useRouter();
    const { user } = useAuthStore();
    const { facturaSeleccionada, fetchFactura, anularFactura, actualizarFactura, isLoading, error } = useFacturaStore();
    const { metodosPago, fetchMetodosPago } = useCajaStore(); // Necesario para métodos de pago
    const [showAnularModal, setShowAnularModal] = useState(false);
    const [motivoAnulacion, setMotivoAnulacion] = useState('');
    const [anulando, setAnulando] = useState(false);

    const facturaId = parseInt(params.id as string);
    const isAdmin = user?.rol?.nombre?.toLowerCase() === 'admin' || user?.rol?.nombre?.toLowerCase() === 'administrador';

    useEffect(() => {
        if (facturaId) {
            fetchFactura(facturaId);
        }
    }, [facturaId, fetchFactura]);

    const handleEditarEnPOS = () => {
        router.push(`/dashboard/caja/pos?editar_factura=${facturaId}`);
    };

    const handleAnular = async () => {
        if (!motivoAnulacion.trim()) return;

        setAnulando(true);
        try {
            await anularFactura(facturaId, motivoAnulacion);
            setShowAnularModal(false);
            // Recargar factura
            fetchFactura(facturaId);
        } catch {
            // Error manejado por store
        } finally {
            setAnulando(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
            </div>
        );
    }

    if (!facturaSeleccionada) {
        return (
            <div className="max-w-md mx-auto mt-20 text-center">
                <Receipt className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <h2 className="text-xl font-bold mb-2">Factura no encontrada</h2>
                <Link href="/dashboard/caja/facturas" className="text-emerald-600 hover:underline">
                    Volver al historial
                </Link>
            </div>
        );
    }

    const factura = facturaSeleccionada;

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link
                        href="/dashboard/caja/facturas"
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                                Factura {factura.numero_factura}
                            </h1>
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getEstadoFacturaColor(factura.estado)}`}>
                                {factura.estado.toUpperCase()}
                            </span>
                        </div>
                        <p className="text-gray-500 text-sm flex items-center gap-2 mt-1">
                            <Calendar className="w-4 h-4" />
                            {new Date(factura.fecha).toLocaleString('es-CO')}
                        </p>
                    </div>
                </div>

                <div className="flex gap-2">
                    {isAdmin && factura.estado !== 'anulada' && (
                        <button
                            onClick={handleEditarEnPOS}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                        >
                            <Pencil className="w-4 h-4" />
                            Editar (POS)
                        </button>
                    )}
                    <button
                        className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                    >
                        <Printer className="w-4 h-4" />
                        Imprimir
                    </button>
                    {factura.estado === 'pagada' && (
                        <button
                            onClick={() => setShowAnularModal(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                        >
                            <XCircle className="w-4 h-4" />
                            Anular
                        </button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Columna principal */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Detalle de items */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Detalle de la Factura</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {factura.detalle.map((item) => (
                                    <div
                                        key={item.id}
                                        className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${item.tipo === 'servicio'
                                                ? 'bg-emerald-100 dark:bg-emerald-900/20'
                                                : 'bg-purple-100 dark:bg-purple-900/20'
                                                }`}>
                                                {item.tipo === 'servicio' ? (
                                                    <Scissors className="w-5 h-5 text-emerald-600" />
                                                ) : (
                                                    <Package className="w-5 h-5 text-purple-600" />
                                                )}
                                            </div>
                                            <div>
                                                <p className="font-medium text-gray-900 dark:text-gray-100">
                                                    {item.item_nombre}
                                                </p>
                                                <p className="text-sm text-gray-500">
                                                    {item.cantidad} x {formatPrecio(item.precio_unitario)}
                                                    {item.especialista_nombre && ` · ${item.especialista_nombre}`}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            {item.descuento_linea > 0 && (
                                                <p className="text-xs text-red-600 line-through">
                                                    {formatPrecio(item.cantidad * item.precio_unitario)}
                                                </p>
                                            )}
                                            <p className="font-semibold text-gray-900 dark:text-gray-100">
                                                {formatPrecio(item.subtotal)}
                                            </p>
                                            {item.comision && (
                                                <p className="text-xs text-gray-500">
                                                    Comisión: {formatPrecio(item.comision.monto_comision)}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Pagos */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <CreditCard className="w-5 h-5 text-emerald-600" />
                                Pagos Aplicados
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                {/* Sección Abonos */}
                                {(factura.abonos_aplicados)?.map((abono, index) => (
                                    <div
                                        key={`abono-${index}`}
                                        className="flex items-center justify-between p-3 bg-amber-50 dark:bg-amber-900/10 rounded-lg border border-amber-100 dark:border-amber-800/20"
                                    >
                                        <div className="flex-1">
                                            <p className="font-medium text-amber-900 dark:text-amber-100 flex items-center gap-2">
                                                <Wallet className="w-4 h-4" />
                                                Abono Aplicado
                                            </p>
                                            <p className="text-sm text-amber-700 dark:text-amber-300">
                                                {(abono as any).fecha_aplicacion && new Date((abono as any).fecha_aplicacion).toLocaleTimeString('es-CO', {
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                })}
                                            </p>
                                        </div>
                                        <p className="font-semibold text-amber-700 dark:text-amber-400">
                                            {formatPrecio(abono.monto_aplicado)}
                                        </p>
                                    </div>
                                ))}

                                {/* Sección Pagos */}
                                {(factura.pagos)?.map((pago, index) => (
                                    <div
                                        key={pago.id}
                                        className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg gap-3"
                                    >
                                        <div className="flex-1 space-y-2">
                                            <>
                                                <p className="font-medium text-gray-900 dark:text-gray-100">
                                                    {(pago as any).metodo_pago_nombre || (pago as any).metodo_nombre}
                                                </p>
                                                <p className="text-sm text-gray-500">
                                                    {(pago as any).fecha_pago && new Date((pago as any).fecha_pago).toLocaleTimeString('es-CO', {
                                                        hour: '2-digit',
                                                        minute: '2-digit',
                                                    })}
                                                    {pago.referencia_pago && ` · Ref: ${pago.referencia_pago}`}
                                                </p>
                                            </>
                                        </div>
                                        <p className="font-semibold text-emerald-600">
                                            {formatPrecio(pago.monto)}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Columna lateral */}
                <div className="space-y-6">
                    {/* Totales */}
                    <Card>
                        <CardContent className="p-6">
                            <div className="space-y-3">
                                <div className="flex justify-between text-gray-600 dark:text-gray-400">
                                    <span>Subtotal</span>
                                    <span>{formatPrecio(factura.subtotal)}</span>
                                </div>
                                {factura.descuento > 0 && (
                                    <div className="flex justify-between text-red-600">
                                        <span>Descuento</span>
                                        <span>-{formatPrecio(factura.descuento)}</span>
                                    </div>
                                )}
                                {factura.impuestos > 0 && (
                                    <div className="flex justify-between text-gray-600 dark:text-gray-400">
                                        <span>IVA</span>
                                        <span>{formatPrecio(factura.impuestos)}</span>
                                    </div>
                                )}
                                <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
                                    <div className="flex justify-between text-lg font-bold">
                                        <span>Total</span>
                                        <span className="text-emerald-600">{formatPrecio(factura.total)}</span>
                                    </div>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Abonos</span>
                                    <span className="text-amber-600">{formatPrecio(factura.total_abonos_aplicados || 0)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Pagado</span>
                                    <span className="text-emerald-600">{formatPrecio(factura.total_pagado)}</span>
                                </div>
                                {factura.saldo_pendiente > 0 && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500">Pendiente</span>
                                        <span className="text-red-600">{formatPrecio(factura.saldo_pendiente)}</span>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Cliente */}
                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                                    <User className="w-6 h-6 text-gray-400" />
                                </div>
                                <div>
                                    <p className="font-medium text-gray-900 dark:text-gray-100">
                                        {factura.cliente_nombre || 'Cliente General'}
                                    </p>
                                    <p className="text-sm text-gray-500">Cliente</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Notas */}
                    {factura.notas && (
                        <Card>
                            <CardContent className="p-6">
                                <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Notas</h4>
                                <p className="text-sm text-gray-500">{factura.notas}</p>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>

            {/* Modal Anular */}
            {showAnularModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-900 rounded-2xl max-w-md w-full p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
                                <AlertCircle className="w-6 h-6 text-red-600" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                                    Anular Factura
                                </h3>
                                <p className="text-sm text-gray-500">
                                    Esta acción no se puede deshacer
                                </p>
                            </div>
                        </div>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Motivo de anulación
                            </label>
                            <textarea
                                value={motivoAnulacion}
                                onChange={(e) => setMotivoAnulacion(e.target.value)}
                                placeholder="Escribe el motivo..."
                                rows={3}
                                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
                            />
                        </div>

                        {error && (
                            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-700 dark:text-red-400 text-sm">
                                {error}
                            </div>
                        )}

                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowAnularModal(false)}
                                disabled={anulando}
                                className="flex-1 py-3 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors font-medium"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleAnular}
                                disabled={anulando || !motivoAnulacion.trim()}
                                className="flex-1 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center gap-2"
                            >
                                {anulando ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        Anulando...
                                    </>
                                ) : (
                                    <>
                                        <XCircle className="w-5 h-5" />
                                        Confirmar Anulación
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
