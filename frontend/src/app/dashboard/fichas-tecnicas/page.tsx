'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit2, Archive, Trash2, CheckCircle2, Eye, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { fichasApi, PlantillaFicha } from '@/lib/api/fichas';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { CreadorPlantillaModal } from '@/components/fichas/CreadorPlantillaModal';
import { PrevisualizarFichaModal } from '@/components/fichas/PrevisualizarFichaModal';

export default function FichasTecnicasPage() {
    const [plantillas, setPlantillas] = useState<PlantillaFicha[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
    const [selectedPlantilla, setSelectedPlantilla] = useState<PlantillaFicha | undefined>(undefined);

    const loadPlantillas = async () => {
        setIsLoading(true);
        try {
            const data = await fichasApi.getPlantillas();
            setPlantillas(data);
        } catch (error) {
            console.error('Error cargando plantillas:', error);
            toast.error('Ocurrió un error al cargar las fichas técnicas');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadPlantillas();
    }, []);

    const handleCreateNuevo = () => {
        setSelectedPlantilla(undefined);
        setIsCreateModalOpen(true);
    };

    const handleEdit = (plantilla: PlantillaFicha) => {
        setSelectedPlantilla(plantilla);
        setIsCreateModalOpen(true);
    };

    const handlePreview = (plantilla: PlantillaFicha) => {
        setSelectedPlantilla(plantilla);
        setIsPreviewModalOpen(true);
    };

    return (
        <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                        Fichas Técnicas
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400">
                        Crea y administra los formularios de evaluación para tus clientes.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <Button onClick={handleCreateNuevo} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                        <Plus className="w-5 h-5 mr-2" />
                        Crear Ficha Técnica
                    </Button>
                </div>
            </div>

            {/* Content List */}
            {isLoading ? (
                <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
                </div>
            ) : plantillas.length === 0 ? (
                <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                    <div className="mx-auto w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 rounded-full flex items-center justify-center mb-4">
                        <Plus className="w-8 h-8" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">Aún no hay fichas</h3>
                    <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto">
                        Comienza a crear el modelo de cuestionario para tus diferentes servicios. (Ej. Alisados, Pestañas, etc).
                    </p>
                    <Button onClick={handleCreateNuevo} variant="outline" className="border-emerald-200 text-emerald-700 hover:bg-emerald-50">
                        Crear mi primera ficha
                    </Button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {plantillas.map((plantilla) => (
                        <div
                            key={plantilla.id}
                            className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden flex flex-col justify-between"
                        >
                            <div className="p-5">
                                <div className="flex justify-between items-start mb-3">
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white line-clamp-1" title={plantilla.nombre}>
                                        {plantilla.nombre}
                                    </h3>
                                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${plantilla.activa ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'}`}>
                                        {plantilla.activa ? 'Activa' : 'Inactiva'}
                                    </span>
                                </div>

                                {plantilla.descripcion && (
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 line-clamp-2">
                                        {plantilla.descripcion}
                                    </p>
                                )}

                                <div className="space-y-2 mt-4 text-sm">
                                    <div className="flex justify-between text-gray-600 dark:text-gray-400">
                                        <span>Campos:</span>
                                        <span className="font-semibold text-gray-900 dark:text-white">{plantilla.campos ? plantilla.campos.length : 0} preguntas</span>
                                    </div>
                                    <div className="flex justify-between text-gray-600 dark:text-gray-400">
                                        <span>Creado:</span>
                                        <span>{format(new Date(plantilla.fecha_creacion), "d MMM yyyy", { locale: es })}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-gray-50 dark:bg-gray-900/50 px-5 py-3 border-t border-gray-100 dark:border-gray-800 flex justify-end gap-2">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handlePreview(plantilla)}
                                    className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                                >
                                    <Eye className="w-4 h-4 mr-2" />
                                    Ver Cliente
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleEdit(plantilla)}
                                    className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
                                >
                                    <Edit2 className="w-4 h-4" />
                                    Editar
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal de Creación / Edición */}
            {isCreateModalOpen && (
                <CreadorPlantillaModal
                    isOpen={isCreateModalOpen}
                    onClose={() => setIsCreateModalOpen(false)}
                    initialData={selectedPlantilla}
                    onSuccess={() => {
                        setIsCreateModalOpen(false);
                        loadPlantillas();
                    }}
                />
            )}

            {/* Modal de Previsualización */}
            {isPreviewModalOpen && (
                <PrevisualizarFichaModal
                    isOpen={isPreviewModalOpen}
                    onClose={() => setIsPreviewModalOpen(false)}
                    plantilla={selectedPlantilla || null}
                />
            )}
        </div>
    );
}
