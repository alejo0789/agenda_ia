'use client';

import { useEffect, useMemo } from 'react';
import { useProductoStore, useProveedorStore } from '@/stores/inventarioStore';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { formatPrecio, getStockStatus } from '@/types/inventario';
import {
    Package,
    Truck,
    ArrowRightLeft,
    AlertTriangle,
    TrendingUp,
    DollarSign,
    Boxes,
    ChevronRight,
    BarChart3,
    Loader2,
} from 'lucide-react';

const menuCards = [
    {
        title: 'Productos',
        description: 'Gestiona el catálogo de productos',
        icon: Package,
        href: '/dashboard/inventario/productos',
        gradient: 'from-purple-500 to-pink-500',
        bgGradient: 'from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20',
        borderColor: 'border-purple-200 dark:border-purple-800',
    },
    {
        title: 'Proveedores',
        description: 'Administra tus proveedores',
        icon: Truck,
        href: '/dashboard/inventario/proveedores',
        gradient: 'from-blue-500 to-cyan-500',
        bgGradient: 'from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20',
        borderColor: 'border-blue-200 dark:border-blue-800',
    },
    {
        title: 'Movimientos',
        description: 'Historial de movimientos de stock',
        icon: ArrowRightLeft,
        href: '/dashboard/inventario/movimientos',
        gradient: 'from-amber-500 to-orange-500',
        bgGradient: 'from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20',
        borderColor: 'border-amber-200 dark:border-amber-800',
    },
    {
        title: 'Reportes',
        description: 'Análisis y valorización',
        icon: BarChart3,
        href: '/dashboard/inventario/reportes',
        gradient: 'from-emerald-500 to-teal-500',
        bgGradient: 'from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20',
        borderColor: 'border-emerald-200 dark:border-emerald-800',
    },
    {
        title: 'Conteo Físico',
        description: 'Inventario y ajustes de stock',
        icon: Boxes,
        href: '/dashboard/inventario/conteo',
        gradient: 'from-indigo-500 to-violet-500',
        bgGradient: 'from-indigo-50 to-violet-50 dark:from-indigo-900/20 dark:to-violet-900/20',
        borderColor: 'border-indigo-200 dark:border-indigo-800',
    },
];

export default function InventarioPage() {
    const { productos, fetchProductos, isLoading: loadingProductos } = useProductoStore();
    const { proveedores, fetchProveedores, isLoading: loadingProveedores } = useProveedorStore();

    useEffect(() => {
        fetchProductos();
        fetchProveedores();
    }, [fetchProductos, fetchProveedores]);

    const stats = useMemo(() => {
        const productosActivos = productos.filter(p => p.estado === 'activo').length;
        const stockBajo = productos.filter(p => {
            const stock = p.stock_total ?? 0;
            return getStockStatus(stock, p.stock_minimo) === 'bajo';
        }).length;
        const sinStock = productos.filter(p => {
            const stock = p.stock_total ?? 0;
            return getStockStatus(stock, p.stock_minimo) === 'sin_stock';
        }).length;
        const valorTotal = productos.reduce((acc, p) => {
            const stock = p.stock_total ?? 0;
            return acc + (stock * p.precio_venta);
        }, 0);
        const proveedoresActivos = proveedores.filter(p => p.estado === 'activo').length;

        return { productosActivos, stockBajo, sinStock, valorTotal, proveedoresActivos };
    }, [productos, proveedores]);

    const isLoading = loadingProductos || loadingProveedores;

    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                    Gestión de Inventario
                </h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1">
                    Controla productos, proveedores y stock del negocio
                </p>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-purple-200 dark:border-purple-800">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs text-purple-600 dark:text-purple-400 uppercase tracking-wide">Productos</p>
                                {isLoading ? (
                                    <Loader2 className="w-5 h-5 animate-spin text-purple-600 mt-1" />
                                ) : (
                                    <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                                        {productos.length}
                                    </p>
                                )}
                            </div>
                            <div className="p-2.5 rounded-lg bg-purple-200 dark:bg-purple-800/50">
                                <Boxes className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-800">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs text-blue-600 dark:text-blue-400 uppercase tracking-wide">Proveedores</p>
                                {isLoading ? (
                                    <Loader2 className="w-5 h-5 animate-spin text-blue-600 mt-1" />
                                ) : (
                                    <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                                        {stats.proveedoresActivos}
                                    </p>
                                )}
                            </div>
                            <div className="p-2.5 rounded-lg bg-blue-200 dark:bg-blue-800/50">
                                <Truck className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-800">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs text-green-600 dark:text-green-400 uppercase tracking-wide">Activos</p>
                                {isLoading ? (
                                    <Loader2 className="w-5 h-5 animate-spin text-green-600 mt-1" />
                                ) : (
                                    <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                                        {stats.productosActivos}
                                    </p>
                                )}
                            </div>
                            <div className="p-2.5 rounded-lg bg-green-200 dark:bg-green-800/50">
                                <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20 border-amber-200 dark:border-amber-800">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs text-amber-600 dark:text-amber-400 uppercase tracking-wide">Stock Bajo</p>
                                {isLoading ? (
                                    <Loader2 className="w-5 h-5 animate-spin text-amber-600 mt-1" />
                                ) : (
                                    <p className="text-2xl font-bold text-amber-900 dark:text-amber-100">
                                        {stats.stockBajo + stats.sinStock}
                                    </p>
                                )}
                            </div>
                            <div className="p-2.5 rounded-lg bg-amber-200 dark:bg-amber-800/50">
                                <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20 border-emerald-200 dark:border-emerald-800">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs text-emerald-600 dark:text-emerald-400 uppercase tracking-wide">Valor Total</p>
                                {isLoading ? (
                                    <Loader2 className="w-5 h-5 animate-spin text-emerald-600 mt-1" />
                                ) : (
                                    <p className="text-lg font-bold text-emerald-900 dark:text-emerald-100">
                                        {formatPrecio(stats.valorTotal)}
                                    </p>
                                )}
                            </div>
                            <div className="p-2.5 rounded-lg bg-emerald-200 dark:bg-emerald-800/50">
                                <DollarSign className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
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
                                        <h3 className="mt-4 font-semibold text-gray-900 dark:text-gray-100 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
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
                </div>
            </div>

            {/* Recent Activity / Quick Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Alertas de Stock */}
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                                <AlertTriangle className="w-5 h-5 text-amber-500" />
                                Alertas de Stock
                            </h3>
                            <Link
                                href="/dashboard/inventario/productos?filter=stock_bajo"
                                className="text-sm text-purple-600 hover:text-purple-700 font-medium"
                            >
                                Ver todos
                            </Link>
                        </div>
                        {isLoading ? (
                            <div className="flex items-center justify-center py-8">
                                <Loader2 className="w-6 h-6 animate-spin text-purple-600" />
                            </div>
                        ) : productos.filter(p => {
                            const stock = p.stock_total ?? 0;
                            return getStockStatus(stock, p.stock_minimo) !== 'normal';
                        }).length === 0 ? (
                            <div className="text-center py-8 text-gray-500">
                                <Package className="w-12 h-12 mx-auto mb-2 opacity-30" />
                                <p>No hay alertas de stock</p>
                            </div>
                        ) : (
                            <ul className="space-y-3">
                                {productos
                                    .filter(p => {
                                        const stock = p.stock_total ?? 0;
                                        return getStockStatus(stock, p.stock_minimo) !== 'normal';
                                    })
                                    .slice(0, 5)
                                    .map((producto) => {
                                        const stock = producto.stock_total ?? 0;
                                        const status = getStockStatus(stock, producto.stock_minimo);
                                        return (
                                            <li
                                                key={producto.id}
                                                className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${status === 'sin_stock'
                                                        ? 'bg-red-100 dark:bg-red-900/20'
                                                        : 'bg-amber-100 dark:bg-amber-900/20'
                                                        }`}>
                                                        <Package className={`w-4 h-4 ${status === 'sin_stock'
                                                            ? 'text-red-600'
                                                            : 'text-amber-600'
                                                            }`} />
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-sm text-gray-900 dark:text-gray-100">
                                                            {producto.nombre}
                                                        </p>
                                                        <p className="text-xs text-gray-500">
                                                            Mínimo: {producto.stock_minimo}
                                                        </p>
                                                    </div>
                                                </div>
                                                <span className={`text-sm font-semibold ${status === 'sin_stock'
                                                    ? 'text-red-600'
                                                    : 'text-amber-600'
                                                    }`}>
                                                    {stock} uds
                                                </span>
                                            </li>
                                        );
                                    })}
                            </ul>
                        )}
                    </CardContent>
                </Card>

                {/* Acciones Rápidas */}
                <Card>
                    <CardContent className="p-6">
                        <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">
                            Acciones Rápidas
                        </h3>
                        <div className="grid grid-cols-2 gap-3">
                            <Link
                                href="/dashboard/inventario/productos"
                                className="p-4 rounded-lg bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors text-center group"
                            >
                                <Package className="w-6 h-6 mx-auto text-purple-600 mb-2 group-hover:scale-110 transition-transform" />
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Nuevo Producto
                                </span>
                            </Link>
                            <Link
                                href="/dashboard/inventario/proveedores"
                                className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors text-center group"
                            >
                                <Truck className="w-6 h-6 mx-auto text-blue-600 mb-2 group-hover:scale-110 transition-transform" />
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Nuevo Proveedor
                                </span>
                            </Link>
                            <Link
                                href="/dashboard/inventario/movimientos"
                                className="p-4 rounded-lg bg-amber-50 dark:bg-amber-900/20 hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors text-center group"
                            >
                                <ArrowRightLeft className="w-6 h-6 mx-auto text-amber-600 mb-2 group-hover:scale-110 transition-transform" />
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Registrar Entrada
                                </span>
                            </Link>
                            <Link
                                href="/dashboard/inventario/reportes"
                                className="p-4 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-colors text-center group"
                            >
                                <BarChart3 className="w-6 h-6 mx-auto text-emerald-600 mb-2 group-hover:scale-110 transition-transform" />
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Ver Reportes
                                </span>
                            </Link>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
