'use client';

import { useState, useEffect } from 'react';
import { Especialista, Bloqueo, BloqueoFormData } from '@/types/especialista';
import { useEspecialistaStore } from '@/stores/especialistaStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    X,
    Ban,
    Plus,
    Edit,
    Trash2,
    Loader2,
    AlertCircle,
    Calendar,
    Clock,
    Check,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface BloqueosModalProps {
    especialista: Especialista;
    isOpen: boolean;
    onClose: () => void;
    isEspecialistaView?: boolean;
}

const DIAS_SEMANA = [
    { id: 0, nombre: 'Domingo', abrev: 'Dom' },
    { id: 1, nombre: 'Lunes', abrev: 'Lun' },
    { id: 2, nombre: 'Martes', abrev: 'Mar' },
    { id: 3, nombre: 'Miércoles', abrev: 'Mié' },
    { id: 4, nombre: 'Jueves', abrev: 'Jue' },
    { id: 5, nombre: 'Viernes', abrev: 'Vie' },
    { id: 6, nombre: 'Sábado', abrev: 'Sáb' },
];

export default function BloqueosModal({
    especialista,
    isOpen,
    onClose,
    isEspecialistaView = false,
}: BloqueosModalProps) {
    const {
        bloqueos,
        fetchBloqueos,
        createBloqueo,
        updateBloqueo,
        deleteBloqueo,
        isLoading,
    } = useEspecialistaStore();

    const [showForm, setShowForm] = useState(false);
    const [editingBloqueo, setEditingBloqueo] = useState<Bloqueo | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    const [formData, setFormData] = useState<BloqueoFormData>({
        fecha_inicio: '',
        fecha_fin: '',
        hora_inicio: '',
        hora_fin: '',
        motivo: '',
        es_recurrente: false,
        dias_semana: [],
    });

    const [todoElDia, setTodoElDia] = useState(true);
    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        if (isOpen) {
            fetchBloqueos(especialista.id);
        }
    }, [isOpen, especialista.id, fetchBloqueos]);

    const resetForm = () => {
        setFormData({
            fecha_inicio: '',
            fecha_fin: '',
            hora_inicio: '',
            hora_fin: '',
            motivo: '',
            es_recurrente: false,
            dias_semana: [],
        });
        setTodoElDia(true);
        setEditingBloqueo(null);
        setErrors({});
    };

    const handleEdit = (bloqueo: Bloqueo) => {
        setEditingBloqueo(bloqueo);
        setFormData({
            fecha_inicio: bloqueo.fecha_inicio.split('T')[0],
            fecha_fin: bloqueo.fecha_fin.split('T')[0],
            hora_inicio: bloqueo.hora_inicio || '',
            hora_fin: bloqueo.hora_fin || '',
            motivo: bloqueo.motivo || '',
            es_recurrente: bloqueo.es_recurrente,
            dias_semana: bloqueo.dias_semana || [],
        });
        setTodoElDia(!bloqueo.hora_inicio);
        setShowForm(true);
    };

    const handleDelete = async (bloqueoId: number) => {
        if (confirm('¿Estás seguro de eliminar este bloqueo?')) {
            try {
                await deleteBloqueo(especialista.id, bloqueoId);
            } catch (error) {
                console.error('Error al eliminar bloqueo:', error);
            }
        }
    };

    const validate = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!formData.fecha_inicio) {
            newErrors.fecha_inicio = 'La fecha inicio es requerida';
        }

        if (!formData.fecha_fin) {
            newErrors.fecha_fin = 'La fecha fin es requerida';
        }

        // Validación de 24 horas de anticipación (Solo para Especialistas)
        if (isEspecialistaView && formData.fecha_inicio) {
            const fechaInicio = new Date(formData.fecha_inicio + 'T00:00:00');
            const ahora = new Date();
            const horasAnticipacion = (fechaInicio.getTime() - ahora.getTime()) / (1000 * 60 * 60);

            if (horasAnticipacion < 24) {
                newErrors.fecha_inicio = 'El bloqueo debe crearse con al menos 24 horas de anticipación';
            }
        }

        if (formData.fecha_inicio && formData.fecha_fin && formData.fecha_fin < formData.fecha_inicio) {
            newErrors.fecha_fin = 'La fecha fin debe ser igual o posterior a la fecha inicio';
        }

        if (!todoElDia) {
            if (!formData.hora_inicio) {
                newErrors.hora_inicio = 'La hora inicio es requerida';
            }
            if (!formData.hora_fin) {
                newErrors.hora_fin = 'La hora fin es requerida';
            }
            if (formData.hora_inicio && formData.hora_fin && formData.hora_fin <= formData.hora_inicio) {
                newErrors.hora_fin = 'La hora fin debe ser mayor a la hora inicio';
            }
        }

        if (formData.es_recurrente && (!formData.dias_semana || formData.dias_semana.length === 0)) {
            newErrors.dias_semana = 'Selecciona al menos un día de la semana';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;

        setIsSaving(true);
        try {
            const dataToSubmit: BloqueoFormData = {
                fecha_inicio: formData.fecha_inicio,
                fecha_fin: formData.fecha_fin,
                motivo: formData.motivo || undefined,
                es_recurrente: formData.es_recurrente,
                dias_semana: formData.es_recurrente ? formData.dias_semana : undefined,
            };

            if (!todoElDia) {
                dataToSubmit.hora_inicio = formData.hora_inicio;
                dataToSubmit.hora_fin = formData.hora_fin;
            }

            if (editingBloqueo) {
                await updateBloqueo(especialista.id, editingBloqueo.id, dataToSubmit);
            } else {
                await createBloqueo(especialista.id, dataToSubmit);
            }

            resetForm();
            setShowForm(false);
        } catch (error) {
            console.error('Error al guardar bloqueo:', error);
        } finally {
            setIsSaving(false);
        }
    };

    const toggleDiaSemana = (dia: number) => {
        const current = formData.dias_semana || [];
        if (current.includes(dia)) {
            setFormData((prev) => ({
                ...prev,
                dias_semana: current.filter((d) => d !== dia),
            }));
        } else {
            setFormData((prev) => ({
                ...prev,
                dias_semana: [...current, dia],
            }));
        }
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('es-CO', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
        });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/50" onClick={onClose} />

            {/* Modal */}
            <div className="relative bg-white dark:bg-gray-900 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-lg bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
                            <Ban className="w-5 h-5 text-red-600 dark:text-red-400" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                                Bloqueos
                            </h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                {especialista.nombre} {especialista.apellido}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center space-x-2">
                        {!showForm && (
                            <Button
                                size="sm"
                                onClick={() => {
                                    resetForm();
                                    setShowForm(true);
                                }}
                                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                            >
                                <Plus className="w-4 h-4 mr-1" />
                                Nuevo Bloqueo
                            </Button>
                        )}
                        <button
                            onClick={onClose}
                            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {showForm ? (
                        /* Formulario de Bloqueo */
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-medium text-gray-900 dark:text-gray-100">
                                    {editingBloqueo ? 'Editar Bloqueo' : 'Nuevo Bloqueo'}
                                </h3>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                        resetForm();
                                        setShowForm(false);
                                    }}
                                >
                                    Cancelar
                                </Button>
                            </div>

                            {/* Tipo de bloqueo */}
                            <div className="space-y-3">
                                <Label>Tipo de Bloqueo</Label>
                                <div className="flex space-x-4">
                                    <label
                                        className={cn(
                                            'flex-1 p-4 border rounded-lg cursor-pointer transition-colors',
                                            !formData.es_recurrente
                                                ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                                                : 'border-gray-200 dark:border-gray-700'
                                        )}
                                    >
                                        <input
                                            type="radio"
                                            name="tipo"
                                            checked={!formData.es_recurrente}
                                            onChange={() =>
                                                setFormData((prev) => ({ ...prev, es_recurrente: false }))
                                            }
                                            className="sr-only"
                                        />
                                        <div className="text-center">
                                            <div className="font-medium">Puntual</div>
                                            <div className="text-sm text-gray-500">
                                                Bloqueo único en fechas específicas
                                            </div>
                                        </div>
                                    </label>
                                    <label
                                        className={cn(
                                            'flex-1 p-4 border rounded-lg cursor-pointer transition-colors',
                                            formData.es_recurrente
                                                ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                                                : 'border-gray-200 dark:border-gray-700'
                                        )}
                                    >
                                        <input
                                            type="radio"
                                            name="tipo"
                                            checked={formData.es_recurrente}
                                            onChange={() =>
                                                setFormData((prev) => ({ ...prev, es_recurrente: true }))
                                            }
                                            className="sr-only"
                                        />
                                        <div className="text-center">
                                            <div className="font-medium">Recurrente</div>
                                            <div className="text-sm text-gray-500">
                                                Se repite periódicamente
                                            </div>
                                        </div>
                                    </label>
                                </div>
                            </div>

                            {/* Fechas */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="fecha_inicio">
                                        Fecha Inicio <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        type="date"
                                        id="fecha_inicio"
                                        value={formData.fecha_inicio}
                                        onChange={(e) =>
                                            setFormData((prev) => ({
                                                ...prev,
                                                fecha_inicio: e.target.value,
                                            }))
                                        }
                                        className={errors.fecha_inicio ? 'border-red-500' : ''}
                                    />
                                    {errors.fecha_inicio && (
                                        <p className="text-xs text-red-500">{errors.fecha_inicio}</p>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="fecha_fin">
                                        Fecha Fin <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        type="date"
                                        id="fecha_fin"
                                        value={formData.fecha_fin}
                                        onChange={(e) =>
                                            setFormData((prev) => ({
                                                ...prev,
                                                fecha_fin: e.target.value,
                                            }))
                                        }
                                        className={errors.fecha_fin ? 'border-red-500' : ''}
                                    />
                                    {errors.fecha_fin && (
                                        <p className="text-xs text-red-500">{errors.fecha_fin}</p>
                                    )}
                                </div>
                            </div>

                            {/* Horario */}
                            <div className="space-y-3">
                                <Label>Horario</Label>
                                <div className="flex space-x-4">
                                    <label className="flex items-center space-x-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            checked={todoElDia}
                                            onChange={() => setTodoElDia(true)}
                                            className="text-purple-600"
                                        />
                                        <span>Todo el día</span>
                                    </label>
                                    <label className="flex items-center space-x-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            checked={!todoElDia}
                                            onChange={() => setTodoElDia(false)}
                                            className="text-purple-600"
                                        />
                                        <span>Horario específico</span>
                                    </label>
                                </div>

                                {!todoElDia && (
                                    <div className="grid grid-cols-2 gap-4 mt-3">
                                        <div className="space-y-2">
                                            <Label htmlFor="hora_inicio">Hora Inicio</Label>
                                            <Input
                                                type="time"
                                                id="hora_inicio"
                                                value={formData.hora_inicio}
                                                onChange={(e) =>
                                                    setFormData((prev) => ({
                                                        ...prev,
                                                        hora_inicio: e.target.value,
                                                    }))
                                                }
                                                className={errors.hora_inicio ? 'border-red-500' : ''}
                                            />
                                            {errors.hora_inicio && (
                                                <p className="text-xs text-red-500">{errors.hora_inicio}</p>
                                            )}
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="hora_fin">Hora Fin</Label>
                                            <Input
                                                type="time"
                                                id="hora_fin"
                                                value={formData.hora_fin}
                                                onChange={(e) =>
                                                    setFormData((prev) => ({
                                                        ...prev,
                                                        hora_fin: e.target.value,
                                                    }))
                                                }
                                                className={errors.hora_fin ? 'border-red-500' : ''}
                                            />
                                            {errors.hora_fin && (
                                                <p className="text-xs text-red-500">{errors.hora_fin}</p>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Días de semana (solo recurrente) */}
                            {formData.es_recurrente && (
                                <div className="space-y-3">
                                    <Label>
                                        Días de la Semana <span className="text-red-500">*</span>
                                    </Label>
                                    <div className="flex flex-wrap gap-2">
                                        {DIAS_SEMANA.map((dia) => (
                                            <button
                                                key={dia.id}
                                                type="button"
                                                onClick={() => toggleDiaSemana(dia.id)}
                                                className={cn(
                                                    'px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                                                    formData.dias_semana?.includes(dia.id)
                                                        ? 'bg-purple-600 text-white'
                                                        : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                                                )}
                                            >
                                                {dia.nombre}
                                            </button>
                                        ))}
                                    </div>
                                    {errors.dias_semana && (
                                        <p className="text-xs text-red-500">{errors.dias_semana}</p>
                                    )}
                                </div>
                            )}

                            {/* Motivo */}
                            <div className="space-y-2">
                                <Label htmlFor="motivo">Motivo / Descripción</Label>
                                <Input
                                    id="motivo"
                                    value={formData.motivo}
                                    onChange={(e) =>
                                        setFormData((prev) => ({ ...prev, motivo: e.target.value }))
                                    }
                                    placeholder="Ej: Vacaciones, Cita médica, Capacitación..."
                                />
                            </div>

                            {/* Submit */}
                            <div className="flex justify-end">
                                <Button
                                    type="submit"
                                    disabled={isSaving}
                                    className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                                >
                                    {isSaving ? (
                                        <>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            Guardando...
                                        </>
                                    ) : (
                                        <>
                                            <Check className="w-4 h-4 mr-2" />
                                            {editingBloqueo ? 'Actualizar' : 'Crear Bloqueo'}
                                        </>
                                    )}
                                </Button>
                            </div>
                        </form>
                    ) : (
                        /* Lista de Bloqueos */
                        <div className="space-y-4">
                            {isLoading ? (
                                <div className="flex items-center justify-center py-8">
                                    <Loader2 className="w-6 h-6 animate-spin text-purple-600" />
                                </div>
                            ) : bloqueos.length === 0 ? (
                                <div className="text-center py-8">
                                    <Ban className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                                    <p className="text-gray-500 dark:text-gray-400">
                                        No hay bloqueos configurados
                                    </p>
                                    <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                                        Crea un bloqueo para indicar períodos de no disponibilidad
                                    </p>
                                </div>
                            ) : (
                                bloqueos.map((bloqueo) => (
                                    <div
                                        key={bloqueo.id}
                                        className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="space-y-1">
                                                <div className="flex items-center space-x-2">
                                                    <Calendar className="w-4 h-4 text-gray-400" />
                                                    <span className="font-medium">
                                                        {formatDate(bloqueo.fecha_inicio)}
                                                        {bloqueo.fecha_inicio !== bloqueo.fecha_fin &&
                                                            ` - ${formatDate(bloqueo.fecha_fin)}`}
                                                    </span>
                                                    <span
                                                        className={cn(
                                                            'px-2 py-0.5 text-xs rounded-full',
                                                            bloqueo.es_recurrente
                                                                ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
                                                                : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400'
                                                        )}
                                                    >
                                                        {bloqueo.es_recurrente ? 'Recurrente' : 'Puntual'}
                                                    </span>
                                                </div>
                                                <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                                                    <Clock className="w-4 h-4" />
                                                    <span>
                                                        {bloqueo.hora_inicio
                                                            ? `${bloqueo.hora_inicio} - ${bloqueo.hora_fin}`
                                                            : 'Todo el día'}
                                                    </span>
                                                </div>
                                                {bloqueo.motivo && (
                                                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                                                        📝 {bloqueo.motivo}
                                                    </p>
                                                )}
                                                {bloqueo.es_recurrente && bloqueo.dias_semana && (
                                                    <div className="flex flex-wrap gap-1 mt-2">
                                                        {bloqueo.dias_semana.map((dia) => (
                                                            <span
                                                                key={dia}
                                                                className="px-2 py-0.5 text-xs bg-purple-100 dark:bg-purple-900/20 text-purple-800 dark:text-purple-400 rounded"
                                                            >
                                                                {DIAS_SEMANA.find((d) => d.id === dia)?.abrev}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex space-x-1">
                                                <button
                                                    onClick={() => handleEdit(bloqueo)}
                                                    className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(bloqueo.id)}
                                                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                {!showForm && (
                    <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
                        <Button type="button" variant="outline" onClick={onClose} className="w-full">
                            Cerrar
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}
