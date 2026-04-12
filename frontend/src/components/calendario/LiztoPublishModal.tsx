import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { X, Send, AlertTriangle, Link2, Loader2 } from 'lucide-react';
import { liztoApi, EspecialistaMappingData, ServicioMappingData } from '@/lib/api/lizto';
import { Cita } from '@/lib/api/citas';

interface LiztoPublishModalProps {
    isOpen: boolean;
    onClose: () => void;
    cita: Cita;
    onSuccess: (lizto_reservation_id: string) => void;
}

export function LiztoPublishModal({ isOpen, onClose, cita, onSuccess }: LiztoPublishModalProps) {
    const [loading, setLoading] = useState(false);
    const [loadingMappings, setLoadingMappings] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [mappedStaff, setMappedStaff] = useState<EspecialistaMappingData | null>(null);
    const [mappedService, setMappedService] = useState<ServicioMappingData | null>(null);

    useEffect(() => {
        if (isOpen && cita) {
            cargarMapeos();
        }
    }, [isOpen, cita]);

    const cargarMapeos = async () => {
        setLoadingMappings(true);
        try {
            const [staffMaps, serviceMaps] = await Promise.all([
                liztoApi.listarMappingEspecialistas(),
                liztoApi.listarMappingServicios()
            ]);
            
            const staff = staffMaps.find(m => m.especialista_id === cita.especialista_id);
            const service = serviceMaps.find(m => m.servicio_id === cita.servicio_id);
            
            setMappedStaff(staff || null);
            setMappedService(service || null);
        } catch (err) {
            console.error("Error cargando mapeos", err);
        } finally {
            setLoadingMappings(false);
        }
    };

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
                        Confirma los datos antes de publicar. El sistema vinculará esta cita con el staff y servicio mapeados de Lizto.
                    </div>
                    
                    <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg space-y-4 mb-4 text-sm border border-gray-100 dark:border-gray-700">
                        {/* Info General */}
                        <div className="space-y-2">
                            <div className="flex justify-between">
                                <span className="text-gray-500 dark:text-gray-400">Cita SIAgenda:</span>
                                <span className="font-medium text-gray-900 dark:text-white">#{cita.id}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500 dark:text-gray-400">Cliente:</span>
                                <span className="font-medium text-gray-900 dark:text-white">{cita.cliente?.nombre} {cita.cliente?.apellido || ''}</span>
                            </div>
                        </div>

                        {/* Mapeo de Especialista */}
                        <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                            <div className="flex items-center gap-2 mb-1 text-purple-600 dark:text-purple-400 font-semibold">
                                <Link2 className="w-4 h-4" />
                                <span>Especialista Mapeado</span>
                            </div>
                            <div className="flex justify-between pl-6">
                                <span className="text-gray-500 dark:text-gray-400">En SIAgenda:</span>
                                <span>{cita.especialista?.nombre || (cita as any).especialista_nombre || 'No asignado'}</span>
                            </div>
                            <div className="flex justify-between pl-6 mt-1">
                                <span className="text-gray-500 dark:text-gray-400">En Lizto:</span>
                                {loadingMappings ? (
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                ) : (
                                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                                        {mappedStaff?.lizto_staff_name || '❌ No mapeado'}
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Mapeo de Servicio */}
                        <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                            <div className="flex items-center gap-2 mb-1 text-purple-600 dark:text-purple-400 font-semibold">
                                <Link2 className="w-4 h-4" />
                                <span>Servicio Mapeado</span>
                            </div>
                            <div className="flex justify-between pl-6">
                                <span className="text-gray-500 dark:text-gray-400">En SIAgenda:</span>
                                <span>{cita.servicio?.nombre || (cita as any).servicio_nombre || (typeof cita.servicio === 'string' ? cita.servicio : 'No asignado')}</span>
                            </div>
                            <div className="flex justify-between pl-6 mt-1">
                                <span className="text-gray-500 dark:text-gray-400">En Lizto:</span>
                                {loadingMappings ? (
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                ) : (
                                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                                        {mappedService?.lizto_service_name || '✅ Servicio Detectado'}
                                    </span>
                                )}
                            </div>
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
