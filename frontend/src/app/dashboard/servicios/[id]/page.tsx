'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useServicioStore } from '@/stores/servicioStore';
import { Button } from '@/components/ui/button';
import ServicioModal from '@/components/servicios/ServicioModal';
import { formatDuracion, formatPrecio, DEFAULT_COLORS } from '@/types/servicio';
import { cn } from '@/lib/utils';
import {
    Scissors,
    Edit,
    Loader2,
    ArrowLeft,
    Clock,
    DollarSign,
    Tag,
    Power,
    X,
    AlertTriangle,
    Percent,
} from 'lucide-react';
import { toast } from 'sonner';

export default function ServicioDetailPage() {
    const params = useParams();
    const router = useRouter();
    const id = Number(params.id);

    const {
        selectedServicio,
        categorias,
        isLoading,
        error,
        fetchServicio,
        fetchCategorias,
        deleteServicio,
        activateServicio,
        clearSelectedServicio,
    } = useServicioStore();

    const [showServicioModal, setShowServicioModal] = useState(false);
    const [showDesactivarModal, setShowDesactivarModal] = useState(false);
    const [showActivarModal, setShowActivarModal] = useState(false);
    const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

    // Cargar datos iniciales
    useEffect(() => {
        if (id) {
            fetchServicio(id);
            fetchCategorias();
        }

        return () => {
            clearSelectedServicio();
        };
    }, [id, fetchServicio, fetchCategorias, clearSelectedServicio]);

    const getCategoriaInfo = () => {
        if (!selectedServicio || !selectedServicio.categoria_id) {
            return { nombre: 'Sin categoría', color: DEFAULT_COLORS[0] };
        }
        const categoria = categorias.find((c) => c.id === selectedServicio.categoria_id);
        const index = categorias.findIndex((c) => c.id === selectedServicio.categoria_id);
        return {
            nombre: categoria?.nombre || 'Sin categoría',
            color: DEFAULT_COLORS[index % DEFAULT_COLORS.length] || DEFAULT_COLORS[0],
        };
    };

    const handleDesactivar = async () => {
        setIsUpdatingStatus(true);
        try {
            await deleteServicio(id);
            toast.success('Servicio desactivado');
            router.push('/dashboard/servicios');
        } catch {
            toast.error('Error al desactivar servicio');
        } finally {
            setIsUpdatingStatus(false);
            setShowDesactivarModal(false);
        }
    };

    const handleActivar = async () => {
        setIsUpdatingStatus(true);
        try {
            await activateServicio(id);
            toast.success('Servicio activado');
            setShowActivarModal(false);
        } catch {
            toast.error('Error al activar servicio');
        } finally {
            setIsUpdatingStatus(false);
        }
    };

    const categoriaInfo = getCategoriaInfo();
    const color = selectedServicio?.color_calendario || categoriaInfo.color;

    if (isLoading && !selectedServicio) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
            </div>
        );
    }

    if (error || !selectedServicio) {
        return (
            <div className="text-center py-12">
                <p className="text-red-500 mb-4">{error || 'Servicio no encontrado'}</p>
                <Link href="/dashboard/servicios">
                    <Button>
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Volver a Servicios
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
                    href="/dashboard/servicios"
                    className="flex items-center hover:text-purple-600 dark:hover:text-purple-400"
                >
                    <ArrowLeft className="w-4 h-4 mr-1" />
                    Servicios
                </Link>
                <span>›</span>
                <span className="text-gray-900 dark:text-gray-100">{selectedServicio.nombre}</span>
            </nav>

            {/* Header Card */}
            <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
                    <div className="flex items-start space-x-4">
                        <div
                            className="w-16 h-16 rounded-lg flex items-center justify-center"
                            style={{ backgroundColor: color + '20' }}
                        >
                            <Scissors className="w-8 h-8" style={{ color }} />
                        </div>
                        <div>
                            <div className="flex items-center space-x-3 mb-2">
                                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                                    {selectedServicio.nombre}
                                </h1>
                                <span
                                    className={cn(
                                        'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium',
                                        selectedServicio.estado === 'activo'
                                            ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400'
                                            : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                                    )}
                                >
                                    {selectedServicio.estado === 'activo' ? '● Activo' : '○ Inactivo'}
                                </span>
                            </div>
                            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                                <span
                                    className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium"
                                    style={{
                                        backgroundColor: color + '20',
                                        color,
                                    }}
                                >
                                    <Tag className="w-3 h-3 mr-1" />
                                    {categoriaInfo.nombre}
                                </span>
                                <span className="flex items-center">
                                    <Clock className="w-4 h-4 mr-1" />
                                    {formatDuracion(selectedServicio.duracion_minutos)}
                                </span>
                                <span className="flex items-center font-semibold text-purple-600">
                                    <DollarSign className="w-4 h-4 mr-1" />
                                    {formatPrecio(Number(selectedServicio.precio_base))}
                                </span>
                            </div>
                            {selectedServicio.descripcion && (
                                <p className="mt-2 text-gray-600 dark:text-gray-400">
                                    {selectedServicio.descripcion}
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => setShowServicioModal(true)}>
                            <Edit className="w-4 h-4 mr-2" />
                            Editar
                        </Button>
                        {selectedServicio.estado === 'activo' ? (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setShowDesactivarModal(true)}
                                className="border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700"
                            >
                                <Power className="w-4 h-4 mr-2" />
                                Desactivar
                            </Button>
                        ) : (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setShowActivarModal(true)}
                                className="border-green-300 text-green-600 hover:bg-green-50 hover:text-green-700"
                            >
                                <Power className="w-4 h-4 mr-2" />
                                Activar
                            </Button>
                        )}
                    </div>
                </div>
            </div>

            {/* Información Adicional */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Duración</h3>
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                        {formatDuracion(selectedServicio.duracion_minutos)}
                    </p>
                </div>
                <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Precio Base</h3>
                    <p className="text-2xl font-bold text-purple-600">
                        {formatPrecio(Number(selectedServicio.precio_base))}
                    </p>
                </div>
                <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Comisión Especialista</h3>
                    <div className="flex items-center space-x-2">
                        <Percent className="w-5 h-5 text-emerald-600" />
                        <p className="text-2xl font-bold text-emerald-600">
                            {selectedServicio.tipo_comision === 'porcentaje'
                                ? `${Number(selectedServicio.valor_comision)}%`
                                : formatPrecio(Number(selectedServicio.valor_comision))
                            }
                        </p>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                        {selectedServicio.tipo_comision === 'porcentaje'
                            ? `= ${formatPrecio(Math.round((Number(selectedServicio.precio_base) * Number(selectedServicio.valor_comision)) / 100))}`
                            : 'Valor fijo'
                        }
                    </p>
                </div>
                <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Categoría</h3>
                    <p className="text-2xl font-bold" style={{ color }}>
                        {categoriaInfo.nombre}
                    </p>
                </div>
            </div>

            {/* Modals */}
            <ServicioModal
                isOpen={showServicioModal}
                onClose={() => setShowServicioModal(false)}
                servicioId={id}
            />

            {/* Modal Desactivar */}
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
                                ¿Desactivar servicio?
                            </h3>
                            <p className="text-gray-500 dark:text-gray-400 mb-6">
                                El servicio <strong>&ldquo;{selectedServicio.nombre}&rdquo;</strong> no estará disponible para agendar citas.
                            </p>

                            <div className="flex space-x-3">
                                <Button variant="outline" className="flex-1" onClick={() => setShowDesactivarModal(false)}>
                                    Cancelar
                                </Button>
                                <Button
                                    className="flex-1 bg-red-600 hover:bg-red-700"
                                    onClick={handleDesactivar}
                                    disabled={isUpdatingStatus}
                                >
                                    {isUpdatingStatus ? (
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

            {/* Modal Activar */}
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
                                ¿Activar servicio?
                            </h3>
                            <p className="text-gray-500 dark:text-gray-400 mb-6">
                                El servicio <strong>&ldquo;{selectedServicio.nombre}&rdquo;</strong> estará disponible para agendar citas.
                            </p>

                            <div className="flex space-x-3">
                                <Button variant="outline" className="flex-1" onClick={() => setShowActivarModal(false)}>
                                    Cancelar
                                </Button>
                                <Button
                                    className="flex-1 bg-green-600 hover:bg-green-700"
                                    onClick={handleActivar}
                                    disabled={isUpdatingStatus}
                                >
                                    {isUpdatingStatus ? (
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
