'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import UsuarioForm from '@/components/admin/UsuarioForm';
import { usuariosApi } from '@/lib/api/usuarios';
import { Usuario } from '@/types/usuario';
import { toast } from 'sonner';

export default function EditarUsuarioPage() {
    const params = useParams();
    const [usuario, setUsuario] = useState<Usuario | undefined>(undefined);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadUsuario = async () => {
            if (params.id) {
                try {
                    const data = await usuariosApi.getById(parseInt(params.id as string));
                    setUsuario(data);
                } catch (error) {
                    console.error('Error loading usuario', error);
                    toast.error('No se pudo cargar el usuario');
                } finally {
                    setIsLoading(false);
                }
            }
        };
        loadUsuario();
    }, [params.id]);

    if (isLoading) {
        return <div className="p-8 text-center">Cargando datos del usuario...</div>;
    }

    if (!usuario) {
        return <div className="p-8 text-center text-red-500">Usuario no encontrado</div>;
    }

    return (
        <div>
            <UsuarioForm usuario={usuario} isEditing={true} />
        </div>
    );
}
