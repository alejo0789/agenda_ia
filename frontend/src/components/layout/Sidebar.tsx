'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/authStore';
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
    Building2,
    Shield,
    Tag,
} from 'lucide-react';

const allMenuItems = [
    {
        title: 'Dashboard',
        icon: LayoutDashboard,
        href: '/dashboard',
        roles: ['Administrador', 'Cajero', 'Recepcionista'],
    },
    {
        title: 'Calendario',
        icon: Calendar,
        href: '/dashboard/calendario',
        roles: ['Administrador', 'Cajero', 'Recepcionista'],
    },
    {
        title: 'Especialistas',
        icon: UserCircle,
        href: '/dashboard/especialistas',
        roles: ['Administrador', 'Recepcionista'],
    },
    {
        title: 'Servicios',
        icon: Scissors,
        href: '/dashboard/servicios',
        roles: ['Administrador'],
    },
    {
        title: 'Clientes',
        icon: Users,
        href: '/dashboard/clientes',
        roles: ['Administrador', 'Cajero', 'Recepcionista'],
    },
    {
        title: 'Caja',
        icon: DollarSign,
        href: '/dashboard/caja',
        roles: ['Administrador', 'Cajero', 'Especialista'],
    },
    {
        title: 'Mi Perfil',
        icon: UserCircle,
        href: '/dashboard/mi-perfil',
        roles: ['Especialista'],
    },
    {
        title: 'Inventario',
        icon: Package,
        href: '/dashboard/inventario',
        roles: ['Administrador', 'Cajero'],
    },
    {
        title: 'Descuentos',
        icon: Tag,
        href: '/dashboard/descuentos',
        roles: ['Administrador'],
    },
    {
        title: 'Nómina',
        icon: Wallet,
        href: '/dashboard/nomina',
        roles: ['Administrador'],
    },
    {
        title: 'Reportes',
        icon: FileText,
        href: '/dashboard/reportes',
        roles: ['Administrador'],
    },
    {
        title: 'Usuarios',
        icon: Users,
        href: '/dashboard/admin/usuarios',
        roles: ['Administrador'],
    },
    {
        title: 'Sedes',
        icon: Building2,
        href: '/dashboard/admin/sedes',
        roles: ['Administrador'],
    },
    {
        title: 'Roles y Permisos',
        icon: Shield,
        href: '/dashboard/admin/roles',
        roles: ['Administrador'],
    },
];

export default function Sidebar() {
    const pathname = usePathname();
    const [collapsed, setCollapsed] = useState(false);
    const [isOpenMobile, setIsOpenMobile] = useState(false);
    const { user } = useAuthStore();
    const [menuItems, setMenuItems] = useState(allMenuItems);

    useEffect(() => {
        // Cerrar sidebar al cambiar de ruta en móvil
        setIsOpenMobile(false);
    }, [pathname]);

    useEffect(() => {
        if (user && user.rol) {
            const roleName = user.rol.nombre;
            const filtered = allMenuItems.filter(item => {
                // Super Administrador has access to everything
                if (roleName === 'Super Administrador') {
                    // Special restriction: ONLY Super Admin (no sede_id) can see Sedes
                    // This is already true for Super Admin (sede_id is null)
                    return true;
                }

                // Check role permission
                const hasRole = item.roles ? item.roles.includes(roleName) : true;
                if (!hasRole) return false;

                // Special restriction for other roles: ONLY Super Admin (no sede_id) can see Sedes
                if (item.title === 'Sedes' && user.sede_id !== null) {
                    return false;
                }

                return true;
            }).map(item => {
                // Modificar link para Especialista en Caja
                if (roleName === 'Especialista' && item.title === 'Caja') {
                    return { ...item, href: '/dashboard/caja/pos' };
                }
                return item;
            });
            setMenuItems(filtered);
        }
    }, [user]);

    return (
        <>
            {/* Mobile Toggle Button */}
            <button
                onClick={() => setIsOpenMobile(true)}
                className={cn(
                    "lg:hidden fixed top-4 left-4 z-50 p-2 bg-white dark:bg-gray-900 rounded-lg shadow-md border border-gray-200 dark:border-gray-800",
                    isOpenMobile && "hidden"
                )}
            >
                <ChevronRight className="w-5 h-5" />
            </button>

            {/* Mobile backdrop */}
            {isOpenMobile && (
                <div
                    className="lg:hidden fixed inset-0 bg-gray-900/50 z-40 backdrop-blur-sm"
                    onClick={() => setIsOpenMobile(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={cn(
                    'fixed top-0 left-0 z-50 h-screen bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 transition-all duration-300 ease-in-out',
                    collapsed ? 'w-16' : 'w-64',
                    'lg:translate-x-0', // Siempre visible en desktop
                    isOpenMobile ? 'translate-x-0' : '-translate-x-full lg:translate-x-0' // Toggle en móvil
                )}
            >
                {/* Close Button Mobile */}
                <button
                    onClick={() => setIsOpenMobile(false)}
                    className={cn(
                        "lg:hidden absolute -right-12 top-4 p-2 bg-white dark:bg-gray-900 rounded-lg shadow-md text-gray-600 dark:text-gray-400",
                        !isOpenMobile && "hidden"
                    )}
                >
                    <ChevronLeft className="w-5 h-5" />
                </button>
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
                            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');

                            return (
                                <li key={item.title}>
                                    <Link
                                        href={item.href || '#'}
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
