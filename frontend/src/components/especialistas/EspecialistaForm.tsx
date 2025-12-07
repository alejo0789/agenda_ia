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
        clearError,
        clearSelectedEspecialista,
    } = useEspecialistaStore();

    const [formData, setFormData] = useState<EspecialistaFormData>({
        nombre: '',
        apellido: '',
        documento_identidad: '',
        telefono: '',
        email: '',
        fecha_ingreso: '',
    });

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isDirty, setIsDirty] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Cargar datos si es modo editar
    useEffect(() => {
        if (mode === 'edit' && especialistaId) {
            fetchEspecialista(especialistaId);
        }

        return () => {
            clearSelectedEspecialista();
            clearError();
        };
    }, [especialistaId, mode, fetchEspecialista, clearSelectedEspecialista, clearError]);

    // Prellenar formulario cuando se cargue el especialista
    useEffect(() => {
        if (mode === 'edit' && selectedEspecialista) {
            setFormData({
                nombre: selectedEspecialista.nombre,
                apellido: selectedEspecialista.apellido,
                documento_identidad: selectedEspecialista.documento_identidad || '',
                telefono: selectedEspecialista.telefono || '',
                email: selectedEspecialista.email || '',
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

            if (mode === 'create') {
                await createEspecialista(dataToSubmit);
            } else if (especialistaId) {
                await updateEspecialista(especialistaId, dataToSubmit);
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
