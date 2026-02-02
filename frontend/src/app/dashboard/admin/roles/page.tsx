'use client';

import { useEffect, useState } from 'react';
import { rolesApi, Rol, Permiso } from '@/lib/api/roles';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Shield, Plus, Pencil, Trash2, Lock, Check, Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function RolesPage() {
    const [roles, setRoles] = useState<Rol[]>([]);
    const [permisos, setPermisos] = useState<Permiso[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Estados para Modales
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isPermisosOpen, setIsPermisosOpen] = useState(false);

    const [selectedRol, setSelectedRol] = useState<Rol | null>(null);
    const [formData, setFormData] = useState({ nombre: '', descripcion: '' });
    const [selectedPermisos, setSelectedPermisos] = useState<number[]>([]);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const [rolesData, permisosData] = await Promise.all([
                rolesApi.listar(),
                rolesApi.listarPermisos()
            ]);
            setRoles(rolesData);
            setPermisos(permisosData);
        } catch (error) {
            console.error('Error cargando roles:', error);
            toast.error('Error al cargar la información');
        } finally {
            setIsLoading(false);
        }
    };

    // Agrupar permisos por módulo
    const permisosPorModulo = permisos.reduce((acc, permiso) => {
        const modulo = permiso.modulo || 'General';
        if (!acc[modulo]) {
            acc[modulo] = [];
        }
        acc[modulo].push(permiso);
        return acc;
    }, {} as Record<string, Permiso[]>);

    const handleCreate = () => {
        setSelectedRol(null);
        setFormData({ nombre: '', descripcion: '' });
        setIsEditOpen(true);
    };

    const handleEdit = (rol: Rol) => {
        setSelectedRol(rol);
        setFormData({ nombre: rol.nombre, descripcion: rol.descripcion });
        setIsEditOpen(true);
    };

    const handlePermissions = (rol: Rol) => {
        setSelectedRol(rol);
        setSelectedPermisos(rol.permisos.map(p => p.id));
        setIsPermisosOpen(true);
    };

    const handleDelete = async (rol: Rol) => {
        if (!confirm(`¿Estás seguro de eliminar el rol "${rol.nombre}"?`)) return;

        try {
            await rolesApi.eliminar(rol.id);
            toast.success('Rol eliminado correctamente');
            loadData();
        } catch (error) {
            console.error('Error eliminando rol:', error);
            toast.error('Error al eliminar el rol');
        }
    };

    const saveRole = async () => {
        if (!formData.nombre) {
            toast.error('El nombre es obligatorio');
            return;
        }

        setIsSaving(true);
        try {
            if (selectedRol) {
                await rolesApi.actualizar(selectedRol.id, formData);
                toast.success('Rol actualizado correctamente');
            } else {
                await rolesApi.crear(formData);
                toast.success('Rol creado correctamente');
            }
            setIsEditOpen(false);
            loadData();
        } catch (error) {
            console.error('Error guardando rol:', error);
            toast.error('Error al guardar el rol');
        } finally {
            setIsSaving(false);
        }
    };

    const savePermissions = async () => {
        if (!selectedRol) return;

        setIsSaving(true);
        try {
            await rolesApi.asignarPermisos(selectedRol.id, selectedPermisos);
            toast.success('Permisos actualizados correctamente');
            setIsPermisosOpen(false);
            loadData();
        } catch (error) {
            console.error('Error guardando permisos:', error);
            toast.error('Error al guardar permisos');
        } finally {
            setIsSaving(false);
        }
    };

    const togglePermiso = (id: number) => {
        setSelectedPermisos(prev =>
            prev.includes(id)
                ? prev.filter(pId => pId !== id)
                : [...prev, id]
        );
    };

    const toggleModulo = (moduloRoles: Permiso[]) => {
        const idsModulo = moduloRoles.map(p => p.id);
        const allSelected = idsModulo.every(id => selectedPermisos.includes(id));

        if (allSelected) {
            // Deseleccionar todos
            setSelectedPermisos(prev => prev.filter(id => !idsModulo.includes(id)));
        } else {
            // Seleccionar todos (agregar los que faltan)
            setSelectedPermisos(prev => {
                const newIds = [...prev];
                idsModulo.forEach(id => {
                    if (!newIds.includes(id)) newIds.push(id);
                });
                return newIds;
            });
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-[50vh]">
                <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">Roles y Permisos</h1>
                    <p className="text-gray-500 dark:text-gray-400">
                        Gestiona los roles de usuario y sus niveles de acceso al sistema.
                    </p>
                </div>
                <Button onClick={handleCreate} className="bg-purple-600 hover:bg-purple-700 text-white">
                    <Plus className="w-4 h-4 mr-2" />
                    Nuevo Rol
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Listado de Roles</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Rol</TableHead>
                                <TableHead>Descripción</TableHead>
                                <TableHead>Tipo</TableHead>
                                <TableHead className="text-right">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {roles.map((rol) => (
                                <TableRow key={rol.id}>
                                    <TableCell className="font-medium">
                                        <div className="flex items-center gap-2">
                                            <Shield className="w-4 h-4 text-purple-600" />
                                            {rol.nombre}
                                        </div>
                                    </TableCell>
                                    <TableCell>{rol.descripcion}</TableCell>
                                    <TableCell>
                                        {rol.es_sistema ? (
                                            <Badge variant="secondary" className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                                                Sistema
                                            </Badge>
                                        ) : (
                                            <Badge variant="outline">Personalizado</Badge>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handlePermissions(rol)}
                                                className="text-amber-600 border-amber-200 hover:bg-amber-50 dark:hover:bg-amber-900/20"
                                            >
                                                <Lock className="w-4 h-4 mr-1" />
                                                Permisos
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleEdit(rol)}
                                                disabled={rol.es_sistema}
                                            >
                                                <Pencil className="w-4 h-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                                                onClick={() => handleDelete(rol)}
                                                disabled={rol.es_sistema}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Modal Crear/Editar Rol */}
            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{selectedRol ? 'Editar Rol' : 'Crear Nuevo Rol'}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Nombre del Rol</Label>
                            <Input
                                value={formData.nombre}
                                onChange={(e) => setFormData(prev => ({ ...prev, nombre: e.target.value }))}
                                placeholder="Ej: Supervisor"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Descripción</Label>
                            <Input
                                value={formData.descripcion}
                                onChange={(e) => setFormData(prev => ({ ...prev, descripcion: e.target.value }))}
                                placeholder="Breve descripción de responsabilidades"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEditOpen(false)}>Cancelar</Button>
                        <Button onClick={saveRole} disabled={isSaving}>
                            {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Guardar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Modal Gestión de Permisos */}
            <Dialog open={isPermisosOpen} onOpenChange={setIsPermisosOpen}>
                <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Lock className="w-5 h-5 text-purple-600" />
                            Gestionar Permisos - {selectedRol?.nombre}
                        </DialogTitle>
                    </DialogHeader>

                    <div className="flex-1 overflow-y-auto pr-2 py-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {Object.entries(permisosPorModulo).map(([modulo, listaPermisos]) => (
                                <Card key={modulo} className="border-gray-200 dark:border-gray-700 shadow-sm">
                                    <div className="p-3 bg-gray-50 dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center rounded-t-xl">
                                        <h3 className="font-semibold text-sm uppercase tracking-wide text-gray-700 dark:text-gray-300">
                                            {modulo}
                                        </h3>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-6 text-xs"
                                            onClick={() => toggleModulo(listaPermisos)}
                                        >
                                            Selec. Todo
                                        </Button>
                                    </div>
                                    <div className="p-3 space-y-2">
                                        {listaPermisos.map((permiso) => (
                                            <div
                                                key={permiso.id}
                                                className="flex items-start gap-2 p-2 rounded hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer"
                                                onClick={() => togglePermiso(permiso.id)}
                                            >
                                                <div className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center transition-colors ${selectedPermisos.includes(permiso.id)
                                                        ? 'bg-purple-600 border-purple-600 text-white'
                                                        : 'border-gray-300 dark:border-gray-600'
                                                    }`}>
                                                    {selectedPermisos.includes(permiso.id) && <Check className="w-3 h-3" />}
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-sm font-medium leading-none text-gray-900 dark:text-gray-200">
                                                        {permiso.codigo}
                                                    </p>
                                                    <p className="text-xs text-gray-500 mt-1">
                                                        {permiso.descripcion}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </Card>
                            ))}
                        </div>
                    </div>

                    <div className="pt-4 border-t mt-auto flex justify-end gap-2 bg-white dark:bg-gray-900">
                        <Button variant="outline" onClick={() => setIsPermisosOpen(false)}>Cancelar</Button>
                        <Button
                            onClick={savePermissions}
                            disabled={isSaving}
                            className="bg-purple-600 hover:bg-purple-700"
                        >
                            {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Guardar Permisos
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
