'use client';

import { Cliente } from '@/types/cliente';
import ClienteAvatar from './ClienteAvatar';
import ClienteEstadoBadge from './ClienteEstadoBadge';
import {
    X,
    Edit,
    Phone,
    Mail,
    MapPin,
    Calendar,
    FileText,
    TrendingUp,
    Clock,
    Tag,
    AlertCircle,
} from 'lucide-react';

interface ClienteDetalleProps {
    isOpen: boolean;
    onClose: () => void;
    cliente: Cliente | null;
    onEditar?: () => void;
}

function formatDate(dateString: string | null | undefined): string {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('es-CO', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
}

function formatShortDate(dateString: string | null | undefined): string {
    if (!dateString) return 'Sin visitas';
    return new Date(dateString).toLocaleDateString('es-CO', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
}

export default function ClienteDetalle({
    isOpen,
    onClose,
    cliente,
    onEditar,
}: ClienteDetalleProps) {
    if (!isOpen || !cliente) return null;

    const nombreCompleto = `${cliente.nombre} ${cliente.apellido || ''}`.trim();

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Overlay */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-900 rounded-2xl shadow-2xl mx-4">
                {/* Header */}
                <div className="sticky top-0 z-10 bg-gradient-to-r from-purple-600 to-pink-600 rounded-t-2xl">
                    <div className="flex items-start justify-between p-6">
                        <div className="flex items-center gap-4">
                            <ClienteAvatar
                                nombre={cliente.nombre}
                                apellido={cliente.apellido}
                                size="lg"
                                className="ring-4 ring-white/30 shadow-xl"
                            />
                            <div>
                                <h2 className="text-2xl font-bold text-white">
                                    {nombreCompleto}
                                </h2>
                                <div className="flex items-center gap-2 mt-2">
                                    <ClienteEstadoBadge
                                        estado={cliente.estado}
                                        className="bg-white/20 text-white border-white/30"
                                    />
                                    {cliente.etiquetas?.map((etiqueta) => (
                                        <span
                                            key={etiqueta.id}
                                            className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-white/20 text-white border border-white/30"
                                        >
                                            {etiqueta.nombre}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            {onEditar && (
                                <button
                                    onClick={onEditar}
                                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/20 hover:bg-white/30 text-white font-medium transition-all"
                                >
                                    <Edit className="w-4 h-4" />
                                    Editar
                                </button>
                            )}
                            <button
                                onClick={onClose}
                                className="p-2 rounded-lg bg-white/20 hover:bg-white/30 transition-colors"
                            >
                                <X className="w-5 h-5 text-white" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* Estadísticas */}
                    <div className="grid grid-cols-3 gap-4">
                        <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl p-4 border border-purple-100 dark:border-purple-800">
                            <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 mb-2">
                                <TrendingUp className="w-5 h-5" />
                                <span className="text-xs font-medium uppercase tracking-wider">
                                    Total Visitas
                                </span>
                            </div>
                            <div className="text-3xl font-bold text-gray-900 dark:text-white">
                                {cliente.total_visitas || 0}
                            </div>
                        </div>

                        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-xl p-4 border border-blue-100 dark:border-blue-800">
                            <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 mb-2">
                                <Calendar className="w-5 h-5" />
                                <span className="text-xs font-medium uppercase tracking-wider">
                                    Primera Visita
                                </span>
                            </div>
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                                {formatShortDate(cliente.fecha_primera_visita)}
                            </div>
                        </div>

                        <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-4 border border-green-100 dark:border-green-800">
                            <div className="flex items-center gap-2 text-green-600 dark:text-green-400 mb-2">
                                <Clock className="w-5 h-5" />
                                <span className="text-xs font-medium uppercase tracking-wider">
                                    Última Visita
                                </span>
                            </div>
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                                {formatShortDate(cliente.ultima_visita)}
                            </div>
                        </div>
                    </div>

                    {/* Información de contacto */}
                    <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
                        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-4">
                            Información de Contacto
                        </h3>
                        <div className="space-y-3">
                            {cliente.telefono && (
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                                        <Phone className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                    </div>
                                    <div>
                                        <div className="text-xs text-gray-500 dark:text-gray-400">
                                            Teléfono
                                        </div>
                                        <a
                                            href={`tel:${cliente.telefono}`}
                                            className="font-medium text-gray-900 dark:text-white hover:text-purple-600 dark:hover:text-purple-400"
                                        >
                                            {cliente.telefono}
                                        </a>
                                    </div>
                                </div>
                            )}

                            {cliente.email && (
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                                        <Mail className="w-5 h-5 text-green-600 dark:text-green-400" />
                                    </div>
                                    <div>
                                        <div className="text-xs text-gray-500 dark:text-gray-400">
                                            Email
                                        </div>
                                        <a
                                            href={`mailto:${cliente.email}`}
                                            className="font-medium text-gray-900 dark:text-white hover:text-purple-600 dark:hover:text-purple-400"
                                        >
                                            {cliente.email}
                                        </a>
                                    </div>
                                </div>
                            )}

                            {cliente.direccion && (
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                                        <MapPin className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                                    </div>
                                    <div>
                                        <div className="text-xs text-gray-500 dark:text-gray-400">
                                            Dirección
                                        </div>
                                        <div className="font-medium text-gray-900 dark:text-white">
                                            {cliente.direccion}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {cliente.fecha_nacimiento && (
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-pink-100 dark:bg-pink-900/30 flex items-center justify-center">
                                        <Calendar className="w-5 h-5 text-pink-600 dark:text-pink-400" />
                                    </div>
                                    <div>
                                        <div className="text-xs text-gray-500 dark:text-gray-400">
                                            Fecha de Nacimiento
                                        </div>
                                        <div className="font-medium text-gray-900 dark:text-white">
                                            {formatDate(cliente.fecha_nacimiento)}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {!cliente.telefono && !cliente.email && !cliente.direccion && !cliente.fecha_nacimiento && (
                                <p className="text-gray-400 dark:text-gray-500 text-center py-4">
                                    No hay información de contacto disponible
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Etiquetas */}
                    {cliente.etiquetas && cliente.etiquetas.length > 0 && (
                        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
                            <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-4">
                                <Tag className="w-4 h-4" />
                                Etiquetas
                            </h3>
                            <div className="flex flex-wrap gap-2">
                                {cliente.etiquetas.map((etiqueta) => (
                                    <span
                                        key={etiqueta.id}
                                        className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium"
                                        style={{
                                            backgroundColor: `${etiqueta.color}20`,
                                            color: etiqueta.color,
                                            border: `1px solid ${etiqueta.color}40`,
                                        }}
                                    >
                                        {etiqueta.nombre}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Preferencias - Alergias */}
                    {cliente.preferencias?.alergias && (
                        <div className="bg-orange-50 dark:bg-orange-900/20 rounded-xl p-5 border border-orange-200 dark:border-orange-800">
                            <h3 className="flex items-center gap-2 text-sm font-semibold text-orange-700 dark:text-orange-400 uppercase tracking-wider mb-3">
                                <AlertCircle className="w-4 h-4" />
                                Alergias / Condiciones
                            </h3>
                            <p className="text-gray-700 dark:text-gray-300">
                                {cliente.preferencias.alergias}
                            </p>
                        </div>
                    )}

                    {/* Preferencias - Notas de servicio */}
                    {cliente.preferencias?.notas_servicio && (
                        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
                            <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-3">
                                <FileText className="w-4 h-4" />
                                Notas de Servicio
                            </h3>
                            <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                                {cliente.preferencias.notas_servicio}
                            </p>
                        </div>
                    )}

                    {/* Notas generales */}
                    {cliente.notas && (
                        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
                            <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-3">
                                <FileText className="w-4 h-4" />
                                Notas
                            </h3>
                            <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                                {cliente.notas}
                            </p>
                        </div>
                    )}

                    {/* Fecha de registro */}
                    <div className="text-center text-xs text-gray-400 dark:text-gray-500 pt-4 border-t border-gray-200 dark:border-gray-700">
                        Cliente registrado el {formatDate(cliente.fecha_creacion)}
                    </div>
                </div>
            </div>
        </div>
    );
}
