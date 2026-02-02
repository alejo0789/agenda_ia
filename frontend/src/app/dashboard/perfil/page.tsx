'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useAuthStore } from '@/stores/authStore';
import { authApi } from '@/lib/api/auth';
import { usuariosApi } from '@/lib/api/usuarios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from 'sonner';
import { User, Lock, Save, Shield, Building2 } from 'lucide-react';

export default function MiPerfilPage() {
    const { user, setAuth } = useAuthStore();
    const [isLoading, setIsLoading] = useState(false);

    const { register: registerInfo, handleSubmit: handleSubmitInfo, formState: { errors: errorsInfo } } = useForm({
        defaultValues: {
            nombre: user?.nombre || '',
            email: user?.email || '',
        }
    });

    const { register: registerPass, handleSubmit: handleSubmitPass, reset: resetPass, formState: { errors: errorsPass } } = useForm();

    const onSubmitInfo = async (data: any) => {
        try {
            setIsLoading(true);
            // Asumimos que hay un endpoint para actualizar perfil propio o usamos el de usuarios
            if (!user) return;

            await usuariosApi.update(user.id, {
                nombre: data.nombre,
                email: data.email
            });

            // Actualizar store local (idealmente authStore debería tener método updateUserData)
            // Por ahora forzamos una actualización básica simulada o pedimos al usuario reloguear si son cambios críticos
            toast.success('Información actualizada. Algunos cambios pueden requerir volver a iniciar sesión.');

        } catch (error: any) {
            console.error(error);
            toast.error(error.response?.data?.detail || 'Error al actualizar información');
        } finally {
            setIsLoading(false);
        }
    };

    const onSubmitPassword = async (data: any) => {
        if (data.new_password !== data.confirm_password) {
            toast.error('Las contraseñas no coinciden');
            return;
        }

        try {
            setIsLoading(true);
            await authApi.changePassword({
                old_password: data.old_password,
                new_password: data.new_password
            });
            toast.success('Contraseña actualizada correctamente');
            resetPass();
        } catch (error: any) {
            console.error(error);
            toast.error(error.response?.data?.detail || 'Error al cambiar contraseña');
        } finally {
            setIsLoading(false);
        }
    };

    if (!user) return <div>Cargando perfil...</div>;

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Mi Perfil</h2>
                <p className="text-muted-foreground">Administra tu información personal y seguridad</p>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                {/* Sidebar del perfil / Tarjeta resumen */}
                <Card className="md:col-span-1">
                    <CardHeader className="text-center">
                        <div className="mx-auto w-24 h-24 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center text-white text-3xl font-bold mb-4">
                            {user.nombre.charAt(0).toUpperCase()}
                        </div>
                        <CardTitle>{user.nombre}</CardTitle>
                        <CardDescription>@{user.username}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                            <Shield className="w-4 h-4 text-purple-600" />
                            <span className="font-medium">Rol:</span>
                            <span>{user.rol?.nombre}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                            <Building2 className="w-4 h-4 text-purple-600" />
                            <span className="font-medium">Sede:</span>
                            <span>{user.sede?.nombre || 'Todas'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                            <User className="w-4 h-4 text-purple-600" />
                            <span className="font-medium">Miembro desde:</span>
                            <span>{new Date(user.fecha_creacion).toLocaleDateString()}</span>
                        </div>
                    </CardContent>
                </Card>

                {/* Tabs de edición */}
                <div className="md:col-span-2">
                    <Tabs defaultValue="info" className="w-full">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="info">Información Personal</TabsTrigger>
                            <TabsTrigger value="security">Seguridad</TabsTrigger>
                        </TabsList>

                        <TabsContent value="info">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Datos Básicos</CardTitle>
                                    <CardDescription>Actualiza tu nombre y correo de contacto</CardDescription>
                                </CardHeader>
                                <form onSubmit={handleSubmitInfo(onSubmitInfo)}>
                                    <CardContent className="space-y-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="nombre">Nombre Completo</Label>
                                            <Input
                                                id="nombre"
                                                {...registerInfo('nombre', { required: 'Requerido' })}
                                            />
                                            {errorsInfo.nombre && <span className="text-red-500 text-xs">{errorsInfo.nombre.message as string}</span>}
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="email">Correo Electrónico</Label>
                                            <Input
                                                id="email"
                                                type="email"
                                                {...registerInfo('email', { required: 'Requerido' })}
                                            />
                                            {errorsInfo.email && <span className="text-red-500 text-xs">{errorsInfo.email.message as string}</span>}
                                        </div>
                                    </CardContent>
                                    <CardFooter className="flex justify-end">
                                        <Button type="submit" disabled={isLoading} className="bg-purple-600 hover:bg-purple-700">
                                            <Save className="w-4 h-4 mr-2" />
                                            Guardar Cambios
                                        </Button>
                                    </CardFooter>
                                </form>
                            </Card>
                        </TabsContent>

                        <TabsContent value="security">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Cambiar Contraseña</CardTitle>
                                    <CardDescription>Asegúrate de usar una contraseña segura</CardDescription>
                                </CardHeader>
                                <form onSubmit={handleSubmitPass(onSubmitPassword)}>
                                    <CardContent className="space-y-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="old_password">Contraseña Actual</Label>
                                            <Input
                                                id="old_password"
                                                type="password"
                                                {...registerPass('old_password', { required: 'Requerido' })}
                                            />
                                            {errorsPass.old_password && <span className="text-red-500 text-xs">{errorsPass.old_password.message as string}</span>}
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="new_password">Nueva Contraseña</Label>
                                            <Input
                                                id="new_password"
                                                type="password"
                                                {...registerPass('new_password', { required: 'Requerido', minLength: { value: 8, message: 'Mínimo 8 caracteres' } })}
                                            />
                                            {errorsPass.new_password && <span className="text-red-500 text-xs">{errorsPass.new_password.message as string}</span>}
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="confirm_password">Confirmar Nueva Contraseña</Label>
                                            <Input
                                                id="confirm_password"
                                                type="password"
                                                {...registerPass('confirm_password', { required: 'Requerido' })}
                                            />
                                        </div>
                                    </CardContent>
                                    <CardFooter className="flex justify-end">
                                        <Button type="submit" disabled={isLoading} className="bg-purple-600 hover:bg-purple-700">
                                            <Lock className="w-4 h-4 mr-2" />
                                            Actualizar Contraseña
                                        </Button>
                                    </CardFooter>
                                </form>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
        </div>
    );
}
