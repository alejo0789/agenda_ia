'use client';

import { useState, useEffect } from 'react';
import { Especialista, HorarioFormData } from '@/types/especialista';
import { useEspecialistaStore } from '@/stores/especialistaStore';
import { Button } from '@/components/ui/button';
import {
    X,
    Calendar,
    Loader2,
    Check,
    Clock,
    ChevronDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface HorariosModalProps {
    especialista: Especialista;
    isOpen: boolean;
    onClose: () => void;
    isEspecialistaView?: boolean;
}

const DIAS_SEMANA = [
    { id: 1, nombre: 'Lunes', abrev: 'Lun' },
    { id: 2, nombre: 'Martes', abrev: 'Mar' },
    { id: 3, nombre: 'Miércoles', abrev: 'Mié' },
    { id: 4, nombre: 'Jueves', abrev: 'Jue' },
    { id: 5, nombre: 'Viernes', abrev: 'Vie' },
    { id: 6, nombre: 'Sábado', abrev: 'Sáb' },
    { id: 0, nombre: 'Domingo', abrev: 'Dom' },
];

// Generar opciones de hora (6:00 AM a 10:00 PM en intervalos de 15 min)
const generateTimeOptions = () => {
    const options: string[] = [];
    for (let hour = 6; hour <= 22; hour++) {
        for (let min = 0; min < 60; min += 15) {
            options.push(`${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`);
        }
    }
    return options;
};

const TIME_OPTIONS = generateTimeOptions();

// Horario por defecto
const DEFAULT_HORA_INICIO = '07:00';
const DEFAULT_HORA_FIN = '20:00';

interface DiaHorario {
    activo: boolean;
    hora_inicio: string;
    hora_fin: string;
}

export default function HorariosModal({
    especialista,
    isOpen,
    onClose,
    isEspecialistaView = false,
}: HorariosModalProps) {
    const { horarios, fetchHorarios, saveHorarios, isLoading } = useEspecialistaStore();

    // Estado inicial: todos los días activos con horario por defecto
    const [diasHorarios, setDiasHorarios] = useState<Record<number, DiaHorario>>(() => {
        const initial: Record<number, DiaHorario> = {};
        DIAS_SEMANA.forEach((dia) => {
            initial[dia.id] = {
                activo: true,
                hora_inicio: DEFAULT_HORA_INICIO,
                hora_fin: DEFAULT_HORA_FIN,
            };
        });
        return initial;
    });

    const [isSaving, setIsSaving] = useState(false);
    const [errors, setErrors] = useState<string[]>([]);
    const [warnings, setWarnings] = useState<string[]>([]);

    // Cargar horarios al abrir modal
    useEffect(() => {
        if (isOpen) {
            fetchHorarios(especialista.id);
        }
    }, [isOpen, especialista.id, fetchHorarios]);

    // Sincronizar horarios cargados con estado local
    useEffect(() => {
        if (horarios.length > 0) {
            const newDiasHorarios: Record<number, DiaHorario> = {};

            // Primero, inicializar todos los días como inactivos
            DIAS_SEMANA.forEach((dia) => {
                newDiasHorarios[dia.id] = {
                    activo: false,
                    hora_inicio: DEFAULT_HORA_INICIO,
                    hora_fin: DEFAULT_HORA_FIN,
                };
            });

            // Luego, marcar los días con horarios como activos
            horarios.forEach((h) => {
                if (h.activo) {
                    newDiasHorarios[h.dia_semana] = {
                        activo: true,
                        hora_inicio: h.hora_inicio,
                        hora_fin: h.hora_fin,
                    };
                }
            });

            setDiasHorarios(newDiasHorarios);
        }
    }, [horarios]);

    const [showWarningsConfirm, setShowWarningsConfirm] = useState(false);

    const toggleDia = (diaId: number) => {
        setDiasHorarios((prev) => ({
            ...prev,
            [diaId]: {
                ...prev[diaId],
                activo: !prev[diaId].activo,
            },
        }));
        // Limpiar advertencias al interactuar
        if (warnings.length > 0) setWarnings([]);
        setShowWarningsConfirm(false);
    };

    const updateHora = (diaId: number, tipo: 'hora_inicio' | 'hora_fin', valor: string) => {
        setDiasHorarios((prev) => ({
            ...prev,
            [diaId]: {
                ...prev[diaId],
                [tipo]: valor,
            },
        }));
        // Limpiar advertencias al interactuar
        if (warnings.length > 0) setWarnings([]);
        setShowWarningsConfirm(false);
    };

    const validate = (): { isValid: boolean; activeWarnings: string[] } => {
        const newErrors: string[] = [];
        const newWarnings: string[] = [];

        Object.entries(diasHorarios).forEach(([diaIdStr, horario]) => {
            const diaId = Number(diaIdStr);
            if (horario.activo && horario.hora_fin <= horario.hora_inicio) {
                const dia = DIAS_SEMANA.find((d) => d.id === diaId);
                newErrors.push(`${dia?.nombre}: La hora de fin debe ser mayor a la hora de inicio`);
            }

            // Advertencia de 24h para Especialistas
            if (isEspecialistaView && horario.activo) {
                // Calculamos si el día objetivo está a menos de 24h
                const now = new Date();
                const currentDay = now.getDay(); // 0-6
                const targetDay = diaId;

                // Calculamos diferencia en días
                let diffDays = (targetDay - currentDay + 7) % 7;
                if (diffDays === 0) diffDays = 7; // Si es el mismo día, asumimos próxima semana o analizamos hora

                // Si es "hoy" (0 días de diferencia lógica si ajustamos) o "mañana" (1 día)
                if (diffDays === 1) {
                    // Es mañana
                    const diaNombre = DIAS_SEMANA.find((d) => d.id === diaId)?.nombre;
                    newWarnings.push(
                        `⚠️ ${diaNombre}: Por la regla de 24h, este cambio aplicará a partir del PRÓXIMO ${diaNombre}, no para mañana.`
                    );
                }

                if (diffDays === 0) {
                    // Es hoy
                    const diaNombre = DIAS_SEMANA.find((d) => d.id === diaId)?.nombre;
                    newWarnings.push(
                        `⚠️ ${diaNombre}: No se pueden aplicar cambios para el mismo día. Aplicará para la próxima semana.`
                    );
                }
            }
        });

        setErrors(newErrors);
        setWarnings(newWarnings);
        return { isValid: newErrors.length === 0, activeWarnings: newWarnings };
    };

    const handleSave = async () => {
        const { isValid, activeWarnings } = validate();
        if (!isValid) return;

        // Si hay advertencias y no se ha confirmado
        if (activeWarnings.length > 0 && !showWarningsConfirm) {
            setShowWarningsConfirm(true);
            return;
        }

        setIsSaving(true);
        try {
            const horariosToSave: HorarioFormData[] = [];

            Object.entries(diasHorarios).forEach(([diaId, horario]) => {
                if (horario.activo) {
                    horariosToSave.push({
                        dia_semana: Number(diaId),
                        hora_inicio: horario.hora_inicio,
                        hora_fin: horario.hora_fin,
                        activo: true,
                    });
                }
            });

            await saveHorarios(especialista.id, horariosToSave);
            onClose();
        } catch (error) {
            console.error('Error al guardar horarios:', error);
        } finally {
            setIsSaving(false);
        }
    };


    const aplicarHorarioATodos = () => {
        const lunesHorario = diasHorarios[1];
        setDiasHorarios((prev) => {
            const newState = { ...prev };
            DIAS_SEMANA.forEach((dia) => {
                if (newState[dia.id].activo) {
                    newState[dia.id] = {
                        ...newState[dia.id],
                        hora_inicio: lunesHorario.hora_inicio,
                        hora_fin: lunesHorario.hora_fin,
                    };
                }
            });
            return newState;
        });
        if (warnings.length > 0) setWarnings([]);
        setShowWarningsConfirm(false);
    };

    const marcarLunesAViernes = () => {
        setDiasHorarios((prev) => {
            const newState = { ...prev };
            [1, 2, 3, 4, 5].forEach((id) => {
                newState[id].activo = true;
            });
            [0, 6].forEach((id) => {
                newState[id].activo = false;
            });
            return newState;
        });
        if (warnings.length > 0) setWarnings([]);
        setShowWarningsConfirm(false);
    };

    const calcularHorasTotales = () => {
        let total = 0;
        Object.values(diasHorarios).forEach((horario) => {
            if (horario.activo) {
                const [hiH, hiM] = horario.hora_inicio.split(':').map(Number);
                const [hfH, hfM] = horario.hora_fin.split(':').map(Number);
                total += hfH * 60 + hfM - (hiH * 60 + hiM);
            }
        });
        return (total / 60).toFixed(1);
    };

    const diasActivos = Object.values(diasHorarios).filter((h) => h.activo).length;

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
                        <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center">
                            <Calendar className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                                Horarios de Trabajo
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
                    {/* Errores */}
                    {errors.length > 0 && (
                        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                            <ul className="text-sm text-red-600 dark:text-red-400 list-disc list-inside">
                                {errors.map((e, i) => (
                                    <li key={i}>{e}</li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Advertencias */}
                    {warnings.length > 0 && (
                        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                            <h4 className="text-sm font-semibold text-yellow-800 dark:text-yellow-400 mb-2">
                                Atencion:
                            </h4>
                            <ul className="text-sm text-yellow-700 dark:text-yellow-300 list-disc list-inside space-y-1">
                                {warnings.map((w, i) => (
                                    <li key={i}>{w}</li>
                                ))}
                            </ul>
                            {showWarningsConfirm && (
                                <p className="text-xs text-yellow-600 dark:text-yellow-500 mt-2 font-medium">
                                    Presiona "Guardar Horarios" nuevamente para confirmar que entiendes estas condiciones.
                                </p>
                            )}
                        </div>
                    )}

                    {/* Acciones Rápidas */}
                    <div className="flex flex-wrap gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={marcarLunesAViernes}
                        >
                            Solo Lunes a Viernes
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={aplicarHorarioATodos}
                        >
                            Aplicar horario del Lunes a todos
                        </Button>
                    </div>

                    {/* Lista de Días */}
                    <div className="space-y-3">
                        {DIAS_SEMANA.map((dia) => {
                            const horario = diasHorarios[dia.id];
                            return (
                                <div
                                    key={dia.id}
                                    className={cn(
                                        'flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 rounded-lg border transition-all gap-3 sm:gap-0',
                                        horario.activo
                                            ? 'border-purple-200 dark:border-purple-800 bg-purple-50/50 dark:bg-purple-900/10'
                                            : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50'
                                    )}
                                >
                                    {/* Toggle y Nombre del Día */}
                                    <div className="flex items-center space-x-4 min-w-[160px]">
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={horario.activo}
                                                onChange={() => toggleDia(dia.id)}
                                                className="sr-only peer"
                                            />
                                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 dark:peer-focus:ring-purple-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-purple-600"></div>
                                        </label>
                                        <span
                                            className={cn(
                                                'font-medium',
                                                horario.activo
                                                    ? 'text-gray-900 dark:text-gray-100'
                                                    : 'text-gray-400 dark:text-gray-500'
                                            )}
                                        >
                                            {dia.nombre}
                                        </span>
                                    </div>

                                    {/* Selectores de Hora */}
                                    {horario.activo ? (
                                        <div className="flex items-center space-x-2 sm:space-x-3 w-full sm:w-auto justify-between sm:justify-end">
                                            <div className="flex items-center space-x-2 flex-1 sm:flex-none">
                                                <Clock className="w-4 h-4 text-gray-400 hidden sm:block" />
                                                <div className="relative w-full sm:w-auto">
                                                    <select
                                                        value={horario.hora_inicio}
                                                        onChange={(e) =>
                                                            updateHora(dia.id, 'hora_inicio', e.target.value)
                                                        }
                                                        className="w-full sm:w-auto appearance-none bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg pl-3 pr-8 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                                    >
                                                        {TIME_OPTIONS.map((time) => (
                                                            <option key={time} value={time}>
                                                                {time}
                                                            </option>
                                                        ))}
                                                    </select>
                                                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                                                </div>
                                            </div>

                                            <span className="text-gray-400 px-1">a</span>

                                            <div className="relative flex-1 sm:flex-none">
                                                <select
                                                    value={horario.hora_fin}
                                                    onChange={(e) =>
                                                        updateHora(dia.id, 'hora_fin', e.target.value)
                                                    }
                                                    className="w-full sm:w-auto appearance-none bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg pl-3 pr-8 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                                >
                                                    {TIME_OPTIONS.map((time) => (
                                                        <option key={time} value={time}>
                                                            {time}
                                                        </option>
                                                    ))}
                                                </select>
                                                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                                            </div>
                                        </div>
                                    ) : (
                                        <span className="text-gray-400 dark:text-gray-500 text-sm italic sm:text-right w-full sm:w-auto pl-14 sm:pl-0">
                                            No disponible
                                        </span>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {/* Resumen */}
                    <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg p-4">
                        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                            📊 Resumen Semanal
                        </h3>
                        <div className="grid grid-cols-2 gap-4 text-center">
                            <div>
                                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                                    {calcularHorasTotales()}h
                                </p>
                                <p className="text-xs text-gray-500">Horas semanales</p>
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                                    {diasActivos}
                                </p>
                                <p className="text-xs text-gray-500">Días laborales</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end space-x-3 px-6 py-4 border-t border-gray-200 dark:border-gray-700">
                    <Button type="button" variant="outline" onClick={onClose}>
                        Cancelar
                    </Button>
                    <Button
                        type="button"
                        onClick={handleSave}
                        disabled={isSaving || isLoading}
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
                                Guardar Horarios
                            </>
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
}
