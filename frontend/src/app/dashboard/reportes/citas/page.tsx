'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Download, ArrowLeft, FileSpreadsheet, CheckCircle2, UserCheck, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { reportesApi } from '@/lib/api/reportes';
import { toast } from 'sonner';

export default function ReporteCitasPage() {
    const [fechaInicio, setFechaInicio] = useState(new Date().toISOString().split('T')[0]);
    const [fechaFin, setFechaFin] = useState(new Date().toISOString().split('T')[0]);
    const [incluirCliente, setIncluirCliente] = useState(true);
    const [isExporting, setIsExporting] = useState(false);

    const handleExport = async () => {
        setIsExporting(true);
        try {
            await reportesApi.exportarCitas({
                fecha_inicio: fechaInicio,
                fecha_fin: fechaFin,
                incluir_cliente: incluirCliente,
            });
            toast.success('Reporte exportado correctamente');
        } catch (error) {
            console.error('Error al exportar:', error);
            toast.error('Ocurrió un error al generar el reporte');
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <div className="space-y-6 max-w-4xl">
            <div className="flex items-center space-x-4">
                <Link
                    href="/dashboard/reportes"
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                        Reporte de Citas
                    </h1>
                    <p className="text-gray-500">
                        Configura los filtros y exporta la información a Excel
                    </p>
                </div>
            </div>

            <Card className="border border-gray-100 dark:border-gray-800 shadow-xl overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6">
                    <div className="flex items-center space-x-3">
                        <div className="bg-white/20 p-2 rounded-lg">
                            <FileSpreadsheet className="w-6 h-6 text-white" />
                        </div>
                        <CardTitle>Configuración de Exportación</CardTitle>
                    </div>
                </CardHeader>
                <CardContent className="p-8 space-y-8">
                    {/* Rango de Fechas */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-blue-500" />
                                FECHA INICIAL
                            </label>
                            <input
                                type="date"
                                value={fechaInicio}
                                onChange={(e) => setFechaInicio(e.target.value)}
                                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border-none rounded-xl focus:ring-2 focus:ring-blue-500 transition-all font-medium"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-blue-500" />
                                FECHA FINAL
                            </label>
                            <input
                                type="date"
                                value={fechaFin}
                                onChange={(e) => setFechaFin(e.target.value)}
                                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border-none rounded-xl focus:ring-2 focus:ring-blue-500 transition-all font-medium"
                            />
                        </div>
                    </div>

                    {/* Opciones Adicionales */}
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-2xl border border-blue-100 dark:border-blue-800/50">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                                <div className="bg-white dark:bg-gray-800 p-2 rounded-xl shadow-sm">
                                    <UserCheck className="w-5 h-5 text-blue-600" />
                                </div>
                                <div>
                                    <p className="font-bold text-gray-900 dark:text-gray-100">Incluir Datos del Cliente</p>
                                    <p className="text-xs text-gray-500">Nombre, teléfono y correo electrónico</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIncluirCliente(!incluirCliente)}
                                className={`w-14 h-7 flex items-center rounded-full transition-colors ${incluirCliente ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-700'
                                    }`}
                            >
                                <div
                                    className={`w-5 h-5 bg-white rounded-full shadow-md transition-transform mx-1 ${incluirCliente ? 'translate-x-7' : 'translate-x-0'
                                        }`}
                                />
                            </button>
                        </div>
                    </div>

                    {/* Resumen de Columnas */}
                    <div className="space-y-3">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Columnas a exportar:</p>
                        <div className="flex flex-wrap gap-2">
                            {['Fecha', 'Hora', 'Especialista', 'Servicio'].map((col) => (
                                <span key={col} className="px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-xs font-bold rounded-full border border-gray-200 dark:border-gray-700">
                                    {col}
                                </span>
                            ))}
                            {incluirCliente && ['Cliente', 'Teléfono', 'Correo'].map((col) => (
                                <span key={col} className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-bold rounded-full border border-blue-200 dark:border-blue-800 animate-in fade-in zoom-in duration-300">
                                    {col}
                                </span>
                            ))}
                        </div>
                    </div>

                    <div className="pt-4">
                        <button
                            onClick={handleExport}
                            disabled={isExporting}
                            className="w-full py-5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black rounded-2xl shadow-xl shadow-blue-200 dark:shadow-none hover:from-blue-700 hover:to-indigo-700 transition-all flex items-center justify-center gap-3 text-lg disabled:opacity-50 disabled:cursor-not-allowed group"
                        >
                            {isExporting ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    GENERANDO EXCEL...
                                </>
                            ) : (
                                <>
                                    <Download className="w-6 h-6 group-hover:bounce" />
                                    EXPORTAR A EXCEL
                                </>
                            )}
                        </button>
                    </div>
                </CardContent>
            </Card>

            <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-xl border border-amber-200 dark:border-amber-800 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-amber-800 dark:text-amber-400">
                    <strong>Nota:</strong> Los datos se exportarán según la zona horaria del sistema. El archivo resultante estará en formato .xlsx compatible con Microsoft Excel, Google Sheets y Numbers.
                </p>
            </div>
        </div>
    );
}
