'use client';

import { useEffect, useState } from 'react';
import { useFacturasPendientesStore, useCarritoStore } from '@/stores/cajaStore';
import { Card, CardContent } from '@/components/ui/card';
import { formatPrecio } from '@/types/caja';
import type { FacturaPendienteResumen } from '@/types/caja';
import {
    Clock,
    ShoppingCart,
    ArrowLeft,
    Loader2,
    Calendar,
    User,
    Scissors,
    AlertCircle,
    ChevronRight,
    Search,
    ChevronDown,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function PendientesPage() {
    const router = useRouter();
    const {
        resumenPendientes,
        fetchResumenPorCliente,
        isLoading,
        error,
    } = useFacturasPendientesStore();

    const {
        limpiarCarrito,
        setCliente,
        agregarItem,
    } = useCarritoStore();

    const [fechaInicio, setFechaInicio] = useState(new Date().toISOString().split('T')[0]);
    const [fechaFin, setFechaFin] = useState(new Date().toISOString().split('T')[0]);
    const [clienteExpandido, setClienteExpandido] = useState<number | null>(null);

    useEffect(() => {
        fetchResumenPorCliente({
            fecha_inicio: fechaInicio,
            fecha_fin: fechaFin,
        });
    }, [fechaInicio, fechaFin, fetchResumenPorCliente]);

    const handleCargarAlCarrito = (resumen: FacturaPendienteResumen) => {
        limpiarCarrito();
        setCliente(resumen.cliente_id, resumen.cliente_nombre);

        resumen.servicios.forEach(item => {
            agregarItem({
                tipo: item.tipo,
                item_id: (item.tipo === 'servicio' ? item.servicio_id : item.producto_id) || 0,
                nombre: item.servicio_nombre,
                cantidad: item.cantidad || 1,
                precio_unitario: item.servicio_precio,
                descuento: 0,
                especialista_id: item.especialista_id,
                especialista_nombre: item.especialista_nombre,
                factura_pendiente_id: item.id,
            });
        });

        router.push('/dashboard/caja/pos');
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Link
                        href="/dashboard/caja"
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                            Facturas en Espera
                        </h1>
                        <p className="text-gray-500 text-sm">
                            Servicios agrupados por cliente listos para facturar
                        </p>
                    </div>
                </div>

                {/* Filtros de Fecha */}
                <div className="flex items-center gap-2 bg-white dark:bg-gray-900 p-2 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800">
                    <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <input
                            type="date"
                            value={fechaInicio}
                            onChange={(e) => setFechaInicio(e.target.value)}
                            className="bg-transparent border-none focus:ring-0 text-sm"
                        />
                    </div>
                    <span className="text-gray-300">|</span>
                    <input
                        type="date"
                        value={fechaFin}
                        onChange={(e) => setFechaFin(e.target.value)}
                        className="bg-transparent border-none focus:ring-0 text-sm"
                    />
                </div>
            </div>

            {/* Error */}
            {error && (
                <div className="flex items-center gap-2 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-700 dark:text-red-400">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    <span>{error}</span>
                </div>
            )}

            {/* Lista Agrupada */}
            {isLoading ? (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
                </div>
            ) : resumenPendientes.length === 0 ? (
                <Card>
                    <CardContent className="p-12 text-center">
                        <Clock className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                            No hay facturas en espera
                        </h3>
                        <p className="text-gray-500">
                            No se encontraron servicios pendientes en el rango de fechas seleccionado
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4">
                    {resumenPendientes.map((resumen) => (
                        <div
                            key={resumen.cliente_id || 0}
                            className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden"
                        >
                            <div className="p-4 flex items-center justify-between gap-4">
                                <button
                                    onClick={() => setClienteExpandido(clienteExpandido === resumen.cliente_id ? null : resumen.cliente_id)}
                                    className="flex items-center gap-4 flex-1 text-left"
                                >
                                    <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-900/20 flex items-center justify-center">
                                        <User className="w-6 h-6 text-amber-600" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                                            {resumen.cliente_nombre || 'Cliente sin nombre'}
                                            <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 rounded-md text-[10px] text-gray-500 uppercase">
                                                ID: {resumen.cliente_id || 'N/A'}
                                            </span>
                                        </h3>
                                        <p className="text-sm text-gray-500">
                                            {resumen.total_servicios} servicio{resumen.total_servicios !== 1 ? 's' : ''} registrado{resumen.total_servicios !== 1 ? 's' : ''}
                                        </p>
                                    </div>
                                    <div className="text-right mr-4">
                                        <p className="text-xs text-gray-400 uppercase font-bold">Total Espera</p>
                                        <p className="text-xl font-black text-emerald-600">
                                            {formatPrecio(resumen.total_monto)}
                                        </p>
                                    </div>
                                    <div className={`p-2 rounded-lg bg-gray-50 dark:bg-gray-800 transition-transform ${clienteExpandido === resumen.cliente_id ? 'rotate-180' : ''}`}>
                                        <ChevronDown className="w-5 h-5 text-gray-400" />
                                    </div>
                                </button>

                                <button
                                    onClick={() => handleCargarAlCarrito(resumen)}
                                    className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-emerald-200 dark:shadow-none flex items-center gap-2 active:scale-95"
                                >
                                    <ShoppingCart className="w-5 h-5" />
                                    <span>COBRAR</span>
                                </button>
                            </div>

                            {/* Detalle Expandido */}
                            {clienteExpandido === resumen.cliente_id && (
                                <div className="bg-gray-50/50 dark:bg-gray-950/20 border-t border-gray-100 dark:border-gray-800 p-4">
                                    <div className="space-y-2">
                                        {resumen.servicios.map((item: any) => (
                                            <div key={item.id} className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-800/50">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
                                                        {item.tipo === 'servicio' ? (
                                                            <Scissors className="w-4 h-4 text-emerald-600" />
                                                        ) : (
                                                            <ShoppingCart className="w-4 h-4 text-blue-600" />
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-sm text-gray-900 dark:text-gray-100">
                                                            {item.servicio_nombre}
                                                        </p>
                                                        <p className="text-xs text-gray-500">
                                                            Atiende: <span className="font-medium">{item.especialista_nombre}</span>
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-bold text-gray-900 dark:text-gray-100">
                                                        {formatPrecio(item.servicio_precio)}
                                                    </p>
                                                    <p className="text-[10px] text-gray-400">
                                                        Cant: {item.cantidad}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
