'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
    Calendar,
    Users,
    Scissors,
    UserCircle,
    DollarSign,
    Package,
    Wallet,
    FileText,
    Settings,
    ChevronLeft,
    ChevronRight,
    Sparkles,
    LayoutDashboard,
} from 'lucide-react';

const menuItems = [
    {
        title: 'Dashboard',
        icon: LayoutDashboard,
        href: '/dashboard',
    },
    {
        title: 'Calendario',
        icon: Calendar,
        href: '/dashboard/calendario',
    },
    {
        title: 'Especialistas',
        icon: UserCircle,
        href: '/dashboard/especialistas',
    },
    {
        title: 'Servicios',
        icon: Scissors,
        href: '/dashboard/servicios',
    },
    {
        title: 'Clientes',
        icon: Users,
        href: '/dashboard/clientes',
    },
    {
        title: 'Caja',
        icon: DollarSign,
        href: '/dashboard/caja',
    },
    {
        title: 'Inventario',
        icon: Package,
        href: '/dashboard/inventario',
    },
    {
        title: 'Nómina',
        icon: Wallet,
        href: '/dashboard/nomina',
    },
    {
        title: 'Reportes',
        icon: FileText,
        href: '/dashboard/reportes',
    },
    {
        title: 'Usuarios',
        icon: Users,
        href: '/dashboard/usuarios',
    },
    {
        title: 'Configuración',
        icon: Settings,
        href: '/dashboard/configuracion',
    },
];

export default function Sidebar() {
    const pathname = usePathname();
    const [collapsed, setCollapsed] = useState(false);

    return (
        <>
            {/* Mobile backdrop */}
            <div className="lg:hidden fixed inset-0 bg-gray-900/50 z-40" />

            {/* Sidebar */}
            <aside
                className={cn(
                    'fixed top-0 left-0 z-50 h-screen bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 transition-all duration-300 ease-in-out',
                    collapsed ? 'w-16' : 'w-64'
                )}
            >
                {/* Logo */}
                <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200 dark:border-gray-800">
                    {!collapsed && (
                        <Link href="/dashboard" className="flex items-center space-x-2">
                            <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-pink-600 rounded-lg flex items-center justify-center">
                                <Sparkles className="w-5 h-5 text-white" />
                            </div>
                            <span className="text-lg font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                                Club Alisados
                            </span>
                        </Link>
                    )}
                    {collapsed && (
                        <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-pink-600 rounded-lg flex items-center justify-center mx-auto">
                            <Sparkles className="w-5 h-5 text-white" />
                        </div>
                    )}
                </div>

                {/* Navigation */}
                <nav className="flex-1 overflow-y-auto py-4 px-2">
                    <ul className="space-y-1">
                        {menuItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = pathname === item.href;

                            return (
                                <li key={item.href}>
                                    <Link
                                        href={item.href}
                                        className={cn(
                                            'flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all duration-200 group',
                                            isActive
                                                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md'
                                                : 'text-gray-700 dark:text-gray-300 hover:bg-purple-50 dark:hover:bg-purple-900/20 hover:text-purple-600 dark:hover:text-purple-400'
                                        )}
                                        title={collapsed ? item.title : undefined}
                                    >
                                        <Icon
                                            className={cn(
                                                'w-5 h-5 flex-shrink-0',
                                                isActive
                                                    ? 'text-white'
                                                    : 'text-gray-500 dark:text-gray-400 group-hover:text-purple-600 dark:group-hover:text-purple-400'
                                            )}
                                        />
                                        {!collapsed && (
                                            <span className="font-medium text-sm">{item.title}</span>
                                        )}
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>
                </nav>

                {/* Collapse Toggle */}
                <div className="p-4 border-t border-gray-200 dark:border-gray-800">
                    <button
                        onClick={() => setCollapsed(!collapsed)}
                        className="w-full flex items-center justify-center px-3 py-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    >
                        {collapsed ? (
                            <ChevronRight className="w-5 h-5" />
                        ) : (
                            <>
                                <ChevronLeft className="w-5 h-5 mr-2" />
                                <span className="text-sm">Contraer</span>
                            </>
                        )}
                    </button>
                </div>
            </aside>
        </>
    );
}
