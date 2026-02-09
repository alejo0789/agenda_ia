'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { dashboardApi, DashboardStats } from '@/lib/api/dashboard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Calendar,
    Users,
    Scissors,
    UserCircle,
    DollarSign,
    Package,
    FileText,
    TrendingUp
} from 'lucide-react';

export default function DashboardPage() {
    const user = useAuthStore((state) => state.user);
    const router = useRouter();
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (user?.rol?.nombre === 'Especialista') {
            router.replace('/dashboard/caja/pos');
        }
    }, [user, router]);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const data = await dashboardApi.getStats();
                setStats(data);
            } catch (error) {
                console.error('Error fetching dashboard stats', error);
            } finally {
                setIsLoading(false);
            }
        };

        if (user) {
            fetchStats();
        }
    }, [user]);

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            maximumFractionDigits: 0
        }).format(value);
    };

    const statCards = stats ? [
        {
            title: 'Citas Hoy',
            value: stats.citas_hoy?.toString() || '0',
            icon: Calendar,
            color: 'text-blue-600',
            bgColor: 'bg-blue-100 dark:bg-blue-900/20',
            visible: true
        },
        {
            title: 'Clientes Activos',
            value: stats.clientes_activos?.toString() || '0',
            icon: Users,
            color: 'text-green-600',
            bgColor: 'bg-green-100 dark:bg-green-900/20',
            visible: true
        },
        {
            title: 'Especialistas',
            value: stats.especialistas_activos?.toString() || '0',
            icon: UserCircle,
            color: 'text-purple-600',
            bgColor: 'bg-purple-100 dark:bg-purple-900/20',
            visible: true
        },
        {
            title: 'Ingresos del Mes',
            value: stats.ingresos_mes !== null ? formatCurrency(stats.ingresos_mes) : '---',
            icon: DollarSign,
            color: 'text-emerald-600',
            bgColor: 'bg-emerald-100 dark:bg-emerald-900/20',
            visible: stats.ingresos_mes !== null
        },
    ].filter(card => card.visible) : [];

    return (
        <div className="space-y-6">
            {/* Welcome Section */}
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg p-6 text-white shadow-lg">
                <h1 className="text-3xl font-bold mb-2">
                    ¡Bienvenido, {user?.nombre || user?.username || 'Usuario'}! 👋
                </h1>
                <p className="text-purple-100">
                    Rol: {user?.rol?.nombre || 'Usuario'} • Hoy es {new Date().toLocaleDateString('es-ES', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                    })}
                </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {isLoading ? (
                    Array.from({ length: 4 }).map((_, i) => (
                        <Card key={i} className="animate-pulse">
                            <CardHeader className="h-24 bg-gray-100 dark:bg-gray-800 rounded-t-lg" />
                            <CardContent className="h-16 bg-gray-50 dark:bg-gray-900 rounded-b-lg" />
                        </Card>
                    ))
                ) : (
                    statCards.map((stat, index) => {
                        const Icon = stat.icon;
                        return (
                            <Card key={index} className="hover:shadow-lg transition-shadow">
                                <CardHeader className="flex flex-row items-center justify-between pb-2">
                                    <CardTitle className="text-sm font-medium text-muted-foreground">
                                        {stat.title}
                                    </CardTitle>
                                    <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                                        <Icon className={`w-5 h-5 ${stat.color}`} />
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-3xl font-bold">{stat.value}</div>
                                </CardContent>
                            </Card>
                        );
                    })
                )}
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Acciones Rápidas</CardTitle>
                        <CardDescription>Accede rápidamente a las funciones más utilizadas</CardDescription>
                    </CardHeader>
                    <CardContent className="grid grid-cols-2 gap-4">
                        <QuickActionButton
                            icon={Calendar}
                            label="Nueva Cita"
                            href="/dashboard/calendario"
                        />
                        <QuickActionButton
                            icon={Users}
                            label="Nuevo Cliente"
                            href="/dashboard/clientes"
                        />
                        <QuickActionButton
                            icon={DollarSign}
                            label="Registrar Pago"
                            href="/dashboard/caja"
                        />
                        <QuickActionButton
                            icon={FileText}
                            label="Ver Reportes"
                            href="/dashboard/reportes"
                        />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Próximas Citas</CardTitle>
                        <CardDescription>Citas programadas para hoy</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {isLoading ? (
                                <div className="space-y-4">
                                    {[1, 2, 3].map((i) => (
                                        <div key={i} className="flex items-center space-x-4 animate-pulse">
                                            <div className="w-12 h-12 bg-gray-200 dark:bg-gray-800 rounded-full" />
                                            <div className="flex-1 space-y-2">
                                                <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-3/4" />
                                                <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-1/2" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : stats?.proximas_citas && stats.proximas_citas.length > 0 ? (
                                stats.proximas_citas.map((cita) => (
                                    <AppointmentItem
                                        key={cita.id}
                                        time={cita.hora}
                                        client={cita.cliente}
                                        service={cita.servicio}
                                        specialist={cita.especialista}
                                    />
                                ))
                            ) : (
                                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                                    <Calendar className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                    <p>No hay citas programadas para hoy</p>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

function QuickActionButton({
    icon: Icon,
    label,
    href
}: {
    icon: any;
    label: string;
    href: string;
}) {
    return (
        <a
            href={href}
            className="flex flex-col items-center justify-center p-4 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700 hover:border-purple-500 dark:hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/10 transition-all group"
        >
            <Icon className="w-8 h-8 text-gray-400 group-hover:text-purple-600 dark:group-hover:text-purple-400 mb-2" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-purple-600 dark:group-hover:text-purple-400">
                {label}
            </span>
        </a>
    );
}

function AppointmentItem({
    time,
    client,
    service,
    specialist,
}: {
    time: string;
    client: string;
    service: string;
    specialist: string;
}) {
    return (
        <div className="flex items-start space-x-4 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
            <div className="flex-shrink-0">
                <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center">
                    <Calendar className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{client}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{service}</p>
                <p className="text-xs text-gray-400 dark:text-gray-500">con {specialist}</p>
            </div>
            <div className="flex-shrink-0">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
                    {time}
                </span>
            </div>
        </div>
    );
}
