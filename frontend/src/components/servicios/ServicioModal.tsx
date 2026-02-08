'use client';

import { useState, useEffect } from 'react';
import { useServicioStore } from '@/stores/servicioStore';
import { useEspecialistaStore } from '@/stores/especialistaStore';
import { ServicioFormData, formatPrecio, DURACION_OPTIONS, DEFAULT_COLORS } from '@/types/servicio';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import {
    X,
    Loader2,
    Save,
    AlertCircle,
    Scissors,
    Clock,
    DollarSign,
    Tag,
    FileText,
    Percent,
    Calculator,
    Users
} from 'lucide-react';
import { toast } from 'sonner';

interface ServicioModalProps {
    isOpen: boolean;
    onClose: () => void;
    servicioId?: number | null;
}

// Helper para formato de miles
const formatNumber = (value: string) => {
    // Remover todo lo que no sea dígito
    const cleanValue = value.replace(/\D/g, "");
    // Formatear con puntos
    return cleanValue.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
};

const unformatNumber = (value: string) => {
    return parseInt(value.replace(/\./g, "")) || 0;
};

export default function ServicioModal({ isOpen, onClose, servicioId }: ServicioModalProps) {
    const {
        servicios,
        categorias,
        isLoading,
        error,
        createServicio,
        updateServicio,
        fetchCategorias,
        clearError,
    } = useServicioStore();

    const {
        especialistas,
        fetchEspecialistas,
        assignServicio
    } = useEspecialistaStore();

    const [formData, setFormData] = useState<ServicioFormData>({
        nombre: '',
        descripcion: '',
        categoria_id: null,
        duracion_minutos: 60,
        precio_base: 0,
        estado: 'activo',
        color_calendario: DEFAULT_COLORS[0],
        tipo_comision: 'porcentaje',
        valor_comision: 40,
    });

    // Estados para inputs formateados
    const [precioFormatted, setPrecioFormatted] = useState<string>('');
    const [comisionFormatted, setComisionFormatted] = useState<string>('40');

    // Estado para "Aplicar a todos"
    const [assignToAll, setAssignToAll] = useState(false);

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isDirty, setIsDirty] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [categoriasLoaded, setCategoriasLoaded] = useState(false);
    const [especialistasLoaded, setEspecialistasLoaded] = useState(false);

    const isEditMode = !!servicioId;

    // Cargar datos al abrir
    useEffect(() => {
        if (isOpen) {
            fetchCategorias().then(() => setCategoriasLoaded(true));
            // Cargar especialistas si estamos creando para saber cuántos hay (opcional, pero útil)
            if (!isEditMode) {
                fetchEspecialistas({ estado: 'activo' }).then(() => setEspecialistasLoaded(true));
            }
        }
    }, [isOpen, fetchCategorias, fetchEspecialistas, isEditMode]);

    // Prellenar formulario si es modo edición
    useEffect(() => {
        if (isOpen && servicioId) {
            const servicio = servicios.find(s => s.id === servicioId);
            if (servicio) {
                const precio = Number(servicio.precio_base);
                const comision = Number(servicio.valor_comision);
                const tipoComision = servicio.tipo_comision || 'porcentaje';

                setFormData({
                    nombre: servicio.nombre,
                    descripcion: servicio.descripcion || '',
                    categoria_id: servicio.categoria_id,
                    duracion_minutos: servicio.duracion_minutos,
                    precio_base: precio,
                    estado: servicio.estado,
                    color_calendario: servicio.color_calendario || DEFAULT_COLORS[0],
                    tipo_comision: tipoComision,
                    valor_comision: comision,
                });

                setPrecioFormatted(precio > 0 ? formatNumber(String(precio)) : '');

                if (tipoComision === 'fijo') {
                    setComisionFormatted(comision > 0 ? formatNumber(String(comision)) : '');
                } else {
                    setComisionFormatted(String(comision));
                }
            }
        }
    }, [isOpen, servicioId, servicios]);

    // Resetear formulario al cerrar
    useEffect(() => {
        if (!isOpen) {
            setFormData({
                nombre: '',
                descripcion: '',
                categoria_id: null,
                duracion_minutos: 60,
                precio_base: 0,
                estado: 'activo',
                color_calendario: DEFAULT_COLORS[0],
                tipo_comision: 'porcentaje',
                valor_comision: 40,
            });
            setPrecioFormatted('');
            setComisionFormatted('40');
            setAssignToAll(false);
            setErrors({});
            setIsDirty(false);
            setCategoriasLoaded(false);
            clearError();
        }
    }, [isOpen, clearError]);

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    ) => {
        const { name, value, type } = e.target;

        let newValue: string | number | null = value;

        if (name === 'categoria_id') {
            newValue = value ? parseInt(value) : null;
        } else if (name === 'tipo_comision') {
            // Resetear valor comision visual al cambiar tipo
            const tipoComision = value as 'porcentaje' | 'fijo';
            if (tipoComision === 'porcentaje') {
                setComisionFormatted('40');
                setFormData(prev => ({ ...prev, tipo_comision: tipoComision, valor_comision: 40 }));
            } else {
                setComisionFormatted('');
                setFormData(prev => ({ ...prev, tipo_comision: tipoComision, valor_comision: 0 }));
            }
            setIsDirty(true);
            return;
        } else if (type === 'number' && name !== 'precio_base' && name !== 'valor_comision') {
            newValue = parseFloat(value) || 0;
        }

        setFormData((prev) => ({ ...prev, [name]: newValue }));
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

    const handlePrecioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        // Solo permitir números
        const formatted = formatNumber(value);
        setPrecioFormatted(formatted);

        const numericValue = unformatNumber(formatted);
        setFormData((prev) => ({ ...prev, precio_base: numericValue }));
        setIsDirty(true);

        setErrors(prev => {
            const { precio_base, ...rest } = prev;
            return rest;
        });
    };

    const handleComisionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;

        if (formData.tipo_comision === 'fijo') {
            const formatted = formatNumber(value);
            setComisionFormatted(formatted);
            setFormData(prev => ({ ...prev, valor_comision: unformatNumber(formatted) }));
        } else {
            // Porcentaje (0-100)
            const num = parseFloat(value);
            if (value === '' || (num >= 0 && num <= 100)) {
                setComisionFormatted(value);
                setFormData(prev => ({ ...prev, valor_comision: value === '' ? 0 : num }));
            }
        }
        setIsDirty(true);
    };

    const handleDuracionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setFormData((prev) => ({ ...prev, duracion_minutos: parseInt(e.target.value) }));
        setIsDirty(true);
    };

    const validate = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!formData.nombre.trim()) {
            newErrors.nombre = 'El nombre es requerido';
        }

        if (formData.duracion_minutos < 15) {
            newErrors.duracion_minutos = 'La duración mínima es 15 minutos';
        }

        if (formData.precio_base < 0) {
            newErrors.precio_base = 'El precio no puede ser negativo';
        }

        // Validar que haya categorías disponibles en modo creación
        if (!isEditMode && categorias.length === 0) {
            newErrors.categoria_id = 'Debe crear al menos una categoría primero';
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
            let createdServicioId: number | undefined;

            if (isEditMode && servicioId) {
                await updateServicio(servicioId, formData);
                toast.success('Servicio actualizado exitosamente');
            } else {
                const newServicio = await createServicio(formData);
                createdServicioId = newServicio.id;
                toast.success('Servicio creado exitosamente');

                // Lógica de asignación masiva
                if (assignToAll && createdServicioId) {
                    toast.info('Asignando servicio a especialistas...');

                    // Asignar el servicio a todos los especialistas activos
                    // Nota: Idealmente esto debería hacerse en el backend en una sola transacción
                    const activeEspecialistas = especialistas.length > 0 ? especialistas : await fetchEspecialistas({ estado: 'activo' }).then(() => useEspecialistaStore.getState().especialistas);

                    if (activeEspecialistas && activeEspecialistas.length > 0) {
                        const promises = activeEspecialistas.map(esp =>
                            assignServicio(esp.id, {
                                servicio_id: createdServicioId!,
                                tipo_comision: formData.tipo_comision || 'porcentaje',
                                valor_comision: formData.valor_comision || 0
                            }).catch(err => {
                                console.error(`Error asignando a especialista ${esp.id}:`, err);
                                return null;
                            })
                        );

                        await Promise.all(promises);
                        toast.success(`Servicio asignado a ${activeEspecialistas.length} especialistas`);
                    } else {
                        toast.info('No hay especialistas activos para asignar');
                    }
                }
            }
            onClose();
        } catch (err: any) {
            toast.error(err.response?.data?.detail || 'Error al guardar servicio');
        } finally {
            setIsSubmitting(false);
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
            <div className="relative bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-800">
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
                            <Scissors className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                                {isEditMode ? 'Editar Servicio' : 'Nuevo Servicio'}
                            </h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                {isEditMode
                                    ? 'Modifica los datos del servicio'
                                    : 'Complete los datos para crear un nuevo servicio'}
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
                <form onSubmit={handleSubmit} className="overflow-y-auto max-h-[calc(90vh-180px)]">
                    <div className="p-6 space-y-6">
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

                        {/* Sección: Información Básica */}
                        <div className="space-y-4">
                            <div className="flex items-center space-x-2 text-gray-700 dark:text-gray-300">
                                <FileText className="w-4 h-4" />
                                <h3 className="font-semibold">Información Básica</h3>
                            </div>

                            {/* Nombre */}
                            <div className="space-y-2">
                                <Label htmlFor="nombre">
                                    Nombre del servicio <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="nombre"
                                    name="nombre"
                                    value={formData.nombre}
                                    onChange={handleChange}
                                    placeholder="Ej: Alisado Brasileño Premium"
                                    className={errors.nombre ? 'border-red-500' : ''}
                                />
                                {errors.nombre && (
                                    <p className="text-xs text-red-500">{errors.nombre}</p>
                                )}
                            </div>

                            {/* Categoría */}
                            <div className="space-y-2">
                                <Label htmlFor="categoria_id">
                                    <Tag className="w-4 h-4 inline mr-1" />
                                    Categoría <span className="text-red-500">*</span>
                                </Label>
                                {categoriasLoaded && categorias.length === 0 ? (
                                    <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
                                        <p className="text-sm text-amber-700 dark:text-amber-400">
                                            ⚠️ No hay categorías disponibles. Por favor, crea una categoría primero.
                                        </p>
                                    </div>
                                ) : (
                                    <select
                                        id="categoria_id"
                                        name="categoria_id"
                                        value={formData.categoria_id || ''}
                                        onChange={handleChange}
                                        className={cn(
                                            'w-full px-3 py-2 text-sm border rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100',
                                            errors.categoria_id
                                                ? 'border-red-500'
                                                : 'border-gray-200 dark:border-gray-700'
                                        )}
                                    >
                                        <option value="">Seleccionar categoría...</option>
                                        {categorias.map((cat) => (
                                            <option key={cat.id} value={cat.id}>
                                                {cat.nombre}
                                            </option>
                                        ))}
                                    </select>
                                )}
                                {errors.categoria_id && (
                                    <p className="text-xs text-red-500">{errors.categoria_id}</p>
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
                                    placeholder="Describe brevemente el servicio..."
                                    rows={3}
                                    className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 resize-none"
                                />
                            </div>
                        </div>

                        {/* Divider */}
                        <div className="border-t border-gray-200 dark:border-gray-800" />

                        {/* Sección: Duración y Precio */}
                        <div className="space-y-4">
                            <div className="flex items-center space-x-2 text-gray-700 dark:text-gray-300">
                                <DollarSign className="w-4 h-4" />
                                <h3 className="font-semibold">Duración y Precio</h3>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Duración */}
                                <div className="space-y-2">
                                    <Label htmlFor="duracion_minutos">
                                        <Clock className="w-4 h-4 inline mr-1" />
                                        Duración <span className="text-red-500">*</span>
                                    </Label>
                                    <select
                                        id="duracion_minutos"
                                        name="duracion_minutos"
                                        value={formData.duracion_minutos}
                                        onChange={handleDuracionChange}
                                        className={cn(
                                            'w-full px-3 py-2 text-sm border rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100',
                                            errors.duracion_minutos
                                                ? 'border-red-500'
                                                : 'border-gray-200 dark:border-gray-700'
                                        )}
                                    >
                                        {DURACION_OPTIONS.map((opt) => (
                                            <option key={opt.value} value={opt.value}>
                                                {opt.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Precio con formato */}
                                <div className="space-y-2">
                                    <Label htmlFor="precio_base">
                                        <DollarSign className="w-4 h-4 inline mr-1" />
                                        Precio Base <span className="text-red-500">*</span>
                                    </Label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                                            $
                                        </span>
                                        <Input
                                            id="precio_base"
                                            name="precio_base"
                                            type="text"
                                            value={precioFormatted}
                                            onChange={handlePrecioChange}
                                            placeholder="Ingrese el precio"
                                            className={cn('pl-7', errors.precio_base ? 'border-red-500' : '')}
                                        />
                                    </div>
                                    {errors.precio_base && (
                                        <p className="text-xs text-red-500">{errors.precio_base}</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Divider */}
                        <div className="border-t border-gray-200 dark:border-gray-800" />

                        {/* Sección de Comisión */}
                        <div className="space-y-4">
                            <div className="flex items-center space-x-2 text-gray-700 dark:text-gray-300">
                                <Percent className="w-5 h-5" />
                                <h3 className="font-semibold">Comisión para Especialistas</h3>
                            </div>

                            {/* Tipo de Comisión */}
                            <div className="space-y-2">
                                <Label>Tipo de Comisión</Label>
                                <div className="flex space-x-4">
                                    <label className="flex items-center space-x-2 cursor-pointer bg-gray-50 dark:bg-gray-800 p-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-purple-50 dark:hover:bg-purple-900/10 transition-colors">
                                        <input
                                            type="radio"
                                            name="tipo_comision"
                                            value="porcentaje"
                                            checked={formData.tipo_comision === 'porcentaje'}
                                            onChange={handleChange}
                                            className="w-4 h-4 text-purple-600 focus:ring-purple-500"
                                        />
                                        <Percent className="w-4 h-4 text-blue-600 ml-2" />
                                        <span className="text-sm ml-1 font-medium">Porcentaje</span>
                                    </label>
                                    <label className="flex items-center space-x-2 cursor-pointer bg-gray-50 dark:bg-gray-800 p-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-green-50 dark:hover:bg-green-900/10 transition-colors">
                                        <input
                                            type="radio"
                                            name="tipo_comision"
                                            value="fijo"
                                            checked={formData.tipo_comision === 'fijo'}
                                            onChange={handleChange}
                                            className="w-4 h-4 text-purple-600 focus:ring-purple-500"
                                        />
                                        <DollarSign className="w-4 h-4 text-green-600 ml-2" />
                                        <span className="text-sm ml-1 font-medium">Valor fijo</span>
                                    </label>
                                </div>
                            </div>

                            {/* Valor de Comisión con formato */}
                            <div className="space-y-2">
                                <Label htmlFor="valor_comision">
                                    {formData.tipo_comision === 'porcentaje' ? 'Porcentaje (%)' : 'Valor Fijo ($)'}
                                </Label>
                                <Input
                                    id="valor_comision"
                                    name="valor_comision"
                                    type="text"
                                    value={comisionFormatted}
                                    onChange={handleComisionChange}
                                    placeholder={formData.tipo_comision === 'porcentaje' ? '40' : '50.000'}
                                />
                            </div>

                            {/* Preview de Comisión */}
                            {formData.precio_base > 0 && formData.valor_comision !== undefined && formData.valor_comision > 0 && (
                                <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg p-4">
                                    <div className="flex items-center space-x-2 mb-2">
                                        <Calculator className="w-4 h-4 text-emerald-600" />
                                        <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                                            Ejemplo de ganancia
                                        </span>
                                    </div>
                                    <p className="text-sm text-emerald-700 dark:text-emerald-300">
                                        Especialista recibe:{' '}
                                        <span className="font-bold text-lg">
                                            {formData.tipo_comision === 'porcentaje'
                                                ? formatPrecio(Math.round((formData.precio_base * (formData.valor_comision || 0)) / 100))
                                                : formatPrecio(formData.valor_comision || 0)
                                            }
                                        </span>
                                    </p>
                                </div>
                            )}

                            {/* Toggle Asignar a Todos (Solo creación) */}
                            {!isEditMode && (
                                <div className="mt-4 p-4 border border-blue-100 bg-blue-50 dark:bg-blue-900/10 dark:border-blue-800 rounded-xl">
                                    <label className="flex items-start space-x-3 cursor-pointer">
                                        <div className="flex items-center h-5">
                                            <input
                                                type="checkbox"
                                                checked={assignToAll}
                                                onChange={(e) => setAssignToAll(e.target.checked)}
                                                className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                            />
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center">
                                                <Users className="w-4 h-4 text-blue-600 mr-2" />
                                                <span className="font-medium text-blue-900 dark:text-blue-100">
                                                    Asignar a todos los especialistas
                                                </span>
                                            </div>
                                            <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                                                Si activas esta opción, el servicio se habilitará automáticamente para los
                                                {especialistasLoaded ? ` ${especialistas.length} ` : ' todos los '}
                                                especialistas activos.
                                            </p>
                                        </div>
                                    </label>
                                </div>
                            )}
                        </div>

                        {/* Divider */}
                        <div className="border-t border-gray-200 dark:border-gray-800" />

                        {/* Color del calendario */}
                        <div className="space-y-4">
                            <div className="flex items-center space-x-2 text-gray-700 dark:text-gray-300">
                                <h3 className="font-semibold">Color en el Calendario</h3>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {DEFAULT_COLORS.map((color) => (
                                    <button
                                        key={color}
                                        type="button"
                                        onClick={() => {
                                            setFormData((prev) => ({ ...prev, color_calendario: color }));
                                            setIsDirty(true);
                                        }}
                                        className={cn(
                                            'w-8 h-8 rounded-full transition-transform hover:scale-110 border-2',
                                            formData.color_calendario === color
                                                ? 'border-gray-900 dark:border-white scale-110'
                                                : 'border-transparent'
                                        )}
                                        style={{ backgroundColor: color }}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Estado (solo en edición) */}
                        {isEditMode && (
                            <>
                                <div className="border-t border-gray-200 dark:border-gray-800" />
                                <div className="space-y-4">
                                    <h3 className="font-semibold text-gray-700 dark:text-gray-300">Estado</h3>
                                    <div className="flex items-center space-x-4">
                                        <label className="flex items-center space-x-2 cursor-pointer">
                                            <input
                                                type="radio"
                                                name="estado"
                                                value="activo"
                                                checked={formData.estado === 'activo'}
                                                onChange={handleChange}
                                                className="w-4 h-4 text-green-600 border-gray-300 focus:ring-green-500"
                                            />
                                            <span className="text-green-600 font-medium">Activo</span>
                                        </label>
                                        <label className="flex items-center space-x-2 cursor-pointer">
                                            <input
                                                type="radio"
                                                name="estado"
                                                value="inactivo"
                                                checked={formData.estado === 'inactivo'}
                                                onChange={handleChange}
                                                className="w-4 h-4 text-gray-600 border-gray-300 focus:ring-gray-500"
                                            />
                                            <span className="text-gray-600 font-medium">Inactivo</span>
                                        </label>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </form>

                {/* Footer */}
                <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
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
                                {isEditMode ? 'Guardar Cambios' : 'Crear Servicio'}
                            </>
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
}
