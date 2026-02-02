'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { format, addDays, subDays, isToday, getDay } from 'date-fns';
import { es } from 'date-fns/locale';
import {
    ChevronLeft,
    ChevronRight,
    Calendar as CalendarIcon,
    Plus,
    Filter,
    Loader2,
    AlertCircle,
    Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CalendarGrid } from '@/components/calendario/CalendarGrid';
import { AppointmentModal } from '@/components/calendario/AppointmentModal';
import { DatePickerModal } from '@/components/calendario/DatePickerModal';
import { IACitasModal } from '@/components/calendario/IACitasModal';
import { especialistasApi } from '@/lib/api/especialistas';
import { citasApi, CitaListItem } from '@/lib/api/citas';
import { Especialista, Horario, Bloqueo } from '@/types/especialista';
import { toast } from 'sonner';

// Colores para los especialistas
const ESPECIALISTA_COLORS = [
    '#8B5CF6', // Purple
    '#EC4899', // Pink
    '#10B981', // Green
    '#F59E0B', // Orange
    '#3B82F6', // Blue
    '#EF4444', // Red
    '#06B6D4', // Cyan
    '#84CC16', // Lime
];

interface EspecialistaConHorario extends Especialista {
    iniciales: string;
    color: string;
    horarios: Horario[];
    bloqueos: Bloqueo[];
}

interface Cita {
    id: number;
    cliente_id: number;
    cliente: { nombre: string; telefono: string | null };
    especialista_id: number;
    servicio_id: number;
    servicio: string;
    hora_inicio: string;
    hora_fin: string;
    duracion: number;
    estado: string;
    notas: string | null;
}

// Función para convertir CitaListItem del backend al formato del calendario
function convertirCitaBackendALocal(cita: CitaListItem): Cita {
    return {
        id: cita.id,
        cliente_id: cita.cliente_id,
        cliente: {
            nombre: cita.cliente_nombre,
            telefono: cita.cliente_telefono ?? null
        },
        especialista_id: cita.especialista_id,
        servicio_id: cita.servicio_id,
        servicio: cita.servicio_nombre,
        hora_inicio: cita.hora_inicio,
        hora_fin: cita.hora_fin,
        duracion: cita.duracion_minutos,
        estado: cita.estado,
        notas: cita.notas || ''
    };
}

export default function CalendarioPage() {
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [especialistas, setEspecialistas] = useState<EspecialistaConHorario[]>([]);
    const [citas, setCitas] = useState<Cita[]>([]);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showAppointmentModal, setShowAppointmentModal] = useState(false);
    const [showIACitasModal, setShowIACitasModal] = useState(false);
    const [selectedSlot, setSelectedSlot] = useState<{
        especialistaId: number;
        hora: string;
    } | null>(null);
    const [selectedCita, setSelectedCita] = useState<Cita | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingCitas, setIsLoadingCitas] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const calendarRef = useRef<HTMLDivElement>(null);

    // Cargar especialistas del backend
    useEffect(() => {
        const loadEspecialistas = async () => {
            setIsLoading(true);
            setError(null);

            try {
                // Obtener especialistas activos
                const especialistasData = await especialistasApi.getActivos();

                // Para cada especialista, obtener sus horarios y bloqueos
                const especialistasConHorarios: EspecialistaConHorario[] = await Promise.all(
                    especialistasData.map(async (esp, index) => {
                        try {
                            const [horarios, bloqueos] = await Promise.all([
                                especialistasApi.getHorarios(esp.id),
                                especialistasApi.getBloqueos(esp.id)
                            ]);

                            return {
                                ...esp,
                                iniciales: `${esp.nombre.charAt(0)}${esp.apellido.charAt(0)}`.toUpperCase(),
                                color: ESPECIALISTA_COLORS[index % ESPECIALISTA_COLORS.length],
                                horarios,
                                bloqueos
                            };
                        } catch (err) {
                            console.error(`Error cargando datos de especialista ${esp.id}:`, err);
                            return {
                                ...esp,
                                iniciales: `${esp.nombre.charAt(0)}${esp.apellido.charAt(0)}`.toUpperCase(),
                                color: ESPECIALISTA_COLORS[index % ESPECIALISTA_COLORS.length],
                                horarios: [],
                                bloqueos: []
                            };
                        }
                    })
                );

                setEspecialistas(especialistasConHorarios);
            } catch (err) {
                console.error('Error cargando especialistas:', err);
                setError('Error al cargar los especialistas. Verifica la conexión con el servidor.');
                toast.error('Error al cargar especialistas');
            } finally {
                setIsLoading(false);
            }
        };

        loadEspecialistas();
    }, []);

    // Scroll a la hora actual al cargar
    useEffect(() => {
        if (calendarRef.current && isToday(selectedDate)) {
            const now = new Date();
            const currentHour = now.getHours();
            const scrollPosition = (currentHour - 6) * 60 * 4;
            calendarRef.current.scrollTop = Math.max(0, scrollPosition - 100);
        }
    }, [selectedDate]);

    // Cargar citas del backend cuando cambia la fecha
    const loadCitas = useCallback(async () => {
        setIsLoadingCitas(true);
        try {
            const fechaStr = format(selectedDate, 'yyyy-MM-dd');
            const citasData = await citasApi.getByFecha(fechaStr);
            setCitas(citasData.map(convertirCitaBackendALocal));
        } catch (err) {
            console.error('Error cargando citas:', err);
            // No mostrar error de toast aquí para evitar spam
        } finally {
            setIsLoadingCitas(false);
        }
    }, [selectedDate]);

    useEffect(() => {
        loadCitas();
    }, [loadCitas]);

    // Recargar citas cuando se cierra el modal
    const handleCloseModal = () => {
        setShowAppointmentModal(false);
        setSelectedSlot(null);
        setSelectedCita(null);
        // Recargar citas después de cerrar el modal
        loadCitas();
    };

    // Calcular disponibilidad para el día seleccionado
    const disponibilidadPorEspecialista = useMemo(() => {
        const diaSemana = getDay(selectedDate);
        const disponibilidad: Record<number, { horasDisponibles: Set<string>; bloqueados: Set<string> }> = {};

        especialistas.forEach(esp => {
            // Obtener horarios para este día de la semana
            const horariosDelDia = esp.horarios.filter(
                h => h.dia_semana === diaSemana && h.activo
            );

            const horasDisponibles = new Set<string>();

            // Generar todas las horas disponibles según los horarios
            horariosDelDia.forEach(horario => {
                const [startH, startM] = horario.hora_inicio.split(':').map(Number);
                const [endH, endM] = horario.hora_fin.split(':').map(Number);

                let currentH = startH;
                let currentM = startM;

                while (currentH < endH || (currentH === endH && currentM < endM)) {
                    horasDisponibles.add(
                        `${String(currentH).padStart(2, '0')}:${String(currentM).padStart(2, '0')}`
                    );
                    currentM += 15;
                    if (currentM >= 60) {
                        currentM = 0;
                        currentH += 1;
                    }
                }
            });

            // Calcular horas bloqueadas
            const bloqueados = new Set<string>();
            const fechaStr = format(selectedDate, 'yyyy-MM-dd');

            esp.bloqueos.forEach(bloqueo => {
                // Verificar si el bloqueo aplica a esta fecha
                const fechaInicio = bloqueo.fecha_inicio.split('T')[0];
                const fechaFin = bloqueo.fecha_fin.split('T')[0];

                if (fechaStr >= fechaInicio && fechaStr <= fechaFin) {
                    // Si es todo el día
                    if (!bloqueo.hora_inicio || !bloqueo.hora_fin) {
                        // Bloquear todas las horas
                        for (let h = 6; h <= 22; h++) {
                            for (let m = 0; m < 60; m += 15) {
                                if (h === 22 && m > 0) break;
                                bloqueados.add(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
                            }
                        }
                    } else {
                        // Bloquear rango específico
                        const [startH, startM] = bloqueo.hora_inicio.split(':').map(Number);
                        const [endH, endM] = bloqueo.hora_fin.split(':').map(Number);

                        let currentH = startH;
                        let currentM = startM;

                        while (currentH < endH || (currentH === endH && currentM < endM)) {
                            bloqueados.add(`${String(currentH).padStart(2, '0')}:${String(currentM).padStart(2, '0')}`);
                            currentM += 15;
                            if (currentM >= 60) {
                                currentM = 0;
                                currentH += 1;
                            }
                        }
                    }
                }
            });

            disponibilidad[esp.id] = { horasDisponibles, bloqueados };
        });

        return disponibilidad;
    }, [especialistas, selectedDate]);

    const handlePrevDay = () => {
        setSelectedDate(prev => subDays(prev, 1));
    };

    const handleNextDay = () => {
        setSelectedDate(prev => addDays(prev, 1));
    };

    const handleToday = () => {
        setSelectedDate(new Date());
    };

    const handleSlotClick = useCallback((especialistaId: number, hora: string) => {
        const disponibilidad = disponibilidadPorEspecialista[especialistaId];

        if (!disponibilidad) {
            toast.error('Especialista no disponible');
            return;
        }

        // Verificar si está bloqueado
        if (disponibilidad.bloqueados.has(hora)) {
            toast.error('Este horario está bloqueado');
            return;
        }

        // Verificar si está dentro del horario laboral
        if (!disponibilidad.horasDisponibles.has(hora)) {
            toast.error('El especialista no trabaja en este horario');
            return;
        }

        setSelectedSlot({ especialistaId, hora });
        setSelectedCita(null);
        setShowAppointmentModal(true);
    }, [disponibilidadPorEspecialista]);

    const handleCitaClick = (cita: Cita) => {
        setSelectedCita(cita);
        setSelectedSlot(null);
        setShowAppointmentModal(true);
    };

    const handleCitaDrop = async (citaId: number, newEspecialistaId: number, newHora: string) => {
        const disponibilidad = disponibilidadPorEspecialista[newEspecialistaId];

        if (!disponibilidad || disponibilidad.bloqueados.has(newHora) || !disponibilidad.horasDisponibles.has(newHora)) {
            toast.error('No se puede mover la cita a este horario');
            return;
        }

        try {
            // Actualizar en el backend
            await citasApi.update(citaId, {
                especialista_id: newEspecialistaId,
                hora_inicio: newHora
            });

            // Recargar las citas del backend
            loadCitas();
            toast.success('Cita movida correctamente');
        } catch (error: any) {
            console.error('Error moviendo cita:', error);
            const msg = error.response?.data?.detail;
            if (typeof msg === 'string') {
                toast.error(msg);
            } else {
                toast.error('Error al mover la cita');
            }
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 animate-spin text-purple-600 mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-gray-400">Cargando calendario...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="text-center">
                    <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                    <p className="text-red-600 mb-4">{error}</p>
                    <Button onClick={() => window.location.reload()}>Reintentar</Button>
                </div>
            </div>
        );
    }

    if (especialistas.length === 0) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="text-center">
                    <CalendarIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                        No hay especialistas activos. Crea al menos un especialista para usar el calendario.
                    </p>
                    <Button asChild>
                        <a href="/dashboard/especialistas/nuevo">Crear Especialista</a>
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="h-[calc(100vh-8rem)] flex flex-col">
            {/* Header del Calendario */}
            <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 p-4 rounded-t-lg shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    {/* Título */}
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        Calendario de Citas
                    </h1>

                    {/* Navegación de Fecha */}
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={handlePrevDay}
                            className="h-9 w-9"
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>

                        <button
                            onClick={() => setShowDatePicker(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors min-w-[200px] justify-center"
                        >
                            <CalendarIcon className="h-4 w-4 text-purple-600" />
                            <span className="font-medium text-gray-900 dark:text-white capitalize">
                                {format(selectedDate, "EEEE, d 'de' MMMM yyyy", { locale: es })}
                            </span>
                        </button>

                        <Button
                            variant="outline"
                            size="icon"
                            onClick={handleNextDay}
                            className="h-9 w-9"
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>

                        <Button
                            variant={isToday(selectedDate) ? "default" : "outline"}
                            onClick={handleToday}
                            className={isToday(selectedDate) ? "bg-purple-600 hover:bg-purple-700" : ""}
                        >
                            Hoy
                        </Button>
                    </div>

                    {/* Acciones */}
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="icon" className="h-9 w-9">
                            <Filter className="h-4 w-4" />
                        </Button>
                        <Button
                            className="bg-gradient-to-r from-amber-500 via-orange-500 to-pink-500 hover:from-amber-600 hover:via-orange-600 hover:to-pink-600 shadow-lg shadow-orange-500/25 transition-all hover:shadow-orange-500/40"
                            onClick={() => setShowIACitasModal(true)}
                        >
                            <Sparkles className="h-4 w-4 mr-2" />
                            IA Citas
                        </Button>
                        <Button
                            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                            onClick={() => {
                                setSelectedSlot(null);
                                setSelectedCita(null);
                                setShowAppointmentModal(true);
                            }}
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            Nueva Cita
                        </Button>
                    </div>
                </div>
            </div>

            {/* Grid del Calendario */}
            <div
                ref={calendarRef}
                className="flex-1 overflow-auto bg-white dark:bg-gray-900 rounded-b-lg"
            >
                <CalendarGrid
                    especialistas={especialistas}
                    citas={citas}
                    selectedDate={selectedDate}
                    disponibilidad={disponibilidadPorEspecialista}
                    onSlotClick={handleSlotClick}
                    onCitaClick={handleCitaClick}
                    onCitaDrop={handleCitaDrop}
                    isLoading={false}
                />
            </div>

            {/* Modal de Cita */}
            {showAppointmentModal && (
                <AppointmentModal
                    isOpen={showAppointmentModal}
                    onClose={handleCloseModal}
                    selectedSlot={selectedSlot}
                    selectedCita={selectedCita}
                    especialistas={especialistas}
                    selectedDate={selectedDate}
                />
            )}

            {/* Modal de Selector de Fecha */}
            {showDatePicker && (
                <DatePickerModal
                    isOpen={showDatePicker}
                    onClose={() => setShowDatePicker(false)}
                    selectedDate={selectedDate}
                    onSelectDate={(date) => {
                        setSelectedDate(date);
                        setShowDatePicker(false);
                    }}
                />
            )}

            {/* Modal de IA Citas */}
            <IACitasModal
                isOpen={showIACitasModal}
                onClose={() => setShowIACitasModal(false)}
                onCitaCreated={() => {
                    loadCitas();
                }}
            />
        </div>
    );
}
