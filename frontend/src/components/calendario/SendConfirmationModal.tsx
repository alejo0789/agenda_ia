import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { X, Send, Loader2, FileText, CheckSquare2, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { citasApi } from '@/lib/api/citas';
import { fichasApi, PlantillaFicha, CitaFicha } from '@/lib/api/fichas';
import { toast } from 'sonner';

interface CitaGenerada {
    id: number;
    cliente: {
        nombre: string;
        telefono?: string | null;
    };
    fecha: string;
    hora_inicio: string;
}

interface SendConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    cita: CitaGenerada | null;
    customMessage?: string;
    title?: React.ReactNode;
    onSuccess?: () => void;
    /** 
     * Si es true, muestra la sección de selección de fichas técnicas.
     * Esto se usa al crear una cita nueva. Por defecto false.
     */
    showFichasSelector?: boolean;
}

type Step = 'compose' | 'sending_confirmacion' | 'sending_fichas' | 'done';

export function SendConfirmationModal({
    isOpen,
    onClose,
    cita,
    customMessage,
    title,
    onSuccess,
    showFichasSelector = false,
}: SendConfirmationModalProps) {
    const [message, setMessage] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [step, setStep] = useState<Step>('compose');

    // Fichas técnicas
    const [plantillas, setPlantillas] = useState<PlantillaFicha[]>([]);
    const [fichasSeleccionadas, setFichasSeleccionadas] = useState<number[]>([]);
    const [loadingPlantillas, setLoadingPlantillas] = useState(false);

    // Generar mensaje inicial
    useEffect(() => {
        if (isOpen && cita) {
            if (customMessage) {
                setMessage(customMessage);
            } else {
                const parsedDate = new Date(`${cita.fecha}T12:00:00`);
                const fechaFormateada = format(parsedDate, "EEEE d 'de' MMMM - yyyy", { locale: es });

                const [hourStr, minuteStr] = cita.hora_inicio.split(':');
                let hour = parseInt(hourStr, 10);
                const ampm = hour >= 12 ? 'PM' : 'AM';
                hour = hour % 12;
                hour = hour ? hour : 12;
                const horaFormateada = `${String(hour).padStart(2, '0')}:${minuteStr} ${ampm}`;

                const defaultMsg = `Hola ${cita.cliente.nombre}, te escribimos de Centro de Experiencia Large sas. Tu reserva ha sido agendada para el día: 🗓️ ${fechaFormateada.charAt(0).toUpperCase() + fechaFormateada.slice(1)} ⏰ Hora: ${horaFormateada} 📍 Sede CALI – Chipichape.`;
                setMessage(defaultMsg);
            }

            // Cargar plantillas si se requiere selector
            if (showFichasSelector) {
                setLoadingPlantillas(true);
                fichasApi.getPlantillas(true)
                    .then(data => setPlantillas(data || []))
                    .catch(e => console.error('Error cargando plantillas:', e))
                    .finally(() => setLoadingPlantillas(false));
            }
        }
    }, [isOpen, cita, customMessage, showFichasSelector]);

    if (!isOpen || !cita) return null;

    const toggleFicha = (id: number) => {
        setFichasSeleccionadas(prev =>
            prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]
        );
    };

    const getFinalPhone = () => {
        const phoneDigits = (cita.cliente.telefono || '').replace(/\D/g, '');
        return phoneDigits.length === 10 ? `57${phoneDigits}` : phoneDigits;
    };

    const handleSend = async () => {
        if (!cita.cliente.telefono) {
            toast.error('El cliente no tiene un número de teléfono registrado');
            return;
        }

        const finalPhone = getFinalPhone();
        setIsSending(true);

        try {
            // --- PASO 1: Enviar mensaje de confirmación ---
            setStep('sending_confirmacion');
            await citasApi.enviarNotificacion({
                phone: finalPhone,
                name: cita.cliente.nombre,
                message: message,
            });
            toast.success('✅ Confirmación enviada correctamente');

            // --- PASO 2: Enviar fichas técnicas seleccionadas (si las hay) ---
            if (fichasSeleccionadas.length > 0) {
                setStep('sending_fichas');

                for (const plantillaId of fichasSeleccionadas) {
                    try {
                        // Vincular la ficha a la cita (crea token único)
                        const citaFicha: CitaFicha = await fichasApi.vincularFicha(cita.id, plantillaId);
                        const plantilla = plantillas.find(p => p.id === plantillaId);
                        const nombreFicha = plantilla?.nombre || 'Ficha Técnica';

                        const urlFicha = `${window.location.origin}/fichas/${citaFicha.token_publico}`;
                        const mensajeFicha = `Hola ${cita.cliente.nombre.split(' ')[0]} 👋, también te enviamos la *${nombreFicha}* para que la diligencies antes de tu cita.\n\nCompleta el formulario aquí 👇\n${urlFicha}\n\n¡Muchas gracias!`;

                        await citasApi.enviarNotificacion({
                            phone: finalPhone,
                            name: cita.cliente.nombre,
                            message: mensajeFicha,
                        });

                        // Marcar como enviada en el backend
                        await fichasApi.marcarComoEnviada(citaFicha.id);

                        toast.success(`📄 Ficha "${nombreFicha}" enviada`);
                    } catch (err) {
                        console.error(`Error enviando ficha ${plantillaId}:`, err);
                        toast.error(`Error al enviar una de las fichas técnicas`);
                    }
                }
            }

            setStep('done');
            if (onSuccess) onSuccess();
            onClose();
        } catch (error) {
            console.error('Error enviando mensaje:', error);
            toast.error('Ocurrió un error al enviar el mensaje de confirmación');
            setStep('compose');
        } finally {
            setIsSending(false);
        }
    };

    const getSendingLabel = () => {
        switch (step) {
            case 'sending_confirmacion': return 'Enviando confirmación...';
            case 'sending_fichas': return 'Enviando fichas...';
            default: return 'Enviando...';
        }
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={!isSending ? onClose : undefined} />

            {/* Modal */}
            <div className="relative bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-lg m-4 overflow-hidden max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="flex-none bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-4 flex items-center justify-between">
                    <h2 className="text-xl font-bold text-white flex gap-2 items-center">
                        <Send className="w-5 h-5" />
                        {title || 'Enviar Confirmación'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-1 rounded-full hover:bg-white/20 transition-colors text-white"
                        disabled={isSending}
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-6 space-y-5">
                    {/* Destinatario */}
                    <div className="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-800 dark:text-emerald-200 p-3 rounded-lg text-sm border border-emerald-100 dark:border-emerald-800">
                        <p className="font-semibold">Destinatario:</p>
                        <p>{cita.cliente.nombre} ({cita.cliente.telefono || 'Sin teléfono'})</p>
                    </div>

                    {/* Mensaje */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            📩 Mensaje de confirmación (puedes editarlo):
                        </label>
                        <textarea
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            rows={5}
                            disabled={isSending}
                            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 resize-none text-sm disabled:opacity-60"
                        />
                    </div>

                    {/* Selector de Fichas Técnicas */}
                    {showFichasSelector && (
                        <div className="space-y-3 border-t border-gray-100 dark:border-gray-700 pt-5">
                            <div className="flex items-center gap-2">
                                <FileText className="w-4 h-4 text-emerald-600" />
                                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                                    Enviar también Fichas Técnicas (opcional)
                                </label>
                            </div>
                            <p className="text-xs text-gray-400 dark:text-gray-500">
                                Selecciona las fichas que el cliente deberá llenar. Se enviarán como mensajes adicionales de WhatsApp.
                            </p>

                            {loadingPlantillas ? (
                                <div className="flex items-center gap-2 text-gray-400 py-2">
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    <span className="text-sm">Cargando plantillas...</span>
                                </div>
                            ) : plantillas.length === 0 ? (
                                <p className="text-sm text-gray-400 italic py-2">No hay fichas técnicas activas disponibles.</p>
                            ) : (
                                <div className="grid gap-2">
                                    {plantillas.map(p => {
                                        const selected = fichasSeleccionadas.includes(p.id);
                                        return (
                                            <button
                                                key={p.id}
                                                type="button"
                                                disabled={isSending}
                                                onClick={() => toggleFicha(p.id)}
                                                className={`flex items-center gap-3 w-full p-3 rounded-lg border text-left transition-all
                                                    ${selected
                                                        ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 dark:border-emerald-600'
                                                        : 'border-gray-200 dark:border-gray-700 hover:border-emerald-300 dark:hover:border-emerald-700 bg-white dark:bg-gray-800'
                                                    } disabled:opacity-60`}
                                            >
                                                {selected
                                                    ? <CheckSquare2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                                                    : <Square className="w-5 h-5 text-gray-400 flex-shrink-0" />
                                                }
                                                <div>
                                                    <p className={`text-sm font-medium ${selected ? 'text-emerald-700 dark:text-emerald-300' : 'text-gray-800 dark:text-gray-200'}`}>
                                                        {p.nombre}
                                                    </p>
                                                    {p.descripcion && (
                                                        <p className="text-xs text-gray-400 dark:text-gray-500 leading-tight mt-0.5 line-clamp-1">
                                                            {p.descripcion}
                                                        </p>
                                                    )}
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            )}

                            {fichasSeleccionadas.length > 0 && (
                                <div className="text-xs text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg p-3">
                                    Se enviarán <strong>{fichasSeleccionadas.length}</strong> mensaje(s) adicional(es) con las fichas seleccionadas.
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex-none px-6 py-4 border-t border-gray-200 dark:border-gray-800 flex justify-end gap-3 bg-gray-50 dark:bg-gray-900/50">
                    <Button variant="outline" onClick={onClose} disabled={isSending}>
                        Omitir
                    </Button>
                    <Button
                        onClick={handleSend}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white"
                        disabled={isSending || !message.trim()}
                    >
                        {isSending ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                {getSendingLabel()}
                            </>
                        ) : (
                            <>
                                <Send className="w-4 h-4 mr-2" />
                                Enviar {fichasSeleccionadas.length > 0 ? `(1 + ${fichasSeleccionadas.length} fichas)` : 'Mensaje'}
                            </>
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
}
