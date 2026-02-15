'use client';

import { useState, useEffect } from 'react';
import { X, Clock, User, Scissors, Loader2, ShoppingCart, ChevronRight } from 'lucide-react';
import { formatPrecio } from '@/types/caja';
import { apiClient } from '@/lib/api/client';

export interface ServicioPendiente {
    id: number;
    tipo: 'servicio' | 'producto';
    servicio_id: number | null;
    producto_id: number | null;
    servicio_nombre: string;
    servicio_precio: number;
    cantidad?: number;
    especialista_id: number;
    especialista_nombre: string;
    estado: string;
    fecha_creacion: string;
}

interface ClienteConPendientes {
    cliente_id: number;
    cliente_nombre: string;
    cliente_telefono: string | null;
    total_servicios: number;
    total_monto: number;
    servicios: ServicioPendiente[];
}

interface FacturasPendientesModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCargarServicios: (cliente: { id: number; nombre: string }, servicios: ServicioPendiente[]) => void;
}

export default function FacturasPendientesModal({
    isOpen,
    onClose,
    onCargarServicios
}: FacturasPendientesModalProps) {
    const [isLoading, setIsLoading] = useState(true);
    const [clientes, setClientes] = useState<ClienteConPendientes[]>([]);
    const [clienteExpandido, setClienteExpandido] = useState<number | null>(null);
    const [selectedClientId, setSelectedClientId] = useState<number | null>(null);
    const [fechaDesde, setFechaDesde] = useState(new Date().toISOString().split('T')[0]);
    const [fechaHasta, setFechaHasta] = useState(new Date().toISOString().split('T')[0]);

    useEffect(() => {
        if (isOpen) {
            cargarPendientes();
        }
    }, [isOpen, fechaDesde, fechaHasta]);

    const cargarPendientes = async () => {
        setIsLoading(true);
        try {
            const params = new URLSearchParams();
            if (fechaDesde) params.append('fecha_inicio', fechaDesde);
            if (fechaHasta) params.append('fecha_fin', fechaHasta);

            const response = await apiClient.get(`/facturas-pendientes/resumen-por-cliente?${params.toString()}`);
            setClientes(response.data || []);
            setSelectedClientId(null); // Reset selection on reload
        } catch (error) {
            console.error('Error cargando pendientes:', error);
            setClientes([]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleExpandirCliente = (cliente: ClienteConPendientes) => {
        setSelectedClientId(cliente.cliente_id);
        setClienteExpandido(
            clienteExpandido === cliente.cliente_id ? null : cliente.cliente_id
        );
    };

    const handleCheckboxClick = (e: React.MouseEvent, id: number) => {
        e.stopPropagation();
        setSelectedClientId(id);
    };

    const handleCargarSeleccionado = () => {
        if (!selectedClientId) return;
        const cliente = clientes.find(c => c.cliente_id === selectedClientId);

        if (cliente) {
            onCargarServicios(
                { id: cliente.cliente_id, nombre: cliente.cliente_nombre },
                cliente.servicios
            );
            onClose();
        }
    };

    if (!isOpen) return null;

    const selectedClientData = clientes.find(c => c.cliente_id === selectedClientId);

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-900 rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-hidden shadow-2xl flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-amber-500 to-orange-500 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                            <Clock className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-white">
                                Facturas en Espera
                            </h2>
                            <p className="text-xs text-white/80">
                                Servicios pendientes de cobro
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/20 rounded-lg transition-colors text-white"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Filtros de Fecha */}
                <div className="p-3 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700 flex gap-3 shrink-0">
                    <div className="flex-1">
                        <label className="text-xs text-gray-500 mb-1 block">Desde</label>
                        <input
                            type="date"
                            className="w-full text-sm p-1.5 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
                            value={fechaDesde}
                            onChange={(e) => setFechaDesde(e.target.value)}
                        />
                    </div>
                    <div className="flex-1">
                        <label className="text-xs text-gray-500 mb-1 block">Hasta</label>
                        <input
                            type="date"
                            className="w-full text-sm p-1.5 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
                            value={fechaHasta}
                            onChange={(e) => setFechaHasta(e.target.value)}
                        />
                    </div>
                </div>

                {/* Contenido */}
                <div className="p-4 flex-1 overflow-y-auto">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-12">
                            <Loader2 className="w-8 h-8 text-amber-500 animate-spin mb-3" />
                            <p className="text-gray-500">Cargando servicios pendientes...</p>
                        </div>
                    ) : clientes.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12">
                            <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
                                <Clock className="w-8 h-8 text-gray-400" />
                            </div>
                            <p className="text-gray-500 font-medium">No hay servicios en espera</p>
                            <p className="text-sm text-gray-400 mt-1">
                                Los servicios registrados por especialistas aparecerán aquí
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {clientes.map((cliente) => (
                                <div
                                    key={cliente.cliente_id}
                                    className={`border rounded-xl overflow-hidden transition-all ${selectedClientId === cliente.cliente_id
                                            ? 'border-amber-500 dark:border-amber-500 ring-1 ring-amber-500/20'
                                            : 'border-gray-200 dark:border-gray-700'
                                        }`}
                                >
                                    {/* Header del cliente */}
                                    <div
                                        onClick={() => handleExpandirCliente(cliente)}
                                        className="w-full p-4 flex items-center gap-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                                    >
                                        <input
                                            type="checkbox"
                                            checked={selectedClientId === cliente.cliente_id}
                                            onChange={() => { }} // Handled by div click or separate handler
                                            onClick={(e) => handleCheckboxClick(e, cliente.cliente_id)}
                                            className="w-5 h-5 rounded border-gray-300 text-amber-600 focus:ring-amber-500 cursor-pointer"
                                        />

                                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-white font-bold text-lg">
                                            {cliente.cliente_nombre.charAt(0)}
                                        </div>
                                        <div className="flex-1 text-left">
                                            <p className="font-semibold text-gray-900 dark:text-white">
                                                {cliente.cliente_nombre}
                                            </p>
                                            <div className="flex items-center gap-3 text-sm text-gray-500">
                                                <span className="flex items-center gap-1">
                                                    <Scissors className="w-3.5 h-3.5" />
                                                    {cliente.total_servicios} servicio{cliente.total_servicios !== 1 ? 's' : ''}
                                                </span>
                                                {cliente.cliente_telefono && (
                                                    <span>{cliente.cliente_telefono}</span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-lg text-amber-600">
                                                {formatPrecio(cliente.total_monto)}
                                            </p>
                                        </div>
                                        <ChevronRight className={`w-5 h-5 text-gray-400 transition-transform ${clienteExpandido === cliente.cliente_id ? 'rotate-90' : ''
                                            }`} />
                                    </div>

                                    {/* Detalle expandido */}
                                    {clienteExpandido === cliente.cliente_id && (
                                        <div className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-4">
                                            {/* Lista de servicios */}
                                            <div className="space-y-2">
                                                {cliente.servicios.map((servicio) => (
                                                    <div
                                                        key={servicio.id}
                                                        className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg"
                                                    >
                                                        <div>
                                                            <p className="font-medium text-gray-900 dark:text-white text-sm">
                                                                {servicio.servicio_nombre}
                                                            </p>
                                                            <p className="text-xs text-gray-500">
                                                                {servicio.especialista_nombre} • {new Date(servicio.fecha_creacion).toLocaleDateString('es-CO')}
                                                            </p>
                                                        </div>
                                                        <p className="font-semibold text-amber-600">
                                                            {formatPrecio(servicio.servicio_precio * (servicio.cantidad || 1))}
                                                        </p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 shrink-0 flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 py-3 text-gray-600 dark:text-gray-400 font-medium hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleCargarSeleccionado}
                        disabled={!selectedClientId}
                        className="flex-[2] py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold rounded-xl hover:from-amber-600 hover:to-orange-600 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg disabled:shadow-none"
                    >
                        <ShoppingCart className="w-5 h-5" />
                        {selectedClientData
                            ? `Cargar ${selectedClientData.total_servicios} items (${formatPrecio(selectedClientData.total_monto)})`
                            : 'Selecciona un cliente'
                        }
                    </button>
                </div>
            </div>
        </div>
    );
}
