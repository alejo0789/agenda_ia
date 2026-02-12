'use client';

import { useEffect, useState } from 'react';
import { useProductoStore, useProveedorStore } from '@/stores/inventarioStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import {
    X,
    Loader2,
    Package,
    DollarSign,
    Truck,
    Save,
    AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { ProductoCreate, ProductoUpdate, EstadoProducto } from '@/types/inventario';

interface ProductoModalProps {
    isOpen: boolean;
    onClose: () => void;
    productoId: number | null;
}

const ESTADO_OPTIONS: { value: EstadoProducto; label: string }[] = [
    { value: 'activo', label: 'Activo' },
    { value: 'inactivo', label: 'Inactivo' },
    { value: 'descontinuado', label: 'Descontinuado' },
];

export default function ProductoModal({ isOpen, onClose, productoId }: ProductoModalProps) {
    const { createProducto, updateProducto, fetchProductoById, productoSeleccionado, isLoading } = useProductoStore();
    const { proveedores, fetchProveedores } = useProveedorStore();

    const [formData, setFormData] = useState<ProductoCreate>({
        nombre: '',
        codigo: '',
        codigo_barras: '',
        descripcion: '',
        precio_compra: 0,
        precio_venta: 0,
        precio_colaborador: 0,
        comision_porcentaje: 0,
        proveedor_id: null,
        stock_minimo: 0,
        stock_maximo: undefined,
        estado: 'activo',
    });

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isSaving, setIsSaving] = useState(false);

    const isEditing = productoId !== null;

    // Cargar proveedores
    useEffect(() => {
        if (isOpen && proveedores.length === 0) {
            fetchProveedores();
        }
    }, [isOpen, proveedores.length, fetchProveedores]);

    // Cargar datos del producto si estamos editando
    useEffect(() => {
        if (isOpen && productoId) {
            fetchProductoById(productoId);
        }
    }, [isOpen, productoId, fetchProductoById]);

    // Llenar el formulario con los datos del producto
    useEffect(() => {
        if (isEditing && productoSeleccionado) {
            setFormData({
                nombre: productoSeleccionado.nombre,
                codigo: productoSeleccionado.codigo || '',
                codigo_barras: productoSeleccionado.codigo_barras || '',
                descripcion: productoSeleccionado.descripcion || '',
                precio_compra: productoSeleccionado.precio_compra,
                precio_venta: productoSeleccionado.precio_venta,
                precio_colaborador: productoSeleccionado.precio_colaborador || 0,
                comision_porcentaje: productoSeleccionado.comision_porcentaje || 0,
                proveedor_id: productoSeleccionado.proveedor_id,
                stock_minimo: productoSeleccionado.stock_minimo,
                stock_maximo: productoSeleccionado.stock_maximo || undefined,
                estado: productoSeleccionado.estado,
            });
        } else if (!isEditing) {
            // Reset form for new product
            setFormData({
                nombre: '',
                codigo: '',
                codigo_barras: '',
                descripcion: '',
                precio_compra: 0,
                precio_venta: 0,
                precio_colaborador: 0,
                comision_porcentaje: 0,
                proveedor_id: null,
                stock_minimo: 0,
                stock_maximo: undefined,
                estado: 'activo',
            });
        }
        setErrors({});
    }, [isEditing, productoSeleccionado, isOpen]);

    const handleChange = (field: keyof ProductoCreate, value: unknown) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        // Clear error on change
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: '' }));
        }
    };

    const validate = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!formData.nombre.trim()) {
            newErrors.nombre = 'El nombre es requerido';
        }

        if (formData.precio_compra < 0) {
            newErrors.precio_compra = 'El precio de compra debe ser mayor o igual a 0';
        }

        if (formData.precio_venta < 0) {
            newErrors.precio_venta = 'El precio de venta debe ser mayor o igual a 0';
        }

        if (formData.stock_minimo !== undefined && formData.stock_minimo < 0) {
            newErrors.stock_minimo = 'El stock mínimo debe ser mayor o igual a 0';
        }

        if (formData.stock_maximo !== undefined && formData.stock_maximo < 0) {
            newErrors.stock_maximo = 'El stock máximo debe ser mayor o igual a 0';
        }

        if (formData.stock_maximo !== undefined && formData.stock_minimo !== undefined && formData.stock_maximo < formData.stock_minimo) {
            newErrors.stock_maximo = 'El stock máximo debe ser mayor o igual al stock mínimo';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validate()) return;

        setIsSaving(true);
        try {
            // Prepare data
            const dataToSend: ProductoCreate | ProductoUpdate = {
                ...formData,
                codigo: formData.codigo?.trim() || undefined,
                codigo_barras: formData.codigo_barras?.trim() || undefined,
                descripcion: formData.descripcion?.trim() || undefined,
                proveedor_id: formData.proveedor_id || null,
            };

            if (isEditing && productoId) {
                await updateProducto(productoId, dataToSend as ProductoUpdate);
                toast.success('Producto actualizado correctamente');
            } else {
                await createProducto(dataToSend as ProductoCreate);
                toast.success('Producto creado correctamente');
            }
            onClose();
        } catch (error) {
            console.error('Error saving producto:', error);
            toast.error(isEditing ? 'Error al actualizar el producto' : 'Error al crear el producto');
        } finally {
            setIsSaving(false);
        }
    };

    const formatCurrency = (value: number): string => {
        return new Intl.NumberFormat('es-CO', {
            style: 'decimal',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(value);
    };

    const parseCurrency = (value: string): number => {
        const cleaned = value.replace(/[^\d]/g, '');
        return parseInt(cleaned) || 0;
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="flex min-h-full items-center justify-center p-4">
                <div className="relative w-full max-w-2xl bg-white dark:bg-gray-900 rounded-xl shadow-2xl transform transition-all">
                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                                <Package className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                                    {isEditing ? 'Editar Producto' : 'Nuevo Producto'}
                                </h2>
                                <p className="text-sm text-gray-500">
                                    {isEditing ? 'Modifica los datos del producto' : 'Ingresa los datos del nuevo producto'}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                        >
                            <X className="w-5 h-5 text-gray-500" />
                        </button>
                    </div>

                    {/* Content */}
                    {isLoading && isEditing ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit}>
                            <div className="p-6 space-y-6 max-h-[calc(100vh-200px)] overflow-y-auto">
                                {/* Información básica */}
                                <div>
                                    <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                                        <Package className="w-4 h-4 text-purple-600" />
                                        Información Básica
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                Nombre del producto *
                                            </label>
                                            <Input
                                                value={formData.nombre}
                                                onChange={(e) => handleChange('nombre', e.target.value)}
                                                placeholder="Ej: Keratina Brasileña 500ml"
                                                className={cn(errors.nombre && 'border-red-500')}
                                            />
                                            {errors.nombre && (
                                                <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
                                                    <AlertCircle className="w-3 h-3" />
                                                    {errors.nombre}
                                                </p>
                                            )}
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                Código interno
                                            </label>
                                            <Input
                                                value={formData.codigo || ''}
                                                onChange={(e) => handleChange('codigo', e.target.value)}
                                                placeholder="Ej: KER-001"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                Código de barras
                                            </label>
                                            <Input
                                                value={formData.codigo_barras || ''}
                                                onChange={(e) => handleChange('codigo_barras', e.target.value)}
                                                placeholder="Ej: 7701234567890"
                                            />
                                        </div>
                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                Descripción
                                            </label>
                                            <textarea
                                                value={formData.descripcion || ''}
                                                onChange={(e) => handleChange('descripcion', e.target.value)}
                                                placeholder="Describe el producto..."
                                                rows={3}
                                                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 resize-none focus:outline-none focus:ring-2 focus:ring-purple-500"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Precios */}
                                <div>
                                    <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                                        <DollarSign className="w-4 h-4 text-green-600" />
                                        Precios y Comisión
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                Precio venta cliente *
                                            </label>
                                            <div className="relative">
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                                                <Input
                                                    value={formatCurrency(formData.precio_venta)}
                                                    onChange={(e) => handleChange('precio_venta', parseCurrency(e.target.value))}
                                                    className={cn('pl-7', errors.precio_venta && 'border-red-500')}
                                                    placeholder="0"
                                                />
                                            </div>
                                            {errors.precio_venta && (
                                                <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
                                                    <AlertCircle className="w-3 h-3" />
                                                    {errors.precio_venta}
                                                </p>
                                            )}
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                Precio venta colaboradores
                                            </label>
                                            <div className="relative">
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                                                <Input
                                                    value={formatCurrency(formData.precio_colaborador || 0)}
                                                    onChange={(e) => handleChange('precio_colaborador', parseCurrency(e.target.value))}
                                                    className="pl-7"
                                                    placeholder="0"
                                                />
                                            </div>
                                            <p className="text-xs text-gray-500 mt-1">Precio especial para empleados</p>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                Comisión por venta (%)
                                            </label>
                                            <div className="relative">
                                                <Input
                                                    type="number"
                                                    min="0"
                                                    max="100"
                                                    step="0.5"
                                                    value={formData.comision_porcentaje || ''}
                                                    onChange={(e) => handleChange('comision_porcentaje', e.target.value === '' ? 0 : parseFloat(e.target.value))}
                                                    className="pr-8"
                                                    placeholder="0"
                                                />
                                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">%</span>
                                            </div>
                                            <p className="text-xs text-gray-500 mt-1">Porcentaje de comisión al vendedor</p>
                                        </div>
                                        {formData.precio_compra > 0 && formData.precio_venta > 0 && (
                                            <div className="md:col-span-2">
                                                <div className="p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                                                    <div className="flex flex-wrap gap-4 text-sm text-green-700 dark:text-green-400">
                                                        <span>
                                                            <span className="font-medium">Margen:</span>{' '}
                                                            {((formData.precio_venta - formData.precio_compra) / formData.precio_compra * 100).toFixed(1)}%
                                                        </span>
                                                        <span>
                                                            <span className="font-medium">Utilidad:</span> ${formatCurrency(formData.precio_venta - formData.precio_compra)}
                                                        </span>
                                                        {(formData.comision_porcentaje || 0) > 0 && (
                                                            <span>
                                                                <span className="font-medium">Comisión:</span> ${formatCurrency((formData.precio_venta * (formData.comision_porcentaje || 0)) / 100)}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Proveedor y Stock */}
                                <div>
                                    <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                                        <Truck className="w-4 h-4 text-blue-600" />
                                        Proveedor e Inventario
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                Proveedor
                                            </label>
                                            <select
                                                value={formData.proveedor_id || ''}
                                                onChange={(e) => handleChange('proveedor_id', e.target.value ? Number(e.target.value) : null)}
                                                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
                                            >
                                                <option value="">Seleccionar proveedor</option>
                                                {proveedores.map((prov) => (
                                                    <option key={prov.id} value={prov.id}>{prov.nombre}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                Stock mínimo
                                            </label>
                                            <Input
                                                type="number"
                                                min="0"
                                                value={formData.stock_minimo || 0}
                                                onChange={(e) => handleChange('stock_minimo', parseInt(e.target.value) || 0)}
                                                className={cn(errors.stock_minimo && 'border-red-500')}
                                            />
                                            {errors.stock_minimo && (
                                                <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
                                                    <AlertCircle className="w-3 h-3" />
                                                    {errors.stock_minimo}
                                                </p>
                                            )}
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                Stock máximo
                                            </label>
                                            <Input
                                                type="number"
                                                min="0"
                                                value={formData.stock_maximo || ''}
                                                onChange={(e) => handleChange('stock_maximo', e.target.value ? parseInt(e.target.value) : undefined)}
                                                placeholder="Opcional"
                                                className={cn(errors.stock_maximo && 'border-red-500')}
                                            />
                                            {errors.stock_maximo && (
                                                <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
                                                    <AlertCircle className="w-3 h-3" />
                                                    {errors.stock_maximo}
                                                </p>
                                            )}
                                        </div>
                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                Estado
                                            </label>
                                            <div className="flex gap-2">
                                                {ESTADO_OPTIONS.map((option) => (
                                                    <button
                                                        key={option.value}
                                                        type="button"
                                                        onClick={() => handleChange('estado', option.value)}
                                                        className={cn(
                                                            'px-4 py-2 rounded-lg text-sm font-medium transition-all',
                                                            formData.estado === option.value
                                                                ? option.value === 'activo'
                                                                    ? 'bg-green-100 text-green-800 ring-2 ring-green-500'
                                                                    : option.value === 'inactivo'
                                                                        ? 'bg-gray-100 text-gray-800 ring-2 ring-gray-500'
                                                                        : 'bg-red-100 text-red-800 ring-2 ring-red-500'
                                                                : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                                                        )}
                                                    >
                                                        {option.label}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 rounded-b-xl">
                                <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>
                                    Cancelar
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={isSaving}
                                    className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                                >
                                    {isSaving ? (
                                        <>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            Guardando...
                                        </>
                                    ) : (
                                        <>
                                            <Save className="w-4 h-4 mr-2" />
                                            {isEditing ? 'Guardar cambios' : 'Crear producto'}
                                        </>
                                    )}
                                </Button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
