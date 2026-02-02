'use client';

import { useEffect, useState, useMemo } from 'react';
import { useProveedorStore } from '@/stores/inventarioStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import {
    Truck,
    Plus,
    Search,
    Loader2,
    Edit,
    Power,
    RefreshCw,
    X,
    ChevronRight,
    Phone,
    Mail,
    MapPin,
    Package,
    User,
} from 'lucide-react';
import { toast } from 'sonner';
import ProveedorModal from '@/components/inventario/ProveedorModal';
import { Proveedor } from '@/types/inventario';

export default function ProveedoresPage() {
    const {
        proveedores,
        isLoading,
        error,
        fetchProveedores,
        deleteProveedor,
        clearError,
    } = useProveedorStore();

    const [searchValue, setSearchValue] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingProveedor, setEditingProveedor] = useState<number | null>(null);
    const [estadoFilter, setEstadoFilter] = useState<'todos' | 'activo' | 'inactivo'>('todos');

    useEffect(() => {
        fetchProveedores();
    }, [fetchProveedores]);

    const filteredProveedores = useMemo(() => {
        return proveedores.filter((proveedor) => {
            if (searchValue) {
                const searchLower = searchValue.toLowerCase();
                const matchesNombre = proveedor.nombre.toLowerCase().includes(searchLower);
                const matchesContacto = proveedor.contacto?.toLowerCase().includes(searchLower);
                if (!matchesNombre && !matchesContacto) return false;
            }
            if (estadoFilter !== 'todos' && proveedor.estado !== estadoFilter) {
                return false;
            }
            return true;
        });
    }, [proveedores, searchValue, estadoFilter]);

    const stats = useMemo(() => ({
        total: proveedores.length,
        activos: proveedores.filter(p => p.estado === 'activo').length,
        inactivos: proveedores.filter(p => p.estado === 'inactivo').length,
    }), [proveedores]);

    const handleNuevoProveedor = () => {
        setEditingProveedor(null);
        setShowModal(true);
    };

    const handleEditarProveedor = (id: number) => {
        setEditingProveedor(id);
        setShowModal(true);
    };

    const handleToggleActivo = async (proveedor: Proveedor) => {
        try {
            // Soft delete toggle
            if (proveedor.estado === 'activo') {
                await deleteProveedor(proveedor.id);
                toast.success('Proveedor desactivado');
            }
            fetchProveedores();
        } catch {
            toast.error('Error al cambiar estado del proveedor');
        }
    };

    if (isLoading && proveedores.length === 0) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Breadcrumb */}
            <div className="flex items-center text-sm text-gray-500">
                <Link href="/dashboard/inventario" className="hover:text-blue-600 transition-colors">
                    Inventario
                </Link>
                <ChevronRight className="w-4 h-4 mx-2" />
                <span className="text-gray-900 dark:text-gray-100 font-medium">Proveedores</span>
            </div>

            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                        Gestión de Proveedores
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">
                        Administra tus proveedores de productos
                    </p>
                </div>
                <Button
                    onClick={handleNuevoProveedor}
                    className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    Nuevo Proveedor
                </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-800">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-blue-600 dark:text-blue-400">Total Proveedores</p>
                                <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">{stats.total}</p>
                            </div>
                            <div className="p-3 rounded-lg bg-blue-200 dark:bg-blue-800/50">
                                <Truck className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-800">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-green-600 dark:text-green-400">Activos</p>
                                <p className="text-2xl font-bold text-green-900 dark:text-green-100">{stats.activos}</p>
                            </div>
                            <div className="p-3 rounded-lg bg-green-200 dark:bg-green-800/50">
                                <Power className="w-6 h-6 text-green-600 dark:text-green-400" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900/20 dark:to-gray-800/20 border-gray-200 dark:border-gray-700">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Inactivos</p>
                                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.inactivos}</p>
                            </div>
                            <div className="p-3 rounded-lg bg-gray-200 dark:bg-gray-800/50">
                                <Power className="w-6 h-6 text-gray-500" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Toolbar */}
            <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-4">
                <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                            placeholder="Buscar por nombre o contacto..."
                            value={searchValue}
                            onChange={(e) => setSearchValue(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                    <div className="flex gap-2">
                        <select
                            value={estadoFilter}
                            onChange={(e) => setEstadoFilter(e.target.value as typeof estadoFilter)}
                            className="px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800"
                        >
                            <option value="todos">Todos</option>
                            <option value="activo">Activos</option>
                            <option value="inactivo">Inactivos</option>
                        </select>
                        {(searchValue || estadoFilter !== 'todos') && (
                            <Button variant="ghost" size="sm" onClick={() => { setSearchValue(''); setEstadoFilter('todos'); }}>
                                <X className="w-4 h-4 mr-1" />
                                Limpiar
                            </Button>
                        )}
                        <Button variant="ghost" size="sm" onClick={() => fetchProveedores()} disabled={isLoading}>
                            <RefreshCw className={cn('w-4 h-4', isLoading && 'animate-spin')} />
                        </Button>
                    </div>
                </div>
            </div>

            {/* Error */}
            {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                    <p className="text-red-600 dark:text-red-400">{error}</p>
                    <Button variant="ghost" size="sm" onClick={clearError} className="mt-2">Cerrar</Button>
                </div>
            )}

            {/* Content */}
            {filteredProveedores.length === 0 ? (
                <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-12 text-center">
                    <Truck className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">No hay proveedores</h3>
                    <p className="text-gray-500 dark:text-gray-400 mb-4">
                        {searchValue || estadoFilter !== 'todos' ? 'No se encontraron proveedores con los filtros aplicados' : 'Comienza agregando tu primer proveedor'}
                    </p>
                    <Button onClick={handleNuevoProveedor} className="bg-gradient-to-r from-blue-600 to-cyan-600">
                        <Plus className="w-4 h-4 mr-2" />
                        Crear proveedor
                    </Button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredProveedores.map((proveedor) => (
                        <Card
                            key={proveedor.id}
                            className={cn(
                                'hover:shadow-lg transition-all cursor-pointer group',
                                proveedor.estado !== 'activo' && 'opacity-60'
                            )}
                            onClick={() => handleEditarProveedor(proveedor.id)}
                        >
                            <CardContent className="p-5">
                                <div className="flex items-start justify-between mb-3">
                                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-blue-900/30 dark:to-cyan-900/30 flex items-center justify-center">
                                        <Truck className="w-6 h-6 text-blue-600" />
                                    </div>
                                    <span className={cn(
                                        'px-2 py-1 rounded-full text-xs font-medium',
                                        proveedor.estado === 'activo'
                                            ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                                            : 'bg-gray-100 dark:bg-gray-800 text-gray-600'
                                    )}>
                                        {proveedor.estado}
                                    </span>
                                </div>

                                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2 group-hover:text-blue-600 transition-colors">
                                    {proveedor.nombre}
                                </h3>

                                <div className="space-y-1.5 text-sm text-gray-500">
                                    {proveedor.contacto && (
                                        <div className="flex items-center gap-2">
                                            <User className="w-3.5 h-3.5" />
                                            <span className="truncate">{proveedor.contacto}</span>
                                        </div>
                                    )}
                                    {proveedor.telefono && (
                                        <div className="flex items-center gap-2">
                                            <Phone className="w-3.5 h-3.5" />
                                            <span>{proveedor.telefono}</span>
                                        </div>
                                    )}
                                    {proveedor.email && (
                                        <div className="flex items-center gap-2">
                                            <Mail className="w-3.5 h-3.5" />
                                            <span className="truncate">{proveedor.email}</span>
                                        </div>
                                    )}
                                </div>

                                <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100 dark:border-gray-800">
                                    <div className="flex items-center gap-1 text-xs text-gray-400">
                                        <Package className="w-3.5 h-3.5" />
                                        <span>{proveedor.total_productos ?? 0} productos</span>
                                    </div>
                                    <div className="flex gap-1">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={(e) => { e.stopPropagation(); handleEditarProveedor(proveedor.id); }}
                                            className="h-8 w-8 p-0"
                                        >
                                            <Edit className="w-4 h-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={(e) => { e.stopPropagation(); handleToggleActivo(proveedor); }}
                                            className={cn(
                                                'h-8 w-8 p-0',
                                                proveedor.estado === 'activo' ? 'text-red-500 hover:text-red-600' : 'text-green-500 hover:text-green-600'
                                            )}
                                        >
                                            <Power className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Modal */}
            <ProveedorModal
                isOpen={showModal}
                onClose={() => { setShowModal(false); setEditingProveedor(null); }}
                proveedorId={editingProveedor}
            />
        </div>
    );
}
