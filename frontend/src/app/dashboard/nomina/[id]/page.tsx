"use client";

import { useState, useEffect } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { nominaService, NominaResumenEspecialista } from "@/lib/api/nomina";
import { format } from "date-fns";
import { ArrowLeft, Printer } from "lucide-react";

export default function NominaDetallePage() {
    const params = useParams();
    const searchParams = useSearchParams();
    const router = useRouter();

    const especialistaId = Number(params.id);
    const fechaInicio = searchParams.get("start") || format(new Date(), "yyyy-MM-01");
    const fechaFin = searchParams.get("end") || format(new Date(), "yyyy-MM-dd");

    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<NominaResumenEspecialista | null>(null);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    };

    useEffect(() => {
        if (especialistaId) {
            loadData();
        }
    }, [especialistaId, fechaInicio, fechaFin]);

    const loadData = async () => {
        try {
            setLoading(true);
            const res = await nominaService.getDetalleEspecialista(especialistaId, fechaInicio, fechaFin);
            setData(res);
        } catch (error) {
            console.error(error);
            alert("Error al cargar detalle");
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Cargando detalle...</div>;
    if (!data) return <div className="p-8 text-center text-red-500">No se encontró información.</div>;

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center gap-4">
                <button
                    onClick={() => router.back()}
                    className="p-2 hover:bg-gray-100 rounded-full print:hidden"
                >
                    <ArrowLeft className="h-6 w-6 text-gray-600" />
                </button>
                <div className="flex-1">
                    <h1 className="text-2xl font-bold text-gray-800">
                        Detalle de Nómina: {data.nombre} {data.apellido}
                    </h1>
                    <p className="text-gray-500">
                        Período: {fechaInicio} al {fechaFin}
                    </p>
                </div>
                <button
                    onClick={() => window.print()}
                    className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 print:hidden"
                >
                    <Printer className="h-4 w-4" />
                    Imprimir
                </button>
            </div>

            {/* Cartas de Resumen */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-lg shadow border-l-4 border-blue-500">
                    <h3 className="text-gray-500 text-sm font-medium">Comisión Servicios</h3>
                    <p className="text-2xl font-bold text-gray-900">{formatCurrency(data.comision_servicios)}</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow border-l-4 border-green-500">
                    <h3 className="text-gray-500 text-sm font-medium">Comisión Productos</h3>
                    <p className="text-2xl font-bold text-gray-900">{formatCurrency(data.comision_productos)}</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow border-l-4 border-purple-600">
                    <h3 className="text-gray-500 text-sm font-medium">Total a Pagar</h3>
                    <p className="text-2xl font-bold text-purple-700">{formatCurrency(data.total_comision)}</p>
                </div>
            </div>

            {/* Tabla Detallada */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-800">Desglose de Movimientos</h2>
                </div>
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Factura</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Concepto</th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Monto Venta</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Comisión (%)</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider font-bold">Pago Comisión</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {data.items?.map((item, index) => (
                            <tr key={index} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {format(new Date(item.fecha), "dd/MM/yyyy HH:mm")}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                                    {item.factura_numero}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {item.item_nombre}
                                    {item.cantidad > 1 && <span className="text-xs text-gray-500 ml-1">(x{item.cantidad})</span>}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${item.tipo === 'servicio' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                                        }`}>
                                        {item.tipo}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500">
                                    {formatCurrency(item.subtotal)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500">
                                    {item.comision_porcentaje > 0 ? `${item.comision_porcentaje}%` : 'Fijo'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-bold text-gray-900">
                                    {formatCurrency(item.comision_valor)}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
