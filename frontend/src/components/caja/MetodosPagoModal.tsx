'use client';

import { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Loader2, Plus, Save, Edit2, CreditCard } from 'lucide-react';
import { useCajaStore } from '@/stores/cajaStore';
import { toast } from 'sonner';
import { MetodoPago, MetodoPagoCreate, MetodoPagoUpdate } from '@/types/caja';
import { metodosPagoApi } from '@/lib/api/caja';

interface MetodosPagoModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function MetodosPagoModal({ isOpen, onClose }: MetodosPagoModalProps) {
    const { metodosPago, fetchMetodosPago, isLoading } = useCajaStore();
    const [editingId, setEditingId] = useState<number | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Form states
    const [nombre, setNombre] = useState('');
    const [activo, setActivo] = useState(true);
    const [requiereReferencia, setRequiereReferencia] = useState(false);

    useEffect(() => {
        if (isOpen) {
            fetchMetodosPago();
        }
    }, [isOpen, fetchMetodosPago]);

    const resetForm = () => {
        setNombre('');
        setActivo(true);
        setRequiereReferencia(false);
        setEditingId(null);
        setIsCreating(false);
        setIsSaving(false);
    };

    const handleStartCreate = () => {
        resetForm();
        setIsCreating(true);
    };

    const handleStartEdit = (metodo: MetodoPago) => {
        setEditingId(metodo.id);
        setNombre(metodo.nombre);
        setActivo(metodo.activo);
        setRequiereReferencia(metodo.requiere_referencia);
        setIsCreating(false);
    };

    const handleSave = async () => {
        if (!nombre.trim()) {
            toast.error('El nombre es requerido');
            return;
        }

        setIsSaving(true);
        try {
            if (isCreating) {
                const data: MetodoPagoCreate = {
                    nombre,
                    activo,
                    requiere_referencia: requiereReferencia
                };
                await metodosPagoApi.crearMetodo(data);
                toast.success('Método de pago creado');
            } else if (editingId) {
                const data: MetodoPagoUpdate = {
                    nombre,
                    activo,
                    requiere_referencia: requiereReferencia
                };
                await metodosPagoApi.actualizarMetodo(editingId, data);
                toast.success('Método de pago actualizado');
            }
            await fetchMetodosPago();
            resetForm();
        } catch (error) {
            console.error(error);
            toast.error('Error al guardar método de pago');
        } finally {
            setIsSaving(false);
        }
    };

    const handleToggleActivo = async (metodo: MetodoPago, nuevoValor: boolean) => {
        try {
            await metodosPagoApi.actualizarMetodo(metodo.id, { activo: nuevoValor });
            fetchMetodosPago();
            toast.success(`Método ${nuevoValor ? 'activado' : 'desactivado'}`);
        } catch (error) {
            console.error(error);
            toast.error('Error al actualizar estado');
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl">
                        <CreditCard className="w-5 h-5 text-purple-600" />
                        Gestionar Métodos de Pago
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                    {/* List of Methods */}
                    {!isCreating && !editingId && (
                        <div className="space-y-2">
                            <Button
                                onClick={handleStartCreate}
                                className="w-full mb-4 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 hover:bg-purple-200"
                            >
                                <Plus className="w-4 h-4 mr-2" />
                                Nuevo Método de Pago
                            </Button>

                            {isLoading ? (
                                <div className="flex justify-center p-4">
                                    <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                                </div>
                            ) : (
                                metodosPago.map((metodo) => (
                                    <div
                                        key={metodo.id}
                                        className={`p-3 rounded-lg border flex items-center justify-between ${metodo.activo
                                            ? 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                                            : 'bg-gray-50 dark:bg-gray-900 border-gray-100 dark:border-gray-800 opacity-60'
                                            }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${metodo.activo ? 'bg-green-100 text-green-600' : 'bg-gray-200 text-gray-500'
                                                }`}>
                                                <CreditCard className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <p className="font-medium text-sm text-gray-900 dark:text-gray-100">
                                                    {metodo.nombre}
                                                </p>
                                                {metodo.requiere_referencia && (
                                                    <p className="text-xs text-blue-600">Requiere referencia</p>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <Switch
                                                checked={metodo.activo}
                                                onCheckedChange={(c: boolean) => handleToggleActivo(metodo, c)}
                                            />
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleStartEdit(metodo)}
                                            >
                                                <Edit2 className="w-4 h-4 text-gray-500" />
                                            </Button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}

                    {/* Form for Create/Edit */}
                    {(isCreating || editingId) && (
                        <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl space-y-4 border border-gray-100 dark:border-gray-700">
                            <h3 className="font-semibold text-sm text-gray-700 dark:text-gray-300">
                                {isCreating ? 'Crear Nuevo Método' : 'Editar Método'}
                            </h3>

                            <div className="space-y-2">
                                <Label>Nombre del método</Label>
                                <Input
                                    value={nombre}
                                    onChange={(e) => setNombre(e.target.value)}
                                    placeholder="Ej: Daviplata, Nequi..."
                                />
                            </div>

                            <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                                <div className="space-y-0.5">
                                    <Label>Activo</Label>
                                    <p className="text-xs text-gray-500">
                                        Disponible para usar en ventas
                                    </p>
                                </div>
                                <Switch
                                    checked={activo}
                                    onCheckedChange={setActivo}
                                />
                            </div>

                            <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                                <div className="space-y-0.5">
                                    <Label>Requiere Referencia</Label>
                                    <p className="text-xs text-gray-500">
                                        Pedir código de comprobante
                                    </p>
                                </div>
                                <Switch
                                    checked={requiereReferencia}
                                    onCheckedChange={setRequiereReferencia}
                                />
                            </div>

                            <div className="flex gap-2 pt-2">
                                <Button
                                    variant="outline"
                                    className="flex-1"
                                    onClick={resetForm}
                                    disabled={isSaving}
                                >
                                    Cancelar
                                </Button>
                                <Button
                                    className="flex-1 bg-purple-600 hover:bg-purple-700"
                                    onClick={handleSave}
                                    disabled={isSaving}
                                >
                                    {isSaving ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <Save className="w-4 h-4 mr-2" />
                                    )}
                                    Guardar
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
