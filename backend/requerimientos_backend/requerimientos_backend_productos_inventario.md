# Requerimientos Backend - Módulo de Productos e Inventario
## Club de Alisados - FastAPI

---

## ÍNDICE

1. [Resumen Ejecutivo](#resumen-ejecutivo)
2. [Alcance y Objetivos](#alcance-y-objetivos)
3. [Estructura de Datos](#estructura-de-datos)
4. [Reglas de Negocio](#reglas-de-negocio)
5. [Funcionalidades Requeridas](#funcionalidades-requeridas)
6. [Endpoints de API](#endpoints-de-api)
7. [Validaciones](#validaciones)
8. [Integración con Otros Módulos](#integracion-con-otros-modulos)
9. [Seguridad y Permisos](#seguridad-y-permisos)
10. [Reportes](#reportes)
11. [Consideraciones Técnicas](#consideraciones-tecnicas)

---

## RESUMEN EJECUTIVO

### Propósito
El módulo de Productos e Inventario debe gestionar todo el ciclo de vida de los productos del salón, desde su registro hasta el control de stock en múltiples ubicaciones, permitiendo un manejo eficiente del inventario con trazabilidad completa.

### Alcance
- Gestión completa de catálogo de productos
- Control de inventario en dos ubicaciones: Bodega y Vitrina
- Registro y seguimiento de todos los movimientos de inventario
- Operaciones masivas de actualización e importación
- Reportes de ventas y análisis de inventario
- Integración con módulo de Punto de Venta para ventas automáticas

### Prioridad
**CRÍTICA** - Este módulo es fundamental para:
- Punto de Venta (registro de ventas de productos)
- Nómina (cálculo de comisiones por venta de productos)
- Reportes financieros y operativos
- Control de costos y utilidades

---

## ALCANCE Y OBJETIVOS

### Objetivos del Módulo

1. **Gestión de Productos**
   - Mantener catálogo actualizado de productos
   - Gestionar precios de compra y venta
   - Asociar productos con proveedores
   - Configurar alertas de stock mínimo/máximo
   - Manejar información adicional (vencimientos, lotes, imágenes)

2. **Control de Inventario Multi-ubicación**
   - Manejar inventario en Bodega (almacenamiento principal)
   - Manejar inventario en Vitrina (punto de venta)
   - Permitir transferencias entre ubicaciones
   - Mantener stock consolidado por producto

3. **Trazabilidad Completa**
   - Registrar todos los movimientos de inventario
   - Identificar usuario responsable de cada movimiento
   - Mantener historial inmutable de operaciones
   - Permitir auditoría de cambios en stock

4. **Operaciones Eficientes**
   - Facilitar carga masiva de productos desde Excel
   - Permitir actualización masiva de precios
   - Simplificar conteos físicos de inventario
   - Generar reportes de análisis

### Estadísticas del Módulo

| Componente | Cantidad |
|-----------|----------|
| Tablas de Base de Datos | 5 |
| Endpoints de API | 28 |
| Tipos de Movimientos | 10 |
| Reportes | 3 principales |
| Permisos Distintos | 11 |

---

## ESTRUCTURA DE DATOS

### Entidades Principales

#### 1. Proveedor
Representa a los proveedores de productos del salón.

**Campos requeridos:**
- `id`: Identificador único
- `nombre`: Nombre del proveedor (máx 200 caracteres)
- `estado`: Estado del proveedor (activo, inactivo)

**Campos opcionales:**
- `contacto`: Persona de contacto (máx 100 caracteres)
- `telefono`: Teléfono de contacto (máx 20 caracteres)
- `email`: Correo electrónico (máx 100 caracteres)
- `direccion`: Dirección física (texto)
- `notas`: Notas adicionales (texto)

**Campos automáticos:**
- `fecha_creacion`: Timestamp de creación
- `fecha_actualizacion`: Timestamp de última actualización

**Relaciones:**
- Un proveedor puede tener múltiples productos (1:N)

---

#### 2. Producto
Representa cada producto disponible en el salón.

**Campos requeridos:**
- `id`: Identificador único
- `nombre`: Nombre del producto (máx 200 caracteres)
- `precio_compra`: Precio de compra (decimal 10,2)
- `precio_venta`: Precio de venta al cliente (decimal 10,2)
- `estado`: Estado del producto (activo, inactivo, descontinuado)

**Campos opcionales:**
- `codigo`: Código SKU interno (máx 50 caracteres, único)
- `codigo_barras`: Código de barras (máx 100 caracteres, único)
- `descripcion`: Descripción del producto (texto)
- `proveedor_id`: ID del proveedor asociado
- `stock_minimo`: Cantidad mínima deseada (entero, default 0)
- `stock_maximo`: Cantidad máxima deseada (entero)
- `fecha_vencimiento`: Fecha de vencimiento del producto
- `lote`: Número de lote (máx 50 caracteres)
- `imagen_url`: URL de imagen del producto (máx 500 caracteres)

**Campos automáticos:**
- `fecha_creacion`: Timestamp de creación
- `fecha_actualizacion`: Timestamp de última actualización

**Campos calculados:**
- `stock_total`: Suma de cantidades en todas las ubicaciones
- `margen_ganancia`: Porcentaje de ganancia ((venta-compra)/compra * 100)

**Relaciones:**
- Un producto pertenece a un proveedor (N:1, opcional)
- Un producto tiene múltiples registros de inventario por ubicación (1:N)
- Un producto tiene múltiples movimientos de inventario (1:N)

**Restricciones:**
- Código SKU debe ser único si se proporciona
- Código de barras debe ser único si se proporciona
- Precio de compra debe ser >= 0
- Precio de venta debe ser >= 0
- Stock máximo debe ser >= stock mínimo (si ambos se proporcionan)

---

#### 3. Ubicación de Inventario
Representa las ubicaciones físicas donde se almacena el inventario.

**Campos requeridos:**
- `id`: Identificador único
- `nombre`: Nombre de la ubicación (máx 100 caracteres, único)
- `tipo`: Tipo de ubicación (bodega, vitrina, otro)
- `estado`: Estado (activo, inactivo)

**Campos opcionales:**
- `descripcion`: Descripción de la ubicación (texto)
- `es_principal`: Indicador si es la ubicación principal (booleano)

**Campos automáticos:**
- `fecha_creacion`: Timestamp de creación

**Relaciones:**
- Una ubicación tiene múltiples registros de inventario (1:N)
- Una ubicación puede ser origen de movimientos (1:N)
- Una ubicación puede ser destino de movimientos (1:N)

**Restricciones:**
- Solo puede haber una ubicación marcada como principal
- El nombre debe ser único

**Ubicaciones iniciales requeridas:**
1. Bodega (tipo: bodega, es_principal: true)
2. Vitrina (tipo: vitrina)

---

#### 4. Inventario
Representa la cantidad actual de cada producto en cada ubicación.

**Campos requeridos:**
- `id`: Identificador único
- `producto_id`: ID del producto
- `ubicacion_id`: ID de la ubicación
- `cantidad`: Cantidad actual en stock (entero >= 0)

**Campos automáticos:**
- `fecha_actualizacion`: Timestamp de última actualización

**Relaciones:**
- Pertenece a un producto (N:1)
- Pertenece a una ubicación (N:1)

**Restricciones:**
- La combinación (producto_id, ubicacion_id) debe ser única
- La cantidad nunca puede ser negativa
- Si no existe registro para un producto en una ubicación, se asume cantidad = 0

**Notas importantes:**
- Esta tabla se actualiza AUTOMÁTICAMENTE mediante triggers cuando se registran movimientos
- No debe modificarse directamente excepto para ajustes manuales

---

#### 5. Movimiento de Inventario
Representa cada operación que afecta el inventario (entrada, salida, transferencia, etc.).

**Campos requeridos:**
- `id`: Identificador único
- `producto_id`: ID del producto afectado
- `tipo_movimiento`: Tipo de operación (ver tipos abajo)
- `cantidad`: Cantidad del movimiento (entero > 0)
- `usuario_id`: ID del usuario que ejecuta el movimiento

**Campos opcionales:**
- `ubicacion_origen_id`: ID de ubicación de donde sale (para decrementos)
- `ubicacion_destino_id`: ID de ubicación donde entra (para incrementos)
- `venta_id`: ID de venta asociada (para movimientos tipo 'venta')
- `costo_unitario`: Costo unitario del producto en este movimiento (decimal 10,2)
- `costo_total`: Costo total del movimiento (decimal 10,2)
- `motivo`: Descripción o justificación del movimiento (texto)
- `referencia`: Número de factura, orden de compra, etc. (máx 100 caracteres)

**Campos automáticos:**
- `fecha_movimiento`: Timestamp del movimiento

**Tipos de movimiento soportados:**
1. `compra`: Entrada por compra a proveedor
2. `venta`: Salida por venta al cliente (automático desde POS)
3. `ajuste_positivo`: Corrección manual aumentando stock
4. `ajuste_negativo`: Corrección manual disminuyendo stock
5. `transferencia`: Movimiento entre ubicaciones
6. `uso_interno`: Consumo del salón (no es venta)
7. `devolucion`: Devolución de cliente
8. `merma`: Pérdida, daño o vencimiento
9. `muestra`: Entrega de muestra gratuita
10. `donacion`: Donación de producto

**Relaciones:**
- Pertenece a un producto (N:1)
- Puede tener ubicación origen (N:1)
- Puede tener ubicación destino (N:1)
- Puede estar asociado a una venta (N:1)
- Fue ejecutado por un usuario (N:1)

**Restricciones:**
- La cantidad siempre debe ser positiva
- Según el tipo de movimiento, se requiere ubicación origen y/o destino:
  - Compra: requiere ubicacion_destino_id
  - Venta: requiere ubicacion_origen_id
  - Ajuste positivo: requiere ubicacion_destino_id
  - Ajuste negativo: requiere ubicacion_origen_id
  - Transferencia: requiere ambas ubicaciones (origen ≠ destino)
  - Uso interno: requiere ubicacion_origen_id
  - Devolución: requiere ubicacion_destino_id
  - Merma: requiere ubicacion_origen_id
  - Muestra: requiere ubicacion_origen_id
  - Donación: requiere ubicacion_origen_id

**Comportamiento automático:**
- Al insertar un movimiento, se ejecuta trigger que actualiza tabla `inventario`
- Los movimientos NO se pueden eliminar, solo anular con movimiento inverso
- Para transferencias, el trigger maneja automáticamente ambas ubicaciones

---

## REGLAS DE NEGOCIO

### RN-001: Stock Nunca Negativo
**Prioridad: CRÍTICA**

El inventario de un producto en una ubicación NUNCA puede tener cantidad negativa.

**Implementación:**
- Trigger en base de datos que valida antes de actualizar inventario
- Validación adicional en capa de servicio antes de registrar movimientos
- Si un movimiento intentaría dejar stock negativo, debe rechazarse con error claro

**Excepción:**
- Ninguna. Esta regla no tiene excepciones.

---

### RN-002: Ventas Descuentan de Vitrina
**Prioridad: CRÍTICA**

Todas las ventas de productos realizadas desde el Punto de Venta deben descontar automáticamente el inventario de la ubicación "Vitrina".

**Flujo:**
1. Usuario registra venta en módulo POS
2. POS crea automáticamente movimiento tipo 'venta'
3. ubicacion_origen_id siempre es Vitrina
4. Trigger decrementa inventario de Vitrina

**Responsabilidad del usuario:**
- Mantener stock suficiente en Vitrina
- Transferir productos de Bodega a Vitrina cuando sea necesario

---

### RN-003: Transferencias Manuales Bodega → Vitrina
**Prioridad: ALTA**

Las transferencias entre Bodega y Vitrina son responsabilidad del usuario y deben ejecutarse manualmente cuando se necesita surtir la Vitrina.

**Proceso:**
1. Usuario verifica stock en Vitrina
2. Usuario crea transferencia especificando:
   - Producto
   - Cantidad a transferir
   - Ubicación origen: Bodega
   - Ubicación destino: Vitrina
   - Motivo (opcional)
3. Sistema valida stock suficiente en Bodega
4. Sistema registra movimiento tipo 'transferencia'
5. Trigger decrementa Bodega e incrementa Vitrina

**Validaciones:**
- Debe haber stock suficiente en ubicación origen
- Ubicación origen debe ser diferente de ubicación destino
- No se pueden transferir cantidades negativas o cero

---

### RN-004: Códigos Únicos
**Prioridad: ALTA**

Los códigos de producto (SKU y código de barras) deben ser únicos en el sistema si se proporcionan.

**Reglas:**
- Código SKU: único, opcional
- Código de barras: único, opcional
- Si un código ya existe, rechazar creación/actualización con error descriptivo

**Nota:**
- Ambos campos son opcionales
- Productos sin código pueden identificarse solo por nombre e ID

---

### RN-005: Precios Coherentes
**Prioridad: MEDIA**

El precio de venta debería ser mayor o igual al precio de compra para evitar pérdidas.

**Implementación:**
- Validación suave (advertencia, no bloquea)
- Permitir precio_venta < precio_compra si usuario confirma
- Calcular margen de ganancia automáticamente: ((venta-compra)/compra * 100)

**Casos de excepción permitidos:**
- Liquidaciones
- Promociones especiales
- Productos descontinuados

---

### RN-006: Historial Inmutable
**Prioridad: CRÍTICA**

Los movimientos de inventario NO se pueden eliminar para mantener trazabilidad completa.

**Proceso de anulación:**
1. Usuario solicita anular movimiento X
2. Sistema valida que el movimiento puede anularse
3. Sistema crea nuevo movimiento inverso que revierte el efecto
4. Movimiento original permanece en base de datos

**Ejemplo:**
- Movimiento original: Compra de 10 unidades → +10 en Bodega
- Anulación: Ajuste negativo de 10 unidades → -10 en Bodega
- Ambos registros permanecen en historial

---

### RN-007: Alertas de Stock
**Prioridad: MEDIA**

El sistema debe generar alertas cuando:
1. Stock total < stock_minimo configurado (stock bajo)
2. Stock total = 0 en todas ubicaciones (sin stock)
3. Fecha de vencimiento <= fecha actual + días configurados (próximo a vencer)

**Implementación:**
- Endpoints específicos para consultar productos con alertas
- Dashboard debe mostrar contadores de alertas
- Notificaciones periódicas (opcional, futuro)

---

### RN-008: Validación de Stock en Transferencias
**Prioridad: CRÍTICA**

Antes de ejecutar una transferencia, validar que hay stock suficiente en ubicación origen.

**Proceso:**
1. Usuario solicita transferir X unidades de Bodega a Vitrina
2. Sistema consulta inventario actual en Bodega
3. Si stock_bodega >= X, proceder
4. Si stock_bodega < X, rechazar con mensaje: "Stock insuficiente en Bodega. Disponible: Y unidades"

---

### RN-009: Usuario Responsable
**Prioridad: ALTA**

Cada movimiento de inventario debe registrar el usuario que lo ejecutó para auditabilidad.

**Implementación:**
- Campo usuario_id obligatorio en todos los movimientos
- Obtener de JWT token del usuario autenticado
- No permitir modificar usuario después de crear movimiento

---

### RN-010: Relación con Ventas
**Prioridad: CRÍTICA**

Cuando el módulo POS registra una venta que incluye productos:
1. POS debe crear movimientos de inventario automáticamente
2. tipo_movimiento = 'venta'
3. ubicacion_origen_id = Vitrina
4. venta_id = ID de la venta en POS
5. cantidad = cantidad vendida
6. costo_unitario = precio_compra del producto

**Integración requerida:**
- POS debe tener endpoint de inventario disponible
- Manejo de errores si no hay stock suficiente
- Transacción atómica (venta + movimientos)

---

### RN-011: Conteo Físico
**Prioridad: MEDIA**

El sistema debe facilitar conteos físicos de inventario permitiendo:
1. Registrar cantidad física contada
2. Comparar con cantidad en sistema
3. Generar ajustes automáticos por diferencias
4. Registrar motivo del ajuste

**Proceso:**
1. Usuario realiza conteo físico manual
2. Usuario ingresa cantidades contadas
3. Sistema compara: diferencia = cantidad_fisica - cantidad_sistema
4. Si diferencia > 0: crear ajuste_positivo
5. Si diferencia < 0: crear ajuste_negativo
6. Si diferencia = 0: no hacer nada

---

### RN-012: Operaciones Masivas - Importación
**Prioridad: MEDIA**

El sistema debe permitir importar productos desde archivo Excel con las siguientes características:

**Formato del Excel:**
- Primera fila: encabezados
- Columnas requeridas: nombre
- Columnas opcionales: codigo, codigo_barras, descripcion, proveedor_nombre, precio_compra, precio_venta, stock_minimo, stock_maximo, cantidad_inicial, ubicacion_nombre

**Proceso:**
1. Usuario sube archivo Excel
2. Sistema valida formato
3. Para cada fila:
   - Si código existe: actualizar producto
   - Si código no existe: crear nuevo producto
   - Si hay cantidad_inicial > 0: crear movimiento tipo 'compra'
4. Retornar resumen: X creados, Y actualizados, Z errores

**Manejo de errores:**
- Registrar fila con error
- Continuar con siguientes filas
- Retornar lista completa de errores al final

---

### RN-013: Operaciones Masivas - Actualización de Precios
**Prioridad: MEDIA**

Permitir actualizar precios de múltiples productos simultáneamente.

**Opciones de actualización:**
1. Por porcentaje: aumentar/disminuir X%
2. Por monto fijo: aumentar/disminuir $X

**Parámetros:**
- Lista de IDs de productos
- Tipo de incremento (porcentaje o fijo)
- Valor del incremento (puede ser negativo para decrementos)
- Aplicar a precio de compra (sí/no)
- Aplicar a precio de venta (sí/no)

**Validaciones:**
- No permitir decrementos que resulten en precios negativos
- Mostrar vista previa antes de confirmar (opcional)

---

### RN-014: Exportación de Datos
**Prioridad: BAJA**

Permitir exportar catálogo de productos y/o inventario a Excel.

**Opciones de exportación:**
- Productos: información básica, precios, proveedor
- Inventario: incluir cantidades por ubicación
- Valorización: incluir valor de compra y venta del inventario

**Filtros aplicables:**
- Por proveedor
- Por estado
- Por rango de fechas

---

### RN-015: Estados de Producto
**Prioridad: MEDIA**

Los productos pueden tener tres estados:
1. **Activo**: Producto disponible para venta
2. **Inactivo**: Producto temporalmente no disponible
3. **Descontinuado**: Producto que ya no se manejará

**Comportamiento:**
- Productos inactivos: no aparecen en listados del POS
- Productos descontinuados: no aparecen en listados del POS, solo en reportes históricos
- Cambio de estado no afecta inventario existente
- Movimientos históricos de productos descontinuados se mantienen

---

## FUNCIONALIDADES REQUERIDAS

### Gestión de Proveedores

#### FN-PRV-001: Listar Proveedores
**Descripción:** Obtener lista de proveedores con filtros opcionales.

**Filtros disponibles:**
- Por estado (activo/inactivo)
- Búsqueda por texto (nombre, contacto, email)
- Paginación (skip/limit)

**Ordenamiento:** Por nombre ascendente (default)

**Campos calculados:** 
- total_productos: cantidad de productos asociados

---

#### FN-PRV-002: Obtener Proveedor
**Descripción:** Obtener detalle completo de un proveedor específico.

**Incluye:**
- Información completa del proveedor
- Total de productos asociados

---

#### FN-PRV-003: Crear Proveedor
**Descripción:** Registrar nuevo proveedor en el sistema.

**Validaciones:**
- Nombre es requerido
- Email debe ser formato válido (si se proporciona)
- Teléfono debe ser formato válido (si se proporciona)

---

#### FN-PRV-004: Actualizar Proveedor
**Descripción:** Modificar información de proveedor existente.

**Validaciones:** Mismas que crear

---

#### FN-PRV-005: Eliminar Proveedor
**Descripción:** Eliminar proveedor del sistema.

**Validación crítica:** 
- NO permitir eliminación si tiene productos asociados
- Mostrar mensaje: "No se puede eliminar el proveedor porque tiene X productos asociados"

---

#### FN-PRV-006: Cambiar Estado Proveedor
**Descripción:** Activar o inactivar proveedor.

**Comportamiento:**
- Inactivar proveedor NO afecta sus productos
- Productos siguen activos y funcionales

---

#### FN-PRV-007: Listar Productos del Proveedor
**Descripción:** Obtener todos los productos de un proveedor específico.

**Ordenamiento:** Por nombre de producto

---

### Gestión de Productos

#### FN-PROD-001: Listar Productos
**Descripción:** Obtener lista de productos con filtros avanzados y paginación.

**Filtros disponibles:**
- Búsqueda por texto (nombre, código, código de barras, descripción)
- Por proveedor
- Por estado
- Stock bajo (stock_total < stock_minimo)
- Sin stock (stock_total = 0)
- Rango de precios (precio_min, precio_max)
- Próximo a vencer (días hasta vencimiento)

**Campos calculados:**
- stock_total: suma de todas las ubicaciones
- margen_ganancia: porcentaje de utilidad

**Ordenamiento:** Por nombre ascendente (default)

---

#### FN-PROD-002: Obtener Producto
**Descripción:** Obtener detalle completo de producto incluyendo desglose de inventario.

**Incluye:**
- Información completa del producto
- Información del proveedor (si tiene)
- Desglose de inventario por ubicación:
  - ID de ubicación
  - Nombre de ubicación
  - Cantidad en esa ubicación
- Stock total
- Margen de ganancia

---

#### FN-PROD-003: Crear Producto
**Descripción:** Registrar nuevo producto en el catálogo.

**Validaciones:**
- Nombre es requerido
- Código SKU único (si se proporciona)
- Código de barras único (si se proporciona)
- Precio de compra >= 0
- Precio de venta >= 0
- Precio de venta >= precio de compra (advertencia)
- Stock máximo >= stock mínimo (si ambos se proporcionan)
- Proveedor debe existir (si se proporciona proveedor_id)

---

#### FN-PROD-004: Actualizar Producto
**Descripción:** Modificar información de producto existente.

**Validaciones:** Mismas que crear

**Consideración:**
- Actualizar precios NO afecta movimientos históricos
- Nuevos movimientos usan nuevos precios

---

#### FN-PROD-005: Eliminar Producto
**Descripción:** Eliminar producto del sistema.

**Comportamiento:**
- Eliminación en CASCADE: elimina también inventario y movimientos
- Requiere confirmación del usuario
- No se puede recuperar después de eliminación

**Advertencia:** Considerar marcar como "descontinuado" en lugar de eliminar para mantener historial.

---

#### FN-PROD-006: Cambiar Estado Producto
**Descripción:** Cambiar estado entre activo/inactivo/descontinuado.

**Comportamiento:**
- No afecta inventario existente
- Productos inactivos/descontinuados no aparecen en POS

---

#### FN-PROD-007: Obtener Historial de Producto
**Descripción:** Ver todos los movimientos de inventario de un producto.

**Filtros:**
- Por tipo de movimiento
- Por rango de fechas
- Paginación

**Ordenamiento:** Por fecha de movimiento descendente (más recientes primero)

---

#### FN-PROD-008: Productos con Stock Bajo
**Descripción:** Listar productos donde stock_total < stock_minimo.

**Criterios:**
- Solo productos con stock_minimo > 0
- Solo productos activos
- Incluir desglose por ubicación

---

#### FN-PROD-009: Productos Sin Stock
**Descripción:** Listar productos con stock_total = 0.

**Criterios:**
- Solo productos activos
- Ordenar por nombre

---

#### FN-PROD-010: Productos Próximos a Vencer
**Descripción:** Listar productos que vencen en los próximos X días.

**Parámetros:**
- días: cantidad de días a futuro (default: 30)

**Criterios:**
- Solo productos con fecha_vencimiento configurada
- fecha_vencimiento <= fecha_actual + días
- fecha_vencimiento >= fecha_actual (no mostrar ya vencidos)

---

#### FN-PROD-011: Importar Productos desde Excel
**Descripción:** Carga masiva de productos desde archivo Excel.

**Formato requerido:**
- Archivo: .xlsx o .xls
- Primera fila: encabezados
- Columnas: codigo, codigo_barras, nombre, descripcion, proveedor_nombre, precio_compra, precio_venta, stock_minimo, stock_maximo, cantidad_inicial, ubicacion_nombre

**Proceso:**
1. Validar formato de archivo
2. Procesar cada fila:
   - Buscar proveedor por nombre (crear si no existe - opcional)
   - Si código existe: actualizar producto
   - Si código no existe: crear producto
   - Si cantidad_inicial > 0: crear movimiento de compra
3. Retornar resumen:
   - Productos creados: X
   - Productos actualizados: Y
   - Errores: lista con número de fila y descripción

**Manejo de errores:**
- No detener proceso por un error
- Continuar con siguientes filas
- Registrar todos los errores

---

### Gestión de Ubicaciones

#### FN-UBI-001: Listar Ubicaciones
**Descripción:** Obtener lista de ubicaciones de inventario.

**Filtros:**
- Por tipo (bodega/vitrina/otro)
- Por estado (activo/inactivo)

**Campos calculados:**
- total_productos: cantidad de productos distintos en la ubicación
- valor_total: suma de (cantidad * precio_venta) de todos los productos

---

#### FN-UBI-002: Obtener Ubicación
**Descripción:** Detalle de una ubicación específica.

**Incluye:**
- Información completa de la ubicación
- Estadísticas calculadas

---

#### FN-UBI-003: Crear Ubicación
**Descripción:** Registrar nueva ubicación de inventario.

**Validaciones:**
- Nombre único
- Solo una ubicación puede ser principal (es_principal=true)

---

#### FN-UBI-004: Actualizar Ubicación
**Descripción:** Modificar información de ubicación.

**Validaciones:** Mismas que crear

**Restricción:** No permitir cambiar nombre si afecta referencias

---

#### FN-UBI-005: Listar Inventario de Ubicación
**Descripción:** Ver todos los productos con su stock en una ubicación específica.

**Incluye por cada producto:**
- Información del producto
- Cantidad en esa ubicación
- Precio de venta
- Valor total (cantidad * precio_venta)

**Ordenamiento:** Por nombre de producto

---

### Gestión de Inventario

#### FN-INV-001: Listar Inventario Completo
**Descripción:** Ver inventario de todos los productos en todas las ubicaciones.

**Filtros:**
- Por producto
- Por ubicación
- Paginación

**Vista:** Incluir información de producto y ubicación en cada registro

---

#### FN-INV-002: Ajustar Inventario Manualmente
**Descripción:** Corregir cantidad de inventario de un producto en una ubicación.

**Parámetros:**
- producto_id
- ubicacion_id
- cantidad_nueva: cantidad final deseada
- motivo: justificación del ajuste (requerido)

**Proceso:**
1. Obtener cantidad actual en sistema
2. Calcular diferencia = cantidad_nueva - cantidad_actual
3. Si diferencia > 0: crear movimiento ajuste_positivo
4. Si diferencia < 0: crear movimiento ajuste_negativo  
5. Si diferencia = 0: no hacer nada, retornar mensaje informativo

**Registro:** Guardar usuario_id y motivo para auditoría

---

#### FN-INV-003: Transferir entre Ubicaciones
**Descripción:** Mover productos de una ubicación a otra.

**Parámetros:**
- producto_id
- ubicacion_origen_id
- ubicacion_destino_id
- cantidad
- motivo (opcional)

**Validaciones:**
- Ubicación origen ≠ ubicación destino
- Stock suficiente en origen
- Cantidad > 0

**Proceso:**
1. Validar stock en origen
2. Crear movimiento tipo 'transferencia'
3. Trigger actualiza ambas ubicaciones automáticamente

---

#### FN-INV-004: Conteo Físico Masivo
**Descripción:** Registrar resultado de conteo físico para múltiples productos.

**Parámetros:**
- Lista de conteos: [{producto_id, ubicacion_id, cantidad_fisica}]
- motivo: "Inventario físico" (default)

**Proceso:**
1. Para cada conteo en la lista:
   - Obtener cantidad en sistema
   - Calcular diferencia
   - Crear ajuste si hay diferencia
2. Retornar resumen:
   - Productos procesados: X
   - Ajustes realizados: Y
   - Sin cambios: Z

---

#### FN-INV-005: Importar Conteo Físico desde Excel
**Descripción:** Facilitar conteo físico mediante importación de archivo Excel.

**Formato:**
- Columnas: codigo_producto, ubicacion_nombre, cantidad_fisica
- Primera fila: encabezados

**Proceso:** Similar a conteo masivo, pero leyendo desde Excel

---

### Gestión de Movimientos

#### FN-MOV-001: Listar Movimientos
**Descripción:** Ver historial de movimientos de inventario con filtros.

**Filtros:**
- Por producto
- Por tipo de movimiento
- Por ubicación origen
- Por ubicación destino
- Por usuario que ejecutó
- Por rango de fechas
- Por referencia (número de factura, orden, etc.)
- Paginación

**Ordenamiento:** Por fecha descendente (más recientes primero)

**Vista:** Incluir información de producto, ubicaciones, y usuario

---

#### FN-MOV-002: Obtener Movimiento
**Descripción:** Ver detalle completo de un movimiento específico.

**Incluye:**
- Toda la información del movimiento
- Información del producto
- Información de ubicaciones (si aplican)
- Información del usuario que ejecutó
- Información de venta asociada (si aplica)

---

#### FN-MOV-003: Registrar Movimiento Manual
**Descripción:** Crear movimientos no automáticos (compra, uso interno, merma, etc.)

**Parámetros:**
- producto_id
- tipo_movimiento
- cantidad
- ubicacion_origen_id (según tipo)
- ubicacion_destino_id (según tipo)
- costo_unitario (opcional)
- costo_total (opcional)
- motivo (opcional)
- referencia (opcional)

**Validaciones:**
- Tipo de movimiento válido
- Ubicaciones requeridas según tipo
- Stock suficiente si es decremento
- Cantidad > 0

**Nota:** Usuario se obtiene automáticamente del token JWT

---

#### FN-MOV-004: Registrar Compra
**Descripción:** Endpoint específico y simplificado para registrar compras.

**Parámetros:**
- producto_id
- cantidad
- ubicacion_destino_id: donde ingresa (generalmente Bodega)
- costo_unitario
- referencia: número de factura (opcional)
- motivo (opcional)

**Proceso:**
1. Validar parámetros
2. Calcular costo_total = cantidad * costo_unitario
3. Crear movimiento tipo 'compra'
4. Actualizar inventario automáticamente

---

#### FN-MOV-005: Anular Movimiento
**Descripción:** Revertir un movimiento creando movimiento inverso.

**Parámetros:**
- movimiento_id
- motivo: justificación de la anulación (requerido)

**Proceso:**
1. Obtener movimiento original
2. Validar que puede anularse (no todas las operaciones son reversibles)
3. Crear movimiento inverso:
   - tipo_movimiento: opuesto al original
   - cantidad: misma cantidad
   - ubicaciones: invertidas
4. Marcar movimiento original como anulado (agregar en motivo)

**Restricciones:**
- No se pueden anular movimientos de venta (deben anularse desde POS)
- No se pueden anular movimientos ya anulados

---

### Operaciones Masivas

#### FN-MAS-001: Actualizar Precios Masivamente
**Descripción:** Actualizar precios de múltiples productos en una sola operación.

**Parámetros:**
- productos_ids: lista de IDs
- incremento_porcentaje: % a aumentar/disminuir (opcional)
- incremento_fijo: monto fijo a aumentar/disminuir (opcional)
- aplicar_a_compra: boolean
- aplicar_a_venta: boolean

**Validaciones:**
- Debe proporcionar incremento_porcentaje O incremento_fijo (al menos uno)
- Al menos uno de aplicar_a_compra o aplicar_a_venta debe ser true
- No permitir decrementos que resulten en precios negativos

**Proceso:**
1. Para cada producto en la lista:
   - Calcular nuevo precio_compra (si aplicar_a_compra)
   - Calcular nuevo precio_venta (si aplicar_a_venta)
   - Validar precios >= 0
   - Actualizar producto
2. Retornar resumen:
   - Productos actualizados: X
   - Errores: lista con ID y descripción

---

#### FN-MAS-002: Exportar Catálogo a Excel
**Descripción:** Generar archivo Excel con catálogo de productos e inventario.

**Opciones:**
- incluir_inventario: boolean (incluir columnas de stock por ubicación)
- incluir_precios: boolean (incluir precios de compra y venta)
- estado: filtrar por estado (opcional)
- proveedor_id: filtrar por proveedor (opcional)

**Columnas del Excel:**
- Básicas: codigo, codigo_barras, nombre, descripcion, estado
- Proveedor: proveedor_nombre (si tiene)
- Precios (si incluir_precios): precio_compra, precio_venta, margen_ganancia
- Inventario (si incluir_inventario): stock_bodega, stock_vitrina, stock_total
- Alertas: stock_minimo, alerta_stock_bajo

**Formato:** Archivo .xlsx con formato profesional (encabezados en negrita, columnas autoajustadas)

---

## ENDPOINTS DE API

### Resumen de Endpoints

| Módulo | Endpoints |
|--------|-----------|
| Proveedores | 7 |
| Productos | 11 |
| Ubicaciones | 5 |
| Inventario | 5 |
| Movimientos | 5 |
| Operaciones Masivas | 2 |
| Reportes | 3 |
| **TOTAL** | **28** |

### Proveedores (7 endpoints)

```
GET    /api/productos/proveedores
GET    /api/productos/proveedores/{id}
POST   /api/productos/proveedores
PUT    /api/productos/proveedores/{id}
DELETE /api/productos/proveedores/{id}
PUT    /api/productos/proveedores/{id}/estado
GET    /api/productos/proveedores/{id}/productos
```

### Productos (11 endpoints)

```
GET    /api/productos
GET    /api/productos/{id}
POST   /api/productos
PUT    /api/productos/{id}
DELETE /api/productos/{id}
PUT    /api/productos/{id}/estado
GET    /api/productos/{id}/movimientos
GET    /api/productos/alertas/stock-bajo
GET    /api/productos/alertas/sin-stock
GET    /api/productos/alertas/vencimiento-proximo
POST   /api/productos/importar
```

### Ubicaciones (5 endpoints)

```
GET    /api/inventario/ubicaciones
GET    /api/inventario/ubicaciones/{id}
POST   /api/inventario/ubicaciones
PUT    /api/inventario/ubicaciones/{id}
GET    /api/inventario/ubicaciones/{id}/productos
```

### Inventario (5 endpoints)

```
GET    /api/inventario
POST   /api/inventario/ajustar
POST   /api/inventario/transferir
POST   /api/inventario/conteo-fisico
POST   /api/inventario/importar-conteo
```

### Movimientos (5 endpoints)

```
GET    /api/inventario/movimientos
GET    /api/inventario/movimientos/{id}
POST   /api/inventario/movimientos
POST   /api/inventario/movimientos/compra
DELETE /api/inventario/movimientos/{id}
```

### Operaciones Masivas (2 endpoints)

```
POST   /api/productos/actualizar-precios-masivo
GET    /api/productos/exportar
```

### Reportes (3 endpoints)

```
GET    /api/inventario/reportes/ventas-productos
GET    /api/inventario/reportes/productos-por-especialista
GET    /api/inventario/reportes/resumen-inventario
```

---

## VALIDACIONES

### Validaciones de Productos

1. **Código SKU**
   - Opcional
   - Máximo 50 caracteres
   - Único en el sistema
   - Alfanumérico, puede incluir guiones y guiones bajos

2. **Código de Barras**
   - Opcional
   - Máximo 100 caracteres
   - Único en el sistema
   - Numérico principalmente

3. **Nombre**
   - Requerido
   - Mínimo 2 caracteres
   - Máximo 200 caracteres

4. **Precios**
   - Ambos >= 0
   - Decimal con máximo 2 decimales
   - Precio venta >= precio compra (advertencia, no bloquea)

5. **Stock Mínimo/Máximo**
   - Enteros >= 0
   - Si ambos se proporcionan: máximo >= mínimo

6. **Fecha de Vencimiento**
   - Opcional
   - Debe ser fecha futura (advertencia si es pasada)

7. **Email de Proveedor**
   - Formato válido de email
   - Ejemplo: usuario@dominio.com

8. **Teléfono de Proveedor**
   - Formato numérico con posibles espacios, guiones, paréntesis
   - Ejemplo: +57 300 123 4567

### Validaciones de Movimientos

1. **Cantidad**
   - Siempre > 0
   - Entero positivo

2. **Ubicaciones**
   - Según tipo de movimiento, validar que se proporcionen las ubicaciones necesarias
   - Para transferencias: origen ≠ destino

3. **Stock Suficiente**
   - Para movimientos que decrementan, validar stock >= cantidad

4. **Referencia**
   - Opcional
   - Máximo 100 caracteres

5. **Motivo**
   - Para ajustes: requerido, mínimo 5 caracteres
   - Para otros: opcional

### Validaciones de Importación

1. **Formato de Archivo**
   - Solo .xlsx o .xls
   - Primera fila debe contener encabezados
   - Al menos columna "nombre" debe existir

2. **Filas**
   - Ignorar filas vacías
   - Validar cada campo según reglas de producto
   - Registrar errores pero continuar proceso

---

## INTEGRACIÓN CON OTROS MÓDULOS

### Integración con Punto de Venta (POS)

**Dependencia:** CRÍTICA

**Flujo de Integración:**

1. **Al registrar venta con productos:**
   ```
   POS → Crear Venta
   POS → Para cada producto vendido:
       - Llamar endpoint de inventario para crear movimiento
       - tipo_movimiento: 'venta'
       - ubicacion_origen_id: ID de Vitrina
       - venta_id: ID de la venta recién creada
       - cantidad: cantidad vendida
       - costo_unitario: precio_compra del producto
   ```

2. **Validación de stock antes de vender:**
   ```
   POS → Antes de confirmar venta
   POS → Para cada producto:
       - Consultar inventario en Vitrina
       - Si stock < cantidad_deseada:
           * Mostrar alerta: "Stock insuficiente en Vitrina"
           * Permitir o bloquear venta según configuración
   ```

3. **Manejo de errores:**
   - Si falla creación de movimiento, hacer rollback de venta
   - Transacción atómica: venta + movimientos o nada

**Endpoints requeridos por POS:**
- `GET /api/inventario?producto_id=X&ubicacion_id=2` (consultar stock Vitrina)
- `POST /api/inventario/movimientos` (crear movimiento de venta)

---

### Integración con Nómina

**Dependencia:** ALTA

**Propósito:** Calcular comisiones por venta de productos.

**Flujo:**
```
Nómina → Al calcular pago de especialista
Nómina → Consultar reporte de productos vendidos por especialista
         en el período (fecha_desde, fecha_hasta)
Nómina → Calcular comisión según configuración
```

**Endpoint requerido:**
- `GET /api/inventario/reportes/productos-por-especialista`

**Datos proporcionados:**
- Especialista ID y nombre
- Producto vendido
- Cantidad vendida
- Monto total de ventas de ese producto

---

### Integración con Reportes

**Dependencia:** MEDIA

**Reportes que consumen datos de inventario:**
1. Análisis de rentabilidad por producto
2. Productos más vendidos
3. Valorización de inventario
4. Comparativos de períodos

**Endpoints disponibles:**
- `GET /api/inventario/reportes/ventas-productos`
- `GET /api/inventario/reportes/resumen-inventario`

---

## SEGURIDAD Y PERMISOS

### Permisos Requeridos

#### Productos

| Permiso | Descripción | Endpoints Afectados |
|---------|-------------|---------------------|
| `productos.ver` | Ver catálogo de productos | Todos los GET de productos |
| `productos.crear` | Crear productos | POST productos, POST importar |
| `productos.editar` | Editar productos | PUT productos, POST actualizar-precios-masivo |
| `productos.eliminar` | Eliminar productos | DELETE productos |

#### Inventario

| Permiso | Descripción | Endpoints Afectados |
|---------|-------------|---------------------|
| `inventario.ver` | Ver inventario | Todos los GET de inventario |
| `inventario.ajustar` | Ajustar cantidades | POST ajustar, POST conteo-fisico |
| `inventario.transferir` | Transferir entre ubicaciones | POST transferir |
| `inventario.movimiento` | Registrar movimientos | POST movimientos |
| `inventario.comprar` | Registrar compras | POST compra |
| `inventario.anular` | Anular movimientos | DELETE movimientos |
| `inventario.configurar` | Configurar ubicaciones | POST/PUT ubicaciones |

#### Reportes

| Permiso | Descripción | Endpoints Afectados |
|---------|-------------|---------------------|
| `reportes.ver` | Ver reportes | Todos los GET de reportes |

### Recomendaciones de Asignación

**Administrador:**
- Todos los permisos

**Gerente:**
- productos.ver, productos.crear, productos.editar
- inventario.ver, inventario.ajustar, inventario.transferir, inventario.comprar
- reportes.ver

**Especialista:**
- Solo acceso desde POS (no acceso directo a inventario)

**Recepcionista:**
- productos.ver
- inventario.ver

---

## REPORTES

### REP-001: Ventas de Productos por Período

**Propósito:** Analizar qué productos se vendieron en un período y su rentabilidad.

**Parámetros:**
- fecha_desde (requerido)
- fecha_hasta (requerido)
- producto_id (opcional, filtrar por producto específico)
- limit (opcional, default 50)

**Información incluida por cada producto:**
- ID y nombre del producto
- Código del producto
- Cantidad vendida
- Monto total de ventas (cantidad * precio_venta)
- Utilidad total (cantidad * (precio_venta - precio_compra))

**Ordenamiento:** Por cantidad vendida descendente

**Caso de uso:** Identificar productos más vendidos, calcular rentabilidad.

---

### REP-002: Productos Vendidos por Especialista

**Propósito:** Saber qué productos vendió cada especialista para calcular comisiones.

**Parámetros:**
- fecha_desde (requerido)
- fecha_hasta (requerido)
- especialista_id (opcional, filtrar por especialista específico)

**Información incluida:**
- ID y nombre del especialista
- ID y nombre del producto
- Cantidad vendida por ese especialista
- Monto total generado

**Agrupación:** Por especialista y producto

**Caso de uso:** Cálculo de comisiones, análisis de desempeño.

---

### REP-003: Resumen de Inventario

**Propósito:** Vista consolidada del inventario por ubicación.

**Parámetros:**
- ubicacion_id (opcional, filtrar por ubicación específica)

**Información por ubicación:**
- ID y nombre de ubicación
- Total de productos distintos
- Total de unidades (suma de cantidades)
- Valor al costo (suma de cantidad * precio_compra)
- Valor al precio de venta (suma de cantidad * precio_venta)
- Cantidad de productos con stock bajo
- Cantidad de productos sin stock

**Caso de uso:** Valorización de inventario, toma de decisiones de compra.

---

## CONSIDERACIONES TÉCNICAS

### Performance

1. **Índices de Base de Datos**
   - Índices en campos de búsqueda frecuente (nombre, código, código_barras)
   - Índices en claves foráneas
   - Índices en campos de filtro (estado, fecha_movimiento)

2. **Consultas Optimizadas**
   - Uso de JOIN en lugar de consultas múltiples
   - Paginación obligatoria en listados grandes
   - Límites de registros en reportes

3. **Caching**
   - Cache de catálogo de productos (TTL: 5 minutos)
   - Cache de ubicaciones (TTL: 1 hora)
   - NO cachear inventario (datos muy dinámicos)

### Escalabilidad

1. **Triggers vs Lógica de Aplicación**
   - Triggers para actualizar inventario (garantiza consistencia)
   - Lógica de aplicación para validaciones complejas

2. **Transacciones**
   - Operaciones de inventario en transacciones atómicas
   - Rollback automático en caso de error

3. **Archivos Grandes**
   - Importación de Excel: procesar en chunks de 100 filas
   - Exportación: streaming de datos en lugar de cargar todo en memoria

### Manejo de Errores

1. **Códigos HTTP**
   - 200: Éxito
   - 201: Recurso creado
   - 400: Error de validación
   - 404: Recurso no encontrado
   - 409: Conflicto (código duplicado, stock insuficiente)
   - 500: Error del servidor

2. **Mensajes de Error**
   - Descriptivos y en español
   - Incluir campo o parámetro que causó el error
   - No exponer detalles técnicos al usuario

3. **Logging**
   - Registrar todos los movimientos de inventario
   - Log de cambios en productos
   - Log de errores con stack trace

### Auditabilidad

1. **Campos de Auditoría**
   - fecha_creacion en todas las tablas
   - fecha_actualizacion en tablas mutables
   - usuario_id en movimientos

2. **Historial Inmutable**
   - Movimientos nunca se eliminan
   - Cambios en productos no afectan movimientos históricos

3. **Trazabilidad**
   - Cada movimiento registra usuario responsable
   - Cada ajuste requiere motivo
   - Referencia a documentos externos (facturas, órdenes)

---

## ANEXOS

### Anexo A: Ejemplo de Flujo Completo

**Escenario:** Compra de producto nuevo, transferencia a vitrina, y venta

```
1. CREAR PRODUCTO
   POST /api/productos
   {
     "codigo": "SH-KER-500",
     "nombre": "Shampoo Keratina 500ml",
     "precio_compra": 25.00,
     "precio_venta": 45.00,
     "stock_minimo": 5,
     "proveedor_id": 1
   }
   → Producto creado con ID: 1

2. REGISTRAR COMPRA
   POST /api/inventario/movimientos/compra
   {
     "producto_id": 1,
     "cantidad": 20,
     "ubicacion_destino_id": 1,  // Bodega
     "costo_unitario": 25.00,
     "referencia": "FACT-001"
   }
   → Movimiento creado
   → Inventario en Bodega: 20 unidades

3. TRANSFERIR A VITRINA
   POST /api/inventario/transferir
   {
     "producto_id": 1,
     "ubicacion_origen_id": 1,  // Bodega
     "ubicacion_destino_id": 2,  // Vitrina
     "cantidad": 10,
     "motivo": "Surtir vitrina"
   }
   → Transferencia realizada
   → Inventario en Bodega: 10 unidades
   → Inventario en Vitrina: 10 unidades

4. VENTA (desde POS, automático)
   POS registra venta → Automáticamente:
   POST /api/inventario/movimientos
   {
     "producto_id": 1,
     "tipo_movimiento": "venta",
     "cantidad": 2,
     "ubicacion_origen_id": 2,  // Vitrina
     "venta_id": 100,
     "costo_unitario": 25.00
   }
   → Venta registrada
   → Inventario en Vitrina: 8 unidades
```

### Anexo B: Formato de Excel para Importación

**Productos:**
| codigo | codigo_barras | nombre | descripcion | proveedor_nombre | precio_compra | precio_venta | stock_minimo | stock_maximo | cantidad_inicial | ubicacion_nombre |
|--------|---------------|--------|-------------|------------------|---------------|--------------|--------------|--------------|------------------|------------------|
| SH-KER-500 | 7501234567890 | Shampoo Keratina 500ml | Shampoo profesional... | Proveedor A | 25.00 | 45.00 | 5 | 50 | 20 | Bodega |

**Conteo Físico:**
| codigo_producto | ubicacion_nombre | cantidad_fisica |
|-----------------|------------------|-----------------|
| SH-KER-500 | Bodega | 18 |
| SH-KER-500 | Vitrina | 7 |

---

## CONCLUSIÓN

Este documento define completamente los requerimientos para el módulo de Productos e Inventario del sistema Club de Alisados. 

**Próximos pasos sugeridos:**
1. Revisión y aprobación de requerimientos
2. Creación de documentación frontend
3. Implementación de modelos y tablas de base de datos
4. Desarrollo de servicios de backend
5. Implementación de endpoints API
6. Pruebas unitarias e integración
7. Documentación de API (Swagger)

**Estimación de desarrollo:** 2-3 semanas

**Dependencias críticas:**
- Módulo de autenticación (completado)
- Módulo de usuarios y permisos (completado)
- Integración con POS (planificado)

