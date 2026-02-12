import { useState, useEffect } from 'react';
import { useDescuentoStore } from '@/stores/descuentoStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select';
import { toast } from 'sonner';

interface DescuentoModalProps {
    isOpen: boolean;
    onClose: () => void;
    descuentoId: number | null;
}

export default function DescuentoModal({ isOpen, onClose, descuentoId }: DescuentoModalProps) {
    const { descuentos, createDescuento, updateDescuento } = useDescuentoStore();
    const [isLoading, setIsLoading] = useState(false);

    const [formData, setFormData] = useState({
        nombre: '',
        tipo: 'porcentaje',
        valor: '',
        codigo: '',
        activo: true
    });

    useEffect(() => {
        if (descuentoId) {
            const descuento = descuentos.find(d => d.id === descuentoId);
            if (descuento) {
                setFormData({
                    nombre: descuento.nombre,
                    tipo: descuento.tipo,
                    valor: descuento.valor.toString(),
                    codigo: descuento.codigo || '',
                    activo: descuento.activo
                });
            }
        } else {
            setFormData({
                nombre: '',
                tipo: 'porcentaje',
                valor: '',
                codigo: '',
                activo: true
            });
        }
    }, [descuentoId, descuentos, isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const valor = parseFloat(formData.valor);
            if (isNaN(valor) || valor <= 0) {
                toast.error('El valor debe ser mayor a 0');
                return;
            }

            const data = {
                ...formData,
                valor,
                codigo: formData.codigo || undefined,
            };

            if (descuentoId) {
                await updateDescuento(descuentoId, { ...data, tipo: data.tipo as 'porcentaje' | 'monto_fijo' });
                toast.success('Descuento actualizado');
            } else {
                await createDescuento({ ...data, tipo: data.tipo as 'porcentaje' | 'monto_fijo' });
                toast.success('Descuento creado');
            }
            onClose();
        } catch (error: any) {
            toast.error(error.response?.data?.detail || 'Error al guardar descuento');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{descuentoId ? 'Editar Descuento' : 'Nuevo Descuento'}</DialogTitle>
                    <DialogDescription>
                        Configura los detalles del descuento o bono.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label>Nombre</Label>
                        <Input
                            required
                            value={formData.nombre}
                            onChange={(e) => setFormData(prev => ({ ...prev, nombre: e.target.value }))}
                            placeholder="Ej: Bono Bienvenida"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Tipo</Label>
                            <Select
                                value={formData.tipo}
                                onValueChange={(val) => setFormData(prev => ({ ...prev, tipo: val }))}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="porcentaje">Porcentaje (%)</SelectItem>
                                    <SelectItem value="monto_fijo">Monto Fijo ($)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Valor</Label>
                            <Input
                                type="number"
                                required
                                min="0"
                                step="0.01"
                                value={formData.valor}
                                onChange={(e) => setFormData(prev => ({ ...prev, valor: e.target.value }))}
                                placeholder="0"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Código (Opcional)</Label>
                        <Input
                            value={formData.codigo}
                            onChange={(e) => setFormData(prev => ({ ...prev, codigo: e.target.value }))}
                            placeholder="Ej: SUMMER2024"
                        />
                    </div>

                    <div className="flex items-center gap-2 pt-2">
                        <input
                            type="checkbox"
                            checked={formData.activo}
                            onChange={(e) => setFormData(prev => ({ ...prev, activo: e.target.checked }))}
                            className="w-4 h-4 text-emerald-600 rounded border-gray-300 focus:ring-emerald-500"
                            id="activo-check"
                        />
                        <Label htmlFor="activo-check" className="cursor-pointer">Descuento Activo</Label>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={isLoading} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                            {isLoading ? 'Guardando...' : 'Guardar'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
