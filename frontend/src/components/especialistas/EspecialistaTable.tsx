'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Especialista } from '@/types/especialista';
import { useEspecialistaStore } from '@/stores/especialistaStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Search,
    Plus,
    MoreHorizontal,
    Eye,
    Edit,
    Calendar,
    Ban,
    Settings,
    ChevronLeft,
    ChevronRight,
    UserCircle,
    Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface EspecialistaTableProps {
    onManageHorarios?: (especialista: Especialista) => void;
    onManageBloqueos?: (especialista: Especialista) => void;
    onManageServicios?: (especialista: Especialista) => void;
}

export default function EspecialistaTable({
    onManageHorarios,
    onManageBloqueos,
    onManageServicios,
}: EspecialistaTableProps) {
    const router = useRouter();
    const { especialistas, isLoading, isEspecialistasLoading, error, fetchEspecialistas, deleteEspecialista } =
        useEspecialistaStore();

    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<'todos' | 'activo' | 'inactivo'>('todos');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [openActionMenu, setOpenActionMenu] = useState<number | null>(null);

    useEffect(() => {
        fetchEspecialistas();
    }, [fetchEspecialistas]);

    // Filtrar especialistas
    const filteredEspecialistas = useMemo(() => {
        return especialistas.filter((esp) => {
            // Filtro por búsqueda
            const searchLower = searchQuery.toLowerCase();
            const matchesSearch =
                !searchQuery ||
                esp.nombre.toLowerCase().includes(searchLower) ||
                esp.apellido.toLowerCase().includes(searchLower) ||
                esp.documento_identidad?.toLowerCase().includes(searchLower) ||
                esp.telefono?.toLowerCase().includes(searchLower) ||
                esp.email?.toLowerCase().includes(searchLower);

            // Filtro por estado
            const matchesStatus =
                statusFilter === 'todos' || esp.estado === statusFilter;

            return matchesSearch && matchesStatus;
        });
    }, [especialistas, searchQuery, statusFilter]);

    // Paginación
    const totalPages = Math.ceil(filteredEspecialistas.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedEspecialistas = filteredEspecialistas.slice(
        startIndex,
        startIndex + itemsPerPage
    );

    const getInitials = (nombre: string, apellido: string) => {
        return `${nombre.charAt(0)}${apellido.charAt(0)}`.toUpperCase();
    };

    const getRandomColor = (id: number) => {
        const colors = [
            'bg-purple-500',
            'bg-pink-500',
            'bg-blue-500',
            'bg-green-500',
            'bg-yellow-500',
            'bg-red-500',
            'bg-indigo-500',
            'bg-teal-500',
        ];
        return colors[id % colors.length];
    };

    const handleDesactivar = async (id: number) => {
        if (confirm('¿Estás seguro de que deseas desactivar este especialista?')) {
            try {
                await deleteEspecialista(id);
                setOpenActionMenu(null);
            } catch (error) {
                console.error('Error al desactivar especialista:', error);
            }
        }
    };

    if (isEspecialistasLoading && especialistas.length === 0) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="flex flex-col items-center space-y-4">
                    <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
                    <p className="text-gray-500 dark:text-gray-400">Cargando especialistas...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <p className="text-red-500 mb-4">{error}</p>
                    <Button onClick={() => fetchEspecialistas()}>Reintentar</Button>
                </div>
            </div>
        );
    }

    if (especialistas.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-64 space-y-4">
                <div className="w-20 h-20 rounded-full bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center">
                    <UserCircle className="w-10 h-10 text-purple-600 dark:text-purple-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    No hay especialistas registrados
                </h3>
                <p className="text-gray-500 dark:text-gray-400 text-center max-w-md">
                    Comienza agregando tu primer especialista para gestionar la agenda del salón
                </p>
                <Link href="/dashboard/especialistas/nuevo">
                    <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                        <Plus className="w-4 h-4 mr-2" />
                        Crear Primer Especialista
                    </Button>
                </Link>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Filtros y Búsqueda */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                        placeholder="Buscar por nombre, documento..."
                        value={searchQuery}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                        className="pl-10"
                    />
                </div>

                <div className="flex gap-2">
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value as any)}
                        className="px-3 py-2 text-sm border rounded-md bg-background"
                    >
                        <option value="todos">Todos</option>
                        <option value="activo">Activos</option>
                        <option value="inactivo">Inactivos</option>
                    </select>

                    <Link href="/dashboard/especialistas/nuevo">
                        <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                            <Plus className="w-4 h-4 mr-2" />
                            Nuevo Especialista
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Tabla */}
            <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 dark:bg-gray-800">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Foto
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Nombre
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Documento
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Teléfono
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Estado
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Acciones
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {paginatedEspecialistas.map((especialista) => (
                                <tr
                                    key={especialista.id}
                                    onClick={() => router.push(`/dashboard/especialistas/${especialista.id}`)}
                                    className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                                >
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div
                                            className={cn(
                                                'w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm',
                                                getRandomColor(especialista.id)
                                            )}
                                        >
                                            {getInitials(especialista.nombre, especialista.apellido)}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="font-medium text-gray-900 dark:text-gray-100">
                                            {especialista.nombre} {especialista.apellido}
                                        </div>
                                        {especialista.email && (
                                            <div className="text-sm text-gray-500 dark:text-gray-400">
                                                {especialista.email}
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-gray-700 dark:text-gray-300">
                                        {especialista.documento_identidad || '-'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-gray-700 dark:text-gray-300">
                                        {especialista.telefono || '-'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span
                                            className={cn(
                                                'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                                                especialista.estado === 'activo'
                                                    ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                                                    : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400'
                                            )}
                                        >
                                            <span
                                                className={cn(
                                                    'w-1.5 h-1.5 rounded-full mr-1.5',
                                                    especialista.estado === 'activo'
                                                        ? 'bg-green-500'
                                                        : 'bg-gray-500'
                                                )}
                                            />
                                            {especialista.estado === 'activo' ? 'Activo' : 'Inactivo'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right" onClick={(e) => e.stopPropagation()}>
                                        <div className="relative">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setOpenActionMenu(
                                                        openActionMenu === especialista.id ? null : especialista.id
                                                    );
                                                }}
                                            >
                                                <MoreHorizontal className="w-4 h-4" />
                                            </Button>

                                            {openActionMenu === especialista.id && (
                                                <>
                                                    <div
                                                        className="fixed inset-0 z-10"
                                                        onClick={() => setOpenActionMenu(null)}
                                                    />
                                                    <div className="absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 z-20">
                                                        <div className="py-1">
                                                            <Link
                                                                href={`/dashboard/especialistas/${especialista.id}`}
                                                                className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                                                            >
                                                                <Eye className="w-4 h-4 mr-3" />
                                                                Ver Detalle
                                                            </Link>
                                                            <Link
                                                                href={`/dashboard/especialistas/${especialista.id}/editar`}
                                                                className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                                                            >
                                                                <Edit className="w-4 h-4 mr-3" />
                                                                Editar
                                                            </Link>
                                                            <div className="border-t border-gray-100 dark:border-gray-700 my-1" />
                                                            <button
                                                                onClick={() => {
                                                                    onManageHorarios?.(especialista);
                                                                    setOpenActionMenu(null);
                                                                }}
                                                                className="flex w-full items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                                                            >
                                                                <Calendar className="w-4 h-4 mr-3" />
                                                                Gestionar Horarios
                                                            </button>
                                                            <button
                                                                onClick={() => {
                                                                    onManageBloqueos?.(especialista);
                                                                    setOpenActionMenu(null);
                                                                }}
                                                                className="flex w-full items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                                                            >
                                                                <Ban className="w-4 h-4 mr-3" />
                                                                Gestionar Bloqueos
                                                            </button>
                                                            <button
                                                                onClick={() => {
                                                                    onManageServicios?.(especialista);
                                                                    setOpenActionMenu(null);
                                                                }}
                                                                className="flex w-full items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                                                            >
                                                                <Settings className="w-4 h-4 mr-3" />
                                                                Servicios y Comisiones
                                                            </button>
                                                            <div className="border-t border-gray-100 dark:border-gray-700 my-1" />
                                                            <button
                                                                onClick={() => handleDesactivar(especialista.id)}
                                                                className="flex w-full items-center px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                                                            >
                                                                <Ban className="w-4 h-4 mr-3" />
                                                                Desactivar
                                                            </button>
                                                        </div>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Paginación */}
            <div className="flex items-center justify-between px-4 py-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg">
                <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                    Mostrando {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredEspecialistas.length)} de{' '}
                    {filteredEspecialistas.length} especialistas
                </div>

                <div className="flex items-center space-x-2">
                    <select
                        value={itemsPerPage}
                        onChange={(e) => {
                            setItemsPerPage(Number(e.target.value));
                            setCurrentPage(1);
                        }}
                        className="px-2 py-1 text-sm border rounded-md bg-background"
                    >
                        <option value={10}>10</option>
                        <option value={25}>25</option>
                        <option value={50}>50</option>
                        <option value={100}>100</option>
                    </select>

                    <div className="flex items-center space-x-1">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </Button>

                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                            let pageNum;
                            if (totalPages <= 5) {
                                pageNum = i + 1;
                            } else if (currentPage <= 3) {
                                pageNum = i + 1;
                            } else if (currentPage >= totalPages - 2) {
                                pageNum = totalPages - 4 + i;
                            } else {
                                pageNum = currentPage - 2 + i;
                            }

                            return (
                                <Button
                                    key={pageNum}
                                    variant={currentPage === pageNum ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => setCurrentPage(pageNum)}
                                    className={cn(
                                        currentPage === pageNum &&
                                        'bg-gradient-to-r from-purple-600 to-pink-600'
                                    )}
                                >
                                    {pageNum}
                                </Button>
                            );
                        })}

                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                        >
                            <ChevronRight className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
