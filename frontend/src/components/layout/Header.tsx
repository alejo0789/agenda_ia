'use client';

import { useRouter } from 'next/navigation';
import { Bell, Search, Moon, Sun, LogOut, User } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useState } from 'react';

export default function Header() {
    const router = useRouter();
    const { user, clearAuth } = useAuthStore();
    const [darkMode, setDarkMode] = useState(false);

    const handleLogout = () => {
        clearAuth();
        toast.success('Sesión cerrada correctamente');
        router.push('/login');
    };

    const toggleDarkMode = () => {
        setDarkMode(!darkMode);
        document.documentElement.classList.toggle('dark');
    };

    return (
        <header className="sticky top-0 z-40 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shadow-sm">
            <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
                {/* Search Bar */}
                <div className="flex-1 max-w-lg">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Buscar clientes, citas, servicios..."
                            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                        />
                    </div>
                </div>

                {/* Right Section */}
                <div className="flex items-center space-x-4 ml-4">
                    {/* Dark Mode Toggle */}
                    <button
                        onClick={toggleDarkMode}
                        className="p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                        title="Cambiar tema"
                    >
                        {darkMode ? (
                            <Sun className="w-5 h-5" />
                        ) : (
                            <Moon className="w-5 h-5" />
                        )}
                    </button>

                    {/* Notifications */}
                    <button
                        className="relative p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                        title="Notificaciones"
                    >
                        <Bell className="w-5 h-5" />
                        <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                    </button>

                    {/* User Menu */}
                    <div className="flex items-center space-x-3 pl-4 border-l border-gray-200 dark:border-gray-700">
                        <div className="hidden sm:block text-right">
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                {user?.nombre || user?.username}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                {user?.rol?.nombre || 'Usuario'}
                            </p>
                        </div>

                        <div className="relative group">
                            <button className="flex items-center space-x-2 p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center text-white font-medium">
                                    {(user?.nombre || user?.username || 'U').charAt(0).toUpperCase()}
                                </div>
                            </button>

                            {/* Dropdown Menu */}
                            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                                <div className="py-1">
                                    <a
                                        href="/dashboard/perfil"
                                        className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                    >
                                        <User className="w-4 h-4" />
                                        <span>Mi Perfil</span>
                                    </a>
                                    <button
                                        onClick={handleLogout}
                                        className="w-full flex items-center space-x-2 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                    >
                                        <LogOut className="w-4 h-4" />
                                        <span>Cerrar Sesión</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
}
