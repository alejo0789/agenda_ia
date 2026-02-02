'use client';

import { useEffect, useState } from 'react';
import { useProveedorStore } from '@/stores/inventarioStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import {
    X,
    Loader2,
    Truck,
    Save,
    AlertCircle,
    User,
    Phone,
    Mail,
    MapPin,
    FileText,
} from 'lucide-react';
import { toast } from 'sonner';
import { ProveedorCreate, ProveedorUpdate, EstadoProveedor } from '@/types/inventario';

interface ProveedorModalProps {
    isOpen: boolean;
    onClose: () => void;
    proveedorId: number | null;
}

const ESTADO_OPTIONS: { value: EstadoProveedor; label: string }[] = [
    { value: 'activo', label: 'Activo' },
    { value: 'inactivo', label: 'Inactivo' },
];

export default function ProveedorModal({ isOpen, onClose, proveedorId }: ProveedorModalProps) {
    const {
        createProveedor,
        updateProveedor,
        fetchProveedorById,
        proveedorSeleccionado,
        isLoading
    } = useProveedorStore();

    const [formData, setFormData] = useState<ProveedorCreate>({
        nombre: '',
        contacto: '',
        telefono: '',
        email: '',
        direccion: '',
        notas: '',
        estado: 'activo',
    });

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isSaving, setIsSaving] = useState(false);

    const isEditing = proveedorId !== null;

    // Cargar datos del proveedor si estamos editando
    useEffect(() => {
        if (isOpen && proveedorId) {
            fetchProveedorById(proveedorId);
        }
    }, [isOpen, proveedorId, fetchProveedorById]);

    // Llenar el formulario con los datos del proveedor
    useEffect(() => {
        if (isEditing && proveedorSeleccionado) {
            setFormData({
                nombre: proveedorSeleccionado.nombre,
                contacto: proveedorSeleccionado.contacto || '',
                telefono: proveedorSeleccionado.telefono || '',
                email: proveedorSeleccionado.email || '',
                direccion: proveedorSeleccionado.direccion || '',
                notas: proveedorSeleccionado.notas || '',
                estado: proveedorSeleccionado.estado,
            });
        } else if (!isEditing && isOpen) {
            // Reset form for new proveedor
            setFormData({
                nombre: '',
                contacto: '',
                telefono: '',
                email: '',
                direccion: '',
                notas: '',
                estado: 'activo',
            });
        }
        setErrors({});
    }, [isEditing, proveedorSeleccionado, isOpen]);

    const handleChange = (field: keyof ProveedorCreate, value: unknown) => {
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

        if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = 'Email inválido';
        }

        if (formData.telefono && !/^[0-9+\-() ]*$/.test(formData.telefono)) {
            newErrors.telefono = 'Teléfono inválido';
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
            const dataToSend: ProveedorCreate | ProveedorUpdate = {
                ...formData,
                contacto: formData.contacto?.trim() || undefined,
                telefono: formData.telefono?.trim() || undefined,
                email: formData.email?.trim() || undefined,
                direccion: formData.direccion?.trim() || undefined,
                notas: formData.notas?.trim() || undefined,
            };

            if (isEditing && proveedorId) {
                await updateProveedor(proveedorId, dataToSend as ProveedorUpdate);
                toast.success('Proveedor actualizado correctamente');
            } else {
                await createProveedor(dataToSend as ProveedorCreate);
                toast.success('Proveedor creado correctamente');
            }
            onClose();
        } catch (error) {
            console.error('Error saving proveedor:', error);
            toast.error(isEditing ? 'Error al actualizar el proveedor' : 'Error al crear el proveedor');
        } finally {
            setIsSaving(false);
        }
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
                <div className="relative w-full max-w-xl bg-white dark:bg-gray-900 rounded-xl shadow-2xl transform transition-all">
                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                                <Truck className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                                    {isEditing ? 'Editar Proveedor' : 'Nuevo Proveedor'}
                                </h2>
                                <p className="text-sm text-gray-500">
                                    {isEditing ? 'Modifica los datos del proveedor' : 'Ingresa los datos del nuevo proveedor'}
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
                            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit}>
                            <div className="p-6 space-y-5 max-h-[calc(100vh-200px)] overflow-y-auto">
                                {/* Nombre */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Nombre del proveedor *
                                    </label>
                                    <div className="relative">
                                        <Truck className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                        <Input
                                            value={formData.nombre}
                                            onChange={(e) => handleChange('nombre', e.target.value)}
                                            placeholder="Ej: Distribuidora Colombia"
                                            className={cn('pl-10', errors.nombre && 'border-red-500')}
                                        />
                                    </div>
                                    {errors.nombre && (
                                        <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
                                            <AlertCircle className="w-3 h-3" />
                                            {errors.nombre}
                                        </p>
                                    )}
                                </div>

                                {/* Contacto */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Persona de contacto
                                    </label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                        <Input
                                            value={formData.contacto || ''}
                                            onChange={(e) => handleChange('contacto', e.target.value)}
                                            placeholder="Ej: Juan Pérez"
                                            className="pl-10"
                                        />
                                    </div>
                                </div>

                                {/* Teléfono y Email */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Teléfono
                                        </label>
                                        <div className="relative">
                                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                            <Input
                                                value={formData.telefono || ''}
                                                onChange={(e) => handleChange('telefono', e.target.value)}
                                                placeholder="Ej: +57 300 123 4567"
                                                className={cn('pl-10', errors.telefono && 'border-red-500')}
                                            />
                                        </div>
                                        {errors.telefono && (
                                            <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
                                                <AlertCircle className="w-3 h-3" />
                                                {errors.telefono}
                                            </p>
                                        )}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Email
                                        </label>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                            <Input
                                                type="email"
                                                value={formData.email || ''}
                                                onChange={(e) => handleChange('email', e.target.value)}
                                                placeholder="proveedor@email.com"
                                                className={cn('pl-10', errors.email && 'border-red-500')}
                                            />
                                        </div>
                                        {errors.email && (
                                            <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
                                                <AlertCircle className="w-3 h-3" />
                                                {errors.email}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {/* Dirección */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Dirección
                                    </label>
                                    <div className="relative">
                                        <MapPin className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                                        <textarea
                                            value={formData.direccion || ''}
                                            onChange={(e) => handleChange('direccion', e.target.value)}
                                            placeholder="Calle, número, ciudad..."
                                            rows={2}
                                            className="w-full pl-10 px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                </div>

                                {/* Notas */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Notas adicionales
                                    </label>
                                    <div className="relative">
                                        <FileText className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                                        <textarea
                                            value={formData.notas || ''}
                                            onChange={(e) => handleChange('notas', e.target.value)}
                                            placeholder="Información adicional sobre el proveedor..."
                                            rows={3}
                                            className="w-full pl-10 px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                </div>

                                {/* Estado */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Estado
                                    </label>
                                    <div className="flex gap-2">
                                        {ESTADO_OPTIONS.map((option) => (
                                            <button
                                                key={option.value}
                                                type="button"
                                                onClick={() => handleChange('estado', option.value)}
                                                className={cn(
                                                    'px-4 py-2 rounded-lg text-sm font-medium transition-all flex-1',
                                                    formData.estado === option.value
                                                        ? option.value === 'activo'
                                                            ? 'bg-green-100 text-green-800 ring-2 ring-green-500 dark:bg-green-900/30 dark:text-green-400'
                                                            : 'bg-gray-100 text-gray-800 ring-2 ring-gray-500 dark:bg-gray-800 dark:text-gray-400'
                                                        : 'bg-gray-50 text-gray-600 hover:bg-gray-100 dark:bg-gray-800/50 dark:text-gray-400 dark:hover:bg-gray-800'
                                                )}
                                            >
                                                {option.label}
                                            </button>
                                        ))}
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
                                    className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
                                >
                                    {isSaving ? (
                                        <>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            Guardando...
                                        </>
                                    ) : (
                                        <>
                                            <Save className="w-4 h-4 mr-2" />
                                            {isEditing ? 'Guardar cambios' : 'Crear proveedor'}
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
