'use client';

import { useState, useEffect } from 'react';
import { X, Plus, Trash2, Save, GripVertical, Settings2, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { fichasApi, PlantillaFicha, CampoFicha, PlantillaFichaCreate } from '@/lib/api/fichas';
import { toast } from 'sonner';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    initialData?: PlantillaFicha;
}

const TIPOS_CAMPO = [
    { value: 'texto_corto', label: 'Respuesta Corta', icon: '📝' },
    { value: 'texto_largo', label: 'Párrafo Largo', icon: '📄' },
    { value: 'numero', label: 'Número', icon: '🔢' },
    { value: 'opcion_multiple', label: 'Selección Múltiple (Radio)', icon: '⭕' },
    { value: 'casillas', label: 'Casillas de Verificación (Checkboxes)', icon: '☑️' },
    { value: 'fecha', label: 'Fecha', icon: '📅' },
    { value: 'informativo', label: 'Texto Informativo (Sin respuesta)', icon: 'ℹ️' },
];

export function CreadorPlantillaModal({ isOpen, onClose, onSuccess, initialData }: Props) {
    const isEditing = !!initialData;
    const [isLoading, setIsLoading] = useState(false);

    // Form State
    const [nombre, setNombre] = useState(initialData?.nombre || '');
    const [descripcion, setDescripcion] = useState(initialData?.descripcion || '');
    const [activa, setActiva] = useState(initialData?.activa ?? true);

    // Campos State
    const [campos, setCampos] = useState<CampoFicha[]>(initialData?.campos || []);

    if (!isOpen) return null;

    const handleAgregarCampo = () => {
        setCampos([
            ...campos,
            {
                nombre: '',
                tipo: 'texto_corto',
                requerido: false,
                orden: campos.length + 1
            } as CampoFicha
        ]);
    };

    const handleEliminarCampo = (index: number) => {
        const nuevosCampos = campos.filter((_, i) => i !== index);
        // Re-ordenar
        setCampos(nuevosCampos.map((c, i) => ({ ...c, orden: i + 1 })));
    };

    const handleCampoChange = (index: number, campoActualizado: Partial<CampoFicha>) => {
        const nuevosCampos = [...campos];
        nuevosCampos[index] = { ...nuevosCampos[index], ...campoActualizado };
        setCampos(nuevosCampos);
    };

    const handleGuardar = async () => {
        if (!nombre.trim()) {
            toast.error('El nombre de la plantilla es obligatorio');
            return;
        }

        if (campos.length === 0) {
            toast.error('Debes agregar al menos una pregunta a la ficha');
            return;
        }

        const camposInvalidos = campos.some(c => !c.nombre.trim());
        if (camposInvalidos) {
            toast.error('Todas las preguntas deben tener un título');
            return;
        }

        setIsLoading(true);
        try {
            if (isEditing) {
                // Actualmente la API actualiza los campos básicos, 
                // para un creador full usualmente se re-envían los campos o hay endpoints específicos.
                // Como lo programamos, el "actualizar_plantilla" solo actualiza la info básica, 
                // así que para este ejemplo simplificado (y asumiendo que el User no modifica mucho los campos después de creados o usamos la misma estructura) 
                // lo manejaremos advirtiendo al usuario o asumiendo que crea nuevas versiones. 
                // *Nota: Para simplificar, la API backend solo permite editar nombre/descripción.
                await fichasApi.updatePlantilla(initialData.id, {
                    nombre,
                    descripcion,
                    activa
                });
                toast.success('Ficha Técnica actualizada');
            } else {
                const data: PlantillaFichaCreate = {
                    nombre,
                    descripcion,
                    activa,
                    campos: campos.map((c, i) => ({ ...c, orden: i + 1 }))
                };
                await fichasApi.createPlantilla(data);
                toast.success('Plantilla creada correctamente');
            }
            onSuccess();
        } catch (error) {
            console.error(error);
            toast.error('Ocurrió un error al guardar');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

            <div className="relative bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-4xl m-4 md:m-8 flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="flex-none bg-gradient-to-r from-emerald-600 to-teal-700 px-6 py-4 flex items-center justify-between rounded-t-xl">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <Settings2 className="w-5 h-5" />
                        {isEditing ? 'Editar Ficha Técnica' : 'Crear Nueva Ficha Técnica'}
                    </h2>
                    <button onClick={onClose} className="text-white hover:bg-white/20 p-2 rounded-full transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body - Scrollable */}
                <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8 bg-gray-50 dark:bg-gray-900/50">

                    {/* Configuraciones Básicas */}
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 space-y-4">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-700 pb-2">
                            1. Información Básica
                        </h3>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Nombre de la Plantilla <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={nombre}
                                    onChange={(e) => setNombre(e.target.value)}
                                    placeholder="Ej: Ficha de Alisados, Evaluación Capilar..."
                                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-emerald-500 dark:bg-gray-700 dark:text-white text-lg font-medium"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Descripción / Instrucciones (Visible para el cliente)
                                </label>
                                <textarea
                                    value={descripcion}
                                    onChange={(e) => setDescripcion(e.target.value)}
                                    rows={3}
                                    placeholder="Ej: Por favor, responde con sinceridad a las siguientes preguntas para ofrecerte un mejor servicio."
                                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-emerald-500 dark:bg-gray-700 dark:text-white resize-none"
                                />
                            </div>

                            <label className="flex items-center gap-2 cursor-pointer mt-4">
                                <input
                                    type="checkbox"
                                    className="rounded border-gray-300 text-emerald-600 shadow-sm focus:border-emerald-300 focus:ring focus:ring-offset-0 focus:ring-emerald-200 focus:ring-opacity-50"
                                    checked={activa}
                                    onChange={(e) => setActiva(e.target.checked)}
                                />
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Plantilla Activa (Disponible para agendar)</span>
                            </label>
                        </div>
                    </div>

                    {/* Constructor de Preguntas */}
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                        <div className="flex justify-between items-center border-b border-gray-100 dark:border-gray-700 pb-4 mb-6">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                2. Preguntas del Cuestionario
                                {isEditing && (
                                    <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full font-normal">
                                        Las preguntas no se pueden editar después de creadas (Solo info básica)
                                    </span>
                                )}
                            </h3>
                            {!isEditing && (
                                <Button size="sm" onClick={handleAgregarCampo} variant="outline" className="text-emerald-600 border-emerald-200 hover:bg-emerald-50 text-sm">
                                    <Plus className="w-4 h-4 mr-2" />
                                    Añadir Pregunta
                                </Button>
                            )}
                        </div>

                        <div className="space-y-6">
                            {campos.length === 0 ? (
                                <div className="text-center py-8 text-gray-500 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-dashed border-gray-300 dark:border-gray-600">
                                    No has añadido ninguna pregunta aún.
                                </div>
                            ) : (
                                campos.map((campo, index) => (
                                    <div key={index} className={`relative flex gap-4 p-5 rounded-xl border ${isEditing ? 'bg-gray-50/50 opacity-80 border-gray-200 pointer-events-none' : 'bg-white border-emerald-100 shadow-sm'}`}>

                                        {!isEditing && (
                                            <div className="flex-none pt-2 text-gray-400 cursor-move">
                                                <GripVertical className="w-5 h-5" />
                                            </div>
                                        )}

                                        <div className="flex-1 space-y-4">
                                            <div className="flex flex-col md:flex-row gap-4">
                                                <div className="flex-1">
                                                    <input
                                                        type="text"
                                                        placeholder={`Pregunta ${index + 1}`}
                                                        value={campo.nombre}
                                                        onChange={(e) => handleCampoChange(index, { nombre: e.target.value })}
                                                        className="w-full text-lg font-medium px-0 py-1 border-0 border-b-2 border-gray-200 focus:ring-0 focus:border-emerald-500 bg-transparent dark:text-white"
                                                    />
                                                </div>
                                                <div className="w-full md:w-64">
                                                    <select
                                                        value={campo.tipo}
                                                        onChange={(e) => handleCampoChange(index, { tipo: e.target.value as any })}
                                                        className="w-full rounded-lg border border-gray-300 py-2 pl-3 pr-10 text-sm focus:border-emerald-500 focus:ring-emerald-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                                    >
                                                        {TIPOS_CAMPO.map(tipo => (
                                                            <option key={tipo.value} value={tipo.value}>{tipo.label}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>

                                            {/* Preview / Settings base on Tipo */}
                                            <div className="pl-2 pt-2 text-sm text-gray-500">
                                                {campo.tipo === 'texto_corto' && (
                                                    <div className="border border-dashed border-gray-300 rounded p-2 bg-gray-50 w-full max-w-md">Respuesta corta del cliente...</div>
                                                )}
                                                {campo.tipo === 'texto_largo' && (
                                                    <div className="border border-dashed border-gray-300 rounded p-4 bg-gray-50 w-full h-20 flex items-start">Párrafo largo...</div>
                                                )}
                                                {campo.tipo === 'numero' && (
                                                    <div className="border border-dashed border-gray-300 rounded p-2 bg-gray-50 w-32 text-center">Ej: 24</div>
                                                )}
                                                {(campo.tipo === 'opcion_multiple' || campo.tipo === 'casillas') && (
                                                    <div className="space-y-2">
                                                        <label className="block text-xs font-semibold text-gray-700">Opciones (Separadas por comas):</label>
                                                        <input
                                                            type="text"
                                                            placeholder="Opción 1, Opción 2, Opción 3"
                                                            value={campo.opciones || ''}
                                                            onChange={(e) => handleCampoChange(index, { opciones: e.target.value })}
                                                            className="w-full md:w-2/3 px-3 py-1.5 border border-gray-300 rounded"
                                                        />
                                                    </div>
                                                )}
                                                {campo.tipo === 'informativo' && (
                                                    <div className="space-y-2">
                                                        <label className="block text-xs font-semibold text-gray-700 flex items-center gap-1">
                                                            <Info className="w-3 h-3" />
                                                            Texto informativo visible para el cliente:
                                                        </label>
                                                        <textarea
                                                            placeholder="Escribe aquí el texto que verá el cliente (instrucciones, consejos, advertencias...)"
                                                            value={campo.opciones || ''}
                                                            onChange={(e) => handleCampoChange(index, { opciones: e.target.value })}
                                                            rows={3}
                                                            className="w-full px-3 py-2 border border-blue-200 rounded-lg bg-blue-50/50 text-gray-700 focus:border-blue-400 focus:ring-blue-300 resize-none text-sm"
                                                        />
                                                        <p className="text-xs text-blue-500">Este bloque no requiere respuesta. Se mostrará como texto resaltado en azul para el cliente.</p>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="flex justify-between items-center pt-2 mt-4 border-t border-gray-100">
                                                {campo.tipo !== 'informativo' ? (
                                                    <label className="flex items-center gap-2 cursor-pointer">
                                                        <input
                                                            type="checkbox"
                                                            checked={campo.requerido}
                                                            onChange={(e) => handleCampoChange(index, { requerido: e.target.checked })}
                                                            className="rounded text-emerald-600 focus:ring-emerald-500"
                                                        />
                                                        <span className="text-sm text-gray-600 font-medium">Obligatorio</span>
                                                    </label>
                                                ) : (
                                                    <span className="flex items-center gap-1.5 text-xs text-blue-500 bg-blue-50 px-2 py-1 rounded-full">
                                                        <Info className="w-3 h-3" />
                                                        Bloque informativo - sin respuesta
                                                    </span>
                                                )}

                                                {!isEditing && (
                                                    <button
                                                        onClick={() => handleEliminarCampo(index)}
                                                        className="text-gray-400 hover:text-red-500 p-1 rounded-full hover:bg-red-50 transition-colors"
                                                        title="Eliminar pregunta"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {!isEditing && campos.length > 0 && (
                            <div className="mt-6 border-t border-gray-100 pt-6">
                                <Button size="sm" onClick={handleAgregarCampo} variant="outline" className="w-full border-dashed border-2 py-6 text-gray-500 hover:bg-gray-50 hover:text-emerald-600 hover:border-emerald-300">
                                    <Plus className="w-5 h-5 mr-2" />
                                    Añadir otra pregunta
                                </Button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="flex-none bg-white dark:bg-gray-800 px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3 rounded-b-xl">
                    <Button variant="outline" onClick={onClose} disabled={isLoading}>
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleGuardar}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white"
                        disabled={isLoading}
                    >
                        {isLoading ? 'Guardando...' : <><Save className="w-4 h-4 mr-2" /> Guardar Ficha Técnica</>}
                    </Button>
                </div>
            </div>
        </div>
    );
}
