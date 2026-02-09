'use client';

import { useEffect, useMemo, useState } from 'react';
import { useCajaStore, useVentasStore } from '@/stores/cajaStore';
import { useAuthStore } from '@/stores/authStore';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { formatPrecio, getEstadoCajaColor } from '@/types/caja';
import {
    DollarSign,
    ShoppingCart,
    Receipt,
    Clock,
    TrendingUp,
    CreditCard,
    ChevronRight,
    AlertCircle,
    CheckCircle,
    Loader2,
    Plus,
    LogOut,
    History,
    BarChart3,
    Wallet,
} from 'lucide-react';
import CrearAbonoModal from '@/components/caja/CrearAbonoModal';
import ClienteSelector from '@/components/caja/ClienteSelector';
import MetodosPagoModal from '@/components/caja/MetodosPagoModal';

const menuCards = [
    {
        title: 'Punto de Venta',
        description: 'Crear nueva venta o factura',
        icon: ShoppingCart,
        href: '/dashboard/caja/pos',
        gradient: 'from-emerald-500 to-teal-500',
        bgGradient: 'from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20',
        borderColor: 'border-emerald-200 dark:border-emerald-800',
    },
    {
        title: 'Historial de Facturas',
        description: 'Ver y gestionar facturas',
        icon: Receipt,
        href: '/dashboard/caja/facturas',
        gradient: 'from-blue-500 to-indigo-500',
        bgGradient: 'from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20',
        borderColor: 'border-blue-200 dark:border-indigo-800',
    },
    {
        title: 'Servicios Pendientes',
        description: 'Aprobar servicios de especialistas',
        icon: Clock,
        href: '/dashboard/caja/pendientes',
        gradient: 'from-amber-500 to-orange-500',
        bgGradient: 'from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20',
        borderColor: 'border-amber-200 dark:border-orange-800',
    },
    {
        title: 'Reportes de Ventas',
        description: 'Análisis y estadísticas',
        icon: BarChart3,
        href: '/dashboard/caja/reportes',
        gradient: 'from-purple-500 to-pink-500',
        bgGradient: 'from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20',
        borderColor: 'border-purple-200 dark:border-pink-800',
    },
    {
        title: 'Historial de Cajas',
        description: 'Ver cajas anteriores',
        icon: History,
        href: '/dashboard/caja/historial',
        gradient: 'from-gray-500 to-slate-500',
        bgGradient: 'from-gray-50 to-slate-50 dark:from-gray-900/20 dark:to-slate-900/20',
        borderColor: 'border-gray-200 dark:border-slate-800',
    },
];

export default function CajaPage() {
    const { cajaActual, fetchCajaActual, isLoading: loadingCaja } = useCajaStore();
    const { ventasDia, fetchVentasDia, isLoading: loadingVentas } = useVentasStore();
    const { user } = useAuthStore();

    useEffect(() => {
        fetchCajaActual();
        fetchVentasDia();
    }, [fetchCajaActual, fetchVentasDia]);

    const canViewFinancials = user?.rol?.nombre?.toLowerCase().includes('admin');

    const stats = useMemo(() => {
        return {
            totalVentas: canViewFinancials ? (ventasDia?.total_ventas ?? 0) : -1,
            totalServicios: ventasDia?.total_servicios ?? 0,
            totalProductos: ventasDia?.total_productos ?? 0,
            cantidadFacturas: ventasDia?.cantidad_facturas ?? 0,
            efectivoEnCaja: canViewFinancials ? (cajaActual?.total_efectivo_teorico ?? 0) : -1,
        };
    }, [ventasDia, cajaActual, canViewFinancials]);

    const isLoading = loadingCaja || loadingVentas;

    // Estado para modal de abono
    const [showAbonoModal, setShowAbonoModal] = useState(false);
    const [showMetodosPagoModal, setShowMetodosPagoModal] = useState(false);
    const [clienteParaAbono, setClienteParaAbono] = useState<{ id: number; nombre: string } | null>(null);

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                        Caja / Punto de Venta
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">
                        Facturación, ventas y control de caja
                    </p>
                </div>

                {/* Estado de caja */}
                {!loadingCaja && (
                    <div className="flex items-center gap-3">
                        {cajaActual ? (
                            <>
                                <div className="flex items-center gap-2 bg-green-50 dark:bg-green-900/20 px-4 py-2 rounded-lg border border-green-200 dark:border-green-800">
                                    <CheckCircle className="w-5 h-5 text-green-600" />
                                    <span className="text-green-700 dark:text-green-400 font-medium">
                                        Caja Abierta
                                    </span>
                                </div>
                                <Link
                                    href="/dashboard/caja/cerrar"
                                    className="flex items-center gap-2 px-4 py-2 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg border border-red-200 dark:border-red-800 transition-colors"
                                >
                                    <LogOut className="w-4 h-4" />
                                    Cerrar Caja
                                </Link>
                            </>
                        ) : (
                            <Link
                                href="/dashboard/caja/abrir"
                                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-lg hover:from-emerald-600 hover:to-teal-600 transition-all shadow-lg hover:shadow-xl"
                            >
                                <Plus className="w-5 h-5" />
                                Abrir Caja
                            </Link>
                        )}
                    </div>
                )}
            </div>

            {/* Alerta si no hay caja abierta */}
            {!loadingCaja && !cajaActual && (
                <Card className="bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <AlertCircle className="w-6 h-6 text-amber-600 flex-shrink-0" />
                            <div>
                                <h3 className="font-semibold text-amber-800 dark:text-amber-300">
                                    No hay caja abierta
                                </h3>
                                <p className="text-amber-700 dark:text-amber-400 text-sm">
                                    Debes abrir una caja para poder realizar ventas y facturación.
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20 border-emerald-200 dark:border-emerald-800">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs text-emerald-600 dark:text-emerald-400 uppercase tracking-wide">Ventas Hoy</p>
                                {isLoading ? (
                                    <Loader2 className="w-5 h-5 animate-spin text-emerald-600 mt-1" />
                                ) : (
                                    <p className="text-lg font-bold text-emerald-900 dark:text-emerald-100">
                                        {stats.totalVentas === -1 ? '********' : formatPrecio(stats.totalVentas)}
                                    </p>
                                )}
                            </div>
                            <div className="p-2.5 rounded-lg bg-emerald-200 dark:bg-emerald-800/50">
                                <DollarSign className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-800">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs text-blue-600 dark:text-blue-400 uppercase tracking-wide">Servicios</p>
                                {isLoading ? (
                                    <Loader2 className="w-5 h-5 animate-spin text-blue-600 mt-1" />
                                ) : (
                                    <p className="text-lg font-bold text-blue-900 dark:text-blue-100">
                                        {formatPrecio(stats.totalServicios)}
                                    </p>
                                )}
                            </div>
                            <div className="p-2.5 rounded-lg bg-blue-200 dark:bg-blue-800/50">
                                <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-purple-200 dark:border-purple-800">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs text-purple-600 dark:text-purple-400 uppercase tracking-wide">Productos</p>
                                {isLoading ? (
                                    <Loader2 className="w-5 h-5 animate-spin text-purple-600 mt-1" />
                                ) : (
                                    <p className="text-lg font-bold text-purple-900 dark:text-purple-100">
                                        {formatPrecio(stats.totalProductos)}
                                    </p>
                                )}
                            </div>
                            <div className="p-2.5 rounded-lg bg-purple-200 dark:bg-purple-800/50">
                                <ShoppingCart className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20 border-amber-200 dark:border-amber-800">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs text-amber-600 dark:text-amber-400 uppercase tracking-wide">Facturas</p>
                                {isLoading ? (
                                    <Loader2 className="w-5 h-5 animate-spin text-amber-600 mt-1" />
                                ) : (
                                    <p className="text-2xl font-bold text-amber-900 dark:text-amber-100">
                                        {stats.cantidadFacturas}
                                    </p>
                                )}
                            </div>
                            <div className="p-2.5 rounded-lg bg-amber-200 dark:bg-amber-800/50">
                                <Receipt className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-teal-50 to-teal-100 dark:from-teal-900/20 dark:to-teal-800/20 border-teal-200 dark:border-teal-800">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs text-teal-600 dark:text-teal-400 uppercase tracking-wide">En Caja</p>
                                {isLoading ? (
                                    <Loader2 className="w-5 h-5 animate-spin text-teal-600 mt-1" />
                                ) : (
                                    <p className="text-lg font-bold text-teal-900 dark:text-teal-100">
                                        {stats.efectivoEnCaja === -1 ? '********' : formatPrecio(stats.efectivoEnCaja)}
                                    </p>
                                )}
                            </div>
                            <div className="p-2.5 rounded-lg bg-teal-200 dark:bg-teal-800/50">
                                <CreditCard className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Module Cards */}
            <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                    Módulos
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {menuCards.map((card) => {
                        const Icon = card.icon;
                        const isDisabled = !cajaActual && card.href === '/dashboard/caja/pos';

                        if (isDisabled) {
                            return (
                                <Card
                                    key={card.href}
                                    className="bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700 opacity-60 cursor-not-allowed h-full"
                                >
                                    <CardContent className="p-6">
                                        <div className="flex items-start justify-between">
                                            <div className="w-12 h-12 rounded-xl bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                                                <Icon className="w-6 h-6 text-gray-500" />
                                            </div>
                                        </div>
                                        <h3 className="mt-4 font-semibold text-gray-500 dark:text-gray-400">
                                            {card.title}
                                        </h3>
                                        <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                                            Requiere caja abierta
                                        </p>
                                    </CardContent>
                                </Card>
                            );
                        }

                        return (
                            <Link key={card.href} href={card.href}>
                                <Card className={`bg-gradient-to-br ${card.bgGradient} ${card.borderColor} hover:shadow-lg transition-all duration-300 cursor-pointer group h-full`}>
                                    <CardContent className="p-6">
                                        <div className="flex items-start justify-between">
                                            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${card.gradient} flex items-center justify-center shadow-lg`}>
                                                <Icon className="w-6 h-6 text-white" />
                                            </div>
                                            <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 group-hover:translate-x-1 transition-all" />
                                        </div>
                                        <h3 className="mt-4 font-semibold text-gray-900 dark:text-gray-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                                            {card.title}
                                        </h3>
                                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                            {card.description}
                                        </p>
                                    </CardContent>
                                </Card>
                            </Link>
                        );
                    })}

                    {/* Tarjeta especial para Registrar Abono */}
                    {cajaActual && (
                        <Card
                            onClick={() => setShowAbonoModal(true)}
                            className="bg-gradient-to-br from-pink-50 to-rose-50 dark:from-pink-900/20 dark:to-rose-900/20 border-pink-200 dark:border-rose-800 hover:shadow-lg transition-all duration-300 cursor-pointer group h-full"
                        >
                            <CardContent className="p-6">
                                <div className="flex items-start justify-between">
                                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center shadow-lg">
                                        <Wallet className="w-6 h-6 text-white" />
                                    </div>
                                    <Plus className="w-5 h-5 text-gray-400 group-hover:text-pink-600 dark:group-hover:text-pink-400 transition-all" />
                                </div>
                                <h3 className="mt-4 font-semibold text-gray-900 dark:text-gray-100 group-hover:text-pink-600 dark:group-hover:text-pink-400 transition-colors">
                                    Registrar Abono
                                </h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                    Recibir pago anticipado
                                </p>
                            </CardContent>
                        </Card>
                    )}

                    {/* Tarjeta para Métodos de Pago - Solo Admin */}
                    {canViewFinancials && (
                        <Card
                            onClick={() => setShowMetodosPagoModal(true)}
                            className="bg-gradient-to-br from-indigo-50 to-violet-50 dark:from-indigo-900/20 dark:to-violet-900/20 border-indigo-200 dark:border-violet-800 hover:shadow-lg transition-all duration-300 cursor-pointer group h-full"
                        >
                            <CardContent className="p-6">
                                <div className="flex items-start justify-between">
                                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center shadow-lg">
                                        <CreditCard className="w-6 h-6 text-white" />
                                    </div>
                                    <CreditCard className="w-5 h-5 text-gray-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-all" />
                                </div>
                                <h3 className="mt-4 font-semibold text-gray-900 dark:text-gray-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                    Métodos de Pago
                                </h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                    Configurar medios de pago
                                </p>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>

            {/* Info caja actual */}
            {
                cajaActual && (
                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                                    Información de Caja Actual
                                </h3>
                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getEstadoCajaColor(cajaActual.estado)}`}>
                                    {cajaActual.estado.toUpperCase()}
                                </span>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div>
                                    <p className="text-sm text-gray-500">Caja</p>
                                    <p className="font-medium">{cajaActual.nombre}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Apertura</p>
                                    <p className="font-medium">
                                        {new Date(cajaActual.fecha_apertura).toLocaleTimeString('es-CO', {
                                            hour: '2-digit',
                                            minute: '2-digit',
                                        })}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Monto Inicial</p>
                                    <p className="font-medium">
                                        {canViewFinancials ? formatPrecio(cajaActual.monto_apertura) : '********'}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Efectivo Actual</p>
                                    <p className="font-medium text-emerald-600">
                                        {canViewFinancials ? formatPrecio(cajaActual.total_efectivo_teorico) : '********'}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )
            }

            {/* Modal de selección de cliente para abono */}
            {
                showAbonoModal && !clienteParaAbono && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center">
                        <div
                            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                            onClick={() => setShowAbonoModal(false)}
                        />
                        <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                                Registrar Abono
                            </h2>
                            <p className="text-gray-500 dark:text-gray-400 mb-4 text-sm">
                                Primero, selecciona el cliente que realizará el abono:
                            </p>
                            <ClienteSelector
                                value={null}
                                onChange={(cliente) => {
                                    if (cliente) {
                                        setClienteParaAbono(cliente);
                                    }
                                }}
                                required={true}
                            />
                            <button
                                onClick={() => setShowAbonoModal(false)}
                                className="mt-4 w-full py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                            >
                                Cancelar
                            </button>
                        </div>
                    </div>
                )
            }

            {/* Modal de crear abono */}
            {
                clienteParaAbono && (
                    <CrearAbonoModal
                        isOpen={true}
                        onClose={() => {
                            setClienteParaAbono(null);
                            setShowAbonoModal(false);
                        }}
                        onSuccess={() => {
                            setClienteParaAbono(null);
                            setShowAbonoModal(false);
                        }}
                        clienteId={clienteParaAbono.id}
                        clienteNombre={clienteParaAbono.nombre}
                    />
                )
            }
            {/* Modal de Métodos de Pago */}
            <MetodosPagoModal
                isOpen={showMetodosPagoModal}
                onClose={() => setShowMetodosPagoModal(false)}
            />
        </div>
    );
}
