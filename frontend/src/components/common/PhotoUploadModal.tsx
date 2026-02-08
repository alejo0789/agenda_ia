import { useState, useRef } from 'react';
import { X, Upload, File as FileIcon, Loader2, CheckCircle, AlertCircle, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { filesApi } from '@/lib/api/files';

interface PhotoUploadModalProps {
    isOpen: boolean;
    onClose: () => void;
    clienteId?: number;
    clienteTelefono?: string;
    clienteNombre?: string;
}

export function PhotoUploadModal({
    isOpen,
    onClose,
    clienteId,
    clienteTelefono,
    clienteNombre
}: PhotoUploadModalProps) {
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 });
    const [dragActive, setDragActive] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleFiles(e.dataTransfer.files);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        e.preventDefault();
        if (e.target.files && e.target.files.length > 0) {
            handleFiles(e.target.files);
        }
    };

    const handleFiles = async (fileList: FileList) => {
        if (!clienteId && !clienteTelefono) {
            toast.error("No se puede identificar al cliente para subir la foto");
            return;
        }

        const files = Array.from(fileList);
        const validFiles = files.filter(f => f.type.startsWith('image/'));

        if (validFiles.length === 0) {
            toast.error("Solo se permiten archivos de imagen");
            return;
        }

        if (validFiles.length < files.length) {
            toast.warning("Algunos archivos no eran imágenes y fueron ignorados");
        }

        setIsUploading(true);
        setUploadProgress({ current: 0, total: validFiles.length });

        let successCount = 0;
        let errorCount = 0;

        for (let i = 0; i < validFiles.length; i++) {
            const file = validFiles[i];
            try {
                // Actualizar progreso
                setUploadProgress(prev => ({ ...prev, current: i + 1 }));

                await filesApi.upload(file, clienteId, clienteTelefono);
                successCount++;
            } catch (error) {
                console.error(`Error subiendo ${file.name}:`, error);
                errorCount++;
            }
        }

        setIsUploading(false);

        if (successCount > 0) {
            toast.success(`${successCount} foto${successCount !== 1 ? 's' : ''} subida${successCount !== 1 ? 's' : ''} correctamente`);
            // Solo cerrar si todos fueron exitosos
            if (errorCount === 0) {
                onClose();
            }
        }

        if (errorCount > 0) {
            toast.error(`Error al subir ${errorCount} foto${errorCount !== 1 ? 's' : ''}. Verifique la conexión.`);
        }

        // Limpiar el input para permitir subir los mismos archivos de nuevo si fallaron
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const triggerFileInput = () => {
        fileInputRef.current?.click();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={!isUploading ? onClose : undefined}
            />

            {/* Modal */}
            <div className="relative bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-md m-4 overflow-hidden border border-gray-200 dark:border-gray-800">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between bg-gray-50 dark:bg-gray-800/50">
                    <div className="flex items-center gap-2">
                        <div className="bg-purple-100 dark:bg-purple-900/30 p-2 rounded-lg">
                            <ImageIcon className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                        </div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                            Subir Fotos Cliente
                        </h3>
                    </div>
                    <button
                        onClick={onClose}
                        disabled={isUploading}
                        className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
                    >
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                        Sube fotos para el cliente <span className="font-medium text-gray-900 dark:text-white">{clienteNombre}</span>.
                        Se guardarán en una carpeta asociada a su número de teléfono.
                    </p>

                    <div
                        className={`
                            border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center gap-4 transition-colors cursor-pointer relative overflow-hidden
                            ${dragActive
                                ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                                : 'border-gray-300 dark:border-gray-700 hover:border-purple-400 hover:bg-gray-50 dark:hover:bg-gray-800/50'
                            }
                            ${isUploading ? 'pointer-events-none opacity-80' : ''}
                        `}
                        onDragEnter={handleDrag}
                        onDragLeave={handleDrag}
                        onDragOver={handleDrag}
                        onDrop={handleDrop}
                        onClick={triggerFileInput}
                    >
                        <input
                            ref={fileInputRef}
                            type="file"
                            className="hidden"
                            accept="image/*"
                            multiple
                            onChange={handleChange}
                            disabled={isUploading}
                        />

                        {isUploading ? (
                            <div className="flex flex-col items-center gap-3 z-10">
                                <div className="relative">
                                    <Loader2 className="w-12 h-12 text-purple-600 animate-spin" />
                                    <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-purple-600">
                                        {Math.round((uploadProgress.current / uploadProgress.total) * 100)}%
                                    </div>
                                </div>
                                <div className="text-center">
                                    <p className="text-sm font-medium text-purple-600 dark:text-purple-400">
                                        Subiendo fotos...
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                        {uploadProgress.current} de {uploadProgress.total}
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <>
                                <div className="w-14 h-14 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mb-2">
                                    <Upload className="w-7 h-7 text-purple-600 dark:text-purple-400" />
                                </div>
                                <div className="text-center space-y-1">
                                    <p className="font-medium text-gray-900 dark:text-white text-base">
                                        Haz click o arrastra imágenes aquí
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                        PNG, JPG, JPEG (Soporta múltiples archivos)
                                    </p>
                                </div>
                            </>
                        )}
                    </div>

                    {!clienteId && !clienteTelefono && (
                        <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg flex items-start gap-3 text-sm text-yellow-700 dark:text-yellow-300 border border-yellow-200 dark:border-yellow-800">
                            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                            <p>Este cliente no tiene información suficiente para asociar archivos. Intente actualizar su teléfono primero.</p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800/50 flex justify-end gap-3 border-t border-gray-200 dark:border-gray-800">
                    <Button variant="outline" onClick={onClose} disabled={isUploading}>
                        Cancelar
                    </Button>
                </div>
            </div>
        </div>
    );
}
