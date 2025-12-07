'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
    X,
    Search,
    User,
    Phone,
    Mail,
    Calendar,
    Clock,
    Scissors,
    FileText,
    Plus,
    Check,
    AlertCircle,
    Loader2,
    ChevronDown
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { serviciosApi } from '@/lib/api/servicios';
import { Servicio, formatDuracion, formatPrecio } from '@/types/servicio';
import { toast } from 'sonner';

interface Especialista {
    id: number;
    nombre: string;
    apellido?: string;
    iniciales: string;
    color: string;
}

interface Cliente {
    nombre: string;
    telefono: string;
}

interface Cita {
    id: number;
    cliente: Cliente;
    especialista_id: number;
    servicio: string;
    hora_inicio: string;
    hora_fin: string;
    duracion: number;
    estado: string;
    notas: string;
}

interface ServicioPorCategoria {
    categoria_id: number | null;
    categoria_nombre: string | null;
    servicios: Servicio[];
}

interface AppointmentModalProps {
    isOpen: boolean;
    onClose: () => void;
    selectedSlot: { especialistaId: number; hora: string } | null;
    selectedCita: Cita | null;
    especialistas: Especialista[];
    selectedDate: Date;
}

const estadoOptions = [
    { value: 'agendada', label: 'Agendada', color: 'bg-blue-500' },
    { value: 'confirmada', label: 'Confirmada', color: 'bg-green-500' },
    { value: 'en_proceso', label: 'En proceso', color: 'bg-orange-500' },
    { value: 'completada', label: 'Completada', color: 'bg-emerald-500' },
    { value: 'cancelada', label: 'Cancelada', color: 'bg-red-500' },
    { value: 'no_show', label: 'No show', color: 'bg-gray-500' },
];

// Componente de búsqueda para Especialistas
function EspecialistaSelector({
    especialistas,
    value,
    onChange
}: {
    especialistas: Especialista[];
    value: number;
    onChange: (id: number) => void;
}) {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const containerRef = useRef<HTMLDivElement>(null);

    const selected = especialistas.find(e => e.id === value);

    const filtered = useMemo(() => {
        if (!search) return especialistas;
        const searchLower = search.toLowerCase();
        return especialistas.filter(e =>
            e.nombre.toLowerCase().includes(searchLower) ||
            (e.apellido?.toLowerCase().includes(searchLower))
        );
    }, [especialistas, search]);

    // Cerrar al hacer click fuera
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div ref={containerRef} className="relative">
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="w-full h-11 px-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-left flex items-center justify-between hover:border-purple-400 transition-colors"
            >
                {selected ? (
                    <div className="flex items-center gap-3">
                        <div
                            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold"
                            style={{ backgroundColor: selected.color }}
                        >
                            {selected.iniciales}
                        </div>
                        <span className="text-gray-900 dark:text-white">
                            {selected.nombre} {selected.apellido || ''}
                        </span>
                    </div>
                ) : (
                    <span className="text-gray-500">Seleccionar especialista...</span>
                )}
                <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl z-50 max-h-64 overflow-hidden">
                    {/* Barra de búsqueda */}
                    <div className="p-2 border-b border-gray-200 dark:border-gray-700">
                        <div className="relative">
                            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            <input
                                type="text"
                                placeholder="Buscar especialista..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full pl-9 pr-3 py-2 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                                autoFocus
                            />
                        </div>
                    </div>

                    {/* Lista de especialistas */}
                    <div className="overflow-auto max-h-48">
                        {filtered.length === 0 ? (
                            <div className="p-3 text-center text-gray-500 text-sm">
                                No se encontraron especialistas
                            </div>
                        ) : (
                            filtered.map((esp) => (
                                <button
                                    key={esp.id}
                                    type="button"
                                    onClick={() => {
                                        onChange(esp.id);
                                        setIsOpen(false);
                                        setSearch('');
                                    }}
                                    className={`w-full px-3 py-2.5 flex items-center gap-3 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors
                                        ${esp.id === value ? 'bg-purple-50 dark:bg-purple-900/20' : ''}
                                    `}
                                >
                                    <div
                                        className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold"
                                        style={{ backgroundColor: esp.color }}
                                    >
                                        {esp.iniciales}
                                    </div>
                                    <span className="text-gray-900 dark:text-white text-sm">
                                        {esp.nombre} {esp.apellido || ''}
                                    </span>
                                    {esp.id === value && (
                                        <Check className="w-4 h-4 text-purple-600 ml-auto" />
                                    )}
                                </button>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

// Componente de búsqueda para Servicios
function ServicioSelector({
    serviciosPorCategoria,
    value,
    onChange,
    isLoading
}: {
    serviciosPorCategoria: ServicioPorCategoria[];
    value: number;
    onChange: (id: number) => void;
    isLoading: boolean;
}) {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const containerRef = useRef<HTMLDivElement>(null);

    const todosLosServicios = serviciosPorCategoria.flatMap(cat => cat.servicios);
    const selected = todosLosServicios.find(s => s.id === value);

    const filteredCategories = useMemo(() => {
        if (!search) return serviciosPorCategoria;
        const searchLower = search.toLowerCase();

        return serviciosPorCategoria.map(cat => ({
            ...cat,
            servicios: cat.servicios.filter(s =>
                s.nombre.toLowerCase().includes(searchLower) ||
                s.descripcion?.toLowerCase().includes(searchLower)
            )
        })).filter(cat => cat.servicios.length > 0);
    }, [serviciosPorCategoria, search]);

    // Cerrar al hacer click fuera
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    if (isLoading) {
        return (
            <div className="h-11 flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-lg">
                <Loader2 className="w-5 h-5 animate-spin text-purple-600" />
                <span className="ml-2 text-sm text-gray-500">Cargando servicios...</span>
            </div>
        );
    }

    if (todosLosServicios.length === 0) {
        return (
            <div className="h-11 flex items-center px-3 bg-red-50 dark:bg-red-900/20 rounded-lg text-red-600 text-sm">
                <AlertCircle className="w-4 h-4 mr-2" />
                No hay servicios disponibles
            </div>
        );
    }

    return (
        <div ref={containerRef} className="relative">
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="w-full min-h-[44px] px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-left flex items-center justify-between hover:border-purple-400 transition-colors"
            >
                {selected ? (
                    <div className="flex items-center gap-3 flex-1">
                        <div
                            className="w-3 h-3 rounded-full flex-shrink-0"
                            style={{ backgroundColor: selected.color_calendario || '#8B5CF6' }}
                        />
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                                <span className="text-gray-900 dark:text-white font-medium truncate">
                                    {selected.nombre}
                                </span>
                                <span className="text-xs text-gray-500 flex-shrink-0">
                                    {formatDuracion(selected.duracion_minutos)}
                                </span>
                            </div>
                            <span className="text-sm text-purple-600 dark:text-purple-400">
                                {formatPrecio(selected.precio_base)}
                            </span>
                        </div>
                    </div>
                ) : (
                    <span className="text-gray-500">Seleccionar servicio...</span>
                )}
                <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl z-50 max-h-80 overflow-hidden">
                    {/* Barra de búsqueda */}
                    <div className="p-2 border-b border-gray-200 dark:border-gray-700">
                        <div className="relative">
                            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            <input
                                type="text"
                                placeholder="Buscar servicio..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full pl-9 pr-3 py-2 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                                autoFocus
                            />
                        </div>
                    </div>

                    {/* Lista de servicios por categoría */}
                    <div className="overflow-auto max-h-64">
                        {filteredCategories.length === 0 ? (
                            <div className="p-3 text-center text-gray-500 text-sm">
                                No se encontraron servicios
                            </div>
                        ) : (
                            filteredCategories.map((cat) => (
                                <div key={cat.categoria_id || 'sin-categoria'}>
                                    {/* Header de categoría */}
                                    <div className="px-3 py-1.5 bg-gray-50 dark:bg-gray-900 text-xs font-semibold text-gray-500 uppercase tracking-wider sticky top-0">
                                        {cat.categoria_nombre || 'Sin categoría'}
                                    </div>

                                    {/* Servicios de la categoría */}
                                    {cat.servicios.map((serv) => (
                                        <button
                                            key={serv.id}
                                            type="button"
                                            onClick={() => {
                                                onChange(serv.id);
                                                setIsOpen(false);
                                                setSearch('');
                                            }}
                                            className={`w-full px-3 py-2.5 flex items-start gap-3 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors text-left
                                                ${serv.id === value ? 'bg-purple-50 dark:bg-purple-900/20' : ''}
                                            `}
                                        >
                                            <div
                                                className="w-3 h-3 rounded-full mt-1 flex-shrink-0"
                                                style={{ backgroundColor: serv.color_calendario || '#8B5CF6' }}
                                            />
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between gap-2">
                                                    <span className="text-gray-900 dark:text-white font-medium">
                                                        {serv.nombre}
                                                    </span>
                                                    <span className="text-xs text-gray-500 px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded-full flex-shrink-0">
                                                        {formatDuracion(serv.duracion_minutos)}
                                                    </span>
                                                </div>
                                                <div className="flex items-center justify-between mt-0.5">
                                                    <span className="text-sm text-purple-600 dark:text-purple-400 font-medium">
                                                        {formatPrecio(serv.precio_base)}
                                                    </span>
                                                    {serv.id === value && (
                                                        <Check className="w-4 h-4 text-purple-600" />
                                                    )}
                                                </div>
                                                {serv.descripcion && (
                                                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">
                                                        {serv.descripcion}
                                                    </p>
                                                )}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

export function AppointmentModal({
    isOpen,
    onClose,
    selectedSlot,
    selectedCita,
    especialistas,
    selectedDate
}: AppointmentModalProps) {
    const isEditMode = !!selectedCita;

    // Estados para servicios del backend
    const [serviciosPorCategoria, setServiciosPorCategoria] = useState<ServicioPorCategoria[]>([]);
    const [serviciosLoading, setServiciosLoading] = useState(true);

    // Estados del formulario
    const [clienteSearch, setClienteSearch] = useState('');
    const [clienteEncontrado, setClienteEncontrado] = useState<{ nombre: string; telefono: string; email?: string } | null>(null);
    const [showNewClientForm, setShowNewClientForm] = useState(false);
    const [isSearching, setIsSearching] = useState(false);

    // Datos del nuevo cliente
    const [nuevoCliente, setNuevoCliente] = useState({
        nombre: '',
        telefono: '',
        email: ''
    });

    // Datos de la cita
    const [formData, setFormData] = useState({
        especialista_id: selectedSlot?.especialistaId || selectedCita?.especialista_id || especialistas[0]?.id || 0,
        servicio_id: 0,
        fecha: format(selectedDate, 'yyyy-MM-dd'),
        hora_inicio: selectedSlot?.hora || selectedCita?.hora_inicio || '09:00',
        notas: selectedCita?.notas || '',
        estado: selectedCita?.estado || 'agendada'
    });

    // Cargar servicios al abrir el modal
    useEffect(() => {
        const loadServicios = async () => {
            setServiciosLoading(true);
            try {
                const data = await serviciosApi.getActivosPorCategoria();
                setServiciosPorCategoria(data);

                // Seleccionar el primer servicio disponible si no hay uno seleccionado
                if (data.length > 0 && data[0].servicios.length > 0 && !formData.servicio_id) {
                    setFormData(prev => ({
                        ...prev,
                        servicio_id: data[0].servicios[0].id
                    }));
                }
            } catch (error) {
                console.error('Error cargando servicios:', error);
                toast.error('Error al cargar los servicios');
            } finally {
                setServiciosLoading(false);
            }
        };

        if (isOpen) {
            loadServicios();
        }
    }, [isOpen]);

    // Si estamos editando, prellenar datos del cliente
    useEffect(() => {
        if (selectedCita) {
            setClienteEncontrado({
                nombre: selectedCita.cliente.nombre,
                telefono: selectedCita.cliente.telefono
            });
        }
    }, [selectedCita]);

    // Obtener todos los servicios planos
    const todosLosServicios = serviciosPorCategoria.flatMap(cat => cat.servicios);

    // Simular búsqueda de cliente (TODO: conectar con API real)
    const handleClienteSearch = (value: string) => {
        setClienteSearch(value);
        setIsSearching(true);
        setClienteEncontrado(null);
        setShowNewClientForm(false);

        setTimeout(() => {
            setIsSearching(false);
            if (value === '1234567890' || value.includes('300')) {
                setClienteEncontrado({
                    nombre: 'María González',
                    telefono: value,
                    email: 'maria@email.com'
                });
            }
        }, 500);
    };

    // Obtener servicio seleccionado
    const servicioSeleccionado = todosLosServicios.find(s => s.id === formData.servicio_id);

    // Calcular hora fin basada en el servicio seleccionado
    const calcularHoraFin = () => {
        if (!servicioSeleccionado) return formData.hora_inicio;

        const [hours, minutes] = formData.hora_inicio.split(':').map(Number);
        const totalMinutes = hours * 60 + minutes + servicioSeleccionado.duracion_minutos;
        const endHours = Math.floor(totalMinutes / 60);
        const endMinutes = totalMinutes % 60;
        return `${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}`;
    };

    const handleSubmit = () => {
        console.log('Guardando cita:', {
            cliente: clienteEncontrado || nuevoCliente,
            ...formData,
            hora_fin: calcularHoraFin(),
            servicio: servicioSeleccionado
        });
        toast.success(isEditMode ? 'Cita actualizada' : 'Cita agendada correctamente');
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-auto m-4">
                {/* Header */}
                <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-6 py-4 flex items-center justify-between z-10">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                        {isEditMode ? `Editar Cita #${selectedCita?.id}` : 'Nueva Cita'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    >
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {/* Contenido */}
                <div className="p-6 space-y-5">
                    {/* Búsqueda de Cliente */}
                    {!isEditMode && (
                        <div className="space-y-3">
                            <Label className="text-sm font-medium flex items-center gap-2">
                                <Search className="w-4 h-4" />
                                Buscar Cliente
                            </Label>
                            <div className="relative">
                                <Input
                                    placeholder="Cédula o Teléfono"
                                    value={clienteSearch}
                                    onChange={(e) => handleClienteSearch(e.target.value)}
                                    className="pl-10 h-11"
                                />
                                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                {isSearching && (
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                        <Loader2 className="w-4 h-4 animate-spin text-purple-600" />
                                    </div>
                                )}
                            </div>

                            {/* Resultado de búsqueda */}
                            {clienteSearch && !isSearching && (
                                <div className="mt-2">
                                    {clienteEncontrado ? (
                                        <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                                            <Check className="w-5 h-5 text-green-600" />
                                            <div>
                                                <p className="font-medium text-green-700 dark:text-green-300">
                                                    Cliente encontrado
                                                </p>
                                                <p className="text-sm text-green-600 dark:text-green-400">
                                                    {clienteEncontrado.nombre}
                                                </p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                                            <div className="flex items-center gap-3">
                                                <AlertCircle className="w-5 h-5 text-yellow-600" />
                                                <span className="text-sm text-yellow-700 dark:text-yellow-300">
                                                    Cliente no encontrado
                                                </span>
                                            </div>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setShowNewClientForm(true)}
                                                className="text-yellow-700 border-yellow-300 hover:bg-yellow-100"
                                            >
                                                <Plus className="w-4 h-4 mr-1" />
                                                Crear nuevo
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Formulario de Nuevo Cliente */}
                            {showNewClientForm && (
                                <div className="space-y-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                                    <h4 className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                                        <User className="w-4 h-4" />
                                        Nuevo Cliente
                                    </h4>
                                    <div>
                                        <Label className="text-xs">Nombre completo *</Label>
                                        <Input
                                            value={nuevoCliente.nombre}
                                            onChange={(e) => setNuevoCliente(prev => ({ ...prev, nombre: e.target.value }))}
                                            placeholder="Nombre completo"
                                        />
                                    </div>
                                    <div>
                                        <Label className="text-xs">Teléfono *</Label>
                                        <Input
                                            value={nuevoCliente.telefono}
                                            onChange={(e) => setNuevoCliente(prev => ({ ...prev, telefono: e.target.value }))}
                                            placeholder="Teléfono"
                                        />
                                    </div>
                                    <div>
                                        <Label className="text-xs">Email (opcional)</Label>
                                        <Input
                                            type="email"
                                            value={nuevoCliente.email}
                                            onChange={(e) => setNuevoCliente(prev => ({ ...prev, email: e.target.value }))}
                                            placeholder="email@ejemplo.com"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Info del Cliente (modo edición) */}
                    {isEditMode && clienteEncontrado && (
                        <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg space-y-2">
                            <div className="flex items-center gap-2 text-gray-900 dark:text-white">
                                <User className="w-4 h-4" />
                                <span className="font-medium">{clienteEncontrado.nombre}</span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 text-sm">
                                <Phone className="w-4 h-4" />
                                <span>{clienteEncontrado.telefono}</span>
                            </div>
                            {clienteEncontrado.email && (
                                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 text-sm">
                                    <Mail className="w-4 h-4" />
                                    <span>{clienteEncontrado.email}</span>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Estado (solo en modo edición) */}
                    {isEditMode && (
                        <div className="space-y-2">
                            <Label className="text-sm font-medium">Estado de la Cita</Label>
                            <div className="flex flex-wrap gap-2">
                                {estadoOptions.map((estado) => (
                                    <button
                                        key={estado.value}
                                        onClick={() => setFormData(prev => ({ ...prev, estado: estado.value }))}
                                        className={`
                                            px-3 py-1.5 rounded-full text-xs font-medium transition-all
                                            ${formData.estado === estado.value
                                                ? `${estado.color} text-white shadow-md scale-105`
                                                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                                            }
                                        `}
                                    >
                                        {estado.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Detalles de la Cita */}
                    <div className="space-y-4">
                        <h4 className="font-medium text-gray-900 dark:text-white">
                            Detalles de la Cita
                        </h4>

                        {/* Especialista - línea completa */}
                        <div className="space-y-1.5">
                            <Label className="text-xs flex items-center gap-1">
                                <User className="w-3 h-3" />
                                Especialista *
                            </Label>
                            <EspecialistaSelector
                                especialistas={especialistas}
                                value={formData.especialista_id}
                                onChange={(id) => setFormData(prev => ({ ...prev, especialista_id: id }))}
                            />
                        </div>

                        {/* Servicio - línea completa con búsqueda */}
                        <div className="space-y-1.5">
                            <Label className="text-xs flex items-center gap-1">
                                <Scissors className="w-3 h-3" />
                                Servicio *
                            </Label>
                            <ServicioSelector
                                serviciosPorCategoria={serviciosPorCategoria}
                                value={formData.servicio_id}
                                onChange={(id) => setFormData(prev => ({ ...prev, servicio_id: id }))}
                                isLoading={serviciosLoading}
                            />
                        </div>

                        {/* Fecha y Hora */}
                        <div className="grid grid-cols-3 gap-3">
                            {/* Fecha */}
                            <div className="space-y-1.5">
                                <Label className="text-xs flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    Fecha *
                                </Label>
                                <Input
                                    type="date"
                                    value={formData.fecha}
                                    onChange={(e) => setFormData(prev => ({ ...prev, fecha: e.target.value }))}
                                    className="h-11"
                                />
                            </div>

                            {/* Hora Inicio */}
                            <div className="space-y-1.5">
                                <Label className="text-xs flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    Hora *
                                </Label>
                                <Input
                                    type="time"
                                    value={formData.hora_inicio}
                                    onChange={(e) => setFormData(prev => ({ ...prev, hora_inicio: e.target.value }))}
                                    className="h-11"
                                />
                            </div>

                            {/* Hora Fin (calculada) */}
                            <div className="space-y-1.5">
                                <Label className="text-xs text-gray-500">Hora Fin</Label>
                                <div className="h-11 px-3 flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg text-sm text-gray-600 dark:text-gray-400 font-medium">
                                    {calcularHoraFin()}
                                </div>
                            </div>
                        </div>

                        {/* Duración Info */}
                        {servicioSeleccionado && (
                            <div className="text-center">
                                <span className="inline-flex items-center gap-1.5 text-xs text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 px-3 py-1 rounded-full">
                                    <Clock className="w-3 h-3" />
                                    Duración: {formatDuracion(servicioSeleccionado.duracion_minutos)}
                                </span>
                            </div>
                        )}

                        {/* Notas */}
                        <div className="space-y-1.5">
                            <Label className="text-xs flex items-center gap-1">
                                <FileText className="w-3 h-3" />
                                Notas (opcional)
                            </Label>
                            <textarea
                                value={formData.notas}
                                onChange={(e) => setFormData(prev => ({ ...prev, notas: e.target.value }))}
                                placeholder="Agregar notas sobre la cita..."
                                rows={2}
                                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                            />
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="sticky bottom-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 px-6 py-4 flex items-center justify-between">
                    {isEditMode && (
                        <Button variant="outline" className="text-red-600 border-red-300 hover:bg-red-50">
                            Cancelar Cita
                        </Button>
                    )}
                    <div className={`flex gap-3 ${isEditMode ? '' : 'ml-auto'}`}>
                        <Button variant="outline" onClick={onClose}>
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleSubmit}
                            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                            disabled={(!clienteEncontrado && !nuevoCliente.nombre) || !servicioSeleccionado}
                        >
                            {isEditMode ? 'Guardar Cambios' : 'Agendar Cita'}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
