# Requerimientos Frontend - Módulo de Productos e Inventario
## Club de Alisados - Next.js 14+ con TypeScript

---

## ÍNDICE

1. [Resumen Ejecutivo](#resumen-ejecutivo)
2. [Arquitectura de Componentes](#arquitectura-de-componentes)
3. [Interfaces TypeScript](#interfaces-typescript)
4. [Schemas de Validación Zod](#schemas-de-validacion-zod)
5. [Componentes Detallados](#componentes-detallados)
6. [Gestión de Estado](#gestion-de-estado)
7. [Integración con API](#integracion-con-api)
8. [Flujos de Usuario](#flujos-de-usuario)
9. [Responsive Design](#responsive-design)
10. [Accesibilidad](#accesibilidad)
11. [Pruebas](#pruebas)

---

## RESUMEN EJECUTIVO

### Propósito
Desarrollar una interfaz completa para la gestión de productos, proveedores, control de inventario multi-ubicación, movimientos de stock y reportes de análisis para el sistema Club de Alisados.

### Alcance del Módulo
- **Gestión de Proveedores**: CRUD completo de proveedores de productos
- **Gestión de Productos**: Catálogo completo con precios, códigos y gestión de imágenes
- **Control de Inventario**: Visualización de stock por ubicación (Bodega y Vitrina)
- **Movimientos de Inventario**: Registro y seguimiento de todos los movimientos
- **Operaciones de Inventario**: Compras, transferencias, ajustes y conteos físicos
- **Importación Masiva**: Carga de productos desde Excel
- **Reportes**: Ventas, comisiones y valorización de inventario

### Stack Tecnológico
- **Framework**: Next.js 14+ con App Router
- **Lenguaje**: TypeScript 5+
- **Componentes**: shadcn/ui + Radix UI
- **Estilos**: Tailwind CSS
- **Formularios**: React Hook Form + Zod
- **Estado**: Zustand
- **API**: React Query (TanStack Query)
- **Tablas**: TanStack Table
- **Gráficos**: Recharts
- **Archivos**: react-dropzone, xlsx
- **Iconos**: Lucide React

### Estadísticas del Módulo

| Componente | Cantidad |
|-----------|----------|
| Páginas Principales | 6 |
| Componentes UI | 42+ |
| Interfaces TypeScript | 18 |
| Schemas Zod | 12 |
| API Hooks | 28 |
| Stores Zustand | 3 |

---

## ARQUITECTURA DE COMPONENTES

### Estructura de Directorios

```
src/app/
├── (dashboard)/
│   ├── inventario/
│   │   ├── page.tsx                    # Vista principal de inventario
│   │   ├── productos/
│   │   │   ├── page.tsx                # Lista de productos
│   │   │   ├── [id]/
│   │   │   │   ├── page.tsx            # Detalle de producto
│   │   │   │   └── editar/
│   │   │   │       └── page.tsx        # Editar producto
│   │   │   ├── nuevo/
│   │   │   │   └── page.tsx            # Crear producto
│   │   │   └── importar/
│   │   │       └── page.tsx            # Importar productos desde Excel
│   │   ├── proveedores/
│   │   │   ├── page.tsx                # Lista de proveedores
│   │   │   ├── nuevo/
│   │   │   │   └── page.tsx            # Crear proveedor
│   │   │   └── [id]/
│   │   │       ├── page.tsx            # Detalle de proveedor
│   │   │       └── editar/
│   │   │           └── page.tsx        # Editar proveedor
│   │   ├── movimientos/
│   │   │   ├── page.tsx                # Historial de movimientos
│   │   │   ├── compra/
│   │   │   │   └── page.tsx            # Registrar compra
│   │   │   ├── transferencia/
│   │   │   │   └── page.tsx            # Transferir entre ubicaciones
│   │   │   ├── ajuste/
│   │   │   │   └── page.tsx            # Ajustar inventario
│   │   │   └── conteo/
│   │   │       └── page.tsx            # Conteo físico
│   │   └── reportes/
│   │       ├── page.tsx                # Dashboard de reportes
│   │       ├── ventas/
│   │       │   └── page.tsx            # Reporte de ventas
│   │       ├── comisiones/
│   │       │   └── page.tsx            # Productos por especialista
│   │       └── valoracion/
│   │           └── page.tsx            # Valorización de inventario

src/components/
├── inventario/
│   ├── proveedores/
│   │   ├── ProveedorForm.tsx           # Formulario de proveedor
│   │   ├── ProveedorCard.tsx           # Tarjeta de proveedor
│   │   ├── ProveedorList.tsx           # Lista de proveedores
│   │   ├── ProveedorFilters.tsx        # Filtros de búsqueda
│   │   └── ProveedorDeleteDialog.tsx   # Diálogo de eliminación
│   ├── productos/
│   │   ├── ProductoForm.tsx            # Formulario de producto
│   │   ├── ProductoCard.tsx            # Tarjeta de producto con stock
│   │   ├── ProductoGrid.tsx            # Grid de productos
│   │   ├── ProductoTable.tsx           # Tabla de productos (TanStack)
│   │   ├── ProductoFilters.tsx         # Filtros avanzados
│   │   ├── ProductoImageUpload.tsx     # Carga de imagen
│   │   ├── ProductoStockBadge.tsx      # Indicador de stock
│   │   ├── ProductoDeleteDialog.tsx    # Diálogo de eliminación
│   │   ├── ProductoImportDialog.tsx    # Importación desde Excel
│   │   ├── ProductoBulkPriceUpdate.tsx # Actualización masiva de precios
│   │   └── ProductoQuickView.tsx       # Vista rápida modal
│   ├── inventario/
│   │   ├── InventarioCard.tsx          # Tarjeta de stock por ubicación
│   │   ├── InventarioChart.tsx         # Gráfico de inventario
│   │   ├── InventarioAlerts.tsx        # Alertas de stock bajo
│   │   ├── UbicacionSelector.tsx       # Selector de ubicación
│   │   └── StockHistory.tsx            # Historial de stock
│   ├── movimientos/
│   │   ├── MovimientoForm.tsx          # Formulario de movimiento
│   │   ├── MovimientoTable.tsx         # Tabla de movimientos
│   │   ├── MovimientoFilters.tsx       # Filtros de movimientos
│   │   ├── MovimientoDetail.tsx        # Detalle de movimiento
│   │   ├── MovimientoTypeBadge.tsx     # Badge de tipo de movimiento
│   │   ├── CompraForm.tsx              # Formulario de compra
│   │   ├── TransferenciaForm.tsx       # Formulario de transferencia
│   │   ├── AjusteForm.tsx              # Formulario de ajuste
│   │   ├── ConteoFisicoForm.tsx        # Formulario de conteo físico
│   │   └── MovimientoAnularDialog.tsx  # Diálogo para anular
│   └── reportes/
│       ├── ReporteDashboard.tsx        # Dashboard principal
│       ├── VentasProductosReport.tsx   # Reporte de ventas
│       ├── ComisionesReport.tsx        # Reporte de comisiones
│       ├── ValoracionReport.tsx        # Reporte de valorización
│       ├── ReporteFilters.tsx          # Filtros de reportes
│       └── ReporteExport.tsx           # Exportar a Excel/PDF

src/lib/
├── stores/
│   ├── useProveedorStore.ts            # Estado global de proveedores
│   ├── useProductoStore.ts             # Estado global de productos
│   └── useInventarioStore.ts           # Estado global de inventario
├── api/
│   ├── proveedores.ts                  # Hooks de React Query para proveedores
│   ├── productos.ts                    # Hooks de React Query para productos
│   ├── inventario.ts                   # Hooks de React Query para inventario
│   ├── movimientos.ts                  # Hooks de React Query para movimientos
│   └── reportes-inventario.ts          # Hooks de React Query para reportes
├── validations/
│   ├── proveedor.schema.ts             # Esquemas Zod de proveedores
│   ├── producto.schema.ts              # Esquemas Zod de productos
│   ├── movimiento.schema.ts            # Esquemas Zod de movimientos
│   └── operaciones.schema.ts           # Esquemas Zod de operaciones
└── utils/
    ├── inventory-helpers.ts            # Helpers de cálculos de inventario
    ├── movement-helpers.ts             # Helpers de movimientos
    └── excel-helpers.ts                # Helpers de importación/exportación
```

---

## INTERFACES TYPESCRIPT

### Interfaces de Proveedor

```typescript
// src/types/proveedor.ts

export enum EstadoProveedor {
  ACTIVO = 'activo',
  INACTIVO = 'inactivo'
}

export interface Proveedor {
  id: number;
  nombre: string;
  contacto: string | null;
  telefono: string | null;
  email: string | null;
  direccion: string | null;
  notas: string | null;
  estado: EstadoProveedor;
  fecha_creacion: string;
  fecha_actualizacion: string;
  
  // Campos calculados
  total_productos?: number;
}

export interface ProveedorCreate {
  nombre: string;
  contacto?: string;
  telefono?: string;
  email?: string;
  direccion?: string;
  notas?: string;
  estado: EstadoProveedor;
}

export interface ProveedorUpdate {
  nombre?: string;
  contacto?: string;
  telefono?: string;
  email?: string;
  direccion?: string;
  notas?: string;
  estado?: EstadoProveedor;
}

export interface ProveedorFilters {
  search?: string;
  estado?: EstadoProveedor;
  page?: number;
  page_size?: number;
}

export interface ProveedorListResponse {
  items: Proveedor[];
  total: number;
  page: number;
  page_size: number;
  pages: number;
}
```

### Interfaces de Producto

```typescript
// src/types/producto.ts

export enum EstadoProducto {
  ACTIVO = 'activo',
  INACTIVO = 'inactivo',
  DESCONTINUADO = 'descontinuado'
}

export interface Producto {
  id: number;
  nombre: string;
  codigo: string | null;
  codigo_barras: string | null;
  descripcion: string | null;
  precio_compra: number;
  precio_venta: number;
  proveedor_id: number | null;
  stock_minimo: number;
  stock_maximo: number | null;
  fecha_vencimiento: string | null;
  lote: string | null;
  imagen_url: string | null;
  estado: EstadoProducto;
  fecha_creacion: string;
  fecha_actualizacion: string;
  
  // Relaciones
  proveedor?: Proveedor;
  
  // Campos calculados
  stock_total: number;
  margen_ganancia: number;
  stock_bodega?: number;
  stock_vitrina?: number;
  necesita_reposicion?: boolean;
}

export interface ProductoCreate {
  nombre: string;
  codigo?: string;
  codigo_barras?: string;
  descripcion?: string;
  precio_compra: number;
  precio_venta: number;
  proveedor_id?: number;
  stock_minimo?: number;
  stock_maximo?: number;
  fecha_vencimiento?: string;
  lote?: string;
  imagen_url?: string;
  estado: EstadoProducto;
}

export interface ProductoUpdate {
  nombre?: string;
  codigo?: string;
  codigo_barras?: string;
  descripcion?: string;
  precio_compra?: number;
  precio_venta?: number;
  proveedor_id?: number;
  stock_minimo?: number;
  stock_maximo?: number;
  fecha_vencimiento?: string;
  lote?: string;
  imagen_url?: string;
  estado?: EstadoProducto;
}

export interface ProductoFilters {
  search?: string;
  estado?: EstadoProducto;
  proveedor_id?: number;
  stock_bajo?: boolean;
  sin_stock?: boolean;
  page?: number;
  page_size?: number;
}

export interface ProductoListResponse {
  items: Producto[];
  total: number;
  page: number;
  page_size: number;
  pages: number;
}

export interface BulkPriceUpdate {
  producto_ids: number[];
  tipo_ajuste: 'porcentaje' | 'fijo';
  valor: number;
  campo: 'precio_compra' | 'precio_venta';
}

export interface ProductoImportRow {
  nombre: string;
  codigo?: string;
  codigo_barras?: string;
  descripcion?: string;
  precio_compra: number;
  precio_venta: number;
  proveedor_nombre?: string;
  stock_minimo?: number;
  stock_maximo?: number;
  stock_inicial_bodega?: number;
  stock_inicial_vitrina?: number;
}
```

### Interfaces de Inventario y Ubicación

```typescript
// src/types/inventario.ts

export interface UbicacionInventario {
  id: number;
  nombre: string;
  descripcion: string | null;
  tipo: 'bodega' | 'vitrina' | 'otro';
  estado: 'activo' | 'inactivo';
  fecha_creacion: string;
  fecha_actualizacion: string;
}

export interface Inventario {
  id: number;
  producto_id: number;
  ubicacion_id: number;
  cantidad: number;
  fecha_actualizacion: string;
  
  // Relaciones
  producto?: Producto;
  ubicacion?: UbicacionInventario;
}

export interface InventarioDetalle {
  producto: Producto;
  ubicaciones: {
    ubicacion_id: number;
    ubicacion_nombre: string;
    cantidad: number;
  }[];
  stock_total: number;
}

export interface InventarioFilters {
  producto_id?: number;
  ubicacion_id?: number;
  stock_bajo?: boolean;
  sin_stock?: boolean;
  page?: number;
  page_size?: number;
}

export interface InventarioListResponse {
  items: Inventario[];
  total: number;
  page: number;
  page_size: number;
  pages: number;
}
```

### Interfaces de Movimientos

```typescript
// src/types/movimiento.ts

export enum TipoMovimiento {
  ENTRADA = 'entrada',
  SALIDA = 'salida',
  TRANSFERENCIA = 'transferencia',
  AJUSTE = 'ajuste',
  COMPRA = 'compra',
  VENTA = 'venta',
  DEVOLUCION = 'devolucion',
  MERMA = 'merma',
  DONACION = 'donacion',
  CONTEO_FISICO = 'conteo_fisico'
}

export interface MovimientoInventario {
  id: number;
  producto_id: number;
  ubicacion_id: number;
  tipo_movimiento: TipoMovimiento;
  cantidad: number;
  precio_unitario: number | null;
  valor_total: number | null;
  especialista_id: number | null;
  usuario_id: number;
  referencia: string | null;
  notas: string | null;
  fecha_movimiento: string;
  fecha_creacion: string;
  
  // Relaciones
  producto?: Producto;
  ubicacion?: UbicacionInventario;
  especialista?: { id: number; nombre: string };
  usuario?: { id: number; nombre: string };
}

export interface MovimientoCreate {
  producto_id: number;
  ubicacion_id: number;
  tipo_movimiento: TipoMovimiento;
  cantidad: number;
  precio_unitario?: number;
  especialista_id?: number;
  referencia?: string;
  notas?: string;
  fecha_movimiento?: string;
}

export interface MovimientoFilters {
  fecha_desde?: string;
  fecha_hasta?: string;
  tipo_movimiento?: TipoMovimiento;
  producto_id?: number;
  ubicacion_id?: number;
  especialista_id?: number;
  page?: number;
  page_size?: number;
}

export interface MovimientoListResponse {
  items: MovimientoInventario[];
  total: number;
  page: number;
  page_size: number;
  pages: number;
}
```

### Interfaces de Operaciones de Inventario

```typescript
// src/types/operaciones.ts

export interface CompraCreate {
  proveedor_id: number;
  fecha_compra: string;
  referencia?: string;
  notas?: string;
  items: {
    producto_id: number;
    cantidad: number;
    precio_unitario: number;
  }[];
}

export interface TransferenciaCreate {
  producto_id: number;
  ubicacion_origen_id: number;
  ubicacion_destino_id: number;
  cantidad: number;
  notas?: string;
}

export interface AjusteInventario {
  producto_id: number;
  ubicacion_id: number;
  cantidad_ajuste: number;
  motivo: string;
  notas?: string;
}

export interface ConteoFisico {
  ubicacion_id: number;
  fecha_conteo: string;
  items: {
    producto_id: number;
    cantidad_sistema: number;
    cantidad_fisica: number;
    diferencia: number;
  }[];
  notas?: string;
}
```

### Interfaces de Reportes

```typescript
// src/types/reportes-inventario.ts

export interface VentasProductosFilters {
  fecha_desde: string;
  fecha_hasta: string;
  producto_id?: number;
  limit?: number;
}

export interface VentaProductoItem {
  producto_id: number;
  producto_nombre: string;
  producto_codigo: string | null;
  cantidad_vendida: number;
  monto_total: number;
  utilidad_total: number;
}

export interface ProductosPorEspecialistaFilters {
  fecha_desde: string;
  fecha_hasta: string;
  especialista_id?: number;
}

export interface ProductoPorEspecialistaItem {
  especialista_id: number;
  especialista_nombre: string;
  producto_id: number;
  producto_nombre: string;
  cantidad_vendida: number;
  monto_total: number;
}

export interface ResumenInventarioFilters {
  ubicacion_id?: number;
}

export interface ResumenInventarioUbicacion {
  ubicacion_id: number;
  ubicacion_nombre: string;
  total_productos: number;
  total_unidades: number;
  valor_costo: number;
  valor_venta: number;
  productos_stock_bajo: number;
  productos_sin_stock: number;
}
```

---

## SCHEMAS DE VALIDACIÓN ZOD

### Schema de Proveedor

```typescript
// src/lib/validations/proveedor.schema.ts

import { z } from 'zod';
import { EstadoProveedor } from '@/types/proveedor';

export const proveedorSchema = z.object({
  nombre: z
    .string()
    .min(1, 'El nombre es requerido')
    .max(200, 'El nombre no puede exceder 200 caracteres')
    .trim(),
  contacto: z
    .string()
    .max(100, 'El contacto no puede exceder 100 caracteres')
    .trim()
    .optional()
    .or(z.literal('')),
  telefono: z
    .string()
    .max(20, 'El teléfono no puede exceder 20 caracteres')
    .regex(/^[0-9+\-() ]*$/, 'El teléfono contiene caracteres inválidos')
    .trim()
    .optional()
    .or(z.literal('')),
  email: z
    .string()
    .max(100, 'El email no puede exceder 100 caracteres')
    .email('Email inválido')
    .trim()
    .optional()
    .or(z.literal('')),
  direccion: z
    .string()
    .trim()
    .optional()
    .or(z.literal('')),
  notas: z
    .string()
    .trim()
    .optional()
    .or(z.literal('')),
  estado: z.nativeEnum(EstadoProveedor, {
    errorMap: () => ({ message: 'Estado inválido' })
  })
});

export type ProveedorFormValues = z.infer<typeof proveedorSchema>;

export const proveedorFiltersSchema = z.object({
  search: z.string().optional(),
  estado: z.nativeEnum(EstadoProveedor).optional(),
  page: z.number().int().positive().optional(),
  page_size: z.number().int().positive().max(100).optional()
});
```

### Schema de Producto

```typescript
// src/lib/validations/producto.schema.ts

import { z } from 'zod';
import { EstadoProducto } from '@/types/producto';

export const productoSchema = z.object({
  nombre: z
    .string()
    .min(1, 'El nombre es requerido')
    .max(200, 'El nombre no puede exceder 200 caracteres')
    .trim(),
  codigo: z
    .string()
    .max(50, 'El código no puede exceder 50 caracteres')
    .trim()
    .optional()
    .or(z.literal('')),
  codigo_barras: z
    .string()
    .max(100, 'El código de barras no puede exceder 100 caracteres')
    .trim()
    .optional()
    .or(z.literal('')),
  descripcion: z
    .string()
    .trim()
    .optional()
    .or(z.literal('')),
  precio_compra: z
    .number({ required_error: 'El precio de compra es requerido' })
    .nonnegative('El precio de compra debe ser mayor o igual a 0')
    .multipleOf(0.01, 'El precio debe tener máximo 2 decimales'),
  precio_venta: z
    .number({ required_error: 'El precio de venta es requerido' })
    .nonnegative('El precio de venta debe ser mayor o igual a 0')
    .multipleOf(0.01, 'El precio debe tener máximo 2 decimales'),
  proveedor_id: z
    .number()
    .int()
    .positive('Debe seleccionar un proveedor')
    .optional()
    .or(z.literal(null)),
  stock_minimo: z
    .number()
    .int('El stock mínimo debe ser un número entero')
    .nonnegative('El stock mínimo debe ser mayor o igual a 0')
    .optional()
    .default(0),
  stock_maximo: z
    .number()
    .int('El stock máximo debe ser un número entero')
    .nonnegative('El stock máximo debe ser mayor o igual a 0')
    .optional()
    .or(z.literal(null)),
  fecha_vencimiento: z
    .string()
    .datetime({ message: 'Fecha de vencimiento inválida' })
    .optional()
    .or(z.literal('')),
  lote: z
    .string()
    .max(50, 'El lote no puede exceder 50 caracteres')
    .trim()
    .optional()
    .or(z.literal('')),
  imagen_url: z
    .string()
    .url('URL de imagen inválida')
    .max(500, 'La URL no puede exceder 500 caracteres')
    .optional()
    .or(z.literal('')),
  estado: z.nativeEnum(EstadoProducto, {
    errorMap: () => ({ message: 'Estado inválido' })
  })
}).refine(
  (data) => {
    if (data.stock_maximo && data.stock_minimo) {
      return data.stock_maximo >= data.stock_minimo;
    }
    return true;
  },
  {
    message: 'El stock máximo debe ser mayor o igual al stock mínimo',
    path: ['stock_maximo']
  }
);

export type ProductoFormValues = z.infer<typeof productoSchema>;

export const bulkPriceUpdateSchema = z.object({
  producto_ids: z
    .array(z.number().int().positive())
    .min(1, 'Debe seleccionar al menos un producto'),
  tipo_ajuste: z.enum(['porcentaje', 'fijo'], {
    errorMap: () => ({ message: 'Tipo de ajuste inválido' })
  }),
  valor: z
    .number({ required_error: 'El valor es requerido' })
    .refine((val) => val !== 0, 'El valor no puede ser 0'),
  campo: z.enum(['precio_compra', 'precio_venta'], {
    errorMap: () => ({ message: 'Campo inválido' })
  })
}).refine(
  (data) => {
    if (data.tipo_ajuste === 'porcentaje') {
      return data.valor > -100; // No puede reducir más del 100%
    }
    return true;
  },
  {
    message: 'El porcentaje no puede ser menor a -100%',
    path: ['valor']
  }
);

export const productoImportSchema = z.object({
  nombre: z.string().min(1, 'Nombre requerido').max(200),
  codigo: z.string().max(50).optional(),
  codigo_barras: z.string().max(100).optional(),
  descripcion: z.string().optional(),
  precio_compra: z.number().nonnegative(),
  precio_venta: z.number().nonnegative(),
  proveedor_nombre: z.string().max(200).optional(),
  stock_minimo: z.number().int().nonnegative().optional().default(0),
  stock_maximo: z.number().int().nonnegative().optional(),
  stock_inicial_bodega: z.number().int().nonnegative().optional().default(0),
  stock_inicial_vitrina: z.number().int().nonnegative().optional().default(0)
});
```

### Schema de Movimientos

```typescript
// src/lib/validations/movimiento.schema.ts

import { z } from 'zod';
import { TipoMovimiento } from '@/types/movimiento';

export const movimientoSchema = z.object({
  producto_id: z
    .number({ required_error: 'Debe seleccionar un producto' })
    .int()
    .positive('Debe seleccionar un producto'),
  ubicacion_id: z
    .number({ required_error: 'Debe seleccionar una ubicación' })
    .int()
    .positive('Debe seleccionar una ubicación'),
  tipo_movimiento: z.nativeEnum(TipoMovimiento, {
    errorMap: () => ({ message: 'Tipo de movimiento inválido' })
  }),
  cantidad: z
    .number({ required_error: 'La cantidad es requerida' })
    .int('La cantidad debe ser un número entero')
    .positive('La cantidad debe ser mayor a 0'),
  precio_unitario: z
    .number()
    .nonnegative('El precio debe ser mayor o igual a 0')
    .multipleOf(0.01, 'El precio debe tener máximo 2 decimales')
    .optional()
    .or(z.literal(null)),
  especialista_id: z
    .number()
    .int()
    .positive()
    .optional()
    .or(z.literal(null)),
  referencia: z
    .string()
    .max(100, 'La referencia no puede exceder 100 caracteres')
    .trim()
    .optional()
    .or(z.literal('')),
  notas: z
    .string()
    .trim()
    .optional()
    .or(z.literal('')),
  fecha_movimiento: z
    .string()
    .datetime({ message: 'Fecha de movimiento inválida' })
    .optional()
});

export type MovimientoFormValues = z.infer<typeof movimientoSchema>;
```

### Schemas de Operaciones

```typescript
// src/lib/validations/operaciones.schema.ts

import { z } from 'zod';

export const compraItemSchema = z.object({
  producto_id: z.number().int().positive('Debe seleccionar un producto'),
  cantidad: z
    .number()
    .int('La cantidad debe ser un número entero')
    .positive('La cantidad debe ser mayor a 0'),
  precio_unitario: z
    .number()
    .positive('El precio debe ser mayor a 0')
    .multipleOf(0.01, 'El precio debe tener máximo 2 decimales')
});

export const compraSchema = z.object({
  proveedor_id: z
    .number({ required_error: 'Debe seleccionar un proveedor' })
    .int()
    .positive('Debe seleccionar un proveedor'),
  fecha_compra: z
    .string({ required_error: 'La fecha de compra es requerida' })
    .datetime({ message: 'Fecha de compra inválida' }),
  referencia: z
    .string()
    .max(100, 'La referencia no puede exceder 100 caracteres')
    .trim()
    .optional()
    .or(z.literal('')),
  notas: z
    .string()
    .trim()
    .optional()
    .or(z.literal('')),
  items: z
    .array(compraItemSchema)
    .min(1, 'Debe agregar al menos un producto')
});

export type CompraFormValues = z.infer<typeof compraSchema>;

export const transferenciaSchema = z.object({
  producto_id: z
    .number({ required_error: 'Debe seleccionar un producto' })
    .int()
    .positive('Debe seleccionar un producto'),
  ubicacion_origen_id: z
    .number({ required_error: 'Debe seleccionar la ubicación de origen' })
    .int()
    .positive('Debe seleccionar la ubicación de origen'),
  ubicacion_destino_id: z
    .number({ required_error: 'Debe seleccionar la ubicación de destino' })
    .int()
    .positive('Debe seleccionar la ubicación de destino'),
  cantidad: z
    .number({ required_error: 'La cantidad es requerida' })
    .int('La cantidad debe ser un número entero')
    .positive('La cantidad debe ser mayor a 0'),
  notas: z
    .string()
    .trim()
    .optional()
    .or(z.literal(''))
}).refine(
  (data) => data.ubicacion_origen_id !== data.ubicacion_destino_id,
  {
    message: 'La ubicación de origen y destino deben ser diferentes',
    path: ['ubicacion_destino_id']
  }
);

export type TransferenciaFormValues = z.infer<typeof transferenciaSchema>;

export const ajusteSchema = z.object({
  producto_id: z
    .number({ required_error: 'Debe seleccionar un producto' })
    .int()
    .positive('Debe seleccionar un producto'),
  ubicacion_id: z
    .number({ required_error: 'Debe seleccionar una ubicación' })
    .int()
    .positive('Debe seleccionar una ubicación'),
  cantidad_ajuste: z
    .number({ required_error: 'La cantidad de ajuste es requerida' })
    .int('La cantidad debe ser un número entero')
    .refine((val) => val !== 0, 'La cantidad de ajuste no puede ser 0'),
  motivo: z
    .string()
    .min(1, 'El motivo es requerido')
    .max(200, 'El motivo no puede exceder 200 caracteres')
    .trim(),
  notas: z
    .string()
    .trim()
    .optional()
    .or(z.literal(''))
});

export type AjusteFormValues = z.infer<typeof ajusteSchema>;

export const conteoFisicoItemSchema = z.object({
  producto_id: z.number().int().positive(),
  cantidad_sistema: z.number().int().nonnegative(),
  cantidad_fisica: z.number().int().nonnegative(),
  diferencia: z.number().int()
});

export const conteoFisicoSchema = z.object({
  ubicacion_id: z
    .number({ required_error: 'Debe seleccionar una ubicación' })
    .int()
    .positive('Debe seleccionar una ubicación'),
  fecha_conteo: z
    .string({ required_error: 'La fecha de conteo es requerida' })
    .datetime({ message: 'Fecha de conteo inválida' }),
  items: z
    .array(conteoFisicoItemSchema)
    .min(1, 'Debe agregar al menos un producto al conteo'),
  notas: z
    .string()
    .trim()
    .optional()
    .or(z.literal(''))
});

export type ConteoFisicoFormValues = z.infer<typeof conteoFisicoSchema>;
```

---

## COMPONENTES DETALLADOS

### 1. Gestión de Proveedores

#### ProveedorForm

```typescript
// src/components/inventario/proveedores/ProveedorForm.tsx

'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { proveedorSchema, type ProveedorFormValues } from '@/lib/validations/proveedor.schema';
import { EstadoProveedor } from '@/types/proveedor';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

interface ProveedorFormProps {
  initialData?: ProveedorFormValues;
  onSubmit: (data: ProveedorFormValues) => Promise<void>;
  isLoading?: boolean;
}

export function ProveedorForm({ initialData, onSubmit, isLoading }: ProveedorFormProps) {
  const form = useForm<ProveedorFormValues>({
    resolver: zodResolver(proveedorSchema),
    defaultValues: initialData || {
      nombre: '',
      contacto: '',
      telefono: '',
      email: '',
      direccion: '',
      notas: '',
      estado: EstadoProveedor.ACTIVO
    }
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>{initialData ? 'Editar Proveedor' : 'Nuevo Proveedor'}</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Información básica */}
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="nombre"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre *</FormLabel>
                    <FormControl>
                      <Input placeholder="Nombre del proveedor" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="estado"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estado</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar estado" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={EstadoProveedor.ACTIVO}>Activo</SelectItem>
                        <SelectItem value={EstadoProveedor.INACTIVO}>Inactivo</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Información de contacto */}
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="contacto"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Persona de Contacto</FormLabel>
                    <FormControl>
                      <Input placeholder="Nombre del contacto" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="telefono"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Teléfono</FormLabel>
                    <FormControl>
                      <Input placeholder="+57 300 123 4567" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="correo@ejemplo.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="direccion"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Dirección</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Dirección física del proveedor"
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notas"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notas</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Notas adicionales sobre el proveedor"
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-4">
              <Button type="button" variant="outline" onClick={() => form.reset()}>
                Limpiar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {initialData ? 'Actualizar' : 'Crear'} Proveedor
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
```

**Características:**
- Formulario con validación Zod
- Campos organizados en secciones
- Estados de carga
- Manejo de errores
- Responsive design

#### ProveedorList

```typescript
// src/components/inventario/proveedores/ProveedorList.tsx

'use client';

import { useState } from 'react';
import { useProveedores } from '@/lib/api/proveedores';
import { ProveedorCard } from './ProveedorCard';
import { ProveedorFilters } from './ProveedorFilters';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Plus, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import type { ProveedorFilters as ProveedorFiltersType } from '@/types/proveedor';

export function ProveedorList() {
  const [filters, setFilters] = useState<ProveedorFiltersType>({
    page: 1,
    page_size: 12
  });

  const { data, isLoading, error } = useProveedores(filters);

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Error al cargar proveedores: {error.message}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Proveedores</h1>
          <p className="text-muted-foreground">
            Gestiona los proveedores de productos del salón
          </p>
        </div>
        <Button asChild>
          <Link href="/inventario/proveedores/nuevo">
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Proveedor
          </Link>
        </Button>
      </div>

      {/* Filtros */}
      <ProveedorFilters filters={filters} onFiltersChange={setFilters} />

      {/* Listado */}
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      ) : data?.items.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No se encontraron proveedores</p>
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {data?.items.map((proveedor) => (
              <ProveedorCard key={proveedor.id} proveedor={proveedor} />
            ))}
          </div>

          {/* Paginación */}
          {data && data.pages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <Button
                variant="outline"
                disabled={filters.page === 1}
                onClick={() => setFilters({ ...filters, page: (filters.page || 1) - 1 })}
              >
                Anterior
              </Button>
              <span className="text-sm text-muted-foreground">
                Página {filters.page} de {data.pages}
              </span>
              <Button
                variant="outline"
                disabled={filters.page === data.pages}
                onClick={() => setFilters({ ...filters, page: (filters.page || 1) + 1 })}
              >
                Siguiente
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
```

**Características:**
- Listado con paginación
- Filtros de búsqueda
- Estados de carga y error
- Grid responsive
- Navegación entre páginas

---

### 2. Gestión de Productos

#### ProductoForm

```typescript
// src/components/inventario/productos/ProductoForm.tsx

'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { productoSchema, type ProductoFormValues } from '@/lib/validations/producto.schema';
import { useProveedores } from '@/lib/api/proveedores';
import { EstadoProducto } from '@/types/producto';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ProductoImageUpload } from './ProductoImageUpload';
import { Loader2, DollarSign, Package, FileText } from 'lucide-react';

interface ProductoFormProps {
  initialData?: ProductoFormValues;
  onSubmit: (data: ProductoFormValues) => Promise<void>;
  isLoading?: boolean;
}

export function ProductoForm({ initialData, onSubmit, isLoading }: ProductoFormProps) {
  const { data: proveedoresData } = useProveedores({ page_size: 100 });
  
  const form = useForm<ProductoFormValues>({
    resolver: zodResolver(productoSchema),
    defaultValues: initialData || {
      nombre: '',
      codigo: '',
      codigo_barras: '',
      descripcion: '',
      precio_compra: 0,
      precio_venta: 0,
      proveedor_id: null,
      stock_minimo: 0,
      stock_maximo: null,
      fecha_vencimiento: '',
      lote: '',
      imagen_url: '',
      estado: EstadoProducto.ACTIVO
    }
  });

  // Calcular margen de ganancia
  const precioCompra = form.watch('precio_compra');
  const precioVenta = form.watch('precio_venta');
  const margen = precioCompra > 0 
    ? ((precioVenta - precioCompra) / precioCompra * 100).toFixed(2)
    : '0.00';

  return (
    <Card>
      <CardHeader>
        <CardTitle>{initialData ? 'Editar Producto' : 'Nuevo Producto'}</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Tabs defaultValue="basico" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="basico">
                  <Package className="mr-2 h-4 w-4" />
                  Información Básica
                </TabsTrigger>
                <TabsTrigger value="precios">
                  <DollarSign className="mr-2 h-4 w-4" />
                  Precios y Stock
                </TabsTrigger>
                <TabsTrigger value="adicional">
                  <FileText className="mr-2 h-4 w-4" />
                  Información Adicional
                </TabsTrigger>
              </TabsList>

              {/* Tab: Información Básica */}
              <TabsContent value="basico" className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="nombre"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nombre del Producto *</FormLabel>
                        <FormControl>
                          <Input placeholder="Ej: Shampoo Keratina 500ml" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="estado"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Estado</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccionar estado" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value={EstadoProducto.ACTIVO}>Activo</SelectItem>
                            <SelectItem value={EstadoProducto.INACTIVO}>Inactivo</SelectItem>
                            <SelectItem value={EstadoProducto.DESCONTINUADO}>Descontinuado</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="codigo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Código SKU</FormLabel>
                        <FormControl>
                          <Input placeholder="Ej: SHAM-KER-500" {...field} />
                        </FormControl>
                        <FormDescription>Código interno único</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="codigo_barras"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Código de Barras</FormLabel>
                        <FormControl>
                          <Input placeholder="Ej: 7501234567890" {...field} />
                        </FormControl>
                        <FormDescription>Código de barras del producto</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="descripcion"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descripción</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Descripción detallada del producto"
                          className="resize-none"
                          rows={4}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="proveedor_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Proveedor</FormLabel>
                      <Select
                        onValueChange={(value) => field.onChange(value ? Number(value) : null)}
                        defaultValue={field.value?.toString()}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar proveedor" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="null">Sin proveedor</SelectItem>
                          {proveedoresData?.items.map((proveedor) => (
                            <SelectItem key={proveedor.id} value={proveedor.id.toString()}>
                              {proveedor.nombre}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="imagen_url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Imagen del Producto</FormLabel>
                      <FormControl>
                        <ProductoImageUpload
                          value={field.value || ''}
                          onChange={field.onChange}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>

              {/* Tab: Precios y Stock */}
              <TabsContent value="precios" className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="precio_compra"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Precio de Compra *</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                              $
                            </span>
                            <Input
                              type="number"
                              step="0.01"
                              placeholder="0.00"
                              className="pl-7"
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                            />
                          </div>
                        </FormControl>
                        <FormDescription>Precio al que compras el producto</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="precio_venta"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Precio de Venta *</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                              $
                            </span>
                            <Input
                              type="number"
                              step="0.01"
                              placeholder="0.00"
                              className="pl-7"
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                            />
                          </div>
                        </FormControl>
                        <FormDescription>Precio al que vendes el producto</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Margen de ganancia */}
                <div className="rounded-lg border bg-muted/50 p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Margen de Ganancia:</span>
                    <span className={`text-lg font-bold ${parseFloat(margen) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {margen}%
                    </span>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="stock_minimo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Stock Mínimo</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="0"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormDescription>
                          Alerta cuando el stock esté por debajo de este valor
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="stock_maximo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Stock Máximo</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="Opcional"
                            {...field}
                            value={field.value || ''}
                            onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : null)}
                          />
                        </FormControl>
                        <FormDescription>Stock máximo recomendado (opcional)</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </TabsContent>

              {/* Tab: Información Adicional */}
              <TabsContent value="adicional" className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="lote"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Número de Lote</FormLabel>
                        <FormControl>
                          <Input placeholder="Ej: LOTE-2024-001" {...field} />
                        </FormControl>
                        <FormDescription>Número de lote del proveedor</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="fecha_vencimiento"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Fecha de Vencimiento</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormDescription>Fecha de vencimiento del producto (opcional)</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </TabsContent>
            </Tabs>

            {/* Botones de acción */}
            <div className="flex justify-end gap-4 pt-4">
              <Button type="button" variant="outline" onClick={() => form.reset()}>
                Limpiar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {initialData ? 'Actualizar' : 'Crear'} Producto
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
```

**Características:**
- Formulario con pestañas
- Cálculo automático de margen
- Selector de proveedor
- Carga de imagen
- Validación completa
- Diseño responsive

#### ProductoTable

```typescript
// src/components/inventario/productos/ProductoTable.tsx

'use client';

import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  type ColumnDef,
  type SortingState,
  flexRender
} from '@tanstack/react-table';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { ProductoStockBadge } from './ProductoStockBadge';
import { MoreHorizontal, ArrowUpDown, Eye, Edit, Trash } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import type { Producto } from '@/types/producto';
import { formatCurrency } from '@/lib/utils';
import Link from 'next/link';

interface ProductoTableProps {
  data: Producto[];
  onDelete?: (id: number) => void;
  selectable?: boolean;
  selectedIds?: number[];
  onSelectionChange?: (ids: number[]) => void;
}

export function ProductoTable({
  data,
  onDelete,
  selectable = false,
  selectedIds = [],
  onSelectionChange
}: ProductoTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);

  const columns: ColumnDef<Producto>[] = [
    // Columna de selección (opcional)
    ...(selectable
      ? [
          {
            id: 'select',
            header: ({ table }) => (
              <Checkbox
                checked={table.getIsAllPageRowsSelected()}
                onCheckedChange={(value) => {
                  table.toggleAllPageRowsSelected(!!value);
                  const newSelection = value
                    ? data.map((row) => row.id)
                    : [];
                  onSelectionChange?.(newSelection);
                }}
                aria-label="Seleccionar todo"
              />
            ),
            cell: ({ row }) => (
              <Checkbox
                checked={selectedIds.includes(row.original.id)}
                onCheckedChange={(value) => {
                  const newSelection = value
                    ? [...selectedIds, row.original.id]
                    : selectedIds.filter((id) => id !== row.original.id);
                  onSelectionChange?.(newSelection);
                }}
                aria-label="Seleccionar fila"
              />
            ),
            enableSorting: false,
            enableHiding: false
          } as ColumnDef<Producto>
        ]
      : []),
    
    // Código
    {
      accessorKey: 'codigo',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Código
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <div className="font-mono text-sm">
          {row.original.codigo || '-'}
        </div>
      )
    },
    
    // Nombre
    {
      accessorKey: 'nombre',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Nombre
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <div>
          <div className="font-medium">{row.original.nombre}</div>
          {row.original.proveedor && (
            <div className="text-xs text-muted-foreground">
              {row.original.proveedor.nombre}
            </div>
          )}
        </div>
      )
    },
    
    // Precio Compra
    {
      accessorKey: 'precio_compra',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          P. Compra
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <div className="text-right font-mono">
          {formatCurrency(row.original.precio_compra)}
        </div>
      )
    },
    
    // Precio Venta
    {
      accessorKey: 'precio_venta',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          P. Venta
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <div className="text-right font-mono">
          {formatCurrency(row.original.precio_venta)}
        </div>
      )
    },
    
    // Margen
    {
      accessorKey: 'margen_ganancia',
      header: 'Margen',
      cell: ({ row }) => (
        <div className="text-right">
          <span className={row.original.margen_ganancia >= 0 ? 'text-green-600' : 'text-red-600'}>
            {row.original.margen_ganancia.toFixed(1)}%
          </span>
        </div>
      )
    },
    
    // Stock
    {
      accessorKey: 'stock_total',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Stock
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <ProductoStockBadge
          stock={row.original.stock_total}
          stockMinimo={row.original.stock_minimo}
        />
      )
    },
    
    // Estado
    {
      accessorKey: 'estado',
      header: 'Estado',
      cell: ({ row }) => {
        const estado = row.original.estado;
        return (
          <Badge
            variant={
              estado === 'activo'
                ? 'default'
                : estado === 'inactivo'
                ? 'secondary'
                : 'destructive'
            }
          >
            {estado}
          </Badge>
        );
      }
    },
    
    // Acciones
    {
      id: 'actions',
      cell: ({ row }) => {
        const producto = row.original;

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Abrir menú</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/inventario/productos/${producto.id}`}>
                  <Eye className="mr-2 h-4 w-4" />
                  Ver detalle
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`/inventario/productos/${producto.id}/editar`}>
                  <Edit className="mr-2 h-4 w-4" />
                  Editar
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive"
                onClick={() => onDelete?.(producto.id)}
              >
                <Trash className="mr-2 h-4 w-4" />
                Eliminar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      }
    }
  ];

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    state: {
      sorting
    }
  });

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id}>
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                data-state={row.getIsSelected() && 'selected'}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center">
                No se encontraron productos.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
```

**Características:**
- Tabla con TanStack Table
- Ordenamiento por columnas
- Selección múltiple opcional
- Badges de estado y stock
- Menú de acciones
- Formato de moneda
- Responsive

---

### 3. Componentes de Movimientos

#### CompraForm

```typescript
// src/components/inventario/movimientos/CompraForm.tsx

'use client';

import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { compraSchema, type CompraFormValues } from '@/lib/validations/operaciones.schema';
import { useProveedores } from '@/lib/api/proveedores';
import { useProductos } from '@/lib/api/productos';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface CompraFormProps {
  onSubmit: (data: CompraFormValues) => Promise<void>;
  isLoading?: boolean;
}

export function CompraForm({ onSubmit, isLoading }: CompraFormProps) {
  const { data: proveedoresData } = useProveedores({ page_size: 100 });
  const { data: productosData } = useProductos({ page_size: 100 });

  const form = useForm<CompraFormValues>({
    resolver: zodResolver(compraSchema),
    defaultValues: {
      proveedor_id: undefined,
      fecha_compra: new Date().toISOString().split('T')[0],
      referencia: '',
      notas: '',
      items: [
        {
          producto_id: undefined,
          cantidad: 1,
          precio_unitario: 0
        }
      ]
    }
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'items'
  });

  // Calcular total
  const items = form.watch('items');
  const total = items.reduce(
    (sum, item) => sum + (item.cantidad || 0) * (item.precio_unitario || 0),
    0
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Registrar Compra</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Información de la compra */}
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="proveedor_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Proveedor *</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(Number(value))}
                      defaultValue={field.value?.toString()}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar proveedor" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {proveedoresData?.items.map((proveedor) => (
                          <SelectItem key={proveedor.id} value={proveedor.id.toString()}>
                            {proveedor.nombre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="fecha_compra"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fecha de Compra *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="referencia"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Número de Factura/Referencia</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: FACT-2024-001" {...field} />
                  </FormControl>
                  <FormDescription>Número de factura o documento de compra</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Items de compra */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Productos</h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    append({
                      producto_id: undefined,
                      cantidad: 1,
                      precio_unitario: 0
                    })
                  }
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Agregar Producto
                </Button>
              </div>

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[40%]">Producto</TableHead>
                      <TableHead className="w-[20%]">Cantidad</TableHead>
                      <TableHead className="w-[25%]">Precio Unitario</TableHead>
                      <TableHead className="w-[10%]">Subtotal</TableHead>
                      <TableHead className="w-[5%]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {fields.map((field, index) => {
                      const cantidad = form.watch(`items.${index}.cantidad`) || 0;
                      const precioUnitario = form.watch(`items.${index}.precio_unitario`) || 0;
                      const subtotal = cantidad * precioUnitario;

                      return (
                        <TableRow key={field.id}>
                          <TableCell>
                            <FormField
                              control={form.control}
                              name={`items.${index}.producto_id`}
                              render={({ field }) => (
                                <FormItem>
                                  <Select
                                    onValueChange={(value) => field.onChange(Number(value))}
                                    defaultValue={field.value?.toString()}
                                  >
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Seleccionar" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      {productosData?.items.map((producto) => (
                                        <SelectItem
                                          key={producto.id}
                                          value={producto.id.toString()}
                                        >
                                          {producto.nombre}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </TableCell>
                          <TableCell>
                            <FormField
                              control={form.control}
                              name={`items.${index}.cantidad`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormControl>
                                    <Input
                                      type="number"
                                      min="1"
                                      {...field}
                                      onChange={(e) =>
                                        field.onChange(parseInt(e.target.value) || 0)
                                      }
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </TableCell>
                          <TableCell>
                            <FormField
                              control={form.control}
                              name={`items.${index}.precio_unitario`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormControl>
                                    <div className="relative">
                                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                                        $
                                      </span>
                                      <Input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        className="pl-7"
                                        {...field}
                                        onChange={(e) =>
                                          field.onChange(parseFloat(e.target.value) || 0)
                                        }
                                      />
                                    </div>
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            {formatCurrency(subtotal)}
                          </TableCell>
                          <TableCell>
                            {fields.length > 1 && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => remove(index)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Total */}
              <div className="flex justify-end">
                <div className="rounded-lg border bg-muted/50 p-4">
                  <div className="flex items-center gap-8">
                    <span className="text-lg font-medium">Total:</span>
                    <span className="text-2xl font-bold">{formatCurrency(total)}</span>
                  </div>
                </div>
              </div>
            </div>

            <FormField
              control={form.control}
              name="notas"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notas</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Notas adicionales sobre la compra"
                      className="resize-none"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-4">
              <Button type="button" variant="outline" onClick={() => form.reset()}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Registrar Compra
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
```

**Características:**
- Formulario multi-item dinámico
- Cálculo automático de subtotales
- Selección de proveedor y productos
- Total general
- Validación completa
- Manejo de errores

---

### 4. Componentes de Reportes

#### VentasProductosReport

```typescript
// src/components/inventario/reportes/VentasProductosReport.tsx

'use client';

import { useState } from 'react';
import { useVentasProductos } from '@/lib/api/reportes-inventario';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Download, AlertCircle, TrendingUp, DollarSign, Package } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import * as XLSX from 'xlsx';

export function VentasProductosReport() {
  const [fechaDesde, setFechaDesde] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date.toISOString().split('T')[0];
  });
  const [fechaHasta, setFechaHasta] = useState(() => new Date().toISOString().split('T')[0]);

  const { data, isLoading, error } = useVentasProductos({
    fecha_desde: fechaDesde,
    fecha_hasta: fechaHasta,
    limit: 20
  });

  const exportToExcel = () => {
    if (!data) return;

    const ws = XLSX.utils.json_to_sheet(
      data.map((item) => ({
        Código: item.producto_codigo || '-',
        Producto: item.producto_nombre,
        'Cantidad Vendida': item.cantidad_vendida,
        'Monto Total': item.monto_total,
        'Utilidad Total': item.utilidad_total
      }))
    );

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Ventas de Productos');
    XLSX.writeFile(wb, `ventas_productos_${fechaDesde}_${fechaHasta}.xlsx`);
  };

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>Error al cargar el reporte: {error.message}</AlertDescription>
      </Alert>
    );
  }

  // Calcular totales
  const totales = data?.reduce(
    (acc, item) => ({
      cantidad: acc.cantidad + item.cantidad_vendida,
      monto: acc.monto + item.monto_total,
      utilidad: acc.utilidad + item.utilidad_total
    }),
    { cantidad: 0, monto: 0, utilidad: 0 }
  ) || { cantidad: 0, monto: 0, utilidad: 0 };

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="fecha_desde">Fecha Desde</Label>
              <Input
                id="fecha_desde"
                type="date"
                value={fechaDesde}
                onChange={(e) => setFechaDesde(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fecha_hasta">Fecha Hasta</Label>
              <Input
                id="fecha_hasta"
                type="date"
                value={fechaHasta}
                onChange={(e) => setFechaHasta(e.target.value)}
              />
            </div>
            <div className="flex items-end">
              <Button onClick={exportToExcel} disabled={!data || data.length === 0}>
                <Download className="mr-2 h-4 w-4" />
                Exportar Excel
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tarjetas de resumen */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Unidades</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <div className="text-2xl font-bold">{totales.cantidad}</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Ventas</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-32" />
            ) : (
              <div className="text-2xl font-bold">{formatCurrency(totales.monto)}</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Utilidad Total</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-32" />
            ) : (
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(totales.utilidad)}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Gráfico */}
      <Card>
        <CardHeader>
          <CardTitle>Top 10 Productos Más Vendidos</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-[400px] w-full" />
          ) : data && data.length > 0 ? (
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={data.slice(0, 10)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="producto_nombre"
                  angle={-45}
                  textAnchor="end"
                  height={120}
                  interval={0}
                />
                <YAxis />
                <Tooltip
                  formatter={(value, name) => {
                    if (name === 'cantidad_vendida') return [value, 'Cantidad'];
                    return [formatCurrency(value as number), name === 'monto_total' ? 'Monto' : 'Utilidad'];
                  }}
                />
                <Legend />
                <Bar dataKey="cantidad_vendida" fill="#8884d8" name="Cantidad" />
                <Bar dataKey="monto_total" fill="#82ca9d" name="Monto" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No hay datos para el período seleccionado</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tabla detallada */}
      <Card>
        <CardHeader>
          <CardTitle>Detalle de Ventas</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : data && data.length > 0 ? (
            <div className="rounded-md border">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="p-3 text-left">Producto</th>
                    <th className="p-3 text-right">Código</th>
                    <th className="p-3 text-right">Cantidad</th>
                    <th className="p-3 text-right">Monto Total</th>
                    <th className="p-3 text-right">Utilidad</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((item, index) => (
                    <tr key={index} className="border-b">
                      <td className="p-3">{item.producto_nombre}</td>
                      <td className="p-3 text-right font-mono text-sm">
                        {item.producto_codigo || '-'}
                      </td>
                      <td className="p-3 text-right">{item.cantidad_vendida}</td>
                      <td className="p-3 text-right font-mono">
                        {formatCurrency(item.monto_total)}
                      </td>
                      <td className="p-3 text-right font-mono text-green-600">
                        {formatCurrency(item.utilidad_total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No se encontraron ventas en este período</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
```

**Características:**
- Filtros de fecha
- Tarjetas de resumen con totales
- Gráfico de barras con Recharts
- Tabla detallada
- Exportación a Excel
- Estados de carga y error
- Formato de moneda

---

## GESTIÓN DE ESTADO

### Store de Productos

```typescript
// src/lib/stores/useProductoStore.ts

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { Producto, ProductoFilters } from '@/types/producto';

interface ProductoState {
  // Estado
  selectedProductos: number[];
  filters: ProductoFilters;
  viewMode: 'grid' | 'table';
  
  // Acciones
  setSelectedProductos: (ids: number[]) => void;
  toggleProductoSelection: (id: number) => void;
  clearSelection: () => void;
  setFilters: (filters: Partial<ProductoFilters>) => void;
  resetFilters: () => void;
  setViewMode: (mode: 'grid' | 'table') => void;
}

const defaultFilters: ProductoFilters = {
  search: '',
  page: 1,
  page_size: 12
};

export const useProductoStore = create<ProductoState>()(
  devtools(
    (set) => ({
      // Estado inicial
      selectedProductos: [],
      filters: defaultFilters,
      viewMode: 'grid',

      // Acciones
      setSelectedProductos: (ids) =>
        set({ selectedProductos: ids }, false, 'setSelectedProductos'),

      toggleProductoSelection: (id) =>
        set(
          (state) => ({
            selectedProductos: state.selectedProductos.includes(id)
              ? state.selectedProductos.filter((pid) => pid !== id)
              : [...state.selectedProductos, id]
          }),
          false,
          'toggleProductoSelection'
        ),

      clearSelection: () =>
        set({ selectedProductos: [] }, false, 'clearSelection'),

      setFilters: (newFilters) =>
        set(
          (state) => ({
            filters: { ...state.filters, ...newFilters }
          }),
          false,
          'setFilters'
        ),

      resetFilters: () =>
        set({ filters: defaultFilters }, false, 'resetFilters'),

      setViewMode: (mode) =>
        set({ viewMode: mode }, false, 'setViewMode')
    }),
    { name: 'ProductoStore' }
  )
);
```

### Store de Inventario

```typescript
// src/lib/stores/useInventarioStore.ts

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { UbicacionInventario } from '@/types/inventario';

interface InventarioState {
  // Estado
  ubicacionSeleccionada: number | null;
  ubicaciones: UbicacionInventario[];
  mostrarAlertasStock: boolean;
  
  // Acciones
  setUbicacionSeleccionada: (id: number | null) => void;
  setUbicaciones: (ubicaciones: UbicacionInventario[]) => void;
  setMostrarAlertasStock: (mostrar: boolean) => void;
}

export const useInventarioStore = create<InventarioState>()(
  devtools(
    persist(
      (set) => ({
        // Estado inicial
        ubicacionSeleccionada: null,
        ubicaciones: [],
        mostrarAlertasStock: true,

        // Acciones
        setUbicacionSeleccionada: (id) =>
          set({ ubicacionSeleccionada: id }, false, 'setUbicacionSeleccionada'),

        setUbicaciones: (ubicaciones) =>
          set({ ubicaciones }, false, 'setUbicaciones'),

        setMostrarAlertasStock: (mostrar) =>
          set({ mostrarAlertasStock: mostrar }, false, 'setMostrarAlertasStock')
      }),
      {
        name: 'inventario-storage',
        partialize: (state) => ({
          ubicacionSeleccionada: state.ubicacionSeleccionada,
          mostrarAlertasStock: state.mostrarAlertasStock
        })
      }
    ),
    { name: 'InventarioStore' }
  )
);
```

---

## INTEGRACIÓN CON API

### Hooks de React Query - Productos

```typescript
// src/lib/api/productos.ts

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type {
  Producto,
  ProductoCreate,
  ProductoUpdate,
  ProductoFilters,
  ProductoListResponse,
  BulkPriceUpdate,
  ProductoImportRow
} from '@/types/producto';
import { toast } from 'sonner';

// Keys para cache
export const productoKeys = {
  all: ['productos'] as const,
  lists: () => [...productoKeys.all, 'list'] as const,
  list: (filters: ProductoFilters) => [...productoKeys.lists(), filters] as const,
  details: () => [...productoKeys.all, 'detail'] as const,
  detail: (id: number) => [...productoKeys.details(), id] as const
};

// GET: Listar productos
export function useProductos(filters: ProductoFilters = {}) {
  return useQuery({
    queryKey: productoKeys.list(filters),
    queryFn: async () => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value.toString());
        }
      });

      const response = await apiClient.get<ProductoListResponse>(
        `/api/productos?${params.toString()}`
      );
      return response.data;
    }
  });
}

// GET: Obtener producto por ID
export function useProducto(id: number) {
  return useQuery({
    queryKey: productoKeys.detail(id),
    queryFn: async () => {
      const response = await apiClient.get<Producto>(`/api/productos/${id}`);
      return response.data;
    },
    enabled: !!id
  });
}

// POST: Crear producto
export function useCreateProducto() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: ProductoCreate) => {
      const response = await apiClient.post<Producto>('/api/productos', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productoKeys.lists() });
      toast.success('Producto creado exitosamente');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Error al crear producto');
    }
  });
}

// PUT: Actualizar producto
export function useUpdateProducto(id: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: ProductoUpdate) => {
      const response = await apiClient.put<Producto>(`/api/productos/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productoKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: productoKeys.lists() });
      toast.success('Producto actualizado exitosamente');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Error al actualizar producto');
    }
  });
}

// DELETE: Eliminar producto
export function useDeleteProducto() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      await apiClient.delete(`/api/productos/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productoKeys.lists() });
      toast.success('Producto eliminado exitosamente');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Error al eliminar producto');
    }
  });
}

// POST: Actualización masiva de precios
export function useBulkPriceUpdate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: BulkPriceUpdate) => {
      const response = await apiClient.post('/api/productos/actualizar-precios-masivo', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productoKeys.lists() });
      toast.success('Precios actualizados exitosamente');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Error al actualizar precios');
    }
  });
}

// POST: Importar productos
export function useImportProductos() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (productos: ProductoImportRow[]) => {
      const response = await apiClient.post('/api/productos/importar', { productos });
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: productoKeys.lists() });
      toast.success(`${data.productos_creados} productos importados exitosamente`);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Error al importar productos');
    }
  });
}
```

### Hooks de React Query - Movimientos

```typescript
// src/lib/api/movimientos.ts

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type {
  MovimientoInventario,
  MovimientoCreate,
  MovimientoFilters,
  MovimientoListResponse
} from '@/types/movimiento';
import type {
  CompraCreate,
  TransferenciaCreate,
  AjusteInventario,
  ConteoFisico
} from '@/types/operaciones';
import { toast } from 'sonner';
import { inventarioKeys } from './inventario';

// Keys para cache
export const movimientoKeys = {
  all: ['movimientos'] as const,
  lists: () => [...movimientoKeys.all, 'list'] as const,
  list: (filters: MovimientoFilters) => [...movimientoKeys.lists(), filters] as const,
  details: () => [...movimientoKeys.all, 'detail'] as const,
  detail: (id: number) => [...movimientoKeys.details(), id] as const
};

// GET: Listar movimientos
export function useMovimientos(filters: MovimientoFilters = {}) {
  return useQuery({
    queryKey: movimientoKeys.list(filters),
    queryFn: async () => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value.toString());
        }
      });

      const response = await apiClient.get<MovimientoListResponse>(
        `/api/inventario/movimientos?${params.toString()}`
      );
      return response.data;
    }
  });
}

// POST: Crear movimiento
export function useCreateMovimiento() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: MovimientoCreate) => {
      const response = await apiClient.post<MovimientoInventario>(
        '/api/inventario/movimientos',
        data
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: movimientoKeys.lists() });
      queryClient.invalidateQueries({ queryKey: inventarioKeys.all });
      toast.success('Movimiento registrado exitosamente');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Error al registrar movimiento');
    }
  });
}

// POST: Registrar compra
export function useRegistrarCompra() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CompraCreate) => {
      const response = await apiClient.post('/api/inventario/compra', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: movimientoKeys.lists() });
      queryClient.invalidateQueries({ queryKey: inventarioKeys.all });
      toast.success('Compra registrada exitosamente');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Error al registrar compra');
    }
  });
}

// POST: Transferir entre ubicaciones
export function useTransferirInventario() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: TransferenciaCreate) => {
      const response = await apiClient.post('/api/inventario/transferir', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: movimientoKeys.lists() });
      queryClient.invalidateQueries({ queryKey: inventarioKeys.all });
      toast.success('Transferencia realizada exitosamente');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Error al realizar transferencia');
    }
  });
}

// POST: Ajustar inventario
export function useAjustarInventario() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: AjusteInventario) => {
      const response = await apiClient.post('/api/inventario/ajustar', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: movimientoKeys.lists() });
      queryClient.invalidateQueries({ queryKey: inventarioKeys.all });
      toast.success('Inventario ajustado exitosamente');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Error al ajustar inventario');
    }
  });
}

// POST: Registrar conteo físico
export function useRegistrarConteoFisico() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: ConteoFisico) => {
      const response = await apiClient.post('/api/inventario/conteo-fisico', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: movimientoKeys.lists() });
      queryClient.invalidateQueries({ queryKey: inventarioKeys.all });
      toast.success('Conteo físico registrado exitosamente');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Error al registrar conteo físico');
    }
  });
}

// DELETE: Anular movimiento
export function useAnularMovimiento() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      await apiClient.delete(`/api/inventario/movimientos/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: movimientoKeys.lists() });
      queryClient.invalidateQueries({ queryKey: inventarioKeys.all });
      toast.success('Movimiento anulado exitosamente');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Error al anular movimiento');
    }
  });
}
```

---

## FLUJOS DE USUARIO

### Flujo 1: Crear Producto

```
┌─────────────────────────────────────────────────────────────┐
│                   CREAR NUEVO PRODUCTO                       │
└─────────────────────────────────────────────────────────────┘

[Dashboard] → [Inventario] → [Productos]
                                  ↓
                        [Botón "Nuevo Producto"]
                                  ↓
┌─────────────────────────────────────────────────────────────┐
│  Formulario de Producto (ProductoForm)                      │
│                                                              │
│  TAB: Información Básica                                    │
│  ┌────────────────────────────────────────────────────────┐│
│  │ • Nombre del Producto *          [________________]    ││
│  │ • Estado                          [Activo ▼]           ││
│  │ • Código SKU                      [________________]    ││
│  │ • Código de Barras                [________________]    ││
│  │ • Descripción                     [________________]    ││
│  │                                   [________________]    ││
│  │ • Proveedor                       [Seleccionar ▼]      ││
│  │ • Imagen                          [Subir imagen...]    ││
│  └────────────────────────────────────────────────────────┘│
│                                                              │
│  TAB: Precios y Stock                                       │
│  ┌────────────────────────────────────────────────────────┐│
│  │ • Precio de Compra *              $ [__________]        ││
│  │ • Precio de Venta *               $ [__________]        ││
│  │                                                          ││
│  │ ╔════════════════════════════════════════════╗          ││
│  │ ║  Margen de Ganancia:          45.5%        ║          ││
│  │ ╚════════════════════════════════════════════╝          ││
│  │                                                          ││
│  │ • Stock Mínimo                    [__________]          ││
│  │ • Stock Máximo                    [__________]          ││
│  └────────────────────────────────────────────────────────┘│
│                                                              │
│  TAB: Información Adicional                                 │
│  ┌────────────────────────────────────────────────────────┐│
│  │ • Número de Lote                  [________________]    ││
│  │ • Fecha de Vencimiento            [📅 2024-12-31]      ││
│  └────────────────────────────────────────────────────────┘│
│                                                              │
│  [Limpiar]                              [Crear Producto]    │
└─────────────────────────────────────────────────────────────┘
                                  ↓
                    [Validación en cliente con Zod]
                                  ↓
                    [POST /api/productos]
                                  ↓
                ┌──────────────────┴──────────────────┐
                │                                      │
           [Éxito]                                [Error]
                │                                      │
                ↓                                      ↓
    [Toast: "Producto creado"]          [Toast: "Error al crear"]
    [Redirect a lista]                  [Mostrar errores en form]
```

### Flujo 2: Registrar Compra

```
┌─────────────────────────────────────────────────────────────┐
│                    REGISTRAR COMPRA                          │
└─────────────────────────────────────────────────────────────┘

[Dashboard] → [Inventario] → [Movimientos] → [Registrar Compra]
                                  ↓
┌─────────────────────────────────────────────────────────────┐
│  Formulario de Compra (CompraForm)                          │
│                                                              │
│  • Proveedor *                [Proveedor ABC ▼]             │
│  • Fecha de Compra *          [📅 2024-03-15]               │
│  • Número de Factura          [FACT-2024-001]               │
│                                                              │
│  Productos                              [+ Agregar Producto]│
│  ┌────────────────────────────────────────────────────────┐│
│  │ Producto        Cantidad  Precio Unit.  Subtotal       ││
│  │──────────────────────────────────────────────────────  ││
│  │ Shampoo 500ml      10     $ 25.00      $ 250.00    🗑️ ││
│  │ Crema Peinar       5      $ 35.00      $ 175.00    🗑️ ││
│  │ Acondicionador     8      $ 28.00      $ 224.00    🗑️ ││
│  └────────────────────────────────────────────────────────┘│
│                                                              │
│  ╔════════════════════════════════════════════╗             │
│  ║  Total:                     $ 649.00       ║             │
│  ╚════════════════════════════════════════════╝             │
│                                                              │
│  Notas:                                                      │
│  [Compra trimestral de productos para alisado]             │
│  [________________________________________________]           │
│                                                              │
│  [Cancelar]                        [Registrar Compra]       │
└─────────────────────────────────────────────────────────────┘
                                  ↓
                    [Validación de items]
                                  ↓
                    [POST /api/inventario/compra]
                                  ↓
        ┌────────────────────────┴─────────────────────┐
        │                                               │
   [Éxito]                                         [Error]
        │                                               │
        ↓                                               ↓
[Movimientos creados]                    [Toast: "Error..."]
[Stock actualizado]                      [Mostrar errores]
[Toast: "Compra registrada"]
[Redirect a historial]
```

### Flujo 3: Transferencia entre Ubicaciones

```
┌─────────────────────────────────────────────────────────────┐
│              TRANSFERIR INVENTARIO                           │
└─────────────────────────────────────────────────────────────┘

[Dashboard] → [Inventario] → [Movimientos] → [Transferencia]
                                  ↓
┌─────────────────────────────────────────────────────────────┐
│  Formulario de Transferencia                                 │
│                                                              │
│  • Producto *                 [Shampoo Keratina ▼]          │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐│
│  │ Stock Actual:                                           ││
│  │ • Bodega:    50 unidades                               ││
│  │ • Vitrina:   12 unidades                               ││
│  └────────────────────────────────────────────────────────┘│
│                                                              │
│  • Ubicación Origen *         [Bodega ▼]                    │
│  • Ubicación Destino *        [Vitrina ▼]                   │
│  • Cantidad *                 [__________] unidades          │
│                                                              │
│  Notas:                                                      │
│  [Reposición semanal de vitrina]                            │
│                                                              │
│  [Cancelar]                        [Transferir]             │
└─────────────────────────────────────────────────────────────┘
                                  ↓
            [Validar stock disponible en origen]
                                  ↓
                    [POST /api/inventario/transferir]
                                  ↓
        ┌────────────────────────┴─────────────────────┐
        │                                               │
   [Éxito]                                         [Error]
        │                                               │
        ↓                                               ↓
[2 movimientos creados]              [Toast: "Stock insuficiente"]
[Stock actualizado]                  o [Toast: "Error..."]
[Toast: "Transferencia exitosa"]
[Actualizar vista de inventario]
```

---

## RESPONSIVE DESIGN

### Breakpoints

```typescript
// tailwind.config.ts - Breakpoints utilizados

export default {
  theme: {
    screens: {
      'sm': '640px',   // Móviles grandes
      'md': '768px',   // Tablets
      'lg': '1024px',  // Laptops
      'xl': '1280px',  // Desktops
      '2xl': '1536px'  // Pantallas grandes
    }
  }
}
```

### Adaptaciones por Dispositivo

#### Móvil (< 640px)
```
┌────────────────────┐
│  [☰] Inventario    │
├────────────────────┤
│                    │
│  [Buscar...   🔍]  │
│                    │
│  ┌──────────────┐  │
│  │ Producto 1   │  │
│  │ Stock: 50    │  │
│  │ $25.00       │  │
│  └──────────────┘  │
│                    │
│  ┌──────────────┐  │
│  │ Producto 2   │  │
│  │ Stock: 30    │  │
│  │ $35.00       │  │
│  └──────────────┘  │
│                    │
│  [< 1 2 3 >]       │
│                    │
│  [+ Nuevo]         │
└────────────────────┘
```

**Características móvil:**
- Vista de tarjetas en columna única
- Menú hamburguesa
- Botones de acción flotantes
- Formularios en pantalla completa
- Tablas se convierten en listas
- Filtros en modal/drawer

#### Tablet (640px - 1024px)
```
┌──────────────────────────────────┐
│  [☰] Inventario      [Buscar...] │
├──────────────────────────────────┤
│  Filtros: [Estado▼] [Proveedor▼]│
│                                   │
│  ┌────────┐ ┌────────┐           │
│  │ Prod 1 │ │ Prod 2 │           │
│  │ $25.00 │ │ $35.00 │           │
│  └────────┘ └────────┘           │
│                                   │
│  ┌────────┐ ┌────────┐           │
│  │ Prod 3 │ │ Prod 4 │           │
│  │ $45.00 │ │ $55.00 │           │
│  └────────┘ └────────┘           │
│                                   │
│  [< Anterior]  [Siguiente >]     │
│                     [+ Nuevo]     │
└──────────────────────────────────┘
```

**Características tablet:**
- Grid de 2 columnas
- Filtros visibles arriba
- Navegación completa
- Modales de tamaño medio

#### Desktop (> 1024px)
```
┌────────────────────────────────────────────────────────────────┐
│  [≡] Inventario               [Buscar...      🔍]  [+ Nuevo]   │
├────────────────────────────────────────────────────────────────┤
│  Filtros:  [Estado ▼] [Proveedor ▼] [Stock Bajo ☐] [Limpiar] │
│                                                                 │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐         │
│  │ Producto │ │ Producto │ │ Producto │ │ Producto │         │
│  │    1     │ │    2     │ │    3     │ │    4     │         │
│  │ Stock:50 │ │ Stock:30 │ │ Stock:15 │ │ Stock:8  │         │
│  │ $25.00   │ │ $35.00   │ │ $45.00   │ │ $55.00   │         │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘         │
│                                                                 │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐         │
│  │ Producto │ │ Producto │ │ Producto │ │ Producto │         │
│  │    5     │ │    6     │ │    7     │ │    8     │         │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘         │
│                                                                 │
│  [<< Primera] [< Anterior]  Página 2 de 10  [Siguiente >]     │
│                                                                 │
│  Vista: [Grid ✓] [Tabla]                                       │
└────────────────────────────────────────────────────────────────┘
```

**Características desktop:**
- Grid de 3-4 columnas
- Todos los filtros visibles
- Tabla completa disponible
- Sidebar persistente
- Tooltips y hovers
- Atajos de teclado

### Clases Responsive Comunes

```typescript
// Ejemplos de clases Tailwind responsive usadas

// Grid adaptativo
"grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"

// Padding adaptativo
"p-4 md:p-6 lg:p-8"

// Texto responsive
"text-sm md:text-base lg:text-lg"

// Ocultar en móvil
"hidden md:block"

// Mostrar solo en móvil
"block md:hidden"

// Flexbox adaptativo
"flex flex-col md:flex-row gap-4"

// Ancho adaptativo
"w-full md:w-1/2 lg:w-1/3"
```

---

## ACCESIBILIDAD

### Cumplimiento WCAG 2.1 AA

#### Navegación por Teclado

```typescript
// Ejemplo de manejo de teclado en ProductoCard

<div
  role="article"
  tabIndex={0}
  aria-labelledby={`producto-${producto.id}`}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      router.push(`/inventario/productos/${producto.id}`);
    }
  }}
  className="focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
>
  {/* Contenido */}
</div>
```

**Atajos de teclado implementados:**
- `Tab` - Navegación entre elementos
- `Enter` / `Space` - Activar elemento
- `Escape` - Cerrar modales/diálogos
- `Arrow Keys` - Navegación en tablas y listas
- `/` - Enfocar búsqueda (cuando disponible)

#### Etiquetas ARIA

```typescript
// Ejemplo de etiquetas ARIA correctas

// Select de proveedor
<Select aria-label="Seleccionar proveedor">
  <SelectTrigger aria-expanded={isOpen} aria-haspopup="listbox">
    <SelectValue placeholder="Seleccionar proveedor" />
  </SelectTrigger>
</Select>

// Botón de eliminar
<Button
  aria-label={`Eliminar producto ${producto.nombre}`}
  onClick={() => handleDelete(producto.id)}
>
  <Trash className="h-4 w-4" />
</Button>

// Estado de carga
<Button disabled={isLoading} aria-busy={isLoading}>
  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />}
  Guardar
</Button>

// Tabla
<Table role="table" aria-label="Lista de productos">
  <TableHeader role="rowgroup">
    <TableRow role="row">
      <TableHead role="columnheader">Nombre</TableHead>
    </TableRow>
  </TableHeader>
</Table>
```

#### Contraste de Colores

```typescript
// Colores que cumplen WCAG AA (contraste mínimo 4.5:1)

// Texto principal
"text-foreground" // Negro/Blanco según tema

// Texto secundario
"text-muted-foreground" // Gris con contraste suficiente

// Botones
"bg-primary text-primary-foreground" // Alto contraste

// Estados
"text-green-600 dark:text-green-400" // Verde accesible
"text-red-600 dark:text-red-400"     // Rojo accesible
"text-yellow-600 dark:text-yellow-400" // Amarillo accesible
```

#### Mensajes de Error

```typescript
// Asociación correcta de errores con campos

<FormField
  control={form.control}
  name="nombre"
  render={({ field, fieldState }) => (
    <FormItem>
      <FormLabel htmlFor="nombre">Nombre *</FormLabel>
      <FormControl>
        <Input
          id="nombre"
          aria-invalid={fieldState.invalid}
          aria-describedby={fieldState.error ? "nombre-error" : undefined}
          {...field}
        />
      </FormControl>
      {fieldState.error && (
        <FormMessage id="nombre-error" role="alert">
          {fieldState.error.message}
        </FormMessage>
      )}
    </FormItem>
  )}
/>
```

#### Lectores de Pantalla

```typescript
// Anuncios dinámicos con live regions

// Toast/Notificación
<div role="status" aria-live="polite" aria-atomic="true">
  Producto creado exitosamente
</div>

// Carga de datos
<div role="alert" aria-live="assertive" aria-busy="true">
  Cargando productos...
</div>

// Contador de resultados
<p aria-live="polite" aria-atomic="true">
  Mostrando {items.length} de {total} productos
</p>
```

---

## PRUEBAS

### Estrategia de Testing

#### 1. Unit Tests (Vitest + React Testing Library)

```typescript
// __tests__/components/ProductoCard.test.tsx

import { render, screen, fireEvent } from '@testing-library/react';
import { ProductoCard } from '@/components/inventario/productos/ProductoCard';
import { EstadoProducto } from '@/types/producto';

describe('ProductoCard', () => {
  const mockProducto = {
    id: 1,
    nombre: 'Shampoo Test',
    codigo: 'SH-001',
    precio_compra: 20.00,
    precio_venta: 35.00,
    stock_total: 50,
    stock_minimo: 10,
    margen_ganancia: 75,
    estado: EstadoProducto.ACTIVO,
    // ... otros campos
  };

  it('renderiza información del producto correctamente', () => {
    render(<ProductoCard producto={mockProducto} />);
    
    expect(screen.getByText('Shampoo Test')).toBeInTheDocument();
    expect(screen.getByText('SH-001')).toBeInTheDocument();
    expect(screen.getByText('$35.00')).toBeInTheDocument();
  });

  it('muestra badge de stock bajo cuando stock < stock_minimo', () => {
    const productoStockBajo = { ...mockProducto, stock_total: 5 };
    render(<ProductoCard producto={productoStockBajo} />);
    
    expect(screen.getByText(/stock bajo/i)).toBeInTheDocument();
  });

  it('navega al detalle cuando se hace clic', () => {
    const mockPush = vi.fn();
    vi.mock('next/navigation', () => ({
      useRouter: () => ({ push: mockPush })
    }));

    render(<ProductoCard producto={mockProducto} />);
    fireEvent.click(screen.getByRole('article'));
    
    expect(mockPush).toHaveBeenCalledWith(`/inventario/productos/${mockProducto.id}`);
  });

  it('es accesible por teclado', () => {
    const mockPush = vi.fn();
    render(<ProductoCard producto={mockProducto} />);
    
    const card = screen.getByRole('article');
    fireEvent.keyDown(card, { key: 'Enter' });
    
    expect(mockPush).toHaveBeenCalled();
  });
});
```

#### 2. Integration Tests

```typescript
// __tests__/integration/producto-crud.test.tsx

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ProductoForm } from '@/components/inventario/productos/ProductoForm';
import { server } from '@/test/mocks/server';
import { rest } from 'msw';

describe('Flujo CRUD de Productos', () => {
  const queryClient = new QueryClient();
  const wrapper = ({ children }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );

  it('crea un producto exitosamente', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    render(<ProductoForm onSubmit={onSubmit} />, { wrapper });

    // Llenar formulario
    await user.type(screen.getByLabelText(/nombre/i), 'Producto Test');
    await user.type(screen.getByLabelText(/precio de compra/i), '20.00');
    await user.type(screen.getByLabelText(/precio de venta/i), '35.00');

    // Enviar
    await user.click(screen.getByRole('button', { name: /crear/i }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalled();
    });
  });

  it('muestra errores de validación', async () => {
    const user = userEvent.setup();
    render(<ProductoForm onSubmit={vi.fn()} />, { wrapper });

    // Intentar enviar sin llenar campos requeridos
    await user.click(screen.getByRole('button', { name: /crear/i }));

    await waitFor(() => {
      expect(screen.getByText(/nombre es requerido/i)).toBeInTheDocument();
    });
  });

  it('maneja errores del servidor', async () => {
    server.use(
      rest.post('/api/productos', (req, res, ctx) => {
        return res(ctx.status(400), ctx.json({ detail: 'Código duplicado' }));
      })
    );

    const user = userEvent.setup();
    const onSubmit = vi.fn().mockRejectedValue(new Error('Código duplicado'));

    render(<ProductoForm onSubmit={onSubmit} />, { wrapper });

    // Llenar y enviar
    await user.type(screen.getByLabelText(/nombre/i), 'Producto Test');
    await user.click(screen.getByRole('button', { name: /crear/i }));

    await waitFor(() => {
      expect(screen.getByText(/código duplicado/i)).toBeInTheDocument();
    });
  });
});
```

#### 3. E2E Tests (Playwright)

```typescript
// e2e/inventario/productos.spec.ts

import { test, expect } from '@playwright/test';

test.describe('Gestión de Productos', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/inventario/productos');
  });

  test('flujo completo de creación de producto', async ({ page }) => {
    // Navegar a formulario de creación
    await page.click('text=Nuevo Producto');
    await expect(page).toHaveURL(/\/productos\/nuevo/);

    // Llenar formulario
    await page.fill('input[name="nombre"]', 'Shampoo E2E Test');
    await page.fill('input[name="codigo"]', 'E2E-001');
    await page.fill('input[name="precio_compra"]', '25.00');
    await page.fill('input[name="precio_venta"]', '45.00');

    // Verificar cálculo de margen
    await expect(page.locator('text=/80\\.0%/')).toBeVisible();

    // Enviar formulario
    await page.click('button[type="submit"]');

    // Verificar redirección y toast
    await expect(page).toHaveURL(/\/productos$/);
    await expect(page.locator('text=/producto creado/i')).toBeVisible();

    // Verificar que el producto aparece en la lista
    await expect(page.locator('text=Shampoo E2E Test')).toBeVisible();
  });

  test('búsqueda y filtrado de productos', async ({ page }) => {
    // Buscar producto
    await page.fill('input[placeholder*="Buscar"]', 'Shampoo');
    await page.waitForTimeout(500); // Debounce

    // Verificar resultados
    const productos = page.locator('[data-testid="producto-card"]');
    await expect(productos).toHaveCount(await productos.count());

    // Filtrar por estado
    await page.click('text=Estado');
    await page.click('text=Activo');

    // Verificar que solo muestra activos
    const badges = page.locator('text=/activo/i');
    const count = await badges.count();
    expect(count).toBeGreaterThan(0);
  });

  test('eliminación de producto con confirmación', async ({ page }) => {
    // Encontrar y hacer clic en menú de acciones
    const firstProduct = page.locator('[data-testid="producto-card"]').first();
    await firstProduct.hover();
    await firstProduct.locator('button[aria-label*="Acciones"]').click();

    // Hacer clic en eliminar
    await page.click('text=Eliminar');

    // Confirmar en el diálogo
    await expect(page.locator('text=/¿está seguro/i')).toBeVisible();
    await page.click('button:has-text("Eliminar")');

    // Verificar toast de éxito
    await expect(page.locator('text=/producto eliminado/i')).toBeVisible();
  });
});
```

### Coverage Goals

| Tipo de Test | Cobertura Objetivo |
|--------------|-------------------|
| Unit Tests | ≥ 80% |
| Integration Tests | ≥ 70% |
| E2E Tests | Flujos críticos |

### Scripts de Testing

```json
// package.json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui"
  }
}
```

---

## NOTAS FINALES

### Buenas Prácticas Implementadas

1. **Separación de Responsabilidades**
   - Componentes UI puros y reutilizables
   - Lógica de negocio en hooks personalizados
   - Estado global en Zustand stores
   - Validaciones en esquemas Zod

2. **Performance**
   - React Query para caching inteligente
   - Lazy loading de componentes pesados
   - Virtualización de listas largas (TanStack Virtual)
   - Optimización de imágenes con Next.js Image

3. **Seguridad**
   - Validación tanto en cliente como servidor
   - Sanitización de inputs
   - Manejo seguro de tokens
   - CORS configurado correctamente

4. **Mantenibilidad**
   - Código TypeScript fuertemente tipado
   - Documentación inline con JSDoc
   - Estructura de carpetas clara y escalable
   - Naming conventions consistentes

5. **Experiencia de Usuario**
   - Feedback inmediato en todas las acciones
   - Loading states en operaciones asíncronas
   - Mensajes de error claros y accionables
   - Confirmaciones en acciones destructivas

---

## CHECKLIST DE IMPLEMENTACIÓN

### Fase 1: Setup Inicial
- [ ] Configurar estructura de directorios
- [ ] Instalar dependencias
- [ ] Configurar Tailwind y shadcn/ui
- [ ] Configurar React Query
- [ ] Configurar Zustand stores
- [ ] Configurar Zod schemas

### Fase 2: Proveedores
- [ ] Implementar interfaces TypeScript
- [ ] Crear schemas de validación
- [ ] Desarrollar ProveedorForm
- [ ] Desarrollar ProveedorList
- [ ] Desarrollar ProveedorCard
- [ ] Implementar hooks de API
- [ ] Crear páginas

### Fase 3: Productos
- [ ] Implementar interfaces TypeScript
- [ ] Crear schemas de validación
- [ ] Desarrollar ProductoForm con tabs
- [ ] Desarrollar ProductoTable con TanStack
- [ ] Desarrollar ProductoCard
- [ ] Implementar ProductoImageUpload
- [ ] Implementar importación Excel
- [ ] Implementar actualización masiva de precios
- [ ] Implementar hooks de API
- [ ] Crear páginas

### Fase 4: Inventario
- [ ] Implementar interfaces de ubicaciones
- [ ] Desarrollar InventarioCard
- [ ] Desarrollar InventarioChart
- [ ] Desarrollar StockHistory
- [ ] Implementar hooks de API
- [ ] Crear páginas de consulta

### Fase 5: Movimientos
- [ ] Implementar interfaces TypeScript
- [ ] Crear schemas de validación
- [ ] Desarrollar MovimientoTable
- [ ] Desarrollar CompraForm
- [ ] Desarrollar TransferenciaForm
- [ ] Desarrollar AjusteForm
- [ ] Desarrollar ConteoFisicoForm
- [ ] Implementar hooks de API
- [ ] Crear páginas

### Fase 6: Reportes
- [ ] Desarrollar VentasProductosReport
- [ ] Desarrollar ComisionesReport
- [ ] Desarrollar ValoracionReport
- [ ] Implementar exportación Excel/PDF
- [ ] Implementar hooks de API
- [ ] Crear páginas

### Fase 7: Testing
- [ ] Escribir unit tests
- [ ] Escribir integration tests
- [ ] Escribir E2E tests
- [ ] Verificar cobertura

### Fase 8: Optimización
- [ ] Optimizar performance
- [ ] Verificar accesibilidad
- [ ] Optimizar responsive design
- [ ] Code review final

---

**Fin del Documento de Requerimientos Frontend - Módulo de Productos e Inventario**
