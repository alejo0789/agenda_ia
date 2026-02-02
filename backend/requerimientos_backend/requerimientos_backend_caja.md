# Requerimientos Backend - Módulo de Caja (POS)
## Club de Alisados - FastAPI

---

## ÍNDICE

1. [Resumen Ejecutivo](#resumen-ejecutivo)
2. [Modificaciones al Esquema de Base de Datos](#modificaciones-al-esquema-de-base-de-datos)
3. [Arquitectura del Módulo](#arquitectura-del-módulo)
4. [Modelos de Datos](#modelos-de-datos)
5. [Schemas de Validación](#schemas-de-validación)
6. [Endpoints de API](#endpoints-de-api)
7. [Servicios de Negocio](#servicios-de-negocio)
8. [Reglas de Negocio](#reglas-de-negocio)
9. [Validaciones](#validaciones)
10. [Flujos de Proceso](#flujos-de-proceso)
11. [Cálculos y Algoritmos](#cálculos-y-algoritmos)
12. [Consideraciones de Seguridad](#consideraciones-de-seguridad)
13. [Testing](#testing)
14. [Dependencias con Otros Módulos](#dependencias-con-otros-módulos)

---

## RESUMEN EJECUTIVO

### Propósito
El Módulo de Caja (POS - Point of Sale) es el **módulo más crítico** del sistema Club de Alisados. Gestiona todo el proceso de facturación, cobro, control de caja, movimientos de efectivo, y genera los datos necesarios para el cálculo de comisiones de especialistas.

### Alcance del Módulo

**Funcionalidades Incluidas:**
- Gestión de apertura y cierre de cajas
- Registro de movimientos de efectivo (ingresos/egresos)
- Facturación con dos flujos: directo y desde servicios pendientes
- Soporte para pagos mixtos (múltiples métodos de pago por factura)
- Descuento automático de inventario
- Cálculo automático de comisiones
- Anulación de facturas con reversión de operaciones
- Generación de tickets de venta (PDF y datos para impresora térmica)
- Reportes de ventas diarias y por período

**Funcionalidades Excluidas (otros módulos):**
- Gestión de clientes (Módulo de Clientes)
- Gestión de productos e inventario (Módulo de Inventario)
- Configuración de servicios y precios (Módulo de Servicios)
- Pago de comisiones a especialistas (Módulo de Nómina)
- Análisis avanzado de ventas (Módulo de Reportes)

### Características Principales

#### 1. Gestión de Caja
- Apertura de caja con monto inicial registrado
- Una sola caja abierta a la vez (control de concurrencia)
- Registro de todos los movimientos de efectivo
- Cierre de caja con cálculo automático de cuadre
- Detección de diferencias (sobrantes/faltantes)
- Historial completo de todas las cajas

#### 2. Facturación Dual

**Flujo Directo:**
1. Seleccionar cliente (opcional)
2. Agregar servicios/productos manualmente
3. Asignar especialista a cada ítem
4. Aplicar descuentos (por línea o general)
5. Registrar pagos (uno o múltiples métodos)
6. Generar factura inmediatamente

**Flujo con Pendientes:**
1. Visualizar servicios pendientes agrupados por cliente
2. Seleccionar servicios a facturar (pueden ser de múltiples especialistas)
3. Agregar ítems adicionales si es necesario
4. Aplicar descuentos
5. Registrar pagos
6. Generar factura y marcar pendientes como aprobados

#### 3. Pagos Mixtos
- Permitir dividir el pago total en múltiples métodos
- Ejemplo: $80,000 en efectivo + $50,000 en tarjeta = $130,000 total
- Validación: suma de pagos debe ser igual al total de la factura
- Métodos que requieren referencia (tarjetas, transferencias) deben tenerla
- Solo pagos en efectivo generan movimientos de caja
- Historial completo de pagos aplicados a cada factura

#### 4. Gestión de Inventario Integrada
- Validación de stock disponible antes de facturar productos
- Descuento automático mediante trigger de base de datos
- Registro de movimiento de inventario por cada venta
- Reversión automática de stock al anular factura
- Alertas de stock bajo integradas

#### 5. Cálculo de Comisiones
- Cada ítem facturado debe tener un especialista asignado
- Servicios: comisión según configuración en `especialista_servicios` (% o fijo)
- Productos: comisión según porcentaje en tabla `productos`
- Cálculo automático al momento de facturar
- Datos almacenados para consulta del módulo de nómina
- Reversión de comisiones al anular factura

### Prioridad
**CRÍTICA** - Este módulo es central para la operación del negocio y tiene dependencias bidireccionales con:

**Depende de:**
- Módulo de Clientes (consulta de clientes)
- Módulo de Servicios (precios y configuración)
- Módulo de Productos (inventario y precios)
- Módulo de Especialistas (asignación y comisiones)
- Módulo de Agenda (vinculación con citas)

**Es requerido por:**
- Módulo de Nómina (cálculo de comisiones)
- Módulo de Reportes (análisis de ventas)
- Módulo de Inventario (movimientos de stock)

### Estadísticas del Módulo

| Componente | Cantidad |
|-----------|----------|
| Modelos SQLAlchemy | 8 |
| Schemas Pydantic | 28 |
| Endpoints API | 28 |
| Servicios | 9 |
| Reglas de Negocio | 25 |
| Tests Unitarios | ~80 |
| Tests Integración | ~35 |

**Tablas de Base de Datos**:
- `cajas` - Control de apertura/cierre de cajas
- `metodos_pago` - Catálogo de métodos de pago
- `facturas` - Encabezado de facturas
- `detalle_factura` - Ítems facturados (servicios/productos)
- `pagos_factura` - **NUEVA**: Pagos aplicados a facturas (soporte múltiple)
- `movimientos_caja` - Ingresos/egresos de efectivo
- `facturas_pendientes` - Servicios registrados por especialistas
- `configuracion` - Parámetros del sistema (IVA, numeración, etc.)

### Stack Tecnológico

| Componente | Tecnología |
|-----------|------------|
| Framework | FastAPI 0.104+ |
| ORM | SQLAlchemy 2.0 |
| Validación | Pydantic v2 |
| Base de Datos | PostgreSQL 15+ |
| PDF | ReportLab 4.0+ |
| Jobs | Celery + Redis |

---

## MODIFICACIONES AL ESQUEMA DE BASE DE DATOS

### Razón del Cambio
El esquema actual de `facturas` solo permite un método de pago por factura. Para soportar **pagos mixtos** (ej: $50,000 efectivo + $30,000 tarjeta), necesitamos una tabla adicional que permita múltiples registros de pago por factura.

### Script de Migración (Alembic)

**Archivo**: `alembic/versions/XXXXXX_add_pagos_factura.py`

```sql
-- ============================================
-- MIGRACIÓN: Soporte para Pagos Mixtos
-- ============================================

-- 1. Crear tabla pagos_factura
CREATE TABLE pagos_factura (
    id SERIAL PRIMARY KEY,
    factura_id INTEGER NOT NULL REFERENCES facturas(id) ON DELETE CASCADE,
    metodo_pago_id INTEGER NOT NULL REFERENCES metodos_pago(id),
    monto DECIMAL(12, 2) NOT NULL CHECK (monto > 0),
    referencia_pago VARCHAR(100),
    fecha_pago TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    usuario_id INTEGER REFERENCES usuarios(id),
    CONSTRAINT chk_monto_positivo CHECK (monto > 0)
);

-- Índices para performance
CREATE INDEX idx_pagos_factura_factura ON pagos_factura(factura_id);
CREATE INDEX idx_pagos_factura_metodo ON pagos_factura(metodo_pago_id);
CREATE INDEX idx_pagos_factura_fecha ON pagos_factura(fecha_pago);

-- 2. Migrar datos existentes de facturas a pagos_factura
INSERT INTO pagos_factura (factura_id, metodo_pago_id, monto, referencia_pago, fecha_pago, usuario_id)
SELECT 
    id,
    metodo_pago_id,
    total,
    referencia_pago,
    fecha,
    usuario_id
FROM facturas
WHERE metodo_pago_id IS NOT NULL AND estado = 'pagada';

-- 3. Modificar tabla facturas (hacer columnas opcionales para retrocompatibilidad)
-- No eliminamos las columnas existentes para mantener compatibilidad con código legacy
-- Las nuevas facturas usarán pagos_factura, las antiguas mantienen datos en facturas
ALTER TABLE facturas ALTER COLUMN metodo_pago_id DROP NOT NULL;
ALTER TABLE facturas ALTER COLUMN metodo_pago_id SET DEFAULT NULL;

-- 4. Agregar constraint para validar que la suma de pagos = total factura
-- Esto se validará en el código de aplicación por performance
-- pero agregamos un trigger para integridad

CREATE OR REPLACE FUNCTION validar_pagos_factura()
RETURNS TRIGGER AS $$
DECLARE
    suma_pagos DECIMAL(12, 2);
    total_factura DECIMAL(12, 2);
BEGIN
    -- Obtener suma de pagos y total de factura
    SELECT COALESCE(SUM(monto), 0) INTO suma_pagos
    FROM pagos_factura
    WHERE factura_id = NEW.factura_id;
    
    SELECT total INTO total_factura
    FROM facturas
    WHERE id = NEW.factura_id;
    
    -- Validar que no exceda el total
    IF suma_pagos > total_factura THEN
        RAISE EXCEPTION 'La suma de pagos (%) excede el total de la factura (%)', suma_pagos, total_factura;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_validar_pagos
AFTER INSERT OR UPDATE ON pagos_factura
FOR EACH ROW EXECUTE FUNCTION validar_pagos_factura();

-- 5. Crear vista para facilitar consultas de facturas con pagos
CREATE OR REPLACE VIEW v_facturas_con_pagos AS
SELECT 
    f.id,
    f.numero_factura,
    f.cliente_id,
    f.fecha,
    f.subtotal,
    f.descuento,
    f.impuestos,
    f.total,
    f.estado,
    f.caja_id,
    f.usuario_id,
    f.notas,
    -- Agregamos información de pagos
    COALESCE(
        (SELECT json_agg(
            json_build_object(
                'id', pf.id,
                'metodo_pago_id', pf.metodo_pago_id,
                'metodo_pago', mp.nombre,
                'monto', pf.monto,
                'referencia', pf.referencia_pago,
                'fecha_pago', pf.fecha_pago
            )
            ORDER BY pf.fecha_pago
        )
        FROM pagos_factura pf
        LEFT JOIN metodos_pago mp ON pf.metodo_pago_id = mp.id
        WHERE pf.factura_id = f.id
        ), '[]'::json
    ) as pagos,
    COALESCE(
        (SELECT SUM(monto) FROM pagos_factura WHERE factura_id = f.id), 
        0
    ) as total_pagado,
    f.total - COALESCE(
        (SELECT SUM(monto) FROM pagos_factura WHERE factura_id = f.id), 
        0
    ) as saldo_pendiente
FROM facturas f;

COMMENT ON VIEW v_facturas_con_pagos IS 'Vista que incluye información consolidada de pagos por factura';
```

### Notas Importantes sobre la Migración

1. **Retrocompatibilidad**: 
   - Mantenemos las columnas `metodo_pago_id` y `referencia_pago` en `facturas`
   - Las facturas antiguas seguirán funcionando
   - Las nuevas facturas usarán `pagos_factura`

2. **Validación de Datos**:
   - El trigger `tr_validar_pagos` previene que la suma de pagos exceda el total
   - La validación completa se hace en la capa de aplicación

3. **Performance**:
   - Vista `v_facturas_con_pagos` para consultas frecuentes
   - Índices en columnas más consultadas

4. **Integridad**:
   - `ON DELETE CASCADE` en `pagos_factura` para eliminar pagos al eliminar factura
   - Constraints de tipo CHECK para validar montos positivos

---

## MODELOS DE DATOS

### 1. Caja (SQLAlchemy Model)

**Archivo**: `app/models/caja.py`

```python
from sqlalchemy import Column, Integer, String, DECIMAL, TIMESTAMP, ForeignKey, Text, func, CheckConstraint
from sqlalchemy.orm import relationship
from app.database import Base

class Caja(Base):
    __tablename__ = "cajas"
    
    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(50), default='Principal')
    
    # Apertura
    usuario_apertura_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False)
    fecha_apertura = Column(TIMESTAMP, nullable=False, server_default=func.current_timestamp())
    monto_apertura = Column(DECIMAL(12, 2), nullable=False, default=0)
    
    # Cierre
    usuario_cierre_id = Column(Integer, ForeignKey("usuarios.id"))
    fecha_cierre = Column(TIMESTAMP)
    monto_cierre = Column(DECIMAL(12, 2))
    
    # Estado
    estado = Column(String(20), nullable=False, default='abierta')
    
    # Notas
    notas = Column(Text)
    
    # Constraints
    __table_args__ = (
        CheckConstraint("estado IN ('abierta', 'cerrada')", name='chk_caja_estado'),
    )
    
    # Relaciones
    usuario_apertura = relationship("Usuario", foreign_keys=[usuario_apertura_id])
    usuario_cierre = relationship("Usuario", foreign_keys=[usuario_cierre_id])
    facturas = relationship("Factura", back_populates="caja")
    movimientos = relationship("MovimientoCaja", back_populates="caja", cascade="all, delete-orphan")
    
    @property
    def total_efectivo_teorico(self) -> float:
        """Calcula el efectivo teórico en caja"""
        # Monto apertura + ingresos - egresos
        ingresos = sum(m.monto for m in self.movimientos if m.tipo == 'ingreso')
        egresos = sum(m.monto for m in self.movimientos if m.tipo == 'egreso')
        return float(self.monto_apertura) + ingresos - egresos
    
    @property
    def diferencia(self) -> float:
        """Calcula la diferencia entre efectivo real y teórico al cierre"""
        if self.estado == 'cerrada' and self.monto_cierre is not None:
            return float(self.monto_cierre) - self.total_efectivo_teorico
        return 0.0
    
    def __repr__(self):
        return f"<Caja(id={self.id}, nombre='{self.nombre}', estado='{self.estado}')>"
```

### 2. MetodoPago (SQLAlchemy Model)

**Archivo**: `app/models/metodo_pago.py`

```python
from sqlalchemy import Column, Integer, String, Boolean, TIMESTAMP, func
from sqlalchemy.orm import relationship
from app.database import Base

class MetodoPago(Base):
    __tablename__ = "metodos_pago"
    
    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(50), nullable=False, unique=True)
    activo = Column(Boolean, default=True)
    requiere_referencia = Column(Boolean, default=False)
    fecha_creacion = Column(TIMESTAMP, server_default=func.current_timestamp())
    
    # Relaciones
    pagos = relationship("PagoFactura", back_populates="metodo_pago")
    
    def __repr__(self):
        return f"<MetodoPago(id={self.id}, nombre='{self.nombre}', activo={self.activo})>"
```

### 3. Factura (SQLAlchemy Model)

**Archivo**: `app/models/factura.py`

```python
from sqlalchemy import Column, Integer, String, DECIMAL, TIMESTAMP, ForeignKey, Text, func, CheckConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import ARRAY
from app.database import Base
from decimal import Decimal

class Factura(Base):
    __tablename__ = "facturas"
    
    id = Column(Integer, primary_key=True, index=True)
    numero_factura = Column(String(50), nullable=False, unique=True, index=True)
    
    # Cliente (opcional para ventas rápidas)
    cliente_id = Column(Integer, ForeignKey("clientes.id"))
    
    # Fecha
    fecha = Column(TIMESTAMP, nullable=False, server_default=func.current_timestamp())
    
    # Montos
    subtotal = Column(DECIMAL(12, 2), nullable=False, default=0)
    descuento = Column(DECIMAL(12, 2), default=0)
    impuestos = Column(DECIMAL(12, 2), default=0)
    total = Column(DECIMAL(12, 2), nullable=False, default=0)
    
    # LEGACY: Mantener para facturas antiguas
    metodo_pago_id = Column(Integer, ForeignKey("metodos_pago.id"))
    referencia_pago = Column(String(100))
    
    # Estado
    estado = Column(String(20), nullable=False, default='pagada')
    
    # Auditoría
    usuario_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False)
    caja_id = Column(Integer, ForeignKey("cajas.id"))
    
    # Notas
    notas = Column(Text)
    
    # Timestamp
    fecha_creacion = Column(TIMESTAMP, server_default=func.current_timestamp())
    
    # Constraints
    __table_args__ = (
        CheckConstraint("estado IN ('pendiente', 'pagada', 'anulada')", name='chk_factura_estado'),
        CheckConstraint("subtotal >= 0", name='chk_factura_subtotal'),
        CheckConstraint("descuento >= 0", name='chk_factura_descuento'),
        CheckConstraint("total >= 0", name='chk_factura_total'),
    )
    
    # Relaciones
    cliente = relationship("Cliente", back_populates="facturas")
    usuario = relationship("Usuario")
    caja = relationship("Caja", back_populates="facturas")
    detalle = relationship("DetalleFactura", back_populates="factura", cascade="all, delete-orphan")
    pagos = relationship("PagoFactura", back_populates="factura", cascade="all, delete-orphan")
    movimientos_caja = relationship("MovimientoCaja", back_populates="factura")
    metodo_pago = relationship("MetodoPago")  # LEGACY
    
    @property
    def total_pagado(self) -> Decimal:
        """Suma de todos los pagos aplicados"""
        return sum(pago.monto for pago in self.pagos)
    
    @property
    def saldo_pendiente(self) -> Decimal:
        """Saldo pendiente de pago"""
        return self.total - self.total_pagado
    
    @property
    def esta_totalmente_pagada(self) -> bool:
        """Verifica si la factura está completamente pagada"""
        return self.saldo_pendiente == 0
    
    @property
    def total_servicios(self) -> Decimal:
        """Total de servicios facturados"""
        return sum(d.subtotal for d in self.detalle if d.tipo == 'servicio')
    
    @property
    def total_productos(self) -> Decimal:
        """Total de productos facturados"""
        return sum(d.subtotal for d in self.detalle if d.tipo == 'producto')
    
    def __repr__(self):
        return f"<Factura(id={self.id}, numero='{self.numero_factura}', total={self.total}, estado='{self.estado}')>"
```

### 4. DetalleFactura (SQLAlchemy Model)

**Archivo**: `app/models/detalle_factura.py`

```python
from sqlalchemy import Column, Integer, String, DECIMAL, ForeignKey, TIMESTAMP, func, CheckConstraint
from sqlalchemy.orm import relationship
from app.database import Base

class DetalleFactura(Base):
    __tablename__ = "detalle_factura"
    
    id = Column(Integer, primary_key=True, index=True)
    factura_id = Column(Integer, ForeignKey("facturas.id", ondelete="CASCADE"), nullable=False)
    
    # Tipo de ítem
    tipo = Column(String(20), nullable=False)  # 'servicio' o 'producto'
    item_id = Column(Integer, nullable=False)  # ID del servicio o producto
    
    # Cantidades y precios
    cantidad = Column(DECIMAL(12, 3), nullable=False, default=1)
    precio_unitario = Column(DECIMAL(12, 2), nullable=False)
    descuento_linea = Column(DECIMAL(12, 2), default=0)
    subtotal = Column(DECIMAL(12, 2), nullable=False)
    
    # Asignación de especialista (para comisiones)
    especialista_id = Column(Integer, ForeignKey("especialistas.id"))
    
    # Vinculación con cita (si aplica)
    cita_id = Column(Integer, ForeignKey("citas.id"))
    
    # Timestamp
    fecha_creacion = Column(TIMESTAMP, server_default=func.current_timestamp())
    
    # Constraints
    __table_args__ = (
        CheckConstraint("tipo IN ('servicio', 'producto')", name='chk_detalle_tipo'),
        CheckConstraint("cantidad > 0", name='chk_detalle_cantidad'),
        CheckConstraint("precio_unitario >= 0", name='chk_detalle_precio'),
        CheckConstraint("descuento_linea >= 0", name='chk_detalle_descuento'),
    )
    
    # Relaciones
    factura = relationship("Factura", back_populates="detalle")
    especialista = relationship("Especialista")
    cita = relationship("Cita")
    
    # Propiedades para obtener el item relacionado
    @property
    def item(self):
        """Devuelve el servicio o producto según el tipo"""
        if self.tipo == 'servicio':
            from app.models.servicio import Servicio
            return Servicio.query.get(self.item_id)
        elif self.tipo == 'producto':
            from app.models.producto import Producto
            return Producto.query.get(self.item_id)
        return None
    
    @property
    def comision_calculada(self) -> float:
        """Calcula la comisión del especialista para este ítem"""
        if not self.especialista:
            return 0.0
        
        if self.tipo == 'servicio':
            # Buscar configuración de comisión en especialista_servicios
            from app.models.especialista_servicio import EspecialistaServicio
            config = EspecialistaServicio.query.filter_by(
                especialista_id=self.especialista_id,
                servicio_id=self.item_id
            ).first()
            
            if config:
                if config.tipo_comision == 'porcentaje':
                    return float(self.subtotal * config.valor_comision / 100)
                else:  # fijo
                    return float(config.valor_comision)
        
        elif self.tipo == 'producto':
            # Comisión de producto según productos.comision_venta
            from app.models.producto import Producto
            producto = Producto.query.get(self.item_id)
            if producto and producto.comision_venta:
                return float(self.subtotal * producto.comision_venta / 100)
        
        return 0.0
    
    def __repr__(self):
        return f"<DetalleFactura(id={self.id}, tipo='{self.tipo}', item_id={self.item_id}, subtotal={self.subtotal})>"
```

### 5. PagoFactura (SQLAlchemy Model) - NUEVO

**Archivo**: `app/models/pago_factura.py`

```python
from sqlalchemy import Column, Integer, DECIMAL, ForeignKey, String, TIMESTAMP, func, CheckConstraint
from sqlalchemy.orm import relationship
from app.database import Base

class PagoFactura(Base):
    __tablename__ = "pagos_factura"
    
    id = Column(Integer, primary_key=True, index=True)
    factura_id = Column(Integer, ForeignKey("facturas.id", ondelete="CASCADE"), nullable=False, index=True)
    metodo_pago_id = Column(Integer, ForeignKey("metodos_pago.id"), nullable=False)
    
    # Monto y referencia
    monto = Column(DECIMAL(12, 2), nullable=False)
    referencia_pago = Column(String(100))
    
    # Auditoría
    fecha_pago = Column(TIMESTAMP, server_default=func.current_timestamp())
    usuario_id = Column(Integer, ForeignKey("usuarios.id"))
    
    # Constraint
    __table_args__ = (
        CheckConstraint("monto > 0", name='chk_pago_monto_positivo'),
    )
    
    # Relaciones
    factura = relationship("Factura", back_populates="pagos")
    metodo_pago = relationship("MetodoPago", back_populates="pagos")
    usuario = relationship("Usuario")
    
    def __repr__(self):
        return f"<PagoFactura(id={self.id}, factura_id={self.factura_id}, metodo='{self.metodo_pago.nombre}', monto={self.monto})>"
```

### 6. MovimientoCaja (SQLAlchemy Model)

**Archivo**: `app/models/movimiento_caja.py`

```python
from sqlalchemy import Column, Integer, String, DECIMAL, TIMESTAMP, ForeignKey, func, CheckConstraint
from sqlalchemy.orm import relationship
from app.database import Base

class MovimientoCaja(Base):
    __tablename__ = "movimientos_caja"
    
    id = Column(Integer, primary_key=True, index=True)
    caja_id = Column(Integer, ForeignKey("cajas.id"), nullable=False)
    
    # Tipo de movimiento
    tipo = Column(String(20), nullable=False)  # 'ingreso' o 'egreso'
    monto = Column(DECIMAL(12, 2), nullable=False)
    concepto = Column(String(255), nullable=False)
    
    # Referencia a factura (si aplica)
    factura_id = Column(Integer, ForeignKey("facturas.id"))
    
    # Auditoría
    usuario_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False)
    fecha = Column(TIMESTAMP, server_default=func.current_timestamp())
    
    # Constraints
    __table_args__ = (
        CheckConstraint("tipo IN ('ingreso', 'egreso')", name='chk_movimiento_tipo'),
    )
    
    # Relaciones
    caja = relationship("Caja", back_populates="movimientos")
    factura = relationship("Factura", back_populates="movimientos_caja")
    usuario = relationship("Usuario")
    
    def __repr__(self):
        return f"<MovimientoCaja(id={self.id}, tipo='{self.tipo}', monto={self.monto}, concepto='{self.concepto}')>"
```

### 7. FacturaPendiente (SQLAlchemy Model)

**Archivo**: `app/models/factura_pendiente.py`

```python
from sqlalchemy import Column, Integer, String, DATE, Text, TIMESTAMP, ForeignKey, func, CheckConstraint
from sqlalchemy.orm import relationship
from app.database import Base

class FacturaPendiente(Base):
    __tablename__ = "facturas_pendientes"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # Especialista que registró el servicio
    especialista_id = Column(Integer, ForeignKey("especialistas.id"), nullable=False)
    
    # Cliente (opcional)
    cliente_id = Column(Integer, ForeignKey("clientes.id"))
    
    # Servicio realizado
    servicio_id = Column(Integer, ForeignKey("servicios.id"), nullable=False)
    fecha_servicio = Column(DATE, nullable=False, server_default=func.current_date())
    
    # Notas
    notas = Column(Text)
    
    # Estado
    estado = Column(String(20), nullable=False, default='pendiente')
    
    # Revisión
    revisado_por = Column(Integer, ForeignKey("usuarios.id"))
    fecha_revision = Column(TIMESTAMP)
    motivo_rechazo = Column(Text)
    
    # Timestamp
    fecha_creacion = Column(TIMESTAMP, server_default=func.current_timestamp())
    
    # Constraints
    __table_args__ = (
        CheckConstraint("estado IN ('pendiente', 'aprobada', 'rechazada')", name='chk_factura_pendiente_estado'),
    )
    
    # Relaciones
    especialista = relationship("Especialista")
    cliente = relationship("Cliente", back_populates="facturas_pendientes")
    servicio = relationship("Servicio")
    revisor = relationship("Usuario", foreign_keys=[revisado_por])
    
    def __repr__(self):
        return f"<FacturaPendiente(id={self.id}, especialista_id={self.especialista_id}, servicio_id={self.servicio_id}, estado='{self.estado}')>"
```

### 8. Configuracion (SQLAlchemy Model)

**Archivo**: `app/models/configuracion.py`

```python
from sqlalchemy import Column, Integer, String, Text, TIMESTAMP, func
from app.database import Base

class Configuracion(Base):
    __tablename__ = "configuracion"
    
    id = Column(Integer, primary_key=True, index=True)
    clave = Column(String(50), nullable=False, unique=True, index=True)
    valor = Column(Text, nullable=False)
    tipo = Column(String(20), nullable=False)  # 'texto', 'numero', 'booleano', 'json'
    descripcion = Column(Text)
    fecha_actualizacion = Column(TIMESTAMP, server_default=func.current_timestamp(), onupdate=func.current_timestamp())
    
    def __repr__(self):
        return f"<Configuracion(clave='{self.clave}', valor='{self.valor}')>"
    
    @property
    def valor_parseado(self):
        """Devuelve el valor en el tipo correcto"""
        if self.tipo == 'numero':
            return float(self.valor)
        elif self.tipo == 'booleano':
            return self.valor.lower() in ('true', '1', 'yes', 'si')
        elif self.tipo == 'json':
            import json
            return json.loads(self.valor)
        return self.valor
```

---

## SCHEMAS DE VALIDACIÓN

### Schemas de Caja

**Archivo**: `app/schemas/caja.py`

```python
from pydantic import BaseModel, Field, validator
from decimal import Decimal
from datetime import datetime
from typing import Optional

# ============================================
# SCHEMAS DE ENTRADA
# ============================================

class CajaAperturaCreate(BaseModel):
    """Schema para apertura de caja"""
    nombre: str = Field(default='Principal', max_length=50)
    monto_apertura: Decimal = Field(ge=0, description="Monto inicial en efectivo")
    notas: Optional[str] = None
    
    @validator('monto_apertura')
    def validar_monto(cls, v):
        if v < 0:
            raise ValueError('El monto de apertura no puede ser negativo')
        return round(v, 2)
    
    class Config:
        json_schema_extra = {
            "example": {
                "nombre": "Caja Principal",
                "monto_apertura": 50000.00,
                "notas": "Apertura turno mañana"
            }
        }


class CajaCierreCreate(BaseModel):
    """Schema para cierre de caja"""
    monto_cierre: Decimal = Field(ge=0, description="Efectivo contado al cierre")
    notas: Optional[str] = None
    
    @validator('monto_cierre')
    def validar_monto(cls, v):
        if v < 0:
            raise ValueError('El monto de cierre no puede ser negativo')
        return round(v, 2)
    
    class Config:
        json_schema_extra = {
            "example": {
                "monto_cierre": 125000.00,
                "notas": "Cierre turno mañana - todo OK"
            }
        }


# ============================================
# SCHEMAS DE SALIDA
# ============================================

class CajaBase(BaseModel):
    """Schema base de caja"""
    id: int
    nombre: str
    estado: str
    fecha_apertura: datetime
    monto_apertura: Decimal
    usuario_apertura_id: int
    
    class Config:
        from_attributes = True


class CajaDetalle(CajaBase):
    """Schema detallado de caja con cálculos"""
    fecha_cierre: Optional[datetime] = None
    monto_cierre: Optional[Decimal] = None
    usuario_cierre_id: Optional[int] = None
    notas: Optional[str] = None
    
    # Campos calculados
    total_efectivo_teorico: Decimal
    diferencia: Decimal
    
    class Config:
        from_attributes = True
        json_schema_extra = {
            "example": {
                "id": 1,
                "nombre": "Caja Principal",
                "estado": "cerrada",
                "fecha_apertura": "2025-12-14T08:00:00",
                "monto_apertura": 50000.00,
                "usuario_apertura_id": 1,
                "fecha_cierre": "2025-12-14T18:00:00",
                "monto_cierre": 125000.00,
                "usuario_cierre_id": 1,
                "total_efectivo_teorico": 124500.00,
                "diferencia": 500.00
            }
        }


class CajaList(BaseModel):
    """Schema para listado de cajas"""
    id: int
    nombre: str
    estado: str
    fecha_apertura: datetime
    monto_apertura: Decimal
    fecha_cierre: Optional[datetime] = None
    
    class Config:
        from_attributes = True
```

### Schemas de Factura

**Archivo**: `app/schemas/factura.py`

```python
from pydantic import BaseModel, Field, validator
from decimal import Decimal
from datetime import datetime
from typing import Optional, List

# ============================================
# SCHEMAS DE PAGO
# ============================================

class PagoFacturaCreate(BaseModel):
    """Schema para crear un pago"""
    metodo_pago_id: int = Field(gt=0)
    monto: Decimal = Field(gt=0, description="Monto del pago")
    referencia_pago: Optional[str] = Field(None, max_length=100)
    
    @validator('monto')
    def validar_monto(cls, v):
        if v <= 0:
            raise ValueError('El monto debe ser mayor a 0')
        return round(v, 2)
    
    class Config:
        json_schema_extra = {
            "example": {
                "metodo_pago_id": 1,
                "monto": 50000.00,
                "referencia_pago": None
            }
        }


class PagoFacturaResponse(BaseModel):
    """Schema de respuesta de pago"""
    id: int
    metodo_pago_id: int
    metodo_pago_nombre: str
    monto: Decimal
    referencia_pago: Optional[str]
    fecha_pago: datetime
    
    class Config:
        from_attributes = True


# ============================================
# SCHEMAS DE DETALLE FACTURA
# ============================================

class DetalleFacturaCreate(BaseModel):
    """Schema para crear línea de detalle"""
    tipo: str = Field(pattern="^(servicio|producto)$")
    item_id: int = Field(gt=0, description="ID del servicio o producto")
    cantidad: Decimal = Field(gt=0, default=1)
    precio_unitario: Decimal = Field(ge=0)
    descuento_linea: Decimal = Field(ge=0, default=0)
    especialista_id: int = Field(gt=0, description="ID del especialista que realizó el servicio/venta")
    cita_id: Optional[int] = None
    
    @validator('tipo')
    def validar_tipo(cls, v):
        if v not in ['servicio', 'producto']:
            raise ValueError("El tipo debe ser 'servicio' o 'producto'")
        return v
    
    @validator('cantidad', 'precio_unitario', 'descuento_linea')
    def redondear_decimales(cls, v):
        return round(v, 2) if v else 0
    
    class Config:
        json_schema_extra = {
            "example": {
                "tipo": "servicio",
                "item_id": 5,
                "cantidad": 1,
                "precio_unitario": 80000.00,
                "descuento_linea": 0,
                "especialista_id": 3,
                "cita_id": None
            }
        }


class DetalleFacturaResponse(BaseModel):
    """Schema de respuesta de detalle"""
    id: int
    tipo: str
    item_id: int
    item_nombre: str
    cantidad: Decimal
    precio_unitario: Decimal
    descuento_linea: Decimal
    subtotal: Decimal
    especialista_id: int
    especialista_nombre: str
    cita_id: Optional[int]
    comision_calculada: Decimal
    
    class Config:
        from_attributes = True


# ============================================
# SCHEMAS DE FACTURA
# ============================================

class FacturaCreate(BaseModel):
    """Schema para crear factura"""
    cliente_id: Optional[int] = Field(None, description="ID del cliente (opcional para venta rápida)")
    detalle: List[DetalleFacturaCreate] = Field(min_length=1, description="Líneas de la factura")
    pagos: List[PagoFacturaCreate] = Field(min_length=1, description="Pagos aplicados")
    descuento: Decimal = Field(ge=0, default=0, description="Descuento general de la factura")
    notas: Optional[str] = None
    
    @validator('detalle')
    def validar_detalle(cls, v):
        if not v:
            raise ValueError('La factura debe tener al menos un ítem')
        return v
    
    @validator('pagos')
    def validar_pagos(cls, v):
        if not v:
            raise ValueError('La factura debe tener al menos un método de pago')
        return v
    
    class Config:
        json_schema_extra = {
            "example": {
                "cliente_id": 15,
                "detalle": [
                    {
                        "tipo": "servicio",
                        "item_id": 5,
                        "cantidad": 1,
                        "precio_unitario": 80000.00,
                        "descuento_linea": 0,
                        "especialista_id": 3
                    },
                    {
                        "tipo": "producto",
                        "item_id": 12,
                        "cantidad": 2,
                        "precio_unitario": 25000.00,
                        "descuento_linea": 0,
                        "especialista_id": 3
                    }
                ],
                "pagos": [
                    {"metodo_pago_id": 1, "monto": 80000.00},
                    {"metodo_pago_id": 2, "monto": 50000.00, "referencia_pago": "REF123456"}
                ],
                "descuento": 0,
                "notas": "Cliente frecuente"
            }
        }


class FacturaFromPendientesCreate(BaseModel):
    """Schema para facturar desde servicios pendientes"""
    cliente_id: int = Field(gt=0)
    facturas_pendientes_ids: List[int] = Field(min_length=1, description="IDs de servicios pendientes a facturar")
    detalle_adicional: List[DetalleFacturaCreate] = Field(default=[], description="Ítems adicionales a agregar")
    pagos: List[PagoFacturaCreate] = Field(min_length=1)
    descuento: Decimal = Field(ge=0, default=0)
    notas: Optional[str] = None
    
    @validator('facturas_pendientes_ids')
    def validar_pendientes(cls, v):
        if not v:
            raise ValueError('Debe seleccionar al menos un servicio pendiente')
        return v
    
    class Config:
        json_schema_extra = {
            "example": {
                "cliente_id": 15,
                "facturas_pendientes_ids": [45, 46, 47],
                "detalle_adicional": [
                    {
                        "tipo": "producto",
                        "item_id": 8,
                        "cantidad": 1,
                        "precio_unitario": 35000.00,
                        "descuento_linea": 0,
                        "especialista_id": 2
                    }
                ],
                "pagos": [
                    {"metodo_pago_id": 1, "monto": 150000.00}
                ],
                "descuento": 10000.00,
                "notas": "Descuento por múltiples servicios"
            }
        }


class FacturaResponse(BaseModel):
    """Schema de respuesta de factura"""
    id: int
    numero_factura: str
    cliente_id: Optional[int]
    cliente_nombre: Optional[str]
    fecha: datetime
    subtotal: Decimal
    descuento: Decimal
    impuestos: Decimal
    total: Decimal
    estado: str
    detalle: List[DetalleFacturaResponse]
    pagos: List[PagoFacturaResponse]
    total_pagado: Decimal
    saldo_pendiente: Decimal
    caja_id: int
    usuario_id: int
    notas: Optional[str]
    
    class Config:
        from_attributes = True


class FacturaList(BaseModel):
    """Schema para listado de facturas"""
    id: int
    numero_factura: str
    cliente_nombre: Optional[str]
    fecha: datetime
    total: Decimal
    estado: str
    total_pagado: Decimal
    
    class Config:
        from_attributes = True


class FacturaAnular(BaseModel):
    """Schema para anular factura"""
    motivo: str = Field(min_length=10, max_length=500, description="Motivo de anulación")
    
    class Config:
        json_schema_extra = {
            "example": {
                "motivo": "Cliente solicitó devolución por insatisfacción con el servicio"
            }
        }
```

### Schemas de Movimiento Caja

**Archivo**: `app/schemas/movimiento_caja.py`

```python
from pydantic import BaseModel, Field, validator
from decimal import Decimal
from datetime import datetime
from typing import Optional

class MovimientoCajaCreate(BaseModel):
    """Schema para crear movimiento de caja"""
    tipo: str = Field(pattern="^(ingreso|egreso)$")
    monto: Decimal = Field(gt=0)
    concepto: str = Field(min_length=3, max_length=255)
    
    @validator('tipo')
    def validar_tipo(cls, v):
        if v not in ['ingreso', 'egreso']:
            raise ValueError("El tipo debe ser 'ingreso' o 'egreso'")
        return v
    
    @validator('monto')
    def validar_monto(cls, v):
        if v <= 0:
            raise ValueError('El monto debe ser mayor a 0')
        return round(v, 2)
    
    class Config:
        json_schema_extra = {
            "example": {
                "tipo": "egreso",
                "monto": 15000.00,
                "concepto": "Compra de suministros de limpieza"
            }
        }


class MovimientoCajaResponse(BaseModel):
    """Schema de respuesta de movimiento"""
    id: int
    caja_id: int
    tipo: str
    monto: Decimal
    concepto: str
    factura_id: Optional[int]
    usuario_id: int
    usuario_nombre: str
    fecha: datetime
    
    class Config:
        from_attributes = True
```

### Schemas de Factura Pendiente

**Archivo**: `app/schemas/factura_pendiente.py`

```python
from pydantic import BaseModel, Field
from datetime import date, datetime
from typing import Optional

class FacturaPendienteCreate(BaseModel):
    """Schema para crear servicio pendiente (desde app móvil)"""
    cliente_id: Optional[int] = None
    servicio_id: int = Field(gt=0)
    fecha_servicio: date
    notas: Optional[str] = None
    
    class Config:
        json_schema_extra = {
            "example": {
                "cliente_id": 25,
                "servicio_id": 8,
                "fecha_servicio": "2025-12-14",
                "notas": "Cliente nuevo, primera visita"
            }
        }


class FacturaPendienteResponse(BaseModel):
    """Schema de respuesta de factura pendiente"""
    id: int
    especialista_id: int
    especialista_nombre: str
    cliente_id: Optional[int]
    cliente_nombre: Optional[str]
    servicio_id: int
    servicio_nombre: str
    servicio_precio: Decimal
    fecha_servicio: date
    notas: Optional[str]
    estado: str
    fecha_creacion: datetime
    
    class Config:
        from_attributes = True


class FacturaPendienteAprobar(BaseModel):
    """Schema para aprobar servicio pendiente"""
    notas: Optional[str] = None


class FacturaPendienteRechazar(BaseModel):
    """Schema para rechazar servicio pendiente"""
    motivo_rechazo: str = Field(min_length=10, max_length=500)
    
    class Config:
        json_schema_extra = {
            "example": {
                "motivo_rechazo": "El cliente no se presentó al servicio"
            }
        }


class FacturaPendienteResumen(BaseModel):
    """Schema para resumen de pendientes por cliente"""
    cliente_id: int
    cliente_nombre: str
    total_servicios: int
    total_monto: Decimal
    servicios: List[FacturaPendienteResponse]
    
    class Config:
        from_attributes = True
```

### Schemas de Ventas y Reportes

**Archivo**: `app/schemas/ventas.py`

```python
from pydantic import BaseModel
from decimal import Decimal
from datetime import date
from typing import List, Optional

class VentasDiaResponse(BaseModel):
    """Schema para ventas del día"""
    fecha: date
    total_facturas: int
    total_ventas: Decimal
    total_servicios: Decimal
    total_productos: Decimal
    total_efectivo: Decimal
    total_tarjeta: Decimal
    total_otros_metodos: Decimal
    
    class Config:
        json_schema_extra = {
            "example": {
                "fecha": "2025-12-14",
                "total_facturas": 45,
                "total_ventas": 2350000.00,
                "total_servicios": 1850000.00,
                "total_productos": 500000.00,
                "total_efectivo": 1200000.00,
                "total_tarjeta": 1000000.00,
                "total_otros_metodos": 150000.00
            }
        }


class VentasPorMetodoPago(BaseModel):
    """Schema para ventas por método de pago"""
    metodo_pago_id: int
    metodo_pago_nombre: str
    total_transacciones: int
    monto_total: Decimal


class VentasResumenResponse(BaseModel):
    """Schema para resumen de ventas por período"""
    fecha_inicio: date
    fecha_fin: date
    total_facturas: int
    total_ventas: Decimal
    promedio_ticket: Decimal
    metodos_pago: List[VentasPorMetodoPago]
```

---

## ENDPOINTS DE API

### Grupo 1: Endpoints de Caja

**Archivo**: `app/routers/caja.py`

| ID | Método | Endpoint | Descripción | Permiso |
|----|--------|----------|-------------|---------|
| **BE-CAJA-001** | GET | `/api/cajas/actual` | Obtener caja abierta actual | `caja.ver` |
| **BE-CAJA-002** | POST | `/api/cajas/apertura` | Abrir nueva caja | `caja.apertura` |
| **BE-CAJA-003** | POST | `/api/cajas/{id}/cierre` | Cerrar caja | `caja.cierre` |
| **BE-CAJA-004** | GET | `/api/cajas/{id}` | Detalle de caja específica | `caja.ver` |
| **BE-CAJA-005** | GET | `/api/cajas` | Listar todas las cajas | `caja.ver` |
| **BE-CAJA-006** | GET | `/api/cajas/{id}/cuadre` | Reporte de cuadre de caja | `caja.ver` |

### Grupo 2: Endpoints de Movimientos de Caja

| ID | Método | Endpoint | Descripción | Permiso |
|----|--------|----------|-------------|---------|
| **BE-MOV-001** | GET | `/api/cajas/{id}/movimientos` | Listar movimientos de una caja | `caja.ver` |
| **BE-MOV-002** | POST | `/api/cajas/{id}/movimientos` | Registrar ingreso/egreso | `caja.ver` |
| **BE-MOV-003** | GET | `/api/cajas/{id}/movimientos/resumen` | Resumen de movimientos | `caja.ver` |

### Grupo 3: Endpoints de Facturas

| ID | Método | Endpoint | Descripción | Permiso |
|----|--------|----------|-------------|---------|
| **BE-FAC-001** | GET | `/api/facturas` | Listar facturas con filtros | `caja.ver` |
| **BE-FAC-002** | GET | `/api/facturas/{id}` | Detalle de factura | `caja.ver` |
| **BE-FAC-003** | POST | `/api/facturas` | Crear factura (flujo directo) | `caja.facturar` |
| **BE-FAC-004** | POST | `/api/facturas/desde-pendientes` | Crear factura desde pendientes | `caja.facturar` |
| **BE-FAC-005** | PUT | `/api/facturas/{id}/anular` | Anular factura | `caja.anular` |
| **BE-FAC-006** | GET | `/api/facturas/{id}/ticket` | Generar ticket PDF | `caja.ver` |
| **BE-FAC-007** | GET | `/api/facturas/{id}/imprimir` | Datos para impresión térmica | `caja.ver` |

### Grupo 4: Endpoints de Facturas Pendientes

| ID | Método | Endpoint | Descripción | Permiso |
|----|--------|----------|-------------|---------|
| **BE-FACPEN-001** | GET | `/api/facturas-pendientes` | Listar pendientes con filtros | `caja.aprobar_pendientes` |
| **BE-FACPEN-002** | GET | `/api/facturas-pendientes/resumen-por-cliente` | Resumen agrupado por cliente | `caja.aprobar_pendientes` |
| **BE-FACPEN-003** | GET | `/api/facturas-pendientes/{id}` | Detalle de pendiente | `caja.aprobar_pendientes` |
| **BE-FACPEN-004** | POST | `/api/facturas-pendientes/{id}/aprobar` | Aprobar servicio pendiente | `caja.aprobar_pendientes` |
| **BE-FACPEN-005** | POST | `/api/facturas-pendientes/{id}/rechazar` | Rechazar servicio pendiente | `caja.aprobar_pendientes` |

### Grupo 5: Endpoints de Ventas y Reportes

| ID | Método | Endpoint | Descripción | Permiso |
|----|--------|----------|-------------|---------|
| **BE-VTAS-001** | GET | `/api/ventas/dia` | Ventas del día actual | `caja.ver` |
| **BE-VTAS-002** | GET | `/api/ventas/periodo` | Ventas por período con filtros | `caja.ver` |
| **BE-VTAS-003** | GET | `/api/ventas/metodos-pago` | Resumen por método de pago | `caja.ver` |

### Grupo 6: Endpoints de Métodos de Pago

| ID | Método | Endpoint | Descripción | Permiso |
|----|--------|----------|-------------|---------|
| **BE-MPAGO-001** | GET | `/api/metodos-pago` | Listar métodos de pago | `caja.ver` |
| **BE-MPAGO-002** | PUT | `/api/metodos-pago/{id}` | Activar/desactivar método | `config.editar` |

---

## SERVICIOS DE NEGOCIO

### 1. CajaService

**Archivo**: `app/services/caja_service.py`

```python
from sqlalchemy.orm import Session
from sqlalchemy import and_, func
from app.models.caja import Caja
from app.models.movimiento_caja import MovimientoCaja
from app.schemas.caja import CajaAperturaCreate, CajaCierreCreate
from app.core.exceptions import BusinessException
from datetime import datetime
from decimal import Decimal
from typing import Optional

class CajaService:
    """Servicio para gestión de cajas"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def obtener_caja_actual(self) -> Optional[Caja]:
        """Obtiene la caja actualmente abierta"""
        return self.db.query(Caja).filter(Caja.estado == 'abierta').first()
    
    def validar_unica_caja_abierta(self):
        """Valida que no haya más de una caja abierta"""
        count = self.db.query(Caja).filter(Caja.estado == 'abierta').count()
        if count > 0:
            raise BusinessException(
                "Ya existe una caja abierta. Debe cerrarla antes de abrir una nueva.",
                code="CAJA_YA_ABIERTA"
            )
    
    def abrir_caja(self, data: CajaAperturaCreate, usuario_id: int) -> Caja:
        """Abre una nueva caja"""
        # Validar que no exista caja abierta
        self.validar_unica_caja_abierta()
        
        # Crear nueva caja
        nueva_caja = Caja(
            nombre=data.nombre,
            usuario_apertura_id=usuario_id,
            fecha_apertura=datetime.now(),
            monto_apertura=data.monto_apertura,
            estado='abierta',
            notas=data.notas
        )
        
        self.db.add(nueva_caja)
        self.db.flush()
        
        # Registrar movimiento de apertura
        movimiento = MovimientoCaja(
            caja_id=nueva_caja.id,
            tipo='ingreso',
            monto=data.monto_apertura,
            concepto='Apertura de caja',
            usuario_id=usuario_id
        )
        self.db.add(movimiento)
        
        self.db.commit()
        self.db.refresh(nueva_caja)
        
        return nueva_caja
    
    def cerrar_caja(self, caja_id: int, data: CajaCierreCreate, usuario_id: int) -> Caja:
        """Cierra una caja y calcula diferencia"""
        caja = self.db.query(Caja).filter(Caja.id == caja_id).first()
        
        if not caja:
            raise BusinessException("Caja no encontrada", code="CAJA_NO_ENCONTRADA")
        
        if caja.estado == 'cerrada':
            raise BusinessException("La caja ya está cerrada", code="CAJA_YA_CERRADA")
        
        # Actualizar caja
        caja.usuario_cierre_id = usuario_id
        caja.fecha_cierre = datetime.now()
        caja.monto_cierre = data.monto_cierre
        caja.estado = 'cerrada'
        if data.notas:
            caja.notas = (caja.notas or '') + '\n' + data.notas
        
        self.db.commit()
        self.db.refresh(caja)
        
        return caja
    
    def calcular_cuadre(self, caja_id: int) -> dict:
        """Calcula el cuadre de caja detallado"""
        caja = self.db.query(Caja).filter(Caja.id == caja_id).first()
        
        if not caja:
            raise BusinessException("Caja no encontrada", code="CAJA_NO_ENCONTRADA")
        
        # Obtener movimientos
        ingresos = self.db.query(func.sum(MovimientoCaja.monto))\
            .filter(and_(
                MovimientoCaja.caja_id == caja_id,
                MovimientoCaja.tipo == 'ingreso'
            )).scalar() or Decimal(0)
        
        egresos = self.db.query(func.sum(MovimientoCaja.monto))\
            .filter(and_(
                MovimientoCaja.caja_id == caja_id,
                MovimientoCaja.tipo == 'egreso'
            )).scalar() or Decimal(0)
        
        # Obtener ventas por método de pago
        from app.models.pago_factura import PagoFactura
        from app.models.factura import Factura
        from app.models.metodo_pago import MetodoPago
        
        ventas_por_metodo = self.db.query(
            MetodoPago.nombre,
            func.sum(PagoFactura.monto).label('total')
        ).join(PagoFactura.factura)\
         .join(PagoFactura.metodo_pago)\
         .filter(and_(
             Factura.caja_id == caja_id,
             Factura.estado == 'pagada'
         ))\
         .group_by(MetodoPago.nombre)\
         .all()
        
        efectivo_teorico = float(caja.monto_apertura) + float(ingresos) - float(egresos)
        diferencia = float(caja.monto_cierre or 0) - efectivo_teorico if caja.monto_cierre else 0
        
        return {
            'caja_id': caja.id,
            'nombre': caja.nombre,
            'fecha_apertura': caja.fecha_apertura,
            'fecha_cierre': caja.fecha_cierre,
            'monto_apertura': float(caja.monto_apertura),
            'ingresos_adicionales': float(ingresos - caja.monto_apertura),
            'egresos': float(egresos),
            'efectivo_teorico': efectivo_teorico,
            'efectivo_real': float(caja.monto_cierre or 0),
            'diferencia': diferencia,
            'ventas_por_metodo': [
                {'metodo': nombre, 'total': float(total)}
                for nombre, total in ventas_por_metodo
            ]
        }
```

### 2. FacturaService

**Archivo**: `app/services/factura_service.py`

```python
from sqlalchemy.orm import Session
from sqlalchemy import and_
from app.models.factura import Factura
from app.models.detalle_factura import DetalleFactura
from app.models.pago_factura import PagoFactura
from app.models.caja import Caja
from app.models.movimiento_caja import MovimientoCaja
from app.models.producto import Producto
from app.models.movimiento_inventario import MovimientoInventario
from app.models.cita import Cita
from app.schemas.factura import FacturaCreate, FacturaFromPendientesCreate
from app.services.numero_factura_service import NumeroFacturaService
from app.services.comision_calculator import ComisionCalculator
from app.core.exceptions import BusinessException
from decimal import Decimal
from typing import List

class FacturaService:
    """Servicio para gestión de facturas"""
    
    def __init__(self, db: Session):
        self.db = db
        self.numero_service = NumeroFacturaService(db)
        self.comision_calc = ComisionCalculator(db)
    
    def validar_caja_abierta(self) -> Caja:
        """Valida que exista caja abierta"""
        caja = self.db.query(Caja).filter(Caja.estado == 'abierta').first()
        if not caja:
            raise BusinessException(
                "No hay caja abierta. Debe abrir una caja antes de facturar.",
                code="CAJA_NO_ABIERTA"
            )
        return caja
    
    def validar_stock_disponible(self, item_id: int, cantidad: Decimal):
        """Valida que haya stock suficiente para un producto"""
        producto = self.db.query(Producto).filter(Producto.id == item_id).first()
        if not producto:
            raise BusinessException(f"Producto {item_id} no encontrado", code="PRODUCTO_NO_ENCONTRADO")
        
        if producto.stock_actual < cantidad:
            raise BusinessException(
                f"Stock insuficiente para {producto.nombre}. Disponible: {producto.stock_actual}",
                code="STOCK_INSUFICIENTE"
            )
    
    def calcular_totales(self, detalle: List[DetalleFacturaCreate], descuento_general: Decimal) -> dict:
        """Calcula subtotal, impuestos y total de la factura"""
        from app.services.configuracion_service import ConfiguracionService
        config_service = ConfiguracionService(self.db)
        
        iva = Decimal(config_service.obtener_valor('impuesto_iva', '19'))
        
        # Calcular subtotal de ítems
        subtotal = Decimal(0)
        for item in detalle:
            item_subtotal = (item.cantidad * item.precio_unitario) - item.descuento_linea
            subtotal += item_subtotal
        
        # Aplicar descuento general
        subtotal_con_descuento = subtotal - descuento_general
        
        # Calcular impuestos (IVA se aplica sobre subtotal con descuento)
        impuestos = subtotal_con_descuento * (iva / 100)
        
        # Total
        total = subtotal_con_descuento + impuestos
        
        return {
            'subtotal': round(subtotal, 2),
            'descuento': round(descuento_general, 2),
            'impuestos': round(impuestos, 2),
            'total': round(total, 2)
        }
    
    def validar_pagos(self, pagos: List, total: Decimal):
        """Valida que la suma de pagos sea igual al total de la factura"""
        suma_pagos = sum(Decimal(str(p.monto)) for p in pagos)
        
        if suma_pagos != total:
            raise BusinessException(
                f"La suma de pagos ({suma_pagos}) no coincide con el total de la factura ({total})",
                code="PAGOS_NO_COINCIDEN"
            )
        
        # Validar que métodos con requiere_referencia tengan referencia
        from app.models.metodo_pago import MetodoPago
        for pago in pagos:
            metodo = self.db.query(MetodoPago).filter(MetodoPago.id == pago.metodo_pago_id).first()
            if metodo and metodo.requiere_referencia and not pago.referencia_pago:
                raise BusinessException(
                    f"El método de pago '{metodo.nombre}' requiere número de referencia",
                    code="REFERENCIA_REQUERIDA"
                )
    
    def crear_factura(self, data: FacturaCreate, usuario_id: int) -> Factura:
        """Crea una nueva factura (flujo directo)"""
        # Validar caja abierta
        caja = self.validar_caja_abierta()
        
        # Validar stock para productos
        for item in data.detalle:
            if item.tipo == 'producto':
                self.validar_stock_disponible(item.item_id, item.cantidad)
        
        # Calcular totales
        totales = self.calcular_totales(data.detalle, data.descuento)
        
        # Validar pagos
        self.validar_pagos(data.pagos, totales['total'])
        
        # Generar número de factura
        numero_factura = self.numero_service.generar_siguiente()
        
        # Crear factura
        factura = Factura(
            numero_factura=numero_factura,
            cliente_id=data.cliente_id,
            subtotal=totales['subtotal'],
            descuento=totales['descuento'],
            impuestos=totales['impuestos'],
            total=totales['total'],
            estado='pagada',
            usuario_id=usuario_id,
            caja_id=caja.id,
            notas=data.notas
        )
        
        self.db.add(factura)
        self.db.flush()
        
        # Crear detalle
        for item_data in data.detalle:
            item_subtotal = (item_data.cantidad * item_data.precio_unitario) - item_data.descuento_linea
            
            detalle = DetalleFactura(
                factura_id=factura.id,
                tipo=item_data.tipo,
                item_id=item_data.item_id,
                cantidad=item_data.cantidad,
                precio_unitario=item_data.precio_unitario,
                descuento_linea=item_data.descuento_linea,
                subtotal=round(item_subtotal, 2),
                especialista_id=item_data.especialista_id,
                cita_id=item_data.cita_id
            )
            self.db.add(detalle)
            
            # Si es producto, descontar stock (trigger lo hace automáticamente)
            # Si vincula cita, marcar como completada
            if item_data.cita_id:
                cita = self.db.query(Cita).filter(Cita.id == item_data.cita_id).first()
                if cita:
                    cita.estado = 'completada'
        
        # Crear pagos
        for pago_data in data.pagos:
            pago = PagoFactura(
                factura_id=factura.id,
                metodo_pago_id=pago_data.metodo_pago_id,
                monto=pago_data.monto,
                referencia_pago=pago_data.referencia_pago,
                usuario_id=usuario_id
            )
            self.db.add(pago)
            
            # Registrar movimiento de caja solo para efectivo
            from app.models.metodo_pago import MetodoPago
            metodo = self.db.query(MetodoPago).filter(MetodoPago.id == pago_data.metodo_pago_id).first()
            if metodo and metodo.nombre.lower() == 'efectivo':
                movimiento = MovimientoCaja(
                    caja_id=caja.id,
                    tipo='ingreso',
                    monto=pago_data.monto,
                    concepto=f'Venta - Factura {numero_factura}',
                    factura_id=factura.id,
                    usuario_id=usuario_id
                )
                self.db.add(movimiento)
        
        self.db.commit()
        self.db.refresh(factura)
        
        return factura
    
    def crear_factura_desde_pendientes(
        self, 
        data: FacturaFromPendientesCreate, 
        usuario_id: int
    ) -> Factura:
        """Crea factura consolidando servicios pendientes"""
        from app.models.factura_pendiente import FacturaPendiente
        from app.models.servicio import Servicio
        
        # Validar caja abierta
        caja = self.validar_caja_abierta()
        
        # Obtener servicios pendientes
        pendientes = self.db.query(FacturaPendiente)\
            .filter(
                FacturaPendiente.id.in_(data.facturas_pendientes_ids),
                FacturaPendiente.cliente_id == data.cliente_id,
                FacturaPendiente.estado == 'pendiente'
            ).all()
        
        if len(pendientes) != len(data.facturas_pendientes_ids):
            raise BusinessException(
                "Algunos servicios pendientes no existen o no pertenecen al cliente",
                code="PENDIENTES_INVALIDOS"
            )
        
        # Convertir pendientes a detalle de factura
        detalle_completo = []
        
        for pendiente in pendientes:
            servicio = self.db.query(Servicio).filter(Servicio.id == pendiente.servicio_id).first()
            if not servicio:
                raise BusinessException(
                    f"Servicio {pendiente.servicio_id} no encontrado",
                    code="SERVICIO_NO_ENCONTRADO"
                )
            
            detalle_item = DetalleFacturaCreate(
                tipo='servicio',
                item_id=pendiente.servicio_id,
                cantidad=1,
                precio_unitario=servicio.precio_base,
                descuento_linea=0,
                especialista_id=pendiente.especialista_id
            )
            detalle_completo.append(detalle_item)
        
        # Agregar ítems adicionales
        detalle_completo.extend(data.detalle_adicional)
        
        # Validar stock para productos adicionales
        for item in data.detalle_adicional:
            if item.tipo == 'producto':
                self.validar_stock_disponible(item.item_id, item.cantidad)
        
        # Calcular totales
        totales = self.calcular_totales(detalle_completo, data.descuento)
        
        # Validar pagos
        self.validar_pagos(data.pagos, totales['total'])
        
        # Crear factura (mismo proceso que flujo directo)
        factura_data = FacturaCreate(
            cliente_id=data.cliente_id,
            detalle=detalle_completo,
            pagos=data.pagos,
            descuento=data.descuento,
            notas=data.notas
        )
        
        factura = self.crear_factura(factura_data, usuario_id)
        
        # Marcar servicios pendientes como aprobados
        for pendiente in pendientes:
            pendiente.estado = 'aprobada'
            pendiente.revisado_por = usuario_id
            pendiente.fecha_revision = datetime.now()
        
        self.db.commit()
        
        return factura
    
    def anular_factura(self, factura_id: int, motivo: str, usuario_id: int) -> Factura:
        """Anula una factura y revierte inventario/comisiones"""
        from app.services.configuracion_service import ConfiguracionService
        from datetime import datetime, timedelta
        
        config_service = ConfiguracionService(self.db)
        dias_limite = int(config_service.obtener_valor('dias_anular_factura', '1'))
        
        factura = self.db.query(Factura).filter(Factura.id == factura_id).first()
        
        if not factura:
            raise BusinessException("Factura no encontrada", code="FACTURA_NO_ENCONTRADA")
        
        if factura.estado == 'anulada':
            raise BusinessException("La factura ya está anulada", code="FACTURA_YA_ANULADA")
        
        # Validar tiempo límite para anular
        fecha_limite = datetime.now() - timedelta(days=dias_limite)
        if factura.fecha < fecha_limite:
            raise BusinessException(
                f"Solo se pueden anular facturas de los últimos {dias_limite} días",
                code="FACTURA_FUERA_DE_PLAZO"
            )
        
        # Cambiar estado
        factura.estado = 'anulada'
        factura.notas = (factura.notas or '') + f'\n[ANULADA] {motivo}'
        
        # Reversar inventario de productos
        for detalle in factura.detalle:
            if detalle.tipo == 'producto':
                producto = self.db.query(Producto).filter(Producto.id == detalle.item_id).first()
                if producto:
                    cantidad_anterior = producto.stock_actual
                    producto.stock_actual += detalle.cantidad
                    
                    # Registrar movimiento
                    movimiento = MovimientoInventario(
                        producto_id=producto.id,
                        tipo='entrada',
                        cantidad=detalle.cantidad,
                        cantidad_anterior=cantidad_anterior,
                        cantidad_nueva=producto.stock_actual,
                        motivo='Anulación de factura',
                        documento_referencia=factura.numero_factura,
                        usuario_id=usuario_id
                    )
                    self.db.add(movimiento)
        
        # Reversar movimientos de caja (solo efectivo)
        movimientos = self.db.query(MovimientoCaja)\
            .filter(MovimientoCaja.factura_id == factura_id).all()
        
        for mov in movimientos:
            # Crear movimiento contrario
            movimiento_reversion = MovimientoCaja(
                caja_id=mov.caja_id,
                tipo='egreso' if mov.tipo == 'ingreso' else 'ingreso',
                monto=mov.monto,
                concepto=f'Anulación - {mov.concepto}',
                factura_id=factura_id,
                usuario_id=usuario_id
            )
            self.db.add(movimiento_reversion)
        
        self.db.commit()
        self.db.refresh(factura)
        
        return factura
```

### 3. NumeroFacturaService

**Archivo**: `app/services/numero_factura_service.py`

```python
from sqlalchemy.orm import Session
from app.models.configuracion import Configuracion
from app.core.exceptions import BusinessException

class NumeroFacturaService:
    """Servicio para generación de números de factura secuenciales"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def generar_siguiente(self) -> str:
        """Genera el siguiente número de factura"""
        # Obtener configuración
        prefijo_config = self.db.query(Configuracion)\
            .filter(Configuracion.clave == 'prefijo_factura').first()
        
        siguiente_config = self.db.query(Configuracion)\
            .filter(Configuracion.clave == 'siguiente_numero_factura').first()
        
        if not prefijo_config or not siguiente_config:
            raise BusinessException(
                "Configuración de numeración de facturas no encontrada",
                code="CONFIG_FACTURA_NO_ENCONTRADA"
            )
        
        prefijo = prefijo_config.valor
        numero = int(siguiente_config.valor)
        
        # Generar número con formato: FAC-00001
        numero_factura = f"{prefijo}-{numero:05d}"
        
        # Incrementar siguiente número
        siguiente_config.valor = str(numero + 1)
        self.db.commit()
        
        return numero_factura
```

### 4. ComisionCalculator

**Archivo**: `app/services/comision_calculator.py`

```python
from sqlalchemy.orm import Session
from app.models.detalle_factura import DetalleFactura
from app.models.especialista_servicio import EspecialistaServicio
from app.models.producto import Producto
from decimal import Decimal

class ComisionCalculator:
    """Servicio para cálculo de comisiones de especialistas"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def calcular_comision_servicio(
        self, 
        especialista_id: int, 
        servicio_id: int, 
        monto: Decimal
    ) -> Decimal:
        """Calcula comisión de un servicio"""
        config = self.db.query(EspecialistaServicio)\
            .filter(
                EspecialistaServicio.especialista_id == especialista_id,
                EspecialistaServicio.servicio_id == servicio_id
            ).first()
        
        if not config:
            return Decimal(0)
        
        if config.tipo_comision == 'porcentaje':
            return monto * (config.valor_comision / 100)
        else:  # fijo
            return config.valor_comision
    
    def calcular_comision_producto(
        self, 
        producto_id: int, 
        monto: Decimal
    ) -> Decimal:
        """Calcula comisión de venta de producto"""
        producto = self.db.query(Producto)\
            .filter(Producto.id == producto_id).first()
        
        if not producto or not producto.comision_venta:
            return Decimal(0)
        
        return monto * (producto.comision_venta / 100)
    
    def calcular_comisiones_factura(self, factura_id: int) -> dict:
        """Calcula todas las comisiones de una factura agrupadas por especialista"""
        detalles = self.db.query(DetalleFactura)\
            .filter(DetalleFactura.factura_id == factura_id).all()
        
        comisiones_por_especialista = {}
        
        for detalle in detalles:
            if not detalle.especialista_id:
                continue
            
            if detalle.tipo == 'servicio':
                comision = self.calcular_comision_servicio(
                    detalle.especialista_id,
                    detalle.item_id,
                    detalle.subtotal
                )
            else:  # producto
                comision = self.calcular_comision_producto(
                    detalle.item_id,
                    detalle.subtotal
                )
            
            if detalle.especialista_id not in comisiones_por_especialista:
                comisiones_por_especialista[detalle.especialista_id] = Decimal(0)
            
            comisiones_por_especialista[detalle.especialista_id] += comision
        
        return comisiones_por_especialista
```

### 5. FacturaPendienteService

**Archivo**: `app/services/factura_pendiente_service.py`

```python
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.factura_pendiente import FacturaPendiente
from app.models.servicio import Servicio
from app.schemas.factura_pendiente import FacturaPendienteCreate
from datetime import datetime
from typing import List

class FacturaPendienteService:
    """Servicio para gestión de facturas pendientes (app móvil)"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def crear_pendiente(
        self, 
        data: FacturaPendienteCreate, 
        especialista_id: int
    ) -> FacturaPendiente:
        """Crea un servicio pendiente registrado por especialista"""
        pendiente = FacturaPendiente(
            especialista_id=especialista_id,
            cliente_id=data.cliente_id,
            servicio_id=data.servicio_id,
            fecha_servicio=data.fecha_servicio,
            notas=data.notas,
            estado='pendiente'
        )
        
        self.db.add(pendiente)
        self.db.commit()
        self.db.refresh(pendiente)
        
        return pendiente
    
    def obtener_resumen_por_cliente(self, cliente_id: int = None) -> List[dict]:
        """Obtiene resumen de servicios pendientes agrupados por cliente"""
        query = self.db.query(
            FacturaPendiente.cliente_id,
            func.count(FacturaPendiente.id).label('total_servicios')
        ).filter(FacturaPendiente.estado == 'pendiente')
        
        if cliente_id:
            query = query.filter(FacturaPendiente.cliente_id == cliente_id)
        
        query = query.group_by(FacturaPendiente.cliente_id)
        
        resumen = []
        for cliente_id, total in query.all():
            # Obtener detalle de servicios
            servicios = self.db.query(FacturaPendiente)\
                .filter(
                    FacturaPendiente.cliente_id == cliente_id,
                    FacturaPendiente.estado == 'pendiente'
                ).all()
            
            # Calcular total
            total_monto = 0
            for servicio in servicios:
                servicio_obj = self.db.query(Servicio)\
                    .filter(Servicio.id == servicio.servicio_id).first()
                if servicio_obj:
                    total_monto += servicio_obj.precio_base
            
            resumen.append({
                'cliente_id': cliente_id,
                'total_servicios': total,
                'total_monto': total_monto,
                'servicios': servicios
            })
        
        return resumen
    
    def aprobar_pendiente(self, pendiente_id: int, usuario_id: int) -> FacturaPendiente:
        """Aprueba un servicio pendiente (sin facturar aún)"""
        pendiente = self.db.query(FacturaPendiente)\
            .filter(FacturaPendiente.id == pendiente_id).first()
        
        if not pendiente:
            raise BusinessException("Servicio pendiente no encontrado")
        
        if pendiente.estado != 'pendiente':
            raise BusinessException("El servicio ya fue procesado")
        
        pendiente.estado = 'aprobada'
        pendiente.revisado_por = usuario_id
        pendiente.fecha_revision = datetime.now()
        
        self.db.commit()
        self.db.refresh(pendiente)
        
        return pendiente
    
    def rechazar_pendiente(
        self, 
        pendiente_id: int, 
        motivo: str, 
        usuario_id: int
    ) -> FacturaPendiente:
        """Rechaza un servicio pendiente"""
        pendiente = self.db.query(FacturaPendiente)\
            .filter(FacturaPendiente.id == pendiente_id).first()
        
        if not pendiente:
            raise BusinessException("Servicio pendiente no encontrado")
        
        if pendiente.estado != 'pendiente':
            raise BusinessException("El servicio ya fue procesado")
        
        pendiente.estado = 'rechazada'
        pendiente.revisado_por = usuario_id
        pendiente.fecha_revision = datetime.now()
        pendiente.motivo_rechazo = motivo
        
        self.db.commit()
        self.db.refresh(pendiente)
        
        return pendiente
```

### 6. TicketService

**Archivo**: `app/services/ticket_service.py`

```python
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from reportlab.lib.units import mm
from app.models.factura import Factura
from app.models.cliente import Cliente
from app.models.empresa import Empresa
from io import BytesIO
from decimal import Decimal

class TicketService:
    """Servicio para generación de tickets de venta en PDF"""
    
    def generar_ticket_pdf(self, factura: Factura) -> BytesIO:
        """Genera PDF de ticket para impresión térmica (58mm o 80mm)"""
        buffer = BytesIO()
        
        # Crear canvas con ancho de 80mm
        width = 80 * mm
        height = 297 * mm  # A4 height
        
        c = canvas.Canvas(buffer, pagesize=(width, height))
        
        # Configuración de fuentes
        c.setFont("Helvetica-Bold", 10)
        
        # TODO: Implementar diseño completo del ticket
        # - Logo de la empresa
        # - Datos de la empresa
        # - Número de factura y fecha
        # - Datos del