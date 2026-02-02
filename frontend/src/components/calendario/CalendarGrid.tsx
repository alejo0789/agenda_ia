'use client';

import { useMemo, useState } from 'react';
import { isToday, format } from 'date-fns';
import { CitaCard } from './CitaCard';
import { Lock } from 'lucide-react';

interface Especialista {
    id: number;
    nombre: string;
    apellido?: string;
    iniciales: string;
    color: string;
}

interface Cliente {
    nombre: string;
    telefono: string | null;
}

interface Cita {
    id: number;
    cliente_id: number;
    cliente: Cliente;
    especialista_id: number;
    servicio_id: number;
    servicio: string;
    hora_inicio: string;
    hora_fin: string;
    duracion: number;
    estado: string;
    notas: string | null;
}

interface Disponibilidad {
    horasDisponibles: Set<string>;
    bloqueados: Set<string>;
}

interface CalendarGridProps {
    especialistas: Especialista[];
    citas: Cita[];
    selectedDate: Date;
    disponibilidad: Record<number, Disponibilidad>;
    onSlotClick: (especialistaId: number, hora: string) => void;
    onCitaClick: (cita: Cita) => void;
    onCitaDrop: (citaId: number, newEspecialistaId: number, newHora: string) => void;
    isLoading: boolean;
}

// Generar rangos de tiempo de 6:00 AM a 10:00 PM en intervalos de 15 minutos
const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 6; hour <= 22; hour++) {
        for (let minute = 0; minute < 60; minute += 15) {
            if (hour === 22 && minute > 0) break;
            slots.push({
                time: `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`,
                label: minute === 0 ? `${hour > 12 ? hour - 12 : hour}:00 ${hour >= 12 ? 'PM' : 'AM'}` : null
            });
        }
    }
    return slots;
};

const TIME_SLOTS = generateTimeSlots();
const SLOT_HEIGHT = 20;

export function CalendarGrid({
    especialistas,
    citas,
    selectedDate,
    disponibilidad,
    onSlotClick,
    onCitaClick,
    onCitaDrop,
    isLoading
}: CalendarGridProps) {
    const [draggedCita, setDraggedCita] = useState<Cita | null>(null);
    const [dragOverSlot, setDragOverSlot] = useState<{ especialistaId: number; hora: string } | null>(null);

    // Calcular la posición de la línea de hora actual
    const currentTimePosition = useMemo(() => {
        if (!isToday(selectedDate)) return null;

        const now = new Date();
        const hours = now.getHours();
        const minutes = now.getMinutes();

        if (hours < 6 || hours > 22) return null;

        const minutesSince6AM = (hours - 6) * 60 + minutes;
        return minutesSince6AM * (SLOT_HEIGHT / 15);
    }, [selectedDate]);

    // Agrupar citas por especialista
    const citasPorEspecialista = useMemo(() => {
        const grouped: Record<number, Cita[]> = {};
        especialistas.forEach(e => {
            grouped[e.id] = citas.filter(c => c.especialista_id === e.id);
        });
        return grouped;
    }, [citas, especialistas]);

    // Contar citas por especialista
    const contarCitas = (especialistaId: number) => {
        return citasPorEspecialista[especialistaId]?.length || 0;
    };

    const handleDragStart = (e: React.DragEvent, cita: Cita) => {
        setDraggedCita(cita);
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', String(cita.id));
    };

    const handleDragOver = (e: React.DragEvent, especialistaId: number, hora: string) => {
        const disp = disponibilidad[especialistaId];
        if (!disp || disp.bloqueados.has(hora) || !disp.horasDisponibles.has(hora)) {
            e.dataTransfer.dropEffect = 'none';
            return;
        }

        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        setDragOverSlot({ especialistaId, hora });
    };

    const handleDragLeave = () => {
        setDragOverSlot(null);
    };

    const handleDrop = (e: React.DragEvent, especialistaId: number, hora: string) => {
        e.preventDefault();
        const citaId = parseInt(e.dataTransfer.getData('text/plain'));
        onCitaDrop(citaId, especialistaId, hora);
        setDraggedCita(null);
        setDragOverSlot(null);
    };

    const handleDragEnd = () => {
        setDraggedCita(null);
        setDragOverSlot(null);
    };

    // Determinar el estado de un slot
    const getSlotState = (especialistaId: number, hora: string): 'available' | 'unavailable' | 'blocked' => {
        const disp = disponibilidad[especialistaId];
        if (!disp) return 'unavailable';
        if (disp.bloqueados.has(hora)) return 'blocked';
        if (!disp.horasDisponibles.has(hora)) return 'unavailable';
        return 'available';
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
            </div>
        );
    }

    return (
        <div className="relative">
            {/* Header con Especialistas */}
            <div className="sticky top-0 z-20 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
                <div className="flex">
                    {/* Columna de Horas (vacía en el header) - sticky */}
                    <div className="w-20 flex-shrink-0 border-r border-gray-200 dark:border-gray-800 p-2 sticky left-0 bg-white dark:bg-gray-900 z-10">
                        <span className="text-xs text-gray-500 dark:text-gray-400">Hora</span>
                    </div>

                    {/* Headers de Especialistas */}
                    {especialistas.map((especialista) => (
                        <div
                            key={especialista.id}
                            className="flex-1 min-w-[180px] border-r border-gray-200 dark:border-gray-800 p-3"
                        >
                            <div className="flex items-center gap-3">
                                <div
                                    className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm shadow-md"
                                    style={{ backgroundColor: especialista.color }}
                                >
                                    {especialista.iniciales}
                                </div>
                                <div>
                                    <p className="font-medium text-gray-900 dark:text-white text-sm">
                                        {especialista.nombre} {especialista.apellido || ''}
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                        {contarCitas(especialista.id)} cita{contarCitas(especialista.id) !== 1 ? 's' : ''}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Grid de Horas y Citas */}
            <div className="relative">
                {/* Línea de Hora Actual */}
                {currentTimePosition !== null && (
                    <div
                        className="absolute left-0 right-0 z-10 pointer-events-none"
                        style={{ top: `${currentTimePosition}px` }}
                    >
                        <div className="flex items-center">
                            <div className="w-20 flex-shrink-0 flex justify-end pr-2">
                                <span className="text-xs font-medium text-red-500 bg-red-100 dark:bg-red-900/30 px-1.5 py-0.5 rounded">
                                    {format(new Date(), 'HH:mm')}
                                </span>
                            </div>
                            <div className="flex-1 h-0.5 bg-red-500 shadow-sm shadow-red-500/50"></div>
                        </div>
                    </div>
                )}

                {/* Filas de Tiempo */}
                <div className="flex">
                    {/* Columna de Horas - sticky */}
                    <div className="w-20 flex-shrink-0 sticky left-0 bg-white dark:bg-gray-900 z-10">
                        {TIME_SLOTS.map((slot) => (
                            <div
                                key={slot.time}
                                className={`border-b border-r border-gray-200 dark:border-gray-800 px-2 relative ${slot.label ? 'border-gray-200 dark:border-gray-700' : 'border-gray-100 dark:border-gray-800'}`}
                                style={{ height: `${SLOT_HEIGHT}px` }}
                            >
                                {slot.label && (
                                    <span className="absolute -top-2 right-2 text-xs text-gray-500 dark:text-gray-400 font-medium">
                                        {slot.label}
                                    </span>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Columnas de Especialistas con Citas */}
                    {especialistas.map((especialista) => (
                        <div key={especialista.id} className="flex-1 min-w-[180px] relative">
                            {/* Slots de tiempo para este especialista */}
                            {TIME_SLOTS.map((slot) => {
                                const slotState = getSlotState(especialista.id, slot.time);
                                const isDropTarget = dragOverSlot?.especialistaId === especialista.id &&
                                    dragOverSlot?.hora === slot.time;

                                return (
                                    <div
                                        key={`${especialista.id}-${slot.time}`}
                                        className={`
                      border-b border-r border-gray-200 dark:border-gray-800 transition-colors relative
                      ${slotState === 'available'
                                                ? `cursor-pointer ${isDropTarget ? 'bg-purple-100 dark:bg-purple-900/30' : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'}`
                                                : slotState === 'blocked'
                                                    ? 'bg-red-50 dark:bg-red-900/10 cursor-not-allowed'
                                                    : 'bg-gray-100 dark:bg-gray-800/50 cursor-not-allowed'
                                            }
                    `}
                                        style={{ height: `${SLOT_HEIGHT}px` }}
                                        onClick={() => slotState === 'available' && onSlotClick(especialista.id, slot.time)}
                                        onDragOver={(e) => handleDragOver(e, especialista.id, slot.time)}
                                        onDragLeave={handleDragLeave}
                                        onDrop={(e) => slotState === 'available' && handleDrop(e, especialista.id, slot.time)}
                                    >
                                        {/* Indicador de slot bloqueado */}
                                        {slotState === 'blocked' && slot.label && (
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <Lock className="w-3 h-3 text-red-400" />
                                            </div>
                                        )}
                                    </div>
                                );
                            })}

                            {/* Citas de este especialista */}
                            {citasPorEspecialista[especialista.id]?.map((cita) => {
                                const [startHour, startMin] = cita.hora_inicio.split(':').map(Number);
                                const minutesSince6AM = (startHour - 6) * 60 + startMin;
                                const topPosition = minutesSince6AM * (SLOT_HEIGHT / 15);
                                const height = cita.duracion * (SLOT_HEIGHT / 15);
                                const isDragging = draggedCita?.id === cita.id;

                                return (
                                    <div
                                        key={cita.id}
                                        className={`absolute inset-x-0 mx-1 transition-opacity ${isDragging ? 'opacity-50' : ''}`}
                                        style={{
                                            top: `${topPosition}px`,
                                            height: `${height}px`,
                                            zIndex: isDragging ? 30 : 5,
                                        }}
                                        draggable
                                        onDragStart={(e) => handleDragStart(e, cita)}
                                        onDragEnd={handleDragEnd}
                                    >
                                        <CitaCard
                                            cita={cita}
                                            onClick={() => onCitaClick(cita)}
                                            color={especialista.color}
                                        />
                                    </div>
                                );
                            })}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
