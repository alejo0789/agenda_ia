-- ============================================
-- SISTEMA DE GESTIÓN CLUB DE ALISADOS
-- Script de Creación de Base de Datos
-- ============================================

-- Configuración inicial
SET client_encoding = 'UTF8';

-- ============================================
-- MÓDULO 9: CONTROL DE ACCESO (Primero por dependencias)
-- ============================================

CREATE TABLE roles (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL UNIQUE,
    descripcion TEXT,
    es_sistema BOOLEAN DEFAULT FALSE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE permisos (
    id SERIAL PRIMARY KEY,
    codigo VARCHAR(50) NOT NULL UNIQUE,
    nombre VARCHAR(100) NOT NULL,
    modulo VARCHAR(50) NOT NULL,
    descripcion TEXT,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE rol_permisos (
    rol_id INTEGER NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permiso_id INTEGER NOT NULL REFERENCES permisos(id) ON DELETE CASCADE,
    PRIMARY KEY (rol_id, permiso_id)
);

CREATE TABLE usuarios (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    especialista_id INTEGER, -- Se agregará FK después
    rol_id INTEGER NOT NULL REFERENCES roles(id),
    estado VARCHAR(20) DEFAULT 'activo' CHECK (estado IN ('activo', 'inactivo', 'bloqueado')),
    ultimo_acceso TIMESTAMP,
    intentos_fallidos INTEGER DEFAULT 0,
    fecha_bloqueo TIMESTAMP,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE sesiones (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    token VARCHAR(500) NOT NULL UNIQUE,
    ip VARCHAR(45),
    user_agent TEXT,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_expiracion TIMESTAMP NOT NULL
);

CREATE TABLE log_auditoria (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER REFERENCES usuarios(id),
    accion VARCHAR(50) NOT NULL,
    modulo VARCHAR(50) NOT NULL,
    entidad VARCHAR(50),
    entidad_id INTEGER,
    datos_anteriores JSONB,
    datos_nuevos JSONB,
    ip VARCHAR(45),
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- MÓDULO 1: GESTIÓN DE ESPECIALISTAS
-- ============================================

CREATE TABLE especialistas (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100) NOT NULL,
    documento_identidad VARCHAR(20) UNIQUE,
    telefono VARCHAR(20),
    email VARCHAR(100) UNIQUE,
    foto TEXT,
    estado VARCHAR(20) DEFAULT 'activo' CHECK (estado IN ('activo', 'inactivo')),
    fecha_ingreso DATE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Agregar FK de usuarios a especialistas
ALTER TABLE usuarios 
ADD CONSTRAINT fk_usuarios_especialista 
FOREIGN KEY (especialista_id) REFERENCES especialistas(id);

CREATE TABLE horarios_especialista (
    id SERIAL PRIMARY KEY,
    especialista_id INTEGER NOT NULL REFERENCES especialistas(id) ON DELETE CASCADE,
    dia_semana SMALLINT NOT NULL CHECK (dia_semana BETWEEN 0 AND 6), -- 0=Domingo, 6=Sábado
    hora_inicio TIME NOT NULL,
    hora_fin TIME NOT NULL,
    activo BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_horario_valido CHECK (hora_fin > hora_inicio)
);

CREATE TABLE bloqueos_especialista (
    id SERIAL PRIMARY KEY,
    especialista_id INTEGER NOT NULL REFERENCES especialistas(id) ON DELETE CASCADE,
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE NOT NULL,
    hora_inicio TIME,
    hora_fin TIME,
    motivo VARCHAR(255),
    es_recurrente BOOLEAN DEFAULT FALSE,
    dias_semana JSONB, -- Array de días [0,1,2,3,4,5,6]
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_fecha_bloqueo CHECK (fecha_fin >= fecha_inicio)
);

-- ============================================
-- MÓDULO 2: GESTIÓN DE SERVICIOS
-- ============================================

CREATE TABLE categorias_servicio (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE,
    descripcion TEXT,
    orden_visualizacion INTEGER DEFAULT 0,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE servicios (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    duracion_minutos INTEGER NOT NULL CHECK (duracion_minutos >= 15),
    precio_base DECIMAL(12, 2) NOT NULL CHECK (precio_base >= 0),
    categoria_id INTEGER REFERENCES categorias_servicio(id),
    requiere_producto BOOLEAN DEFAULT FALSE,
    estado VARCHAR(20) DEFAULT 'activo' CHECK (estado IN ('activo', 'inactivo')),
    color_calendario VARCHAR(7) DEFAULT '#3498db', -- Formato HEX
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE especialista_servicios (
    especialista_id INTEGER NOT NULL REFERENCES especialistas(id) ON DELETE CASCADE,
    servicio_id INTEGER NOT NULL REFERENCES servicios(id) ON DELETE CASCADE,
    tipo_comision VARCHAR(20) NOT NULL CHECK (tipo_comision IN ('porcentaje', 'fijo')),
    valor_comision DECIMAL(12, 2) NOT NULL CHECK (valor_comision >= 0),
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (especialista_id, servicio_id)
);

-- ============================================
-- MÓDULO 6: GESTIÓN DE INVENTARIO
-- ============================================

CREATE TABLE categorias_producto (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE,
    descripcion TEXT,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE proveedores (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    contacto VARCHAR(100),
    telefono VARCHAR(20),
    email VARCHAR(100),
    direccion TEXT,
    estado VARCHAR(20) DEFAULT 'activo' CHECK (estado IN ('activo', 'inactivo')),
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE productos (
    id SERIAL PRIMARY KEY,
    codigo VARCHAR(50) UNIQUE,
    codigo_barras VARCHAR(50) UNIQUE,
    nombre VARCHAR(150) NOT NULL,
    descripcion TEXT,
    categoria_id INTEGER REFERENCES categorias_producto(id),
    proveedor_id INTEGER REFERENCES proveedores(id),
    precio_compra DECIMAL(12, 2) DEFAULT 0 CHECK (precio_compra >= 0),
    precio_venta DECIMAL(12, 2) NOT NULL CHECK (precio_venta >= 0),
    stock_actual DECIMAL(12, 3) DEFAULT 0,
    stock_minimo DECIMAL(12, 3) DEFAULT 0,
    unidad_medida VARCHAR(20) DEFAULT 'unidad',
    estado VARCHAR(20) DEFAULT 'activo' CHECK (estado IN ('activo', 'inactivo')),
    comision_venta DECIMAL(5, 2) DEFAULT 0, -- Porcentaje de comisión
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE movimientos_inventario (
    id SERIAL PRIMARY KEY,
    producto_id INTEGER NOT NULL REFERENCES productos(id),
    tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('entrada', 'salida', 'ajuste')),
    cantidad DECIMAL(12, 3) NOT NULL,
    cantidad_anterior DECIMAL(12, 3) NOT NULL,
    cantidad_nueva DECIMAL(12, 3) NOT NULL,
    motivo VARCHAR(255),
    documento_referencia VARCHAR(100),
    usuario_id INTEGER REFERENCES usuarios(id),
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE ordenes_compra (
    id SERIAL PRIMARY KEY,
    numero_orden VARCHAR(50) UNIQUE,
    proveedor_id INTEGER NOT NULL REFERENCES proveedores(id),
    fecha DATE NOT NULL DEFAULT CURRENT_DATE,
    estado VARCHAR(20) DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'recibida', 'cancelada')),
    total DECIMAL(12, 2) DEFAULT 0,
    notas TEXT,
    usuario_id INTEGER REFERENCES usuarios(id),
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE detalle_orden_compra (
    id SERIAL PRIMARY KEY,
    orden_id INTEGER NOT NULL REFERENCES ordenes_compra(id) ON DELETE CASCADE,
    producto_id INTEGER NOT NULL REFERENCES productos(id),
    cantidad DECIMAL(12, 3) NOT NULL CHECK (cantidad > 0),
    precio_unitario DECIMAL(12, 2) NOT NULL CHECK (precio_unitario >= 0),
    subtotal DECIMAL(12, 2) GENERATED ALWAYS AS (cantidad * precio_unitario) STORED
);

-- Relación servicios-productos (productos consumidos por servicio)
CREATE TABLE servicio_productos (
    servicio_id INTEGER NOT NULL REFERENCES servicios(id) ON DELETE CASCADE,
    producto_id INTEGER NOT NULL REFERENCES productos(id) ON DELETE CASCADE,
    cantidad_consumida DECIMAL(12, 3) NOT NULL CHECK (cantidad_consumida > 0),
    PRIMARY KEY (servicio_id, producto_id)
);

-- ============================================
-- MÓDULO 3: AGENDA Y CALENDARIO (CLIENTES)
-- ============================================

CREATE TABLE clientes (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100),
    telefono VARCHAR(20),
    email VARCHAR(100),
    fecha_nacimiento DATE,
    direccion TEXT,
    notas TEXT,
    fecha_primera_visita DATE,
    ultima_visita DATE,
    total_visitas INTEGER DEFAULT 0,
    estado VARCHAR(20) DEFAULT 'activo' CHECK (estado IN ('activo', 'inactivo')),
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE citas (
    id SERIAL PRIMARY KEY,
    cliente_id INTEGER NOT NULL REFERENCES clientes(id),
    especialista_id INTEGER NOT NULL REFERENCES especialistas(id),
    servicio_id INTEGER NOT NULL REFERENCES servicios(id),
    fecha DATE NOT NULL,
    hora_inicio TIME NOT NULL,
    hora_fin TIME NOT NULL,
    estado VARCHAR(20) DEFAULT 'agendada' CHECK (estado IN ('agendada', 'confirmada', 'en_proceso', 'completada', 'cancelada', 'no_show')),
    notas TEXT,
    creado_por INTEGER REFERENCES usuarios(id),
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_hora_cita CHECK (hora_fin > hora_inicio)
);

CREATE TABLE historial_citas (
    id SERIAL PRIMARY KEY,
    cita_id INTEGER NOT NULL REFERENCES citas(id) ON DELETE CASCADE,
    estado_anterior VARCHAR(20),
    estado_nuevo VARCHAR(20) NOT NULL,
    usuario_id INTEGER REFERENCES usuarios(id),
    motivo TEXT,
    fecha_cambio TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- MÓDULO 4: PUNTO DE VENTA (CAJA)
-- ============================================

CREATE TABLE metodos_pago (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL UNIQUE,
    activo BOOLEAN DEFAULT TRUE,
    requiere_referencia BOOLEAN DEFAULT FALSE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE cajas (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(50) DEFAULT 'Principal',
    usuario_apertura INTEGER NOT NULL REFERENCES usuarios(id),
    fecha_apertura TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    monto_apertura DECIMAL(12, 2) NOT NULL DEFAULT 0,
    usuario_cierre INTEGER REFERENCES usuarios(id),
    fecha_cierre TIMESTAMP,
    monto_cierre DECIMAL(12, 2),
    estado VARCHAR(20) DEFAULT 'abierta' CHECK (estado IN ('abierta', 'cerrada')),
    notas TEXT
);

CREATE TABLE facturas (
    id SERIAL PRIMARY KEY,
    numero_factura VARCHAR(50) NOT NULL UNIQUE,
    cliente_id INTEGER REFERENCES clientes(id),
    fecha TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    subtotal DECIMAL(12, 2) NOT NULL DEFAULT 0,
    descuento DECIMAL(12, 2) DEFAULT 0,
    impuestos DECIMAL(12, 2) DEFAULT 0,
    total DECIMAL(12, 2) NOT NULL DEFAULT 0,
    metodo_pago_id INTEGER REFERENCES metodos_pago(id),
    referencia_pago VARCHAR(100),
    estado VARCHAR(20) DEFAULT 'pagada' CHECK (estado IN ('pendiente', 'pagada', 'anulada')),
    usuario_id INTEGER NOT NULL REFERENCES usuarios(id),
    caja_id INTEGER REFERENCES cajas(id),
    notas TEXT,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE detalle_factura (
    id SERIAL PRIMARY KEY,
    factura_id INTEGER NOT NULL REFERENCES facturas(id) ON DELETE CASCADE,
    tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('servicio', 'producto')),
    item_id INTEGER NOT NULL, -- Referencia a servicios.id o productos.id según tipo
    cantidad DECIMAL(12, 3) NOT NULL DEFAULT 1 CHECK (cantidad > 0),
    precio_unitario DECIMAL(12, 2) NOT NULL,
    descuento_linea DECIMAL(12, 2) DEFAULT 0,
    subtotal DECIMAL(12, 2) NOT NULL,
    especialista_id INTEGER REFERENCES especialistas(id), -- Para comisiones
    cita_id INTEGER REFERENCES citas(id), -- Referencia a cita si aplica
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE movimientos_caja (
    id SERIAL PRIMARY KEY,
    caja_id INTEGER NOT NULL REFERENCES cajas(id),
    tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('ingreso', 'egreso')),
    monto DECIMAL(12, 2) NOT NULL,
    concepto VARCHAR(255) NOT NULL,
    factura_id INTEGER REFERENCES facturas(id),
    usuario_id INTEGER NOT NULL REFERENCES usuarios(id),
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- MÓDULO 5: APP MÓVIL - FACTURAS PENDIENTES
-- ============================================

CREATE TABLE facturas_pendientes (
    id SERIAL PRIMARY KEY,
    especialista_id INTEGER NOT NULL REFERENCES especialistas(id),
    cliente_id INTEGER REFERENCES clientes(id),
    servicio_id INTEGER NOT NULL REFERENCES servicios(id),
    fecha_servicio DATE NOT NULL DEFAULT CURRENT_DATE,
    notas TEXT,
    estado VARCHAR(20) DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'aprobada', 'rechazada')),
    revisado_por INTEGER REFERENCES usuarios(id),
    fecha_revision TIMESTAMP,
    motivo_rechazo TEXT,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE sesiones_movil (
    id SERIAL PRIMARY KEY,
    especialista_id INTEGER NOT NULL REFERENCES especialistas(id) ON DELETE CASCADE,
    device_token VARCHAR(500),
    ultimo_acceso TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- MÓDULO 8: GESTIÓN DE NÓMINA
-- ============================================

CREATE TABLE periodos_nomina (
    id SERIAL PRIMARY KEY,
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE NOT NULL,
    estado VARCHAR(20) DEFAULT 'abierto' CHECK (estado IN ('abierto', 'calculado', 'pagado', 'cerrado')),
    fecha_calculo TIMESTAMP,
    fecha_pago TIMESTAMP,
    usuario_id INTEGER REFERENCES usuarios(id),
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_periodo CHECK (fecha_fin >= fecha_inicio)
);

CREATE TABLE nomina_detalle (
    id SERIAL PRIMARY KEY,
    periodo_id INTEGER NOT NULL REFERENCES periodos_nomina(id) ON DELETE CASCADE,
    especialista_id INTEGER NOT NULL REFERENCES especialistas(id),
    total_servicios INTEGER DEFAULT 0,
    comision_servicios DECIMAL(12, 2) DEFAULT 0,
    total_productos INTEGER DEFAULT 0,
    comision_productos DECIMAL(12, 2) DEFAULT 0,
    bonificaciones DECIMAL(12, 2) DEFAULT 0,
    deducciones DECIMAL(12, 2) DEFAULT 0,
    total_pagar DECIMAL(12, 2) DEFAULT 0,
    estado_pago VARCHAR(20) DEFAULT 'pendiente' CHECK (estado_pago IN ('pendiente', 'pagado')),
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (periodo_id, especialista_id)
);

CREATE TABLE nomina_detalle_lineas (
    id SERIAL PRIMARY KEY,
    nomina_detalle_id INTEGER NOT NULL REFERENCES nomina_detalle(id) ON DELETE CASCADE,
    factura_detalle_id INTEGER NOT NULL REFERENCES detalle_factura(id),
    concepto VARCHAR(255) NOT NULL,
    valor_base DECIMAL(12, 2) NOT NULL,
    tipo_comision VARCHAR(20) NOT NULL,
    porcentaje_comision DECIMAL(5, 2),
    valor_comision DECIMAL(12, 2) NOT NULL,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE bonificaciones_deducciones (
    id SERIAL PRIMARY KEY,
    nomina_detalle_id INTEGER NOT NULL REFERENCES nomina_detalle(id) ON DELETE CASCADE,
    tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('bonificacion', 'deduccion')),
    concepto VARCHAR(255) NOT NULL,
    valor DECIMAL(12, 2) NOT NULL,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- MÓDULO 7: REPORTES
-- ============================================

CREATE TABLE reportes_programados (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    tipo_reporte VARCHAR(50) NOT NULL,
    filtros JSONB,
    frecuencia VARCHAR(20) CHECK (frecuencia IN ('diario', 'semanal', 'mensual')),
    email_destino VARCHAR(255),
    activo BOOLEAN DEFAULT TRUE,
    ultimo_envio TIMESTAMP,
    proximo_envio TIMESTAMP,
    usuario_id INTEGER REFERENCES usuarios(id),
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- MÓDULO 10: CRM - GESTIÓN DE CLIENTES
-- ============================================

CREATE TABLE cliente_preferencias (
    id SERIAL PRIMARY KEY,
    cliente_id INTEGER NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
    productos_favoritos JSONB, -- Array de IDs de productos
    alergias TEXT,
    notas_servicio TEXT,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE cliente_historial_comunicacion (
    id SERIAL PRIMARY KEY,
    cliente_id INTEGER NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
    tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('llamada', 'sms', 'email', 'whatsapp')),
    asunto VARCHAR(255),
    contenido TEXT,
    usuario_id INTEGER REFERENCES usuarios(id),
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE cliente_fotos (
    id SERIAL PRIMARY KEY,
    cliente_id INTEGER NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
    servicio_id INTEGER REFERENCES servicios(id),
    tipo VARCHAR(20) CHECK (tipo IN ('antes', 'despues')),
    ruta_foto TEXT NOT NULL,
    notas TEXT,
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE cliente_etiquetas (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL UNIQUE,
    color VARCHAR(7) DEFAULT '#6c757d',
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE cliente_etiqueta_asignacion (
    cliente_id INTEGER NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
    etiqueta_id INTEGER NOT NULL REFERENCES cliente_etiquetas(id) ON DELETE CASCADE,
    PRIMARY KEY (cliente_id, etiqueta_id)
);

-- ============================================
-- MÓDULO 11: PROMOCIONES Y DESCUENTOS
-- ============================================

CREATE TABLE promociones (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('porcentaje', 'monto', '2x1', 'combo')),
    valor DECIMAL(12, 2),
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE NOT NULL,
    servicios_aplicables JSONB, -- Array de IDs de servicios
    productos_aplicables JSONB, -- Array de IDs de productos
    estado VARCHAR(20) DEFAULT 'activo' CHECK (estado IN ('activo', 'inactivo')),
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_fecha_promo CHECK (fecha_fin >= fecha_inicio)
);

CREATE TABLE cupones (
    id SERIAL PRIMARY KEY,
    codigo VARCHAR(50) NOT NULL UNIQUE,
    promocion_id INTEGER NOT NULL REFERENCES promociones(id) ON DELETE CASCADE,
    usos_maximos INTEGER DEFAULT 1,
    usos_actuales INTEGER DEFAULT 0,
    cliente_especifico INTEGER REFERENCES clientes(id), -- NULL = cualquier cliente
    fecha_expiracion DATE,
    estado VARCHAR(20) DEFAULT 'activo' CHECK (estado IN ('activo', 'inactivo', 'agotado')),
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE cupones_usados (
    id SERIAL PRIMARY KEY,
    cupon_id INTEGER NOT NULL REFERENCES cupones(id),
    factura_id INTEGER NOT NULL REFERENCES facturas(id),
    cliente_id INTEGER REFERENCES clientes(id),
    descuento_aplicado DECIMAL(12, 2) NOT NULL,
    fecha_uso TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- MÓDULO 12: CONFIGURACIÓN GENERAL
-- ============================================

CREATE TABLE empresa (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    nit VARCHAR(50),
    direccion TEXT,
    telefono VARCHAR(20),
    email VARCHAR(100),
    logo TEXT,
    sitio_web VARCHAR(255),
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE configuracion (
    id SERIAL PRIMARY KEY,
    clave VARCHAR(100) NOT NULL UNIQUE,
    valor TEXT,
    tipo VARCHAR(20) DEFAULT 'texto' CHECK (tipo IN ('texto', 'numero', 'booleano', 'json')),
    descripcion TEXT,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- MÓDULO 13: NOTIFICACIONES
-- ============================================

CREATE TABLE plantillas_mensaje (
    id SERIAL PRIMARY KEY,
    tipo VARCHAR(50) NOT NULL UNIQUE, -- recordatorio_cita, confirmacion, cumpleanos, etc.
    asunto VARCHAR(255),
    contenido TEXT NOT NULL,
    variables JSONB, -- Variables disponibles: {nombre}, {fecha}, etc.
    activo BOOLEAN DEFAULT TRUE,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE notificaciones (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER REFERENCES usuarios(id),
    especialista_id INTEGER REFERENCES especialistas(id),
    tipo VARCHAR(50) NOT NULL,
    titulo VARCHAR(255) NOT NULL,
    mensaje TEXT,
    leida BOOLEAN DEFAULT FALSE,
    fecha_lectura TIMESTAMP,
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE cola_notificaciones (
    id SERIAL PRIMARY KEY,
    tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('sms', 'email', 'push')),
    destinatario VARCHAR(255) NOT NULL,
    asunto VARCHAR(255),
    contenido TEXT NOT NULL,
    estado VARCHAR(20) DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'enviado', 'fallido')),
    intentos INTEGER DEFAULT 0,
    error TEXT,
    fecha_programada TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_envio TIMESTAMP,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- ÍNDICES PARA OPTIMIZACIÓN
-- ============================================

-- Especialistas
CREATE INDEX idx_especialistas_documento ON especialistas(documento_identidad);
CREATE INDEX idx_especialistas_estado ON especialistas(estado);
CREATE INDEX idx_especialistas_nombre ON especialistas(nombre, apellido);

-- Horarios y bloqueos
CREATE INDEX idx_horarios_especialista ON horarios_especialista(especialista_id, dia_semana);
CREATE INDEX idx_bloqueos_especialista_fecha ON bloqueos_especialista(especialista_id, fecha_inicio, fecha_fin);

-- Servicios
CREATE INDEX idx_servicios_categoria ON servicios(categoria_id);
CREATE INDEX idx_servicios_estado ON servicios(estado);

-- Productos
CREATE INDEX idx_productos_codigo ON productos(codigo);
CREATE INDEX idx_productos_codigo_barras ON productos(codigo_barras);
CREATE INDEX idx_productos_categoria ON productos(categoria_id);
CREATE INDEX idx_productos_stock_bajo ON productos(stock_actual, stock_minimo) WHERE stock_actual <= stock_minimo;

-- Clientes
CREATE INDEX idx_clientes_telefono ON clientes(telefono);
CREATE INDEX idx_clientes_email ON clientes(email);
CREATE INDEX idx_clientes_nombre ON clientes(nombre, apellido);

-- Citas
CREATE INDEX idx_citas_especialista_fecha ON citas(especialista_id, fecha);
CREATE INDEX idx_citas_cliente_fecha ON citas(cliente_id, fecha);
CREATE INDEX idx_citas_fecha_estado ON citas(fecha, estado);

-- Facturas
CREATE INDEX idx_facturas_numero ON facturas(numero_factura);
CREATE INDEX idx_facturas_cliente ON facturas(cliente_id);
CREATE INDEX idx_facturas_fecha ON facturas(fecha);
CREATE INDEX idx_facturas_caja ON facturas(caja_id);

-- Detalle factura
CREATE INDEX idx_detalle_factura_especialista ON detalle_factura(especialista_id);
CREATE INDEX idx_detalle_factura_tipo ON detalle_factura(tipo, item_id);

-- Movimientos inventario
CREATE INDEX idx_movimientos_producto ON movimientos_inventario(producto_id, fecha);

-- Nómina
CREATE INDEX idx_nomina_periodo ON nomina_detalle(periodo_id);
CREATE INDEX idx_nomina_especialista ON nomina_detalle(especialista_id);

-- Sesiones
CREATE INDEX idx_sesiones_usuario ON sesiones(usuario_id);
CREATE INDEX idx_sesiones_token ON sesiones(token);

-- Auditoría
CREATE INDEX idx_auditoria_usuario ON log_auditoria(usuario_id);
CREATE INDEX idx_auditoria_fecha ON log_auditoria(fecha);
CREATE INDEX idx_auditoria_modulo ON log_auditoria(modulo);

-- Notificaciones
CREATE INDEX idx_notificaciones_usuario ON notificaciones(usuario_id, leida);
CREATE INDEX idx_cola_notificaciones_estado ON cola_notificaciones(estado, fecha_programada);

-- ============================================
-- DATOS INICIALES
-- ============================================

-- Roles del sistema
INSERT INTO roles (nombre, descripcion, es_sistema) VALUES
('Administrador', 'Acceso completo al sistema', TRUE),
('Cajero', 'Acceso a punto de venta y caja', TRUE),
('Recepcionista', 'Acceso a agenda y clientes', TRUE),
('Especialista', 'Acceso limitado para estilistas', TRUE);

-- Métodos de pago
INSERT INTO metodos_pago (nombre, activo, requiere_referencia) VALUES
('Efectivo', TRUE, FALSE),
('Tarjeta Débito', TRUE, TRUE),
('Tarjeta Crédito', TRUE, TRUE),
('Transferencia', TRUE, TRUE),
('Nequi', TRUE, TRUE),
('Daviplata', TRUE, TRUE);

-- Configuraciones iniciales
INSERT INTO configuracion (clave, valor, tipo, descripcion) VALUES
('intervalo_citas', '15', 'numero', 'Intervalo de tiempo entre citas en minutos'),
('impuesto_iva', '19', 'numero', 'Porcentaje de IVA'),
('moneda', 'COP', 'texto', 'Código de moneda'),
('zona_horaria', 'America/Bogota', 'texto', 'Zona horaria del sistema'),
('prefijo_factura', 'FAC', 'texto', 'Prefijo para numeración de facturas'),
('siguiente_numero_factura', '1', 'numero', 'Siguiente número de factura'),
('recordatorio_cita_horas', '24', 'numero', 'Horas antes para enviar recordatorio de cita'),
('stock_alerta_dias', '7', 'numero', 'Días para alerta de stock bajo');

-- Plantillas de mensaje
INSERT INTO plantillas_mensaje (tipo, asunto, contenido, variables) VALUES
('recordatorio_cita', 'Recordatorio de tu cita', 
 'Hola {nombre}, te recordamos tu cita para {servicio} el {fecha} a las {hora} con {especialista}. ¡Te esperamos!',
 '{"nombre": "Nombre del cliente", "servicio": "Servicio agendado", "fecha": "Fecha de la cita", "hora": "Hora de la cita", "especialista": "Nombre del especialista"}'),
('confirmacion_cita', 'Cita confirmada',
 'Hola {nombre}, tu cita ha sido confirmada para el {fecha} a las {hora}. ¡Gracias por preferirnos!',
 '{"nombre": "Nombre del cliente", "fecha": "Fecha de la cita", "hora": "Hora de la cita"}'),
('cumpleanos', '¡Feliz cumpleaños!',
 '¡Feliz cumpleaños {nombre}! En este día especial queremos regalarte un 10% de descuento en tu próximo servicio. Usa el código: CUMPLE{anio}',
 '{"nombre": "Nombre del cliente", "anio": "Año actual"}');

-- Permisos del sistema
INSERT INTO permisos (codigo, nombre, modulo) VALUES
-- Especialistas
('especialistas.ver', 'Ver especialistas', 'Especialistas'),
('especialistas.crear', 'Crear especialistas', 'Especialistas'),
('especialistas.editar', 'Editar especialistas', 'Especialistas'),
('especialistas.eliminar', 'Eliminar especialistas', 'Especialistas'),
-- Servicios
('servicios.ver', 'Ver servicios', 'Servicios'),
('servicios.crear', 'Crear servicios', 'Servicios'),
('servicios.editar', 'Editar servicios', 'Servicios'),
('servicios.eliminar', 'Eliminar servicios', 'Servicios'),
-- Agenda
('agenda.ver', 'Ver agenda', 'Agenda'),
('agenda.crear', 'Crear citas', 'Agenda'),
('agenda.editar', 'Editar citas', 'Agenda'),
('agenda.cancelar', 'Cancelar citas', 'Agenda'),
-- Clientes
('clientes.ver', 'Ver clientes', 'Clientes'),
('clientes.crear', 'Crear clientes', 'Clientes'),
('clientes.editar', 'Editar clientes', 'Clientes'),
('clientes.eliminar', 'Eliminar clientes', 'Clientes'),
-- Caja
('caja.ver', 'Ver caja', 'Caja'),
('caja.facturar', 'Facturar', 'Caja'),
('caja.anular', 'Anular facturas', 'Caja'),
('caja.apertura', 'Apertura de caja', 'Caja'),
('caja.cierre', 'Cierre de caja', 'Caja'),
('caja.aprobar_pendientes', 'Aprobar facturas pendientes', 'Caja'),
-- Inventario
('inventario.ver', 'Ver inventario', 'Inventario'),
('inventario.crear', 'Crear productos', 'Inventario'),
('inventario.editar', 'Editar productos', 'Inventario'),
('inventario.ajustar', 'Ajustar inventario', 'Inventario'),
('inventario.exportar', 'Exportar inventario', 'Inventario'),
-- Reportes
('reportes.ver', 'Ver reportes', 'Reportes'),
('reportes.exportar', 'Exportar reportes', 'Reportes'),
-- Nómina
('nomina.ver', 'Ver nómina', 'Nómina'),
('nomina.calcular', 'Calcular nómina', 'Nómina'),
('nomina.pagar', 'Pagar nómina', 'Nómina'),
-- Configuración
('config.ver', 'Ver configuración', 'Configuración'),
('config.editar', 'Editar configuración', 'Configuración'),
-- Usuarios
('usuarios.ver', 'Ver usuarios', 'Usuarios'),
('usuarios.crear', 'Crear usuarios', 'Usuarios'),
('usuarios.editar', 'Editar usuarios', 'Usuarios'),
('usuarios.eliminar', 'Eliminar usuarios', 'Usuarios');

-- Asignar todos los permisos al rol Administrador
INSERT INTO rol_permisos (rol_id, permiso_id)
SELECT 1, id FROM permisos;

-- ============================================
-- VISTAS PARA REPORTES
-- ============================================

-- Vista de ventas diarias
CREATE OR REPLACE VIEW v_ventas_diarias AS
SELECT 
    DATE(f.fecha) as fecha,
    COUNT(DISTINCT f.id) as total_facturas,
    SUM(f.total) as total_ventas,
    SUM(CASE WHEN df.tipo = 'servicio' THEN df.subtotal ELSE 0 END) as ventas_servicios,
    SUM(CASE WHEN df.tipo = 'producto' THEN df.subtotal ELSE 0 END) as ventas_productos
FROM facturas f
LEFT JOIN detalle_factura df ON f.id = df.factura_id
WHERE f.estado = 'pagada'
GROUP BY DATE(f.fecha);

-- Vista de comisiones por especialista
CREATE OR REPLACE VIEW v_comisiones_especialista AS
SELECT 
    e.id as especialista_id,
    e.nombre || ' ' || e.apellido as especialista,
    DATE(f.fecha) as fecha,
    COUNT(df.id) as total_items,
    SUM(df.subtotal) as total_facturado,
    SUM(CASE 
        WHEN df.tipo = 'servicio' THEN 
            CASE 
                WHEN es.tipo_comision = 'porcentaje' THEN df.subtotal * es.valor_comision / 100
                ELSE es.valor_comision
            END
        ELSE df.subtotal * p.comision_venta / 100
    END) as total_comision
FROM detalle_factura df
JOIN facturas f ON df.factura_id = f.id
JOIN especialistas e ON df.especialista_id = e.id
LEFT JOIN especialista_servicios es ON df.especialista_id = es.especialista_id 
    AND df.item_id = es.servicio_id AND df.tipo = 'servicio'
LEFT JOIN productos p ON df.item_id = p.id AND df.tipo = 'producto'
WHERE f.estado = 'pagada'
GROUP BY e.id, e.nombre, e.apellido, DATE(f.fecha);

-- Vista de stock bajo
CREATE OR REPLACE VIEW v_stock_bajo AS
SELECT 
    p.id,
    p.codigo,
    p.nombre,
    cp.nombre as categoria,
    p.stock_actual,
    p.stock_minimo,
    p.stock_minimo - p.stock_actual as cantidad_faltante
FROM productos p
LEFT JOIN categorias_producto cp ON p.categoria_id = cp.id
WHERE p.stock_actual <= p.stock_minimo
AND p.estado = 'activo';

-- ============================================
-- FUNCIONES Y TRIGGERS
-- ============================================

-- Función para actualizar fecha_actualizacion
CREATE OR REPLACE FUNCTION update_fecha_actualizacion()
RETURNS TRIGGER AS $$
BEGIN
    NEW.fecha_actualizacion = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para actualizar fecha_actualizacion
CREATE TRIGGER tr_especialistas_update BEFORE UPDATE ON especialistas
FOR EACH ROW EXECUTE FUNCTION update_fecha_actualizacion();

CREATE TRIGGER tr_servicios_update BEFORE UPDATE ON servicios
FOR EACH ROW EXECUTE FUNCTION update_fecha_actualizacion();

CREATE TRIGGER tr_productos_update BEFORE UPDATE ON productos
FOR EACH ROW EXECUTE FUNCTION update_fecha_actualizacion();

CREATE TRIGGER tr_clientes_update BEFORE UPDATE ON clientes
FOR EACH ROW EXECUTE FUNCTION update_fecha_actualizacion();

CREATE TRIGGER tr_usuarios_update BEFORE UPDATE ON usuarios
FOR EACH ROW EXECUTE FUNCTION update_fecha_actualizacion();

-- Función para actualizar stock al facturar
CREATE OR REPLACE FUNCTION actualizar_stock_factura()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_actualizar_stock
AFTER INSERT ON detalle_factura
FOR EACH ROW EXECUTE FUNCTION actualizar_stock_factura();

-- Función para actualizar conteo de visitas del cliente
CREATE OR REPLACE FUNCTION actualizar_visitas_cliente()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_actualizar_visitas
AFTER UPDATE ON citas
FOR EACH ROW EXECUTE FUNCTION actualizar_visitas_cliente();

-- ============================================
-- FIN DEL SCRIPT
-- ============================================