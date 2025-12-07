'use client';

import { useParams } from 'next/navigation';
import EspecialistaForm from '@/components/especialistas/EspecialistaForm';
import { Edit } from 'lucide-react';

export default function EditarEspecialistaPage() {
    const params = useParams();
    const id = Number(params.id);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center space-x-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center shadow-lg">
                    <Edit className="w-7 h-7 text-white" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                        Editar Especialista
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400">
                        Modifica la información del especialista
                    </p>
                </div>
            </div>

            {/* Form */}
            <EspecialistaForm especialistaId={id} mode="edit" />
        </div>
    );
}
