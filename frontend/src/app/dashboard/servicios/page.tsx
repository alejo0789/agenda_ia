'use client';

import { useEffect, useState, useMemo } from 'react';
import { useServicioStore } from '@/stores/servicioStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import ServicioModal from '@/components/servicios/ServicioModal';
import CategoriaModal from '@/components/servicios/CategoriaModal';
import { formatDuracion, formatPrecio, DEFAULT_COLORS } from '@/types/servicio';
import { cn } from '@/lib/utils';
import {
    Package,
    Plus,
    Search,
    Scissors,
    Clock,
    DollarSign,
    Loader2,
    Edit,
    Power,
    Tag,
    RefreshCw,
    X,
    Grid3X3,
    List,
    Palette,
} from 'lucide-react';
import { toast } from 'sonner';

export default function ServiciosPage() {
    const {
        servicios,
        categorias,
        isLoading,
        error,
        fetchServicios,
        fetchCategorias,
        deleteServicio,
        activateServicio,
        resetFilters,
        clearError,
    } = useServicioStore();

    const [searchValue, setSearchValue] = useState('');
    const [showServicioModal, setShowServicioModal] = useState(false);
    const [showCategoriaModal, setShowCategoriaModal] = useState(false);
    const [editingServicio, setEditingServicio] = useState<number | null>(null);
    const [editingCategoria, setEditingCategoria] = useState<number | null>(null);
    const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
    const [selectedCategoriaFilter, setSelectedCategoriaFilter] = useState<number | null>(null);
    const [selectedEstadoFilter, setSelectedEstadoFilter] = useState<'todos' | 'activo' | 'inactivo'>('todos');

    // Cargar datos iniciales
    useEffect(() => {
        fetchServicios();
        fetchCategorias();
    }, [fetchServicios, fetchCategorias]);

    // Filtrar servicios localmente
    const filteredServicios = useMemo(() => {
        return servicios.filter((servicio) => {
            // Filtrar por búsqueda
            if (searchValue && !servicio.nombre.toLowerCase().includes(searchValue.toLowerCase())) {
                return false;
            }
            // Filtrar por categoría
            if (selectedCategoriaFilter && servicio.categoria_id !== selectedCategoriaFilter) {
                return false;
            }
            // Filtrar por estado
            if (selectedEstadoFilter !== 'todos' && servicio.estado !== selectedEstadoFilter) {
                return false;
            }
            return true;
        });
    }, [servicios, searchValue, selectedCategoriaFilter, selectedEstadoFilter]);

    const handleNuevoServicio = () => {
        setEditingServicio(null);
        setShowServicioModal(true);
    };

    const handleEditarServicio = (id: number) => {
        setEditingServicio(id);
        setShowServicioModal(true);
    };

    const handleNuevaCategoria = () => {
        setEditingCategoria(null);
        setShowCategoriaModal(true);
    };

    const handleEditarCategoria = (id: number) => {
        setEditingCategoria(id);
        setShowCategoriaModal(true);
    };

    const handleToggleActivo = async (id: number, estadoActual: 'activo' | 'inactivo') => {
        try {
            if (estadoActual === 'activo') {
                await deleteServicio(id);
                toast.success('Servicio desactivado');
            } else {
                await activateServicio(id);
                toast.success('Servicio activado');
            }
        } catch {
            toast.error('Error al cambiar estado del servicio');
        }
    };

    const handleClearFilters = () => {
        setSearchValue('');
        setSelectedCategoriaFilter(null);
        setSelectedEstadoFilter('todos');
        resetFilters();
    };

    // Obtener color para la categoría (usar color del servicio o color por defecto según índice)
    const getCategoriaColor = (categoriaId: number | null | undefined): string => {
        if (!categoriaId) return DEFAULT_COLORS[0];
        const index = categorias.findIndex((c) => c.id === categoriaId);
        return DEFAULT_COLORS[index % DEFAULT_COLORS.length] || DEFAULT_COLORS[0];
    };

    const getCategoriaNombre = (categoriaId: number | null | undefined): string => {
        if (!categoriaId) return 'Sin categoría';
        const categoria = categorias.find((c) => c.id === categoriaId);
        return categoria?.nombre || 'Sin categoría';
    };

    if (isLoading && servicios.length === 0) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                        Gestión de Servicios
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">
                        Administra los servicios y categorías del salón
                    </p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <Button
                        variant="outline"
                        onClick={handleNuevaCategoria}
                        className="border-purple-300 text-purple-600 hover:bg-purple-50"
                    >
                        <Palette className="w-4 h-4 mr-2" />
                        Nueva Categoría
                    </Button>
                    <Button
                        onClick={handleNuevoServicio}
                        disabled={categorias.length === 0}
                        className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        title={categorias.length === 0 ? 'Primero debes crear una categoría' : ''}
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Nuevo Servicio
                    </Button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Total Servicios</p>
                                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                                    {servicios.length}
                                </p>
                            </div>
                            <div className="p-3 rounded-lg bg-purple-100 dark:bg-purple-900/20">
                                <Scissors className="w-6 h-6 text-purple-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Servicios Activos</p>
                                <p className="text-2xl font-bold text-green-600">
                                    {servicios.filter(s => s.estado === 'activo').length}
                                </p>
                            </div>
                            <div className="p-3 rounded-lg bg-green-100 dark:bg-green-900/20">
                                <Power className="w-6 h-6 text-green-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Categorías</p>
                                <p className="text-2xl font-bold text-blue-600">
                                    {categorias.length}
                                </p>
                            </div>
                            <div className="p-3 rounded-lg bg-blue-100 dark:bg-blue-900/20">
                                <Tag className="w-6 h-6 text-blue-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Precio Promedio</p>
                                <p className="text-2xl font-bold text-emerald-600">
                                    {servicios.length > 0
                                        ? formatPrecio(
                                            servicios.reduce((acc, s) => acc + Number(s.precio_base), 0) /
                                            servicios.length
                                        )
                                        : '$0'}
                                </p>
                            </div>
                            <div className="p-3 rounded-lg bg-emerald-100 dark:bg-emerald-900/20">
                                <DollarSign className="w-6 h-6 text-emerald-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Categorías Preview */}
            {categorias.length > 0 && (
                <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-4">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-gray-900 dark:text-gray-100">Categorías</h3>
                        <Button variant="ghost" size="sm" onClick={handleNuevaCategoria}>
                            <Plus className="w-4 h-4 mr-1" />
                            Agregar
                        </Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {categorias.map((categoria, index) => {
                            const color = DEFAULT_COLORS[index % DEFAULT_COLORS.length];
                            return (
                                <button
                                    key={categoria.id}
                                    onClick={() => handleEditarCategoria(categoria.id)}
                                    className={cn(
                                        'inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-all hover:scale-105',
                                        'border border-gray-200 dark:border-gray-700 hover:shadow-md'
                                    )}
                                    style={{
                                        backgroundColor: color + '20',
                                        borderColor: color + '40',
                                    }}
                                >
                                    <span
                                        className="w-3 h-3 rounded-full mr-2"
                                        style={{ backgroundColor: color }}
                                    />
                                    {categoria.nombre}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Toolbar: Search & Filters */}
            <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-4">
                <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                    {/* Search */}
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                            placeholder="Buscar servicios por nombre..."
                            value={searchValue}
                            onChange={(e) => setSearchValue(e.target.value)}
                            className="pl-10"
                        />
                    </div>

                    {/* Filter buttons */}
                    <div className="flex flex-wrap gap-2">
                        {/* Categoría Filter */}
                        <select
                            value={selectedCategoriaFilter || ''}
                            onChange={(e) => setSelectedCategoriaFilter(e.target.value ? Number(e.target.value) : null)}
                            className="px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                        >
                            <option value="">Todas las categorías</option>
                            {categorias.map((cat) => (
                                <option key={cat.id} value={cat.id}>{cat.nombre}</option>
                            ))}
                        </select>

                        {/* Estado Filter */}
                        <select
                            value={selectedEstadoFilter}
                            onChange={(e) => setSelectedEstadoFilter(e.target.value as 'todos' | 'activo' | 'inactivo')}
                            className="px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                        >
                            <option value="todos">Todos los estados</option>
                            <option value="activo">Activos</option>
                            <option value="inactivo">Inactivos</option>
                        </select>

                        {/* View mode toggle */}
                        <div className="flex border border-gray-200 dark:border-gray-700 rounded-md">
                            <button
                                onClick={() => setViewMode('table')}
                                className={cn(
                                    'p-2 transition-colors',
                                    viewMode === 'table'
                                        ? 'bg-purple-100 dark:bg-purple-900/20 text-purple-600'
                                        : 'text-gray-400 hover:text-gray-600'
                                )}
                            >
                                <List className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => setViewMode('cards')}
                                className={cn(
                                    'p-2 transition-colors',
                                    viewMode === 'cards'
                                        ? 'bg-purple-100 dark:bg-purple-900/20 text-purple-600'
                                        : 'text-gray-400 hover:text-gray-600'
                                )}
                            >
                                <Grid3X3 className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Clear filters */}
                        {(searchValue || selectedCategoriaFilter || selectedEstadoFilter !== 'todos') && (
                            <Button variant="ghost" size="sm" onClick={handleClearFilters}>
                                <X className="w-4 h-4 mr-1" />
                                Limpiar
                            </Button>
                        )}

                        {/* Refresh */}
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => fetchServicios()}
                            disabled={isLoading}
                        >
                            <RefreshCw className={cn('w-4 h-4', isLoading && 'animate-spin')} />
                        </Button>
                    </div>
                </div>
            </div>

            {/* Error */}
            {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                    <p className="text-red-600 dark:text-red-400">{error}</p>
                    <Button variant="ghost" size="sm" onClick={clearError} className="mt-2">
                        Cerrar
                    </Button>
                </div>
            )}

            {/* Content */}
            {filteredServicios.length === 0 ? (
                <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-12 text-center">
                    <Package className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                        No hay servicios
                    </h3>
                    {categorias.length === 0 ? (
                        <>
                            <p className="text-gray-500 dark:text-gray-400 mb-4">
                                Para crear servicios, primero debes crear al menos una categoría.
                            </p>
                            <Button onClick={handleNuevaCategoria} className="bg-gradient-to-r from-purple-600 to-pink-600">
                                <Palette className="w-4 h-4 mr-2" />
                                Crear primera categoría
                            </Button>
                        </>
                    ) : (
                        <>
                            <p className="text-gray-500 dark:text-gray-400 mb-4">
                                {searchValue || selectedCategoriaFilter || selectedEstadoFilter !== 'todos'
                                    ? 'No se encontraron servicios con los filtros aplicados'
                                    : 'Comienza creando tu primer servicio'}
                            </p>
                            <Button onClick={handleNuevoServicio} className="bg-gradient-to-r from-purple-600 to-pink-600">
                                <Plus className="w-4 h-4 mr-2" />
                                Crear primer servicio
                            </Button>
                        </>
                    )}
                </div>
            ) : viewMode === 'table' ? (
                /* Table View */
                <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 dark:bg-gray-800">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        Servicio
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        Categoría
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        Duración
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        Precio
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
                                {filteredServicios.map((servicio) => {
                                    const color = servicio.color_calendario || getCategoriaColor(servicio.categoria_id);
                                    return (
                                        <tr
                                            key={servicio.id}
                                            className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                                        >
                                            <td className="px-6 py-4">
                                                <div className="flex items-center">
                                                    <div
                                                        className="w-10 h-10 rounded-lg flex items-center justify-center mr-3"
                                                        style={{
                                                            backgroundColor: color + '20',
                                                        }}
                                                    >
                                                        <Scissors
                                                            className="w-5 h-5"
                                                            style={{ color }}
                                                        />
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-gray-900 dark:text-gray-100">
                                                            {servicio.nombre}
                                                        </p>
                                                        {servicio.descripcion && (
                                                            <p className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-[200px]">
                                                                {servicio.descripcion}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span
                                                    className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium"
                                                    style={{
                                                        backgroundColor: color + '20',
                                                        color: color,
                                                    }}
                                                >
                                                    <span
                                                        className="w-2 h-2 rounded-full mr-1.5"
                                                        style={{ backgroundColor: color }}
                                                    />
                                                    {getCategoriaNombre(servicio.categoria_id)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center text-gray-600 dark:text-gray-400">
                                                    <Clock className="w-4 h-4 mr-1" />
                                                    {formatDuracion(servicio.duracion_minutos)}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <p className="font-semibold text-gray-900 dark:text-gray-100">
                                                    {formatPrecio(Number(servicio.precio_base))}
                                                </p>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span
                                                    className={cn(
                                                        'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium',
                                                        servicio.estado === 'activo'
                                                            ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400'
                                                            : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                                                    )}
                                                >
                                                    {servicio.estado === 'activo' ? '● Activo' : '○ Inactivo'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center justify-end space-x-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleEditarServicio(servicio.id)}
                                                    >
                                                        <Edit className="w-4 h-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleToggleActivo(servicio.id, servicio.estado)}
                                                        className={cn(
                                                            servicio.estado === 'activo'
                                                                ? 'text-red-600 hover:text-red-700 hover:bg-red-50'
                                                                : 'text-green-600 hover:text-green-700 hover:bg-green-50'
                                                        )}
                                                    >
                                                        <Power className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                /* Cards View */
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {filteredServicios.map((servicio) => {
                        const color = servicio.color_calendario || getCategoriaColor(servicio.categoria_id);
                        return (
                            <Card
                                key={servicio.id}
                                className={cn(
                                    'hover:shadow-lg transition-all cursor-pointer group',
                                    servicio.estado === 'inactivo' && 'opacity-60'
                                )}
                                onClick={() => handleEditarServicio(servicio.id)}
                            >
                                <CardContent className="p-4">
                                    <div className="flex items-start justify-between mb-3">
                                        <div
                                            className="w-12 h-12 rounded-lg flex items-center justify-center"
                                            style={{
                                                backgroundColor: color + '20',
                                            }}
                                        >
                                            <Scissors
                                                className="w-6 h-6"
                                                style={{ color }}
                                            />
                                        </div>
                                        <span
                                            className={cn(
                                                'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
                                                servicio.estado === 'activo'
                                                    ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400'
                                                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                                            )}
                                        >
                                            {servicio.estado}
                                        </span>
                                    </div>

                                    <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1 group-hover:text-purple-600 transition-colors">
                                        {servicio.nombre}
                                    </h3>

                                    <span
                                        className="inline-flex items-center text-xs mb-3"
                                        style={{ color }}
                                    >
                                        <span
                                            className="w-2 h-2 rounded-full mr-1.5"
                                            style={{ backgroundColor: color }}
                                        />
                                        {getCategoriaNombre(servicio.categoria_id)}
                                    </span>

                                    <div className="flex items-center justify-between text-sm">
                                        <div className="flex items-center text-gray-500 dark:text-gray-400">
                                            <Clock className="w-4 h-4 mr-1" />
                                            {formatDuracion(servicio.duracion_minutos)}
                                        </div>
                                        <div className="font-semibold text-purple-600">
                                            {formatPrecio(Number(servicio.precio_base))}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}

            {/* Modals */}
            <ServicioModal
                isOpen={showServicioModal}
                onClose={() => {
                    setShowServicioModal(false);
                    setEditingServicio(null);
                }}
                servicioId={editingServicio}
            />
            <CategoriaModal
                isOpen={showCategoriaModal}
                onClose={() => {
                    setShowCategoriaModal(false);
                    setEditingCategoria(null);
                }}
                categoriaId={editingCategoria}
            />
        </div>
    );
}
