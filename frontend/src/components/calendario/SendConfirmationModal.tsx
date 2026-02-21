import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { X, Send, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { citasApi } from '@/lib/api/citas';
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
}

export function SendConfirmationModal({ isOpen, onClose, cita }: SendConfirmationModalProps) {
    const [message, setMessage] = useState('');
    const [isSending, setIsSending] = useState(false);

    useEffect(() => {
        if (isOpen && cita) {
            // Generar el mensaje por defecto
            const parsedDate = new Date(`${cita.fecha}T12:00:00`); // Evitar desfase de zona horaria
            const fechaFormateada = format(parsedDate, "EEEE d 'de' MMMM - yyyy", { locale: es });

            // Convertir hora_inicio (HH:mm) a formato 12 horas (hh:mm A)
            const [hourStr, minuteStr] = cita.hora_inicio.split(':');
            let hour = parseInt(hourStr, 10);
            const ampm = hour >= 12 ? 'PM' : 'AM';
            hour = hour % 12;
            hour = hour ? hour : 12; // 0 debe ser 12
            const horaFormateada = `${String(hour).padStart(2, '0')}:${minuteStr} ${ampm}`;

            const phoneDigits = cita.cliente.telefono?.replace(/\D/g, '') || '';
            const isColombian = phoneDigits.startsWith('57') || phoneDigits.length === 10;
            const finalPhone = phoneDigits.length === 10 ? `57${phoneDigits}` : phoneDigits;


            const defaultMsg = `Hola ${cita.cliente.nombre}, te escribimos de Centro de Experiencia Large sas. Tu reserva ha sido agendada para el día: 🗓️ ${fechaFormateada.charAt(0).toUpperCase() + fechaFormateada.slice(1)} ⏰ Hora: ${horaFormateada} 📍 Sede CALI – Chipichape.`;

            setMessage(defaultMsg);
        }
    }, [isOpen, cita]);

    if (!isOpen || !cita) return null;

    const handleSend = async () => {
        if (!cita.cliente.telefono) {
            toast.error('El cliente no tiene un número de teléfono registrado');
            return;
        }

        const phoneDigits = cita.cliente.telefono.replace(/\D/g, '');
        // Asumimos prefijo 57 si tiene 10 dígitos (Colombia)
        const finalPhone = phoneDigits.length === 10 ? `57${phoneDigits}` : phoneDigits;

        setIsSending(true);
        try {
            await citasApi.enviarNotificacion({
                phone: finalPhone,
                name: cita.cliente.nombre,
                message: message,
            });
            toast.success('Mensaje de confirmación enviado correctamente');
            onClose();
        } catch (error) {
            console.error('Error enviando mensaje:', error);
            toast.error('Ocurrió un error al enviar el mensaje');
        } finally {
            setIsSending(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

            {/* Modal */}
            <div className="relative bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-lg m-4 overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-4 flex items-center justify-between">
                    <h2 className="text-xl font-bold text-white flex gap-2 items-center">
                        <Send className="w-5 h-5" />
                        Enviar Confirmación
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-1 rounded-full hover:bg-white/20 transition-colors text-white"
                        disabled={isSending}
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 space-y-4">
                    <div className="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-800 dark:text-emerald-200 p-3 rounded-lg text-sm border border-emerald-100 dark:border-emerald-800">
                        <p className="font-semibold">Destinatario:</p>
                        <p>{cita.cliente.nombre} ({cita.cliente.telefono || 'Sin teléfono'})</p>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Mensaje a enviar (puedes editarlo):
                        </label>
                        <textarea
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            rows={6}
                            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 resize-none text-sm"
                        />
                    </div>
                </div>

                <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-800 flex justify-end gap-3 bg-gray-50 dark:bg-gray-900/50">
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
                                Enviando...
                            </>
                        ) : (
                            <>
                                <Send className="w-4 h-4 mr-2" />
                                Enviar Mensaje
                            </>
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
}
