'use client';

import { useState } from 'react';
import EspecialistaTable from '@/components/especialistas/EspecialistaTable';
import HorariosModal from '@/components/especialistas/HorariosModal';
import BloqueosModal from '@/components/especialistas/BloqueosModal';
import ServiciosModal from '@/components/especialistas/ServiciosModal';
import { Especialista } from '@/types/especialista';
import { UserCircle } from 'lucide-react';

export default function EspecialistasPage() {
    const [selectedEspecialista, setSelectedEspecialista] = useState<Especialista | null>(null);
    const [showHorariosModal, setShowHorariosModal] = useState(false);
    const [showBloqueosModal, setShowBloqueosModal] = useState(false);
    const [showServiciosModal, setShowServiciosModal] = useState(false);

    const handleManageHorarios = (especialista: Especialista) => {
        setSelectedEspecialista(especialista);
        setShowHorariosModal(true);
    };

    const handleManageBloqueos = (especialista: Especialista) => {
        setSelectedEspecialista(especialista);
        setShowBloqueosModal(true);
    };

    const handleManageServicios = (especialista: Especialista) => {
        setSelectedEspecialista(especialista);
        setShowServiciosModal(true);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center shadow-lg">
                        <UserCircle className="w-7 h-7 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                            Especialistas
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400">
                            Gestiona los especialistas del salón
                        </p>
                    </div>
                </div>
            </div>

            {/* Table */}
            <EspecialistaTable
                onManageHorarios={handleManageHorarios}
                onManageBloqueos={handleManageBloqueos}
                onManageServicios={handleManageServicios}
            />

            {/* Modals */}
            {selectedEspecialista && (
                <>
                    <HorariosModal
                        especialista={selectedEspecialista}
                        isOpen={showHorariosModal}
                        onClose={() => {
                            setShowHorariosModal(false);
                            setSelectedEspecialista(null);
                        }}
                    />
                    <BloqueosModal
                        especialista={selectedEspecialista}
                        isOpen={showBloqueosModal}
                        onClose={() => {
                            setShowBloqueosModal(false);
                            setSelectedEspecialista(null);
                        }}
                    />
                    <ServiciosModal
                        especialista={selectedEspecialista}
                        isOpen={showServiciosModal}
                        onClose={() => {
                            setShowServiciosModal(false);
                            setSelectedEspecialista(null);
                        }}
                    />
                </>
            )}
        </div>
    );
}
