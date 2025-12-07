# Requerimientos Frontend - Módulo de Gestión de Clientes
## Club de Alisados - Next.js 14+

---

## ÍNDICE

1. [Resumen Ejecutivo](#resumen-ejecutivo)
2. [Arquitectura de Componentes](#arquitectura-de-componentes)
3. [Interfaces TypeScript](#interfaces-typescript)
4. [Schemas de Validación (Zod)](#schemas-de-validación-zod)
5. [Gestión de Estado](#gestión-de-estado)
6. [Especificación de Componentes](#especificación-de-componentes)
7. [Integración con API](#integración-con-api)
8. [Mockups ASCII](#mockups-ascii)
9. [Flujos de Usuario](#flujos-de-usuario)
10. [Consideraciones UX/UI](#consideraciones-uxui)
11. [Testing](#testing)

---

## RESUMEN EJECUTIVO

### Propósito
El módulo de Gestión de Clientes permite al personal del salón administrar toda la información de los clientes, incluyendo datos personales, preferencias, etiquetas de segmentación, historial de visitas y estadísticas. Es fundamental para la operación diaria del salón.

### Prioridad
**CRÍTICA** - Este módulo es dependencia de:
- Módulo de Agenda (las citas requieren cliente)
- Módulo de Punto de Venta (las facturas requieren cliente)
- Módulo de CRM (comunicaciones con cliente)

### Funcionalidades Principales

| Funcionalidad | Descripción | Prioridad |
|--------------|-------------|-----------|
| Lista de Clientes | Tabla con búsqueda, filtros y paginación | CRÍTICA |
| Crear Cliente | Formulario con validación completa | CRÍTICA |
| Ver Detalle | Vista completa de información del cliente | CRÍTICA |
| Editar Cliente | Formulario de edición | CRÍTICA |
| Gestión de Etiquetas | Sistema de etiquetas para segmentación | ALTA |
| Preferencias | Gestión de preferencias y alergias | ALTA |
| Historial | Ver historial de citas y facturas | ALTA |
| Estadísticas | Métricas de visitas y gastos | MEDIA |
| Exportación | Exportar lista a Excel | MEDIA |

### Stack Tecnológico

| Componente | Tecnología |
|-----------|------------|
| Framework | Next.js 14+ (App Router) |
| Lenguaje | TypeScript 5+ |
| UI Components | shadcn/ui + Radix UI |
| Validación | Zod |
| Estado | Zustand |
| Fetching | React Query (SWR) |
| Tablas | TanStack Table |
| Formularios | React Hook Form |
| Estilos | Tailwind CSS |

---

## ARQUITECTURA DE COMPONENTES

### Jerarquía de Componentes

```
app/
  clientes/
    page.tsx                         # Página principal - Lista de clientes
    nuevo/
      page.tsx                       # Página crear cliente
    [id]/
      page.tsx                       # Página detalle cliente
      editar/
        page.tsx                     # Página editar cliente

components/
  clientes/
    ClientesTabla.tsx                # Tabla principal con clientes
    ClientesFiltros.tsx              # Barra de filtros y búsqueda
    ClienteForm.tsx                  # Formulario crear/editar
    ClienteDetalle.tsx               # Vista detallada del cliente
    ClienteEstadisticas.tsx          # Tarjetas de estadísticas
    ClienteHistorial.tsx             # Historial de citas/facturas
    ClienteEtiquetas.tsx             # Gestión de etiquetas
    ClientePreferencias.tsx          # Formulario de preferencias
    ClienteExportar.tsx              # Botón y lógica de exportación
    ClienteQuickView.tsx             # Vista rápida en modal
    ClienteAvatar.tsx                # Avatar del cliente
    ClienteEstadoBadge.tsx           # Badge de estado activo/inactivo

  shared/
    DataTable.tsx                    # Tabla reutilizable genérica
    SearchInput.tsx                  # Input de búsqueda
    FilterBar.tsx                    # Barra de filtros
    Pagination.tsx                   # Componente de paginación
    ExportButton.tsx                 # Botón genérico exportar
    ConfirmDialog.tsx                # Diálogo de confirmación
```

### Rutas

| Ruta | Componente | Descripción |
|------|-----------|-------------|
| `/clientes` | `page.tsx` | Lista de clientes |
| `/clientes/nuevo` | `nuevo/page.tsx` | Crear nuevo cliente |
| `/clientes/[id]` | `[id]/page.tsx` | Ver detalle del cliente |
| `/clientes/[id]/editar` | `[id]/editar/page.tsx` | Editar cliente |

---

## INTERFACES TYPESCRIPT

### 1. Interfaces Principales

```typescript
// types/cliente.ts

/**
 * Cliente - Entidad principal
 */
export interface Cliente {
  id: number;
  nombre: string;
  apellido: string | null;
  nombre_completo: string;
  telefono: string | null;
  email: string | null;
  fecha_nacimiento: string | null; // ISO date
  direccion: string | null;
  notas: string | null;
  
  // Estadísticas automáticas
  fecha_primera_visita: string | null; // ISO date
  ultima_visita: string | null; // ISO date
  total_visitas: number;
  
  // Estado
  estado: 'activo' | 'inactivo';
  
  // Timestamps
  fecha_creacion: string; // ISO datetime
  fecha_actualizacion: string; // ISO datetime
  
  // Relaciones
  etiquetas?: ClienteEtiqueta[];
  preferencias?: ClientePreferencia;
}

/**
 * ClientePreferencia - Preferencias del cliente
 */
export interface ClientePreferencia {
  id: number;
  cliente_id: number;
  productos_favoritos: number[] | null; // Array de IDs de productos
  alergias: string | null;
  notas_servicio: string | null;
  fecha_actualizacion: string;
}

/**
 * ClienteEtiqueta - Etiqueta para segmentación
 */
export interface ClienteEtiqueta {
  id: number;
  nombre: string;
  color: string; // HEX color
  fecha_creacion: string;
}

/**
 * ClienteHistorialItem - Item del historial
 */
export interface ClienteHistorialItem {
  id: number;
  tipo: 'cita' | 'factura';
  fecha: string; // ISO datetime
  descripcion: string;
  monto?: number;
  estado?: string;
}

/**
 * ClienteEstadistica - Estadísticas del cliente
 */
export interface ClienteEstadistica {
  total_visitas: number;
  ultima_visita: string | null;
  fecha_primera_visita: string | null;
  servicios_mas_usados: Array<{
    servicio: string;
    cantidad: number;
  }>;
  citas_completadas: number;
  citas_canceladas: number;
  promedio_dias_entre_visitas: number | null;
}
```

### 2. DTOs (Data Transfer Objects)

```typescript
/**
 * ClienteCreateDTO - Para crear cliente
 */
export interface ClienteCreateDTO {
  nombre: string;
  apellido?: string;
  telefono?: string;
  email?: string;
  fecha_nacimiento?: string; // ISO date (YYYY-MM-DD)
  direccion?: string;
  notas?: string;
  etiquetas?: number[]; // IDs de etiquetas
  preferencias?: {
    alergias?: string;
    notas_servicio?: string;
    productos_favoritos?: number[];
  };
}

/**
 * ClienteUpdateDTO - Para actualizar cliente
 */
export interface ClienteUpdateDTO {
  nombre?: string;
  apellido?: string;
  telefono?: string;
  email?: string;
  fecha_nacimiento?: string;
  direccion?: string;
  notas?: string;
  estado?: 'activo' | 'inactivo';
}

/**
 * ClienteListQueryParams - Parámetros de búsqueda
 */
export interface ClienteListQueryParams {
  page?: number;
  per_page?: number;
  busqueda?: string;
  estado?: 'activo' | 'inactivo' | 'todos';
  etiquetas?: number[]; // Filtrar por etiquetas
  ordenar_por?: 'nombre' | 'fecha_creacion' | 'ultima_visita' | 'total_visitas';
  orden?: 'asc' | 'desc';
}

/**
 * ClienteListResponse - Respuesta paginada
 */
export interface ClienteListResponse {
  clientes: Cliente[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}
```

### 3. Form Types

```typescript
/**
 * ClienteFormData - Datos del formulario
 */
export interface ClienteFormData {
  nombre: string;
  apellido: string;
  telefono: string;
  email: string;
  fecha_nacimiento: Date | null;
  direccion: string;
  notas: string;
  etiquetas: number[];
  alergias: string;
  notas_servicio: string;
}

/**
 * EtiquetaFormData - Formulario crear etiqueta
 */
export interface EtiquetaFormData {
  nombre: string;
  color: string;
}
```

---

## SCHEMAS DE VALIDACIÓN (ZOD)

### 1. Schema Cliente

```typescript
// schemas/cliente.schema.ts
import { z } from 'zod';

/**
 * Validación de teléfono colombiano
 */
const telefonoSchema = z
  .string()
  .regex(/^\+57[0-9]{10}$/, {
    message: 'Teléfono debe tener formato +57XXXXXXXXXX (10 dígitos)'
  })
  .optional()
  .or(z.literal(''));

/**
 * Schema para crear/editar cliente
 */
export const clienteFormSchema = z.object({
  nombre: z
    .string()
    .min(2, 'Nombre debe tener al menos 2 caracteres')
    .max(100, 'Nombre debe tener máximo 100 caracteres')
    .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, {
      message: 'Nombre solo puede contener letras'
    }),
  
  apellido: z
    .string()
    .max(100, 'Apellido debe tener máximo 100 caracteres')
    .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]*$/, {
      message: 'Apellido solo puede contener letras'
    })
    .optional()
    .or(z.literal('')),
  
  telefono: telefonoSchema,
  
  email: z
    .string()
    .email('Email inválido')
    .max(100, 'Email debe tener máximo 100 caracteres')
    .optional()
    .or(z.literal('')),
  
  fecha_nacimiento: z
    .date()
    .max(new Date(), 'Fecha de nacimiento no puede ser futura')
    .nullable()
    .optional(),
  
  direccion: z
    .string()
    .max(500, 'Dirección debe tener máximo 500 caracteres')
    .optional()
    .or(z.literal('')),
  
  notas: z
    .string()
    .max(1000, 'Notas deben tener máximo 1000 caracteres')
    .optional()
    .or(z.literal('')),
  
  etiquetas: z
    .array(z.number())
    .optional()
    .default([]),
  
  alergias: z
    .string()
    .max(500, 'Alergias deben tener máximo 500 caracteres')
    .optional()
    .or(z.literal('')),
  
  notas_servicio: z
    .string()
    .max(1000, 'Notas de servicio deben tener máximo 1000 caracteres')
    .optional()
    .or(z.literal(''))
}).refine((data) => {
  // Al menos teléfono o email es requerido
  return data.telefono || data.email;
}, {
  message: 'Debe proporcionar al menos teléfono o email',
  path: ['telefono']
});

/**
 * Schema para etiqueta
 */
export const etiquetaFormSchema = z.object({
  nombre: z
    .string()
    .min(2, 'Nombre debe tener al menos 2 caracteres')
    .max(50, 'Nombre debe tener máximo 50 caracteres'),
  
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, {
      message: 'Color debe ser formato HEX válido (#RRGGBB)'
    })
});

/**
 * Type inference
 */
export type ClienteFormValues = z.infer<typeof clienteFormSchema>;
export type EtiquetaFormValues = z.infer<typeof etiquetaFormSchema>;
```

---

## GESTIÓN DE ESTADO

### 1. Zustand Store - Clientes

```typescript
// stores/useClienteStore.ts
import { create } from 'zustand';
import { Cliente, ClienteEtiqueta, ClienteListQueryParams } from '@/types/cliente';

interface ClienteState {
  // Lista de clientes
  clientes: Cliente[];
  clienteSeleccionado: Cliente | null;
  
  // Filtros y búsqueda
  filtros: ClienteListQueryParams;
  
  // Paginación
  page: number;
  totalPages: number;
  total: number;
  
  // Etiquetas disponibles
  etiquetasDisponibles: ClienteEtiqueta[];
  
  // Loading states
  isLoading: boolean;
  isLoadingEtiquetas: boolean;
  
  // UI State
  mostrarFiltros: boolean;
  vistaModal: 'detalle' | 'crear' | 'editar' | null;
  
  // Actions - Clientes
  setClientes: (clientes: Cliente[]) => void;
  setClienteSeleccionado: (cliente: Cliente | null) => void;
  agregarCliente: (cliente: Cliente) => void;
  actualizarCliente: (id: number, cliente: Partial<Cliente>) => void;
  eliminarCliente: (id: number) => void;
  
  // Actions - Filtros
  setFiltros: (filtros: Partial<ClienteListQueryParams>) => void;
  resetFiltros: () => void;
  
  // Actions - Paginación
  setPage: (page: number) => void;
  setPaginacion: (total: number, totalPages: number) => void;
  
  // Actions - Etiquetas
  setEtiquetasDisponibles: (etiquetas: ClienteEtiqueta[]) => void;
  agregarEtiqueta: (etiqueta: ClienteEtiqueta) => void;
  
  // Actions - UI
  setMostrarFiltros: (mostrar: boolean) => void;
  setVistaModal: (vista: 'detalle' | 'crear' | 'editar' | null) => void;
  
  // Actions - Loading
  setIsLoading: (isLoading: boolean) => void;
}

export const useClienteStore = create<ClienteState>((set) => ({
  // Estado inicial
  clientes: [],
  clienteSeleccionado: null,
  filtros: {
    page: 1,
    per_page: 20,
    estado: 'activo',
    ordenar_por: 'nombre',
    orden: 'asc'
  },
  page: 1,
  totalPages: 1,
  total: 0,
  etiquetasDisponibles: [],
  isLoading: false,
  isLoadingEtiquetas: false,
  mostrarFiltros: false,
  vistaModal: null,
  
  // Implementaciones
  setClientes: (clientes) => set({ clientes }),
  
  setClienteSeleccionado: (cliente) => set({ clienteSeleccionado: cliente }),
  
  agregarCliente: (cliente) => set((state) => ({
    clientes: [cliente, ...state.clientes],
    total: state.total + 1
  })),
  
  actualizarCliente: (id, clienteActualizado) => set((state) => ({
    clientes: state.clientes.map((c) =>
      c.id === id ? { ...c, ...clienteActualizado } : c
    ),
    clienteSeleccionado: state.clienteSeleccionado?.id === id
      ? { ...state.clienteSeleccionado, ...clienteActualizado }
      : state.clienteSeleccionado
  })),
  
  eliminarCliente: (id) => set((state) => ({
    clientes: state.clientes.filter((c) => c.id !== id),
    total: state.total - 1
  })),
  
  setFiltros: (filtros) => set((state) => ({
    filtros: { ...state.filtros, ...filtros },
    page: 1 // Reset page cuando cambian filtros
  })),
  
  resetFiltros: () => set({
    filtros: {
      page: 1,
      per_page: 20,
      estado: 'activo',
      ordenar_por: 'nombre',
      orden: 'asc'
    },
    page: 1
  }),
  
  setPage: (page) => set({ page }),
  
  setPaginacion: (total, totalPages) => set({ total, totalPages }),
  
  setEtiquetasDisponibles: (etiquetas) => set({ etiquetasDisponibles: etiquetas }),
  
  agregarEtiqueta: (etiqueta) => set((state) => ({
    etiquetasDisponibles: [...state.etiquetasDisponibles, etiqueta]
  })),
  
  setMostrarFiltros: (mostrar) => set({ mostrarFiltros: mostrar }),
  
  setVistaModal: (vista) => set({ vistaModal: vista }),
  
  setIsLoading: (isLoading) => set({ isLoading })
}));
```

---

## ESPECIFICACIÓN DE COMPONENTES

### 1. ClientesTabla Component

```typescript
// components/clientes/ClientesTabla.tsx
'use client';

import { useState } from 'react';
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef
} from '@tanstack/react-table';
import { Cliente } from '@/types/cliente';
import { ClienteAvatar } from './ClienteAvatar';
import { ClienteEstadoBadge } from './ClienteEstadoBadge';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Eye, Edit, Trash } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { formatearFecha } from '@/lib/utils';

interface ClientesTablaProps {
  clientes: Cliente[];
  onVerDetalle: (cliente: Cliente) => void;
  onEditar: (cliente: Cliente) => void;
  onEliminar: (cliente: Cliente) => void;
  isLoading?: boolean;
}

export function ClientesTabla({
  clientes,
  onVerDetalle,
  onEditar,
  onEliminar,
  isLoading = false
}: ClientesTablaProps) {
  const columns: ColumnDef<Cliente>[] = [
    {
      accessorKey: 'nombre_completo',
      header: 'Cliente',
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <ClienteAvatar
            nombre={row.original.nombre}
            apellido={row.original.apellido}
          />
          <div>
            <div className="font-medium">{row.original.nombre_completo}</div>
            <div className="text-sm text-muted-foreground">
              {row.original.telefono || row.original.email || 'Sin contacto'}
            </div>
          </div>
        </div>
      )
    },
    {
      accessorKey: 'etiquetas',
      header: 'Etiquetas',
      cell: ({ row }) => (
        <div className="flex gap-1 flex-wrap max-w-[200px]">
          {row.original.etiquetas?.slice(0, 3).map((etiqueta) => (
            <Badge
              key={etiqueta.id}
              variant="outline"
              style={{
                backgroundColor: `${etiqueta.color}20`,
                borderColor: etiqueta.color,
                color: etiqueta.color
              }}
            >
              {etiqueta.nombre}
            </Badge>
          ))}
          {row.original.etiquetas && row.original.etiquetas.length > 3 && (
            <Badge variant="outline">
              +{row.original.etiquetas.length - 3}
            </Badge>
          )}
        </div>
      )
    },
    {
      accessorKey: 'total_visitas',
      header: 'Visitas',
      cell: ({ row }) => (
        <div className="text-center">
          <div className="font-medium">{row.original.total_visitas}</div>
          {row.original.ultima_visita && (
            <div className="text-xs text-muted-foreground">
              Última: {formatearFecha(row.original.ultima_visita)}
            </div>
          )}
        </div>
      )
    },
    {
      accessorKey: 'estado',
      header: 'Estado',
      cell: ({ row }) => (
        <ClienteEstadoBadge estado={row.original.estado} />
      )
    },
    {
      id: 'acciones',
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onVerDetalle(row.original)}>
              <Eye className="mr-2 h-4 w-4" />
              Ver detalle
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onEditar(row.original)}>
              <Edit className="mr-2 h-4 w-4" />
              Editar
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onEliminar(row.original)}
              className="text-destructive"
            >
              <Trash className="mr-2 h-4 w-4" />
              Eliminar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    }
  ];

  const table = useReactTable({
    data: clientes,
    columns,
    getCoreRowModel: getCoreRowModel()
  });

  if (isLoading) {
    return <div>Cargando...</div>;
  }

  return (
    <div className="rounded-md border">
      <table className="w-full">
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id} className="border-b bg-muted/50">
              {headerGroup.headers.map((header) => (
                <th
                  key={header.id}
                  className="h-12 px-4 text-left align-middle font-medium"
                >
                  {flexRender(
                    header.column.columnDef.header,
                    header.getContext()
                  )}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr
              key={row.id}
              className="border-b transition-colors hover:bg-muted/50 cursor-pointer"
              onClick={() => onVerDetalle(row.original)}
            >
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id} className="p-4 align-middle">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      
      {clientes.length === 0 && (
        <div className="text-center py-10 text-muted-foreground">
          No se encontraron clientes
        </div>
      )}
    </div>
  );
}
```

### 2. ClienteForm Component

```typescript
// components/clientes/ClienteForm.tsx
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { clienteFormSchema, type ClienteFormValues } from '@/schemas/cliente.schema';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover';
import { CalendarIcon, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { ClienteEtiqueta } from '@/types/cliente';
import { MultiSelect } from '@/components/ui/multi-select';

interface ClienteFormProps {
  initialData?: Partial<ClienteFormValues>;
  etiquetasDisponibles: ClienteEtiqueta[];
  onSubmit: (data: ClienteFormValues) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  mode: 'create' | 'edit';
}

export function ClienteForm({
  initialData,
  etiquetasDisponibles,
  onSubmit,
  onCancel,
  isLoading = false,
  mode
}: ClienteFormProps) {
  const form = useForm<ClienteFormValues>({
    resolver: zodResolver(clienteFormSchema),
    defaultValues: {
      nombre: initialData?.nombre || '',
      apellido: initialData?.apellido || '',
      telefono: initialData?.telefono || '',
      email: initialData?.email || '',
      fecha_nacimiento: initialData?.fecha_nacimiento || null,
      direccion: initialData?.direccion || '',
      notas: initialData?.notas || '',
      etiquetas: initialData?.etiquetas || [],
      alergias: initialData?.alergias || '',
      notas_servicio: initialData?.notas_servicio || ''
    }
  });

  const handleSubmit = async (data: ClienteFormValues) => {
    try {
      await onSubmit(data);
    } catch (error) {
      console.error('Error al enviar formulario:', error);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {/* Información Personal */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Información Personal</h3>
          
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="nombre"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre *</FormLabel>
                  <FormControl>
                    <Input placeholder="Juan" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="apellido"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Apellido</FormLabel>
                  <FormControl>
                    <Input placeholder="Pérez" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="telefono"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Teléfono *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="+573001234567"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Formato: +57XXXXXXXXXX
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email *</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="cliente@email.com"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          <FormField
            control={form.control}
            name="fecha_nacimiento"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Fecha de Nacimiento</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className={cn(
                          'w-full pl-3 text-left font-normal',
                          !field.value && 'text-muted-foreground'
                        )}
                      >
                        {field.value ? (
                          format(field.value, 'PPP', { locale: es })
                        ) : (
                          <span>Seleccionar fecha</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value || undefined}
                      onSelect={field.onChange}
                      disabled={(date) =>
                        date > new Date() || date < new Date('1900-01-01')
                      }
                      initialFocus
                      locale={es}
                    />
                  </PopoverContent>
                </Popover>
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
                    placeholder="Calle 123 #45-67, Barrio X, Ciudad"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Etiquetas */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Segmentación</h3>
          
          <FormField
            control={form.control}
            name="etiquetas"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Etiquetas</FormLabel>
                <FormControl>
                  <MultiSelect
                    options={etiquetasDisponibles.map((etiqueta) => ({
                      value: etiqueta.id.toString(),
                      label: etiqueta.nombre,
                      color: etiqueta.color
                    }))}
                    selected={field.value.map(String)}
                    onChange={(values) => {
                      field.onChange(values.map(Number));
                    }}
                    placeholder="Seleccionar etiquetas..."
                  />
                </FormControl>
                <FormDescription>
                  Selecciona una o más etiquetas para segmentar al cliente
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Preferencias y Notas */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Preferencias y Notas</h3>
          
          <FormField
            control={form.control}
            name="alergias"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Alergias</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Alergias conocidas o sensibilidades..."
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="notas_servicio"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Notas de Servicio</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Preferencias de servicio, productos favoritos, etc..."
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
                <FormLabel>Notas Generales</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Notas adicionales sobre el cliente..."
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Botones de acción */}
        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {mode === 'create' ? 'Crear Cliente' : 'Guardar Cambios'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
```

### 3. ClientesFiltros Component

```typescript
// components/clientes/ClientesFiltros.tsx
'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Search, Filter, X } from 'lucide-react';
import { ClienteEtiqueta } from '@/types/cliente';
import { MultiSelect } from '@/components/ui/multi-select';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger
} from '@/components/ui/sheet';

interface ClientesFiltrosProps {
  busqueda: string;
  estado: string;
  etiquetasSeleccionadas: number[];
  etiquetasDisponibles: ClienteEtiqueta[];
  onBusquedaChange: (busqueda: string) => void;
  onEstadoChange: (estado: string) => void;
  onEtiquetasChange: (etiquetas: number[]) => void;
  onLimpiarFiltros: () => void;
}

export function ClientesFiltros({
  busqueda,
  estado,
  etiquetasSeleccionadas,
  etiquetasDisponibles,
  onBusquedaChange,
  onEstadoChange,
  onEtiquetasChange,
  onLimpiarFiltros
}: ClientesFiltrosProps) {
  const [open, setOpen] = useState(false);
  
  const hayFiltrosActivos =
    busqueda !== '' ||
    estado !== 'todos' ||
    etiquetasSeleccionadas.length > 0;

  return (
    <div className="flex items-center gap-4">
      {/* Búsqueda */}
      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nombre, teléfono o email..."
          value={busqueda}
          onChange={(e) => onBusquedaChange(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Estado */}
      <Select value={estado} onValueChange={onEstadoChange}>
        <SelectTrigger className="w-[150px]">
          <SelectValue placeholder="Estado" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="todos">Todos</SelectItem>
          <SelectItem value="activo">Activos</SelectItem>
          <SelectItem value="inactivo">Inactivos</SelectItem>
        </SelectContent>
      </Select>

      {/* Filtros avanzados */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="outline" size="icon">
            <Filter className="h-4 w-4" />
          </Button>
        </SheetTrigger>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Filtros Avanzados</SheetTitle>
            <SheetDescription>
              Refina tu búsqueda de clientes
            </SheetDescription>
          </SheetHeader>
          
          <div className="mt-6 space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">
                Etiquetas
              </label>
              <MultiSelect
                options={etiquetasDisponibles.map((etiqueta) => ({
                  value: etiqueta.id.toString(),
                  label: etiqueta.nombre,
                  color: etiqueta.color
                }))}
                selected={etiquetasSeleccionadas.map(String)}
                onChange={(values) => {
                  onEtiquetasChange(values.map(Number));
                }}
                placeholder="Seleccionar etiquetas..."
              />
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Limpiar filtros */}
      {hayFiltrosActivos && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onLimpiarFiltros}
        >
          <X className="h-4 w-4 mr-2" />
          Limpiar
        </Button>
      )}
    </div>
  );
}
```

### 4. ClienteDetalle Component

```typescript
// components/clientes/ClienteDetalle.tsx
'use client';

import { Cliente } from '@/types/cliente';
import { ClienteAvatar } from './ClienteAvatar';
import { ClienteEstadoBadge } from './ClienteEstadoBadge';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import {
  Phone,
  Mail,
  MapPin,
  Calendar,
  Edit,
  AlertCircle
} from 'lucide-react';
import { formatearFecha, formatearTelefono } from '@/lib/utils';

interface ClienteDetalleProps {
  cliente: Cliente;
  onEditar: () => void;
}

export function ClienteDetalle({ cliente, onEditar }: ClienteDetalleProps) {
  return (
    <div className="space-y-6">
      {/* Header con avatar y acciones */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <ClienteAvatar
            nombre={cliente.nombre}
            apellido={cliente.apellido}
            size="lg"
          />
          <div>
            <h2 className="text-2xl font-bold">{cliente.nombre_completo}</h2>
            <div className="flex items-center gap-2 mt-1">
              <ClienteEstadoBadge estado={cliente.estado} />
              {cliente.etiquetas?.map((etiqueta) => (
                <Badge
                  key={etiqueta.id}
                  variant="outline"
                  style={{
                    backgroundColor: `${etiqueta.color}20`,
                    borderColor: etiqueta.color,
                    color: etiqueta.color
                  }}
                >
                  {etiqueta.nombre}
                </Badge>
              ))}
            </div>
          </div>
        </div>
        
        <Button onClick={onEditar}>
          <Edit className="mr-2 h-4 w-4" />
          Editar
        </Button>
      </div>

      <Separator />

      {/* Información de contacto */}
      <Card>
        <CardHeader>
          <CardTitle>Información de Contacto</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {cliente.telefono && (
            <div className="flex items-center gap-3">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span>{formatearTelefono(cliente.telefono)}</span>
            </div>
          )}
          
          {cliente.email && (
            <div className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span>{cliente.email}</span>
            </div>
          )}
          
          {cliente.direccion && (
            <div className="flex items-start gap-3">
              <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
              <span>{cliente.direccion}</span>
            </div>
          )}
          
          {cliente.fecha_nacimiento && (
            <div className="flex items-center gap-3">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>
                Nacimiento: {formatearFecha(cliente.fecha_nacimiento)}
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Estadísticas de visitas */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Visitas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{cliente.total_visitas}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Primera Visita
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm">
              {cliente.fecha_primera_visita
                ? formatearFecha(cliente.fecha_primera_visita)
                : 'Sin visitas'}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Última Visita
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm">
              {cliente.ultima_visita
                ? formatearFecha(cliente.ultima_visita)
                : 'Sin visitas'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Preferencias y alergias */}
      {cliente.preferencias && (
        <>
          {cliente.preferencias.alergias && (
            <Card className="border-orange-200 bg-orange-50">
              <CardHeader>
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-orange-600" />
                  Alergias
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{cliente.preferencias.alergias}</p>
              </CardContent>
            </Card>
          )}
          
          {cliente.preferencias.notas_servicio && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">
                  Notas de Servicio
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{cliente.preferencias.notas_servicio}</p>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Notas generales */}
      {cliente.notas && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Notas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap">{cliente.notas}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
```

---

## INTEGRACIÓN CON API

### 1. API Client

```typescript
// lib/api/clientes.ts
import { apiClient } from './client';
import {
  Cliente,
  ClienteCreateDTO,
  ClienteUpdateDTO,
  ClienteListQueryParams,
  ClienteListResponse,
  ClienteEtiqueta,
  ClienteEstadistica
} from '@/types/cliente';

export const clientesApi = {
  /**
   * Listar clientes con filtros y paginación
   */
  list: async (params: ClienteListQueryParams): Promise<ClienteListResponse> => {
    const response = await apiClient.get('/clientes', { params });
    return response.data;
  },

  /**
   * Obtener un cliente por ID
   */
  getById: async (id: number): Promise<Cliente> => {
    const response = await apiClient.get(`/clientes/${id}`);
    return response.data;
  },

  /**
   * Crear nuevo cliente
   */
  create: async (data: ClienteCreateDTO): Promise<Cliente> => {
    const response = await apiClient.post('/clientes', data);
    return response.data;
  },

  /**
   * Actualizar cliente existente
   */
  update: async (id: number, data: ClienteUpdateDTO): Promise<Cliente> => {
    const response = await apiClient.put(`/clientes/${id}`, data);
    return response.data;
  },

  /**
   * Eliminar cliente (cambiar a inactivo)
   */
  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/clientes/${id}`);
  },

  /**
   * Buscar clientes
   */
  search: async (query: string): Promise<Cliente[]> => {
    const response = await apiClient.get('/clientes/buscar', {
      params: { q: query }
    });
    return response.data;
  },

  /**
   * Obtener estadísticas del cliente
   */
  getEstadisticas: async (id: number): Promise<ClienteEstadistica> => {
    const response = await apiClient.get(`/clientes/${id}/estadisticas`);
    return response.data;
  },

  /**
   * Exportar clientes a Excel
   */
  exportar: async (params: ClienteListQueryParams): Promise<Blob> => {
    const response = await apiClient.get('/clientes/exportar', {
      params,
      responseType: 'blob'
    });
    return response.data;
  },

  /**
   * Obtener historial del cliente
   */
  getHistorial: async (
    id: number,
    page: number = 1,
    perPage: number = 10
  ): Promise<any> => {
    const response = await apiClient.get(`/clientes/${id}/historial`, {
      params: { page, per_page: perPage }
    });
    return response.data;
  }
};

export const etiquetasApi = {
  /**
   * Listar todas las etiquetas
   */
  list: async (): Promise<ClienteEtiqueta[]> => {
    const response = await apiClient.get('/clientes/etiquetas');
    return response.data;
  },

  /**
   * Crear nueva etiqueta
   */
  create: async (data: {
    nombre: string;
    color: string;
  }): Promise<ClienteEtiqueta> => {
    const response = await apiClient.post('/clientes/etiquetas', data);
    return response.data;
  },

  /**
   * Actualizar etiqueta
   */
  update: async (
    id: number,
    data: { nombre?: string; color?: string }
  ): Promise<ClienteEtiqueta> => {
    const response = await apiClient.put(`/clientes/etiquetas/${id}`, data);
    return response.data;
  },

  /**
   * Eliminar etiqueta
   */
  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/clientes/etiquetas/${id}`);
  }
};
```

### 2. React Query Hooks

```typescript
// hooks/useClientes.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { clientesApi, etiquetasApi } from '@/lib/api/clientes';
import {
  ClienteCreateDTO,
  ClienteUpdateDTO,
  ClienteListQueryParams
} from '@/types/cliente';
import { toast } from 'sonner';

/**
 * Hook para listar clientes
 */
export function useClientes(params: ClienteListQueryParams) {
  return useQuery({
    queryKey: ['clientes', params],
    queryFn: () => clientesApi.list(params),
    staleTime: 30000 // 30 segundos
  });
}

/**
 * Hook para obtener un cliente
 */
export function useCliente(id: number) {
  return useQuery({
    queryKey: ['cliente', id],
    queryFn: () => clientesApi.getById(id),
    enabled: !!id
  });
}

/**
 * Hook para crear cliente
 */
export function useCrearCliente() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ClienteCreateDTO) => clientesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
      toast.success('Cliente creado exitosamente');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Error al crear cliente');
    }
  });
}

/**
 * Hook para actualizar cliente
 */
export function useActualizarCliente() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: ClienteUpdateDTO }) =>
      clientesApi.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
      queryClient.invalidateQueries({ queryKey: ['cliente', variables.id] });
      toast.success('Cliente actualizado exitosamente');
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.detail || 'Error al actualizar cliente'
      );
    }
  });
}

/**
 * Hook para eliminar cliente
 */
export function useEliminarCliente() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => clientesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
      toast.success('Cliente eliminado exitosamente');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Error al eliminar cliente');
    }
  });
}

/**
 * Hook para etiquetas disponibles
 */
export function useEtiquetas() {
  return useQuery({
    queryKey: ['etiquetas'],
    queryFn: () => etiquetasApi.list(),
    staleTime: 60000 // 1 minuto
  });
}

/**
 * Hook para crear etiqueta
 */
export function useCrearEtiqueta() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { nombre: string; color: string }) =>
      etiquetasApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['etiquetas'] });
      toast.success('Etiqueta creada exitosamente');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Error al crear etiqueta');
    }
  });
}

/**
 * Hook para exportar clientes
 */
export function useExportarClientes() {
  return useMutation({
    mutationFn: (params: ClienteListQueryParams) =>
      clientesApi.exportar(params),
    onSuccess: (blob) => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `clientes_${new Date().toISOString()}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Archivo exportado exitosamente');
    },
    onError: () => {
      toast.error('Error al exportar clientes');
    }
  });
}
```

---

## MOCKUPS ASCII

### 1. Lista de Clientes

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ Club de Alisados - Clientes                                      [Usuario ▼]│
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─ Clientes ──────────────────────────────────────────────────────────┐   │
│  │                                                                       │   │
│  │  [🔍 Buscar por nombre, teléfono o email...]  [Todos ▼] [🔧] [+ Nuevo] │
│  │                                                                       │   │
│  │  ┌───────────────────────────────────────────────────────────────┐ │   │
│  │  │ Cliente              Etiquetas       Visitas      Estado    ⋮ │ │   │
│  │  ├───────────────────────────────────────────────────────────────┤ │   │
│  │  │ 👤 María García      [VIP][Frecuente]    15      ● Activo   │ │   │
│  │  │    +573001234567     [Especial]      Últ: 15/11              │ │   │
│  │  │                                                                │ │   │
│  │  │ 👤 Juan Pérez        [Nuevo]              1      ● Activo   │ │   │
│  │  │    juan@email.com                    Últ: 20/11              │ │   │
│  │  │                                                                │ │   │
│  │  │ 👤 Ana Rodríguez     [VIP]               23      ● Activo   │ │   │
│  │  │    +573009876543                     Últ: 01/12              │ │   │
│  │  │                                                                │ │   │
│  │  │ 👤 Carlos López                            8      ○ Inactivo │ │   │
│  │  │    carlos@email.com                  Últ: 15/08              │ │   │
│  │  └───────────────────────────────────────────────────────────────┘ │   │
│  │                                                                       │   │
│  │  Mostrando 1-4 de 127 clientes           ◄ 1 2 3 ... 32 ►          │   │
│  │                                                          [Exportar]   │   │
│  └───────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2. Crear/Editar Cliente

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ Nuevo Cliente                                                    [✕ Cerrar] │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─ Información Personal ───────────────────────────────────────────┐      │
│  │                                                                    │      │
│  │  Nombre *                          Apellido                       │      │
│  │  [Juan________________]            [Pérez_______________]         │      │
│  │                                                                    │      │
│  │  Teléfono *                        Email *                        │      │
│  │  [+573001234567_______]            [juan@email.com______]         │      │
│  │  Formato: +57XXXXXXXXXX                                           │      │
│  │                                                                    │      │
│  │  Fecha de Nacimiento                                              │      │
│  │  [📅 15/05/1990 ▼_______________]                                 │      │
│  │                                                                    │      │
│  │  Dirección                                                         │      │
│  │  [Calle 123 #45-67________________]                               │      │
│  │  [Barrio Centro, Cali_____________]                               │      │
│  │                                                                    │      │
│  └────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  ┌─ Segmentación ──────────────────────────────────────────────────┐       │
│  │                                                                    │      │
│  │  Etiquetas                                                         │      │
│  │  [VIP] [Frecuente] [+ Agregar]                                   │      │
│  │  Selecciona una o más etiquetas para segmentar al cliente         │      │
│  │                                                                    │      │
│  └────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  ┌─ Preferencias y Notas ──────────────────────────────────────────┐       │
│  │                                                                    │      │
│  │  Alergias                                                          │      │
│  │  [Alérgico a ciertos químicos___]                                │      │
│  │  [________________________________]                                │      │
│  │                                                                    │      │
│  │  Notas de Servicio                                                 │      │
│  │  [Prefiere keratina suave________]                                │      │
│  │  [________________________________]                                │      │
│  │  [________________________________]                                │      │
│  │                                                                    │      │
│  │  Notas Generales                                                   │      │
│  │  [Cliente frecuente, muy puntual_]                                │      │
│  │  [________________________________]                                │      │
│  │                                                                    │      │
│  └────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  * Campos requeridos (al menos teléfono o email)                            │
│                                                                              │
│                                          [Cancelar]  [Crear Cliente]        │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 3. Detalle del Cliente

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ ← Volver a Clientes                                                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  👤  María García                              [Editar]             │   │
│  │                                                                       │   │
│  │      ● Activo   [VIP] [Frecuente] [Especial]                        │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│  ┌─ Información de Contacto ──────────────────────────────────────────┐    │
│  │  📞 +57 300 123 4567                                                │    │
│  │  ✉️  maria.garcia@email.com                                         │    │
│  │  📍 Calle 15 #102-45, Barrio Granada, Cali                          │    │
│  │  📅 Nacimiento: 15 de marzo de 1985                                 │    │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│  ┌───────────────────┬───────────────────┬───────────────────────┐         │
│  │  Total Visitas    │  Primera Visita   │   Última Visita       │         │
│  │       15          │   12/03/2023      │   15/11/2025          │         │
│  └───────────────────┴───────────────────┴───────────────────────┘         │
│                                                                              │
│  ┌─ ⚠️ Alergias ───────────────────────────────────────────────────────┐   │
│  │  Sensible a químicos fuertes, usar productos hipoalergénicos       │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│  ┌─ Notas de Servicio ────────────────────────────────────────────────┐    │
│  │  Prefiere keratina brasileña suave. Le gusta que le laven el       │    │
│  │  cabello con agua tibia. Siempre viene los viernes por la tarde.   │    │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│  ┌─ Notas ────────────────────────────────────────────────────────────┐    │
│  │  Cliente VIP desde 2023. Muy puntual. Recomienda el salón a        │    │
│  │  sus amigas frecuentemente.                                         │    │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│  ┌─ Historial Reciente ─────────────────────────────────────────────┐      │
│  │  [Citas] [Facturas]                                               │      │
│  │                                                                     │      │
│  │  15/11/2025  ✓ Cita completada - Alisado Brasileño      $180,000 │      │
│  │  30/10/2025  ✓ Cita completada - Tratamiento Capilar     $95,000 │      │
│  │  15/10/2025  ✓ Cita completada - Corte y Peinado         $45,000 │      │
│  │  01/10/2025  ✗ Cita cancelada - Alisado Brasileño                 │      │
│  │                                                                     │      │
│  │                                                   [Ver historial completo] │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## FLUJOS DE USUARIO

### 1. Flujo: Crear Nuevo Cliente

```
┌──────────────┐
│ Inicio       │
└──────┬───────┘
       │
       ▼
┌──────────────────────┐
│ Click "Nuevo Cliente"│
└──────┬───────────────┘
       │
       ▼
┌────────────────────────────┐
│ Abrir formulario           │
│ - Cargar etiquetas         │
└──────┬─────────────────────┘
       │
       ▼
┌────────────────────────────┐
│ Llenar información         │
│ - Nombre * (requerido)     │
│ - Teléfono o Email *       │
│ - Otros campos opcionales  │
└──────┬─────────────────────┘
       │
       ▼
┌────────────────────────────┐
│ Validación en tiempo real  │
│ - Formato teléfono         │
│ - Email válido             │
│ - Campos requeridos        │
└──────┬─────────────────────┘
       │
       ▼
┌────────────────────────────┐     No      ┌──────────────┐
│ ¿Validación exitosa?       ├────────────►│ Mostrar      │
└──────┬─────────────────────┘             │ errores      │
       │ Sí                                 └──────────────┘
       ▼
┌────────────────────────────┐
│ Click "Crear Cliente"      │
└──────┬─────────────────────┘
       │
       ▼
┌────────────────────────────┐
│ Loading...                 │
│ POST /api/clientes         │
└──────┬─────────────────────┘
       │
       ▼
┌────────────────────────────┐     Error   ┌──────────────┐
│ ¿Respuesta exitosa?        ├────────────►│ Toast error  │
└──────┬─────────────────────┘             │ Mantener     │
       │ Éxito                              │ formulario   │
       ▼                                    └──────────────┘
┌────────────────────────────┐
│ Toast: Cliente creado      │
│ Cerrar formulario          │
│ Recargar lista             │
│ Navegar a detalle          │
└──────┬─────────────────────┘
       │
       ▼
┌──────────────┐
│ Fin          │
└──────────────┘
```

### 2. Flujo: Búsqueda y Filtrado

```
┌──────────────┐
│ Inicio       │
└──────┬───────┘
       │
       ▼
┌────────────────────────────┐
│ Vista lista de clientes    │
└──────┬─────────────────────┘
       │
       ▼
┌────────────────────────────┐
│ Usuario ingresa búsqueda   │
│ - Debounce 300ms           │
└──────┬─────────────────────┘
       │
       ▼
┌────────────────────────────┐
│ Actualizar parámetros      │
│ - busqueda = texto         │
│ - page = 1 (reset)         │
└──────┬─────────────────────┘
       │
       ▼
┌────────────────────────────┐
│ React Query refetch        │
│ GET /api/clientes?busqueda=│
└──────┬─────────────────────┘
       │
       ▼
┌────────────────────────────┐
│ Actualizar tabla           │
│ - Mostrar resultados       │
│ - Loading state            │
└──────┬─────────────────────┘
       │
       ▼
┌────────────────────────────┐
│ Usuario aplica filtros     │
│ - Estado                   │
│ - Etiquetas                │
└──────┬─────────────────────┘
       │
       ▼
┌────────────────────────────┐
│ Actualizar parámetros      │
│ Refetch automático         │
└──────┬─────────────────────┘
       │
       ▼
┌──────────────┐
│ Fin          │
└──────────────┘
```

---

## CONSIDERACIONES UX/UI

### 1. Principios de Diseño

**Simplicidad**
- Formularios con campos claramente agrupados
- Validación en tiempo real con mensajes claros
- Máximo 3 clics para completar cualquier acción

**Feedback Inmediato**
- Toast notifications para todas las acciones
- Loading states claros
- Confirmaciones para acciones destructivas

**Accesibilidad**
- Todos los inputs con labels apropiados
- Navegación por teclado completa
- Contraste WCAG AA mínimo

### 2. Mensajes de Error

```typescript
// Mensajes claros y accionables
const errorMessages = {
  required: 'Este campo es requerido',
  invalidPhone: 'Formato inválido. Usa +57XXXXXXXXXX',
  invalidEmail: 'Email inválido',
  duplicateEmail: 'Este email ya está registrado',
  duplicatePhone: 'Este teléfono ya está registrado',
  networkError: 'Error de conexión. Intenta nuevamente',
  unauthorized: 'No tienes permiso para esta acción'
};
```

### 3. Estados de Carga

```typescript
// Loading states consistentes
interface LoadingStates {
  isLoadingList: boolean;      // Cargando lista
  isLoadingDetail: boolean;     // Cargando detalle
  isSubmitting: boolean;        // Enviando formulario
  isDeleting: boolean;          // Eliminando cliente
  isExporting: boolean;         // Exportando
}
```

### 4. Responsive Design

**Breakpoints**:
- Mobile: < 768px (1 columna, tabla vertical)
- Tablet: 768px - 1024px (2 columnas)
- Desktop: > 1024px (layout completo)

**Mobile-first**:
- Lista de tarjetas en móvil
- Tabla completa en desktop
- Filtros en modal lateral en móvil

---

## TESTING

### 1. Tests Unitarios

```typescript
// __tests__/components/ClienteForm.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ClienteForm } from '@/components/clientes/ClienteForm';

describe('ClienteForm', () => {
  const mockOnSubmit = jest.fn();
  const mockOnCancel = jest.fn();
  const etiquetas = [
    { id: 1, nombre: 'VIP', color: '#ff0000', fecha_creacion: '2025-01-01' }
  ];

  it('renderiza todos los campos', () => {
    render(
      <ClienteForm
        etiquetasDisponibles={etiquetas}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        mode="create"
      />
    );

    expect(screen.getByLabelText(/nombre/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/apellido/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/teléfono/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
  });

  it('valida campos requeridos', async () => {
    render(
      <ClienteForm
        etiquetasDisponibles={etiquetas}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        mode="create"
      />
    );

    const submitButton = screen.getByText('Crear Cliente');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/nombre.*requerido/i)).toBeInTheDocument();
    });

    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('valida formato de teléfono', async () => {
    render(
      <ClienteForm
        etiquetasDisponibles={etiquetas}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        mode="create"
      />
    );

    const telefonoInput = screen.getByLabelText(/teléfono/i);
    fireEvent.change(telefonoInput, { target: { value: '12345' } });
    fireEvent.blur(telefonoInput);

    await waitFor(() => {
      expect(screen.getByText(/formato.*\+57/i)).toBeInTheDocument();
    });
  });

  it('envía formulario correctamente', async () => {
    render(
      <ClienteForm
        etiquetasDisponibles={etiquetas}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        mode="create"
      />
    );

    fireEvent.change(screen.getByLabelText(/nombre/i), {
      target: { value: 'Juan' }
    });
    fireEvent.change(screen.getByLabelText(/teléfono/i), {
      target: { value: '+573001234567' }
    });

    const submitButton = screen.getByText('Crear Cliente');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          nombre: 'Juan',
          telefono: '+573001234567'
        })
      );
    });
  });
});
```

### 2. Tests de Integración

```typescript
// __tests__/integration/clientes.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ClientesPage } from '@/app/clientes/page';
import { server } from '@/mocks/server';
import { rest } from 'msw';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false }
  }
});

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

describe('Clientes Integration', () => {
  it('carga y muestra lista de clientes', async () => {
    server.use(
      rest.get('/api/clientes', (req, res, ctx) => {
        return res(
          ctx.json({
            clientes: [
              {
                id: 1,
                nombre: 'Juan',
                apellido: 'Pérez',
                nombre_completo: 'Juan Pérez',
                telefono: '+573001234567',
                email: 'juan@email.com',
                estado: 'activo',
                total_visitas: 5,
                fecha_creacion: '2025-01-01',
                fecha_actualizacion: '2025-01-01'
              }
            ],
            total: 1,
            page: 1,
            per_page: 20,
            total_pages: 1
          })
        );
      })
    );

    render(<ClientesPage />, { wrapper });

    await waitFor(() => {
      expect(screen.getByText('Juan Pérez')).toBeInTheDocument();
    });
  });

  it('maneja errores de red', async () => {
    server.use(
      rest.get('/api/clientes', (req, res, ctx) => {
        return res(ctx.status(500));
      })
    );

    render(<ClientesPage />, { wrapper });

    await waitFor(() => {
      expect(screen.getByText(/error/i)).toBeInTheDocument();
    });
  });
});
```

### 3. Cobertura de Tests

**Objetivo**: >80% de cobertura

**Áreas críticas a testear**:
- ✅ Validación de formularios
- ✅ Búsqueda y filtrado
- ✅ Paginación
- ✅ Acciones CRUD
- ✅ Manejo de errores
- ✅ Estados de carga
- ✅ Integración con API

---

## NOTAS FINALES

Este documento define la implementación completa del frontend del módulo de Gestión de Clientes para Club de Alisados. El módulo está diseñado para ser:

1. **Intuitivo**: Interfaz clara y fácil de usar
2. **Performante**: Optimizado con React Query y paginación
3. **Robusto**: Validaciones completas y manejo de errores
4. **Mantenible**: Código modular y bien documentado
5. **Accesible**: Cumple estándares WCAG AA
6. **Responsive**: Funciona en todos los dispositivos

### Próximos Pasos

1. Implementar componentes base (Avatar, Badge, etc.)
2. Crear store de Zustand
3. Implementar formulario con validaciones
4. Desarrollar tabla con filtros
5. Integrar con API backend
6. Escribir tests
7. Revisar UX con usuarios

**Versión**: 1.0  
**Fecha**: Diciembre 2025  
**Autor**: Equipo de Desarrollo Club de Alisados  
**Estado**: ✅ LISTO PARA IMPLEMENTACIÓN
