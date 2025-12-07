'use client';

import { useState, useEffect, useCallback } from 'react';
import { useClienteStore } from '@/stores/clienteStore';
import { Cliente, ClienteListItem } from '@/types/cliente';
import ClienteAvatar from './ClienteAvatar';
import ClienteEstadoBadge from './ClienteEstadoBadge';
import ClienteForm from './ClienteForm';
import ClienteDetalle from './ClienteDetalle';
import {
    Search,
    Plus,
    MoreHorizontal,
    Eye,
    Edit,
    Trash2,
    RefreshCcw,
    ChevronLeft,
    ChevronRight,
    Filter,
    X,
    Loader2,
    Users,
    Tag,
} from 'lucide-react';

// Debounce hook
function useDebounce<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);

    return debouncedValue;
}

export default function ClienteTable() {
    const {
        clientes,
        isLoading,
        error,
        total,
        pagina,
        porPagina,
        totalPaginas,
        filters,
        etiquetas,
        fetchClientes,
        fetchEtiquetas,
        setFilters,
        resetFilters,
        deleteCliente,
        reactivarCliente,
        fetchCliente,
        selectedCliente,
        clearSelectedCliente,
    } = useClienteStore();

    const [searchQuery, setSearchQuery] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [showDetalle, setShowDetalle] = useState(false);
    const [clienteToEdit, setClienteToEdit] = useState<Cliente | null>(null);
    const [activeDropdown, setActiveDropdown] = useState<number | null>(null);

    const debouncedSearch = useDebounce(searchQuery, 300);

    // Cargar clientes y etiquetas inicialmente
    useEffect(() => {
        fetchClientes();
        fetchEtiquetas();
    }, [fetchClientes, fetchEtiquetas]);

    // Buscar cuando cambia el término de búsqueda
    useEffect(() => {
        setFilters({ query: debouncedSearch || undefined });
        fetchClientes({ query: debouncedSearch || undefined });
    }, [debouncedSearch, setFilters, fetchClientes]);

    const handleEstadoChange = (estado: string) => {
        const estadoValue = estado as 'activo' | 'inactivo' | 'todos';
        setFilters({ estado: estadoValue });
        fetchClientes({ estado: estadoValue });
    };

    const handleEtiquetaChange = (etiquetaId: number | undefined) => {
        setFilters({ etiqueta_id: etiquetaId });
        fetchClientes({ etiqueta_id: etiquetaId });
    };

    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= totalPaginas) {
            setFilters({ pagina: newPage });
            fetchClientes({ pagina: newPage });
        }
    };

    const handleVerDetalle = async (cliente: ClienteListItem) => {
        await fetchCliente(cliente.id);
        setShowDetalle(true);
    };

    const handleEditar = async (cliente: ClienteListItem) => {
        await fetchCliente(cliente.id);
        if (selectedCliente) {
            setClienteToEdit(selectedCliente);
            setShowForm(true);
        }
        setActiveDropdown(null);
    };

    const handleEditarFromDetalle = () => {
        if (selectedCliente) {
            setClienteToEdit(selectedCliente);
            setShowDetalle(false);
            setShowForm(true);
        }
    };

    const handleDesactivar = async (cliente: ClienteListItem) => {
        if (window.confirm(`¿Estás seguro de desactivar a ${cliente.nombre} ${cliente.apellido || ''}?`)) {
            try {
                await deleteCliente(cliente.id);
            } catch (error) {
                console.error('Error al desactivar cliente:', error);
            }
        }
        setActiveDropdown(null);
    };

    const handleReactivar = async (cliente: ClienteListItem) => {
        try {
            await reactivarCliente(cliente.id);
        } catch (error) {
            console.error('Error al reactivar cliente:', error);
        }
        setActiveDropdown(null);
    };

    const handleCloseForm = () => {
        setShowForm(false);
        setClienteToEdit(null);
    };

    const handleCloseDetalle = () => {
        setShowDetalle(false);
        clearSelectedCliente();
    };

    const handleFormSuccess = () => {
        fetchClientes();
    };

    const handleClearFilters = () => {
        setSearchQuery('');
        resetFilters();
        fetchClientes();
    };

    const hasActiveFilters = searchQuery || filters.estado !== 'activo' || filters.etiqueta_id;

    // Cerrar dropdown al hacer click fuera
    useEffect(() => {
        const handleClickOutside = () => setActiveDropdown(null);
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, []);

    return (
        <div className="space-y-6">
            {/* Barra de herramientas */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                {/* Búsqueda */}
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Buscar por nombre, teléfono o email..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                    />
                </div>

                <div className="flex items-center gap-3">
                    {/* Filtro de estado */}
                    <select
                        value={filters.estado || 'activo'}
                        onChange={(e) => handleEstadoChange(e.target.value)}
                        className="px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                    >
                        <option value="activo">Activos</option>
                        <option value="inactivo">Inactivos</option>
                        <option value="todos">Todos</option>
                    </select>

                    {/* Botón de filtros avanzados */}
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={`p-3 rounded-xl border transition-all ${showFilters || filters.etiqueta_id
                                ? 'bg-purple-100 dark:bg-purple-900/30 border-purple-300 dark:border-purple-700 text-purple-600 dark:text-purple-400'
                                : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                            }`}
                    >
                        <Filter className="w-5 h-5" />
                    </button>

                    {/* Limpiar filtros */}
                    {hasActiveFilters && (
                        <button
                            onClick={handleClearFilters}
                            className="flex items-center gap-2 px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all"
                        >
                            <X className="w-4 h-4" />
                            Limpiar
                        </button>
                    )}

                    {/* Botón nuevo cliente */}
                    <button
                        onClick={() => setShowForm(true)}
                        className="flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium hover:from-purple-700 hover:to-pink-700 shadow-lg hover:shadow-xl transition-all"
                    >
                        <Plus className="w-5 h-5" />
                        Nuevo Cliente
                    </button>
                </div>
            </div>

            {/* Panel de filtros avanzados */}
            {showFilters && (
                <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700 space-y-4">
                    <div className="flex items-center gap-4 flex-wrap">
                        <div className="flex items-center gap-2">
                            <Tag className="w-4 h-4 text-gray-500" />
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                Filtrar por etiqueta:
                            </span>
                        </div>
                        <select
                            value={filters.etiqueta_id || ''}
                            onChange={(e) => handleEtiquetaChange(e.target.value ? Number(e.target.value) : undefined)}
                            className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                        >
                            <option value="">Todas las etiquetas</option>
                            {etiquetas.map((etiqueta) => (
                                <option key={etiqueta.id} value={etiqueta.id}>
                                    {etiqueta.nombre} ({etiqueta.total_clientes || 0})
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            )}

            {/* Estado de error */}
            {error && (
                <div className="p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl">
                    <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                </div>
            )}

            {/* Tabla */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl overflow-hidden border border-gray-200 dark:border-gray-700">
                {/* Header de tabla */}
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Cliente
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Contacto
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Etiquetas
                                </th>
                                <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Visitas
                                </th>
                                <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Estado
                                </th>
                                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Acciones
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-16 text-center">
                                        <div className="flex flex-col items-center gap-3">
                                            <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
                                            <span className="text-gray-500 dark:text-gray-400">
                                                Cargando clientes...
                                            </span>
                                        </div>
                                    </td>
                                </tr>
                            ) : clientes.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-16 text-center">
                                        <div className="flex flex-col items-center gap-3">
                                            <Users className="w-12 h-12 text-gray-300 dark:text-gray-600" />
                                            <span className="text-gray-500 dark:text-gray-400">
                                                No se encontraron clientes
                                            </span>
                                            {hasActiveFilters && (
                                                <button
                                                    onClick={handleClearFilters}
                                                    className="text-purple-600 hover:text-purple-700 text-sm font-medium"
                                                >
                                                    Limpiar filtros
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                clientes.map((cliente) => (
                                    <tr
                                        key={cliente.id}
                                        className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer"
                                        onClick={() => handleVerDetalle(cliente)}
                                    >
                                        {/* Cliente */}
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <ClienteAvatar
                                                    nombre={cliente.nombre}
                                                    apellido={cliente.apellido}
                                                    size="md"
                                                />
                                                <div>
                                                    <div className="font-medium text-gray-900 dark:text-white">
                                                        {cliente.nombre} {cliente.apellido || ''}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>

                                        {/* Contacto */}
                                        <td className="px-6 py-4">
                                            <div className="text-sm text-gray-600 dark:text-gray-400">
                                                {cliente.telefono && (
                                                    <div>{cliente.telefono}</div>
                                                )}
                                                {cliente.email && (
                                                    <div className="text-xs text-gray-400 dark:text-gray-500 truncate max-w-[200px]">
                                                        {cliente.email}
                                                    </div>
                                                )}
                                                {!cliente.telefono && !cliente.email && (
                                                    <span className="text-gray-400">Sin contacto</span>
                                                )}
                                            </div>
                                        </td>

                                        {/* Etiquetas */}
                                        <td className="px-6 py-4">
                                            <div className="flex gap-1.5 flex-wrap max-w-[200px]">
                                                {cliente.etiquetas?.slice(0, 3).map((etiqueta) => (
                                                    <span
                                                        key={etiqueta.id}
                                                        className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
                                                        style={{
                                                            backgroundColor: `${etiqueta.color}20`,
                                                            color: etiqueta.color,
                                                            border: `1px solid ${etiqueta.color}40`,
                                                        }}
                                                    >
                                                        {etiqueta.nombre}
                                                    </span>
                                                ))}
                                                {cliente.etiquetas && cliente.etiquetas.length > 3 && (
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                                                        +{cliente.etiquetas.length - 3}
                                                    </span>
                                                )}
                                            </div>
                                        </td>

                                        {/* Visitas */}
                                        <td className="px-6 py-4 text-center">
                                            <div className="text-lg font-semibold text-gray-900 dark:text-white">
                                                {cliente.total_visitas}
                                            </div>
                                            {cliente.ultima_visita && (
                                                <div className="text-xs text-gray-400 dark:text-gray-500">
                                                    Última: {new Date(cliente.ultima_visita).toLocaleDateString('es-CO')}
                                                </div>
                                            )}
                                        </td>

                                        {/* Estado */}
                                        <td className="px-6 py-4 text-center">
                                            <ClienteEstadoBadge estado={cliente.estado} />
                                        </td>

                                        {/* Acciones */}
                                        <td className="px-6 py-4 text-right">
                                            <div className="relative inline-block">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setActiveDropdown(activeDropdown === cliente.id ? null : cliente.id);
                                                    }}
                                                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                                                >
                                                    <MoreHorizontal className="w-5 h-5 text-gray-400" />
                                                </button>

                                                {activeDropdown === cliente.id && (
                                                    <div
                                                        className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-20"
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        <button
                                                            onClick={() => handleVerDetalle(cliente)}
                                                            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                                                        >
                                                            <Eye className="w-4 h-4" />
                                                            Ver detalle
                                                        </button>
                                                        <button
                                                            onClick={() => handleEditar(cliente)}
                                                            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                                                        >
                                                            <Edit className="w-4 h-4" />
                                                            Editar
                                                        </button>
                                                        {cliente.estado === 'activo' ? (
                                                            <button
                                                                onClick={() => handleDesactivar(cliente)}
                                                                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                                Desactivar
                                                            </button>
                                                        ) : (
                                                            <button
                                                                onClick={() => handleReactivar(cliente)}
                                                                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20"
                                                            >
                                                                <RefreshCcw className="w-4 h-4" />
                                                                Reactivar
                                                            </button>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Paginación */}
                {!isLoading && clientes.length > 0 && (
                    <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                            Mostrando {((pagina - 1) * porPagina) + 1} - {Math.min(pagina * porPagina, total)} de {total} clientes
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => handlePageChange(pagina - 1)}
                                disabled={pagina <= 1}
                                className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                            </button>

                            <div className="flex items-center gap-1">
                                {Array.from({ length: Math.min(5, totalPaginas) }, (_, i) => {
                                    let pageNum;
                                    if (totalPaginas <= 5) {
                                        pageNum = i + 1;
                                    } else if (pagina <= 3) {
                                        pageNum = i + 1;
                                    } else if (pagina >= totalPaginas - 2) {
                                        pageNum = totalPaginas - 4 + i;
                                    } else {
                                        pageNum = pagina - 2 + i;
                                    }

                                    return (
                                        <button
                                            key={pageNum}
                                            onClick={() => handlePageChange(pageNum)}
                                            className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors ${pagina === pageNum
                                                    ? 'bg-purple-600 text-white'
                                                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                                                }`}
                                        >
                                            {pageNum}
                                        </button>
                                    );
                                })}
                            </div>

                            <button
                                onClick={() => handlePageChange(pagina + 1)}
                                disabled={pagina >= totalPaginas}
                                className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Modal de formulario */}
            <ClienteForm
                isOpen={showForm}
                onClose={handleCloseForm}
                clienteToEdit={clienteToEdit}
                onSuccess={handleFormSuccess}
            />

            {/* Modal de detalle */}
            <ClienteDetalle
                isOpen={showDetalle}
                onClose={handleCloseDetalle}
                cliente={selectedCliente}
                onEditar={handleEditarFromDetalle}
            />
        </div>
    );
}
