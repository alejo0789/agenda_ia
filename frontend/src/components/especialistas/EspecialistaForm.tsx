'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useEspecialistaStore } from '@/stores/especialistaStore';
import { EspecialistaFormData } from '@/types/especialista';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    User,
    Phone,
    Mail,
    FileText,
    Calendar,
    Loader2,
    ArrowLeft,
    Save,
    AlertCircle,
    Upload,
    X,
} from 'lucide-react';
import Link from 'next/link';

interface EspecialistaFormProps {
    especialistaId?: number;
    mode: 'create' | 'edit';
}

export default function EspecialistaForm({ especialistaId, mode }: EspecialistaFormProps) {
    const router = useRouter();
    const {
        selectedEspecialista,
        isLoading,
        error,
        fetchEspecialista,
        createEspecialista,
        updateEspecialista,
        uploadDocumentation,
        fetchFiles,
        files,
        deleteFile,
        clearError,
        clearSelectedEspecialista,
    } = useEspecialistaStore();

    const [formData, setFormData] = useState<EspecialistaFormData>({
        nombre: '',
        apellido: '',
        documento_identidad: '',
        telefono: '',
        email: '',
        password: '',
        fecha_ingreso: '',
    });

    const [pendingFiles, setPendingFiles] = useState<File[]>([]);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isDirty, setIsDirty] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [dragActive, setDragActive] = useState(false);

    const handleDrop = async (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            const droppedFiles = Array.from(e.dataTransfer.files).filter(f => f.type === 'application/pdf');

            if (droppedFiles.length === 0) {
                alert('Solo se permiten archivos PDF');
                return;
            }

            if (droppedFiles.length < e.dataTransfer.files.length) {
                alert('Solo se permiten archivos PDF. Algunos archivos fueron ignorados.');
            }

            if (mode === 'edit' && especialistaId) {
                // Upload each file immediately
                for (const f of droppedFiles) {
                    try {
                        await uploadDocumentation(especialistaId, f);
                    } catch (error) {
                        console.error("Error uploading file:", error);
                    }
                }
            } else {
                setPendingFiles(prev => [...prev, ...droppedFiles]);
                setIsDirty(true);
            }
        }
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const selectedFiles = Array.from(e.target.files).filter(f => f.type === 'application/pdf');

            if (mode === 'edit' && especialistaId) {
                for (const f of selectedFiles) {
                    try {
                        await uploadDocumentation(especialistaId, f);
                    } catch (error) {
                        console.error("Error uploading file:", error);
                    }
                }
                // Clear input
                e.target.value = '';
            } else {
                setPendingFiles(prev => [...prev, ...selectedFiles]);
                setIsDirty(true);
                // Clear input to allow re-selecting same file if removed
                e.target.value = '';
            }
        }
    };

    const handleDrag = function (e: React.DragEvent) {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    // Cargar datos si es modo editar
    useEffect(() => {
        if (mode === 'edit' && especialistaId) {
            fetchEspecialista(especialistaId);
            fetchFiles(especialistaId);
        }

        return () => {
            clearSelectedEspecialista();
            clearError();
        };
    }, [especialistaId, mode, fetchEspecialista, fetchFiles, clearSelectedEspecialista, clearError]);

    // Prellenar formulario cuando se cargue el especialista
    useEffect(() => {
        if (mode === 'edit' && selectedEspecialista) {
            setFormData({
                nombre: selectedEspecialista.nombre,
                apellido: selectedEspecialista.apellido,
                documento_identidad: selectedEspecialista.documento_identidad || '',
                telefono: selectedEspecialista.telefono || '',
                email: selectedEspecialista.email || '',
                password: '', // Don't fill password on edit
                fecha_ingreso: selectedEspecialista.fecha_ingreso
                    ? selectedEspecialista.fecha_ingreso.split('T')[0]
                    : '',
            });
        }
    }, [selectedEspecialista, mode]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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

    const formatPhone = (value: string) => {
        // Remover todo excepto números
        const cleaned = value.replace(/\D/g, '');
        // Formatear como +57 XXX XXX XXXX
        if (cleaned.length <= 10) {
            const match = cleaned.match(/^(\d{0,3})(\d{0,3})(\d{0,4})$/);
            if (match) {
                return [match[1], match[2], match[3]].filter(Boolean).join(' ');
            }
        }
        return value;
    };

    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const formatted = formatPhone(e.target.value);
        setFormData((prev) => ({ ...prev, telefono: formatted }));
        setIsDirty(true);
    };

    const validate = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!formData.nombre.trim()) {
            newErrors.nombre = 'El nombre es requerido';
        } else if (formData.nombre.length < 2) {
            newErrors.nombre = 'El nombre debe tener al menos 2 caracteres';
        }

        if (!formData.apellido.trim()) {
            newErrors.apellido = 'El apellido es requerido';
        } else if (formData.apellido.length < 2) {
            newErrors.apellido = 'El apellido debe tener al menos 2 caracteres';
        }

        if (formData.documento_identidad && formData.documento_identidad.length < 6) {
            newErrors.documento_identidad = 'El documento debe tener al menos 6 caracteres';
        }

        if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = 'El email no es válido';
        }

        if (mode === 'create' && (!formData.password || formData.password.length < 6)) {
            if (formData.email && (!formData.password || formData.password.length < 6)) {
                newErrors.password = 'La contraseña debe tener al menos 6 caracteres';
            }
        }

        if (formData.telefono) {
            const phoneDigits = formData.telefono.replace(/\D/g, '');
            if (phoneDigits.length < 10) {
                newErrors.telefono = 'El teléfono debe tener al menos 10 dígitos';
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validate()) return;

        setIsSubmitting(true);

        try {
            const dataToSubmit = {
                ...formData,
                fecha_ingreso: formData.fecha_ingreso || undefined,
            };

            let especialistaIdToUse = especialistaId;

            if (mode === 'create') {
                const newEspecialista = await createEspecialista(dataToSubmit);
                especialistaIdToUse = newEspecialista.id;
            } else if (especialistaId) {
                await updateEspecialista(especialistaId, dataToSubmit);
            }

            // Upload documentation if files selected
            if (pendingFiles.length > 0 && especialistaIdToUse) {
                for (const f of pendingFiles) {
                    await uploadDocumentation(especialistaIdToUse, f);
                }
            }

            router.push('/dashboard/especialistas');
        } catch (err) {
            console.error('Error al guardar especialista:', err);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCancel = () => {
        if (isDirty) {
            if (confirm('¿Estás seguro que deseas salir? Los cambios no se guardarán.')) {
                router.push('/dashboard/especialistas');
            }
        } else {
            router.push('/dashboard/especialistas');
        }
    };

    if (mode === 'edit' && isLoading && !selectedEspecialista) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto">
            {/* Breadcrumb */}
            <div className="mb-6">
                <nav className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                    <Link
                        href="/dashboard/especialistas"
                        className="hover:text-purple-600 dark:hover:text-purple-400"
                    >
                        Especialistas
                    </Link>
                    <span>›</span>
                    {mode === 'edit' && selectedEspecialista ? (
                        <>
                            <Link
                                href={`/dashboard/especialistas/${especialistaId}`}
                                className="hover:text-purple-600 dark:hover:text-purple-400"
                            >
                                {selectedEspecialista.nombre} {selectedEspecialista.apellido}
                            </Link>
                            <span>›</span>
                            <span className="text-gray-900 dark:text-gray-100">Editar</span>
                        </>
                    ) : (
                        <span className="text-gray-900 dark:text-gray-100">Nuevo Especialista</span>
                    )}
                </nav>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
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

                {/* Sección: Información Personal */}
                <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
                    <div className="flex items-center space-x-3 mb-6">
                        <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center">
                            <User className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                        </div>
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                            Información Personal
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

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
                                placeholder="María"
                                className={errors.nombre ? 'border-red-500' : ''}
                            />
                            {errors.nombre && (
                                <p className="text-xs text-red-500">{errors.nombre}</p>
                            )}
                        </div>

                        {/* Apellido */}
                        <div className="space-y-2">
                            <Label htmlFor="apellido">
                                Apellido <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="apellido"
                                name="apellido"
                                value={formData.apellido}
                                onChange={handleChange}
                                placeholder="García Rodríguez"
                                className={errors.apellido ? 'border-red-500' : ''}
                            />
                            {errors.apellido && (
                                <p className="text-xs text-red-500">{errors.apellido}</p>
                            )}
                        </div>

                        {/* Documento */}
                        <div className="space-y-2">
                            <Label htmlFor="documento_identidad">
                                <FileText className="w-4 h-4 inline mr-1" />
                                Documento de Identidad
                            </Label>
                            <Input
                                id="documento_identidad"
                                name="documento_identidad"
                                value={formData.documento_identidad}
                                onChange={handleChange}
                                placeholder="1234567890"
                                className={errors.documento_identidad ? 'border-red-500' : ''}
                            />
                            {errors.documento_identidad && (
                                <p className="text-xs text-red-500">{errors.documento_identidad}</p>
                            )}
                            <p className="text-xs text-gray-500">Cédula de ciudadanía</p>
                        </div>

                        {/* Teléfono */}
                        <div className="space-y-2">
                            <Label htmlFor="telefono">
                                <Phone className="w-4 h-4 inline mr-1" />
                                Teléfono
                            </Label>
                            <Input
                                id="telefono"
                                name="telefono"
                                value={formData.telefono}
                                onChange={handlePhoneChange}
                                placeholder="300 123 4567"
                                className={errors.telefono ? 'border-red-500' : ''}
                            />
                            {errors.telefono && (
                                <p className="text-xs text-red-500">{errors.telefono}</p>
                            )}
                        </div>

                        {/* Email */}
                        <div className="space-y-2">
                            <Label htmlFor="email">
                                <Mail className="w-4 h-4 inline mr-1" />
                                Email
                            </Label>
                            <Input
                                id="email"
                                name="email"
                                type="email"
                                value={formData.email}
                                onChange={handleChange}
                                placeholder="maria.garcia@email.com"
                                className={errors.email ? 'border-red-500' : ''}
                            />
                            {errors.email && (
                                <p className="text-xs text-red-500">{errors.email}</p>
                            )}
                        </div>

                        {/* Password - Only in Create Mode */}
                        {mode === 'create' && (
                            <div className="space-y-2">
                                <Label htmlFor="password">
                                    Contraseña (para usuario)
                                </Label>
                                <Input
                                    id="password"
                                    name="password"
                                    type="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    placeholder="******"
                                    className={errors.password ? 'border-red-500' : ''}
                                />
                                {errors.password && (
                                    <p className="text-xs text-red-500">{errors.password}</p>
                                )}
                                <p className="text-xs text-gray-500">Si se deja vacío, se usará &apos;Especialista123!&apos;</p>
                            </div>
                        )}

                        {/* Fecha Ingreso */}
                        <div className="space-y-2">
                            <Label htmlFor="fecha_ingreso">
                                <Calendar className="w-4 h-4 inline mr-1" />
                                Fecha de Ingreso
                            </Label>
                            <Input
                                id="fecha_ingreso"
                                name="fecha_ingreso"
                                type="date"
                                value={formData.fecha_ingreso}
                                onChange={handleChange}
                                max={new Date().toISOString().split('T')[0]}
                            />
                        </div>

                        {/* Documentación Upload - Drag and Drop */}
                        <div className="space-y-4 col-span-1 md:col-span-2">
                            <Label htmlFor="documentacion">
                                Documentación PDF
                            </Label>

                            <div
                                className={`
                                    border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center gap-4 transition-colors cursor-pointer relative
                                    ${dragActive
                                        ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                                        : 'border-gray-300 dark:border-gray-700 hover:border-purple-400 hover:bg-gray-50 dark:hover:bg-gray-800/50'
                                    }
                                `}
                                onDragEnter={handleDrag}
                                onDragLeave={handleDrag}
                                onDragOver={handleDrag}
                                onDrop={handleDrop}
                                onClick={() => document.getElementById('documentacion-input')?.click()}
                            >
                                <input
                                    id="documentacion-input"
                                    name="documentacion"
                                    type="file"
                                    accept=".pdf"
                                    multiple
                                    className="hidden"
                                    onChange={handleFileChange}
                                />

                                <div className="text-center">
                                    <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mx-auto mb-2">
                                        <Upload className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                                    </div>
                                    <p className="font-medium text-gray-900 dark:text-white">
                                        {mode === 'edit' ? 'Arrastra nuevos documentos' : 'Arrastra documentos PDF aquí'}
                                    </p>
                                    <p className="text-xs text-gray-500 mt-1">
                                        o haz click para buscar
                                    </p>
                                </div>
                            </div>

                            {/* Lista de archivos pendientes (Create Mode) */}
                            {mode === 'create' && pendingFiles.length > 0 && (
                                <div className="space-y-2 mt-4">
                                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Archivos seleccionados:</h4>
                                    <div className="grid grid-cols-1 gap-2">
                                        {pendingFiles.map((f, index) => (
                                            <div key={index} className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm">
                                                <div className="flex items-center gap-3 overflow-hidden">
                                                    <div className="bg-purple-100 dark:bg-purple-900/30 p-2 rounded">
                                                        <FileText className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                                                    </div>
                                                    <div className="flex flex-col min-w-0">
                                                        <span className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                                            {f.name}
                                                        </span>
                                                        <span className="text-xs text-gray-500">
                                                            {(f.size / 1024).toFixed(1)} KB
                                                        </span>
                                                    </div>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => setPendingFiles(prev => prev.filter((_, i) => i !== index))}
                                                    className="p-1 hover:bg-red-100 text-red-500 rounded-full"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Lista de Archivos Existentes (Solo Edit Mode) */}
                            {mode === 'edit' && files && files.length > 0 && (
                                <div className="space-y-2 mt-4">
                                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Documentos Cargados:</h4>
                                    <div className="grid grid-cols-1 gap-2">
                                        {files.map((f, index) => (
                                            <div key={index} className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm">
                                                <div className="flex items-center gap-3 overflow-hidden">
                                                    <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded">
                                                        <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                                    </div>
                                                    <div className="flex flex-col min-w-0">
                                                        <a
                                                            href={`${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '')}/storage/${f.url}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-sm font-medium text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 truncate"
                                                        >
                                                            {f.name}
                                                        </a>
                                                        <span className="text-xs text-gray-500">
                                                            {(f.size / 1024).toFixed(1)} KB
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => {
                                                            if (confirm(`¿Eliminar ${f.name}?`)) {
                                                                if (especialistaId) deleteFile(especialistaId, f.name);
                                                            }
                                                        }}
                                                        className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                                                    >
                                                        <X className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {mode === 'edit' && selectedEspecialista?.documentacion && !files?.some(f => f.name === selectedEspecialista.documentacion) && (
                                <div className="mt-2 text-sm text-blue-600 hover:underline">
                                    <a
                                        href={`${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '')}/storage/${selectedEspecialista.documentacion}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center"
                                    >
                                        <FileText className="w-4 h-4 mr-1" />
                                        Ver Documentación Anterior (Legacy)
                                    </a>
                                </div>
                            )}
                        </div>

                    </div>
                </div>

                {/* Botones */}
                <div className="flex items-center justify-between">
                    <Button type="button" variant="outline" onClick={handleCancel}>
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Cancelar
                    </Button>

                    <Button
                        type="submit"
                        className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Guardando...
                            </>
                        ) : (
                            <>
                                <Save className="w-4 h-4 mr-2" />
                                {mode === 'create' ? 'Guardar Especialista' : 'Guardar Cambios'}
                            </>
                        )}
                    </Button>
                </div>
            </form>
        </div>
    );
}
