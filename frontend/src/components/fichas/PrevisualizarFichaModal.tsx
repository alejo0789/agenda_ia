'use client';

import { X, CheckSquare, Circle, CalendarIcon, Type, AlignLeft, Hash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PlantillaFicha } from '@/lib/api/fichas';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    plantilla: PlantillaFicha | null;
}

export function PrevisualizarFichaModal({ isOpen, onClose, plantilla }: Props) {
    if (!isOpen || !plantilla) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-gray-50 dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-3xl m-4 h-[85vh] flex flex-col">
                {/* Encabezado Superior */}
                <div className="flex-none bg-white dark:bg-gray-800 px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center rounded-t-xl">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">
                        Previsualización (Vista Cliente)
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-full transition-colors text-gray-600 dark:text-gray-300"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Contenido (Formulario) */}
                <div className="flex-1 overflow-y-auto p-4 md:p-8">
                    <div className="max-w-2xl mx-auto space-y-6">
                        {/* Cabecera del Formulario */}
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border-t-8 border-t-emerald-500 p-6 md:p-8">
                            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                                {plantilla.nombre}
                            </h1>
                            {plantilla.descripcion && (
                                <p className="text-gray-600 dark:text-gray-300 text-sm md:text-base whitespace-pre-wrap">
                                    {plantilla.descripcion}
                                </p>
                            )}
                            <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 text-xs text-red-500 font-medium tracking-wide">
                                * Indica que la pregunta es obligatoria
                            </div>
                        </div>

                        {/* Preguntas */}
                        {plantilla.campos && plantilla.campos.length > 0 ? (
                            plantilla.campos.sort((a, b) => a.orden - b.orden).map((campo, idx) => (
                                <div key={idx} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 md:p-8">
                                    <div className="mb-4">
                                        <label className="text-base font-medium text-gray-900 dark:text-white flex gap-1">
                                            {campo.nombre}
                                            {campo.requerido && <span className="text-red-500">*</span>}
                                        </label>
                                    </div>

                                    {/* Renderizado de Inputs según Tipo */}
                                    <div className="mt-2 text-gray-800 dark:text-gray-200">
                                        {campo.tipo === 'texto_corto' && (
                                            <input
                                                type="text"
                                                disabled
                                                placeholder="Tu respuesta"
                                                className="w-full md:w-1/2 border-b border-gray-300 dark:border-gray-600 bg-transparent py-2 outline-none focus:border-emerald-500 disabled:opacity-70 disabled:cursor-not-allowed"
                                            />
                                        )}

                                        {campo.tipo === 'texto_largo' && (
                                            <textarea
                                                disabled
                                                placeholder="Tu respuesta"
                                                rows={3}
                                                className="w-full border-b border-gray-300 dark:border-gray-600 bg-transparent py-2 outline-none focus:border-emerald-500 resize-none disabled:opacity-70 disabled:cursor-not-allowed"
                                            />
                                        )}

                                        {campo.tipo === 'numero' && (
                                            <input
                                                type="number"
                                                disabled
                                                placeholder="Solo números"
                                                className="w-full md:w-1/3 border-b border-gray-300 dark:border-gray-600 bg-transparent py-2 outline-none focus:border-emerald-500 disabled:opacity-70 disabled:cursor-not-allowed"
                                            />
                                        )}

                                        {campo.tipo === 'fecha' && (
                                            <input
                                                type="date"
                                                disabled
                                                className="w-full md:w-1/3 border-b border-gray-300 dark:border-gray-600 bg-transparent py-2 outline-none focus:border-emerald-500 disabled:opacity-70 disabled:cursor-not-allowed"
                                            />
                                        )}

                                        {campo.tipo === 'opcion_multiple' && (
                                            <div className="space-y-3">
                                                {campo.opciones?.split(',').map((opt, i) => (
                                                    <label key={i} className="flex items-center gap-3 cursor-not-allowed opacity-80">
                                                        <Circle className="w-5 h-5 text-gray-300 dark:text-gray-600" />
                                                        <span className="text-sm">{opt.trim()}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        )}

                                        {campo.tipo === 'casillas' && (
                                            <div className="space-y-3">
                                                {campo.opciones?.split(',').map((opt, i) => (
                                                    <label key={i} className="flex items-center gap-3 cursor-not-allowed opacity-80">
                                                        <CheckSquare className="w-5 h-5 text-gray-300 dark:text-gray-600" />
                                                        <span className="text-sm">{opt.trim()}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-8 text-gray-500">
                                Esta ficha no tiene preguntas todavía.
                            </div>
                        )}

                        <div className="flex justify-between items-center py-4 text-sm text-gray-500">
                            <Button disabled className="bg-emerald-600 opacity-50 text-white cursor-not-allowed px-8 rounded">
                                Enviar (Prueba)
                            </Button>
                            <span className="text-xs">Nunca envíes contraseñas a través de Fichas Técnicas.</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

