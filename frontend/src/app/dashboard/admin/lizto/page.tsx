'use client';

import { useState, useEffect } from 'react';
import { liztoApi, EspecialistaMappingData, ServicioMappingData } from '@/lib/api/lizto';
import { especialistasApi } from '@/lib/api/especialistas';
import { serviciosApi } from '@/lib/api/servicios';
import { Loader2, Save } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export default function LiztoMappingPage() {
    const [loading, setLoading] = useState(true);
    
    // SIAgenda Data
    const [especialistas, setEspecialistas] = useState<any[]>([]);
    const [servicios, setServicios] = useState<any[]>([]);

    // Mappings
    const [especialistaMappings, setEspecialistaMappings] = useState<EspecialistaMappingData[]>([]);
    const [servicioMappings, setServicioMappings] = useState<ServicioMappingData[]>([]);

    // Lizto Data
    const [liztoStaff, setLiztoStaff] = useState<any[]>([]);
    const [liztoServices, setLiztoServices] = useState<any[]>([]);
    
    // Tab
    const [activeTab, setActiveTab] = useState<'especialistas' | 'servicios'>('especialistas');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [
                espD,
                srvD,
                espMap,
                srvMap,
                lStaff,
                lServ
            ] = await Promise.all([
                especialistasApi.getActivos(),
                serviciosApi.getAll(),
                liztoApi.listarMappingEspecialistas(),
                liztoApi.listarMappingServicios(),
                liztoApi.listarStaffLizto(),
                liztoApi.listarServiciosLizto()
            ]);

            setEspecialistas(espD);
            setServicios(srvD);
            setEspecialistaMappings(espMap);
            setServicioMappings(srvMap);
            setLiztoStaff(lStaff);
            setLiztoServices(lServ);
        } catch (error) {
            console.error("Error cargando data Lizto", error);
            toast.error("Error al cargar datos. Verifique credenciales.");
        } finally {
            setLoading(false);
        }
    };

    const handleSaveEspecialista = async (especialista_id: number, lizto_staff_id: string) => {
        if (!lizto_staff_id) return;
        
        try {
            const staffMatch = liztoStaff.find((s: any) => s.id.toString() === lizto_staff_id);
            await liztoApi.guardarMappingEspecialista({
                especialista_id,
                lizto_staff_id: Number(lizto_staff_id),
                lizto_staff_name: staffMatch?.first_name ? `${staffMatch.first_name} ${staffMatch.last_name || ''}` : null
            });
            toast.success("Mapeo guardado");
            loadData();
        } catch (error) {
            toast.error("Error al guardar mapeo");
        }
    };

    const handleSaveServicio = async (servicio_id: number, lizto_service_id: string, lizto_price_id: string, price_value: string) => {
        if (!lizto_service_id) return;

        let finalPriceId = lizto_price_id;
        let finalPriceValue = price_value;

        // Intentar buscar variantes pero no bloquear si no existen
        if (!finalPriceId) {
            const selectedLiztoService = liztoServices.find((s: any) => s.id.toString() === lizto_service_id);
            // Intentamos buscar en varios campos posibles donde Lizto guarda precios
            const variants = selectedLiztoService?.service_price_values || selectedLiztoService?.prices || [];
            const firstVariant = variants[0];
            
            if (firstVariant) {
                finalPriceId = firstVariant.id.toString();
                finalPriceValue = firstVariant.price?.toString() || "0";
            } else {
                // Fallback: usar el ID del servicio como ID de precio y 0 como valor
                finalPriceId = lizto_service_id;
                finalPriceValue = "0";
            }
        }
        
        try {
            await liztoApi.guardarMappingServicio({
                servicio_id,
                lizto_service_id: Number(lizto_service_id),
                lizto_price_id: Number(finalPriceId),
                lizto_price_value: Number(finalPriceValue),
                lizto_service_name: liztoServices.find((s: any) => s.id.toString() === lizto_service_id)?.name
            });
            toast.success("Mapeo de servicio guardado");
            loadData();
        } catch (error) {
            toast.error("Error al guardar mapeo");
        }
    };

    if (loading) {
        return <div className="p-8 flex justify-center"><Loader2 className="animate-spin w-8 h-8 text-purple-600" /></div>;
    }

    return (
        <div className="p-6 max-w-6xl mx-auto">
            <h1 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
                Sincronización SIAgenda ↔ Lizto
            </h1>

            <div className="flex gap-4 mb-6">
                <button 
                    onClick={() => setActiveTab('especialistas')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'especialistas' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100'}`}
                >
                    Especialistas
                </button>
                <button 
                    onClick={() => setActiveTab('servicios')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'servicios' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100'}`}
                >
                    Servicios
                </button>
            </div>

            {activeTab === 'especialistas' && (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
                    <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 font-semibold bg-gray-50 dark:bg-gray-900 flex">
                        <div className="flex-1">SIAgenda</div>
                        <div className="flex-1">Lizto Staff</div>
                        <div className="w-24">Acción</div>
                    </div>
                    {especialistas.map(esp => {
                        const m = especialistaMappings.find(xm => xm.especialista_id === esp.id);
                        return <EspecialistaRow key={esp.id} esp={esp} mapping={m} liztoStaff={liztoStaff} onSave={handleSaveEspecialista} />;
                    })}
                </div>
            )}

            {activeTab === 'servicios' && (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
                    <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 font-semibold bg-gray-50 dark:bg-gray-900 flex">
                        <div className="flex-1">SIAgenda</div>
                        <div className="flex-1">Lizto Service</div>
                        <div className="flex-1">Lizto Price ID</div>
                        <div className="w-24">Acción</div>
                    </div>
                    {servicios.map(srv => {
                        const m = servicioMappings.find(xm => xm.servicio_id === srv.id);
                        return <ServicioRow key={srv.id} srv={srv} mapping={m} liztoServices={liztoServices} onSave={handleSaveServicio} />;
                    })}
                </div>
            )}
        </div>
    );
}

function EspecialistaRow({ esp, mapping, liztoStaff, onSave }: any) {
    const [val, setVal] = useState(mapping?.lizto_staff_id?.toString() || '');
    return (
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center gap-4">
            <div className="flex-1 font-medium">{esp.nombre} {esp.apellido}</div>
            <div className="flex-1">
                <select 
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-2 dark:bg-gray-700" 
                    value={val} 
                    onChange={(e) => setVal(e.target.value)}
                >
                    <option value="">Seleccione en Lizto</option>
                    {liztoStaff.map((ls: any) => (
                        <option key={ls.id} value={ls.id}>{ls.first_name} {ls.last_name}</option>
                    ))}
                </select>
            </div>
            <div className="w-24">
                <Button onClick={() => onSave(esp.id, val)} variant="outline" size="sm">
                    <Save className="w-4 h-4 mr-2" />
                    Guardar
                </Button>
            </div>
        </div>
    );
}

function ServicioRow({ srv, mapping, liztoServices, onSave }: any) {
    const [sVal, setSVal] = useState(mapping?.lizto_service_id?.toString() || '');
    const [pVal, setPVal] = useState(mapping?.lizto_price_id?.toString() || '');
    const [pPrice, setPPrice] = useState(mapping?.lizto_price_value?.toString() || '');

    const selectedLiztoService = liztoServices.find((s:any) => s.id.toString() === sVal);
    const priceVariants = selectedLiztoService?.service_price_values || [];

    return (
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center gap-4">
            <div className="flex-1 font-medium">{srv.nombre} (${srv.precio_base})</div>
            <div className="flex-1">
                <select 
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-2 dark:bg-gray-700" 
                    value={sVal} 
                    onChange={(e) => {
                        setSVal(e.target.value);
                        setPVal('');
                        setPPrice('');
                    }}
                >
                    <option value="">Seleccione Servicio Lizto</option>
                    {liztoServices.map((ls: any) => (
                        <option key={ls.id} value={ls.id}>{ls.name}</option>
                    ))}
                </select>
            </div>
            <div className="flex-1">
                <select 
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-2 dark:bg-gray-700" 
                    value={pVal} 
                    onChange={(e) => {
                        setPVal(e.target.value);
                        const variant = priceVariants.find((v:any) => v.id.toString() === e.target.value);
                        if (variant) setPPrice(variant.price);
                    }}
                    disabled={!sVal}
                >
                    <option value="">Seleccione Variante</option>
                    {priceVariants.map((v:any) => (
                        <option key={v.id} value={v.id}>{v.name} (${v.price})</option>
                    ))}
                </select>
            </div>
            <div className="w-24">
                <Button onClick={() => onSave(srv.id, sVal, pVal, pPrice)} variant="outline" size="sm">
                    <Save className="w-4 h-4 mr-2" />
                    Guardar
                </Button>
            </div>
        </div>
    );
}
