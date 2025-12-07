'use client';

import { useAuthStore } from '@/stores/authStore';
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

    const stats = [
        {
            title: 'Citas Hoy',
            value: '12',
            icon: Calendar,
            color: 'text-blue-600',
            bgColor: 'bg-blue-100 dark:bg-blue-900/20',
        },
        {
            title: 'Clientes Activos',
            value: '248',
            icon: Users,
            color: 'text-green-600',
            bgColor: 'bg-green-100 dark:bg-green-900/20',
        },
        {
            title: 'Especialistas',
            value: '8',
            icon: UserCircle,
            color: 'text-purple-600',
            bgColor: 'bg-purple-100 dark:bg-purple-900/20',
        },
        {
            title: 'Ingresos del Mes',
            value: '$45,230',
            icon: DollarSign,
            color: 'text-emerald-600',
            bgColor: 'bg-emerald-100 dark:bg-emerald-900/20',
        },
    ];

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
                {stats.map((stat, index) => {
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
                })}
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
                            <AppointmentItem
                                time="09:00 AM"
                                client="María González"
                                service="Alisado Brasileño"
                                specialist="Ana Martínez"
                            />
                            <AppointmentItem
                                time="11:30 AM"
                                client="Carlos Pérez"
                                service="Corte de Cabello"
                                specialist="Laura Sánchez"
                            />
                            <AppointmentItem
                                time="02:00 PM"
                                client="Sofía Torres"
                                service="Tinte + Corte"
                                specialist="María García"
                            />
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
