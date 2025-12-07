'use client';

import { useState, useEffect } from 'react';
import { Especialista } from '@/types/especialista';
import { useEspecialistaStore } from '@/stores/especialistaStore';
import { useServicioStore } from '@/stores/servicioStore';
import { formatPrecio, calcularComisionPesos } from '@/types/servicio';
import { Button } from '@/components/ui/button';
import {
    X,
    Settings,
    Loader2,
    Check,
    Scissors,
    Plus,
    Percent,
    DollarSign,
    Trash2,
    Calculator,
    AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface ServiciosModalProps {
    especialista: Especialista;
    isOpen: boolean;
    onClose: () => void;
}

export default function ServiciosModal({
    especialista,
    isOpen,
    onClose,
}: ServiciosModalProps) {
    const {
        servicios: serviciosAsignados,
        fetchServicios,
        assignServicio,
        removeServicio,
        isLoading: isLoadingEspecialista,
    } = useEspecialistaStore();

    const {
        servicios: todosLosServicios,
        fetchServicios: fetchTodosServicios,
        isLoading: isLoadingServicios,
    } = useServicioStore();

    const [isSaving, setIsSaving] = useState(false);
    const [showAsignarForm, setShowAsignarForm] = useState(false);

    // Estado para nuevo servicio
    const [nuevoServicioId, setNuevoServicioId] = useState<number | null>(null);

    const isLoading = isLoadingEspecialista || isLoadingServicios;

    useEffect(() => {
        if (isOpen) {
            fetchServicios(especialista.id);
            fetchTodosServicios();
        }
    }, [isOpen, especialista.id, fetchServicios, fetchTodosServicios]);

    // Filtrar servicios activos que no están asignados
    const serviciosDisponibles = todosLosServicios.filter(
        (s) => s.estado === 'activo' && !serviciosAsignados.some((sa) => sa.servicio_id === s.id)
    );

    const handleAsignarServicio = async () => {
        if (!nuevoServicioId) {
            toast.error('Selecciona un servicio');
            return;
        }

        const servicioSeleccionado = todosLosServicios.find(s => s.id === nuevoServicioId);
        if (!servicioSeleccionado) {
            toast.error('Servicio no encontrado');
            return;
        }

        setIsSaving(true);
        try {
            // Usamos la comisión configurada en el servicio
            await assignServicio(especialista.id, {
                servicio_id: nuevoServicioId,
                tipo_comision: servicioSeleccionado.tipo_comision || 'porcentaje',
                valor_comision: Number(servicioSeleccionado.valor_comision) || 40,
            });
            toast.success('Servicio asignado exitosamente');
            setShowAsignarForm(false);
            setNuevoServicioId(null);
            // Refresh services
            fetchServicios(especialista.id);
        } catch (error: any) {
            toast.error(error.response?.data?.detail || 'Error al asignar servicio');
        } finally {
            setIsSaving(false);
        }
    };

    const handleRemoverServicio = async (servicioId: number) => {
        if (!confirm('¿Estás seguro de quitar este servicio del especialista?')) return;

        setIsSaving(true);
        try {
            await removeServicio(especialista.id, servicioId);
            toast.success('Servicio removido');
            fetchServicios(especialista.id);
        } catch (error: any) {
            toast.error(error.response?.data?.detail || 'Error al remover servicio');
        } finally {
            setIsSaving(false);
        }
    };

    const handleAsignarTodos = async () => {
        if (serviciosDisponibles.length === 0) return;

        if (!confirm(`¿Estás seguro de asignar los ${serviciosDisponibles.length} servicios disponibles a este especialista?`)) return;

        setIsSaving(true);
        try {
            // Creamos las promesas de asignación para todos los servicios disponibles
            const promesas = serviciosDisponibles.map(servicio =>
                assignServicio(especialista.id, {
                    servicio_id: servicio.id,
                    tipo_comision: servicio.tipo_comision || 'porcentaje',
                    valor_comision: Number(servicio.valor_comision) || 40,
                }).catch(err => {
                    console.error(`Error asignando servicio ${servicio.nombre}:`, err);
                    return null; // Continuar con los otros aunque uno falle
                })
            );

            await Promise.all(promesas);

            toast.success(`${serviciosDisponibles.length} servicios asignados exitosamente`);
            // Recargar la lista
            fetchServicios(especialista.id);
        } catch (error: any) {
            toast.error('Ocurrió un error en la asignación masiva');
        } finally {
            setIsSaving(false);
        }
    };

    const getServicioInfo = (servicioId: number) => {
        const servicio = todosLosServicios.find((s) => s.id === servicioId);
        return {
            nombre: servicio?.nombre || 'Servicio desconocido',
            precio: Number(servicio?.precio_base) || 0,
            tipo_comision: servicio?.tipo_comision,
            valor_comision: servicio?.valor_comision,
        };
    };

    const getNuevoServicioInfo = () => {
        if (!nuevoServicioId) return null;
        const servicio = todosLosServicios.find((s) => s.id === nuevoServicioId);
        if (!servicio) return null;
        return {
            nombre: servicio.nombre,
            precio: Number(servicio.precio_base),
            tipo_comision: servicio.tipo_comision || 'porcentaje',
            valor_comision: Number(servicio.valor_comision) || 0,
        };
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

            {/* Modal */}
            <div className="relative bg-white dark:bg-gray-900 rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
                            <Settings className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                                Asignación de Servicios
                            </h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                {especialista.nombre} {especialista.apellido}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* Botones de Acción */}
                    {!showAsignarForm && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <Button
                                onClick={() => setShowAsignarForm(true)}
                                disabled={serviciosDisponibles.length === 0}
                                className="bg-gradient-to-r from-purple-600 to-pink-600 shadow-sm"
                            >
                                <Plus className="w-4 h-4 mr-2" />
                                Asignar Individual
                            </Button>

                            <Button
                                onClick={handleAsignarTodos}
                                disabled={serviciosDisponibles.length === 0 || isSaving}
                                variant="outline"
                                className="border-purple-200 hover:bg-purple-50 text-purple-700 dark:border-purple-800 dark:hover:bg-purple-900/20 dark:text-purple-300"
                            >
                                {isSaving ? (
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                ) : (
                                    <Check className="w-4 h-4 mr-2" />
                                )}
                                Asignar Todos ({serviciosDisponibles.length})
                            </Button>
                        </div>
                    )}

                    {serviciosDisponibles.length === 0 && serviciosAsignados.length === 0 && !isLoading && (
                        <div className="text-center py-4 text-gray-500 bg-gray-50 dark:bg-gray-800 rounded-lg border border-dashed border-gray-300 dark:border-gray-700">
                            <Scissors className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                            No hay servicios disponibles para asignar.
                        </div>
                    )}

                    {/* Formulario Asignar Servicio */}
                    {showAsignarForm && (
                        <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 space-y-4 animate-in slide-in-from-top-2">
                            <h3 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center">
                                <Plus className="w-4 h-4 mr-2 text-purple-600" />
                                Asignar Servicio
                            </h3>

                            {/* Selector de Servicio */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Seleccionar Servicio
                                </label>
                                <select
                                    value={nuevoServicioId || ''}
                                    onChange={(e) => setNuevoServicioId(e.target.value ? Number(e.target.value) : null)}
                                    className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                                >
                                    <option value="">-- Seleccionar --</option>
                                    {serviciosDisponibles.map((s) => (
                                        <option key={s.id} value={s.id}>
                                            {s.nombre} - Base: {formatPrecio(Number(s.precio_base))}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Info de Comisión Automática */}
                            {nuevoServicioId && (
                                <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-purple-200 dark:border-purple-800">
                                    <div className="flex items-center gap-2 mb-2 text-purple-700 dark:text-purple-300">
                                        <AlertCircle className="w-4 h-4" />
                                        <span className="text-sm font-medium">Configuración del servicio</span>
                                    </div>

                                    {(() => {
                                        const info = getNuevoServicioInfo();
                                        if (!info) return null;

                                        const comisionPesos = calcularComisionPesos(
                                            info.tipo_comision,
                                            info.valor_comision,
                                            info.precio
                                        );

                                        return (
                                            <div className="text-sm space-y-1 text-gray-600 dark:text-gray-300">
                                                <p>La comisión se aplicará automáticamente según la configuración del servicio:</p>
                                                <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100 dark:border-gray-700">
                                                    <span>Tipo: <span className="font-medium capitalize">{info.tipo_comision}</span></span>
                                                    <span>Valor: <span className="font-medium">
                                                        {info.tipo_comision === 'porcentaje' ? `${info.valor_comision}%` : formatPrecio(info.valor_comision)}
                                                    </span></span>
                                                </div>
                                                <p className="text-right font-medium text-purple-600 mt-1">
                                                    Total estimado: {formatPrecio(comisionPesos)}
                                                </p>
                                            </div>
                                        );
                                    })()}
                                </div>
                            )}

                            {/* Botones */}
                            <div className="flex space-x-3">
                                <Button
                                    variant="outline"
                                    className="flex-1"
                                    onClick={() => {
                                        setShowAsignarForm(false);
                                        setNuevoServicioId(null);
                                    }}
                                >
                                    Cancelar
                                </Button>
                                <Button
                                    className="flex-1 bg-purple-600 hover:bg-purple-700"
                                    onClick={handleAsignarServicio}
                                    disabled={isSaving || !nuevoServicioId}
                                >
                                    {isSaving ? (
                                        <>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            Asignando...
                                        </>
                                    ) : (
                                        <>
                                            <Check className="w-4 h-4 mr-2" />
                                            Confirmar
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Lista de Servicios Asignados */}
                    <div className="space-y-3">
                        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center justify-between">
                            <span>Servicios Asignados</span>
                            <span className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 px-2 py-0.5 rounded-full text-xs">
                                {serviciosAsignados.length}
                            </span>
                        </h4>

                        {isLoading ? (
                            <div className="flex items-center justify-center py-8">
                                <Loader2 className="w-6 h-6 animate-spin text-purple-600" />
                            </div>
                        ) : serviciosAsignados.length === 0 ? (
                            <div className="text-center py-6 text-gray-500 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                <p>No hay servicios asignados a este especialista.</p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {serviciosAsignados.map((servicio) => {
                                    // Obtenemos los datos frescos del servicio (del catalogo) en vez de lo guardado en la relación,
                                    // para mostrar siempre la info actualizada si cambió en el servicio.
                                    // AUNQUE: la asignación tiene guardado snapshot.
                                    // Lo ideal seria mostrar lo que realmente se paga (snapshot) o indicar que se toma del servicio.
                                    // Dado que el requerimiento es "desde el servicio aplicar a todos", se entiende que es dinámico.
                                    // Pero el endpoint assignServicio guarda valores fijos en BD.
                                    // Por ahora mostraremos lo guardado en la asignación, ya que eso es lo que el backend usa para calcular nómina.
                                    // Si el usuario cambia el servicio master, debió usar el toggle "aplicar a todos" para actualizar asignaciones.

                                    const info = getServicioInfo(servicio.servicio_id);
                                    const comisionPesos = calcularComisionPesos(
                                        servicio.tipo_comision,
                                        servicio.valor_comision,
                                        info.precio
                                    );

                                    return (
                                        <div
                                            key={servicio.servicio_id}
                                            className="flex items-center justify-between p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                                        >
                                            <div className="flex items-center space-x-3 flex-1">
                                                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/20 dark:to-pink-900/20 flex items-center justify-center">
                                                    <Scissors className="w-5 h-5 text-purple-600" />
                                                </div>
                                                <div className="flex-1">
                                                    <p className="font-medium text-gray-900 dark:text-gray-100">
                                                        {info.nombre}
                                                    </p>
                                                    <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                                                        <span>Base: {formatPrecio(info.precio)}</span>
                                                        <span>•</span>
                                                        <span
                                                            className={cn(
                                                                'inline-flex items-center px-1.5 py-0.5 rounded',
                                                                servicio.tipo_comision === 'porcentaje'
                                                                    ? 'bg-blue-50 text-blue-700'
                                                                    : 'bg-green-50 text-green-700'
                                                            )}
                                                        >
                                                            {servicio.tipo_comision === 'porcentaje' ? (
                                                                <><Percent className="w-3 h-3 mr-1" />{servicio.valor_comision}%</>
                                                            ) : (
                                                                <><DollarSign className="w-3 h-3 mr-1" />{formatPrecio(servicio.valor_comision)}</>
                                                            )}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center space-x-3">
                                                <div className="text-right">
                                                    <p className="text-xs text-gray-500">Gana</p>
                                                    <p className="text-sm font-bold text-emerald-600">
                                                        {formatPrecio(comisionPesos)}
                                                    </p>
                                                </div>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => handleRemoverServicio(servicio.servicio_id)}
                                                    className="text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 h-8 w-8 p-0"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                    <Button type="button" variant="secondary" onClick={onClose} className="w-full">
                        Cerrar
                    </Button>
                </div>
            </div>
        </div>
    );
}
