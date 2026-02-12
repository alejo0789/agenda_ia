'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useEspecialistaStore } from '@/stores/especialistaStore';
import HorariosModal from '@/components/especialistas/HorariosModal';
import BloqueosModal from '@/components/especialistas/BloqueosModal';
import { Button } from '@/components/ui/button';
import { UserCircle, Calendar, Ban, Clock, Loader2 } from 'lucide-react';
import { Especialista } from '@/types/especialista';

export default function MiPerfilPage() {
    const { user } = useAuthStore();
    const { fetchEspecialista, selectedEspecialista: especialista, isLoading } = useEspecialistaStore();
    const [showHorariosModal, setShowHorariosModal] = useState(false);
    const [showBloqueosModal, setShowBloqueosModal] = useState(false);

    useEffect(() => {
        if (user?.especialista_id) {
            fetchEspecialista(user.especialista_id);
        }
    }, [user?.especialista_id, fetchEspecialista]);

    if (!user?.especialista_id) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center">
                    <UserCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        No tienes perfil de especialista
                    </h2>
                    <p className="text-gray-500 dark:text-gray-400">
                        Esta sección es solo para especialistas
                    </p>
                </div>
            </div>
        );
    }

    if (isLoading || !especialista) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
            </div>
        );
    }

    return (
        <div className="space-y-6 pb-20">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center shadow-lg">
                        <UserCircle className="w-7 h-7 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                            Mi Perfil
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400">
                            {especialista.nombre} {especialista.apellido}
                        </p>
                    </div>
                </div>
            </div>



            {/* Gestión de Horarios y Bloqueos */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Mis Horarios */}
                <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                    <div className="flex items-center space-x-3 mb-4">
                        <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center">
                            <Clock className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                                Mis Horarios
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                Gestiona tu disponibilidad
                            </p>
                        </div>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                        Configura los días y horarios en los que estás disponible para atender clientes.
                    </p>
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 mb-4">
                        <p className="text-xs text-yellow-800 dark:text-yellow-400">
                            ⚠️ Los cambios de horario deben hacerse con 24 horas de anticipación
                        </p>
                    </div>
                    <Button
                        onClick={() => setShowHorariosModal(true)}
                        className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                    >
                        <Calendar className="w-4 h-4 mr-2" />
                        Ver Mis Horarios
                    </Button>
                </div>

                {/* Mis Bloqueos */}
                <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                    <div className="flex items-center space-x-3 mb-4">
                        <div className="w-10 h-10 rounded-lg bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
                            <Ban className="w-5 h-5 text-red-600 dark:text-red-400" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                                Mis Bloqueos
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                Bloquea períodos específicos
                            </p>
                        </div>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                        Marca días u horarios en los que no estarás disponible (vacaciones, citas médicas, etc.).
                    </p>
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 mb-4">
                        <p className="text-xs text-yellow-800 dark:text-yellow-400">
                            ⚠️ Los bloqueos deben crearse con 24 horas de anticipación
                        </p>
                    </div>
                    <Button
                        onClick={() => setShowBloqueosModal(true)}
                        className="w-full bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700"
                    >
                        <Ban className="w-4 h-4 mr-2" />
                        Ver Mis Bloqueos
                    </Button>
                </div>
            </div>

            {/* Modals */}
            {especialista && (
                <>
                    <HorariosModal
                        especialista={especialista}
                        isOpen={showHorariosModal}
                        onClose={() => setShowHorariosModal(false)}
                        isEspecialistaView={true}
                    />
                    <BloqueosModal
                        especialista={especialista}
                        isOpen={showBloqueosModal}
                        onClose={() => setShowBloqueosModal(false)}
                        isEspecialistaView={true}
                    />
                </>
            )}
        </div>
    );
}
