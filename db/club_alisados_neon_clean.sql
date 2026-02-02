--
-- PostgreSQL database dump
--


-- Dumped from database version 18.1
-- Dumped by pg_dump version 18.1

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: actualizar_stock_factura(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.actualizar_stock_factura() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    IF NEW.tipo = 'producto' THEN
        UPDATE productos 
        SET stock_actual = stock_actual - NEW.cantidad
        WHERE id = NEW.item_id;
        
        -- Registrar movimiento
        INSERT INTO movimientos_inventario (producto_id, tipo, cantidad, cantidad_anterior, cantidad_nueva, motivo, documento_referencia)
        SELECT 
            NEW.item_id, 
            'salida', 
            NEW.cantidad,
            stock_actual + NEW.cantidad,
            stock_actual,
            'Venta',
            (SELECT numero_factura FROM facturas WHERE id = NEW.factura_id)
        FROM productos WHERE id = NEW.item_id;
    END IF;
    RETURN NEW;
END;
$$;


--
-- Name: actualizar_visitas_cliente(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.actualizar_visitas_cliente() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    IF NEW.estado = 'completada' AND OLD.estado != 'completada' THEN
        UPDATE clientes 
        SET 
            total_visitas = total_visitas + 1,
            ultima_visita = NEW.fecha
        WHERE id = NEW.cliente_id;
    END IF;
    RETURN NEW;
END;
$$;


--
-- Name: update_fecha_actualizacion(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_fecha_actualizacion() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.fecha_actualizacion = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: bloqueos_especialista; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.bloqueos_especialista (
    id integer NOT NULL,
    especialista_id integer NOT NULL,
    fecha_inicio date NOT NULL,
    fecha_fin date NOT NULL,
    hora_inicio time without time zone,
    hora_fin time without time zone,
    motivo character varying(255),
    es_recurrente boolean DEFAULT false,
    dias_semana jsonb,
    fecha_creacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_fecha_bloqueo CHECK ((fecha_fin >= fecha_inicio))
);


--
-- Name: bloqueos_especialista_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.bloqueos_especialista_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: bloqueos_especialista_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.bloqueos_especialista_id_seq OWNED BY public.bloqueos_especialista.id;


--
-- Name: bonificaciones_deducciones; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.bonificaciones_deducciones (
    id integer NOT NULL,
    nomina_detalle_id integer NOT NULL,
    tipo character varying(20) NOT NULL,
    concepto character varying(255) NOT NULL,
    valor numeric(12,2) NOT NULL,
    fecha_creacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT bonificaciones_deducciones_tipo_check CHECK (((tipo)::text = ANY ((ARRAY['bonificacion'::character varying, 'deduccion'::character varying])::text[])))
);


--
-- Name: bonificaciones_deducciones_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.bonificaciones_deducciones_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: bonificaciones_deducciones_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.bonificaciones_deducciones_id_seq OWNED BY public.bonificaciones_deducciones.id;


--
-- Name: cajas; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cajas (
    id integer NOT NULL,
    nombre character varying(50) DEFAULT 'Principal'::character varying,
    usuario_apertura integer NOT NULL,
    fecha_apertura timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    monto_apertura numeric(12,2) DEFAULT 0 NOT NULL,
    usuario_cierre integer,
    fecha_cierre timestamp without time zone,
    monto_cierre numeric(12,2),
    estado character varying(20) DEFAULT 'abierta'::character varying,
    notas text,
    CONSTRAINT cajas_estado_check CHECK (((estado)::text = ANY ((ARRAY['abierta'::character varying, 'cerrada'::character varying])::text[])))
);


--
-- Name: cajas_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.cajas_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: cajas_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.cajas_id_seq OWNED BY public.cajas.id;


--
-- Name: categorias_producto; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.categorias_producto (
    id integer NOT NULL,
    nombre character varying(100) NOT NULL,
    descripcion text,
    fecha_creacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: categorias_producto_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.categorias_producto_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: categorias_producto_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.categorias_producto_id_seq OWNED BY public.categorias_producto.id;


--
-- Name: categorias_servicio; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.categorias_servicio (
    id integer NOT NULL,
    nombre character varying(100) NOT NULL,
    descripcion text,
    orden_visualizacion integer DEFAULT 0,
    fecha_creacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: categorias_servicio_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.categorias_servicio_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: categorias_servicio_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.categorias_servicio_id_seq OWNED BY public.categorias_servicio.id;


--
-- Name: citas; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.citas (
    id integer NOT NULL,
    cliente_id integer NOT NULL,
    especialista_id integer NOT NULL,
    servicio_id integer NOT NULL,
    fecha date NOT NULL,
    hora_inicio time without time zone NOT NULL,
    hora_fin time without time zone NOT NULL,
    estado character varying(20) DEFAULT 'agendada'::character varying,
    notas text,
    creado_por integer,
    fecha_creacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    duracion_minutos integer DEFAULT 60,
    notas_internas text,
    precio integer DEFAULT 0,
    CONSTRAINT chk_hora_cita CHECK ((hora_fin > hora_inicio)),
    CONSTRAINT citas_estado_check CHECK (((estado)::text = ANY ((ARRAY['agendada'::character varying, 'confirmada'::character varying, 'en_proceso'::character varying, 'completada'::character varying, 'cancelada'::character varying, 'no_show'::character varying])::text[])))
);


--
-- Name: citas_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.citas_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: citas_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.citas_id_seq OWNED BY public.citas.id;


--
-- Name: cliente_etiqueta_asignacion; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cliente_etiqueta_asignacion (
    cliente_id integer NOT NULL,
    etiqueta_id integer NOT NULL,
    fecha_asignacion timestamp with time zone DEFAULT now()
);


--
-- Name: cliente_etiquetas; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cliente_etiquetas (
    id integer NOT NULL,
    nombre character varying(50) NOT NULL,
    color character varying(7) DEFAULT '#6c757d'::character varying,
    fecha_creacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: cliente_etiquetas_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.cliente_etiquetas_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: cliente_etiquetas_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.cliente_etiquetas_id_seq OWNED BY public.cliente_etiquetas.id;


--
-- Name: cliente_fotos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cliente_fotos (
    id integer NOT NULL,
    cliente_id integer NOT NULL,
    servicio_id integer,
    tipo character varying(20),
    ruta_foto text NOT NULL,
    notas text,
    fecha timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT cliente_fotos_tipo_check CHECK (((tipo)::text = ANY ((ARRAY['antes'::character varying, 'despues'::character varying])::text[])))
);


--
-- Name: cliente_fotos_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.cliente_fotos_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: cliente_fotos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.cliente_fotos_id_seq OWNED BY public.cliente_fotos.id;


--
-- Name: cliente_historial_comunicacion; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cliente_historial_comunicacion (
    id integer NOT NULL,
    cliente_id integer NOT NULL,
    tipo character varying(20) NOT NULL,
    asunto character varying(255),
    contenido text,
    usuario_id integer,
    fecha timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT cliente_historial_comunicacion_tipo_check CHECK (((tipo)::text = ANY ((ARRAY['llamada'::character varying, 'sms'::character varying, 'email'::character varying, 'whatsapp'::character varying])::text[])))
);


--
-- Name: cliente_historial_comunicacion_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.cliente_historial_comunicacion_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: cliente_historial_comunicacion_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.cliente_historial_comunicacion_id_seq OWNED BY public.cliente_historial_comunicacion.id;


--
-- Name: cliente_preferencias; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cliente_preferencias (
    id integer NOT NULL,
    cliente_id integer NOT NULL,
    productos_favoritos jsonb,
    alergias text,
    notas_servicio text,
    fecha_actualizacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: cliente_preferencias_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.cliente_preferencias_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: cliente_preferencias_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.cliente_preferencias_id_seq OWNED BY public.cliente_preferencias.id;


--
-- Name: clientes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.clientes (
    id integer NOT NULL,
    nombre character varying(100) NOT NULL,
    apellido character varying(100),
    telefono character varying(20),
    email character varying(100),
    fecha_nacimiento date,
    direccion text,
    notas text,
    fecha_primera_visita date,
    ultima_visita date,
    total_visitas integer DEFAULT 0,
    estado character varying(20) DEFAULT 'activo'::character varying,
    fecha_creacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    cedula character varying(20),
    CONSTRAINT clientes_estado_check CHECK (((estado)::text = ANY ((ARRAY['activo'::character varying, 'inactivo'::character varying])::text[])))
);


--
-- Name: clientes_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.clientes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: clientes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.clientes_id_seq OWNED BY public.clientes.id;


--
-- Name: cola_notificaciones; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cola_notificaciones (
    id integer NOT NULL,
    tipo character varying(20) NOT NULL,
    destinatario character varying(255) NOT NULL,
    asunto character varying(255),
    contenido text NOT NULL,
    estado character varying(20) DEFAULT 'pendiente'::character varying,
    intentos integer DEFAULT 0,
    error text,
    fecha_programada timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    fecha_envio timestamp without time zone,
    fecha_creacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT cola_notificaciones_estado_check CHECK (((estado)::text = ANY ((ARRAY['pendiente'::character varying, 'enviado'::character varying, 'fallido'::character varying])::text[]))),
    CONSTRAINT cola_notificaciones_tipo_check CHECK (((tipo)::text = ANY ((ARRAY['sms'::character varying, 'email'::character varying, 'push'::character varying])::text[])))
);


--
-- Name: cola_notificaciones_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.cola_notificaciones_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: cola_notificaciones_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.cola_notificaciones_id_seq OWNED BY public.cola_notificaciones.id;


--
-- Name: configuracion; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.configuracion (
    id integer NOT NULL,
    clave character varying(100) NOT NULL,
    valor text,
    tipo character varying(20) DEFAULT 'texto'::character varying,
    descripcion text,
    fecha_actualizacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT configuracion_tipo_check CHECK (((tipo)::text = ANY ((ARRAY['texto'::character varying, 'numero'::character varying, 'booleano'::character varying, 'json'::character varying])::text[])))
);


--
-- Name: configuracion_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.configuracion_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: configuracion_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.configuracion_id_seq OWNED BY public.configuracion.id;


--
-- Name: cupones; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cupones (
    id integer NOT NULL,
    codigo character varying(50) NOT NULL,
    promocion_id integer NOT NULL,
    usos_maximos integer DEFAULT 1,
    usos_actuales integer DEFAULT 0,
    cliente_especifico integer,
    fecha_expiracion date,
    estado character varying(20) DEFAULT 'activo'::character varying,
    fecha_creacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT cupones_estado_check CHECK (((estado)::text = ANY ((ARRAY['activo'::character varying, 'inactivo'::character varying, 'agotado'::character varying])::text[])))
);


--
-- Name: cupones_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.cupones_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: cupones_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.cupones_id_seq OWNED BY public.cupones.id;


--
-- Name: cupones_usados; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cupones_usados (
    id integer NOT NULL,
    cupon_id integer NOT NULL,
    factura_id integer NOT NULL,
    cliente_id integer,
    descuento_aplicado numeric(12,2) NOT NULL,
    fecha_uso timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: cupones_usados_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.cupones_usados_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: cupones_usados_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.cupones_usados_id_seq OWNED BY public.cupones_usados.id;


--
-- Name: detalle_factura; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.detalle_factura (
    id integer NOT NULL,
    factura_id integer NOT NULL,
    tipo character varying(20) NOT NULL,
    item_id integer NOT NULL,
    cantidad numeric(12,3) DEFAULT 1 NOT NULL,
    precio_unitario numeric(12,2) NOT NULL,
    descuento_linea numeric(12,2) DEFAULT 0,
    subtotal numeric(12,2) NOT NULL,
    especialista_id integer,
    cita_id integer,
    fecha_creacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT detalle_factura_cantidad_check CHECK ((cantidad > (0)::numeric)),
    CONSTRAINT detalle_factura_tipo_check CHECK (((tipo)::text = ANY ((ARRAY['servicio'::character varying, 'producto'::character varying])::text[])))
);


--
-- Name: detalle_factura_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.detalle_factura_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: detalle_factura_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.detalle_factura_id_seq OWNED BY public.detalle_factura.id;


--
-- Name: detalle_orden_compra; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.detalle_orden_compra (
    id integer NOT NULL,
    orden_id integer NOT NULL,
    producto_id integer NOT NULL,
    cantidad numeric(12,3) NOT NULL,
    precio_unitario numeric(12,2) NOT NULL,
    subtotal numeric(12,2) GENERATED ALWAYS AS ((cantidad * precio_unitario)) STORED,
    CONSTRAINT detalle_orden_compra_cantidad_check CHECK ((cantidad > (0)::numeric)),
    CONSTRAINT detalle_orden_compra_precio_unitario_check CHECK ((precio_unitario >= (0)::numeric))
);


--
-- Name: detalle_orden_compra_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.detalle_orden_compra_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: detalle_orden_compra_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.detalle_orden_compra_id_seq OWNED BY public.detalle_orden_compra.id;


--
-- Name: empresa; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.empresa (
    id integer NOT NULL,
    nombre character varying(150) NOT NULL,
    nit character varying(50),
    direccion text,
    telefono character varying(20),
    email character varying(100),
    logo text,
    sitio_web character varying(255),
    fecha_actualizacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: empresa_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.empresa_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: empresa_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.empresa_id_seq OWNED BY public.empresa.id;


--
-- Name: especialista_servicios; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.especialista_servicios (
    especialista_id integer NOT NULL,
    servicio_id integer NOT NULL,
    tipo_comision character varying(20) NOT NULL,
    valor_comision numeric(12,2) NOT NULL,
    fecha_creacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT especialista_servicios_tipo_comision_check CHECK (((tipo_comision)::text = ANY ((ARRAY['porcentaje'::character varying, 'fijo'::character varying])::text[]))),
    CONSTRAINT especialista_servicios_valor_comision_check CHECK ((valor_comision >= (0)::numeric))
);


--
-- Name: especialistas; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.especialistas (
    id integer NOT NULL,
    nombre character varying(100) NOT NULL,
    apellido character varying(100) NOT NULL,
    documento_identidad character varying(20),
    telefono character varying(20),
    email character varying(100),
    foto text,
    estado character varying(20) DEFAULT 'activo'::character varying,
    fecha_ingreso date,
    fecha_creacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT especialistas_estado_check CHECK (((estado)::text = ANY ((ARRAY['activo'::character varying, 'inactivo'::character varying])::text[])))
);


--
-- Name: especialistas_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.especialistas_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: especialistas_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.especialistas_id_seq OWNED BY public.especialistas.id;


--
-- Name: facturas; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.facturas (
    id integer NOT NULL,
    numero_factura character varying(50) NOT NULL,
    cliente_id integer,
    fecha timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    subtotal numeric(12,2) DEFAULT 0 NOT NULL,
    descuento numeric(12,2) DEFAULT 0,
    impuestos numeric(12,2) DEFAULT 0,
    total numeric(12,2) DEFAULT 0 NOT NULL,
    metodo_pago_id integer,
    referencia_pago character varying(100),
    estado character varying(20) DEFAULT 'pagada'::character varying,
    usuario_id integer NOT NULL,
    caja_id integer,
    notas text,
    fecha_creacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT facturas_estado_check CHECK (((estado)::text = ANY ((ARRAY['pendiente'::character varying, 'pagada'::character varying, 'anulada'::character varying])::text[])))
);


--
-- Name: facturas_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.facturas_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: facturas_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.facturas_id_seq OWNED BY public.facturas.id;


--
-- Name: facturas_pendientes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.facturas_pendientes (
    id integer NOT NULL,
    especialista_id integer NOT NULL,
    cliente_id integer,
    servicio_id integer NOT NULL,
    fecha_servicio date DEFAULT CURRENT_DATE NOT NULL,
    notas text,
    estado character varying(20) DEFAULT 'pendiente'::character varying,
    revisado_por integer,
    fecha_revision timestamp without time zone,
    motivo_rechazo text,
    fecha_creacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT facturas_pendientes_estado_check CHECK (((estado)::text = ANY ((ARRAY['pendiente'::character varying, 'aprobada'::character varying, 'rechazada'::character varying])::text[])))
);


--
-- Name: facturas_pendientes_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.facturas_pendientes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: facturas_pendientes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.facturas_pendientes_id_seq OWNED BY public.facturas_pendientes.id;


--
-- Name: historial_citas; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.historial_citas (
    id integer NOT NULL,
    cita_id integer NOT NULL,
    estado_anterior character varying(20),
    estado_nuevo character varying(20) NOT NULL,
    usuario_id integer,
    motivo text,
    fecha_cambio timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: historial_citas_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.historial_citas_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: historial_citas_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.historial_citas_id_seq OWNED BY public.historial_citas.id;


--
-- Name: horarios_especialista; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.horarios_especialista (
    id integer NOT NULL,
    especialista_id integer NOT NULL,
    dia_semana smallint NOT NULL,
    hora_inicio time without time zone NOT NULL,
    hora_fin time without time zone NOT NULL,
    activo boolean DEFAULT true,
    fecha_creacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_horario_valido CHECK ((hora_fin > hora_inicio)),
    CONSTRAINT horarios_especialista_dia_semana_check CHECK (((dia_semana >= 0) AND (dia_semana <= 6)))
);


--
-- Name: horarios_especialista_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.horarios_especialista_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: horarios_especialista_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.horarios_especialista_id_seq OWNED BY public.horarios_especialista.id;


--
-- Name: inventario; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.inventario (
    id integer NOT NULL,
    producto_id integer NOT NULL,
    ubicacion_id integer NOT NULL,
    cantidad integer NOT NULL,
    fecha_actualizacion timestamp with time zone DEFAULT now(),
    CONSTRAINT chk_inventario_cantidad CHECK ((cantidad >= 0))
);


--
-- Name: inventario_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.inventario_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: inventario_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.inventario_id_seq OWNED BY public.inventario.id;


--
-- Name: log_auditoria; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.log_auditoria (
    id integer NOT NULL,
    usuario_id integer,
    accion character varying(50) NOT NULL,
    modulo character varying(50) NOT NULL,
    entidad character varying(50),
    entidad_id integer,
    datos_anteriores jsonb,
    datos_nuevos jsonb,
    ip character varying(45),
    fecha timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: log_auditoria_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.log_auditoria_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: log_auditoria_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.log_auditoria_id_seq OWNED BY public.log_auditoria.id;


--
-- Name: metodos_pago; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.metodos_pago (
    id integer NOT NULL,
    nombre character varying(50) NOT NULL,
    activo boolean DEFAULT true,
    requiere_referencia boolean DEFAULT false,
    fecha_creacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: metodos_pago_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.metodos_pago_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: metodos_pago_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.metodos_pago_id_seq OWNED BY public.metodos_pago.id;


--
-- Name: movimientos_caja; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.movimientos_caja (
    id integer NOT NULL,
    caja_id integer NOT NULL,
    tipo character varying(20) NOT NULL,
    monto numeric(12,2) NOT NULL,
    concepto character varying(255) NOT NULL,
    factura_id integer,
    usuario_id integer NOT NULL,
    fecha timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT movimientos_caja_tipo_check CHECK (((tipo)::text = ANY ((ARRAY['ingreso'::character varying, 'egreso'::character varying])::text[])))
);


--
-- Name: movimientos_caja_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.movimientos_caja_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: movimientos_caja_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.movimientos_caja_id_seq OWNED BY public.movimientos_caja.id;


--
-- Name: movimientos_inventario; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.movimientos_inventario (
    id integer NOT NULL,
    producto_id integer NOT NULL,
    tipo_movimiento character varying(30) NOT NULL,
    cantidad integer NOT NULL,
    ubicacion_origen_id integer,
    ubicacion_destino_id integer,
    venta_id integer,
    costo_unitario numeric(10,2),
    costo_total numeric(10,2),
    motivo text,
    referencia character varying(100),
    usuario_id integer NOT NULL,
    fecha_movimiento timestamp with time zone DEFAULT now(),
    CONSTRAINT chk_movimiento_cantidad CHECK ((cantidad > 0)),
    CONSTRAINT chk_movimiento_tipo CHECK (((tipo_movimiento)::text = ANY ((ARRAY['compra'::character varying, 'venta'::character varying, 'ajuste_positivo'::character varying, 'ajuste_negativo'::character varying, 'transferencia'::character varying, 'uso_interno'::character varying, 'devolucion'::character varying, 'merma'::character varying, 'muestra'::character varying, 'donacion'::character varying])::text[])))
);


--
-- Name: movimientos_inventario_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.movimientos_inventario_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: movimientos_inventario_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.movimientos_inventario_id_seq OWNED BY public.movimientos_inventario.id;


--
-- Name: nomina_detalle; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.nomina_detalle (
    id integer NOT NULL,
    periodo_id integer NOT NULL,
    especialista_id integer NOT NULL,
    total_servicios integer DEFAULT 0,
    comision_servicios numeric(12,2) DEFAULT 0,
    total_productos integer DEFAULT 0,
    comision_productos numeric(12,2) DEFAULT 0,
    bonificaciones numeric(12,2) DEFAULT 0,
    deducciones numeric(12,2) DEFAULT 0,
    total_pagar numeric(12,2) DEFAULT 0,
    estado_pago character varying(20) DEFAULT 'pendiente'::character varying,
    fecha_creacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT nomina_detalle_estado_pago_check CHECK (((estado_pago)::text = ANY ((ARRAY['pendiente'::character varying, 'pagado'::character varying])::text[])))
);


--
-- Name: nomina_detalle_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.nomina_detalle_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: nomina_detalle_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.nomina_detalle_id_seq OWNED BY public.nomina_detalle.id;


--
-- Name: nomina_detalle_lineas; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.nomina_detalle_lineas (
    id integer NOT NULL,
    nomina_detalle_id integer NOT NULL,
    factura_detalle_id integer NOT NULL,
    concepto character varying(255) NOT NULL,
    valor_base numeric(12,2) NOT NULL,
    tipo_comision character varying(20) NOT NULL,
    porcentaje_comision numeric(5,2),
    valor_comision numeric(12,2) NOT NULL,
    fecha_creacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: nomina_detalle_lineas_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.nomina_detalle_lineas_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: nomina_detalle_lineas_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.nomina_detalle_lineas_id_seq OWNED BY public.nomina_detalle_lineas.id;


--
-- Name: notificaciones; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notificaciones (
    id integer NOT NULL,
    usuario_id integer,
    especialista_id integer,
    tipo character varying(50) NOT NULL,
    titulo character varying(255) NOT NULL,
    mensaje text,
    leida boolean DEFAULT false,
    fecha_lectura timestamp without time zone,
    fecha timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: notificaciones_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.notificaciones_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: notificaciones_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.notificaciones_id_seq OWNED BY public.notificaciones.id;


--
-- Name: ordenes_compra; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ordenes_compra (
    id integer NOT NULL,
    numero_orden character varying(50),
    proveedor_id integer NOT NULL,
    fecha date DEFAULT CURRENT_DATE NOT NULL,
    estado character varying(20) DEFAULT 'pendiente'::character varying,
    total numeric(12,2) DEFAULT 0,
    notas text,
    usuario_id integer,
    fecha_creacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT ordenes_compra_estado_check CHECK (((estado)::text = ANY ((ARRAY['pendiente'::character varying, 'recibida'::character varying, 'cancelada'::character varying])::text[])))
);


--
-- Name: ordenes_compra_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.ordenes_compra_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: ordenes_compra_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.ordenes_compra_id_seq OWNED BY public.ordenes_compra.id;


--
-- Name: periodos_nomina; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.periodos_nomina (
    id integer NOT NULL,
    fecha_inicio date NOT NULL,
    fecha_fin date NOT NULL,
    estado character varying(20) DEFAULT 'abierto'::character varying,
    fecha_calculo timestamp without time zone,
    fecha_pago timestamp without time zone,
    usuario_id integer,
    fecha_creacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_periodo CHECK ((fecha_fin >= fecha_inicio)),
    CONSTRAINT periodos_nomina_estado_check CHECK (((estado)::text = ANY ((ARRAY['abierto'::character varying, 'calculado'::character varying, 'pagado'::character varying, 'cerrado'::character varying])::text[])))
);


--
-- Name: periodos_nomina_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.periodos_nomina_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: periodos_nomina_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.periodos_nomina_id_seq OWNED BY public.periodos_nomina.id;


--
-- Name: permisos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.permisos (
    id integer NOT NULL,
    codigo character varying(50) NOT NULL,
    nombre character varying(100) NOT NULL,
    modulo character varying(50) NOT NULL,
    descripcion text,
    fecha_creacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: permisos_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.permisos_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: permisos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.permisos_id_seq OWNED BY public.permisos.id;


--
-- Name: plantillas_mensaje; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.plantillas_mensaje (
    id integer NOT NULL,
    tipo character varying(50) NOT NULL,
    asunto character varying(255),
    contenido text NOT NULL,
    variables jsonb,
    activo boolean DEFAULT true,
    fecha_actualizacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: plantillas_mensaje_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.plantillas_mensaje_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: plantillas_mensaje_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.plantillas_mensaje_id_seq OWNED BY public.plantillas_mensaje.id;


--
-- Name: productos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.productos (
    id integer NOT NULL,
    codigo character varying(50),
    codigo_barras character varying(50),
    nombre character varying(150) NOT NULL,
    descripcion text,
    categoria_id integer,
    proveedor_id integer,
    precio_compra numeric(12,2) DEFAULT 0,
    precio_venta numeric(12,2) NOT NULL,
    stock_actual numeric(12,3) DEFAULT 0,
    stock_minimo numeric(12,3) DEFAULT 0,
    unidad_medida character varying(20) DEFAULT 'unidad'::character varying,
    estado character varying(20) DEFAULT 'activo'::character varying,
    comision_venta numeric(5,2) DEFAULT 0,
    fecha_creacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    stock_maximo integer,
    fecha_vencimiento date,
    lote character varying(50),
    imagen_url character varying(500),
    CONSTRAINT productos_estado_check CHECK (((estado)::text = ANY ((ARRAY['activo'::character varying, 'inactivo'::character varying])::text[]))),
    CONSTRAINT productos_precio_compra_check CHECK ((precio_compra >= (0)::numeric)),
    CONSTRAINT productos_precio_venta_check CHECK ((precio_venta >= (0)::numeric))
);


--
-- Name: productos_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.productos_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: productos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.productos_id_seq OWNED BY public.productos.id;


--
-- Name: promociones; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.promociones (
    id integer NOT NULL,
    nombre character varying(100) NOT NULL,
    descripcion text,
    tipo character varying(20) NOT NULL,
    valor numeric(12,2),
    fecha_inicio date NOT NULL,
    fecha_fin date NOT NULL,
    servicios_aplicables jsonb,
    productos_aplicables jsonb,
    estado character varying(20) DEFAULT 'activo'::character varying,
    fecha_creacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_fecha_promo CHECK ((fecha_fin >= fecha_inicio)),
    CONSTRAINT promociones_estado_check CHECK (((estado)::text = ANY ((ARRAY['activo'::character varying, 'inactivo'::character varying])::text[]))),
    CONSTRAINT promociones_tipo_check CHECK (((tipo)::text = ANY ((ARRAY['porcentaje'::character varying, 'monto'::character varying, '2x1'::character varying, 'combo'::character varying])::text[])))
);


--
-- Name: promociones_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.promociones_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: promociones_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.promociones_id_seq OWNED BY public.promociones.id;


--
-- Name: proveedores; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.proveedores (
    id integer NOT NULL,
    nombre character varying(150) NOT NULL,
    contacto character varying(100),
    telefono character varying(20),
    email character varying(100),
    direccion text,
    estado character varying(20) DEFAULT 'activo'::character varying,
    fecha_creacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    notas text,
    CONSTRAINT proveedores_estado_check CHECK (((estado)::text = ANY ((ARRAY['activo'::character varying, 'inactivo'::character varying])::text[])))
);


--
-- Name: proveedores_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.proveedores_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: proveedores_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.proveedores_id_seq OWNED BY public.proveedores.id;


--
-- Name: reportes_programados; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.reportes_programados (
    id integer NOT NULL,
    nombre character varying(100) NOT NULL,
    tipo_reporte character varying(50) NOT NULL,
    filtros jsonb,
    frecuencia character varying(20),
    email_destino character varying(255),
    activo boolean DEFAULT true,
    ultimo_envio timestamp without time zone,
    proximo_envio timestamp without time zone,
    usuario_id integer,
    fecha_creacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT reportes_programados_frecuencia_check CHECK (((frecuencia)::text = ANY ((ARRAY['diario'::character varying, 'semanal'::character varying, 'mensual'::character varying])::text[])))
);


--
-- Name: reportes_programados_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.reportes_programados_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: reportes_programados_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.reportes_programados_id_seq OWNED BY public.reportes_programados.id;


--
-- Name: rol_permisos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.rol_permisos (
    rol_id integer NOT NULL,
    permiso_id integer NOT NULL
);


--
-- Name: roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.roles (
    id integer NOT NULL,
    nombre character varying(50) NOT NULL,
    descripcion text,
    es_sistema boolean DEFAULT false,
    fecha_creacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: roles_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.roles_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: roles_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.roles_id_seq OWNED BY public.roles.id;


--
-- Name: servicio_productos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.servicio_productos (
    servicio_id integer NOT NULL,
    producto_id integer NOT NULL,
    cantidad_consumida numeric(12,3) NOT NULL,
    CONSTRAINT servicio_productos_cantidad_consumida_check CHECK ((cantidad_consumida > (0)::numeric))
);


--
-- Name: servicios; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.servicios (
    id integer NOT NULL,
    nombre character varying(100) NOT NULL,
    descripcion text,
    duracion_minutos integer NOT NULL,
    precio_base numeric(12,2) NOT NULL,
    categoria_id integer,
    requiere_producto boolean DEFAULT false,
    estado character varying(20) DEFAULT 'activo'::character varying,
    color_calendario character varying(7) DEFAULT '#3498db'::character varying,
    fecha_creacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    valor_comision numeric(12,2) DEFAULT 40,
    tipo_comision character varying(20) DEFAULT 'porcentaje'::character varying,
    CONSTRAINT chk_tipo_comision CHECK (((tipo_comision)::text = ANY ((ARRAY['porcentaje'::character varying, 'fijo'::character varying])::text[]))),
    CONSTRAINT chk_valor_comision_positivo CHECK ((valor_comision >= (0)::numeric)),
    CONSTRAINT servicios_duracion_minutos_check CHECK ((duracion_minutos >= 15)),
    CONSTRAINT servicios_estado_check CHECK (((estado)::text = ANY ((ARRAY['activo'::character varying, 'inactivo'::character varying])::text[]))),
    CONSTRAINT servicios_precio_base_check CHECK ((precio_base >= (0)::numeric))
);


--
-- Name: servicios_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.servicios_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: servicios_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.servicios_id_seq OWNED BY public.servicios.id;


--
-- Name: sesiones; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sesiones (
    id integer NOT NULL,
    usuario_id integer NOT NULL,
    token character varying(500) NOT NULL,
    ip character varying(45),
    user_agent text,
    fecha_creacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    fecha_expiracion timestamp without time zone NOT NULL
);


--
-- Name: sesiones_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.sesiones_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: sesiones_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.sesiones_id_seq OWNED BY public.sesiones.id;


--
-- Name: sesiones_movil; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sesiones_movil (
    id integer NOT NULL,
    especialista_id integer NOT NULL,
    device_token character varying(500),
    ultimo_acceso timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    fecha_creacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: sesiones_movil_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.sesiones_movil_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: sesiones_movil_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.sesiones_movil_id_seq OWNED BY public.sesiones_movil.id;


--
-- Name: ubicaciones_inventario; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ubicaciones_inventario (
    id integer NOT NULL,
    nombre character varying(100) NOT NULL,
    tipo character varying(50) NOT NULL,
    descripcion text,
    es_principal integer,
    estado character varying(20),
    fecha_creacion timestamp with time zone DEFAULT now(),
    CONSTRAINT chk_ubicacion_es_principal CHECK ((es_principal = ANY (ARRAY[0, 1]))),
    CONSTRAINT chk_ubicacion_estado CHECK (((estado)::text = ANY ((ARRAY['activo'::character varying, 'inactivo'::character varying])::text[]))),
    CONSTRAINT chk_ubicacion_tipo CHECK (((tipo)::text = ANY ((ARRAY['bodega'::character varying, 'vitrina'::character varying, 'otro'::character varying])::text[])))
);


--
-- Name: ubicaciones_inventario_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.ubicaciones_inventario_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: ubicaciones_inventario_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.ubicaciones_inventario_id_seq OWNED BY public.ubicaciones_inventario.id;


--
-- Name: usuarios; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.usuarios (
    id integer NOT NULL,
    username character varying(50) NOT NULL,
    email character varying(100) NOT NULL,
    password_hash character varying(255) NOT NULL,
    nombre character varying(100) NOT NULL,
    especialista_id integer,
    rol_id integer NOT NULL,
    estado character varying(20) DEFAULT 'activo'::character varying,
    ultimo_acceso timestamp without time zone,
    intentos_fallidos integer DEFAULT 0,
    fecha_bloqueo timestamp without time zone,
    fecha_creacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT usuarios_estado_check CHECK (((estado)::text = ANY ((ARRAY['activo'::character varying, 'inactivo'::character varying, 'bloqueado'::character varying])::text[])))
);


--
-- Name: usuarios_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.usuarios_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: usuarios_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.usuarios_id_seq OWNED BY public.usuarios.id;


--
-- Name: v_comisiones_especialista; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.v_comisiones_especialista AS
 SELECT e.id AS especialista_id,
    (((e.nombre)::text || ' '::text) || (e.apellido)::text) AS especialista,
    date(f.fecha) AS fecha,
    count(df.id) AS total_items,
    sum(df.subtotal) AS total_facturado,
    sum(
        CASE
            WHEN ((df.tipo)::text = 'servicio'::text) THEN
            CASE
                WHEN ((es.tipo_comision)::text = 'porcentaje'::text) THEN ((df.subtotal * es.valor_comision) / (100)::numeric)
                ELSE es.valor_comision
            END
            ELSE ((df.subtotal * p.comision_venta) / (100)::numeric)
        END) AS total_comision
   FROM ((((public.detalle_factura df
     JOIN public.facturas f ON ((df.factura_id = f.id)))
     JOIN public.especialistas e ON ((df.especialista_id = e.id)))
     LEFT JOIN public.especialista_servicios es ON (((df.especialista_id = es.especialista_id) AND (df.item_id = es.servicio_id) AND ((df.tipo)::text = 'servicio'::text))))
     LEFT JOIN public.productos p ON (((df.item_id = p.id) AND ((df.tipo)::text = 'producto'::text))))
  WHERE ((f.estado)::text = 'pagada'::text)
  GROUP BY e.id, e.nombre, e.apellido, (date(f.fecha));


--
-- Name: v_stock_bajo; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.v_stock_bajo AS
 SELECT p.id,
    p.codigo,
    p.nombre,
    cp.nombre AS categoria,
    p.stock_actual,
    p.stock_minimo,
    (p.stock_minimo - p.stock_actual) AS cantidad_faltante
   FROM (public.productos p
     LEFT JOIN public.categorias_producto cp ON ((p.categoria_id = cp.id)))
  WHERE ((p.stock_actual <= p.stock_minimo) AND ((p.estado)::text = 'activo'::text));


--
-- Name: v_ventas_diarias; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.v_ventas_diarias AS
 SELECT date(f.fecha) AS fecha,
    count(DISTINCT f.id) AS total_facturas,
    sum(f.total) AS total_ventas,
    sum(
        CASE
            WHEN ((df.tipo)::text = 'servicio'::text) THEN df.subtotal
            ELSE (0)::numeric
        END) AS ventas_servicios,
    sum(
        CASE
            WHEN ((df.tipo)::text = 'producto'::text) THEN df.subtotal
            ELSE (0)::numeric
        END) AS ventas_productos
   FROM (public.facturas f
     LEFT JOIN public.detalle_factura df ON ((f.id = df.factura_id)))
  WHERE ((f.estado)::text = 'pagada'::text)
  GROUP BY (date(f.fecha));


--
-- Name: bloqueos_especialista id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bloqueos_especialista ALTER COLUMN id SET DEFAULT nextval('public.bloqueos_especialista_id_seq'::regclass);


--
-- Name: bonificaciones_deducciones id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bonificaciones_deducciones ALTER COLUMN id SET DEFAULT nextval('public.bonificaciones_deducciones_id_seq'::regclass);


--
-- Name: cajas id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cajas ALTER COLUMN id SET DEFAULT nextval('public.cajas_id_seq'::regclass);


--
-- Name: categorias_producto id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categorias_producto ALTER COLUMN id SET DEFAULT nextval('public.categorias_producto_id_seq'::regclass);


--
-- Name: categorias_servicio id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categorias_servicio ALTER COLUMN id SET DEFAULT nextval('public.categorias_servicio_id_seq'::regclass);


--
-- Name: citas id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.citas ALTER COLUMN id SET DEFAULT nextval('public.citas_id_seq'::regclass);


--
-- Name: cliente_etiquetas id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cliente_etiquetas ALTER COLUMN id SET DEFAULT nextval('public.cliente_etiquetas_id_seq'::regclass);


--
-- Name: cliente_fotos id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cliente_fotos ALTER COLUMN id SET DEFAULT nextval('public.cliente_fotos_id_seq'::regclass);


--
-- Name: cliente_historial_comunicacion id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cliente_historial_comunicacion ALTER COLUMN id SET DEFAULT nextval('public.cliente_historial_comunicacion_id_seq'::regclass);


--
-- Name: cliente_preferencias id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cliente_preferencias ALTER COLUMN id SET DEFAULT nextval('public.cliente_preferencias_id_seq'::regclass);


--
-- Name: clientes id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clientes ALTER COLUMN id SET DEFAULT nextval('public.clientes_id_seq'::regclass);


--
-- Name: cola_notificaciones id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cola_notificaciones ALTER COLUMN id SET DEFAULT nextval('public.cola_notificaciones_id_seq'::regclass);


--
-- Name: configuracion id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.configuracion ALTER COLUMN id SET DEFAULT nextval('public.configuracion_id_seq'::regclass);


--
-- Name: cupones id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cupones ALTER COLUMN id SET DEFAULT nextval('public.cupones_id_seq'::regclass);


--
-- Name: cupones_usados id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cupones_usados ALTER COLUMN id SET DEFAULT nextval('public.cupones_usados_id_seq'::regclass);


--
-- Name: detalle_factura id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.detalle_factura ALTER COLUMN id SET DEFAULT nextval('public.detalle_factura_id_seq'::regclass);


--
-- Name: detalle_orden_compra id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.detalle_orden_compra ALTER COLUMN id SET DEFAULT nextval('public.detalle_orden_compra_id_seq'::regclass);


--
-- Name: empresa id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.empresa ALTER COLUMN id SET DEFAULT nextval('public.empresa_id_seq'::regclass);


--
-- Name: especialistas id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.especialistas ALTER COLUMN id SET DEFAULT nextval('public.especialistas_id_seq'::regclass);


--
-- Name: facturas id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.facturas ALTER COLUMN id SET DEFAULT nextval('public.facturas_id_seq'::regclass);


--
-- Name: facturas_pendientes id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.facturas_pendientes ALTER COLUMN id SET DEFAULT nextval('public.facturas_pendientes_id_seq'::regclass);


--
-- Name: historial_citas id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.historial_citas ALTER COLUMN id SET DEFAULT nextval('public.historial_citas_id_seq'::regclass);


--
-- Name: horarios_especialista id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.horarios_especialista ALTER COLUMN id SET DEFAULT nextval('public.horarios_especialista_id_seq'::regclass);


--
-- Name: inventario id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventario ALTER COLUMN id SET DEFAULT nextval('public.inventario_id_seq'::regclass);


--
-- Name: log_auditoria id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.log_auditoria ALTER COLUMN id SET DEFAULT nextval('public.log_auditoria_id_seq'::regclass);


--
-- Name: metodos_pago id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.metodos_pago ALTER COLUMN id SET DEFAULT nextval('public.metodos_pago_id_seq'::regclass);


--
-- Name: movimientos_caja id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.movimientos_caja ALTER COLUMN id SET DEFAULT nextval('public.movimientos_caja_id_seq'::regclass);


--
-- Name: movimientos_inventario id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.movimientos_inventario ALTER COLUMN id SET DEFAULT nextval('public.movimientos_inventario_id_seq'::regclass);


--
-- Name: nomina_detalle id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.nomina_detalle ALTER COLUMN id SET DEFAULT nextval('public.nomina_detalle_id_seq'::regclass);


--
-- Name: nomina_detalle_lineas id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.nomina_detalle_lineas ALTER COLUMN id SET DEFAULT nextval('public.nomina_detalle_lineas_id_seq'::regclass);


--
-- Name: notificaciones id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notificaciones ALTER COLUMN id SET DEFAULT nextval('public.notificaciones_id_seq'::regclass);


--
-- Name: ordenes_compra id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ordenes_compra ALTER COLUMN id SET DEFAULT nextval('public.ordenes_compra_id_seq'::regclass);


--
-- Name: periodos_nomina id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.periodos_nomina ALTER COLUMN id SET DEFAULT nextval('public.periodos_nomina_id_seq'::regclass);


--
-- Name: permisos id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.permisos ALTER COLUMN id SET DEFAULT nextval('public.permisos_id_seq'::regclass);


--
-- Name: plantillas_mensaje id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.plantillas_mensaje ALTER COLUMN id SET DEFAULT nextval('public.plantillas_mensaje_id_seq'::regclass);


--
-- Name: productos id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.productos ALTER COLUMN id SET DEFAULT nextval('public.productos_id_seq'::regclass);


--
-- Name: promociones id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.promociones ALTER COLUMN id SET DEFAULT nextval('public.promociones_id_seq'::regclass);


--
-- Name: proveedores id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.proveedores ALTER COLUMN id SET DEFAULT nextval('public.proveedores_id_seq'::regclass);


--
-- Name: reportes_programados id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reportes_programados ALTER COLUMN id SET DEFAULT nextval('public.reportes_programados_id_seq'::regclass);


--
-- Name: roles id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.roles ALTER COLUMN id SET DEFAULT nextval('public.roles_id_seq'::regclass);


--
-- Name: servicios id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.servicios ALTER COLUMN id SET DEFAULT nextval('public.servicios_id_seq'::regclass);


--
-- Name: sesiones id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sesiones ALTER COLUMN id SET DEFAULT nextval('public.sesiones_id_seq'::regclass);


--
-- Name: sesiones_movil id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sesiones_movil ALTER COLUMN id SET DEFAULT nextval('public.sesiones_movil_id_seq'::regclass);


--
-- Name: ubicaciones_inventario id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ubicaciones_inventario ALTER COLUMN id SET DEFAULT nextval('public.ubicaciones_inventario_id_seq'::regclass);


--
-- Name: usuarios id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios ALTER COLUMN id SET DEFAULT nextval('public.usuarios_id_seq'::regclass);


--
-- Name: bloqueos_especialista bloqueos_especialista_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bloqueos_especialista
    ADD CONSTRAINT bloqueos_especialista_pkey PRIMARY KEY (id);


--
-- Name: bonificaciones_deducciones bonificaciones_deducciones_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bonificaciones_deducciones
    ADD CONSTRAINT bonificaciones_deducciones_pkey PRIMARY KEY (id);


--
-- Name: cajas cajas_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cajas
    ADD CONSTRAINT cajas_pkey PRIMARY KEY (id);


--
-- Name: categorias_producto categorias_producto_nombre_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categorias_producto
    ADD CONSTRAINT categorias_producto_nombre_key UNIQUE (nombre);


--
-- Name: categorias_producto categorias_producto_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categorias_producto
    ADD CONSTRAINT categorias_producto_pkey PRIMARY KEY (id);


--
-- Name: categorias_servicio categorias_servicio_nombre_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categorias_servicio
    ADD CONSTRAINT categorias_servicio_nombre_key UNIQUE (nombre);


--
-- Name: categorias_servicio categorias_servicio_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categorias_servicio
    ADD CONSTRAINT categorias_servicio_pkey PRIMARY KEY (id);


--
-- Name: citas citas_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.citas
    ADD CONSTRAINT citas_pkey PRIMARY KEY (id);


--
-- Name: cliente_etiqueta_asignacion cliente_etiqueta_asignacion_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cliente_etiqueta_asignacion
    ADD CONSTRAINT cliente_etiqueta_asignacion_pkey PRIMARY KEY (cliente_id, etiqueta_id);


--
-- Name: cliente_etiquetas cliente_etiquetas_nombre_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cliente_etiquetas
    ADD CONSTRAINT cliente_etiquetas_nombre_key UNIQUE (nombre);


--
-- Name: cliente_etiquetas cliente_etiquetas_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cliente_etiquetas
    ADD CONSTRAINT cliente_etiquetas_pkey PRIMARY KEY (id);


--
-- Name: cliente_fotos cliente_fotos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cliente_fotos
    ADD CONSTRAINT cliente_fotos_pkey PRIMARY KEY (id);


--
-- Name: cliente_historial_comunicacion cliente_historial_comunicacion_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cliente_historial_comunicacion
    ADD CONSTRAINT cliente_historial_comunicacion_pkey PRIMARY KEY (id);


--
-- Name: cliente_preferencias cliente_preferencias_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cliente_preferencias
    ADD CONSTRAINT cliente_preferencias_pkey PRIMARY KEY (id);


--
-- Name: clientes clientes_cedula_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clientes
    ADD CONSTRAINT clientes_cedula_key UNIQUE (cedula);


--
-- Name: clientes clientes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clientes
    ADD CONSTRAINT clientes_pkey PRIMARY KEY (id);


--
-- Name: cola_notificaciones cola_notificaciones_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cola_notificaciones
    ADD CONSTRAINT cola_notificaciones_pkey PRIMARY KEY (id);


--
-- Name: configuracion configuracion_clave_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.configuracion
    ADD CONSTRAINT configuracion_clave_key UNIQUE (clave);


--
-- Name: configuracion configuracion_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.configuracion
    ADD CONSTRAINT configuracion_pkey PRIMARY KEY (id);


--
-- Name: cupones cupones_codigo_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cupones
    ADD CONSTRAINT cupones_codigo_key UNIQUE (codigo);


--
-- Name: cupones cupones_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cupones
    ADD CONSTRAINT cupones_pkey PRIMARY KEY (id);


--
-- Name: cupones_usados cupones_usados_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cupones_usados
    ADD CONSTRAINT cupones_usados_pkey PRIMARY KEY (id);


--
-- Name: detalle_factura detalle_factura_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.detalle_factura
    ADD CONSTRAINT detalle_factura_pkey PRIMARY KEY (id);


--
-- Name: detalle_orden_compra detalle_orden_compra_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.detalle_orden_compra
    ADD CONSTRAINT detalle_orden_compra_pkey PRIMARY KEY (id);


--
-- Name: empresa empresa_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.empresa
    ADD CONSTRAINT empresa_pkey PRIMARY KEY (id);


--
-- Name: especialista_servicios especialista_servicios_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.especialista_servicios
    ADD CONSTRAINT especialista_servicios_pkey PRIMARY KEY (especialista_id, servicio_id);


--
-- Name: especialistas especialistas_documento_identidad_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.especialistas
    ADD CONSTRAINT especialistas_documento_identidad_key UNIQUE (documento_identidad);


--
-- Name: especialistas especialistas_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.especialistas
    ADD CONSTRAINT especialistas_email_key UNIQUE (email);


--
-- Name: especialistas especialistas_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.especialistas
    ADD CONSTRAINT especialistas_pkey PRIMARY KEY (id);


--
-- Name: facturas facturas_numero_factura_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.facturas
    ADD CONSTRAINT facturas_numero_factura_key UNIQUE (numero_factura);


--
-- Name: facturas_pendientes facturas_pendientes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.facturas_pendientes
    ADD CONSTRAINT facturas_pendientes_pkey PRIMARY KEY (id);


--
-- Name: facturas facturas_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.facturas
    ADD CONSTRAINT facturas_pkey PRIMARY KEY (id);


--
-- Name: historial_citas historial_citas_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.historial_citas
    ADD CONSTRAINT historial_citas_pkey PRIMARY KEY (id);


--
-- Name: horarios_especialista horarios_especialista_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.horarios_especialista
    ADD CONSTRAINT horarios_especialista_pkey PRIMARY KEY (id);


--
-- Name: inventario inventario_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventario
    ADD CONSTRAINT inventario_pkey PRIMARY KEY (id);


--
-- Name: log_auditoria log_auditoria_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.log_auditoria
    ADD CONSTRAINT log_auditoria_pkey PRIMARY KEY (id);


--
-- Name: metodos_pago metodos_pago_nombre_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.metodos_pago
    ADD CONSTRAINT metodos_pago_nombre_key UNIQUE (nombre);


--
-- Name: metodos_pago metodos_pago_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.metodos_pago
    ADD CONSTRAINT metodos_pago_pkey PRIMARY KEY (id);


--
-- Name: movimientos_caja movimientos_caja_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.movimientos_caja
    ADD CONSTRAINT movimientos_caja_pkey PRIMARY KEY (id);


--
-- Name: movimientos_inventario movimientos_inventario_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.movimientos_inventario
    ADD CONSTRAINT movimientos_inventario_pkey PRIMARY KEY (id);


--
-- Name: nomina_detalle_lineas nomina_detalle_lineas_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.nomina_detalle_lineas
    ADD CONSTRAINT nomina_detalle_lineas_pkey PRIMARY KEY (id);


--
-- Name: nomina_detalle nomina_detalle_periodo_id_especialista_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.nomina_detalle
    ADD CONSTRAINT nomina_detalle_periodo_id_especialista_id_key UNIQUE (periodo_id, especialista_id);


--
-- Name: nomina_detalle nomina_detalle_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.nomina_detalle
    ADD CONSTRAINT nomina_detalle_pkey PRIMARY KEY (id);


--
-- Name: notificaciones notificaciones_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notificaciones
    ADD CONSTRAINT notificaciones_pkey PRIMARY KEY (id);


--
-- Name: ordenes_compra ordenes_compra_numero_orden_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ordenes_compra
    ADD CONSTRAINT ordenes_compra_numero_orden_key UNIQUE (numero_orden);


--
-- Name: ordenes_compra ordenes_compra_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ordenes_compra
    ADD CONSTRAINT ordenes_compra_pkey PRIMARY KEY (id);


--
-- Name: periodos_nomina periodos_nomina_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.periodos_nomina
    ADD CONSTRAINT periodos_nomina_pkey PRIMARY KEY (id);


--
-- Name: permisos permisos_codigo_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.permisos
    ADD CONSTRAINT permisos_codigo_key UNIQUE (codigo);


--
-- Name: permisos permisos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.permisos
    ADD CONSTRAINT permisos_pkey PRIMARY KEY (id);


--
-- Name: plantillas_mensaje plantillas_mensaje_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.plantillas_mensaje
    ADD CONSTRAINT plantillas_mensaje_pkey PRIMARY KEY (id);


--
-- Name: plantillas_mensaje plantillas_mensaje_tipo_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.plantillas_mensaje
    ADD CONSTRAINT plantillas_mensaje_tipo_key UNIQUE (tipo);


--
-- Name: productos productos_codigo_barras_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.productos
    ADD CONSTRAINT productos_codigo_barras_key UNIQUE (codigo_barras);


--
-- Name: productos productos_codigo_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.productos
    ADD CONSTRAINT productos_codigo_key UNIQUE (codigo);


--
-- Name: productos productos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.productos
    ADD CONSTRAINT productos_pkey PRIMARY KEY (id);


--
-- Name: promociones promociones_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.promociones
    ADD CONSTRAINT promociones_pkey PRIMARY KEY (id);


--
-- Name: proveedores proveedores_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.proveedores
    ADD CONSTRAINT proveedores_pkey PRIMARY KEY (id);


--
-- Name: reportes_programados reportes_programados_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reportes_programados
    ADD CONSTRAINT reportes_programados_pkey PRIMARY KEY (id);


--
-- Name: rol_permisos rol_permisos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rol_permisos
    ADD CONSTRAINT rol_permisos_pkey PRIMARY KEY (rol_id, permiso_id);


--
-- Name: roles roles_nombre_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_nombre_key UNIQUE (nombre);


--
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (id);


--
-- Name: servicio_productos servicio_productos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.servicio_productos
    ADD CONSTRAINT servicio_productos_pkey PRIMARY KEY (servicio_id, producto_id);


--
-- Name: servicios servicios_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.servicios
    ADD CONSTRAINT servicios_pkey PRIMARY KEY (id);


--
-- Name: sesiones_movil sesiones_movil_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sesiones_movil
    ADD CONSTRAINT sesiones_movil_pkey PRIMARY KEY (id);


--
-- Name: sesiones sesiones_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sesiones
    ADD CONSTRAINT sesiones_pkey PRIMARY KEY (id);


--
-- Name: sesiones sesiones_token_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sesiones
    ADD CONSTRAINT sesiones_token_key UNIQUE (token);


--
-- Name: ubicaciones_inventario ubicaciones_inventario_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ubicaciones_inventario
    ADD CONSTRAINT ubicaciones_inventario_pkey PRIMARY KEY (id);


--
-- Name: inventario uq_inventario_producto_ubicacion; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventario
    ADD CONSTRAINT uq_inventario_producto_ubicacion UNIQUE (producto_id, ubicacion_id);


--
-- Name: usuarios usuarios_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_email_key UNIQUE (email);


--
-- Name: usuarios usuarios_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_pkey PRIMARY KEY (id);


--
-- Name: usuarios usuarios_username_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_username_key UNIQUE (username);


--
-- Name: idx_auditoria_fecha; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_auditoria_fecha ON public.log_auditoria USING btree (fecha);


--
-- Name: idx_auditoria_modulo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_auditoria_modulo ON public.log_auditoria USING btree (modulo);


--
-- Name: idx_auditoria_usuario; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_auditoria_usuario ON public.log_auditoria USING btree (usuario_id);


--
-- Name: idx_bloqueos_especialista_fecha; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_bloqueos_especialista_fecha ON public.bloqueos_especialista USING btree (especialista_id, fecha_inicio, fecha_fin);


--
-- Name: idx_citas_cliente_fecha; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_citas_cliente_fecha ON public.citas USING btree (cliente_id, fecha);


--
-- Name: idx_citas_especialista_fecha; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_citas_especialista_fecha ON public.citas USING btree (especialista_id, fecha);


--
-- Name: idx_citas_fecha_estado; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_citas_fecha_estado ON public.citas USING btree (fecha, estado);


--
-- Name: idx_clientes_email; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_clientes_email ON public.clientes USING btree (email);


--
-- Name: idx_clientes_nombre; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_clientes_nombre ON public.clientes USING btree (nombre, apellido);


--
-- Name: idx_clientes_telefono; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_clientes_telefono ON public.clientes USING btree (telefono);


--
-- Name: idx_cola_notificaciones_estado; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_cola_notificaciones_estado ON public.cola_notificaciones USING btree (estado, fecha_programada);


--
-- Name: idx_detalle_factura_especialista; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_detalle_factura_especialista ON public.detalle_factura USING btree (especialista_id);


--
-- Name: idx_detalle_factura_tipo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_detalle_factura_tipo ON public.detalle_factura USING btree (tipo, item_id);


--
-- Name: idx_especialistas_documento; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_especialistas_documento ON public.especialistas USING btree (documento_identidad);


--
-- Name: idx_especialistas_estado; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_especialistas_estado ON public.especialistas USING btree (estado);


--
-- Name: idx_especialistas_nombre; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_especialistas_nombre ON public.especialistas USING btree (nombre, apellido);


--
-- Name: idx_facturas_caja; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_facturas_caja ON public.facturas USING btree (caja_id);


--
-- Name: idx_facturas_cliente; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_facturas_cliente ON public.facturas USING btree (cliente_id);


--
-- Name: idx_facturas_fecha; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_facturas_fecha ON public.facturas USING btree (fecha);


--
-- Name: idx_facturas_numero; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_facturas_numero ON public.facturas USING btree (numero_factura);


--
-- Name: idx_horarios_especialista; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_horarios_especialista ON public.horarios_especialista USING btree (especialista_id, dia_semana);


--
-- Name: idx_nomina_especialista; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_nomina_especialista ON public.nomina_detalle USING btree (especialista_id);


--
-- Name: idx_nomina_periodo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_nomina_periodo ON public.nomina_detalle USING btree (periodo_id);


--
-- Name: idx_notificaciones_usuario; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notificaciones_usuario ON public.notificaciones USING btree (usuario_id, leida);


--
-- Name: idx_productos_categoria; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_productos_categoria ON public.productos USING btree (categoria_id);


--
-- Name: idx_productos_codigo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_productos_codigo ON public.productos USING btree (codigo);


--
-- Name: idx_productos_codigo_barras; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_productos_codigo_barras ON public.productos USING btree (codigo_barras);


--
-- Name: idx_productos_stock_bajo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_productos_stock_bajo ON public.productos USING btree (stock_actual, stock_minimo) WHERE (stock_actual <= stock_minimo);


--
-- Name: idx_servicios_categoria; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_servicios_categoria ON public.servicios USING btree (categoria_id);


--
-- Name: idx_servicios_estado; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_servicios_estado ON public.servicios USING btree (estado);


--
-- Name: idx_sesiones_token; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sesiones_token ON public.sesiones USING btree (token);


--
-- Name: idx_sesiones_usuario; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sesiones_usuario ON public.sesiones USING btree (usuario_id);


--
-- Name: ix_clientes_cedula; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_clientes_cedula ON public.clientes USING btree (cedula);


--
-- Name: ix_inventario_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_inventario_id ON public.inventario USING btree (id);


--
-- Name: ix_inventario_producto_ubicacion; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_inventario_producto_ubicacion ON public.inventario USING btree (producto_id, ubicacion_id);


--
-- Name: ix_movimientos_fecha_movimiento; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_movimientos_fecha_movimiento ON public.movimientos_inventario USING btree (fecha_movimiento);


--
-- Name: ix_movimientos_inventario_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_movimientos_inventario_id ON public.movimientos_inventario USING btree (id);


--
-- Name: ix_movimientos_producto_fecha; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_movimientos_producto_fecha ON public.movimientos_inventario USING btree (producto_id, fecha_movimiento);


--
-- Name: ix_movimientos_tipo_fecha; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_movimientos_tipo_fecha ON public.movimientos_inventario USING btree (tipo_movimiento, fecha_movimiento);


--
-- Name: ix_movimientos_tipo_movimiento; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_movimientos_tipo_movimiento ON public.movimientos_inventario USING btree (tipo_movimiento);


--
-- Name: ix_ubicaciones_inventario_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_ubicaciones_inventario_id ON public.ubicaciones_inventario USING btree (id);


--
-- Name: ix_ubicaciones_inventario_nombre; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX ix_ubicaciones_inventario_nombre ON public.ubicaciones_inventario USING btree (nombre);


--
-- Name: detalle_factura tr_actualizar_stock; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER tr_actualizar_stock AFTER INSERT ON public.detalle_factura FOR EACH ROW EXECUTE FUNCTION public.actualizar_stock_factura();


--
-- Name: citas tr_actualizar_visitas; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER tr_actualizar_visitas AFTER UPDATE ON public.citas FOR EACH ROW EXECUTE FUNCTION public.actualizar_visitas_cliente();


--
-- Name: clientes tr_clientes_update; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER tr_clientes_update BEFORE UPDATE ON public.clientes FOR EACH ROW EXECUTE FUNCTION public.update_fecha_actualizacion();


--
-- Name: especialistas tr_especialistas_update; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER tr_especialistas_update BEFORE UPDATE ON public.especialistas FOR EACH ROW EXECUTE FUNCTION public.update_fecha_actualizacion();


--
-- Name: productos tr_productos_update; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER tr_productos_update BEFORE UPDATE ON public.productos FOR EACH ROW EXECUTE FUNCTION public.update_fecha_actualizacion();


--
-- Name: servicios tr_servicios_update; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER tr_servicios_update BEFORE UPDATE ON public.servicios FOR EACH ROW EXECUTE FUNCTION public.update_fecha_actualizacion();


--
-- Name: usuarios tr_usuarios_update; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER tr_usuarios_update BEFORE UPDATE ON public.usuarios FOR EACH ROW EXECUTE FUNCTION public.update_fecha_actualizacion();


--
-- Name: bloqueos_especialista bloqueos_especialista_especialista_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bloqueos_especialista
    ADD CONSTRAINT bloqueos_especialista_especialista_id_fkey FOREIGN KEY (especialista_id) REFERENCES public.especialistas(id) ON DELETE CASCADE;


--
-- Name: bonificaciones_deducciones bonificaciones_deducciones_nomina_detalle_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bonificaciones_deducciones
    ADD CONSTRAINT bonificaciones_deducciones_nomina_detalle_id_fkey FOREIGN KEY (nomina_detalle_id) REFERENCES public.nomina_detalle(id) ON DELETE CASCADE;


--
-- Name: cajas cajas_usuario_apertura_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cajas
    ADD CONSTRAINT cajas_usuario_apertura_fkey FOREIGN KEY (usuario_apertura) REFERENCES public.usuarios(id);


--
-- Name: cajas cajas_usuario_cierre_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cajas
    ADD CONSTRAINT cajas_usuario_cierre_fkey FOREIGN KEY (usuario_cierre) REFERENCES public.usuarios(id);


--
-- Name: citas citas_cliente_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.citas
    ADD CONSTRAINT citas_cliente_id_fkey FOREIGN KEY (cliente_id) REFERENCES public.clientes(id);


--
-- Name: citas citas_creado_por_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.citas
    ADD CONSTRAINT citas_creado_por_fkey FOREIGN KEY (creado_por) REFERENCES public.usuarios(id);


--
-- Name: citas citas_especialista_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.citas
    ADD CONSTRAINT citas_especialista_id_fkey FOREIGN KEY (especialista_id) REFERENCES public.especialistas(id);


--
-- Name: citas citas_servicio_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.citas
    ADD CONSTRAINT citas_servicio_id_fkey FOREIGN KEY (servicio_id) REFERENCES public.servicios(id);


--
-- Name: cliente_etiqueta_asignacion cliente_etiqueta_asignacion_cliente_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cliente_etiqueta_asignacion
    ADD CONSTRAINT cliente_etiqueta_asignacion_cliente_id_fkey FOREIGN KEY (cliente_id) REFERENCES public.clientes(id) ON DELETE CASCADE;


--
-- Name: cliente_etiqueta_asignacion cliente_etiqueta_asignacion_etiqueta_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cliente_etiqueta_asignacion
    ADD CONSTRAINT cliente_etiqueta_asignacion_etiqueta_id_fkey FOREIGN KEY (etiqueta_id) REFERENCES public.cliente_etiquetas(id) ON DELETE CASCADE;


--
-- Name: cliente_fotos cliente_fotos_cliente_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cliente_fotos
    ADD CONSTRAINT cliente_fotos_cliente_id_fkey FOREIGN KEY (cliente_id) REFERENCES public.clientes(id) ON DELETE CASCADE;


--
-- Name: cliente_fotos cliente_fotos_servicio_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cliente_fotos
    ADD CONSTRAINT cliente_fotos_servicio_id_fkey FOREIGN KEY (servicio_id) REFERENCES public.servicios(id);


--
-- Name: cliente_historial_comunicacion cliente_historial_comunicacion_cliente_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cliente_historial_comunicacion
    ADD CONSTRAINT cliente_historial_comunicacion_cliente_id_fkey FOREIGN KEY (cliente_id) REFERENCES public.clientes(id) ON DELETE CASCADE;


--
-- Name: cliente_historial_comunicacion cliente_historial_comunicacion_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cliente_historial_comunicacion
    ADD CONSTRAINT cliente_historial_comunicacion_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id);


--
-- Name: cliente_preferencias cliente_preferencias_cliente_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cliente_preferencias
    ADD CONSTRAINT cliente_preferencias_cliente_id_fkey FOREIGN KEY (cliente_id) REFERENCES public.clientes(id) ON DELETE CASCADE;


--
-- Name: cupones cupones_cliente_especifico_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cupones
    ADD CONSTRAINT cupones_cliente_especifico_fkey FOREIGN KEY (cliente_especifico) REFERENCES public.clientes(id);


--
-- Name: cupones cupones_promocion_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cupones
    ADD CONSTRAINT cupones_promocion_id_fkey FOREIGN KEY (promocion_id) REFERENCES public.promociones(id) ON DELETE CASCADE;


--
-- Name: cupones_usados cupones_usados_cliente_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cupones_usados
    ADD CONSTRAINT cupones_usados_cliente_id_fkey FOREIGN KEY (cliente_id) REFERENCES public.clientes(id);


--
-- Name: cupones_usados cupones_usados_cupon_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cupones_usados
    ADD CONSTRAINT cupones_usados_cupon_id_fkey FOREIGN KEY (cupon_id) REFERENCES public.cupones(id);


--
-- Name: cupones_usados cupones_usados_factura_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cupones_usados
    ADD CONSTRAINT cupones_usados_factura_id_fkey FOREIGN KEY (factura_id) REFERENCES public.facturas(id);


--
-- Name: detalle_factura detalle_factura_cita_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.detalle_factura
    ADD CONSTRAINT detalle_factura_cita_id_fkey FOREIGN KEY (cita_id) REFERENCES public.citas(id);


--
-- Name: detalle_factura detalle_factura_especialista_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.detalle_factura
    ADD CONSTRAINT detalle_factura_especialista_id_fkey FOREIGN KEY (especialista_id) REFERENCES public.especialistas(id);


--
-- Name: detalle_factura detalle_factura_factura_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.detalle_factura
    ADD CONSTRAINT detalle_factura_factura_id_fkey FOREIGN KEY (factura_id) REFERENCES public.facturas(id) ON DELETE CASCADE;


--
-- Name: detalle_orden_compra detalle_orden_compra_orden_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.detalle_orden_compra
    ADD CONSTRAINT detalle_orden_compra_orden_id_fkey FOREIGN KEY (orden_id) REFERENCES public.ordenes_compra(id) ON DELETE CASCADE;


--
-- Name: detalle_orden_compra detalle_orden_compra_producto_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.detalle_orden_compra
    ADD CONSTRAINT detalle_orden_compra_producto_id_fkey FOREIGN KEY (producto_id) REFERENCES public.productos(id);


--
-- Name: especialista_servicios especialista_servicios_especialista_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.especialista_servicios
    ADD CONSTRAINT especialista_servicios_especialista_id_fkey FOREIGN KEY (especialista_id) REFERENCES public.especialistas(id) ON DELETE CASCADE;


--
-- Name: especialista_servicios especialista_servicios_servicio_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.especialista_servicios
    ADD CONSTRAINT especialista_servicios_servicio_id_fkey FOREIGN KEY (servicio_id) REFERENCES public.servicios(id) ON DELETE CASCADE;


--
-- Name: facturas facturas_caja_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.facturas
    ADD CONSTRAINT facturas_caja_id_fkey FOREIGN KEY (caja_id) REFERENCES public.cajas(id);


--
-- Name: facturas facturas_cliente_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.facturas
    ADD CONSTRAINT facturas_cliente_id_fkey FOREIGN KEY (cliente_id) REFERENCES public.clientes(id);


--
-- Name: facturas facturas_metodo_pago_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.facturas
    ADD CONSTRAINT facturas_metodo_pago_id_fkey FOREIGN KEY (metodo_pago_id) REFERENCES public.metodos_pago(id);


--
-- Name: facturas_pendientes facturas_pendientes_cliente_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.facturas_pendientes
    ADD CONSTRAINT facturas_pendientes_cliente_id_fkey FOREIGN KEY (cliente_id) REFERENCES public.clientes(id);


--
-- Name: facturas_pendientes facturas_pendientes_especialista_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.facturas_pendientes
    ADD CONSTRAINT facturas_pendientes_especialista_id_fkey FOREIGN KEY (especialista_id) REFERENCES public.especialistas(id);


--
-- Name: facturas_pendientes facturas_pendientes_revisado_por_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.facturas_pendientes
    ADD CONSTRAINT facturas_pendientes_revisado_por_fkey FOREIGN KEY (revisado_por) REFERENCES public.usuarios(id);


--
-- Name: facturas_pendientes facturas_pendientes_servicio_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.facturas_pendientes
    ADD CONSTRAINT facturas_pendientes_servicio_id_fkey FOREIGN KEY (servicio_id) REFERENCES public.servicios(id);


--
-- Name: facturas facturas_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.facturas
    ADD CONSTRAINT facturas_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id);


--
-- Name: usuarios fk_usuarios_especialista; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT fk_usuarios_especialista FOREIGN KEY (especialista_id) REFERENCES public.especialistas(id);


--
-- Name: historial_citas historial_citas_cita_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.historial_citas
    ADD CONSTRAINT historial_citas_cita_id_fkey FOREIGN KEY (cita_id) REFERENCES public.citas(id) ON DELETE CASCADE;


--
-- Name: historial_citas historial_citas_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.historial_citas
    ADD CONSTRAINT historial_citas_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id);


--
-- Name: horarios_especialista horarios_especialista_especialista_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.horarios_especialista
    ADD CONSTRAINT horarios_especialista_especialista_id_fkey FOREIGN KEY (especialista_id) REFERENCES public.especialistas(id) ON DELETE CASCADE;


--
-- Name: inventario inventario_producto_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventario
    ADD CONSTRAINT inventario_producto_id_fkey FOREIGN KEY (producto_id) REFERENCES public.productos(id) ON DELETE CASCADE;


--
-- Name: inventario inventario_ubicacion_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventario
    ADD CONSTRAINT inventario_ubicacion_id_fkey FOREIGN KEY (ubicacion_id) REFERENCES public.ubicaciones_inventario(id) ON DELETE CASCADE;


--
-- Name: log_auditoria log_auditoria_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.log_auditoria
    ADD CONSTRAINT log_auditoria_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id);


--
-- Name: movimientos_caja movimientos_caja_caja_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.movimientos_caja
    ADD CONSTRAINT movimientos_caja_caja_id_fkey FOREIGN KEY (caja_id) REFERENCES public.cajas(id);


--
-- Name: movimientos_caja movimientos_caja_factura_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.movimientos_caja
    ADD CONSTRAINT movimientos_caja_factura_id_fkey FOREIGN KEY (factura_id) REFERENCES public.facturas(id);


--
-- Name: movimientos_caja movimientos_caja_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.movimientos_caja
    ADD CONSTRAINT movimientos_caja_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id);


--
-- Name: movimientos_inventario movimientos_inventario_producto_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.movimientos_inventario
    ADD CONSTRAINT movimientos_inventario_producto_id_fkey FOREIGN KEY (producto_id) REFERENCES public.productos(id) ON DELETE CASCADE;


--
-- Name: movimientos_inventario movimientos_inventario_ubicacion_destino_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.movimientos_inventario
    ADD CONSTRAINT movimientos_inventario_ubicacion_destino_id_fkey FOREIGN KEY (ubicacion_destino_id) REFERENCES public.ubicaciones_inventario(id) ON DELETE SET NULL;


--
-- Name: movimientos_inventario movimientos_inventario_ubicacion_origen_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.movimientos_inventario
    ADD CONSTRAINT movimientos_inventario_ubicacion_origen_id_fkey FOREIGN KEY (ubicacion_origen_id) REFERENCES public.ubicaciones_inventario(id) ON DELETE SET NULL;


--
-- Name: movimientos_inventario movimientos_inventario_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.movimientos_inventario
    ADD CONSTRAINT movimientos_inventario_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id) ON DELETE SET NULL;


--
-- Name: nomina_detalle nomina_detalle_especialista_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.nomina_detalle
    ADD CONSTRAINT nomina_detalle_especialista_id_fkey FOREIGN KEY (especialista_id) REFERENCES public.especialistas(id);


--
-- Name: nomina_detalle_lineas nomina_detalle_lineas_factura_detalle_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.nomina_detalle_lineas
    ADD CONSTRAINT nomina_detalle_lineas_factura_detalle_id_fkey FOREIGN KEY (factura_detalle_id) REFERENCES public.detalle_factura(id);


--
-- Name: nomina_detalle_lineas nomina_detalle_lineas_nomina_detalle_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.nomina_detalle_lineas
    ADD CONSTRAINT nomina_detalle_lineas_nomina_detalle_id_fkey FOREIGN KEY (nomina_detalle_id) REFERENCES public.nomina_detalle(id) ON DELETE CASCADE;


--
-- Name: nomina_detalle nomina_detalle_periodo_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.nomina_detalle
    ADD CONSTRAINT nomina_detalle_periodo_id_fkey FOREIGN KEY (periodo_id) REFERENCES public.periodos_nomina(id) ON DELETE CASCADE;


--
-- Name: notificaciones notificaciones_especialista_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notificaciones
    ADD CONSTRAINT notificaciones_especialista_id_fkey FOREIGN KEY (especialista_id) REFERENCES public.especialistas(id);


--
-- Name: notificaciones notificaciones_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notificaciones
    ADD CONSTRAINT notificaciones_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id);


--
-- Name: ordenes_compra ordenes_compra_proveedor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ordenes_compra
    ADD CONSTRAINT ordenes_compra_proveedor_id_fkey FOREIGN KEY (proveedor_id) REFERENCES public.proveedores(id);


--
-- Name: ordenes_compra ordenes_compra_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ordenes_compra
    ADD CONSTRAINT ordenes_compra_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id);


--
-- Name: periodos_nomina periodos_nomina_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.periodos_nomina
    ADD CONSTRAINT periodos_nomina_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id);


--
-- Name: productos productos_categoria_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.productos
    ADD CONSTRAINT productos_categoria_id_fkey FOREIGN KEY (categoria_id) REFERENCES public.categorias_producto(id);


--
-- Name: productos productos_proveedor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.productos
    ADD CONSTRAINT productos_proveedor_id_fkey FOREIGN KEY (proveedor_id) REFERENCES public.proveedores(id);


--
-- Name: reportes_programados reportes_programados_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reportes_programados
    ADD CONSTRAINT reportes_programados_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id);


--
-- Name: rol_permisos rol_permisos_permiso_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rol_permisos
    ADD CONSTRAINT rol_permisos_permiso_id_fkey FOREIGN KEY (permiso_id) REFERENCES public.permisos(id) ON DELETE CASCADE;


--
-- Name: rol_permisos rol_permisos_rol_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rol_permisos
    ADD CONSTRAINT rol_permisos_rol_id_fkey FOREIGN KEY (rol_id) REFERENCES public.roles(id) ON DELETE CASCADE;


--
-- Name: servicio_productos servicio_productos_producto_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.servicio_productos
    ADD CONSTRAINT servicio_productos_producto_id_fkey FOREIGN KEY (producto_id) REFERENCES public.productos(id) ON DELETE CASCADE;


--
-- Name: servicio_productos servicio_productos_servicio_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.servicio_productos
    ADD CONSTRAINT servicio_productos_servicio_id_fkey FOREIGN KEY (servicio_id) REFERENCES public.servicios(id) ON DELETE CASCADE;


--
-- Name: servicios servicios_categoria_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.servicios
    ADD CONSTRAINT servicios_categoria_id_fkey FOREIGN KEY (categoria_id) REFERENCES public.categorias_servicio(id);


--
-- Name: sesiones_movil sesiones_movil_especialista_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sesiones_movil
    ADD CONSTRAINT sesiones_movil_especialista_id_fkey FOREIGN KEY (especialista_id) REFERENCES public.especialistas(id) ON DELETE CASCADE;


--
-- Name: sesiones sesiones_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sesiones
    ADD CONSTRAINT sesiones_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id) ON DELETE CASCADE;


--
-- Name: usuarios usuarios_rol_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_rol_id_fkey FOREIGN KEY (rol_id) REFERENCES public.roles(id);


--
-- PostgreSQL database dump complete
--

\unrestrict W68ZJa5TjtvfEB12PlgQGCQ5uGxnCcNhxoCUSXWHpjfAPhKCB2wMvAyDHpdBgjr

