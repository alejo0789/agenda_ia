import EspecialistaForm from '@/components/especialistas/EspecialistaForm';
import { UserCircle, Plus } from 'lucide-react';

export default function NuevoEspecialistaPage() {
    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center space-x-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center shadow-lg">
                    <Plus className="w-7 h-7 text-white" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                        Nuevo Especialista
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400">
                        Completa la información del nuevo especialista
                    </p>
                </div>
            </div>

            {/* Form */}
            <EspecialistaForm mode="create" />
        </div>
    );
}
