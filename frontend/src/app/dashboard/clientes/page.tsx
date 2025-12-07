'use client';

import ClienteTable from '@/components/clientes/ClienteTable';
import { Users } from 'lucide-react';

export default function ClientesPage() {
    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center shadow-lg">
                        <Users className="w-7 h-7 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                            Clientes
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400">
                            Gestiona los clientes del salón
                        </p>
                    </div>
                </div>
            </div>

            {/* Tabla de clientes */}
            <ClienteTable />
        </div>
    );
}
