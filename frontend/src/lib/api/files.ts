import { apiClient } from './client';

export interface FileItem {
    name: string;
    url: string;
    size: number;
}

export interface UploadResponse {
    filename: string;
    status: string;
    path: string;
}

export const filesApi = {
    upload: async (file: File, clienteId?: number, telefono?: string, especialistaId?: number) => {
        const formData = new FormData();
        formData.append('file', file);
        if (clienteId) formData.append('cliente_id', clienteId.toString());
        if (telefono) formData.append('telefono', telefono);
        if (especialistaId) formData.append('especialista_id', especialistaId.toString());

        const { data } = await apiClient.post<UploadResponse>('/files/upload', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return data;
    },

    list: async (clienteId?: number, telefono?: string, especialistaId?: number) => {
        const params = new URLSearchParams();
        if (clienteId) params.append('cliente_id', clienteId.toString());
        if (telefono) params.append('telefono', telefono);
        if (especialistaId) params.append('especialista_id', especialistaId.toString());

        const { data } = await apiClient.get<FileItem[]>('/files/list', { params });
        return data;
    },

    delete: async (filename: string, clienteId?: number, especialistaId?: number) => {
        const params = new URLSearchParams();
        params.append('filename', filename);
        if (clienteId) params.append('cliente_id', clienteId.toString());
        if (especialistaId) params.append('especialista_id', especialistaId.toString());

        const { data } = await apiClient.delete<{ status: string; message: string }>('/files/delete', { params });
        return data;
    }
};
