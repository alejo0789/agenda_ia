'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { Search, ChevronDown, Check, User } from 'lucide-react';
import type { Especialista } from '@/types/especialista';

interface EspecialistaSelectorProps {
    especialistas: Especialista[];
    value: number | null;
    onChange: (id: number) => void;
    placeholder?: string;
    disabled?: boolean;
    className?: string;
}

// Función para generar iniciales
function getInitials(nombre: string, apellido?: string): string {
    const first = nombre?.charAt(0)?.toUpperCase() || '';
    const last = apellido?.charAt(0)?.toUpperCase() || '';
    return first + last || '?';
}

// Función para generar color basado en el nombre (consistente)
function getColorFromName(nombre: string): string {
    const colors = [
        '#8B5CF6', // violet
        '#EC4899', // pink
        '#F97316', // orange
        '#10B981', // emerald
        '#3B82F6', // blue
        '#14B8A6', // teal
        '#F59E0B', // amber
        '#EF4444', // red
        '#6366F1', // indigo
        '#84CC16', // lime
    ];

    let hash = 0;
    for (let i = 0; i < nombre.length; i++) {
        hash = nombre.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
}

export default function EspecialistaSelector({
    especialistas,
    value,
    onChange,
    placeholder = 'Seleccionar especialista...',
    disabled = false,
    className = ''
}: EspecialistaSelectorProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const containerRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);

    const selected = especialistas.find(e => e.id === value);

    const filtered = useMemo(() => {
        if (!search) return especialistas;
        const searchLower = search.toLowerCase();
        return especialistas.filter(e =>
            e.nombre.toLowerCase().includes(searchLower) ||
            e.apellido?.toLowerCase().includes(searchLower) ||
            `${e.nombre} ${e.apellido}`.toLowerCase().includes(searchLower)
        );
    }, [especialistas, search]);

    // Cerrar al hacer click fuera
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsOpen(false);
                setSearch('');
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Focus en el input de búsqueda cuando se abre
    useEffect(() => {
        if (isOpen && searchInputRef.current) {
            setTimeout(() => searchInputRef.current?.focus(), 100);
        }
    }, [isOpen]);

    // Manejar teclas
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Escape') {
            setIsOpen(false);
            setSearch('');
        }
    };

    return (
        <div ref={containerRef} className={`relative ${className}`} onKeyDown={handleKeyDown}>
            {/* Botón selector */}
            <button
                type="button"
                onClick={() => !disabled && setIsOpen(!isOpen)}
                disabled={disabled}
                className={`
                    w-full min-h-[44px] px-3 py-2 rounded-xl 
                    border-2 transition-all duration-200
                    bg-white dark:bg-gray-800 
                    text-left flex items-center justify-between gap-2
                    ${disabled
                        ? 'opacity-50 cursor-not-allowed border-gray-200 dark:border-gray-700'
                        : isOpen
                            ? 'border-emerald-500 ring-4 ring-emerald-500/20 shadow-lg'
                            : 'border-gray-200 dark:border-gray-700 hover:border-emerald-400 hover:shadow-md'
                    }
                `}
            >
                {selected ? (
                    <div className="flex items-center gap-3">
                        {/* Avatar con iniciales */}
                        <div
                            className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-md"
                            style={{ backgroundColor: getColorFromName(selected.nombre) }}
                        >
                            {getInitials(selected.nombre, selected.apellido)}
                        </div>
                        <div className="flex flex-col">
                            <span className="text-gray-900 dark:text-white font-medium">
                                {selected.nombre} {selected.apellido}
                            </span>
                            {selected.email && (
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                    {selected.email}
                                </span>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="flex items-center gap-3 text-gray-400">
                        <div className="w-9 h-9 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                            <User className="w-5 h-5" />
                        </div>
                        <span>{placeholder}</span>
                    </div>
                )}
                <ChevronDown
                    className={`w-5 h-5 text-gray-400 transition-transform duration-200 flex-shrink-0 
                        ${isOpen ? 'rotate-180 text-emerald-500' : ''}`}
                />
            </button>

            {/* Dropdown */}
            {isOpen && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                    {/* Barra de búsqueda */}
                    <div className="p-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                        <div className="relative">
                            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            <input
                                ref={searchInputRef}
                                type="text"
                                placeholder="Buscar por nombre..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                            />
                        </div>
                    </div>

                    {/* Lista de especialistas */}
                    <div className="overflow-auto max-h-64">
                        {filtered.length === 0 ? (
                            <div className="p-6 text-center">
                                <User className="w-10 h-10 mx-auto text-gray-300 dark:text-gray-600 mb-2" />
                                <p className="text-gray-500 text-sm">
                                    No se encontraron especialistas
                                </p>
                            </div>
                        ) : (
                            <div className="py-1">
                                {filtered.map((esp) => {
                                    const isSelected = esp.id === value;
                                    const color = getColorFromName(esp.nombre);

                                    return (
                                        <button
                                            key={esp.id}
                                            type="button"
                                            onClick={() => {
                                                onChange(esp.id);
                                                setIsOpen(false);
                                                setSearch('');
                                            }}
                                            className={`
                                                w-full px-3 py-3 flex items-center gap-3 
                                                transition-all duration-150
                                                ${isSelected
                                                    ? 'bg-emerald-50 dark:bg-emerald-900/30'
                                                    : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                                                }
                                            `}
                                        >
                                            {/* Avatar */}
                                            <div className="relative">
                                                <div
                                                    className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-md transition-transform duration-150 hover:scale-105"
                                                    style={{ backgroundColor: color }}
                                                >
                                                    {getInitials(esp.nombre, esp.apellido)}
                                                </div>
                                                {/* Indicador de estado activo */}
                                                {esp.estado === 'activo' && (
                                                    <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 border-2 border-white dark:border-gray-800 rounded-full"></span>
                                                )}
                                            </div>

                                            {/* Info */}
                                            <div className="flex-1 text-left min-w-0">
                                                <p className={`font-medium truncate ${isSelected
                                                        ? 'text-emerald-700 dark:text-emerald-300'
                                                        : 'text-gray-900 dark:text-white'
                                                    }`}>
                                                    {esp.nombre} {esp.apellido}
                                                </p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                                    {esp.telefono || esp.email || 'Sin contacto'}
                                                </p>
                                            </div>

                                            {/* Check de selección */}
                                            {isSelected && (
                                                <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0">
                                                    <Check className="w-4 h-4 text-white" />
                                                </div>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Footer con conteo */}
                    <div className="px-3 py-2 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                        <p className="text-xs text-gray-500 text-center">
                            {filtered.length} de {especialistas.length} especialistas
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
