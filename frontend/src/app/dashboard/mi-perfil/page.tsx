'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useEspecialistaStore } from '@/stores/especialistaStore';
import { comisionesApi } from '@/lib/api/caja';
import HorariosModal from '@/components/especialistas/HorariosModal';
import BloqueosModal from '@/components/especialistas/BloqueosModal';
import { Button } from '@/components/ui/button';
import { UserCircle, Calendar, Ban, Clock, Loader2, DollarSign, Package, Scissors } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function MiPerfilPage() {
    const { user } = useAuthStore();
    const { fetchEspecialista, selectedEspecialista: especialista, isLoading } = useEspecialistaStore();

    // Estados para gestión
    const [showHorariosModal, setShowHorariosModal] = useState(false);
    const [showBloqueosModal, setShowBloqueosModal] = useState(false);

    // Estados para comisiones
    const [fechaDesde, setFechaDesde] = useState(() => {
        const d = new Date();
        d.setDate(1); // Primer día del mes
        return d.toISOString().split('T')[0];
    });
    const [fechaHasta, setFechaHasta] = useState(() => {
        return new Date().toISOString().split('T')[0];
    });
    const [comisiones, setComisiones] = useState<any>(null);
    const [isLoadingComisiones, setIsLoadingComisiones] = useState(false);

    useEffect(() => {
        if (user?.especialista_id) {
            fetchEspecialista(user.especialista_id);
        }
    }, [user?.especialista_id, fetchEspecialista]);

    // Cargar comisiones cuando cambian las fechas y tenemos especialista
    useEffect(() => {
        if (especialista?.id) {
            const cargarComisiones = async () => {
                setIsLoadingComisiones(true);
                try {
                    const datos = await comisionesApi.comisionesEspecialista(
                        especialista.id,
                        fechaDesde,
                        fechaHasta
                    );
                    setComisiones(datos);
                } catch (error) {
                    console.error('Error cargando comisiones:', error);
                } finally {
                    setIsLoadingComisiones(false);
                }
            };
            cargarComisiones();
        }
    }, [especialista?.id, fechaDesde, fechaHasta]);

    // Format currency helper
    const userLocale = typeof window !== 'undefined' ? navigator.language : 'es-CO';
    const formataMoneda = (valor: number) => {
        return new Intl.NumberFormat(userLocale, {
            style: 'currency',
            currency: 'COP',
            maximumFractionDigits: 0
        }).format(valor);
    };

    if (!user?.especialista_id) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center">
                    <UserCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        No tienes perfil de especialista
                    </h2>
                    <p className="text-gray-500 dark:text-gray-400">
                        Esta sección es solo para especialistas
                    </p>
                </div>
            </div>
        );
    }

    if (isLoading || !especialista) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
            </div>
        );
    }

    return (
        <div className="space-y-6 pb-20">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center shadow-lg">
                        <UserCircle className="w-7 h-7 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                            Mi Perfil
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400">
                            {especialista.nombre} {especialista.apellido}
                        </p>
                    </div>
                </div>
            </div>

            <Tabs defaultValue="gestion" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-8">
                    <TabsTrigger value="gestion">Gestión de Horarios</TabsTrigger>
                    <TabsTrigger value="comisiones">Mis Comisiones</TabsTrigger>
                </TabsList>

                {/* TAB GESTIÓN */}
                <TabsContent value="gestion" className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Mis Horarios */}
                        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                            <div className="flex items-center space-x-3 mb-4">
                                <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center">
                                    <Clock className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                                        Mis Horarios
                                    </h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        Gestiona tu disponibilidad
                                    </p>
                                </div>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                                Configura los días y horarios en los que estás disponible para atender clientes.
                            </p>
                            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 mb-4">
                                <p className="text-xs text-yellow-800 dark:text-yellow-400">
                                    ⚠️ Los cambios de horario deben hacerse con 24 horas de anticipación
                                </p>
                            </div>
                            <Button
                                onClick={() => setShowHorariosModal(true)}
                                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                            >
                                <Calendar className="w-4 h-4 mr-2" />
                                Ver Mis Horarios
                            </Button>
                        </div>

                        {/* Mis Bloqueos */}
                        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                            <div className="flex items-center space-x-3 mb-4">
                                <div className="w-10 h-10 rounded-lg bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
                                    <Ban className="w-5 h-5 text-red-600 dark:text-red-400" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                                        Mis Bloqueos
                                    </h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        Bloquea períodos específicos
                                    </p>
                                </div>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                                Marca días u horarios en los que no estarás disponible (vacaciones, citas médicas, etc.).
                            </p>
                            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 mb-4">
                                <p className="text-xs text-yellow-800 dark:text-yellow-400">
                                    ⚠️ Los bloqueos deben crearse con 24 horas de anticipación
                                </p>
                            </div>
                            <Button
                                onClick={() => setShowBloqueosModal(true)}
                                className="w-full bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700"
                            >
                                <Ban className="w-4 h-4 mr-2" />
                                Ver Mis Bloqueos
                            </Button>
                        </div>
                    </div>
                </TabsContent>

                {/* TAB COMISIONES */}
                <TabsContent value="comisiones" className="space-y-6">
                    {/* Filtros */}
                    <div className="bg-white dark:bg-gray-900 p-4 rounded-lg border border-gray-200 dark:border-gray-700 flex flex-wrap gap-4 items-center">
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Fecha Inicio</label>
                            <input
                                type="date"
                                value={fechaDesde}
                                onChange={(e) => setFechaDesde(e.target.value)}
                                className="px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Fecha Fin</label>
                            <input
                                type="date"
                                value={fechaHasta}
                                onChange={(e) => setFechaHasta(e.target.value)}
                                className="px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                            />
                        </div>
                    </div>

                    {isLoadingComisiones ? (
                        <div className="flex justify-center py-12">
                            <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
                        </div>
                    ) : comisiones ? (
                        <>
                            {/* Resumen Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <Card className="border-purple-100 bg-purple-50/50 dark:bg-purple-900/10 dark:border-purple-900/50">
                                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                                        <CardTitle className="text-sm font-medium text-purple-900 dark:text-purple-100">
                                            Total Servicios
                                        </CardTitle>
                                        <Scissors className="h-4 w-4 text-purple-600" />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                                            {formataMoneda(comisiones.total_servicios)}
                                        </div>
                                    </CardContent>
                                </Card>
                                <Card className="border-blue-100 bg-blue-50/50 dark:bg-blue-900/10 dark:border-blue-900/50">
                                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                                        <CardTitle className="text-sm font-medium text-blue-900 dark:text-blue-100">
                                            Total Productos
                                        </CardTitle>
                                        <Package className="h-4 w-4 text-blue-600" />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                                            {formataMoneda(comisiones.total_productos)}
                                        </div>
                                    </CardContent>
                                </Card>
                                <Card className="border-emerald-100 bg-emerald-50/50 dark:bg-emerald-900/10 dark:border-emerald-900/50">
                                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                                        <CardTitle className="text-sm font-medium text-emerald-900 dark:text-emerald-100">
                                            Total Comisión
                                        </CardTitle>
                                        <DollarSign className="h-4 w-4 text-emerald-600" />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">
                                            {formataMoneda(comisiones.total_comision)}
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Detalle Table */}
                            <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                                    <h3 className="font-semibold text-gray-900 dark:text-gray-100">Detalle de Comisiones</h3>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm text-left">
                                        <thead className="bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                                            <tr>
                                                <th className="px-6 py-3 font-medium">Fecha</th>
                                                <th className="px-6 py-3 font-medium">Factura</th>
                                                <th className="px-6 py-3 font-medium">Item</th>
                                                <th className="px-6 py-3 font-medium text-right">Valor Venta</th>
                                                <th className="px-6 py-3 font-medium text-right">Comisión</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                            {comisiones.detalle && comisiones.detalle.length > 0 ? (
                                                comisiones.detalle.map((item: any, index: number) => (
                                                    <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                                        <td className="px-6 py-4 text-gray-900 dark:text-gray-100 whitespace-nowrap">
                                                            {new Date(item.fecha).toLocaleDateString()}
                                                        </td>
                                                        <td className="px-6 py-4 text-gray-600 dark:text-gray-400">
                                                            {item.factura_numero}
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="flex flex-col">
                                                                <span className="font-medium text-gray-900 dark:text-gray-100">
                                                                    {item.tipo === 'servicio' ? 'Servicio' : 'Producto'}
                                                                </span>
                                                                {/* Podríamos mostrar el nombre del item si viniera en la API, pero actualmente no viene en 'detalle' de comisiones por periodo */}
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 text-right text-gray-600 dark:text-gray-400">
                                                            {formataMoneda(item.subtotal_linea)}
                                                        </td>
                                                        <td className="px-6 py-4 text-right font-medium text-emerald-600">
                                                            {formataMoneda(item.monto_comision)}
                                                        </td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                                                        No hay registros en este período
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </>
                    ) : null}
                </TabsContent>
            </Tabs>

            {/* Modals para Gestión */}
            {especialista && (
                <>
                    <HorariosModal
                        especialista={especialista}
                        isOpen={showHorariosModal}
                        onClose={() => setShowHorariosModal(false)}
                        isEspecialistaView={true}
                    />
                    <BloqueosModal
                        especialista={especialista}
                        isOpen={showBloqueosModal}
                        onClose={() => setShowBloqueosModal(false)}
                        isEspecialistaView={true}
                    />
                </>
            )}
        </div>
    );
}
