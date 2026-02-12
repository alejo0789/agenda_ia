'use client';

import { useEffect, useState } from 'react';
import { useDescuentoStore } from '@/stores/descuentoStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import DescuentoModal from '@/components/descuentos/DescuentoModal';
import { toast } from 'sonner';

export default function DescuentosPage() {
    const { descuentos, fetchDescuentos, deleteDescuento, isLoading } = useDescuentoStore();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedId, setSelectedId] = useState<number | null>(null);

    useEffect(() => {
        fetchDescuentos();
    }, [fetchDescuentos]);

    const handleEdit = (id: number) => {
        setSelectedId(id);
        setIsModalOpen(true);
    };

    const handleDelete = async (id: number) => {
        if (confirm('¿Estás seguro de eliminar este descuento?')) {
            try {
                await deleteDescuento(id);
                toast.success('Descuento eliminado');
            } catch (error) {
                toast.error('Error al eliminar');
            }
        }
    };

    const handleCreate = () => {
        setSelectedId(null);
        setIsModalOpen(true);
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Descuentos y Bonos</h1>
                <Button onClick={handleCreate} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                    <Plus className="w-4 h-4 mr-2" />
                    Nuevo Descuento
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Listado de Descuentos</CardTitle>
                </CardHeader>
                <CardContent>
                    {isLoading && <p>Cargando...</p>}
                    {!isLoading && descuentos.length === 0 && <p className="text-gray-500">No hay descuentos registrados.</p>}

                    {!isLoading && descuentos.length > 0 && (
                        <div className="relative overflow-x-auto">
                            <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                                <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                                    <tr>
                                        <th scope="col" className="px-6 py-3">Nombre</th>
                                        <th scope="col" className="px-6 py-3">Tipo</th>
                                        <th scope="col" className="px-6 py-3">Valor</th>
                                        <th scope="col" className="px-6 py-3">Código</th>
                                        <th scope="col" className="px-6 py-3">Estado</th>
                                        <th scope="col" className="px-6 py-3">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {descuentos.map((descuento) => (
                                        <tr key={descuento.id} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700">
                                            <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white">
                                                {descuento.nombre}
                                            </td>
                                            <td className="px-6 py-4">
                                                {descuento.tipo === 'porcentaje' ? 'Porcentaje' : 'Monto Fijo'}
                                            </td>
                                            <td className="px-6 py-4">
                                                {descuento.tipo === 'porcentaje' ? `${descuento.valor}%` : `$${descuento.valor}`}
                                            </td>
                                            <td className="px-6 py-4">
                                                {descuento.codigo || '-'}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-1 rounded-full text-xs ${descuento.activo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                                    {descuento.activo ? 'Activo' : 'Inactivo'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 flex gap-2">
                                                <button
                                                    onClick={() => handleEdit(descuento.id)}
                                                    className="p-1 hover:bg-gray-100 rounded text-blue-600"
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(descuento.id)}
                                                    className="p-1 hover:bg-gray-100 rounded text-red-600"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>

            {isModalOpen && (
                <DescuentoModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    descuentoId={selectedId}
                />
            )}
        </div>
    );
}
