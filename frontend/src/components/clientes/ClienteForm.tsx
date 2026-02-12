'use client';

import { useState, useEffect } from 'react';
import { useClienteStore } from '@/stores/clienteStore';
import { Cliente, ClienteFormData, ClienteCreateDTO, ClienteUpdateDTO } from '@/types/cliente';
import { X, Loader2, User, Phone, Mail, MapPin, Calendar, FileText } from 'lucide-react';

// Helper para extraer mensaje de error legible
function getErrorMessage(error: any, defaultMsg: string): string {
    const detail = error.response?.data?.detail;

    if (typeof detail === 'string') {
        return detail;
    }

    if (Array.isArray(detail)) {
        return detail.map((err: any) => {
            if (typeof err === 'string') return err;
            if (err.msg) return err.msg;
            return JSON.stringify(err);
        }).join('. ');
    }

    if (detail?.msg) {
        return detail.msg;
    }

    return defaultMsg;
}

interface ClienteFormProps {
    isOpen: boolean;
    onClose: () => void;
    clienteToEdit?: Cliente | null;
    onSuccess?: () => void;
}

const initialFormData: ClienteFormData = {
    nombre: '',
    apellido: '',
    cedula: '',
    telefono: '',
    email: '',
    fecha_nacimiento: '',
    direccion: '',
    notas: '',
    es_colaborador: false,
};

export default function ClienteForm({
    isOpen,
    onClose,
    clienteToEdit,
    onSuccess,
}: ClienteFormProps) {
    const { createCliente, updateCliente, isLoading, error, clearError } = useClienteStore();
    const [formData, setFormData] = useState<ClienteFormData>(initialFormData);
    const [errors, setErrors] = useState<Partial<Record<keyof ClienteFormData, string>>>({});
    const [submitError, setSubmitError] = useState<string | null>(null);

    const isEditMode = !!clienteToEdit;

    // Cargar datos del cliente a editar
    useEffect(() => {
        if (clienteToEdit) {
            setFormData({
                nombre: clienteToEdit.nombre || '',
                apellido: clienteToEdit.apellido || '',
                cedula: clienteToEdit.cedula || '',
                telefono: clienteToEdit.telefono || '',
                email: clienteToEdit.email || '',
                fecha_nacimiento: clienteToEdit.fecha_nacimiento || '',
                direccion: clienteToEdit.direccion || '',
                notas: clienteToEdit.notas || '',
                es_colaborador: clienteToEdit.es_colaborador || false,
            });
        } else {
            setFormData(initialFormData);
        }
        setErrors({});
        setSubmitError(null);
        clearError();
    }, [clienteToEdit, isOpen, clearError]);

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
        const { name, value, type } = e.target;
        const checked = (e.target as HTMLInputElement).checked;

        setFormData((prev) => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));

        // Limpiar error del campo
        if (errors[name as keyof ClienteFormData]) {
            setErrors((prev) => ({ ...prev, [name]: undefined }));
        }
        setSubmitError(null);
    };

    const validateForm = (): boolean => {
        const newErrors: Partial<Record<keyof ClienteFormData, string>> = {};

        // Nombre es requerido
        if (!formData.nombre.trim()) {
            newErrors.nombre = 'El nombre es requerido';
        } else if (formData.nombre.length < 2) {
            newErrors.nombre = 'El nombre debe tener al menos 2 caracteres';
        }

        // Al menos teléfono o email
        if (!formData.telefono?.trim() && !formData.email?.trim()) {
            newErrors.telefono = 'Debe proporcionar teléfono o email';
            newErrors.email = 'Debe proporcionar teléfono o email';
        }

        // Validar formato de email si se proporciona
        if (formData.email?.trim()) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(formData.email)) {
                newErrors.email = 'Email inválido';
            }
        }

        // Validar formato de teléfono si se proporciona
        if (formData.telefono?.trim()) {
            const phoneRegex = /^\+?[0-9]{7,15}$/;
            if (!phoneRegex.test(formData.telefono.replace(/\s/g, ''))) {
                newErrors.telefono = 'Teléfono inválido (7-15 dígitos)';
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        try {
            if (isEditMode && clienteToEdit) {
                const updateData: ClienteUpdateDTO = {
                    nombre: formData.nombre.trim(),
                    apellido: formData.apellido?.trim() || undefined,
                    cedula: formData.cedula?.trim() || undefined,
                    telefono: formData.telefono?.trim() || undefined,
                    email: formData.email?.trim() || undefined,
                    fecha_nacimiento: formData.fecha_nacimiento || undefined,
                    direccion: formData.direccion?.trim() || undefined,
                    notas: formData.notas?.trim() || undefined,
                    es_colaborador: formData.es_colaborador,
                };
                await updateCliente(clienteToEdit.id, updateData);
            } else {
                const createData: ClienteCreateDTO = {
                    nombre: formData.nombre.trim(),
                    apellido: formData.apellido?.trim() || undefined,
                    cedula: formData.cedula?.trim() || undefined,
                    telefono: formData.telefono?.trim() || undefined,
                    email: formData.email?.trim() || undefined,
                    fecha_nacimiento: formData.fecha_nacimiento || undefined,
                    direccion: formData.direccion?.trim() || undefined,
                    notas: formData.notas?.trim() || undefined,
                    es_colaborador: formData.es_colaborador,
                };
                await createCliente(createData);
            }

            onSuccess?.();
            onClose();
        } catch (err: any) {
            setSubmitError(getErrorMessage(err, 'Error al guardar cliente'));
        }
    };

    if (!isOpen) return null;

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
                <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 rounded-t-2xl">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
                            <User className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                                {isEditMode ? 'Editar Cliente' : 'Nuevo Cliente'}
                            </h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                {isEditMode ? 'Modifica los datos del cliente' : 'Ingresa los datos del nuevo cliente'}
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

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Error general */}
                    {(submitError || error) && (
                        <div className="p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl">
                            <p className="text-sm text-red-600 dark:text-red-400">
                                {submitError || error}
                            </p>
                        </div>
                    )}

                    {/* Información Personal */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                            Información Personal
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Nombre */}
                            <div>
                                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    <User className="w-4 h-4" />
                                    Nombre *
                                </label>
                                <input
                                    type="text"
                                    name="nombre"
                                    value={formData.nombre}
                                    onChange={handleChange}
                                    placeholder="Nombre"
                                    className={`w-full px-4 py-3 rounded-xl border ${errors.nombre
                                        ? 'border-red-300 dark:border-red-700 focus:ring-red-500'
                                        : 'border-gray-200 dark:border-gray-700 focus:ring-purple-500'
                                        } bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:border-transparent transition-all`}
                                />
                                {errors.nombre && (
                                    <p className="mt-1 text-xs text-red-500">{errors.nombre}</p>
                                )}
                            </div>

                            {/* Apellido */}
                            <div>
                                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    <User className="w-4 h-4" />
                                    Apellido
                                </label>
                                <input
                                    type="text"
                                    name="apellido"
                                    value={formData.apellido}
                                    onChange={handleChange}
                                    placeholder="Apellido"
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                                />
                            </div>
                        </div>

                        {/* Cédula */}
                        <div>
                            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                <FileText className="w-4 h-4" />
                                Cédula / Documento
                            </label>
                            <input
                                type="text"
                                name="cedula"
                                value={formData.cedula}
                                onChange={handleChange}
                                placeholder="1234567890"
                                className={`w-full px-4 py-3 rounded-xl border ${errors.cedula
                                    ? 'border-red-300 dark:border-red-700 focus:ring-red-500'
                                    : 'border-gray-200 dark:border-gray-700 focus:ring-purple-500'
                                    } bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:border-transparent transition-all`}
                            />
                            {errors.cedula && (
                                <p className="mt-1 text-xs text-red-500">{errors.cedula}</p>
                            )}
                        </div>

                        <div className="flex items-center space-x-2">
                            <input
                                type="checkbox"
                                id="es_colaborador"
                                name="es_colaborador"
                                checked={formData.es_colaborador}
                                onChange={handleChange}
                                className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500 dark:focus:ring-purple-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                            />
                            <label htmlFor="es_colaborador" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                Es Colega/Colaborador
                            </label>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Teléfono */}
                            <div>
                                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    <Phone className="w-4 h-4" />
                                    Teléfono
                                </label>
                                <input
                                    type="tel"
                                    name="telefono"
                                    value={formData.telefono}
                                    onChange={handleChange}
                                    placeholder="+573001234567"
                                    className={`w-full px-4 py-3 rounded-xl border ${errors.telefono
                                        ? 'border-red-300 dark:border-red-700 focus:ring-red-500'
                                        : 'border-gray-200 dark:border-gray-700 focus:ring-purple-500'
                                        } bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:border-transparent transition-all`}
                                />
                                {errors.telefono && (
                                    <p className="mt-1 text-xs text-red-500">{errors.telefono}</p>
                                )}
                            </div>

                            {/* Email */}
                            <div>
                                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    <Mail className="w-4 h-4" />
                                    Email
                                </label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    placeholder="cliente@email.com"
                                    className={`w-full px-4 py-3 rounded-xl border ${errors.email
                                        ? 'border-red-300 dark:border-red-700 focus:ring-red-500'
                                        : 'border-gray-200 dark:border-gray-700 focus:ring-purple-500'
                                        } bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:border-transparent transition-all`}
                                />
                                {errors.email && (
                                    <p className="mt-1 text-xs text-red-500">{errors.email}</p>
                                )}
                            </div>
                        </div>

                        {/* Fecha de Nacimiento */}
                        <div>
                            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                <Calendar className="w-4 h-4" />
                                Fecha de Nacimiento
                            </label>
                            <input
                                type="date"
                                name="fecha_nacimiento"
                                value={formData.fecha_nacimiento}
                                onChange={handleChange}
                                max={new Date().toISOString().split('T')[0]}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                            />
                        </div>

                        {/* Dirección */}
                        <div>
                            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                <MapPin className="w-4 h-4" />
                                Dirección
                            </label>
                            <input
                                type="text"
                                name="direccion"
                                value={formData.direccion}
                                onChange={handleChange}
                                placeholder="Calle 123 #45-67, Ciudad"
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                            />
                        </div>
                    </div>

                    {/* Notas */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                            Notas Adicionales
                        </h3>

                        <div>
                            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                <FileText className="w-4 h-4" />
                                Notas
                            </label>
                            <textarea
                                name="notas"
                                value={formData.notas}
                                onChange={handleChange}
                                placeholder="Notas adicionales sobre el cliente..."
                                rows={3}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all resize-none"
                            />
                        </div>
                    </div>

                    {/* Nota sobre campos requeridos */}
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                        * Nombre es requerido. Debe proporcionar al menos teléfono o email.
                    </p>

                    {/* Botones de acción */}
                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isLoading}
                            className="px-5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 font-medium transition-all"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium hover:from-purple-700 hover:to-pink-700 shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                            {isEditMode ? 'Guardar Cambios' : 'Crear Cliente'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
