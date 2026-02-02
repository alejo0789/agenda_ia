'use client';

import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatPrecio } from '@/types/inventario';
import { cn } from '@/lib/utils';
import {
    Package,
    TrendingUp,
    TrendingDown,
    ShoppingCart,
    Calendar,
    User,
    MapPin,
    FileText,
    Loader2,
    X,
    ArrowUpCircle,
    ArrowDownCircle,
    RefreshCw,
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';
import apiClient from '@/lib/api/client';

interface MovimientoInventario {
    id: number;
    tipo_movimiento: string;
    cantidad: number;
    ubicacion_origen: string | null;
    ubicacion_destino: string | null;
    costo_unitario: number | null;
    costo_total: number | null;
    motivo: string | null;
    referencia: string | null;
    usuario: string | null;
    fecha_movimiento: string;
}

interface VentaProducto {
    id: number;
    factura_id: number;
    numero_factura: string;
    cantidad: number;
    precio_unitario: number;
    descuento_linea: number;
    subtotal: number;
    fecha: string;
    cliente_id: number | null;
    especialista_id: number | null;
    usuario: string | null;
}

interface HistorialProductoModalProps {
    isOpen: boolean;
    onClose: () => void;
    productoId: number | null;
    productoNombre: string;
}

const TIPO_MOVIMIENTO_LABELS: Record<string, string> = {
    compra: 'Compra',
    venta: 'Venta',
    ajuste_positivo: 'Ajuste +',
    ajuste_negativo: 'Ajuste -',
    transferencia: 'Transferencia',
    uso_interno: 'Uso Interno',
    devolucion: 'Devolución',
    merma: 'Merma',
    muestra: 'Muestra',
    donacion: 'Donación',
};

const TIPO_MOVIMIENTO_COLORS: Record<string, string> = {
    compra: 'text-green-600 bg-green-50 dark:bg-green-900/20',
    venta: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20',
    ajuste_positivo: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20',
    ajuste_negativo: 'text-orange-600 bg-orange-50 dark:bg-orange-900/20',
    transferencia: 'text-purple-600 bg-purple-50 dark:bg-purple-900/20',
    uso_interno: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20',
    devolucion: 'text-cyan-600 bg-cyan-50 dark:bg-cyan-900/20',
    merma: 'text-red-600 bg-red-50 dark:bg-red-900/20',
    muestra: 'text-pink-600 bg-pink-50 dark:bg-pink-900/20',
    donacion: 'text-amber-600 bg-amber-50 dark:bg-amber-900/20',
};

export default function HistorialProductoModal({
    isOpen,
    onClose,
    productoId,
    productoNombre,
}: HistorialProductoModalProps) {
    const [movimientos, setMovimientos] = useState<MovimientoInventario[]>([]);
    const [ventas, setVentas] = useState<VentaProducto[]>([]);
    const [isLoadingMovimientos, setIsLoadingMovimientos] = useState(false);
    const [isLoadingVentas, setIsLoadingVentas] = useState(false);
    const [activeTab, setActiveTab] = useState('movimientos');

    useEffect(() => {
        if (isOpen && productoId) {
            fetchMovimientos();
            fetchVentas();
        }
    }, [isOpen, productoId]);

    const fetchMovimientos = async () => {
        if (!productoId) return;

        setIsLoadingMovimientos(true);
        try {
            const response = await apiClient.get(`/productos/${productoId}/movimientos`, {
                params: { limit: 100 },
            });
            setMovimientos(response.data);
        } catch (error: any) {
            console.error('Error al cargar movimientos:', error);
            toast.error('Error al cargar movimientos de inventario');
        } finally {
            setIsLoadingMovimientos(false);
        }
    };

    const fetchVentas = async () => {
        if (!productoId) return;

        setIsLoadingVentas(true);
        try {
            const response = await apiClient.get(`/productos/${productoId}/ventas`, {
                params: { limit: 100 },
            });
            setVentas(response.data);
        } catch (error: any) {
            console.error('Error al cargar ventas:', error);
            toast.error('Error al cargar historial de ventas');
        } finally {
            setIsLoadingVentas(false);
        }
    };

    const getTipoMovimientoIcon = (tipo: string) => {
        const isPositive = ['compra', 'ajuste_positivo', 'devolucion'].includes(tipo);
        return isPositive ? (
            <ArrowUpCircle className="w-4 h-4" />
        ) : (
            <ArrowDownCircle className="w-4 h-4" />
        );
    };

    const formatFecha = (fecha: string) => {
        try {
            return format(new Date(fecha), "dd MMM yyyy, HH:mm", { locale: es });
        } catch {
            return fecha;
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
                <DialogHeader>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 flex items-center justify-center">
                                <Package className="w-5 h-5 text-purple-600" />
                            </div>
                            <div>
                                <DialogTitle className="text-xl">Historial del Producto</DialogTitle>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                    {productoNombre}
                                </p>
                            </div>
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                                fetchMovimientos();
                                fetchVentas();
                            }}
                        >
                            <RefreshCw className="w-4 h-4" />
                        </Button>
                    </div>
                </DialogHeader>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="movimientos" className="flex items-center gap-2">
                            <TrendingUp className="w-4 h-4" />
                            Movimientos de Inventario
                            {movimientos.length > 0 && (
                                <span className="ml-1 px-2 py-0.5 text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full">
                                    {movimientos.length}
                                </span>
                            )}
                        </TabsTrigger>
                        <TabsTrigger value="ventas" className="flex items-center gap-2">
                            <ShoppingCart className="w-4 h-4" />
                            Ventas
                            {ventas.length > 0 && (
                                <span className="ml-1 px-2 py-0.5 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full">
                                    {ventas.length}
                                </span>
                            )}
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="movimientos" className="flex-1 overflow-y-auto mt-4">
                        {isLoadingMovimientos ? (
                            <div className="flex items-center justify-center h-64">
                                <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
                            </div>
                        ) : movimientos.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                                <TrendingDown className="w-16 h-16 mb-4" />
                                <p className="text-lg font-medium">No hay movimientos registrados</p>
                                <p className="text-sm">Este producto aún no tiene movimientos de inventario</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {movimientos.map((mov) => (
                                    <div
                                        key={mov.id}
                                        className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow"
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-start gap-3 flex-1">
                                                <div
                                                    className={cn(
                                                        'p-2 rounded-lg',
                                                        TIPO_MOVIMIENTO_COLORS[mov.tipo_movimiento] ||
                                                        'text-gray-600 bg-gray-50'
                                                    )}
                                                >
                                                    {getTipoMovimientoIcon(mov.tipo_movimiento)}
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                                                            {TIPO_MOVIMIENTO_LABELS[mov.tipo_movimiento] ||
                                                                mov.tipo_movimiento}
                                                        </h4>
                                                        <span
                                                            className={cn(
                                                                'px-2 py-0.5 text-xs font-medium rounded-full',
                                                                ['compra', 'ajuste_positivo', 'devolucion'].includes(
                                                                    mov.tipo_movimiento
                                                                )
                                                                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                                                    : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                                            )}
                                                        >
                                                            {['compra', 'ajuste_positivo', 'devolucion'].includes(
                                                                mov.tipo_movimiento
                                                            )
                                                                ? '+'
                                                                : '-'}
                                                            {mov.cantidad} unidades
                                                        </span>
                                                    </div>

                                                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm text-gray-600 dark:text-gray-400">
                                                        {mov.ubicacion_origen && (
                                                            <div className="flex items-center gap-1.5">
                                                                <MapPin className="w-3.5 h-3.5" />
                                                                <span>Origen: {mov.ubicacion_origen}</span>
                                                            </div>
                                                        )}
                                                        {mov.ubicacion_destino && (
                                                            <div className="flex items-center gap-1.5">
                                                                <MapPin className="w-3.5 h-3.5" />
                                                                <span>Destino: {mov.ubicacion_destino}</span>
                                                            </div>
                                                        )}
                                                        {mov.referencia && (
                                                            <div className="flex items-center gap-1.5">
                                                                <FileText className="w-3.5 h-3.5" />
                                                                <span>Ref: {mov.referencia}</span>
                                                            </div>
                                                        )}
                                                        {mov.usuario && (
                                                            <div className="flex items-center gap-1.5">
                                                                <User className="w-3.5 h-3.5" />
                                                                <span>{mov.usuario}</span>
                                                            </div>
                                                        )}
                                                        <div className="flex items-center gap-1.5">
                                                            <Calendar className="w-3.5 h-3.5" />
                                                            <span>{formatFecha(mov.fecha_movimiento)}</span>
                                                        </div>
                                                        {mov.costo_total && (
                                                            <div className="flex items-center gap-1.5 font-medium text-gray-900 dark:text-gray-100">
                                                                <span>Costo: {formatPrecio(mov.costo_total)}</span>
                                                            </div>
                                                        )}
                                                    </div>

                                                    {mov.motivo && (
                                                        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 italic">
                                                            {mov.motivo}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="ventas" className="flex-1 overflow-y-auto mt-4">
                        {isLoadingVentas ? (
                            <div className="flex items-center justify-center h-64">
                                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                            </div>
                        ) : ventas.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                                <ShoppingCart className="w-16 h-16 mb-4" />
                                <p className="text-lg font-medium">No hay ventas registradas</p>
                                <p className="text-sm">Este producto aún no se ha vendido</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {ventas.map((venta) => (
                                    <div
                                        key={venta.id}
                                        className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow"
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-start gap-3 flex-1">
                                                <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600">
                                                    <ShoppingCart className="w-4 h-4" />
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                                                            Factura #{venta.numero_factura}
                                                        </h4>
                                                        <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                                                            {venta.cantidad} unidades
                                                        </span>
                                                    </div>

                                                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm text-gray-600 dark:text-gray-400">
                                                        <div className="flex items-center gap-1.5">
                                                            <span>Precio unitario:</span>
                                                            <span className="font-medium text-gray-900 dark:text-gray-100">
                                                                {formatPrecio(venta.precio_unitario)}
                                                            </span>
                                                        </div>
                                                        {venta.descuento_linea > 0 && (
                                                            <div className="flex items-center gap-1.5">
                                                                <span>Descuento:</span>
                                                                <span className="font-medium text-red-600">
                                                                    -{formatPrecio(venta.descuento_linea)}
                                                                </span>
                                                            </div>
                                                        )}
                                                        <div className="flex items-center gap-1.5">
                                                            <span>Subtotal:</span>
                                                            <span className="font-semibold text-gray-900 dark:text-gray-100">
                                                                {formatPrecio(venta.subtotal)}
                                                            </span>
                                                        </div>
                                                        {venta.usuario && (
                                                            <div className="flex items-center gap-1.5">
                                                                <User className="w-3.5 h-3.5" />
                                                                <span>{venta.usuario}</span>
                                                            </div>
                                                        )}
                                                        <div className="flex items-center gap-1.5 col-span-2">
                                                            <Calendar className="w-3.5 h-3.5" />
                                                            <span>{formatFecha(venta.fecha)}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </TabsContent>
                </Tabs>

                <div className="flex justify-end gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <Button variant="outline" onClick={onClose}>
                        <X className="w-4 h-4 mr-2" />
                        Cerrar
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
