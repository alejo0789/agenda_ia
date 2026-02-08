'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCajaStore, useCarritoStore, useFacturaStore } from '@/stores/cajaStore';
import { useProductoStore } from '@/stores/inventarioStore';
import { useAuthStore } from '@/stores/authStore';
import { Card, CardContent } from '@/components/ui/card';
import { formatPrecio } from '@/types/caja';
import {
    Search,
    Plus,
    Minus,
    Trash2,
    ShoppingCart,
    User,
    Package,
    Scissors,
    CreditCard,
    DollarSign,
    ArrowLeft,
    Loader2,
    X,
    Receipt,
    CheckCircle,
    Clock,
    Send,
    MessageSquare,
    Image as ImageIcon
} from 'lucide-react';
import Link from 'next/link';
import { serviciosApi } from '@/lib/api/servicios';
import { PhotoUploadModal } from '@/components/common/PhotoUploadModal';
import type { Servicio } from '@/types/servicio';
import type { AbonoAplicarCreate } from '@/types/caja';
import { especialistasApi } from '@/lib/api/especialistas';
import type { Especialista } from '@/types/especialista';
import PagoModal from '@/components/caja/PagoModal';
import EspecialistaSelector from '@/components/caja/EspecialistaSelector';
import ClienteSelector from '@/components/caja/ClienteSelector';
import ClienteAbonoBanner from '@/components/caja/ClienteAbonoBanner';
import FacturasPendientesModal from '@/components/caja/FacturasPendientesModal';
import { toast } from 'sonner';

export default function POSPage() {
    const router = useRouter();
    const { user } = useAuthStore();
    const { cajaActual, fetchCajaActual, metodosPago, fetchMetodosPago } = useCajaStore();
    const { productos, fetchProductos } = useProductoStore();
    const { crearFactura, crearOrden, isLoading: creandoFactura } = useFacturaStore();

    // Check role
    const isEspecialista = user?.rol?.nombre === 'Especialista';

    const {
        items,
        clienteId,
        clienteNombre,
        descuentoGeneral,
        subtotal,
        iva,
        total,
        agregarItem,
        actualizarItem,
        eliminarItem,
        setCliente,
        setDescuentoGeneral,
        setAplicarImpuestos,
        aplicarImpuestos,
        limpiarCarrito,
        setFacturaEdicion,
        setNotas,
        facturaEdicionId,
        notas,
        facturasPendientesIds,
        setFacturasPendientesIds
    } = useCarritoStore();

    const [servicios, setServicios] = useState<Servicio[]>([]);
    const [especialistas, setEspecialistas] = useState<Especialista[]>([]);
    const [busqueda, setBusqueda] = useState('');
    const [tabActiva, setTabActiva] = useState<'servicios' | 'productos'>('servicios');
    const [especialistaSeleccionado, setEspecialistaSeleccionado] = useState<number | null>(null);
    const [showPagoModal, setShowPagoModal] = useState(false);
    const [showFacturasPendientes, setShowFacturasPendientes] = useState(false);
    const [facturaCreada, setFacturaCreada] = useState<{ id: number; numero: string; type: 'factura' | 'orden' } | null>(null);
    const [isLoadingData, setIsLoadingData] = useState(true);
    const [pagosOriginales, setPagosOriginales] = useState<any[]>([]);
    const [abonosOriginales, setAbonosOriginales] = useState<any[]>([]);
    const [mobileView, setMobileView] = useState<'catalog' | 'cart'>('catalog');

    // Estado para modal de fotos
    const [showPhotoModal, setShowPhotoModal] = useState(false);
    const [clienteInfoForPhoto, setClienteInfoForPhoto] = useState<{ id: number; nombre: string; telefono?: string } | null>(null);

    useEffect(() => {
        const cargarDatos = async () => {
            setIsLoadingData(true);
            try {
                // If specialist, we don't necessarily need cajaActual strict check, but good to have context.
                // However, they can create orders even if caja is closed (conceptually), but backend checks it.
                // Let's assume backend requires open caja.
                await Promise.all([
                    fetchCajaActual(),
                    fetchMetodosPago(),
                    fetchProductos({ estado: 'activo' }),
                ]);

                // Cargar servicios (vienen agrupados por categoría)
                const serviciosAgrupados = await serviciosApi.getActivosPorCategoria();
                const servsFlat = serviciosAgrupados.flatMap(g => g.servicios);
                setServicios(servsFlat);

                // Cargar especialistas
                const esps = await especialistasApi.getAll({ estado: 'activo' });
                setEspecialistas(esps);

                // Seleccionar especialista por defecto
                if (isEspecialista && user?.especialista_id) {
                    setEspecialistaSeleccionado(user.especialista_id);
                } else if (esps.length > 0) {
                    setEspecialistaSeleccionado(esps[0].id);
                }
            } catch (err) {
                console.error('Error cargando datos:', err);
            } finally {
                setIsLoadingData(false);
            }
        };

        cargarDatos();
    }, [fetchCajaActual, fetchMetodosPago, fetchProductos, isEspecialista, user?.especialista_id]);

    const searchParams = useSearchParams();
    const editarFacturaId = searchParams.get('editar_factura');
    const { fetchFactura } = useFacturaStore();

    useEffect(() => {
        if (editarFacturaId) {
            const id = parseInt(editarFacturaId);
            if (!isNaN(id)) {
                fetchFactura(id).then(factura => {
                    if (factura && factura.estado !== 'anulada') {
                        // 1. Limpiar todo
                        limpiarCarrito();

                        // 2. Setear estado
                        setFacturaEdicion(factura.id);
                        setCliente(factura.cliente_id || null, factura.cliente_nombre || null);
                        setNotas(factura.notas || '');
                        setAplicarImpuestos(factura.impuestos > 0);
                        setPagosOriginales(factura.pagos || []);
                        setAbonosOriginales(factura.abonos_aplicados || []);

                        // 3. Agregar items
                        factura.detalle.forEach(d => {
                            agregarItem({
                                tipo: d.tipo,
                                item_id: d.item_id,
                                nombre: d.item_nombre,
                                cantidad: d.cantidad,
                                precio_unitario: d.precio_unitario,
                                descuento: d.descuento_linea,
                                especialista_id: d.especialista_id || 0,
                                especialista_nombre: d.especialista_nombre || 'Sin especialista',
                                detalle_id: d.id
                            });
                        });
                        toast.info(`Editando factura #${factura.numero_factura}`);
                    }
                });
            }
        }
    }, [editarFacturaId, fetchFactura, limpiarCarrito, setFacturaEdicion, setCliente, setNotas, setAplicarImpuestos, agregarItem]);

    // Redirigir si no hay caja abierta
    useEffect(() => {
        if (!isLoadingData && !cajaActual) {
            router.push('/dashboard/caja');
        }
    }, [cajaActual, isLoadingData, router]);

    const itemsFiltrados = tabActiva === 'servicios'
        ? servicios.filter(s =>
            s.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
            s.categoria?.nombre?.toLowerCase().includes(busqueda.toLowerCase())
        )
        : productos.filter(p =>
            p.nombre.toLowerCase().includes(busqueda.toLowerCase()) &&
            p.estado === 'activo' &&
            (p.stock_total ?? 0) > 0
        );

    const handleAgregarItem = (tipo: 'servicio' | 'producto', item: Servicio | typeof productos[0]) => {
        if (!especialistaSeleccionado) return;

        const especialista = especialistas.find(e => e.id === especialistaSeleccionado);

        agregarItem({
            tipo,
            item_id: item.id,
            nombre: item.nombre,
            cantidad: 1,
            precio_unitario: tipo === 'servicio'
                ? (item as Servicio).precio_base
                : (item as typeof productos[0]).precio_venta,
            descuento: 0,
            especialista_id: especialistaSeleccionado,
            especialista_nombre: especialista ? `${especialista.nombre} ${especialista.apellido}` : '',
        });
    };

    const handleCrearOrden = async () => {
        if (items.length === 0) {
            toast.error('El carrito está vacío');
            return;
        }

        try {
            const factura = await crearOrden({
                cliente_id: clienteId || undefined,
                detalle: items.map(item => ({
                    tipo: item.tipo,
                    item_id: item.item_id,
                    cantidad: item.cantidad,
                    precio_unitario: item.precio_unitario,
                    descuento_linea: item.descuento || 0,
                    especialista_id: item.especialista_id,
                    cita_id: item.cita_id,
                })),
                pagos: [],
                abonos_aplicar: [],
                descuento: 0,
                aplicar_impuestos: aplicarImpuestos,
                notas: notas,
                facturas_pendientes_ids: facturasPendientesIds,
                factura_id_remplazar: facturaEdicionId || undefined,
            });

            setFacturaCreada({ id: factura.id, numero: factura.numero_factura, type: 'orden' });

            // Preparar info para subir fotos (si es especialista)
            if (isEspecialista && clienteId && clienteNombre) {
                // Notar que no tenemos el telefono aca directo en el carrito, pero el modal de fotos maneja eso o podemos buscarlo.
                // Como workaround rapido, pasamos lo que tenemos.
                // Idealmente el carrito deberia tener mas info del cliente o buscarla.
                // Pero el PhotoUploadModal hace la carga si falta info? No, necesita IDs.
                // Asumiremos que el ID es suficiente para que el usuario o el sistema funcione,
                // Ojala el clienteId sea suficiente.
                setClienteInfoForPhoto({ id: clienteId, nombre: clienteNombre });
            }

            limpiarCarrito();
            toast.success('Orden enviada a facturación correctamente');
        } catch (err) {
            console.error('Error al crear orden:', err);
            toast.error('Error al crear la orden');
        }
    };

    const handlePagar = async (
        pagos: Array<{ metodo_pago_id: number; monto: number; referencia_pago?: string }>,
        abonos?: AbonoAplicarCreate[],
        abonosPreviosIds?: number[],
        pagosPreviosModificados?: Array<{ id: number; metodo_pago_id: number; monto: number; referencia_pago?: string }>
    ) => {
        if (!clienteId && items.length > 0) {
            toast.error('Debes seleccionar un cliente para facturar');
            return;
        }

        try {
            if (facturaEdicionId) {
                // Modo Actualización
                const todosLosPagos = [
                    ...(pagosPreviosModificados || pagosOriginales).map(p => ({
                        id: p.id,
                        metodo_pago_id: p.metodo_pago_id,
                        monto: p.monto,
                        referencia_pago: p.referencia_pago
                    })),
                    ...pagos.map(p => ({
                        metodo_pago_id: p.metodo_pago_id,
                        monto: p.monto,
                        referencia_pago: p.referencia_pago
                    }))
                ];

                let abonosPreviosFiltrados = abonosOriginales;
                if (abonosPreviosIds) {
                    abonosPreviosFiltrados = abonosOriginales.filter(a => abonosPreviosIds.includes(a.abono_id));
                }

                const todosLosAbonos = [
                    ...abonosPreviosFiltrados.map(a => ({
                        id: 0,
                        abono_id: a.abono_id,
                        monto_aplicado: a.monto_aplicado
                    })),
                    ...(abonos || []).map(a => ({
                        id: 0,
                        abono_id: a.abono_id,
                        monto_aplicado: a.monto
                    }))
                ];

                const { actualizarFactura } = useFacturaStore.getState();
                await actualizarFactura(facturaEdicionId, {
                    detalle: items.map(item => ({
                        id: item.detalle_id,
                        item_id: item.item_id,
                        tipo: item.tipo,
                        item_nombre: item.nombre,
                        cantidad: item.cantidad,
                        precio_unitario: item.precio_unitario,
                        descuento_linea: item.descuento,
                        especialista_id: item.especialista_id
                    })),
                    pagos: todosLosPagos,
                    abonos: todosLosAbonos,
                    notas: useCarritoStore.getState().notas,
                    aplicar_impuestos: aplicarImpuestos
                });
                toast.success('Factura actualizada correctamente');
                setFacturaEdicion(null);
                router.push(`/dashboard/caja/facturas/${facturaEdicionId}`);
            } else {
                // Modo Creación
                const factura = await crearFactura({
                    cliente_id: clienteId || undefined,
                    detalle: items.map(item => ({
                        tipo: item.tipo,
                        item_id: item.item_id,
                        cantidad: item.cantidad,
                        precio_unitario: item.precio_unitario,
                        descuento_linea: item.descuento,
                        especialista_id: item.especialista_id,
                        cita_id: item.cita_id,
                    })),
                    pagos,
                    abonos_aplicar: abonos,
                    descuento: descuentoGeneral,
                    aplicar_impuestos: aplicarImpuestos,
                    facturas_pendientes_ids: facturasPendientesIds,
                });

                setFacturaCreada({ id: factura.id, numero: factura.numero_factura, type: 'factura' });
            }
            setShowPagoModal(false);
            limpiarCarrito();
        } catch (err) {
            console.error('Error al procesar factura:', err);
            toast.error('Error al procesar la factura');
        }
    };

    // Cargar servicios pendientes al carrito
    const handleCargarServiciosPendientes = (
        cliente: { id: number; nombre: string },
        itemsPendientes: Array<{
            id: number;
            tipo: 'servicio' | 'producto';
            servicio_id: number | null;
            producto_id: number | null;
            servicio_nombre: string;
            servicio_precio: number;
            cantidad?: number;
            especialista_id: number;
            especialista_nombre: string;
        }>
    ) => {
        limpiarCarrito();
        setCliente(cliente.id, cliente.nombre);
        setFacturasPendientesIds(itemsPendientes.map(item => item.id));
        itemsPendientes.forEach(item => {
            agregarItem({
                tipo: item.tipo,
                item_id: (item.tipo === 'servicio' ? item.servicio_id : item.producto_id) || 0,
                nombre: item.servicio_nombre,
                cantidad: item.cantidad || 1,
                precio_unitario: item.servicio_precio,
                descuento: 0,
                especialista_id: item.especialista_id,
                especialista_nombre: item.especialista_nombre,
                factura_pendiente_id: item.id,
            });
        });
        toast.success(`${itemsPendientes.length} item(s) cargados al carrito`);
    };

    if (isLoadingData) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
            </div>
        );
    }

    // Modal de éxito
    if (facturaCreada) {
        return (
            <div className="max-w-md mx-auto mt-20">
                <Card className="text-center">
                    <CardContent className="p-8">
                        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-emerald-100 dark:bg-emerald-900/20 flex items-center justify-center">
                            <CheckCircle className="w-10 h-10 text-emerald-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                            {facturaCreada.type === 'orden' ? '¡Orden Enviada!' : '¡Venta Exitosa!'}
                        </h2>
                        <p className="text-gray-500 mb-6">
                            {facturaCreada.type === 'orden'
                                ? `Orden #${facturaCreada.numero} lista para facturación.`
                                : `Factura ${facturaCreada.numero} creada correctamente.`
                            }
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => {
                                    setFacturaCreada(null);
                                    setMobileView('catalog');
                                }}
                                className="flex-1 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors font-medium"
                            >
                                {facturaCreada.type === 'orden' ? 'Nueva Orden' : 'Nueva Venta'}
                            </button>
                            {facturaCreada.type === 'factura' && (
                                <Link
                                    href={`/dashboard/caja/facturas/${facturaCreada.id}`}
                                    className="flex-1 py-3 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors font-medium flex items-center justify-center gap-2"
                                >
                                    <Receipt className="w-4 h-4" />
                                    Ver Factura
                                </Link>
                            )}
                        </div>

                        {/* Botón para subir fotos despues de crear la orden */}
                        {isEspecialista && clienteInfoForPhoto && (
                            <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                                <p className="text-sm text-gray-500 mb-3">¿Deseas subir fotos del resultado?</p>
                                <button
                                    onClick={() => setShowPhotoModal(true)}
                                    className="w-full py-2.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-xl hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors font-medium flex items-center justify-center gap-2"
                                >
                                    <ImageIcon className="w-4 h-4" />
                                    Subir Fotos del Cliente
                                </button>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Modal de Subida de Fotos en vista de exito */}
                {showPhotoModal && clienteInfoForPhoto && (
                    <PhotoUploadModal
                        isOpen={showPhotoModal}
                        onClose={() => setShowPhotoModal(false)}
                        clienteId={clienteInfoForPhoto.id}
                        clienteNombre={clienteInfoForPhoto.nombre}
                    />
                )}
            </div>
        );
    }

    return (
        <div className="h-[calc(100vh-80px)] md:h-[calc(100vh-120px)] flex flex-col lg:flex-row gap-4 relative">
            {/* Panel izquierdo - Header + Catálogo */}
            <div className={`flex-1 flex flex-col min-w-0 ${mobileView === 'cart' ? 'hidden lg:flex' : 'flex'}`}>
                {/* Header Móvil Compacto / Escritorio Normal */}
                <div className="flex items-center gap-3 mb-3">
                    {!isEspecialista && (
                        <Link
                            href="/dashboard/caja"
                            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </Link>
                    )}
                    <div className="flex-1 min-w-0">
                        <h1 className="text-lg md:text-xl font-bold text-gray-900 dark:text-gray-100 truncate">
                            {isEspecialista ? 'Mis Servicios' : 'Punto de Venta'}
                        </h1>
                        <p className="text-xs text-emerald-600 dark:text-emerald-400 font-bold truncate">
                            {especialistaSeleccionado
                                ? `Atiende: ${especialistas.find(e => e.id === especialistaSeleccionado)?.nombre} ${especialistas.find(e => e.id === especialistaSeleccionado)?.apellido || ''}`
                                : 'Selecciona especialista'}
                        </p>
                    </div>
                    {/* Botón Facturas en Espera - Solo Cajeros */}
                    {!isEspecialista && (
                        <button
                            onClick={() => setShowFacturasPendientes(true)}
                            className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-sm font-medium rounded-lg shadow-md"
                        >
                            <Clock className="w-4 h-4" />
                            <span className="hidden sm:inline">Pendientes</span>
                        </button>
                    )}
                </div>

                {/* Catálogo */}
                <div className="flex-1 flex flex-col bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden min-h-0">

                    {/* Selector de Cliente - Visible siempre para facilitar flujo */}
                    <div className="p-4 border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
                        <p className="text-[10px] font-black uppercase text-gray-400 mb-2 px-1">Cliente</p>
                        <ClienteSelector
                            value={clienteId ? { id: clienteId, nombre: clienteNombre || '' } : null}
                            onChange={(cliente) => setCliente(cliente?.id || null, cliente?.nombre || null)}
                            required={true}
                        />
                        <div className="mt-2">
                            <ClienteAbonoBanner clienteId={clienteId} />
                        </div>
                    </div>
                    {/* Tabs con iconos más grandes en móvil */}
                    <div className="flex border-b border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
                        <button
                            onClick={() => setTabActiva('servicios')}
                            className={`flex-1 py-4 text-sm font-semibold flex items-center justify-center gap-2 transition-all ${tabActiva === 'servicios'
                                ? 'bg-white dark:bg-gray-900 text-emerald-600 border-b-2 border-emerald-600'
                                : 'text-gray-500'
                                }`}
                        >
                            <Scissors className="w-5 h-5" />
                            Servicios
                        </button>
                        <button
                            onClick={() => setTabActiva('productos')}
                            className={`flex-1 py-4 text-sm font-semibold flex items-center justify-center gap-2 transition-all ${tabActiva === 'productos'
                                ? 'bg-white dark:bg-gray-900 text-purple-600 border-b-2 border-purple-600'
                                : 'text-gray-500'
                                }`}
                        >
                            <Package className="w-5 h-5" />
                            Productos
                        </button>
                    </div>

                    {/* Selector de especialista - Ahora visible para todos */}
                    <div className="p-4 border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
                        <p className="text-[10px] font-black uppercase text-gray-400 mb-2 px-1">Especialista Responsable</p>
                        <EspecialistaSelector
                            especialistas={especialistas}
                            value={especialistaSeleccionado}
                            onChange={(id) => setEspecialistaSeleccionado(id)}
                            placeholder="¿Quién realiza el servicio?"
                            className="w-full"
                        />
                    </div>



                    {/* Búsqueda Tap-Friendly con botón de limpiar */}
                    <div className="p-4 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-400" />
                            <input
                                type="text"
                                value={busqueda}
                                onChange={(e) => setBusqueda(e.target.value)}
                                placeholder={`Buscar ${tabActiva}...`}
                                className="w-full pl-12 pr-12 py-4 bg-gray-50 dark:bg-gray-800 border-none rounded-2xl focus:ring-2 focus:ring-emerald-500 text-lg shadow-inner"
                            />
                            {busqueda && (
                                <button
                                    onClick={() => setBusqueda('')}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-gray-200 dark:bg-gray-700 rounded-full"
                                >
                                    <X className="w-4 h-4 text-gray-500" />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Lista de items - Formato de Lista Vertical en Móvil */}
                    <div className="flex-1 overflow-y-auto p-3 sm:p-4 custom-scrollbar bg-gray-50/30 dark:bg-gray-950/30">
                        <div className="flex flex-col gap-3">
                            {itemsFiltrados.map((item) => (
                                <button
                                    key={item.id}
                                    onClick={() => {
                                        handleAgregarItem(tabActiva === 'servicios' ? 'servicio' : 'producto', item);
                                        toast.success(`${item.nombre} añadido`, {
                                            position: 'bottom-center',
                                            duration: 1500,
                                            style: { marginBottom: '80px', borderRadius: '1rem' }
                                        });
                                    }}
                                    disabled={!especialistaSeleccionado}
                                    className={`relative p-4 rounded-2xl border-2 text-left transition-all active:scale-[0.98] flex items-center gap-4 bg-white dark:bg-gray-800 shadow-sm group ${tabActiva === 'servicios'
                                        ? 'border-emerald-100 dark:border-emerald-900/10 hover:border-emerald-500'
                                        : 'border-purple-100 dark:border-purple-900/10 hover:border-purple-500'
                                        }`}
                                >
                                    {/* Icono / Miniatura */}
                                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-inner group-active:scale-90 transition-transform ${tabActiva === 'servicios' ? 'bg-emerald-50 text-emerald-600' : 'bg-purple-50 text-purple-600'}`}>
                                        {tabActiva === 'servicios' ? <Scissors className="w-8 h-8" /> : <Package className="w-8 h-8" />}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start">
                                            <p className="font-extrabold text-gray-900 dark:text-gray-100 text-lg leading-tight truncate px-1">
                                                {item.nombre}
                                            </p>
                                        </div>
                                        <div className="mt-2 flex items-center gap-2">
                                            <span className={`text-xl font-black ${tabActiva === 'servicios' ? 'text-emerald-600' : 'text-purple-600'}`}>
                                                {formatPrecio(tabActiva === 'servicios'
                                                    ? (item as Servicio).precio_base
                                                    : (item as typeof productos[0]).precio_venta
                                                )}
                                            </span>
                                            {'duracion_minutos' in item && (
                                                <span className="text-[10px] font-bold text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-md uppercase tracking-widest">
                                                    {item.duracion_minutos} MIN
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-lg transition-all group-active:rotate-90 ${tabActiva === 'servicios' ? 'bg-emerald-500 text-white' : 'bg-purple-500 text-white'}`}>
                                        <Plus className="w-6 h-6 stroke-[3]" />
                                    </div>
                                </button>
                            ))}
                            {itemsFiltrados.length === 0 && (
                                <div className="text-center py-20 opacity-40">
                                    <Search className="w-16 h-16 mx-auto mb-4" />
                                    <p className="text-xl font-bold">No se encontró nada</p>
                                    <p>Intenta con otra búsqueda</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Botón flotante para ver pedido en móvil */}
                    <div className="lg:hidden p-4 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800">
                        <button
                            onClick={() => setMobileView('cart')}
                            className="w-full flex items-center justify-between px-6 py-4 bg-emerald-600 text-white rounded-2xl shadow-xl shadow-emerald-200 dark:shadow-none font-bold animate-in fade-in slide-in-from-bottom-4"
                        >
                            <div className="flex items-center gap-3">
                                <div className="relative">
                                    <ShoppingCart className="w-6 h-6" />
                                    {items.length > 0 && (
                                        <span className="absolute -top-2 -right-2 bg-white text-emerald-600 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black border-2 border-emerald-600">
                                            {items.length}
                                        </span>
                                    )}
                                </div>
                                <span>Ver Pedido</span>
                            </div>
                            <span className="text-lg">{formatPrecio(total)}</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Panel derecho - Carrito */}
            <div className={`flex-1 lg:flex-none lg:w-96 xl:w-[420px] flex flex-col bg-white dark:bg-gray-900 lg:rounded-2xl border border-gray-200 dark:border-gray-800 shadow-xl overflow-hidden ${mobileView === 'catalog' ? 'hidden lg:flex' : 'flex'}`}>
                {/* Header Carrito / Botón Volver en móvil */}
                <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setMobileView('catalog')}
                            className="lg:hidden p-2 -ml-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors"
                        >
                            <ArrowLeft className="w-6 h-6" />
                        </button>
                        <div className="flex items-center gap-2">
                            <ShoppingCart className="w-5 h-5 text-emerald-600" />
                            <span className="font-bold text-gray-900 dark:text-gray-100 uppercase tracking-tight">
                                {isEspecialista ? 'Pedido Actual' : 'Resumen Compra'}
                            </span>
                        </div>
                    </div>
                    {items.length > 0 && (
                        <button
                            onClick={limpiarCarrito}
                            className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                            title="Vaciar todo"
                        >
                            <Trash2 className="w-5 h-5" />
                        </button>
                    )}
                </div>

                {/* Cliente Selector con enfoque móvil */}
                <div className="p-4 border-b border-gray-100 dark:border-gray-800">
                    <p className="text-[10px] font-black uppercase text-gray-400 mb-2">Cliente Obligatorio</p>
                    <ClienteSelector
                        value={clienteId ? { id: clienteId, nombre: clienteNombre || '' } : null}
                        onChange={(cliente) => setCliente(cliente?.id || null, cliente?.nombre || null)}
                        required={true}
                    />
                    <div className="mt-2">
                        <ClienteAbonoBanner clienteId={clienteId} />
                    </div>
                </div>

                {/* Lista de Items del Carrito */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50/30 dark:bg-gray-900/30">
                    {items.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-center text-gray-400 py-10 opacity-60">
                            <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                                <ShoppingCart className="w-8 h-8" />
                            </div>
                            <p className="font-bold">El pedido está vacío</p>
                            <p className="text-sm">Regresa al catálogo para añadir servicios</p>
                        </div>
                    ) : (
                        items.map((item) => (
                            <div
                                key={item.id}
                                className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-800"
                            >
                                <div className="flex justify-between items-start mb-3">
                                    <div className="flex-1 pr-2">
                                        <p className="font-bold text-gray-900 dark:text-gray-100 leading-tight">
                                            {item.nombre}
                                        </p>
                                        <div className="flex items-center gap-1.5 mt-1 text-xs text-gray-500">
                                            <User className="w-3 h-3" />
                                            <span>{item.especialista_nombre}</span>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => eliminarItem(item.id)}
                                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700 p-1 rounded-xl">
                                        <button
                                            onClick={() => item.cantidad > 1 && actualizarItem(item.id, { cantidad: item.cantidad - 1 })}
                                            className="w-10 h-10 flex items-center justify-center active:bg-white dark:active:bg-gray-600 rounded-lg transition-colors"
                                        >
                                            <Minus className="w-4 h-4" />
                                        </button>
                                        <span className="w-8 text-center font-black text-lg">{item.cantidad}</span>
                                        <button
                                            onClick={() => actualizarItem(item.id, { cantidad: item.cantidad + 1 })}
                                            className="w-10 h-10 flex items-center justify-center active:bg-white dark:active:bg-gray-600 rounded-lg transition-colors"
                                        >
                                            <Plus className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <p className="font-black text-xl text-emerald-600">
                                        {formatPrecio(item.precio_unitario * item.cantidad - item.descuento)}
                                    </p>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Footer del Carrito / Acción Final */}
                <div className="p-4 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
                    {/* Botón IVA Móvil Compacto */}
                    <div className="flex items-center justify-between mb-4 px-2">
                        <span className="text-sm font-bold text-gray-600 dark:text-gray-400">Incluir IVA</span>
                        <button
                            onClick={() => setAplicarImpuestos(!aplicarImpuestos)}
                            className={`w-12 h-6 flex items-center rounded-full transition-colors ${aplicarImpuestos ? 'bg-emerald-500' : 'bg-gray-300'}`}
                        >
                            <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform mx-1 ${aplicarImpuestos ? 'translate-x-6' : 'translate-x-0'}`} />
                        </button>
                    </div>

                    <div className="space-y-3">
                        <div className="flex items-center justify-between px-2">
                            <span className="text-gray-400 font-bold uppercase text-[10px]">Total a Pagar</span>
                            <span className="text-3xl font-black text-gray-900 dark:text-gray-100 tracking-tighter">
                                {formatPrecio(total)}
                            </span>
                        </div>

                        <div className="flex gap-3">
                            {isEspecialista ? (
                                <button
                                    onClick={handleCrearOrden}
                                    disabled={items.length === 0 || !clienteId || creandoFactura}
                                    className="w-full py-5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-black rounded-2xl shadow-xl shadow-emerald-200 dark:shadow-none disabled:opacity-50 active:scale-95 transition-all flex items-center justify-center gap-3 text-lg"
                                >
                                    {creandoFactura ? <Loader2 className="w-6 h-6 animate-spin" /> : <Send className="w-6 h-6" />}
                                    {creandoFactura ? 'GUARDANDO...' : 'ENVIAR A CAJA'}
                                </button>
                            ) : (
                                <>
                                    <button
                                        onClick={handleCrearOrden}
                                        disabled={items.length === 0 || creandoFactura}
                                        className="flex-1 py-5 bg-white dark:bg-gray-800 border-2 border-amber-500 text-amber-600 dark:text-amber-500 font-black rounded-2xl shadow-sm hover:bg-amber-50 dark:hover:bg-amber-900/10 active:scale-95 transition-all flex items-center justify-center gap-2 text-lg disabled:opacity-50"
                                        title="Poner esta factura en espera para cobrarla después"
                                    >
                                        <Clock className="w-6 h-6" />
                                        {creandoFactura ? '...' : 'EN ESPERA'}
                                    </button>
                                    <button
                                        onClick={() => setShowPagoModal(true)}
                                        disabled={items.length === 0 || !clienteId || creandoFactura}
                                        className="flex-[2] py-5 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white font-black rounded-2xl shadow-xl shadow-emerald-200 dark:shadow-none disabled:opacity-50 active:scale-95 transition-all flex items-center justify-center gap-3 text-lg"
                                    >
                                        {creandoFactura ? <Loader2 className="w-6 h-6 animate-spin" /> : <CreditCard className="w-6 h-6" />}
                                        {creandoFactura ? 'PROCESANDO...' : 'COBRAR AHORA'}
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal de pago */}
            {!isEspecialista && showPagoModal && (
                <PagoModal
                    total={total}
                    metodosPago={metodosPago}
                    onClose={() => setShowPagoModal(false)}
                    onPagar={handlePagar}
                    isLoading={creandoFactura}
                    clienteId={clienteId}
                    pagosPrevios={pagosOriginales}
                    abonosPrevios={abonosOriginales}
                />
            )}

            <FacturasPendientesModal
                isOpen={showFacturasPendientes}
                onClose={() => setShowFacturasPendientes(false)}
                onCargarServicios={handleCargarServiciosPendientes}
            />

            {/* Modal de Subida de Fotos */}
            {showPhotoModal && clienteInfoForPhoto && (
                <PhotoUploadModal
                    isOpen={showPhotoModal}
                    onClose={() => setShowPhotoModal(false)}
                    clienteId={clienteInfoForPhoto.id}
                    clienteNombre={clienteInfoForPhoto.nombre}
                // El telefono podria faltar aqui si solo viene del carrito, 
                // pero el modal intentará usar el ID si no hay telefono, o el backend resolverá.
                // Ajustamos el modal para que acepte solo ID si es necesario o buscamos el cliente completo antes.
                />
            )}
        </div>
    );
}
