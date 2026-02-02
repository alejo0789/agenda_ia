'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Search, User, Phone, CreditCard, X, Loader2, AlertCircle, Plus } from 'lucide-react';
import { clientesApi } from '@/lib/api/clientes';
import type { ClienteListItem, ClienteCreateDTO } from '@/types/cliente';
import { toast } from 'sonner';

interface ClienteSelectorProps {
    value: { id: number; nombre: string } | null;
    onChange: (cliente: { id: number; nombre: string } | null) => void;
    required?: boolean;
    className?: string;
}

export default function ClienteSelector({
    value,
    onChange,
    required = false,
    className = ''
}: ClienteSelectorProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [clientes, setClientes] = useState<ClienteListItem[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showNewClientForm, setShowNewClientForm] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);
    const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Nuevo cliente form
    const [nuevoCliente, setNuevoCliente] = useState({
        nombre: '',
        apellido: '',
        cedula: '',
        telefono: '',
    });

    // Cerrar al hacer click fuera
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsOpen(false);
                setShowNewClientForm(false);
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

    // Búsqueda con debounce
    const handleSearch = useCallback(async (query: string) => {
        if (query.length < 2) {
            setClientes([]);
            return;
        }

        setIsSearching(true);
        try {
            const results = await clientesApi.busquedaRapida(query, 10);
            setClientes(results);
        } catch (error) {
            console.error('Error buscando clientes:', error);
            setClientes([]);
        } finally {
            setIsSearching(false);
        }
    }, []);

    const onSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const query = e.target.value;
        setSearch(query);
        setShowNewClientForm(false);

        // Cancelar búsqueda anterior
        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }

        // Debounce de 300ms
        searchTimeoutRef.current = setTimeout(() => {
            handleSearch(query);
        }, 300);
    };

    const handleSelectCliente = (cliente: ClienteListItem) => {
        onChange({
            id: cliente.id,
            nombre: `${cliente.nombre} ${cliente.apellido || ''}`.trim()
        });
        setIsOpen(false);
        setSearch('');
        setClientes([]);
    };

    const handleClearCliente = (e: React.MouseEvent) => {
        e.stopPropagation();
        onChange(null);
    };

    const handleCreateCliente = async () => {
        if (!nuevoCliente.nombre.trim()) {
            toast.error('El nombre es requerido');
            return;
        }

        setIsCreating(true);
        try {
            const data: ClienteCreateDTO = {
                nombre: nuevoCliente.nombre.trim(),
                apellido: nuevoCliente.apellido.trim() || undefined,
                cedula: nuevoCliente.cedula.trim() || undefined,
                telefono: nuevoCliente.telefono.trim() || undefined,
            };

            const clienteCreado = await clientesApi.create(data);

            onChange({
                id: clienteCreado.id,
                nombre: `${clienteCreado.nombre} ${clienteCreado.apellido || ''}`.trim()
            });

            setIsOpen(false);
            setShowNewClientForm(false);
            setNuevoCliente({ nombre: '', apellido: '', cedula: '', telefono: '' });
            setSearch('');
            toast.success('Cliente creado correctamente');
        } catch (error: any) {
            console.error('Error creando cliente:', error);
            const msg = error.response?.data?.detail;
            if (typeof msg === 'string') {
                toast.error(msg);
            } else {
                toast.error('Error al crear el cliente');
            }
        } finally {
            setIsCreating(false);
        }
    };

    return (
        <div ref={containerRef} className={`relative ${className}`}>
            {/* Botón selector */}
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={`
                    w-full min-h-[52px] px-4 py-3 rounded-xl 
                    border-2 transition-all duration-200
                    bg-white dark:bg-gray-800 
                    text-left flex items-center justify-between gap-2
                    ${!value && required
                        ? 'border-amber-400 bg-amber-50/50 dark:bg-amber-900/10'
                        : 'border-gray-200 dark:border-gray-700'
                    }
                    ${isOpen
                        ? 'ring-4 ring-emerald-500/20 border-emerald-500 shadow-lg'
                        : 'hover:border-emerald-400 shadow-sm'
                    }
                `}
            >
                {value ? (
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="w-9 h-9 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center flex-shrink-0 shadow-inner">
                            <User className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <span className="text-gray-900 dark:text-white font-bold truncate text-base">
                            {value.nombre}
                        </span>
                        <div
                            onClick={handleClearCliente}
                            className="ml-auto p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors active:scale-90"
                        >
                            <X className="w-5 h-5 text-gray-400" />
                        </div>
                    </div>
                ) : (
                    <div className="flex items-center gap-3 text-gray-400">
                        <Search className="w-5 h-5" />
                        <span className="text-base font-medium">
                            {required ? 'Toca para buscar cliente...' : 'Buscar cliente...'}
                        </span>
                    </div>
                )}
            </button>

            {/* Indicador de requerido */}
            {!value && required && (
                <p className="text-xs text-amber-600 dark:text-amber-400 mt-2 flex items-center gap-1 font-bold animate-pulse">
                    <AlertCircle className="w-3.5 h-3.5" />
                    CLIENTE REQUERIDO
                </p>
            )}

            {/* Dropdown / Modal flotante en móvil */}
            {isOpen && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 border-2 border-emerald-500/30 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                    {/* Barra de búsqueda */}
                    <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50/50">
                        <div className="relative">
                            <Search className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
                            <input
                                ref={searchInputRef}
                                type="text"
                                placeholder="Cédula, teléfono o nombre..."
                                value={search}
                                onChange={onSearchChange}
                                className="w-full pl-11 pr-10 py-4 text-base bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-inner"
                            />
                            {isSearching && (
                                <Loader2 className="w-5 h-5 text-emerald-500 absolute right-4 top-1/2 -translate-y-1/2 animate-spin" />
                            )}
                        </div>
                    </div>

                    {/* Resultados de búsqueda */}
                    <div className="max-h-80 overflow-auto custom-scrollbar">
                        {search.length < 2 ? (
                            <div className="p-8 text-center text-gray-500">
                                <Search className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                <p className="text-base font-medium">Escribe 2 letras para buscar</p>
                            </div>
                        ) : isSearching ? (
                            <div className="p-8 text-center text-gray-500">
                                <Loader2 className="w-10 h-10 mx-auto mb-3 animate-spin text-emerald-500" />
                                <p className="animate-pulse">Buscando cliente...</p>
                            </div>
                        ) : clientes.length > 0 ? (
                            <div className="py-2">
                                {clientes.map((cliente) => (
                                    <button
                                        key={cliente.id}
                                        type="button"
                                        onClick={() => handleSelectCliente(cliente)}
                                        className="w-full px-4 py-4 flex items-center gap-4 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 active:bg-emerald-100 transition-colors text-left border-b border-gray-50 last:border-none"
                                    >
                                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-black text-lg shadow-md">
                                            {cliente.nombre.charAt(0)}{cliente.apellido?.charAt(0) || ''}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-bold text-gray-900 dark:text-white text-lg truncate">
                                                {cliente.nombre} {cliente.apellido || ''}
                                            </p>
                                            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 font-medium">
                                                {cliente.cedula && (
                                                    <span className="flex items-center gap-1.5 text-xs text-gray-500">
                                                        <CreditCard className="w-3.5 h-3.5" />
                                                        {cliente.cedula}
                                                    </span>
                                                )}
                                                {cliente.telefono && (
                                                    <span className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400">
                                                        <Phone className="w-3.5 h-3.5" />
                                                        {cliente.telefono}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <div className="p-6">
                                {!showNewClientForm ? (
                                    <div className="text-center py-6">
                                        <p className="text-gray-500 text-lg mb-4 font-medium">No encontramos al cliente</p>
                                        <button
                                            type="button"
                                            onClick={() => setShowNewClientForm(true)}
                                            className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-emerald-600 text-white rounded-2xl text-lg font-black hover:bg-emerald-700 shadow-xl shadow-emerald-200 dark:shadow-none transition-all active:scale-95"
                                        >
                                            <Plus className="w-6 h-6 stroke-[3]" />
                                            CREAR CLIENTE NUEVO
                                        </button>
                                    </div>
                                ) : (
                                    <div className="space-y-4 animate-in slide-in-from-bottom-2">
                                        <div className="flex items-center justify-between">
                                            <p className="text-lg font-black text-gray-800 dark:text-gray-200 uppercase tracking-tight">Nuevo Cliente</p>
                                            <button
                                                onClick={() => setShowNewClientForm(false)}
                                                className="p-1 text-gray-400 bg-gray-100 dark:bg-gray-800 rounded-full"
                                            >
                                                <X className="w-5 h-5" />
                                            </button>
                                        </div>
                                        <div className="grid grid-cols-1 gap-3">
                                            <input
                                                type="text"
                                                placeholder="Nombre completo *"
                                                value={nuevoCliente.nombre}
                                                onChange={(e) => setNuevoCliente(prev => ({ ...prev, nombre: e.target.value }))}
                                                className="w-full px-4 py-4 text-base border-2 border-gray-100 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-900 focus:border-emerald-500 outline-none font-medium"
                                            />
                                            <input
                                                type="text"
                                                placeholder="Celular / Teléfono"
                                                value={nuevoCliente.telefono}
                                                onChange={(e) => setNuevoCliente(prev => ({ ...prev, telefono: e.target.value }))}
                                                className="w-full px-4 py-4 text-base border-2 border-gray-100 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-900 focus:border-emerald-500 outline-none font-medium"
                                            />
                                            <div className="grid grid-cols-2 gap-3">
                                                <input
                                                    type="text"
                                                    placeholder="Apellido"
                                                    value={nuevoCliente.apellido}
                                                    onChange={(e) => setNuevoCliente(prev => ({ ...prev, apellido: e.target.value }))}
                                                    className="w-full px-4 py-3 text-sm border-2 border-gray-100 rounded-xl bg-gray-50 focus:border-emerald-500 outline-none"
                                                />
                                                <input
                                                    type="text"
                                                    placeholder="Cédula / ID"
                                                    value={nuevoCliente.cedula}
                                                    onChange={(e) => setNuevoCliente(prev => ({ ...prev, cedula: e.target.value }))}
                                                    className="w-full px-4 py-3 text-sm border-2 border-gray-100 rounded-xl bg-gray-50 focus:border-emerald-500 outline-none"
                                                />
                                            </div>
                                        </div>
                                        <div className="flex gap-3 pt-2">
                                            <button
                                                type="button"
                                                onClick={handleCreateCliente}
                                                disabled={isCreating || !nuevoCliente.nombre.trim()}
                                                className="flex-1 py-4 bg-emerald-600 text-white rounded-2xl text-lg font-black hover:bg-emerald-700 disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-100"
                                            >
                                                {isCreating ? (
                                                    <Loader2 className="w-6 h-6 animate-spin" />
                                                ) : (
                                                    <Plus className="w-6 h-6 stroke-[3]" />
                                                )}
                                                GUARDAR Y SELECCIONAR
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
