'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { Usuario, UsuarioFormData, Rol } from '@/types/usuario';
import { Sede } from '@/types/sede';
import { usuariosApi } from '@/lib/api/usuarios';
import { sedesApi } from '@/lib/api/sedes';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { ArrowLeft, Key, Shield, Building2, User } from 'lucide-react';

interface UsuarioFormProps {
    usuario?: Usuario;
    isEditing?: boolean;
}

export default function UsuarioForm({ usuario, isEditing = false }: UsuarioFormProps) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [roles, setRoles] = useState<Rol[]>([]);
    const [sedes, setSedes] = useState<Sede[]>([]);
    const [especialistas, setEspecialistas] = useState<any[]>([]); // Usar tipo adecuado si es posible

    // Suponemos rol de sistema obtenido de contexto
    const isSuperAdmin = true;

    const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<UsuarioFormData>({
        defaultValues: {
            estado: 'activo',
            primer_acceso: true,
            requiere_cambio_password: false
        }
    });

    const selectedRolId = watch('rol_id');
    const selectedRol = roles.find(r => r.id === selectedRolId);
    const isEspecialistaRole = selectedRol?.nombre.toLowerCase().includes('especialista');

    useEffect(() => {
        const loadData = async () => {
            try {
                // Importar dinamicamente especialistasApi para evitar dependencias circulares si las hubiera, 
                // o mejor importalo arriba. Ya lo importé antes? No, necesito importarlo.
                // Voy a asumir que puedo importarlo.
                const { especialistasApi } = await import('@/lib/api/especialistas');

                const [rolesData, sedesData, especialistasData] = await Promise.all([
                    usuariosApi.getRoles(),
                    sedesApi.getAll('activa'),
                    especialistasApi.getAll({ estado: 'activo' })
                ]);
                setRoles(rolesData);
                setSedes(sedesData);
                setEspecialistas(especialistasData);
            } catch (error) {
                console.error('Error loading form data', error);
                toast.error('Error al cargar datos auxiliares');
            }
        };
        loadData();
    }, []);

    useEffect(() => {
        if (usuario) {
            setValue('nombre', usuario.nombre);
            setValue('username', usuario.username);
            setValue('email', usuario.email);
            setValue('rol_id', usuario.rol_id);
            if (usuario.sede_id) setValue('sede_id', usuario.sede_id);
            if (usuario.especialista_id) setValue('especialista_id', usuario.especialista_id);
            setValue('estado', usuario.estado as any);
            setValue('primer_acceso', usuario.primer_acceso);
            setValue('requiere_cambio_password', usuario.requiere_cambio_password);
        }
    }, [usuario, setValue]);

    const onSubmit = async (data: UsuarioFormData) => {
        try {
            setIsLoading(true);
            if (isEditing && usuario) {
                await usuariosApi.update(usuario.id, data);
                toast.success('Usuario actualizado correctamente');
            } else {
                await usuariosApi.create(data);
                toast.success('Usuario creado correctamente');
            }
            router.push('/dashboard/admin/usuarios');
        } catch (error: any) {
            console.error(error);
            toast.error(error.response?.data?.detail || 'Error al guardar usuario');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-4xl mx-auto">
            <div className="flex items-center gap-4 mb-6">
                <Button variant="ghost" size="icon" onClick={() => router.back()} type="button">
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">
                        {isEditing ? `Editar Usuario: ${usuario?.username}` : 'Crear Nuevo Usuario'}
                    </h2>
                    <p className="text-muted-foreground">
                        {isEditing ? 'Modifica los datos y permisos del usuario' : 'Registra un nuevo usuario en el sistema'}
                    </p>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <User className="h-5 w-5 text-purple-600" />
                            Información Personal
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="nombre">Nombre Completo *</Label>
                            <Input
                                id="nombre"
                                placeholder="Ej: Juan Pérez"
                                {...register('nombre', { required: 'El nombre es requerido' })}
                            />
                            {errors.nombre && <span className="text-xs text-red-500">{errors.nombre.message}</span>}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="email">Correo Electrónico *</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="usuario@ejemplo.com"
                                {...register('email', {
                                    required: 'El email es requerido',
                                    pattern: {
                                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                                        message: "Email inválido"
                                    }
                                })}
                            />
                            {errors.email && <span className="text-xs text-red-500">{errors.email.message}</span>}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="username">Nombre de Usuario *</Label>
                            <Input
                                id="username"
                                placeholder="Ej: jperez"
                                disabled={isEditing} // Normalmente el username no se cambia fácilmente
                                {...register('username', { required: 'El usuario es requerido' })}
                            />
                            {errors.username && <span className="text-xs text-red-500">{errors.username.message}</span>}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Shield className="h-5 w-5 text-blue-600" />
                            Roles y Permisos
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="rol">Rol del Usuario *</Label>
                            <Select
                                onValueChange={(val) => {
                                    setValue('rol_id', parseInt(val));
                                    // Limpiar especialista si cambia el rol a no especialista?
                                    // setValue('especialista_id', undefined);
                                }}
                                defaultValue={usuario?.rol_id?.toString()}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Seleccionar Rol" />
                                </SelectTrigger>
                                <SelectContent>
                                    {roles.map(rol => (
                                        <SelectItem key={rol.id} value={rol.id.toString()}>
                                            {rol.nombre}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <input type="hidden" {...register('rol_id', { required: true })} />
                            {errors.rol_id && <span className="text-xs text-red-500">El rol es requerido</span>}
                        </div>

                        {
                            isEspecialistaRole && (
                                <div className="space-y-2">
                                    <Label htmlFor="especialista">Especialista Asociado *</Label>
                                    <Select
                                        onValueChange={(val) => setValue('especialista_id', parseInt(val))}
                                        defaultValue={usuario?.especialista_id?.toString()}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Seleccionar Especialista" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {especialistas.map(esp => (
                                                <SelectItem key={esp.id} value={esp.id.toString()}>
                                                    {esp.nombre} {esp.apellido}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <input type="hidden" {...register('especialista_id', { required: isEspecialistaRole })} />
                                    {errors.especialista_id && <span className="text-xs text-red-500">El especialista es requerido</span>}
                                    <p className="text-xs text-muted-foreground">
                                        Vincular este usuario a un registro de especialista.
                                    </p>
                                </div>
                            )
                        }

                        <div className="space-y-2">
                            <Label htmlFor="sede">Sede Asignada</Label>
                            <Select
                                onValueChange={(val) => setValue('sede_id', parseInt(val))}
                                defaultValue={usuario?.sede_id?.toString()}
                                disabled={!isSuperAdmin} // Solo super admin cambia sedes
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Seleccionar Sede" />
                                </SelectTrigger>
                                <SelectContent>
                                    {sedes.map(sede => (
                                        <SelectItem key={sede.id} value={sede.id.toString()}>
                                            {sede.nombre}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <p className="text-xs text-muted-foreground">
                                {isSuperAdmin
                                    ? 'Seleccione la sede principal del usuario.'
                                    : 'El usuario será asignado a su sede actual.'}
                            </p>
                        </div>
                    </CardContent >
                </Card >

                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Key className="h-5 w-5 text-orange-600" />
                            Seguridad
                        </CardTitle>
                        <CardDescription>Configuración de acceso y contraseñas</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {!isEditing && (
                            <div className="space-y-2">
                                <Label htmlFor="password">Contraseña Inicial *</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="Ingrese contraseña segura"
                                    {...register('password', {
                                        required: !isEditing ? 'La contraseña es requerida' : false,
                                        minLength: { value: 8, message: 'Mínimo 8 caracteres' }
                                    })}
                                />
                                {errors.password && <span className="text-xs text-red-500">{errors.password.message}</span>}
                            </div>
                        )}

                        {isEditing && (
                            <div className="space-y-2">
                                <Label htmlFor="password">Nueva Contraseña (Opcional)</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="Dejar en blanco para no cambiar"
                                    {...register('password')}
                                />
                                <p className="text-xs text-muted-foreground">Solo llenar si desea cambiar la contraseña actual</p>
                            </div>
                        )}

                        <div className="flex flex-col gap-3 pt-2">
                            <div className="flex items-center space-x-2">
                                <input
                                    type="checkbox"
                                    id="primer_acceso"
                                    className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                                    {...register('primer_acceso')}
                                />
                                <Label htmlFor="primer_acceso" className="font-normal cursor-pointer">
                                    Forzar configuración en primer acceso (Recomendado para especialistas)
                                </Label>
                            </div>

                            <div className="flex items-center space-x-2">
                                <input
                                    type="checkbox"
                                    id="requiere_cambio_password"
                                    className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                                    {...register('requiere_cambio_password')}
                                />
                                <Label htmlFor="requiere_cambio_password" className="font-normal cursor-pointer">
                                    Solicitar cambio de contraseña en el próximo inicio de sesión
                                </Label>
                            </div>

                            {isEditing && (
                                <div className="flex items-center space-x-2">
                                    <Label className="font-semibold w-20">Estado:</Label>
                                    <Select
                                        onValueChange={(val) => setValue('estado', val as any)}
                                        defaultValue={usuario?.estado}
                                    >
                                        <SelectTrigger className="w-40">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="activo">Activo</SelectItem>
                                            <SelectItem value="inactivo">Inactivo</SelectItem>
                                            <SelectItem value="bloqueado">Bloqueado</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}
                        </div>
                    </CardContent>
                    <CardFooter className="flex justify-end gap-3 bg-gray-50/50 dark:bg-gray-800/50 p-6">
                        <Button variant="outline" type="button" onClick={() => router.back()}>
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={isLoading} className="bg-purple-600 hover:bg-purple-700">
                            {isLoading ? 'Guardando...' : isEditing ? 'Actualizar Usuario' : 'Crear Usuario'}
                        </Button>
                    </CardFooter>
                </Card>
            </div >
        </form >
    );
}
