'use client';

import { cn } from '@/lib/utils';
import { CheckCircle, XCircle } from 'lucide-react';

interface ClienteEstadoBadgeProps {
    estado: 'activo' | 'inactivo';
    showIcon?: boolean;
    className?: string;
}

export default function ClienteEstadoBadge({
    estado,
    showIcon = true,
    className
}: ClienteEstadoBadgeProps) {
    const isActivo = estado === 'activo';

    return (
        <span
            className={cn(
                'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all',
                isActivo
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                    : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
                className
            )}
        >
            {showIcon && (
                isActivo
                    ? <CheckCircle className="w-3 h-3" />
                    : <XCircle className="w-3 h-3" />
            )}
            {isActivo ? 'Activo' : 'Inactivo'}
        </span>
    );
}
