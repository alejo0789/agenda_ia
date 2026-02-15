'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCajaStore, useCarritoStore, useFacturaStore } from '@/stores/cajaStore';
import { useProductoStore } from '@/stores/inventarioStore';
import { useDescuentoStore } from '@/stores/descuentoStore';
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
import MetodosPagoModal from '@/components/caja/MetodosPagoModal';
import { toast } from 'sonner';
import { clientesApi } from '@/lib/api/clientes';
import { Switch } from '@/components/ui/switch';

export default function POSPage() {
    const router = useRouter();
    const { user } = useAuthStore();
    const { cajaActual, fetchCajaActual, metodosPago, fetchMetodosPago } = useCajaStore();
    const { productos, fetchProductos } = useProductoStore();
    const { descuentosActivos, fetchDescuentosActivos } = useDescuentoStore();
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
        setFacturasPendientesIds,
        aplicarPrecioColaborador,
        togglePrecioColaborador
    } = useCarritoStore();

    const [servicios, setServicios] = useState<Servicio[]>([]);
    const [especialistas, setEspecialistas] = useState<Especialista[]>([]);
    const [busqueda, setBusqueda] = useState('');
    const [tabActiva, setTabActiva] = useState<'servicios' | 'productos'>('servicios');
    const [especialistaSeleccionado, setEspecialistaSeleccionado] = useState<number | null>(null);
    const [showPagoModal, setShowPagoModal] = useState(false);
    const [showFacturasPendientes, setShowFacturasPendientes] = useState(false);
    const [showMetodosPagoModal, setShowMetodosPagoModal] = useState(false);
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
                    fetchDescuentosActivos(),
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
                fetchFactura(id).then(async factura => {
                    if (factura && factura.estado !== 'anulada') {
                        // 1. Limpiar todo
                        limpiarCarrito();

                        // 2. Setear estado
                        setFacturaEdicion(factura.id);

                        // Fetch client details to get es_colaborador status
                        if (factura.cliente_id) {
                            try {
                                const cliente = await clientesApi.getById(factura.cliente_id);
                                setCliente(factura.cliente_id, factura.cliente_nombre || null, cliente.es_colaborador);
                            } catch (e) {
                                console.error("Error fetching client details", e);
                                setCliente(factura.cliente_id, factura.cliente_nombre || null, false);
                            }
                        } else {
                            setCliente(null, null, false);
                        }

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
            p.estado === 'activo'
        );

    const handleAgregarItem = (tipo: 'servicio' | 'producto', item: Servicio | typeof productos[0]) => {
        if (!especialistaSeleccionado) return;

        const especialista = especialistas.find(e => e.id === especialistaSeleccionado);

        const isProducto = tipo === 'producto';
        const precio = isProducto
            ? (item as typeof productos[0]).precio_venta
            : (item as Servicio).precio_base;

        const precioColaborador = isProducto
            ? (item as typeof productos[0]).precio_colaborador
            : undefined;

        agregarItem({
            tipo,
            item_id: item.id,
            nombre: item.nombre,
            cantidad: 1,
            precio_unitario: precio,
            precio_regular: precio,
            precio_colaborador: precioColaborador || undefined,
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
    const handleCargarServiciosPendientes = async (
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

        // Fetch client details to get es_colaborador status
        try {
            const clienteFull = await clientesApi.getById(cliente.id);
            setCliente(cliente.id, cliente.nombre, clienteFull.es_colaborador);
        } catch (e) {
            console.error("Error fetching client details", e);
            setCliente(cliente.id, cliente.nombre, false);
        }

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
        <div className="h-[calc(100vh-60px)] md:h-[calc(100vh-80px)] flex flex-col lg:flex-row gap-2 relative">
            {/* Panel izquierdo - Header + Catálogo */}
            <div className={`flex-1 flex flex-col min-w-0 ${mobileView === 'cart' ? 'hidden lg:flex' : 'flex'}`}>
                {/* Header Móvil Compacto / Escritorio Normal */}
                <div className="flex items-center gap-2 mb-2">
                    {!isEspecialista && (
                        <Link
                            href="/dashboard/caja"
                            className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4" />
                        </Link>
                    )}
                    <div className="flex-1 min-w-0">
                        <h1 className="text-sm md:text-base font-bold text-gray-900 dark:text-gray-100 truncate leading-tight">
                            {isEspecialista ? 'Mis Servicios' : 'Punto de Venta'}
                        </h1>
                        <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold truncate leading-tight">
                            {especialistaSeleccionado
                                ? `Atiende: ${especialistas.find(e => e.id === especialistaSeleccionado)?.nombre} ${especialistas.find(e => e.id === especialistaSeleccionado)?.apellido || ''}`
                                : 'Selecciona especialista'}
                        </p>
                    </div>
                    {/* Botón Facturas en Espera - Solo Cajeros */}
                    {!isEspecialista && (
                        <button
                            onClick={() => setShowFacturasPendientes(true)}
                            className="flex items-center gap-1.5 px-2 py-1 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-medium rounded-lg shadow-md"
                        >
                            <Clock className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Pendientes</span>
                        </button>
                    )}

                </div>

                {/* Catálogo */}
                <div className="flex-1 flex flex-col bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden min-h-0">

                    {/* Selector de Cliente - Visible siempre para facilitar flujo */}
                    <div className="p-2 border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
                        <p className="text-[9px] font-black uppercase text-gray-400 mb-1 px-1">Cliente</p>
                        <ClienteSelector
                            value={clienteId ? { id: clienteId, nombre: clienteNombre || '' } : null}
                            onChange={(cliente) => setCliente(cliente?.id || null, cliente?.nombre || null, cliente?.es_colaborador)}
                            required={true}
                        />
                        <div className="mt-1">
                            <ClienteAbonoBanner clienteId={clienteId} />
                        </div>
                    </div>
                    {/* Tabs con iconos más grandes en móvil */}
                    <div className="flex border-b border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
                        <button
                            onClick={() => setTabActiva('servicios')}
                            className={`flex-1 py-2 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${tabActiva === 'servicios'
                                ? 'bg-white dark:bg-gray-900 text-emerald-600 border-b-2 border-emerald-600'
                                : 'text-gray-500'
                                }`}
                        >
                            <Scissors className="w-4 h-4" />
                            Servicios
                        </button>
                        <button
                            onClick={() => setTabActiva('productos')}
                            className={`flex-1 py-2 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${tabActiva === 'productos'
                                ? 'bg-white dark:bg-gray-900 text-purple-600 border-b-2 border-purple-600'
                                : 'text-gray-500'
                                }`}
                        >
                            <Package className="w-4 h-4" />
                            Productos
                        </button>
                    </div>

                    {/* Selector de especialista - Ahora visible para todos */}
                    <div className="p-2 border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
                        <p className="text-[9px] font-black uppercase text-gray-400 mb-1 px-1">Especialista Responsable</p>
                        <EspecialistaSelector
                            especialistas={especialistas}
                            value={especialistaSeleccionado}
                            onChange={(id) => setEspecialistaSeleccionado(id)}
                            placeholder="¿Quién realiza el servicio?"
                            className="w-full"
                        />
                    </div>



                    {/* Búsqueda Tap-Friendly con botón de limpiar */}
                    <div className="p-2 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                value={busqueda}
                                onChange={(e) => setBusqueda(e.target.value)}
                                placeholder={`Buscar ${tabActiva}...`}
                                className="w-full pl-9 pr-9 py-2 bg-gray-50 dark:bg-gray-800 border-none rounded-xl focus:ring-2 focus:ring-emerald-500 text-sm shadow-inner"
                            />
                            {busqueda && (
                                <button
                                    onClick={() => setBusqueda('')}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 bg-gray-200 dark:bg-gray-700 rounded-full"
                                >
                                    <X className="w-3 h-3 text-gray-500" />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Lista de items - Formato de Lista Vertical en Móvil */}
                    <div className="flex-1 overflow-y-auto p-2 custom-scrollbar bg-gray-50/30 dark:bg-gray-950/30">
                        <div className="flex flex-col gap-2">
                            {itemsFiltrados.map((item) => (
                                <button
                                    key={item.id}
                                    onClick={() => {
                                        handleAgregarItem(tabActiva === 'servicios' ? 'servicio' : 'producto', item);
                                        toast.success(`${item.nombre} añadido`, {
                                            position: 'bottom-center',
                                            duration: 1500,
                                            style: { marginBottom: '60px', borderRadius: '0.75rem' }
                                        });
                                    }}
                                    disabled={!especialistaSeleccionado}
                                    className={`relative p-2.5 rounded-xl border-2 text-left transition-all active:scale-[0.98] flex items-center gap-2.5 bg-white dark:bg-gray-800 shadow-sm group ${tabActiva === 'servicios'
                                        ? 'border-emerald-100 dark:border-emerald-900/10 hover:border-emerald-500'
                                        : 'border-purple-100 dark:border-purple-900/10 hover:border-purple-500'
                                        }`}
                                >
                                    {/* Icono / Miniatura */}
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-inner group-active:scale-90 transition-transform ${tabActiva === 'servicios' ? 'bg-emerald-50 text-emerald-600' : 'bg-purple-50 text-purple-600'}`}>
                                        {tabActiva === 'servicios' ? <Scissors className="w-5 h-5" /> : <Package className="w-5 h-5" />}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start">
                                            <p className="font-bold text-gray-900 dark:text-gray-100 text-sm leading-tight truncate">
                                                {item.nombre}
                                            </p>
                                        </div>
                                        <div className="mt-1 flex items-center gap-1.5">
                                            <span className={`text-base font-black ${tabActiva === 'servicios' ? 'text-emerald-600' : 'text-purple-600'}`}>
                                                {formatPrecio(tabActiva === 'servicios'
                                                    ? (item as Servicio).precio_base
                                                    : (item as typeof productos[0]).precio_venta
                                                )}
                                            </span>
                                            {'duracion_minutos' in item && (
                                                <span className="text-[9px] font-bold text-gray-400 bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded-md uppercase tracking-wider">
                                                    {item.duracion_minutos} MIN
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-lg transition-all group-active:rotate-90 ${tabActiva === 'servicios' ? 'bg-emerald-500 text-white' : 'bg-purple-500 text-white'}`}>
                                        <Plus className="w-4 h-4 stroke-[3]" />
                                    </div>
                                </button>
                            ))}
                            {itemsFiltrados.length === 0 && (
                                <div className="text-center py-10 opacity-40">
                                    <Search className="w-10 h-10 mx-auto mb-2" />
                                    <p className="text-base font-bold">No se encontró nada</p>
                                    <p className="text-sm">Intenta con otra búsqueda</p>
                                    {tabActiva === 'productos' && (
                                        <p className="text-xs mt-2 text-amber-600 dark:text-amber-500 font-medium">

                                        </p>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Botón flotante para ver pedido en móvil */}
                    <div className="lg:hidden p-2 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800">
                        <button
                            onClick={() => setMobileView('cart')}
                            className="w-full flex items-center justify-between px-4 py-2.5 bg-emerald-600 text-white rounded-xl shadow-xl shadow-emerald-200 dark:shadow-none font-bold animate-in fade-in slide-in-from-bottom-4"
                        >
                            <div className="flex items-center gap-2">
                                <div className="relative">
                                    <ShoppingCart className="w-5 h-5" />
                                    {items.length > 0 && (
                                        <span className="absolute -top-1.5 -right-1.5 bg-white text-emerald-600 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-black border-2 border-emerald-600">
                                            {items.length}
                                        </span>
                                    )}
                                </div>
                                <span className="text-sm">Ver Pedido</span>
                            </div>
                            <span className="text-base">{formatPrecio(total)}</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Panel derecho - Carrito */}
            <div className={`flex-1 lg:flex-none lg:w-80 xl:w-96 flex flex-col bg-white dark:bg-gray-900 lg:rounded-xl border border-gray-200 dark:border-gray-800 shadow-xl overflow-hidden ${mobileView === 'catalog' ? 'hidden lg:flex' : 'flex'}`}>
                {/* Header Carrito / Botón Volver en móvil */}
                <div className="p-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setMobileView('catalog')}
                            className="lg:hidden p-1 -ml-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <div className="flex items-center gap-1.5">
                            <ShoppingCart className="w-4 h-4 text-emerald-600" />
                            <span className="font-bold text-gray-900 dark:text-gray-100 uppercase tracking-tight text-xs">
                                {isEspecialista ? 'Pedido Actual' : 'Resumen Compra'}
                            </span>
                        </div>
                    </div>
                    {items.length > 0 && (
                        <button
                            onClick={limpiarCarrito}
                            className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                            title="Vaciar todo"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    )}
                </div>

                {/* Cliente Selector con enfoque móvil */}
                <div className="p-2 border-b border-gray-100 dark:border-gray-800">
                    <p className="text-[9px] font-black uppercase text-gray-400 mb-1">Cliente Obligatorio</p>
                    <ClienteSelector
                        value={clienteId ? { id: clienteId, nombre: clienteNombre || '' } : null}
                        onChange={(cliente) => setCliente(cliente?.id || null, cliente?.nombre || null, cliente?.es_colaborador)}
                        required={true}
                    />
                    <div className="mt-1">
                        <ClienteAbonoBanner clienteId={clienteId} />
                    </div>

                    {/* Toggle Precio Colaborador */}
                    {clienteId && (
                        <div className="mt-2 flex items-center justify-between bg-purple-50 dark:bg-purple-900/10 p-2 rounded-lg border border-purple-100 dark:border-purple-800/30">
                            <div className="flex flex-col">
                                <span className="text-xs font-semibold text-purple-700 dark:text-purple-300">Precio Colaborador</span>
                                <span className="text-[10px] text-purple-600/70 dark:text-purple-400/70">Aplicar precios especiales</span>
                            </div>
                            <Switch
                                checked={aplicarPrecioColaborador}
                                onCheckedChange={togglePrecioColaborador}
                                className="scale-75 origin-right"
                            />
                        </div>
                    )}
                </div>

                {/* Lista de Items del Carrito */}
                <div className="flex-1 overflow-y-auto p-2 space-y-2 bg-gray-50/30 dark:bg-gray-900/30">
                    {items.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-center text-gray-400 py-6 opacity-60">
                            <div className="w-14 h-14 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-2">
                                <ShoppingCart className="w-6 h-6" />
                            </div>
                            <p className="font-bold text-sm">El pedido está vacío</p>
                            <p className="text-xs">Regresa al catálogo para añadir servicios</p>
                        </div>
                    ) : (
                        items.map((item) => (
                            <div
                                key={item.id}
                                className="bg-white dark:bg-gray-800 rounded-xl p-2.5 shadow-sm border border-gray-100 dark:border-gray-800"
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex-1 pr-2">
                                        <p className="font-bold text-gray-900 dark:text-gray-100 leading-tight text-sm">
                                            {item.nombre}
                                        </p>
                                        <div className="flex items-center gap-1 mt-0.5 text-[10px] text-gray-500">
                                            <User className="w-2.5 h-2.5" />
                                            <span>{item.especialista_nombre}</span>
                                        </div>
                                        {item.precio_colaborador_aplicado && (
                                            <div className="mt-1">
                                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                                                    Precio Colaborador
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                    <button
                                        onClick={() => eliminarItem(item.id)}
                                        className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>

                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-0.5 bg-gray-100 dark:bg-gray-700 p-0.5 rounded-lg">
                                        <button
                                            onClick={() => item.cantidad > 1 && actualizarItem(item.id, { cantidad: item.cantidad - 1 })}
                                            className="w-7 h-7 flex items-center justify-center active:bg-white dark:active:bg-gray-600 rounded-md transition-colors"
                                        >
                                            <Minus className="w-3 h-3" />
                                        </button>
                                        <span className="w-7 text-center font-black text-sm">{item.cantidad}</span>
                                        <button
                                            onClick={() => actualizarItem(item.id, { cantidad: item.cantidad + 1 })}
                                            className="w-7 h-7 flex items-center justify-center active:bg-white dark:active:bg-gray-600 rounded-md transition-colors"
                                        >
                                            <Plus className="w-3 h-3" />
                                        </button>
                                    </div>
                                    <div className="flex flex-col items-end">
                                        <p className="font-black text-base text-emerald-600">
                                            {formatPrecio(item.precio_unitario * item.cantidad - item.descuento)}
                                        </p>
                                        {item.descuento > 0 && (
                                            <span className="text-[10px] text-red-500 font-medium">
                                                Ahurras {formatPrecio(item.descuento)}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div className="mt-2 flex flex-col gap-2 pt-2 border-t border-gray-100 dark:border-gray-700">
                                    <select
                                        value={item.descuento_id || ''}
                                        onChange={(e) => {
                                            const descId = parseInt(e.target.value);
                                            if (isNaN(descId)) {
                                                actualizarItem(item.id, {
                                                    descuento_id: undefined,
                                                    tipo_descuento: undefined,
                                                    valor_descuento: 0,
                                                    descuento: 0
                                                });
                                            } else {
                                                const desc = descuentosActivos.find(d => d.id === descId);
                                                if (desc) {
                                                    actualizarItem(item.id, {
                                                        descuento_id: desc.id,
                                                        tipo_descuento: desc.tipo,
                                                        valor_descuento: desc.valor
                                                    });
                                                }
                                            }
                                        }}
                                        className="w-full text-xs p-1.5 rounded border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800"
                                    >
                                        <option value="">Aplicar descuento...</option>
                                        {descuentosActivos.map(d => (
                                            <option key={d.id} value={d.id}>
                                                {d.nombre} ({d.tipo === 'porcentaje' ? `${d.valor}%` : `$${d.valor}`})
                                            </option>
                                        ))}
                                    </select>

                                    {item.tipo === 'producto' && (item.precio_colaborador || 0) > 0 && (
                                        <label className="flex items-center gap-2 text-xs cursor-pointer select-none">
                                            <input
                                                type="checkbox"
                                                checked={item.precio_colaborador_aplicado || false}
                                                onChange={(e) => actualizarItem(item.id, { precio_colaborador_aplicado: e.target.checked })}
                                                className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 w-3.5 h-3.5"
                                            />
                                            <span className={item.precio_colaborador_aplicado ? 'text-emerald-600 font-bold' : 'text-gray-500'}>
                                                Precio Colaborador: {formatPrecio(item.precio_colaborador!)}
                                            </span>
                                        </label>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Footer del Carrito / Acción Final */}
                <div className="p-2 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
                    {/* Botón IVA Móvil Compacto */}
                    <div className="flex items-center justify-between mb-2 px-1">
                        <span className="text-xs font-bold text-gray-600 dark:text-gray-400">Incluir IVA</span>
                        <button
                            onClick={() => setAplicarImpuestos(!aplicarImpuestos)}
                            className={`w-10 h-5 flex items-center rounded-full transition-colors ${aplicarImpuestos ? 'bg-emerald-500' : 'bg-gray-300'}`}
                        >
                            <div className={`w-3.5 h-3.5 bg-white rounded-full shadow-sm transition-transform mx-0.5 ${aplicarImpuestos ? 'translate-x-5' : 'translate-x-0'}`} />
                        </button>
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center justify-between px-1">
                            <span className="text-gray-400 font-bold uppercase text-[9px]">Total a Pagar</span>
                            <span className="text-2xl font-black text-gray-900 dark:text-gray-100 tracking-tighter">
                                {formatPrecio(total)}
                            </span>
                        </div>

                        <div className="flex gap-2">
                            {isEspecialista ? (
                                <button
                                    onClick={handleCrearOrden}
                                    disabled={items.length === 0 || !clienteId || creandoFactura}
                                    className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-black rounded-xl shadow-xl shadow-emerald-200 dark:shadow-none disabled:opacity-50 active:scale-95 transition-all flex items-center justify-center gap-2 text-sm"
                                >
                                    {creandoFactura ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                    {creandoFactura ? 'GUARDANDO...' : 'ENVIAR A CAJA'}
                                </button>
                            ) : (
                                <>
                                    <button
                                        onClick={handleCrearOrden}
                                        disabled={items.length === 0 || creandoFactura}
                                        className="flex-1 py-3 bg-white dark:bg-gray-800 border-2 border-amber-500 text-amber-600 dark:text-amber-500 font-black rounded-xl shadow-sm hover:bg-amber-50 dark:hover:bg-amber-900/10 active:scale-95 transition-all flex items-center justify-center gap-1.5 text-xs disabled:opacity-50"
                                        title="Poner esta factura en espera para cobrarla después"
                                    >
                                        <Clock className="w-4 h-4" />
                                        {creandoFactura ? '...' : 'ESPERA'}
                                    </button>
                                    <button
                                        onClick={() => setShowPagoModal(true)}
                                        disabled={items.length === 0 || !clienteId || creandoFactura}
                                        className="flex-[2] py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white font-black rounded-xl shadow-xl shadow-emerald-200 dark:shadow-none disabled:opacity-50 active:scale-95 transition-all flex items-center justify-center gap-2 text-sm"
                                    >
                                        {creandoFactura ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
                                        {creandoFactura ? 'PROCESANDO...' : 'COBRAR'}
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
            {/* Modal de Métodos de Pago */}
            <MetodosPagoModal
                isOpen={showMetodosPagoModal}
                onClose={() => setShowMetodosPagoModal(false)}
            />
        </div>
    );
}
