'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { usuariosApi } from '@/lib/api/usuarios';
import { sedesApi } from '@/lib/api/sedes';
import { Usuario } from '@/types/usuario';
import { Sede } from '@/types/sede';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Plus,
    Search,
    User,
    Edit,
    Trash2,
    Power,
    Unlock,
    Shield
} from 'lucide-react';
import { toast } from 'sonner';

export default function UsuariosPage() {
    const router = useRouter();
    const [usuarios, setUsuarios] = useState<Usuario[]>([]);
    const [sedes, setSedes] = useState<Sede[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedSede, setSelectedSede] = useState<string>('all');

    // Suponemos que podemos obtener el usuario actual desde el store o auth
    // const { user } = useAuth(); // TODO: Implementar hook de auth real
    const isSuperAdmin = true; // Placeholder

    const fetchUsuarios = async () => {
        try {
            setIsLoading(true);
            const data = await usuariosApi.getAll(selectedSede !== 'all' ? parseInt(selectedSede) : undefined);
            setUsuarios(data);
        } catch (error) {
            console.error('Error loading usuarios', error);
            toast.error('Error al cargar usuarios');
        } finally {
            setIsLoading(false);
        }
    };

    const fetchSedes = async () => {
        try {
            const data = await sedesApi.getAll();
            setSedes(data);
        } catch (error) {
            console.error('Error loading sedes', error);
        }
    };

    useEffect(() => {
        fetchSedes();
    }, []);

    useEffect(() => {
        fetchUsuarios();
    }, [selectedSede]);

    const handleCreate = () => {
        router.push('/dashboard/admin/usuarios/nuevo');
    };

    const handleEdit = (id: number) => {
        router.push(`/dashboard/admin/usuarios/${id}`);
    };

    const handleToggleStatus = async (usuario: Usuario) => {
        const nuevoEstado = usuario.estado === 'activo' ? 'inactivo' : 'activo';
        // Confirmación
        if (!confirm(`¿Estás seguro de ${nuevoEstado === 'activo' ? 'activar' : 'desactivar'} a este usuario?`)) return;

        try {
            await usuariosApi.changeStatus(usuario.id, nuevoEstado);
            toast.success(`Usuario ${nuevoEstado === 'activo' ? 'activado' : 'desactivado'}`);
            fetchUsuarios();
        } catch (error: any) {
            toast.error(error.response?.data?.detail || 'Error al cambiar estado');
        }
    };

    const handleUnlock = async (usuario: Usuario) => {
        if (!confirm('¿Desbloquear a este usuario?')) return;
        try {
            await usuariosApi.changeStatus(usuario.id, 'activo');
            toast.success('Usuario desbloqueado');
            fetchUsuarios();
        } catch (error: any) {
            toast.error(error.response?.data?.detail || 'Error al desbloquear');
        }
    };

    const filteredUsers = usuarios.filter(u =>
        u.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Gestión de Usuarios</h2>
                    <p className="text-muted-foreground">Administra el acceso y roles del personal</p>
                </div>
                <Button onClick={handleCreate} className="bg-purple-600 hover:bg-purple-700">
                    <Plus className="mr-2 h-4 w-4" />
                    Nuevo Usuario
                </Button>
            </div>

            <Card>
                <CardHeader className="flex flex-col sm:flex-row gap-4 space-y-0 pb-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Buscar por nombre, usuario o email..."
                            className="pl-8"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    {isSuperAdmin && (
                        <div className="w-full sm:w-[200px]">
                            <Select value={selectedSede} onValueChange={setSelectedSede}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Filtrar por sede" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todas las Sedes</SelectItem>
                                    {sedes.map(sede => (
                                        <SelectItem key={sede.id} value={sede.id.toString()}>
                                            {sede.nombre}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-200 font-medium border-b">
                                <tr>
                                    <th className="p-4">Usuario</th>
                                    <th className="p-4">Rol</th>
                                    <th className="p-4">Sede</th>
                                    <th className="p-4">Estado</th>
                                    <th className="p-4 text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {isLoading ? (
                                    <tr>
                                        <td colSpan={5} className="p-8 text-center text-muted-foreground">
                                            Cargando usuarios...
                                        </td>
                                    </tr>
                                ) : filteredUsers.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="p-8 text-center text-muted-foreground">
                                            No se encontraron usuarios
                                        </td>
                                    </tr>
                                ) : (
                                    filteredUsers.map((usuario) => (
                                        <tr key={usuario.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50">
                                            <td className="p-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center text-purple-600 dark:text-purple-400 font-medium">
                                                        {usuario.nombre.substring(0, 2).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <div className="font-medium">{usuario.nombre}</div>
                                                        <div className="text-xs text-muted-foreground">@{usuario.username}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800">
                                                    <Shield className="w-3 h-3" />
                                                    {usuario.rol?.nombre || 'Sin Rol'}
                                                </span>
                                            </td>
                                            <td className="p-4">
                                                {usuario.sede ? (
                                                    <span className="text-sm text-gray-600 dark:text-gray-300">
                                                        {usuario.sede.nombre}
                                                    </span>
                                                ) : (
                                                    <span className="text-xs text-muted-foreground italic">Todas</span>
                                                )}
                                            </td>
                                            <td className="p-4">
                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${usuario.estado === 'activo'
                                                        ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800'
                                                        : usuario.estado === 'bloqueado'
                                                            ? 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800'
                                                            : 'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700'
                                                    }`}>
                                                    <div className={`w-1.5 h-1.5 rounded-full ${usuario.estado === 'activo' ? 'bg-green-500' :
                                                            usuario.estado === 'bloqueado' ? 'bg-red-500' : 'bg-gray-400'
                                                        }`} />
                                                    {usuario.estado.charAt(0).toUpperCase() + usuario.estado.slice(1)}
                                                </span>
                                            </td>
                                            <td className="p-4 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Button variant="ghost" size="sm" onClick={() => handleEdit(usuario.id)} title="Editar">
                                                        <Edit className="h-4 w-4 text-gray-500" />
                                                    </Button>

                                                    {usuario.estado === 'bloqueado' ? (
                                                        <Button variant="ghost" size="sm" onClick={() => handleUnlock(usuario)} title="Desbloquear">
                                                            <Unlock className="h-4 w-4 text-red-500" />
                                                        </Button>
                                                    ) : (
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => handleToggleStatus(usuario)}
                                                            title={usuario.estado === 'activo' ? 'Desactivar' : 'Activar'}
                                                            className={usuario.estado === 'activo' ? "text-red-500 hover:text-red-700" : "text-green-600 hover:text-green-700"}
                                                        >
                                                            <Power className="h-4 w-4" />
                                                        </Button>
                                                    )}
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
        </div>
    );
}
