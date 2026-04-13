'use client';

import { useState, useEffect, useRef } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
    Image as ImageIcon, 
    Upload, 
    Check, 
    Loader2, 
    MessageSquare,
    X,
    FolderOpen
} from 'lucide-react';
import { filesApi } from '@/lib/api/files';
import { toast } from 'sonner';

interface Banner {
    name: string;
    url: string;
}

interface NotificationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (mediaUrl: string) => void;
    isSending: boolean;
}

export function NotificationModal({ isOpen, onClose, onConfirm, isSending }: NotificationModalProps) {
    const [view, setView] = useState<'options' | 'upload' | 'gallery'>('options');
    const [banners, setBanners] = useState<Banner[]>([]);
    const [selectedUrl, setSelectedUrl] = useState<string>('');
    const [isLoadingBanners, setIsLoadingBanners] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Cargar banners cuando se abre la galería
    useEffect(() => {
        if (view === 'gallery') {
            loadBanners();
        }
    }, [view]);

    const loadBanners = async () => {
        setIsLoadingBanners(true);
        try {
            const data = await filesApi.listBanners();
            setBanners(data);
        } catch (error) {
            console.error('Error cargando banners:', error);
            toast.error('Error al cargar la galería');
        } finally {
            setIsLoadingBanners(false);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        try {
            const res = await filesApi.uploadBanner(file);
            setSelectedUrl(res.url);
            toast.success('Imagen subida correctamente');
            setView('options');
        } catch (error) {
            console.error('Error subiendo banner:', error);
            toast.error('Error al subir la imagen');
        } finally {
            setIsUploading(false);
        }
    };

    const handleConfirm = () => {
        onConfirm(selectedUrl);
    };

    const resetModal = () => {
        setView('options');
        setSelectedUrl('');
        onClose();
    };

    const getImageUrl = (path: string) => {
        if (!path) return '';
        const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
        const root = apiBase.replace(/\/api$/, '');
        return `${root}${path}`;
    };

    return (
        <Dialog open={isOpen} onOpenChange={resetModal}>
            <DialogContent className="sm:max-w-[500px] border-none shadow-2xl overflow-hidden p-0 bg-white dark:bg-gray-900">
                <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-6 text-white">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold flex items-center gap-2 text-white">
                            <MessageSquare className="h-5 w-5" />
                            Confirmación de Envío
                        </DialogTitle>
                    </DialogHeader>
                    <p className="text-purple-100 text-sm mt-2">
                        ¿Deseas adjuntar una imagen promocional al recordatorio de cita?
                    </p>
                </div>

                <div className="p-6">
                    {view === 'options' && (
                        <div className="space-y-4">
                            {selectedUrl ? (
                                <div className="relative rounded-xl overflow-hidden border-2 border-purple-500 bg-gray-50 dark:bg-gray-800 animate-in zoom-in-95 duration-200">
                                    <img 
                                        src={getImageUrl(selectedUrl)} 
                                        alt="Seleccionada" 
                                        className="w-full h-48 object-contain"
                                    />
                                    <button 
                                        onClick={() => setSelectedUrl('')}
                                        className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-lg"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                    <div className="absolute bottom-0 inset-x-0 bg-black/50 backdrop-blur-sm p-2 text-white text-xs text-center">
                                        Imagen seleccionada para el envío
                                    </div>
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 gap-4">
                                    <button
                                        onClick={() => setView('upload')}
                                        className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-2xl hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all group"
                                    >
                                        <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                                            <Upload className="h-6 w-6 text-purple-600" />
                                        </div>
                                        <span className="font-semibold text-sm text-gray-900 dark:text-gray-100">Subir nueva</span>
                                    </button>
                                    <button
                                        onClick={() => setView('gallery')}
                                        className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-2xl hover:border-pink-500 hover:bg-pink-50 dark:hover:bg-pink-900/20 transition-all group"
                                    >
                                        <div className="w-12 h-12 rounded-full bg-pink-100 dark:bg-pink-900/50 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                                            <FolderOpen className="h-6 w-6 text-pink-600" />
                                        </div>
                                        <span className="font-semibold text-sm text-gray-900 dark:text-gray-100">Galería</span>
                                    </button>
                                </div>
                            )}

                            <div className="flex items-center gap-2 mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800">
                                <MessageSquare className="h-5 w-5 text-blue-600" />
                                <p className="text-sm text-blue-800 dark:text-blue-300">
                                    El mensaje se enviará a todos los clientes con cita <strong>agendada</strong> para la fecha seleccionada.
                                </p>
                            </div>
                        </div>
                    )}

                    {view === 'upload' && (
                        <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-purple-300 dark:border-purple-800 rounded-2xl bg-purple-50/30 dark:bg-purple-900/10">
                            {isUploading ? (
                                <div className="text-center">
                                    <Loader2 className="h-10 w-10 animate-spin text-purple-600 mx-auto mb-4" />
                                    <p className="text-gray-600">Subiendo imagen...</p>
                                </div>
                            ) : (
                                <>
                                    <Upload className="h-12 w-12 text-purple-400 mb-4" />
                                    <p className="text-gray-600 dark:text-gray-400 mb-4 text-center">
                                        Selecciona una imagen de tu dispositivo
                                    </p>
                                    <input 
                                        type="file" 
                                        ref={fileInputRef}
                                        onChange={handleFileUpload}
                                        className="hidden" 
                                        accept="image/*"
                                    />
                                    <Button onClick={() => fileInputRef.current?.click()}>
                                        Seleccionar Archivo
                                    </Button>
                                    <Button variant="ghost" className="mt-4" onClick={() => setView('options')}>
                                        Cancelar
                                    </Button>
                                </>
                            )}
                        </div>
                    )}

                    {view === 'gallery' && (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="font-bold text-gray-900 dark:text-white">Imágenes subidas</h3>
                                <Button variant="ghost" size="sm" onClick={() => setView('options')}>Volver</Button>
                            </div>
                            
                            {isLoadingBanners ? (
                                <div className="flex justify-center p-8">
                                    <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
                                </div>
                            ) : banners.length === 0 ? (
                                <p className="text-center text-gray-500 py-8 italic">No hay imágenes en la galería</p>
                            ) : (
                                <div className="grid grid-cols-3 gap-3 max-h-[300px] overflow-auto p-1">
                                    {banners.map((banner) => (
                                        <button
                                            key={banner.url}
                                            onClick={() => {
                                                setSelectedUrl(banner.url);
                                                setView('options');
                                            }}
                                            className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all hover:scale-105 ${
                                                selectedUrl === banner.url ? 'border-purple-500 ring-2 ring-purple-200' : 'border-gray-100 hover:border-purple-300'
                                            }`}
                                        >
                                            <img 
                                                src={getImageUrl(banner.url)} 
                                                alt={banner.name}
                                                className="w-full h-full object-cover"
                                            />
                                            {selectedUrl === banner.url && (
                                                <div className="absolute inset-0 bg-purple-500/20 flex items-center justify-center">
                                                    <div className="bg-white rounded-full p-1 shadow-lg">
                                                        <Check className="h-4 w-4 text-purple-600" />
                                                    </div>
                                                </div>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <DialogFooter className="p-6 bg-gray-50 dark:bg-gray-800/50 gap-2 sm:gap-0">
                    <Button variant="ghost" onClick={resetModal} disabled={isSending}>
                        Cancelar
                    </Button>
                    <Button 
                        onClick={handleConfirm}
                        className="bg-purple-600 hover:bg-purple-700 font-bold"
                        disabled={isSending}
                    >
                        {isSending ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Enviando...
                            </>
                        ) : (
                            <>
                                <Check className="h-4 w-4 mr-2" />
                                {selectedUrl ? 'Enviar con imagen' : 'Enviar solo texto'}
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
