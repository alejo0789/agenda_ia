'use client';

import { useState, useEffect } from 'react';
import { useServicioStore } from '@/stores/servicioStore';
import { CategoriaFormData } from '@/types/servicio';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    X,
    Loader2,
    Save,
    AlertCircle,
    Palette,
    Trash2,
    AlertTriangle,
} from 'lucide-react';
import { toast } from 'sonner';

interface CategoriaModalProps {
    isOpen: boolean;
    onClose: () => void;
    categoriaId?: number | null;
}

export default function CategoriaModal({ isOpen, onClose, categoriaId }: CategoriaModalProps) {
    const {
        categorias,
        isLoading,
        error,
        createCategoria,
        updateCategoria,
        deleteCategoria,
        clearError,
    } = useServicioStore();

    const [formData, setFormData] = useState<CategoriaFormData>({
        nombre: '',
        descripcion: '',
    });

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isDirty, setIsDirty] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const isEditMode = !!categoriaId;

    // Cargar datos de la categoría si es modo edición
    useEffect(() => {
        if (isOpen && categoriaId) {
            const categoria = categorias.find((c) => c.id === categoriaId);
            if (categoria) {
                setFormData({
                    nombre: categoria.nombre,
                    descripcion: categoria.descripcion || '',
                });
            }
        }
    }, [isOpen, categoriaId, categorias]);

    // Resetear formulario al cerrar
    useEffect(() => {
        if (!isOpen) {
            setFormData({
                nombre: '',
                descripcion: '',
            });
            setErrors({});
            setIsDirty(false);
            setShowDeleteConfirm(false);
            clearError();
        }
    }, [isOpen, clearError]);

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        setIsDirty(true);

        // Limpiar error del campo
        if (errors[name]) {
            setErrors((prev) => {
                const newErrors = { ...prev };
                delete newErrors[name];
                return newErrors;
            });
        }
    };

    const validate = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!formData.nombre.trim()) {
            newErrors.nombre = 'El nombre es requerido';
        } else if (formData.nombre.length < 1) {
            newErrors.nombre = 'El nombre debe tener al menos 1 carácter';
        } else if (formData.nombre.length > 100) {
            newErrors.nombre = 'El nombre no puede exceder 100 caracteres';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validate()) {
            toast.error('Por favor corrige los errores del formulario');
            return;
        }

        setIsSubmitting(true);

        try {
            if (isEditMode && categoriaId) {
                await updateCategoria(categoriaId, formData);
                toast.success(`Categoría "${formData.nombre}" actualizada`);
            } else {
                await createCategoria(formData);
                toast.success(`Categoría "${formData.nombre}" creada`);
            }
            onClose();
        } catch (err: any) {
            toast.error(err.response?.data?.detail || 'Error al guardar categoría');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!categoriaId) return;

        setIsDeleting(true);
        try {
            await deleteCategoria(categoriaId);
            toast.success('Categoría eliminada');
            onClose();
        } catch (err: any) {
            toast.error(err.response?.data?.detail || 'Error al eliminar categoría');
        } finally {
            setIsDeleting(false);
            setShowDeleteConfirm(false);
        }
    };

    const handleClose = () => {
        if (isDirty) {
            if (confirm('¿Estás seguro? Los cambios no guardados se perderán.')) {
                onClose();
            }
        } else {
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleClose} />
            <div className="relative bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-lg overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-800">
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
                            <Palette className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                                {isEditMode ? 'Editar Categoría' : 'Nueva Categoría'}
                            </h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                {isEditMode
                                    ? 'Modifica los datos de la categoría'
                                    : 'Crea una nueva categoría de servicios'}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={handleClose}
                        className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Error general */}
                    {error && (
                        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-start space-x-3">
                            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                            <div>
                                <h4 className="font-medium text-red-800 dark:text-red-300">Error</h4>
                                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                            </div>
                        </div>
                    )}

                    {/* Nombre */}
                    <div className="space-y-2">
                        <Label htmlFor="nombre">
                            Nombre <span className="text-red-500">*</span>
                        </Label>
                        <Input
                            id="nombre"
                            name="nombre"
                            value={formData.nombre}
                            onChange={handleChange}
                            placeholder="Ej: Alisados"
                            className={errors.nombre ? 'border-red-500' : ''}
                            autoFocus
                        />
                        {errors.nombre && (
                            <p className="text-xs text-red-500">{errors.nombre}</p>
                        )}
                    </div>

                    {/* Descripción */}
                    <div className="space-y-2">
                        <Label htmlFor="descripcion">Descripción (Opcional)</Label>
                        <textarea
                            id="descripcion"
                            name="descripcion"
                            value={formData.descripcion}
                            onChange={handleChange}
                            placeholder="Describe brevemente esta categoría..."
                            rows={3}
                            className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 resize-none"
                        />
                    </div>
                </form>

                {/* Footer */}
                <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                    <div>
                        {isEditMode && (
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setShowDeleteConfirm(true)}
                                className="border-red-300 text-red-600 hover:bg-red-50"
                            >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Eliminar
                            </Button>
                        )}
                    </div>
                    <div className="flex space-x-3">
                        <Button type="button" variant="outline" onClick={handleClose}>
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleSubmit}
                            disabled={isSubmitting || isLoading}
                            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Guardando...
                                </>
                            ) : (
                                <>
                                    <Save className="w-4 h-4 mr-2" />
                                    {isEditMode ? 'Guardar' : 'Crear'}
                                </>
                            )}
                        </Button>
                    </div>
                </div>

                {/* Delete Confirmation Modal */}
                {showDeleteConfirm && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <div className="bg-white dark:bg-gray-900 rounded-lg p-6 max-w-sm mx-4">
                            <div className="text-center">
                                <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center mx-auto mb-4">
                                    <AlertTriangle className="w-6 h-6 text-red-500" />
                                </div>
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                                    ¿Eliminar categoría?
                                </h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                                    Esta acción no se puede deshacer. La categoría{' '}
                                    <strong>&ldquo;{formData.nombre}&rdquo;</strong> será eliminada permanentemente.
                                </p>
                                <div className="flex space-x-3">
                                    <Button
                                        variant="outline"
                                        className="flex-1"
                                        onClick={() => setShowDeleteConfirm(false)}
                                    >
                                        Cancelar
                                    </Button>
                                    <Button
                                        className="flex-1 bg-red-600 hover:bg-red-700"
                                        onClick={handleDelete}
                                        disabled={isDeleting}
                                    >
                                        {isDeleting ? (
                                            <>
                                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                Eliminando...
                                            </>
                                        ) : (
                                            <>
                                                <Trash2 className="w-4 h-4 mr-2" />
                                                Eliminar
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
