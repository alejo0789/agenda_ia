'use client';

import { cn } from '@/lib/utils';

interface ClienteAvatarProps {
    nombre: string;
    apellido?: string | null;
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}

const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-14 h-14 text-lg',
};

// Función para obtener las iniciales
function getInitials(nombre: string, apellido?: string | null): string {
    const inicialNombre = nombre.charAt(0).toUpperCase();
    const inicialApellido = apellido ? apellido.charAt(0).toUpperCase() : '';
    return `${inicialNombre}${inicialApellido}`;
}

// Función para generar un color consistente basado en el nombre
function getAvatarColor(nombre: string): string {
    const colors = [
        'from-purple-500 to-pink-500',
        'from-blue-500 to-cyan-500',
        'from-green-500 to-emerald-500',
        'from-orange-500 to-amber-500',
        'from-rose-500 to-red-500',
        'from-indigo-500 to-purple-500',
        'from-teal-500 to-green-500',
        'from-fuchsia-500 to-pink-500',
    ];

    // Generar un índice basado en el nombre
    let hash = 0;
    for (let i = 0; i < nombre.length; i++) {
        hash = nombre.charCodeAt(i) + ((hash << 5) - hash);
    }

    return colors[Math.abs(hash) % colors.length];
}

export default function ClienteAvatar({
    nombre,
    apellido,
    size = 'md',
    className
}: ClienteAvatarProps) {
    const initials = getInitials(nombre, apellido);
    const colorClass = getAvatarColor(nombre);

    return (
        <div
            className={cn(
                'rounded-full flex items-center justify-center font-semibold text-white bg-gradient-to-br shadow-md',
                colorClass,
                sizeClasses[size],
                className
            )}
        >
            {initials}
        </div>
    );
}
