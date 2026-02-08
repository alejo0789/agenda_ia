'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useEspecialistaStore } from '@/stores/especialistaStore';
import { Button } from '@/components/ui/button';
import HorariosModal from '@/components/especialistas/HorariosModal';
import BloqueosModal from '@/components/especialistas/BloqueosModal';
import ServiciosModal from '@/components/especialistas/ServiciosModal';
import {
    UserCircle,
    Edit,
    Calendar,
    Ban,
    Settings,
    Loader2,
    Phone,
    Mail,
    FileText,
    Clock,
    ArrowLeft,
    TrendingUp,
    Scissors,
    Users,
    Power,
    AlertTriangle,
    X,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const DIAS_SEMANA = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

export default function EspecialistaDetailPage() {
    const params = useParams();
    const router = useRouter();
    const id = Number(params.id);

    const {
        selectedEspecialista,
        horarios,
        bloqueos,
        servicios,
        isLoading,
        error,
        fetchEspecialista,
        fetchHorarios,
        fetchBloqueos,
        fetchServicios,
        deleteEspecialista,
        activateEspecialista,
    } = useEspecialistaStore();

    const [activeTab, setActiveTab] = useState<'resumen' | 'horarios' | 'bloqueos' | 'servicios' | 'documentacion'>('resumen');
    const [showHorariosModal, setShowHorariosModal] = useState(false);
    const [showBloqueosModal, setShowBloqueosModal] = useState(false);
    const [showServiciosModal, setShowServiciosModal] = useState(false);
    const [showDesactivarModal, setShowDesactivarModal] = useState(false);
    const [showActivarModal, setShowActivarModal] = useState(false);
    const [isDesactivando, setIsDesactivando] = useState(false);
    const [isActivando, setIsActivando] = useState(false);

    useEffect(() => {
        if (id) {
            fetchEspecialista(id);
            fetchHorarios(id);
            fetchBloqueos(id);
            fetchServicios(id);
        }
    }, [id, fetchEspecialista, fetchHorarios, fetchBloqueos, fetchServicios]);

    const getInitials = (nombre: string, apellido: string) => {
        return `${nombre.charAt(0)}${apellido.charAt(0)}`.toUpperCase();
    };

    const handleDesactivar = async () => {
        setIsDesactivando(true);
        try {
            await deleteEspecialista(id);
            router.push('/dashboard/especialistas');
        } catch (error) {
            console.error('Error al desactivar especialista:', error);
        } finally {
            setIsDesactivando(false);
            setShowDesactivarModal(false);
        }
    };

    const handleActivar = async () => {
        setIsActivando(true);
        try {
            await activateEspecialista(id);
            setShowActivarModal(false);
        } catch (error) {
            console.error('Error al activar especialista:', error);
        } finally {
            setIsActivando(false);
        }
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('es-CO', {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
        });
    };

    const calcularTiempoEnEmpresa = (fechaIngreso: string) => {
        const ingreso = new Date(fechaIngreso);
        const ahora = new Date();
        const diffMs = ahora.getTime() - ingreso.getTime();
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        const years = Math.floor(diffDays / 365);
        const months = Math.floor((diffDays % 365) / 30);

        if (years > 0) {
            return `${years} año${years > 1 ? 's' : ''}${months > 0 ? `, ${months} mes${months > 1 ? 'es' : ''}` : ''}`;
        }
        return `${months} mes${months !== 1 ? 'es' : ''}`;
    };

    if (isLoading && !selectedEspecialista) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
            </div>
        );
    }

    if (error || !selectedEspecialista) {
        return (
            <div className="text-center py-12">
                <p className="text-red-500 mb-4">{error || 'Especialista no encontrado'}</p>
                <Link href="/dashboard/especialistas">
                    <Button>
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Volver a Especialistas
                    </Button>
                </Link>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Breadcrumb */}
            <nav className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                <Link
                    href="/dashboard/especialistas"
                    className="flex items-center hover:text-purple-600 dark:hover:text-purple-400"
                >
                    <ArrowLeft className="w-4 h-4 mr-1" />
                    Especialistas
                </Link>
                <span>›</span>
                <span className="text-gray-900 dark:text-gray-100">
                    {selectedEspecialista.nombre} {selectedEspecialista.apellido}
                </span>
            </nav>

            {/* Header Card */}
            <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                    <div className="flex items-center space-x-4">
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center text-white text-xl font-bold shadow-lg">
                            {getInitials(selectedEspecialista.nombre, selectedEspecialista.apellido)}
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                                {selectedEspecialista.nombre} {selectedEspecialista.apellido}
                            </h1>
                            <div className="mt-2 space-y-1">
                                {selectedEspecialista.telefono && (
                                    <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                                        <Phone className="w-4 h-4 mr-2" />
                                        {selectedEspecialista.telefono}
                                    </div>
                                )}
                                {selectedEspecialista.email && (
                                    <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                                        <Mail className="w-4 h-4 mr-2" />
                                        {selectedEspecialista.email}
                                    </div>
                                )}
                                {selectedEspecialista.documento_identidad && (
                                    <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                                        <FileText className="w-4 h-4 mr-2" />
                                        CC {selectedEspecialista.documento_identidad}
                                    </div>
                                )}
                            </div>
                            {selectedEspecialista.fecha_ingreso && (
                                <p className="mt-2 text-sm text-gray-400">
                                    Ingreso: {formatDate(selectedEspecialista.fecha_ingreso)} (
                                    {calcularTiempoEnEmpresa(selectedEspecialista.fecha_ingreso)})
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        {/* Estado */}
                        <span
                            className={cn(
                                'inline-flex items-center px-3 py-1 rounded-full text-sm font-medium mr-2',
                                selectedEspecialista.estado === 'activo'
                                    ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                                    : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400'
                            )}
                        >
                            {selectedEspecialista.estado === 'activo' ? '● Activo' : '○ Inactivo'}
                        </span>

                        <Link href={`/dashboard/especialistas/${id}/editar`}>
                            <Button variant="outline" size="sm">
                                <Edit className="w-4 h-4 mr-2" />
                                Editar
                            </Button>
                        </Link>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowHorariosModal(true)}
                        >
                            <Calendar className="w-4 h-4 mr-2" />
                            Horarios
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowBloqueosModal(true)}
                        >
                            <Ban className="w-4 h-4 mr-2" />
                            Bloqueos
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowServiciosModal(true)}
                        >
                            <Settings className="w-4 h-4 mr-2" />
                            Servicios
                        </Button>
                        {selectedEspecialista.estado === 'activo' ? (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setShowDesactivarModal(true)}
                                className="border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700 hover:border-red-400 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20"
                            >
                                <Power className="w-4 h-4 mr-2" />
                                Desactivar
                            </Button>
                        ) : (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setShowActivarModal(true)}
                                className="border-green-300 text-green-600 hover:bg-green-50 hover:text-green-700 hover:border-green-400 dark:border-green-800 dark:text-green-400 dark:hover:bg-green-900/20"
                            >
                                <Power className="w-4 h-4 mr-2" />
                                Activar
                            </Button>
                        )}
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200 dark:border-gray-700">
                <nav className="flex space-x-8">
                    {[
                        { id: 'resumen', label: 'Resumen', icon: TrendingUp },
                        { id: 'horarios', label: 'Horarios', icon: Clock },
                        { id: 'bloqueos', label: 'Bloqueos', icon: Ban },
                        { id: 'servicios', label: 'Servicios', icon: Scissors },
                        { id: 'documentacion', label: 'Documentación', icon: FileText },
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={cn(
                                'flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors',
                                activeTab === tab.id
                                    ? 'border-purple-500 text-purple-600 dark:text-purple-400'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                            )}
                        >
                            <tab.icon className="w-4 h-4" />
                            <span>{tab.label}</span>
                        </button>
                    ))}
                </nav>
            </div>

            {/* Tab Content */}
            <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
                {activeTab === 'resumen' && (
                    <div className="space-y-6">
                        {/* Stats Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-purple-600 dark:text-purple-400">
                                            Días Laborales
                                        </p>
                                        <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                                            {new Set(horarios.filter(h => h.activo).map(h => h.dia_semana)).size}
                                        </p>
                                    </div>
                                    <Calendar className="w-8 h-8 text-purple-400" />
                                </div>
                            </div>
                            <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-red-600 dark:text-red-400">
                                            Bloqueos Activos
                                        </p>
                                        <p className="text-2xl font-bold text-red-700 dark:text-red-300">
                                            {bloqueos.length}
                                        </p>
                                    </div>
                                    <Ban className="w-8 h-8 text-red-400" />
                                </div>
                            </div>
                            <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-emerald-600 dark:text-emerald-400">
                                            Servicios
                                        </p>
                                        <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">
                                            {servicios.length}
                                        </p>
                                    </div>
                                    <Scissors className="w-8 h-8 text-emerald-400" />
                                </div>
                            </div>
                        </div>

                        {/* Quick Info */}
                        <div className="text-center py-8 text-gray-500">
                            <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                            <p>Las estadísticas detalladas estarán disponibles próximamente</p>
                        </div>
                    </div>
                )}

                {activeTab === 'horarios' && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-medium">Horarios Semanales</h3>
                            <Button
                                size="sm"
                                onClick={() => setShowHorariosModal(true)}
                                className="bg-gradient-to-r from-purple-600 to-pink-600"
                            >
                                <Edit className="w-4 h-4 mr-2" />
                                Editar Horarios
                            </Button>
                        </div>

                        {horarios.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">
                                <Clock className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                                <p>No hay horarios configurados</p>
                            </div>
                        ) : (
                            <div className="grid gap-3">
                                {DIAS_SEMANA.map((dia, index) => {
                                    const horariosDelDia = horarios.filter(
                                        (h) => h.dia_semana === index && h.activo
                                    );
                                    return (
                                        <div
                                            key={index}
                                            className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800"
                                        >
                                            <span className="font-medium w-24">{dia}</span>
                                            {horariosDelDia.length > 0 ? (
                                                <div className="flex flex-wrap gap-2">
                                                    {horariosDelDia.map((h, i) => (
                                                        <span
                                                            key={i}
                                                            className="px-3 py-1 text-sm bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 rounded-full"
                                                        >
                                                            {h.hora_inicio} - {h.hora_fin}
                                                        </span>
                                                    ))}
                                                </div>
                                            ) : (
                                                <span className="text-gray-400 text-sm">No trabaja</span>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'bloqueos' && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-medium">Bloqueos de Agenda</h3>
                            <Button
                                size="sm"
                                onClick={() => setShowBloqueosModal(true)}
                                className="bg-gradient-to-r from-purple-600 to-pink-600"
                            >
                                <Edit className="w-4 h-4 mr-2" />
                                Gestionar Bloqueos
                            </Button>
                        </div>

                        {bloqueos.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">
                                <Ban className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                                <p>No hay bloqueos configurados</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {bloqueos.map((bloqueo) => (
                                    <div
                                        key={bloqueo.id}
                                        className="p-4 rounded-lg border border-gray-200 dark:border-gray-700"
                                    >
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <p className="font-medium">
                                                    {formatDate(bloqueo.fecha_inicio)}
                                                    {bloqueo.fecha_inicio !== bloqueo.fecha_fin &&
                                                        ` - ${formatDate(bloqueo.fecha_fin)}`}
                                                </p>
                                                <p className="text-sm text-gray-500">
                                                    {bloqueo.hora_inicio
                                                        ? `${bloqueo.hora_inicio} - ${bloqueo.hora_fin}`
                                                        : 'Todo el día'}
                                                </p>
                                                {bloqueo.motivo && (
                                                    <p className="text-sm text-gray-400 mt-1">
                                                        {bloqueo.motivo}
                                                    </p>
                                                )}
                                            </div>
                                            <span
                                                className={cn(
                                                    'px-2 py-1 text-xs rounded-full',
                                                    bloqueo.es_recurrente
                                                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
                                                        : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400'
                                                )}
                                            >
                                                {bloqueo.es_recurrente ? 'Recurrente' : 'Puntual'}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'servicios' && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-medium">Servicios Asignados</h3>
                            <Button
                                size="sm"
                                onClick={() => setShowServiciosModal(true)}
                                className="bg-gradient-to-r from-purple-600 to-pink-600"
                            >
                                <Edit className="w-4 h-4 mr-2" />
                                Gestionar Servicios
                            </Button>
                        </div>

                        {servicios.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">
                                <Scissors className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                                <p>No hay servicios asignados</p>
                            </div>
                        ) : (
                            <div className="grid gap-3">
                                {servicios.map((servicio) => (
                                    <div
                                        key={servicio.servicio_id}
                                        className="flex items-center justify-between p-4 rounded-lg bg-gray-50 dark:bg-gray-800"
                                    >
                                        <div className="flex items-center space-x-3">
                                            <Scissors className="w-5 h-5 text-purple-500" />
                                            <span className="font-medium">
                                                Servicio #{servicio.servicio_id}
                                            </span>
                                        </div>
                                        <span
                                            className={cn(
                                                'px-3 py-1 text-sm rounded-full',
                                                servicio.tipo_comision === 'porcentaje'
                                                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
                                                    : 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                                            )}
                                        >
                                            {servicio.tipo_comision === 'porcentaje'
                                                ? `${servicio.valor_comision}%`
                                                : `$${servicio.valor_comision.toLocaleString()}`}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'documentacion' && (
                    <DocumentacionTab selectedEspecialista={selectedEspecialista} />
                )}
            </div>

            {/* Modals */}
            <HorariosModal
                especialista={selectedEspecialista}
                isOpen={showHorariosModal}
                onClose={() => setShowHorariosModal(false)}
            />
            <BloqueosModal
                especialista={selectedEspecialista}
                isOpen={showBloqueosModal}
                onClose={() => setShowBloqueosModal(false)}
            />
            <ServiciosModal
                especialista={selectedEspecialista}
                isOpen={showServiciosModal}
                onClose={() => setShowServiciosModal(false)}
            />

            {/* Modal de Confirmación de Desactivación */}
            {showDesactivarModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/50" onClick={() => setShowDesactivarModal(false)} />
                    <div className="relative bg-white dark:bg-gray-900 rounded-lg shadow-xl w-full max-w-md p-6">
                        <button
                            onClick={() => setShowDesactivarModal(false)}
                            className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <div className="text-center">
                            <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center mx-auto mb-4">
                                <AlertTriangle className="w-8 h-8 text-red-500" />
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                                ¿Desactivar especialista?
                            </h3>
                            <p className="text-gray-500 dark:text-gray-400 mb-6">
                                Estás a punto de desactivar a <strong>{selectedEspecialista.nombre} {selectedEspecialista.apellido}</strong>.
                                Esta acción ocultará al especialista del sistema pero no eliminará sus datos.
                            </p>

                            <div className="flex space-x-3">
                                <Button
                                    variant="outline"
                                    className="flex-1"
                                    onClick={() => setShowDesactivarModal(false)}
                                >
                                    Cancelar
                                </Button>
                                <Button
                                    className="flex-1 bg-red-600 hover:bg-red-700"
                                    onClick={handleDesactivar}
                                    disabled={isDesactivando}
                                >
                                    {isDesactivando ? (
                                        <>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            Desactivando...
                                        </>
                                    ) : (
                                        <>
                                            <Power className="w-4 h-4 mr-2" />
                                            Sí, desactivar
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de Confirmación de Activación */}
            {showActivarModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/50" onClick={() => setShowActivarModal(false)} />
                    <div className="relative bg-white dark:bg-gray-900 rounded-lg shadow-xl w-full max-w-md p-6">
                        <button
                            onClick={() => setShowActivarModal(false)}
                            className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <div className="text-center">
                            <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center mx-auto mb-4">
                                <Power className="w-8 h-8 text-green-500" />
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                                ¿Activar especialista?
                            </h3>
                            <p className="text-gray-500 dark:text-gray-400 mb-6">
                                Estás a punto de reactivar a <strong>{selectedEspecialista.nombre} {selectedEspecialista.apellido}</strong>.
                                El especialista volverá a estar disponible en el sistema.
                            </p>

                            <div className="flex space-x-3">
                                <Button
                                    variant="outline"
                                    className="flex-1"
                                    onClick={() => setShowActivarModal(false)}
                                >
                                    Cancelar
                                </Button>
                                <Button
                                    className="flex-1 bg-green-600 hover:bg-green-700"
                                    onClick={handleActivar}
                                    disabled={isActivando}
                                >
                                    {isActivando ? (
                                        <>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            Activando...
                                        </>
                                    ) : (
                                        <>
                                            <Power className="w-4 h-4 mr-2" />
                                            Sí, activar
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// Custom component for Documentation Tab
function DocumentacionTab({ selectedEspecialista }: { selectedEspecialista: any }) {
    const { uploadDocumentation, fetchFiles, files, deleteFile } = useEspecialistaStore();
    const [file, setFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);

    useEffect(() => {
        if (selectedEspecialista?.id) {
            fetchFiles(selectedEspecialista.id);
        }
    }, [selectedEspecialista?.id, fetchFiles]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handleUpload = async () => {
        if (!file || !selectedEspecialista?.id) return;
        setIsUploading(true);
        try {
            await uploadDocumentation(selectedEspecialista.id, file);
            setFile(null);
            // Reset input value to allow re-uploading same file if needed (though state is null now)
            const input = document.getElementById('doc-upload-input') as HTMLInputElement;
            if (input) input.value = '';
            alert('Documentación subida con éxito');
        } catch (error) {
            console.error('Error uploading:', error);
            alert('Error al subir documentación');
        } finally {
            setIsUploading(false);
        }
    };

    const handleDelete = async (filename: string) => {
        if (!confirm(`¿Estás seguro de eliminar el archivo ${filename}?`)) return;
        try {
            await deleteFile(selectedEspecialista.id, filename);
        } catch (error) {
            console.error('Error deleting:', error);
            alert('Error al eliminar archivo');
        }
    };

    return (
        <div className="space-y-6">
            <h3 className="font-medium">Documentación del Especialista</h3>

            {files && files.length > 0 ? (
                <div className="space-y-3">
                    {files.map((f, index) => (
                        <div key={index} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4 rounded-lg flex items-center justify-between">
                            <div className="flex items-center">
                                <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-lg mr-3">
                                    <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                                </div>
                                <div>
                                    <p className="font-medium text-gray-900 dark:text-gray-100">{f.name}</p>
                                    <p className="text-xs text-gray-500">{(f.size / 1024).toFixed(1)} KB</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <a
                                    href={`${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '')}/storage/${f.url}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-sm font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 px-3 py-1.5 rounded-md hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                                >
                                    Ver
                                </a>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDelete(f.name)}
                                    className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                                >
                                    <X className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="bg-gray-50 dark:bg-gray-800 p-8 rounded-lg text-center border-2 border-dashed border-gray-200 dark:border-gray-700">
                    <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-500 font-medium">No hay documentación subida</p>
                    <p className="text-gray-400 text-sm">Sube archivos PDF para este especialista</p>
                </div>
            )}

            <div className="border-t pt-6 dark:border-gray-800">
                <h4 className="text-sm font-medium mb-4">Subir Nuevo Documento</h4>
                <div className="flex items-center gap-4">
                    <input
                        id="doc-upload-input"
                        type="file"
                        accept=".pdf"
                        onChange={handleFileChange}
                        className="block w-full text-sm text-gray-500
                            file:mr-4 file:py-2 file:px-4
                            file:rounded-full file:border-0
                            file:text-sm file:font-semibold
                            file:bg-purple-50 file:text-purple-700
                            hover:file:bg-purple-100"
                    />
                    <Button
                        disabled={!file || isUploading}
                        onClick={handleUpload}
                        className="bg-purple-600 hover:bg-purple-700"
                    >
                        {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Subir'}
                    </Button>
                </div>
            </div>
        </div>
    );
}
