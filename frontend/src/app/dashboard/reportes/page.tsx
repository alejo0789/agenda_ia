'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Calendar, FileText, ChevronRight, BarChart3, Users, Scissors } from 'lucide-react';
import Link from 'next/link';

const reports = [
    {
        title: 'Reporte de Citas',
        description: 'Exportar histórico de citas con filtros de fecha y datos de cliente.',
        icon: Calendar,
        href: '/dashboard/reportes/citas',
        color: 'bg-blue-500',
    },
    // Podremos agregar más en el futuro
];

export default function ReportesPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    Centro de Reportes
                </h1>
                <p className="text-gray-500">
                    Genera y exporta informes detallados de la operación
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {reports.map((report) => {
                    const Icon = report.icon;
                    return (
                        <Link key={report.href} href={report.href}>
                            <Card className="hover:shadow-md transition-shadow cursor-pointer h-full border border-gray-100 dark:border-gray-800">
                                <CardContent className="p-6">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center space-x-4">
                                            <div className={`${report.color} p-3 rounded-xl`}>
                                                <Icon className="w-6 h-6 text-white" />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-gray-900 dark:text-gray-100">
                                                    {report.title}
                                                </h3>
                                                <p className="text-sm text-gray-500 mt-1">
                                                    {report.description}
                                                </p>
                                            </div>
                                        </div>
                                        <ChevronRight className="w-5 h-5 text-gray-400" />
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>
                    );
                })}

                {/* Placeholders para futuros reportes si queremos mostrar lo que viene */}
                <div className="opacity-50">
                    <Card className="border border-dashed border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                        <CardContent className="p-6">
                            <div className="flex items-center space-x-4">
                                <div className="bg-gray-200 dark:bg-gray-700 p-3 rounded-xl">
                                    <BarChart3 className="w-6 h-6 text-gray-400" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-400">
                                        Ventas Detalladas
                                    </h3>
                                    <p className="text-sm text-gray-400">
                                        Próximamente...
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
