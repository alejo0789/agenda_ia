'use client';

import { useState, useEffect } from 'react';
import { X, FileText, ExternalLink, Calendar as CalendarIcon, Loader2, CheckCircle2, Clock, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { fichasApi, CitaFicha, PlantillaFicha } from '@/lib/api/fichas';
import { SendConfirmationModal } from './SendConfirmationModal';
import { toast } from 'sonner';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    citaId: number;
    clienteNombre: string;
    clienteTelefono: string;
    fecha: string;
    horaInicio: string;
}

export function HistorialFichasCitaModal({ isOpen, onClose, citaId, clienteNombre, clienteTelefono, fecha, horaInicio }: Props) {
    const [isLoading, setIsLoading] = useState(true);
    const [fichas, setFichas] = useState<CitaFicha[]>([]);
    const [plantillas, setPlantillas] = useState<PlantillaFicha[]>([]);
    const [isLinking, setIsLinking] = useState(false);
    const [selectedPlantillaId, setSelectedPlantillaId] = useState<number | ''>('');
    const [selectedFichaToSend, setSelectedFichaToSend] = useState<CitaFicha | null>(null);

    const loadFichas = async () => {
        setIsLoading(true);
        try {
            const data = await fichasApi.getFichasPorCita(citaId);
            setFichas(data || []);
        } catch (error) {
            console.error('Error al cargar fichas técnicas:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (!isOpen) return;

        loadFichas();

        const loadPlantillas = async () => {
            try {
                const data = await fichasApi.getPlantillas(true);
                setPlantillas(data || []);
            } catch (error) {
                console.error('Error cargando plantillas:', error);
            }
        };

        loadPlantillas();
    }, [isOpen, citaId]);

    const handleVincularPlantilla = async () => {
        if (!selectedPlantillaId) return;

        setIsLinking(true);
        try {
            await fichasApi.vincularFicha(citaId, Number(selectedPlantillaId));
            toast.success("Ficha técnica vinculada a la cita. Ahora puedes enviarla.");
            setSelectedPlantillaId('');
            loadFichas();
        } catch (error: any) {
            console.error(error);
            toast.error(error?.response?.data?.detail || "No se pudo vincular la ficha.");
        } finally {
            setIsLinking(false);
        }
    };

    const handleCheckSent = async () => {
        if (!selectedFichaToSend) return;
        try {
            await fichasApi.marcarComoEnviada(selectedFichaToSend.id);
            loadFichas();
        } catch (e) {
            console.error("Error al marcar como enviada:", e);
        }
    };

    if (!isOpen) return null;

    const renderEstado = (estado: string) => {
        switch (estado) {
            case 'diligenciada':
                return (
                    <span className="flex items-center text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full text-xs font-medium border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3 mr-1" /> Diligenciada
                    </span>
                );
            case 'enviada':
                return (
                    <span className="flex items-center text-blue-600 bg-blue-50 px-2 py-1 rounded-full text-xs font-medium border border-blue-200">
                        <Send className="w-3 h-3 mr-1" /> Enviada
                    </span>
                );
            default:
                return (
                    <span className="flex items-center text-yellow-600 bg-yellow-50 px-2 py-1 rounded-full text-xs font-medium border border-yellow-200">
                        <Clock className="w-3 h-3 mr-1" /> Pendiente
                    </span>
                );
        }
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-2xl m-4 max-h-[85vh] flex flex-col">
                <div className="flex-none bg-emerald-600 dark:bg-emerald-800 px-6 py-4 flex items-center justify-between rounded-t-xl text-white">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <FileText className="w-5 h-5" />
                        Fichas Técnicas
                    </h2>
                    <button onClick={onClose} className="hover:bg-white/20 p-1.5 rounded-full transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 flex justify-between items-center">
                        <div>
                            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Cliente</h3>
                            <p className="text-lg font-semibold text-gray-900 dark:text-white">{clienteNombre}</p>
                        </div>
                        {fichas.length < 3 && (
                            <div className="flex flex-col sm:flex-row gap-2">
                                <select
                                    className="px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-md text-sm"
                                    value={selectedPlantillaId}
                                    onChange={(e) => setSelectedPlantillaId(e.target.value === '' ? '' : Number(e.target.value))}
                                >
                                    <option value="">Selecciona plantilla...</option>
                                    {plantillas.map(p => (
                                        <option key={p.id} value={p.id}>{p.nombre}</option>
                                    ))}
                                </select>
                                <Button
                                    size="sm"
                                    className="bg-emerald-600 hover:bg-emerald-700"
                                    onClick={handleVincularPlantilla}
                                    disabled={!selectedPlantillaId || isLinking}
                                >
                                    {isLinking ? <Loader2 className="w-4 h-4 animate-spin" /> : "Vincular Ficha"}
                                </Button>
                            </div>
                        )}
                    </div>

                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                            <Loader2 className="w-8 h-8 animate-spin text-emerald-500 mb-4" />
                            <p>Cargando fichas técnicas...</p>
                        </div>
                    ) : fichas.length === 0 ? (
                        <div className="text-center py-12 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl">
                            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                            <h3 className="text-gray-900 dark:text-white font-medium mb-1">Sin fichas técnicas</h3>
                            <p className="text-gray-500 dark:text-gray-400 text-sm">Esta cita no tiene fichas técnicas vinculadas aún.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {fichas.map((ficha) => (
                                <div key={ficha.id} className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:shadow-md transition-shadow bg-white dark:bg-gray-800 flex-wrap">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-1">
                                            <h4 className="font-semibold text-gray-900 dark:text-white text-base">
                                                {ficha.plantilla_nombre || `Ficha #${ficha.plantilla_id}`}
                                            </h4>
                                            {renderEstado(ficha.estado)}
                                        </div>
                                        <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
                                            {ficha.fecha_envio && (
                                                <div className="flex items-center gap-1">
                                                    <Send className="w-3 h-3" />
                                                    Enviado: {format(new Date(ficha.fecha_envio), "d MMM yyyy, h:mm a", { locale: es })}
                                                </div>
                                            )}
                                            {ficha.fecha_diligenciamiento && (
                                                <div className="flex items-center gap-1">
                                                    <CheckCircle2 className="w-3 h-3" />
                                                    Completado: {format(new Date(ficha.fecha_diligenciamiento), "d MMM yyyy, h:mm a", { locale: es })}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex gap-2 flex-wrap justify-end mt-3 sm:mt-0">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="text-emerald-600 border-emerald-200 hover:bg-emerald-50 whitespace-nowrap"
                                            onClick={() => {
                                                const url = `${window.location.origin}/fichas/${ficha.token_publico}`;
                                                navigator.clipboard.writeText(url);
                                                toast.success("Enlace copiado al portapapeles");
                                            }}
                                        >
                                            <ExternalLink className="w-4 h-4 mr-2" />
                                            Copiar Enlace
                                        </Button>

                                        <Button
                                            variant="default"
                                            size="sm"
                                            className="bg-purple-600 hover:bg-purple-700 text-white whitespace-nowrap"
                                            onClick={() => setSelectedFichaToSend(ficha)}
                                        >
                                            <Send className="w-4 h-4 mr-2" />
                                            Enviar WA
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Modal para enviar Notificación */}
            {selectedFichaToSend && (
                <SendConfirmationModal
                    isOpen={!!selectedFichaToSend}
                    onClose={() => {
                        setSelectedFichaToSend(null);
                    }}
                    onSuccess={handleCheckSent}
                    title="Enviar Ficha al Cliente"
                    cita={{
                        id: citaId,
                        cliente: {
                            nombre: clienteNombre,
                            telefono: clienteTelefono
                        },
                        fecha: fecha,
                        hora_inicio: horaInicio
                    }}
                    customMessage={`Hola ${clienteNombre?.split(" ")[0]}, te enviamos la ficha técnica para que por favor la diligencies antes de tu cita.\n\nCompleta el formulario aquí: ${window.location.origin}/fichas/${selectedFichaToSend.token_publico}\n\n¡Te esperamos!`}
                />
            )}
        </div>
    );
}
