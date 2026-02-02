"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { nominaService, NominaResponse } from "@/lib/api/nomina";

export default function NominaPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<NominaResponse | null>(null);

    // Default to current month
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const [fechaInicio, setFechaInicio] = useState(format(firstDay, "yyyy-MM-dd"));
    const [fechaFin, setFechaFin] = useState(format(lastDay, "yyyy-MM-dd"));

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    };

    const fetchNomina = async () => {
        try {
            setLoading(true);
            const res = await nominaService.getResumen(fechaInicio, fechaFin);
            setData(res);
        } catch (error) {
            console.error("Error fetching nomina:", error);
            alert("Error al cargar la nómina");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNomina();
    }, []); // Initial load

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-800">Nómina y Comisiones</h1>
            </div>

            {/* Filtros */}
            <div className="bg-white p-4 rounded-lg shadow flex gap-4 items-end print:hidden">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Inicio</label>
                    <input
                        type="date"
                        value={fechaInicio}
                        onChange={(e) => setFechaInicio(e.target.value)}
                        className="border rounded-md px-3 py-2"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Fin</label>
                    <input
                        type="date"
                        value={fechaFin}
                        onChange={(e) => setFechaFin(e.target.value)}
                        className="border rounded-md px-3 py-2"
                    />
                </div>
                <button
                    onClick={fetchNomina}
                    className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700"
                >
                    Consultar
                </button>
            </div>

            {/* Tabla Resumen */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center text-gray-500">Cargando...</div>
                ) : (
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Especialista</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Venta Servicios</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Com. Servicios</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Venta Productos</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Com. Productos</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider font-bold">Total Comisión</th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider print:hidden">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {data?.resumen.map((item) => (
                                <tr key={item.especialista_id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                        {item.nombre} {item.apellido}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500">
                                        {formatCurrency(item.total_servicios)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-green-600 font-medium">
                                        {formatCurrency(item.comision_servicios)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500">
                                        {formatCurrency(item.total_productos)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-green-600 font-medium">
                                        {formatCurrency(item.comision_productos)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-bold text-gray-900">
                                        {formatCurrency(item.total_comision)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center print:hidden">
                                        <button
                                            onClick={() => router.push(`/dashboard/nomina/${item.especialista_id}?start=${fechaInicio}&end=${fechaFin}`)}
                                            className="text-purple-600 hover:text-purple-900 font-medium"
                                        >
                                            Ver Detalle
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {data?.resumen.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                                        No se encontraron comisiones en este rango de fechas.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
