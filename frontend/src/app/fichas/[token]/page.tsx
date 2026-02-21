'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { fichasApi } from '@/lib/api/fichas';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

export default function FichaPublicaPage() {
    const params = useParams();
    const token = params.token as string;

    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [formulario, setFormulario] = useState<any>(null);
    const [respuestas, setRespuestas] = useState<Record<number, string>>({});

    useEffect(() => {
        const loadForm = async () => {
            try {
                const data = await fichasApi.getFormularioPublico(token);
                setFormulario(data);

                // Si ya está diligenciada, podríamos mostrar un mensaje o dejar que la vea
                if (data.estado === 'diligenciada') {
                    // setIsSuccess(true); // Opcional: Bloquear si ya se llenó
                }
            } catch (err: any) {
                console.error(err);
                setError(err.response?.data?.detail || 'No se pudo cargar el formulario');
            } finally {
                setIsLoading(false);
            }
        };

        if (token) loadForm();
    }, [token]);

    const handleInputChange = (campoId: number, valor: string) => {
        setRespuestas(prev => ({
            ...prev,
            [campoId]: valor
        }));
    };

    const handleCheckboxChange = (campoId: number, opcion: string, checked: boolean) => {
        const currentVal = respuestas[campoId] || '';
        let options = currentVal ? currentVal.split(',').map(o => o.trim()) : [];

        if (checked) {
            if (!options.includes(opcion)) options.push(opcion);
        } else {
            options = options.filter(o => o !== opcion);
        }

        setRespuestas(prev => ({
            ...prev,
            [campoId]: options.join(', ')
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validación básica de requeridos
        const faltantes = formulario.plantilla.campos
            .filter((c: any) => c.requerido && !respuestas[c.id])
            .map((c: any) => c.nombre);

        if (faltantes.length > 0) {
            toast.error(`Por favor responde: ${faltantes[0]}`);
            return;
        }

        setIsSubmitting(true);
        try {
            const payload = Object.entries(respuestas).map(([id, val]) => ({
                campo_id: parseInt(id),
                valor: val
            }));

            await fichasApi.enviarRespuestasPublicas(token, payload);
            setIsSuccess(true);
            toast.success('Formulario enviado correctamente');
        } catch (err: any) {
            console.error(err);
            toast.error(err.response?.data?.detail || 'Error al enviar el formulario');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900">
                <Loader2 className="w-10 h-10 animate-spin text-emerald-600 mb-4" />
                <p className="text-gray-500 font-medium">Cargando formulario...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 p-4 font-sans">
                <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 text-center border-t-8 border-red-500">
                    <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">¡Ups! Algo salió mal</h1>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
                    <p className="text-sm text-gray-400">Si crees que esto es un error, por favor contacta con nosotros.</p>
                </div>
            </div>
        );
    }

    if (isSuccess) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 p-4 font-sans">
                <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 text-center border-t-8 border-emerald-500 animate-in fade-in zoom-in duration-500">
                    <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">¡Gracias!</h1>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">Hemos recibido tus respuestas correctamente. Tu ficha técnica ha sido actualizada.</p>
                    <p className="text-sm text-gray-400 italic">Ya puedes cerrar esta ventana.</p>
                </div>
            </div>
        );
    }

    const { plantilla } = formulario;

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 py-12 px-4 font-sans">
            <div className="max-w-3xl mx-auto space-y-8">
                {/* Logo / Header Branding */}
                <div className="text-center mb-8">
                    <h2 className="text-xl font-black text-gray-800 dark:text-gray-100 tracking-tighter">
                        CENTRO DE EXPERIENCIA <span className="text-emerald-600">LARGE</span>
                    </h2>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Plantilla Header */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border-t-8 border-emerald-600 p-8 overflow-hidden relative">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full -mr-16 -mt-16 pointer-events-none" />
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-3 tracking-tight">
                            {plantilla.nombre}
                        </h1>
                        {plantilla.descripcion && (
                            <p className="text-gray-600 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                                {plantilla.descripcion}
                            </p>
                        )}
                        <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-700">
                            <p className="text-xs text-red-500 font-semibold uppercase tracking-wider">* Indica que la pregunta es obligatoria</p>
                        </div>
                    </div>

                    {/* Campos */}
                    {plantilla.campos.sort((a: any, b: any) => a.orden - b.orden).map((campo: any) => (
                        <div key={campo.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-8 transition-all hover:shadow-md">
                            <label className="block text-lg font-semibold text-gray-900 dark:text-white mb-4 leading-snug">
                                {campo.nombre} {campo.requerido && <span className="text-red-500">*</span>}
                            </label>

                            <div className="mt-2">
                                {campo.tipo === 'texto_corto' && (
                                    <input
                                        type="text"
                                        required={campo.requerido}
                                        value={respuestas[campo.id] || ''}
                                        onChange={(e) => handleInputChange(campo.id, e.target.value)}
                                        placeholder="Tu respuesta"
                                        className="w-full md:w-2/3 border-b-2 border-gray-200 dark:border-gray-700 bg-transparent py-3 text-lg outline-none focus:border-emerald-500 transition-colors dark:text-white"
                                    />
                                )}

                                {campo.tipo === 'texto_largo' && (
                                    <textarea
                                        required={campo.requerido}
                                        value={respuestas[campo.id] || ''}
                                        onChange={(e) => handleInputChange(campo.id, e.target.value)}
                                        placeholder="Tu respuesta"
                                        rows={3}
                                        className="w-full border-b-2 border-gray-200 dark:border-gray-700 bg-transparent py-3 text-lg outline-none focus:border-emerald-500 transition-colors resize-none dark:text-white"
                                    />
                                )}

                                {campo.tipo === 'numero' && (
                                    <input
                                        type="number"
                                        required={campo.requerido}
                                        value={respuestas[campo.id] || ''}
                                        onChange={(e) => handleInputChange(campo.id, e.target.value)}
                                        placeholder="0"
                                        className="w-full md:w-1/3 border-b-2 border-gray-200 dark:border-gray-700 bg-transparent py-3 text-lg outline-none focus:border-emerald-500 transition-colors dark:text-white"
                                    />
                                )}

                                {campo.tipo === 'fecha' && (
                                    <input
                                        type="date"
                                        required={campo.requerido}
                                        value={respuestas[campo.id] || ''}
                                        onChange={(e) => handleInputChange(campo.id, e.target.value)}
                                        className="w-full md:w-1/3 border-b-2 border-gray-200 dark:border-gray-700 bg-transparent py-3 text-lg outline-none focus:border-emerald-500 transition-colors dark:text-white"
                                    />
                                )}

                                {campo.tipo === 'opcion_multiple' && (
                                    <div className="space-y-4 pt-2">
                                        {campo.opciones.map((opcion: string, i: number) => (
                                            <label key={i} className="flex items-center gap-4 cursor-pointer group">
                                                <div className="relative flex items-center justify-center">
                                                    <input
                                                        type="radio"
                                                        name={`campo-${campo.id}`}
                                                        required={campo.requerido}
                                                        checked={respuestas[campo.id] === opcion.trim()}
                                                        onChange={() => handleInputChange(campo.id, opcion.trim())}
                                                        className="peer appearance-none w-6 h-6 border-2 border-gray-300 dark:border-gray-600 rounded-full checked:border-emerald-500 transition-all"
                                                    />
                                                    <div className="absolute w-3 h-3 bg-emerald-500 rounded-full opacity-0 peer-checked:opacity-100 transition-all" />
                                                </div>
                                                <span className="text-gray-700 dark:text-gray-300 text-lg group-hover:text-emerald-600 transition-colors">
                                                    {opcion.trim()}
                                                </span>
                                            </label>
                                        ))}
                                    </div>
                                )}

                                {campo.tipo === 'casillas' && (
                                    <div className="space-y-4 pt-2">
                                        {campo.opciones.map((opcion: string, i: number) => (
                                            <label key={i} className="flex items-center gap-4 cursor-pointer group">
                                                <div className="relative flex items-center justify-center">
                                                    <input
                                                        type="checkbox"
                                                        checked={(respuestas[campo.id] || '').split(',').map(o => o.trim()).includes(opcion.trim())}
                                                        onChange={(e) => handleCheckboxChange(campo.id, opcion.trim(), e.target.checked)}
                                                        className="peer appearance-none w-6 h-6 border-2 border-gray-300 dark:border-gray-600 rounded-md checked:bg-emerald-500 checked:border-emerald-500 transition-all font-sans"
                                                    />
                                                    <svg className="absolute w-4 h-4 text-white opacity-0 peer-checked:opacity-100 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="4">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                    </svg>
                                                </div>
                                                <span className="text-gray-700 dark:text-gray-300 text-lg group-hover:text-emerald-600 transition-colors">
                                                    {opcion.trim()}
                                                </span>
                                            </label>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}

                    {/* Submit Button */}
                    <div className="flex flex-col items-center pt-8 gap-4">
                        <Button
                            type="submit"
                            disabled={isSubmitting}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xl py-8 px-12 rounded-2xl shadow-lg shadow-emerald-500/20 hover:scale-105 active:scale-95 transition-all w-full md:w-auto font-bold"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="w-6 h-6 mr-3 animate-spin" />
                                    Enviando respuestas...
                                </>
                            ) : (
                                'Enviar Formulario'
                            )}
                        </Button>
                        <p className="text-gray-400 text-sm">Large SAS © 2026 - Tu información está segura con nosotros.</p>
                    </div>
                </form>
            </div>
        </div>
    );
}
