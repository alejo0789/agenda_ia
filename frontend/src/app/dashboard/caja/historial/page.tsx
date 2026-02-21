'use client';

import { useState, useEffect } from 'react';
import { useCajaStore } from '@/stores/cajaStore';
import { useAuthStore } from '@/stores/authStore';
import { Card, CardContent } from '@/components/ui/card';
import { formatPrecio, getEstadoCajaColor } from '@/types/caja';
import type { Caja } from '@/types/caja';
import {
    ArrowLeft,
    Loader2,
    Calendar,
    User,
    DollarSign,
    Clock,
    CheckCircle,
    Eye,
    Edit2,
    Save,
    X
} from 'lucide-react';
import Link from 'next/link';

export default function HistorialCajasPage() {
    const { cajas, fetchCajas, isLoading } = useCajaStore();

    useEffect(() => {
        fetchCajas('todos');
    }, [fetchCajas]);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link
                    href="/dashboard/caja"
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                        Historial de Cajas
                    </h1>
                    <p className="text-gray-500 text-sm">
                        Registro de aperturas y cierres de caja
                    </p>
                </div>
            </div>

            {/* Lista */}
            {isLoading ? (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
                </div>
            ) : cajas.length === 0 ? (
                <Card>
                    <CardContent className="p-12 text-center">
                        <Clock className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                            No hay registros de caja
                        </h3>
                        <p className="text-gray-500">
                            Aún no se han abierto cajas en el sistema
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-3">
                    {cajas.map((caja) => (
                        <CajaCard key={caja.id} caja={caja} />
                    ))}
                </div>
            )}
        </div>
    );
}

function CajaCard({ caja }: { caja: Caja }) {
    const { user } = useAuthStore();
    const [showEditModal, setShowEditModal] = useState(false);

    // El admin puede editar. Asumimos rol_id == 1 o nombre contiene admin.
    const isAdmin = user?.rol?.nombre?.toLowerCase().includes('admin');

    const diferencia = caja.estado === 'cerrada' && caja.monto_cierre !== undefined
        ? caja.monto_cierre - (caja.total_efectivo_teorico || 0)
        : null;

    return (
        <>
            <Card className="hover:shadow-md transition-shadow relative overflow-hidden">
                <CardContent className="p-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${caja.estado === 'abierta'
                                ? 'bg-green-100 dark:bg-green-900/20 text-green-600'
                                : 'bg-gray-100 dark:bg-gray-800 text-gray-500'
                                }`}>
                                {caja.estado === 'abierta' ? (
                                    <DollarSign className="w-6 h-6" />
                                ) : (
                                    <CheckCircle className="w-6 h-6" />
                                )}
                            </div>
                            <div>
                                <div className="flex items-center gap-3">
                                    <h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate max-w-[150px] md:max-w-none">
                                        {caja.nombre}
                                    </h3>
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium uppercase ${getEstadoCajaColor(caja.estado)}`}>
                                        {caja.estado}
                                    </span>
                                </div>
                                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-xs text-gray-500">
                                    <span className="flex items-center gap-1">
                                        <Calendar className="w-3.5 h-3.5" />
                                        {new Date(caja.fecha_apertura).toLocaleDateString('es-CO')}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <Clock className="w-3.5 h-3.5" />
                                        {new Date(caja.fecha_apertura).toLocaleTimeString('es-CO', {
                                            hour: '2-digit',
                                            minute: '2-digit',
                                        })}
                                        {caja.fecha_cierre && (
                                            <> - {new Date(caja.fecha_cierre).toLocaleTimeString('es-CO', {
                                                hour: '2-digit',
                                                minute: '2-digit',
                                            })}</>
                                        )}
                                    </span>
                                    {caja.usuario_apertura_nombre && (
                                        <span className="flex items-center gap-1">
                                            <User className="w-3.5 h-3.5" />
                                            {caja.usuario_apertura_nombre}
                                            {caja.usuario_cierre_nombre && caja.usuario_cierre_nombre !== caja.usuario_apertura_nombre && (
                                                <span className="text-gray-400"> / {caja.usuario_cierre_nombre}</span>
                                            )}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 items-center">
                            <div className="text-left md:text-right">
                                <p className="text-[10px] uppercase text-gray-500">Base (Apertura)</p>
                                <p className="font-semibold text-gray-900 dark:text-gray-100">
                                    {formatPrecio(caja.monto_apertura)}
                                </p>
                            </div>

                            <div className="text-left md:text-right">
                                <p className="text-[10px] uppercase text-gray-500">Esperado</p>
                                <p className="font-semibold text-blue-600 dark:text-blue-400">
                                    {formatPrecio(caja.total_efectivo_teorico || 0)}
                                </p>
                            </div>

                            {caja.estado === 'cerrada' && caja.monto_cierre !== undefined && (
                                <>
                                    <div className="text-left md:text-right">
                                        <p className="text-[10px] uppercase text-gray-500">Cierre (Real)</p>
                                        <p className="font-semibold text-emerald-600 dark:text-emerald-400">
                                            {formatPrecio(caja.monto_cierre)}
                                        </p>
                                    </div>

                                    <div className="text-left md:text-right">
                                        <p className="text-[10px] uppercase text-gray-500">Diferencia</p>
                                        <p className={`font-bold ${diferencia === 0
                                            ? 'text-gray-500'
                                            : (diferencia || 0) > 0
                                                ? 'text-emerald-700'
                                                : 'text-rose-600'
                                            }`}>
                                            {(diferencia || 0) > 0 ? '+' : ''}{formatPrecio(diferencia || 0)}
                                        </p>
                                    </div>
                                </>
                            )}
                        </div>

                        <div className="flex items-center gap-2 justify-end">
                            {isAdmin && (
                                <button
                                    onClick={() => setShowEditModal(true)}
                                    className="p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 rounded-lg transition-colors"
                                    title="Editar montos (Admin)"
                                >
                                    <Edit2 className="w-4 h-4" />
                                </button>
                            )}
                            <Link
                                href={`/dashboard/caja/historial/${caja.id}`}
                                className="p-2 bg-gray-50 dark:bg-gray-800/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/20 rounded-lg transition-colors text-gray-600 dark:text-gray-400 hover:text-emerald-600"
                            >
                                <Eye className="w-5 h-5" />
                            </Link>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {showEditModal && (
                <EditCajaModal
                    caja={caja}
                    onClose={() => setShowEditModal(false)}
                />
            )}
        </>
    );
}

function EditCajaModal({ caja, onClose }: { caja: Caja; onClose: () => void }) {
    const { actualizarCaja } = useCajaStore();
    const [montoApertura, setMontoApertura] = useState(caja.monto_apertura.toString());
    const [montoCierre, setMontoCierre] = useState(caja.monto_cierre?.toString() || '');
    const [notas, setNotas] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await actualizarCaja(caja.id, {
                monto_apertura: Number(montoApertura),
                monto_cierre: montoCierre ? Number(montoCierre) : undefined,
                notas: notas || undefined
            });
            onClose();
        } catch (error) {
            console.error(error);
            alert('Error al actualizar caja');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <Card className="w-full max-w-md shadow-2xl">
                <div className="p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold flex items-center gap-2">
                            <Edit2 className="w-5 h-5 text-emerald-600" />
                            Editar Montos - {caja.nombre}
                        </h2>
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Monto Apertura (Base)
                            </label>
                            <input
                                type="number"
                                value={montoApertura}
                                onChange={(e) => setMontoApertura(e.target.value)}
                                className="w-full p-2 border rounded-lg bg-transparent border-gray-300 dark:border-gray-700 focus:ring-2 focus:ring-emerald-500 outline-none"
                            />
                        </div>

                        {caja.estado === 'cerrada' && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Monto Cierre (Efectivo Real)
                                </label>
                                <input
                                    type="number"
                                    value={montoCierre}
                                    onChange={(e) => setMontoCierre(e.target.value)}
                                    className="w-full p-2 border rounded-lg bg-transparent border-gray-300 dark:border-gray-700 focus:ring-2 focus:ring-emerald-500 outline-none"
                                />
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Notas de corrección
                            </label>
                            <textarea
                                value={notas}
                                onChange={(e) => setNotas(e.target.value)}
                                placeholder="Indique el motivo de la corrección..."
                                className="w-full p-2 border rounded-lg bg-transparent border-gray-300 dark:border-gray-700 focus:ring-2 focus:ring-emerald-500 outline-none h-24 resize-none"
                            />
                        </div>

                        <div className="bg-amber-50 dark:bg-amber-950/20 p-3 rounded-lg border border-amber-200 dark:border-amber-900/50">
                            <p className="text-xs text-amber-800 dark:text-amber-300">
                                <strong>Nota:</strong> Estas correcciones quedarán registradas en las notas de la caja y afectarán los reportes de cuadre.
                            </p>
                        </div>
                    </div>

                    <div className="flex gap-3 mt-8">
                        <button
                            onClick={onClose}
                            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="flex-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                        >
                            {isSaving ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <Save className="w-4 h-4" />
                            )}
                            Guardar Cambios
                        </button>
                    </div>
                </div>
            </Card>
        </div>
    );
}
