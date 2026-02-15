'use client';

import { useEffect, useState } from 'react';
import { useUbicacionStore } from '@/stores/inventarioStore';
import { movimientosApi } from '@/lib/api/inventario';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import {
    X,
    Loader2,
    Save,
    AlertCircle,
    Package,
    Plus,
    Minus,
    FileText,
    MapPin,
} from 'lucide-react';
import { toast } from 'sonner';
import { Producto, TipoMovimiento } from '@/types/inventario';

interface AjusteStockModalProps {
    isOpen: boolean;
    onClose: () => void;
    producto: Producto | null;
    onSuccess?: () => void;
}

const MOTIVOS_PREDEFINIDOS = [
    { value: 'inventario_inicial', label: 'Inventario inicial' },
    { value: 'correccion_conteo', label: 'Corrección por conteo físico' },
    { value: 'producto_danado', label: 'Producto dañado' },
    { value: 'producto_vencido', label: 'Producto vencido' },
    { value: 'devolucion_proveedor', label: 'Devolución a proveedor' },
    { value: 'bonificacion', label: 'Bonificación' },
    { value: 'muestra', label: 'Muestra / Demostración' },
    { value: 'error_registro', label: 'Error en registro anterior' },
    { value: 'otro', label: 'Otro motivo' },
];

export default function AjusteStockModal({ isOpen, onClose, producto, onSuccess }: AjusteStockModalProps) {
    const { ubicaciones, fetchUbicaciones } = useUbicacionStore();

    const [tipoAjuste, setTipoAjuste] = useState<'sumar' | 'restar'>('sumar');
    const [cantidad, setCantidad] = useState(1);
    const [motivoSeleccionado, setMotivoSeleccionado] = useState('');
    const [motivoPersonalizado, setMotivoPersonalizado] = useState('');
    const [notas, setNotas] = useState('');
    const [ubicacionId, setUbicacionId] = useState<number | null>(null);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isSaving, setIsSaving] = useState(false);

    // Cargar ubicaciones
    useEffect(() => {
        if (isOpen) {
            fetchUbicaciones();
        }
    }, [isOpen, fetchUbicaciones]);

    // Establecer ubicación por defecto cuando se carguen
    useEffect(() => {
        if (ubicaciones.length > 0 && !ubicacionId) {
            setUbicacionId(ubicaciones[0].id);
        }
    }, [ubicaciones, ubicacionId]);

    // Reset form when modal opens
    useEffect(() => {
        if (isOpen) {
            setTipoAjuste('sumar');
            setCantidad(1);
            setMotivoSeleccionado('');
            setMotivoPersonalizado('');
            setNotas('');
            if (ubicaciones.length > 0) {
                setUbicacionId(ubicaciones[0].id);
            }
            setErrors({});
        }
    }, [isOpen, ubicaciones]);

    const validate = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (cantidad <= 0) {
            newErrors.cantidad = 'La cantidad debe ser mayor a 0';
        }

        if (!motivoSeleccionado) {
            newErrors.motivo = 'Debe seleccionar un motivo';
        }

        if (motivoSeleccionado === 'otro' && !motivoPersonalizado.trim()) {
            newErrors.motivoPersonalizado = 'Debe especificar el motivo';
        }

        if (!ubicacionId) {
            newErrors.ubicacion = 'Debe seleccionar una ubicación';
        }

        // Validar que no reste más de lo disponible
        // Nota: Esto valida contra el stock TOTAL, lo ideal sería validar contra el stock de la ubicación
        // pero por simplicidad y UX inmediata lo mantenemos así, el backend hará la validación final.
        if (tipoAjuste === 'restar') {
            const stockActual = producto?.stock_total ?? 0;
            if (cantidad > stockActual) {
                newErrors.cantidad = `No puede restar más del stock actual (${stockActual})`;
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!producto || !validate() || !ubicacionId) return;

        setIsSaving(true);
        try {
            const motivo = motivoSeleccionado === 'otro'
                ? motivoPersonalizado
                : MOTIVOS_PREDEFINIDOS.find(m => m.value === motivoSeleccionado)?.label || motivoSeleccionado;

            const tipoMovimiento: TipoMovimiento = tipoAjuste === 'sumar' ? 'ajuste_positivo' : 'ajuste_negativo';

            await movimientosApi.create({
                producto_id: producto.id,
                ubicacion_destino_id: tipoAjuste === 'sumar' ? ubicacionId : undefined,
                ubicacion_origen_id: tipoAjuste === 'restar' ? ubicacionId : undefined,
                tipo_movimiento: tipoMovimiento,
                cantidad: cantidad,
                referencia: `Ajuste: ${motivo}`,
                motivo: notas.trim() || motivo,
            });

            const accion = tipoAjuste === 'sumar' ? 'aumentado' : 'reducido';
            toast.success(`Stock ${accion} en ${cantidad} unidades`);
            onSuccess?.();
            onClose();
        } catch (error) {
            console.error('Error al ajustar stock:', error);
            toast.error('Error al realizar el ajuste de stock. Verifique la ubicación y el stock disponible.');
        } finally {
            setIsSaving(false);
        }
    };

    const stockActual = producto?.stock_total ?? 0;
    const stockNuevo = tipoAjuste === 'sumar'
        ? stockActual + cantidad
        : Math.max(0, stockActual - cantidad);

    if (!isOpen || !producto) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="flex min-h-full items-center justify-center p-4">
                <div className="relative w-full max-w-md bg-white dark:bg-gray-900 rounded-xl shadow-2xl transform transition-all">
                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                                <Package className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                                    Ajustar Stock
                                </h2>
                                <p className="text-sm text-gray-500 truncate max-w-[200px]">
                                    {producto.nombre}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                        >
                            <X className="w-5 h-5 text-gray-500" />
                        </button>
                    </div>

                    {/* Content */}
                    <form onSubmit={handleSubmit}>
                        <div className="p-6 space-y-5">
                            {/* Stock Actual */}
                            <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800 text-center">
                                <p className="text-sm text-gray-500 dark:text-gray-400">Stock Actual (Total)</p>
                                <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                                    {stockActual}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">unidades</p>
                            </div>

                            {/* Tipo de Ajuste */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Tipo de ajuste
                                </label>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setTipoAjuste('sumar')}
                                        className={cn(
                                            'flex items-center justify-center gap-2 p-4 rounded-lg border-2 transition-all',
                                            tipoAjuste === 'sumar'
                                                ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                                                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                                        )}
                                    >
                                        <Plus className={cn(
                                            'w-5 h-5',
                                            tipoAjuste === 'sumar' ? 'text-green-600' : 'text-gray-400'
                                        )} />
                                        <span className={cn(
                                            'font-medium',
                                            tipoAjuste === 'sumar' ? 'text-green-700 dark:text-green-400' : 'text-gray-600 dark:text-gray-400'
                                        )}>
                                            Sumar
                                        </span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setTipoAjuste('restar')}
                                        className={cn(
                                            'flex items-center justify-center gap-2 p-4 rounded-lg border-2 transition-all',
                                            tipoAjuste === 'restar'
                                                ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                                                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                                        )}
                                    >
                                        <Minus className={cn(
                                            'w-5 h-5',
                                            tipoAjuste === 'restar' ? 'text-red-600' : 'text-gray-400'
                                        )} />
                                        <span className={cn(
                                            'font-medium',
                                            tipoAjuste === 'restar' ? 'text-red-700 dark:text-red-400' : 'text-gray-600 dark:text-gray-400'
                                        )}>
                                            Restar
                                        </span>
                                    </button>
                                </div>
                            </div>

                            {/* Ubicación */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Ubicación de Referencia *
                                </label>
                                <div className="relative">
                                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <select
                                        value={ubicacionId || ''}
                                        onChange={(e) => setUbicacionId(Number(e.target.value))}
                                        className={cn(
                                            'w-full pl-9 pr-3 py-2 border rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100',
                                            errors.ubicacion ? 'border-red-500' : 'border-gray-200 dark:border-gray-700'
                                        )}
                                    >
                                        <option value="">Seleccionar ubicación</option>
                                        {ubicaciones.map((u) => (
                                            <option key={u.id} value={u.id}>
                                                {u.nombre}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                {errors.ubicacion && (
                                    <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
                                        <AlertCircle className="w-3 h-3" />
                                        {errors.ubicacion}
                                    </p>
                                )}
                            </div>

                            {/* Cantidad */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Cantidad a {tipoAjuste === 'sumar' ? 'agregar' : 'retirar'} *
                                </label>
                                <div className="flex items-center gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setCantidad(Math.max(1, cantidad - 1))}
                                        className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800"
                                    >
                                        <Minus className="w-4 h-4" />
                                    </button>
                                    <Input
                                        type="number"
                                        min="1"
                                        value={cantidad}
                                        onChange={(e) => setCantidad(parseInt(e.target.value) || 1)}
                                        className={cn('text-center text-lg font-semibold flex-1', errors.cantidad && 'border-red-500')}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setCantidad(cantidad + 1)}
                                        className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800"
                                    >
                                        <Plus className="w-4 h-4" />
                                    </button>
                                </div>
                                {errors.cantidad && (
                                    <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
                                        <AlertCircle className="w-3 h-3" />
                                        {errors.cantidad}
                                    </p>
                                )}
                            </div>

                            {/* Vista previa del nuevo stock */}
                            <div className={cn(
                                'p-3 rounded-lg flex items-center justify-between',
                                tipoAjuste === 'sumar'
                                    ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                                    : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
                            )}>
                                <span className="text-sm text-gray-600 dark:text-gray-400">
                                    Stock total después del ajuste:
                                </span>
                                <span className={cn(
                                    'text-lg font-bold',
                                    tipoAjuste === 'sumar' ? 'text-green-600' : 'text-red-600'
                                )}>
                                    {stockNuevo} uds
                                </span>
                            </div>

                            {/* Motivo */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Motivo del ajuste *
                                </label>
                                <select
                                    value={motivoSeleccionado}
                                    onChange={(e) => setMotivoSeleccionado(e.target.value)}
                                    className={cn(
                                        'w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100',
                                        errors.motivo ? 'border-red-500' : 'border-gray-200 dark:border-gray-700'
                                    )}
                                >
                                    <option value="">Seleccionar motivo</option>
                                    {MOTIVOS_PREDEFINIDOS.map((motivo) => (
                                        <option key={motivo.value} value={motivo.value}>
                                            {motivo.label}
                                        </option>
                                    ))}
                                </select>
                                {errors.motivo && (
                                    <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
                                        <AlertCircle className="w-3 h-3" />
                                        {errors.motivo}
                                    </p>
                                )}
                            </div>

                            {/* Motivo personalizado */}
                            {motivoSeleccionado === 'otro' && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Especifique el motivo *
                                    </label>
                                    <Input
                                        value={motivoPersonalizado}
                                        onChange={(e) => setMotivoPersonalizado(e.target.value)}
                                        placeholder="Describa el motivo del ajuste"
                                        className={cn(errors.motivoPersonalizado && 'border-red-500')}
                                    />
                                    {errors.motivoPersonalizado && (
                                        <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
                                            <AlertCircle className="w-3 h-3" />
                                            {errors.motivoPersonalizado}
                                        </p>
                                    )}
                                </div>
                            )}

                            {/* Notas adicionales */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Notas adicionales
                                </label>
                                <div className="relative">
                                    <FileText className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                                    <textarea
                                        value={notas}
                                        onChange={(e) => setNotas(e.target.value)}
                                        placeholder="Observaciones opcionales..."
                                        rows={2}
                                        className="w-full pl-10 px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 resize-none focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 rounded-b-xl">
                            <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>
                                Cancelar
                            </Button>
                            <Button
                                type="submit"
                                disabled={isSaving}
                                className={cn(
                                    tipoAjuste === 'sumar'
                                        ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700'
                                        : 'bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700'
                                )}
                            >
                                {isSaving ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Ajustando...
                                    </>
                                ) : (
                                    <>
                                        <Save className="w-4 h-4 mr-2" />
                                        {tipoAjuste === 'sumar' ? 'Agregar' : 'Retirar'} {cantidad} uds
                                    </>
                                )}
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
