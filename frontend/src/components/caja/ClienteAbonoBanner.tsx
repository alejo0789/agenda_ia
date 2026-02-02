'use client';

import { useState, useEffect } from 'react';
import { Wallet, Loader2 } from 'lucide-react';
import { abonosApi } from '@/lib/api/abonos';
import { formatPrecio } from '@/types/caja';

interface ClienteAbonoBannerProps {
    clienteId: number | null;
    className?: string;
}

export default function ClienteAbonoBanner({ clienteId, className = '' }: ClienteAbonoBannerProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [saldoDisponible, setSaldoDisponible] = useState(0);

    useEffect(() => {
        if (clienteId) {
            cargarAbonos();
        } else {
            setSaldoDisponible(0);
        }
    }, [clienteId]);

    const cargarAbonos = async () => {
        if (!clienteId) return;

        setIsLoading(true);
        try {
            const data = await abonosApi.obtenerParaFactura(clienteId);
            setSaldoDisponible(data.saldo_total_disponible || 0);
        } catch (error) {
            console.error('Error cargando abonos:', error);
            setSaldoDisponible(0);
        } finally {
            setIsLoading(false);
        }
    };

    // No mostrar si no hay cliente o no hay saldo
    if (!clienteId || (!isLoading && saldoDisponible <= 0)) {
        return null;
    }

    return (
        <div className={`flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 border border-purple-200 dark:border-purple-700 rounded-lg ${className}`}>
            {isLoading ? (
                <>
                    <Loader2 className="w-4 h-4 text-purple-500 animate-spin" />
                    <span className="text-xs text-purple-600 dark:text-purple-400">Verificando saldo...</span>
                </>
            ) : (
                <>
                    <Wallet className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    <span className="text-sm text-purple-700 dark:text-purple-300">
                        <span className="font-medium">Saldo a favor:</span>{' '}
                        <span className="font-bold">{formatPrecio(saldoDisponible)}</span>
                    </span>
                </>
            )}
        </div>
    );
}
