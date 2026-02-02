'use client';

import { useState, useEffect } from 'react';
import { useCajaStore } from '@/stores/cajaStore'; // Using this just for context or create a new store
import { sedesApi } from '@/lib/api/sedes';
import { Sede, SedeFormData } from '@/types/sede';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table" // Assuming standard shadercn table, if not I'll use standard html table
import {
    Plus,
    Search,
    MapPin,
    Phone,
    Edit,
    Building2,
    CheckCircle2,
    XCircle
} from 'lucide-react';
import SedeModal from '@/components/admin/SedeModal';
import { toast } from 'sonner';
import { useAuthStore } from '@/stores/authStore';
import { useRouter } from 'next/navigation';

export default function SedesPage() {
    const { user } = useAuthStore();
    const router = useRouter();
    const [sedes, setSedes] = useState<Sede[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [selectedSede, setSelectedSede] = useState<Sede | null>(null);

    useEffect(() => {
        if (user && user.sede_id !== null) {
            router.push('/dashboard');
            toast.error('No tiene permiso para acceder a esta sección');
        }
    }, [user, router]);

    const fetchSedes = async () => {
        try {
            setIsLoading(true);
            const data = await sedesApi.getAll();
            setSedes(data);
        } catch (error) {
            console.error('Error loading sedes', error);
            toast.error('Error al cargar las sedes');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchSedes();
    }, []);

    const handleCreate = () => {
        setSelectedSede(null);
        setShowModal(true);
    };

    const handleEdit = (sede: Sede) => {
        setSelectedSede(sede);
        setShowModal(true);
    };

    const handleSave = async (data: SedeFormData) => {
        if (selectedSede) {
            await sedesApi.update(selectedSede.id, data);
        } else {
            await sedesApi.create(data);
        }
        await fetchSedes();
    };

    const handleToggleStatus = async (sede: Sede) => {
        const nuevoEstado = sede.estado === 'activa' ? 'inactiva' : 'activa';
        try {
            await sedesApi.changeStatus(sede.id, nuevoEstado);
            toast.success(`Sede ${nuevoEstado === 'activa' ? 'activada' : 'desactivada'} correctamente`);
            fetchSedes();
        } catch (error: any) {
            toast.error(error.response?.data?.detail || 'Error al cambiar estado');
        }
    };

    const filteredSedes = sedes.filter(s =>
        s.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.codigo.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Gestión de Sedes</h2>
                    <p className="text-muted-foreground">Administra las sucursales del negocio</p>
                </div>
                <Button onClick={handleCreate} className="bg-purple-600 hover:bg-purple-700">
                    <Plus className="mr-2 h-4 w-4" />
                    Nueva Sede
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <div className="relative">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Buscar sedes..."
                            className="pl-8 max-w-sm"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-200 font-medium border-b">
                                <tr>
                                    <th className="p-4">Sede</th>
                                    <th className="p-4">Contacto</th>
                                    <th className="p-4">Estado</th>
                                    <th className="p-4 text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {isLoading ? (
                                    <tr>
                                        <td colSpan={4} className="p-8 text-center text-muted-foreground">
                                            Cargando sedes...
                                        </td>
                                    </tr>
                                ) : filteredSedes.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="p-8 text-center text-muted-foreground">
                                            No se encontraron sedes
                                        </td>
                                    </tr>
                                ) : (
                                    filteredSedes.map((sede) => (
                                        <tr key={sede.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50">
                                            <td className="p-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 bg-purple-100 dark:bg-purple-900/40 rounded-lg text-purple-600 dark:text-purple-400">
                                                        <Building2 className="h-5 w-5" />
                                                    </div>
                                                    <div>
                                                        <div className="font-medium flex items-center gap-2">
                                                            {sede.nombre}
                                                            {sede.es_principal && (
                                                                <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full border border-blue-200">
                                                                    Principal
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="text-xs text-muted-foreground">{sede.codigo}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <div className="space-y-1">
                                                    {sede.direccion && (
                                                        <div className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-300">
                                                            <MapPin className="h-3 w-3" />
                                                            {sede.direccion}
                                                        </div>
                                                    )}
                                                    {sede.telefono && (
                                                        <div className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-300">
                                                            <Phone className="h-3 w-3" />
                                                            {sede.telefono}
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${sede.estado === 'activa'
                                                    ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800'
                                                    : 'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700'
                                                    }`}>
                                                    {sede.estado === 'activa' ? (
                                                        <CheckCircle2 className="w-3 h-3" />
                                                    ) : (
                                                        <XCircle className="w-3 h-3" />
                                                    )}
                                                    {sede.estado === 'activa' ? 'Activa' : 'Inactiva'}
                                                </span>
                                            </td>
                                            <td className="p-4 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Button variant="ghost" size="sm" onClick={() => handleEdit(sede)}>
                                                        <Edit className="h-4 w-4 text-gray-500" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleToggleStatus(sede)}
                                                        className={sede.estado === 'activa' ? "text-red-500 hover:text-red-700" : "text-green-600 hover:text-green-700"}
                                                    >
                                                        {sede.estado === 'activa' ? 'Desactivar' : 'Activar'}
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            <SedeModal
                open={showModal}
                onOpenChange={setShowModal}
                sede={selectedSede}
                onSave={handleSave}
            />
        </div>
    );
}
