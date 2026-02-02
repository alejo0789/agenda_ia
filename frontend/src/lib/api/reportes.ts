import { apiClient } from './client';

export const reportesApi = {
    /**
     * Exporta el reporte de citas a Excel
     */
    async exportarCitas(params: {
        fecha_inicio: string;
        fecha_fin: string;
        incluir_cliente: boolean;
    }) {
        const response = await apiClient.get('/reportes/citas/export', {
            params,
            responseType: 'blob', // Importante para descargar archivos
        });

        // Crear un link temporal para descargar el archivo
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;

        const filename = `reporte_citas_${params.fecha_inicio}_al_${params.fecha_fin}.xlsx`;
        link.setAttribute('download', filename);

        document.body.appendChild(link);
        link.click();

        // Limpiar
        link.parentNode?.removeChild(link);
        window.URL.revokeObjectURL(url);
    },
};
