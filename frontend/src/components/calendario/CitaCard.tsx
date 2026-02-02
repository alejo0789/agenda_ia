'use client';

import { useMemo } from 'react';
import { Clock, User } from 'lucide-react';

interface Cliente {
    nombre: string;
    telefono: string | null;
}

interface Cita {
    id: number;
    cliente_id: number;
    cliente: Cliente;
    especialista_id: number;
    servicio_id: number;
    servicio: string;
    hora_inicio: string;
    hora_fin: string;
    duracion: number;
    estado: string;
    notas: string | null;
}

interface CitaCardProps {
    cita: Cita;
    onClick: () => void;
    color: string;
}

const estadoConfig: Record<string, { color: string; bgColor: string; label: string; icon: string }> = {
    agendada: {
        color: 'text-blue-700 dark:text-blue-300',
        bgColor: 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-700',
        label: 'Agendada',
        icon: '●'
    },
    confirmada: {
        color: 'text-green-700 dark:text-green-300',
        bgColor: 'bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-700',
        label: 'Confirmada',
        icon: '●'
    },
    cliente_llego: {
        color: 'text-orange-700 dark:text-orange-300',
        bgColor: 'bg-orange-50 dark:bg-orange-900/30 border-orange-200 dark:border-orange-700',
        label: 'Cliente llegó',
        icon: '●'
    },
    completada: {
        color: 'text-emerald-700 dark:text-emerald-300',
        bgColor: 'bg-emerald-50 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-700',
        label: 'Completada',
        icon: '✓'
    },
    cancelada: {
        color: 'text-red-700 dark:text-red-300',
        bgColor: 'bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-700',
        label: 'Cancelada',
        icon: '✕'
    },
    no_show: {
        color: 'text-gray-700 dark:text-gray-300',
        bgColor: 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700',
        label: 'No show',
        icon: '⊗'
    },
};

export function CitaCard({ cita, onClick, color }: CitaCardProps) {
    const config = estadoConfig[cita.estado] || estadoConfig.agendada;

    const isCompact = cita.duracion <= 30;

    return (
        <div
            onClick={(e) => {
                e.stopPropagation();
                onClick();
            }}
            className={`
        h-full w-full rounded-lg border-l-4 cursor-pointer overflow-hidden
        ${config.bgColor}
        hover:shadow-lg hover:scale-[1.02] transition-all duration-200
        group
      `}
            style={{ borderLeftColor: color }}
        >
            <div className={`p-2 h-full flex flex-col ${isCompact ? 'gap-0' : 'gap-1'}`}>
                {/* Nombre del Cliente */}
                <div className="flex items-center gap-1">
                    <User className="w-3 h-3 text-gray-500 dark:text-gray-400 flex-shrink-0" />
                    <span className="font-medium text-gray-900 dark:text-white text-xs truncate">
                        {cita.cliente.nombre}
                    </span>
                </div>

                {/* Servicio - oculto en citas muy cortas */}
                {!isCompact && (
                    <p className="text-xs text-gray-600 dark:text-gray-300 truncate">
                        {cita.servicio}
                    </p>
                )}

                {/* Hora y Duración - oculto en citas muy cortas */}
                {!isCompact && (
                    <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                        <Clock className="w-3 h-3" />
                        <span>{cita.duracion} min</span>
                    </div>
                )}

                {/* Estado - siempre visible */}
                <div className={`flex items-center gap-1 mt-auto ${config.color}`}>
                    <span className="text-xs">{config.icon}</span>
                    <span className="text-xs font-medium">{config.label}</span>
                </div>
            </div>

            {/* Overlay on hover */}
            <div className="absolute inset-0 bg-black/5 dark:bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none rounded-lg" />
        </div>
    );
}
