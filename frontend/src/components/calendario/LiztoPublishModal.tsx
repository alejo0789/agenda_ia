import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { X, Send, AlertTriangle } from 'lucide-react';
import { liztoApi } from '@/lib/api/lizto';
import { Cita } from '@/lib/api/citas';

interface LiztoPublishModalProps {
    isOpen: boolean;
    onClose: () => void;
    cita: Cita;
    onSuccess: (lizto_reservation_id: string) => void;
}

export function LiztoPublishModal({ isOpen, onClose, cita, onSuccess }: LiztoPublishModalProps) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (!isOpen || !cita) return null;

    const handleConfirm = async () => {
        try {
            setLoading(true);
            setError(null);
            const result = await liztoApi.publicarCita(cita.id);
            if (result.success && result.lizto_reservation_id) {
                onSuccess(result.lizto_reservation_id);
                onClose();
            } else {
                setError("Error desconocido al publicar.");
            }
        } catch (err: any) {
            setError(err.response?.data?.detail || err.message || "Error al intentar publicar la cita.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md overflow-hidden">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-900/50">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                        <Send className="w-5 h-5 text-[#2CC149]" />
                        Publicar en Lizto
                    </h3>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-5">
                    <div className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                        Revisa los datos antes de enviar. Asegúrate de que el especialista y servicio estén mapeados correctamente.
                    </div>
                    
                    <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg space-y-2 mb-4 text-sm border border-gray-100 dark:border-gray-700">
                        <div className="flex justify-between">
                            <span className="text-gray-500 dark:text-gray-400">Cliente:</span>
                            <span className="font-medium text-gray-900 dark:text-white">{cita.cliente?.nombre} {cita.cliente?.apellido || ''}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500 dark:text-gray-400">Especialista:</span>
                            <span className="font-medium text-gray-900 dark:text-white">{cita.especialista?.nombre}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500 dark:text-gray-400">Servicio:</span>
                            <span className="font-medium text-gray-900 dark:text-white">{cita.servicio?.nombre}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500 dark:text-gray-400">Hora:</span>
                            <span className="font-medium text-gray-900 dark:text-white">{cita.hora_inicio} - {cita.hora_fin}</span>
                        </div>
                    </div>

                    {error && (
                        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-sm rounded-lg border border-red-200 dark:border-red-800 flex items-start gap-2">
                            <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                            <p>{error}</p>
                        </div>
                    )}
                </div>

                <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3 bg-gray-50 dark:bg-gray-900/50">
                    <Button variant="outline" onClick={onClose} disabled={loading}>
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleConfirm}
                        disabled={loading}
                        className="bg-[#2CC149] hover:bg-[#25A13D] text-white"
                    >
                        {loading ? 'Publicando...' : 'Publicar'}
                    </Button>
                </div>
            </div>
        </div>
    );
}
