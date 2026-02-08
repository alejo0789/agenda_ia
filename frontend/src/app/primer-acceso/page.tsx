'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { usuariosApi } from '@/lib/api/usuarios';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { toast } from 'sonner';
import { Lock, User, ArrowRight, CheckCircle2 } from 'lucide-react';

interface FirstAccessForm {
    username: string;
    new_password?: string;
    confirm_password?: string;
}

export default function PrimerAccesoPage() {
    const router = useRouter();
    const { user, clearAuth } = useAuthStore();
    const [step, setStep] = useState<1 | 2>(1);
    const [isLoading, setIsLoading] = useState(false);
    const [verifiedUser, setVerifiedUser] = useState<string>('');

    useEffect(() => {
        if (user) {
            if (user.primer_acceso) {
                setVerifiedUser(user.username);
                setStep(2);
            } else {
                router.push('/dashboard');
            }
        }
    }, [user, router]);

    const { register, handleSubmit, formState: { errors }, watch, setError } = useForm<FirstAccessForm>();

    const onSubmitUsername = async (data: FirstAccessForm) => {
        try {
            setIsLoading(true);
            const response = await usuariosApi.checkFirstAccess(data.username);

            if (response.is_first_access) {
                setVerifiedUser(data.username);
                setStep(2);
            } else {
                toast.error('Este usuario ya ha configurado su cuenta o no existe.');
                // O redirigir al login
                setTimeout(() => router.push('/login'), 2000);
            }
        } catch (error: any) {
            console.error(error);
            toast.error('Error al verificar usuario. Verifique el nombre de usuario.');
        } finally {
            setIsLoading(false);
        }
    };

    const onSubmitPassword = async (data: FirstAccessForm) => {
        if (data.new_password !== data.confirm_password) {
            setError('confirm_password', { message: 'Las contraseñas no coinciden' });
            return;
        }

        try {
            setIsLoading(true);
            await usuariosApi.setupPassword({
                username: verifiedUser,
                new_password: data.new_password
            });

            toast.success('Contraseña configurada exitosamente');
            setTimeout(() => {
                clearAuth(); // Limpiar sesión antes de ir al login
                router.push('/login');
            }, 1500);
        } catch (error: any) {
            console.error(error);
            toast.error(error.response?.data?.detail || 'Error al configurar contraseña');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="space-y-1">
                    <CardTitle className="text-2xl font-bold text-center text-purple-600">
                        Bienvenido al Club
                    </CardTitle>
                    <CardDescription className="text-center">
                        Configuración inicial de cuenta
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {step === 1 ? (
                        <form onSubmit={handleSubmit(onSubmitUsername)} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="username">Nombre de Usuario</Label>
                                <div className="relative">
                                    <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                    <Input
                                        id="username"
                                        placeholder="Ingrese su usuario asignado"
                                        className="pl-9"
                                        {...register('username', { required: 'El usuario es requerido' })}
                                        autoCapitalize="none"
                                        autoCorrect="off"
                                        spellCheck="false"
                                    />
                                </div>
                                {errors.username && <span className="text-xs text-red-500">{errors.username.message}</span>}
                            </div>

                            <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-700" disabled={isLoading}>
                                {isLoading ? 'Verificando...' : 'Continuar'}
                                {!isLoading && <ArrowRight className="ml-2 h-4 w-4" />}
                            </Button>

                            <div className="text-center text-sm">
                                <a href="/login" className="text-purple-600 hover:underline">
                                    ¿Ya tienes cuenta? Inicia sesión
                                </a>
                            </div>
                        </form>
                    ) : (
                        <form onSubmit={handleSubmit(onSubmitPassword)} className="space-y-4">
                            <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-md flex items-center gap-2 mb-4">
                                <CheckCircle2 className="h-5 w-5 text-purple-600" />
                                <div className="text-sm text-purple-800 dark:text-purple-300">
                                    <span className="font-semibold">Hola @{verifiedUser}</span>
                                    <p className="text-xs opacity-90">Por favor define tu contraseña personal</p>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="new_password">Nueva Contraseña</Label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                    <Input
                                        id="new_password"
                                        type="password"
                                        className="pl-9"
                                        {...register('new_password', {
                                            required: 'La contraseña es requerida',
                                            minLength: { value: 8, message: 'Mínimo 8 caracteres' }
                                        })}
                                    />
                                </div>
                                {errors.new_password && <span className="text-xs text-red-500">{errors.new_password.message}</span>}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="confirm_password">Confirmar Contraseña</Label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                    <Input
                                        id="confirm_password"
                                        type="password"
                                        className="pl-9"
                                        {...register('confirm_password', {
                                            required: 'Confirmar la contraseña es requerido'
                                        })}
                                    />
                                </div>
                                {errors.confirm_password && <span className="text-xs text-red-500">{errors.confirm_password.message}</span>}
                            </div>

                            <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-700" disabled={isLoading}>
                                {isLoading ? 'Guardando...' : 'Establecer Contraseña'}
                            </Button>
                        </form>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
