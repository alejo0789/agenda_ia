'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Sede, SedeFormData } from '@/types/sede';
import { toast } from 'sonner';

interface SedeModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    sede?: Sede | null;
    onSave: (data: SedeFormData) => Promise<void>;
}

export default function SedeModal({ open, onOpenChange, sede, onSave }: SedeModalProps) {
    const [isLoading, setIsLoading] = useState(false);
    const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<SedeFormData>();

    useEffect(() => {
        if (sede) {
            setValue('codigo', sede.codigo);
            setValue('nombre', sede.nombre);
            setValue('direccion', sede.direccion || '');
            setValue('telefono', sede.telefono || '');
            setValue('email', sede.email || '');
            setValue('es_principal', sede.es_principal);
        } else {
            reset({
                codigo: '',
                nombre: '',
                direccion: '',
                telefono: '',
                email: '',
                es_principal: false
            });
        }
    }, [sede, open, setValue, reset]);

    const onSubmit = async (data: SedeFormData) => {
        try {
            setIsLoading(true);
            await onSave(data);
            onOpenChange(false);
            toast.success(sede ? 'Sede actualizada' : 'Sede creada exitosamente');
        } catch (error: any) {
            console.error(error);
            let errorMessage = 'Error al guardar la sede';
            if (error.response?.data?.detail) {
                if (typeof error.response.data.detail === 'string') {
                    errorMessage = error.response.data.detail;
                } else if (Array.isArray(error.response.data.detail)) {
                    // FastAPI Validation Error
                    errorMessage = error.response.data.detail.map((e: any) => e.msg).join(', ');
                }
            }
            toast.error(errorMessage);
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>{sede ? 'Editar Sede' : 'Nueva Sede'}</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="codigo">Código *</Label>
                            <Input
                                id="codigo"
                                placeholder="Ej: SEDE-01"
                                {...register('codigo', {
                                    required: 'El código es requerido',
                                    pattern: {
                                        value: /^[A-Z0-9-]+$/,
                                        message: 'Solo mayúsculas, números y guiones'
                                    }
                                })}
                            />
                            {errors.codigo && <span className="text-xs text-red-500">{errors.codigo.message}</span>}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="nombre">Nombre *</Label>
                            <Input
                                id="nombre"
                                placeholder="Ej: Sede Centro"
                                {...register('nombre', { required: 'El nombre es requerido' })}
                            />
                            {errors.nombre && <span className="text-xs text-red-500">{errors.nombre.message}</span>}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="direccion">Dirección</Label>
                        <Input
                            id="direccion"
                            {...register('direccion')}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="telefono">Teléfono</Label>
                            <Input
                                id="telefono"
                                {...register('telefono')}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                {...register('email')}
                            />
                        </div>
                    </div>

                    <div className="flex items-center space-x-2 pt-2">
                        <input
                            type="checkbox"
                            id="es_principal"
                            className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                            {...register('es_principal')}
                        />
                        <Label htmlFor="es_principal" className="font-normal cursor-pointer">
                            Es sede principal
                        </Label>
                    </div>

                    <div className="pt-4 flex justify-end gap-2">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? 'Guardando...' : 'Guardar'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
