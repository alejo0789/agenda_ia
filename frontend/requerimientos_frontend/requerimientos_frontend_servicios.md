# Requerimientos de Frontend - Módulo de Servicios
## Club de Alisados - Stack: Next.js 14+ (App Router) + TypeScript

---

## Tabla de Contenido

1. [Gestión de Categorías de Servicios](#1-gestión-de-categorías-de-servicios)
2. [Gestión de Servicios](#2-gestión-de-servicios)
3. [Asignación de Comisiones a Especialistas](#3-asignación-de-comisiones-a-especialistas)
4. [Estados y Validaciones](#4-estados-y-validaciones)

---

# 1. GESTIÓN DE CATEGORÍAS DE SERVICIOS

## 1.1 Lista de Categorías

### Requisitos Funcionales

| ID | Requisito | Prioridad |
|----|-----------|-----------|
| FE-CATSER-001 | Mostrar lista de categorías con nombre, descripción y orden | Crítica |
| FE-CATSER-002 | Vista en tarjetas con color visual distintivo de categoría | Alta |
| FE-CATSER-003 | Contador de servicios activos por categoría | Alta |
| FE-CATSER-004 | Drag & drop para reordenar categorías | Alta |
| FE-CATSER-005 | Botón "Nueva Categoría" con permisos `servicios.crear` | Crítica |
| FE-CATSER-006 | Búsqueda en tiempo real por nombre | Media |
| FE-CATSER-007 | Filtros: Todas/Con servicios/Sin servicios | Media |
| FE-CATSER-008 | Acciones rápidas: Editar, Eliminar (con confirmación) | Crítica |
| FE-CATSER-009 | Vista responsive: grid en desktop, lista en mobile | Alta |
| FE-CATSER-010 | Indicador visual de guardar orden tras drag & drop | Alta |

### Componentes UI

```typescript
// Componente principal
<CategoriasListView />
  └─ <CategoriasGrid />
      ├─ <CategoriaCard />
      │   ├─ ColorIndicator (visual del color)
      │   ├─ ServiceCount (badge con número)
      │   └─ ActionButtons (editar, eliminar)
      └─ <EmptyState /> (cuando no hay categorías)
```

### Endpoints Consumidos

| Endpoint | Método | Uso |
|----------|--------|-----|
| `/api/categorias-servicio` | GET | Listar categorías |
| `/api/categorias-servicio` | POST | Crear categoría |
| `/api/categorias-servicio/{id}` | PUT | Actualizar |
| `/api/categorias-servicio/{id}` | DELETE | Eliminar |
| `/api/categorias-servicio/orden` | PUT | Guardar nuevo orden |

### Validaciones Frontend

| Campo | Validaciones |
|-------|-------------|
| Nombre | Requerido, min 2 caracteres, max 100, único |
| Descripción | Opcional, max 500 caracteres |
| Color | Formato HEX válido (#RRGGBB) |
| Orden | Número entero positivo |

---

## 1.2 Modal/Drawer de Crear/Editar Categoría

### Requisitos Funcionales

| ID | Requisito | Prioridad |
|----|-----------|-----------|
| FE-CATSER-011 | Modal responsive (drawer en mobile) | Crítica |
| FE-CATSER-012 | Formulario con: nombre, descripción, color | Crítica |
| FE-CATSER-013 | Color picker visual para selección de color | Alta |
| FE-CATSER-014 | Preview del color seleccionado en tiempo real | Media |
| FE-CATSER-015 | Validación en tiempo real con mensajes de error | Crítica |
| FE-CATSER-016 | Botones: Cancelar, Guardar (disabled si inválido) | Crítica |
| FE-CATSER-017 | Loading state durante guardado | Alta |
| FE-CATSER-018 | Notificación toast de éxito/error al guardar | Crítica |
| FE-CATSER-019 | Auto-focus en campo nombre al abrir | Media |
| FE-CATSER-020 | Cierre automático tras guardado exitoso | Alta |

### Estructura del Formulario

```typescript
interface CategoriaFormData {
  nombre: string;
  descripcion?: string;
  color: string; // HEX color
  orden?: number; // Auto-calculado en backend
}
```

### Componentes UI

```typescript
<CategoriaModal 
  mode="create" | "edit" 
  categoria={existingData} // solo en edit mode
  onSave={handleSave}
  onClose={handleClose}
/>
  ├─ <FormInput name="nombre" />
  ├─ <FormTextarea name="descripcion" />
  ├─ <ColorPicker value={color} onChange={setColor} />
  │   └─ ColorPreview (círculo con color actual)
  └─ <FormActions>
      ├─ <Button variant="outline">Cancelar</Button>
      └─ <Button type="submit" loading={isSaving}>Guardar</Button>
```

### Estados del Modal

| Estado | Comportamiento |
|--------|---------------|
| Idle | Formulario limpio, campos vacíos (create) o pre-llenados (edit) |
| Validating | Validación en tiempo real conforme se escribe |
| Saving | Muestra spinner en botón, deshabilita campos |
| Success | Toast verde, cierra modal, actualiza lista |
| Error | Toast rojo con mensaje, mantiene modal abierto |

---

## 1.3 Confirmación de Eliminación de Categoría

### Requisitos Funcionales

| ID | Requisito | Prioridad |
|----|-----------|-----------|
| FE-CATSER-021 | Dialog de confirmación antes de eliminar | Crítica |
| FE-CATSER-022 | Mostrar advertencia si categoría tiene servicios | Crítica |
| FE-CATSER-023 | Bloquear eliminación si hay servicios asociados | Crítica |
| FE-CATSER-024 | Mensaje claro: "Esta acción no se puede deshacer" | Alta |
| FE-CATSER-025 | Botones: Cancelar (outline), Eliminar (destructive red) | Crítica |

### Componente de Confirmación

```typescript
<AlertDialog>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>¿Eliminar categoría?</AlertDialogTitle>
      <AlertDialogDescription>
        {hasServices 
          ? "No puedes eliminar esta categoría porque tiene {count} servicios asociados."
          : "Esta acción no se puede deshacer. La categoría será eliminada permanentemente."
        }
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Cancelar</AlertDialogCancel>
      <AlertDialogAction 
        variant="destructive" 
        disabled={hasServices}
        onClick={handleDelete}
      >
        Eliminar
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

---

# 2. GESTIÓN DE SERVICIOS

## 2.1 Lista de Servicios

### Requisitos Funcionales

| ID | Requisito | Prioridad |
|----|-----------|-----------|
| FE-SER-001 | Vista en tabla con columnas configurables | Crítica |
| FE-SER-002 | Columnas: Nombre, Categoría, Duración, Precio, Estado | Crítica |
| FE-SER-003 | Badge visual de color según categoría | Alta |
| FE-SER-004 | Indicador de estado: Activo (verde), Inactivo (gris) | Alta |
| FE-SER-005 | Formato de precio con símbolo de moneda | Alta |
| FE-SER-006 | Formato de duración en horas:minutos (ej: 1h 30min) | Media |
| FE-SER-007 | Búsqueda global por nombre o descripción | Crítica |
| FE-SER-008 | Filtros: Por categoría, Por estado, Por rango de precio | Alta |
| FE-SER-009 | Ordenamiento por: Nombre, Precio, Duración | Media |
| FE-SER-010 | Paginación (10, 25, 50 por página) | Media |
| FE-SER-011 | Botón "Nuevo Servicio" con permisos `servicios.crear` | Crítica |
| FE-SER-012 | Acciones por fila: Ver, Editar, Activar/Desactivar | Crítica |
| FE-SER-013 | Indicador visual de especialistas asignados | Media |
| FE-SER-014 | Export a CSV/Excel con servicios filtrados | Baja |
| FE-SER-015 | Bulk actions: Activar/Desactivar múltiples servicios | Baja |

### Estructura de la Tabla

```typescript
interface ServicioTableRow {
  id: number;
  nombre: string;
  descripcion?: string;
  categoria: {
    id: number;
    nombre: string;
    color: string;
  };
  duracion: number; // en minutos
  precio: number;
  iva_incluido: boolean;
  estado: 'activo' | 'inactivo';
  especialistas_count?: number; // Contador de especialistas asignados
}
```

### Componentes UI

```typescript
<ServiciosListView />
  ├─ <TableToolbar>
  │   ├─ <SearchInput placeholder="Buscar servicios..." />
  │   ├─ <FilterCategory />
  │   ├─ <FilterStatus />
  │   ├─ <FilterPriceRange />
  │   └─ <Button>Nuevo Servicio</Button>
  ├─ <ServiciosTable>
  │   ├─ <TableHeader />
  │   └─ <TableBody>
  │       └─ <ServicioRow>
  │           ├─ <CategoryBadge color={categoria.color} />
  │           ├─ <StatusBadge estado={estado} />
  │           ├─ <PriceDisplay precio={precio} />
  │           └─ <RowActions>
  │               ├─ <Button variant="ghost">Ver</Button>
  │               ├─ <Button variant="ghost">Editar</Button>
  │               └─ <ToggleActivate />
  └─ <TablePagination />
```

### Endpoints Consumidos

| Endpoint | Método | Uso |
|----------|--------|-----|
| `/api/servicios` | GET | Listar servicios con filtros |
| `/api/servicios/{id}` | GET | Detalle de servicio |
| `/api/servicios` | POST | Crear servicio |
| `/api/servicios/{id}` | PUT | Actualizar |
| `/api/servicios/{id}` | DELETE | Desactivar |
| `/api/servicios/activos` | GET | Solo servicios activos (para agendamiento) |

### Parámetros de Query

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `search` | string | Búsqueda en nombre/descripción |
| `categoria_id` | number | Filtrar por categoría |
| `estado` | activo/inactivo | Filtrar por estado |
| `precio_min` | number | Precio mínimo |
| `precio_max` | number | Precio máximo |
| `page` | number | Número de página |
| `per_page` | number | Resultados por página |
| `sort_by` | nombre/precio/duracion | Campo de ordenamiento |
| `sort_order` | asc/desc | Dirección de ordenamiento |

---

## 2.2 Modal/Drawer de Crear/Editar Servicio

### Requisitos Funcionales

| ID | Requisito | Prioridad |
|----|-----------|-----------|
| FE-SER-016 | Modal en pantalla completa o drawer lateral | Crítica |
| FE-SER-017 | Formulario dividido en secciones: Información, Precios | Alta |
| FE-SER-018 | Campo nombre con validación de longitud | Crítica |
| FE-SER-019 | Select de categoría con colores visuales | Crítica |
| FE-SER-020 | Textarea para descripción (opcional) | Media |
| FE-SER-021 | Input de duración con selector de horas y minutos | Alta |
| FE-SER-022 | Validación: duración mínima 15 min, múltiplo de 15 | Crítica |
| FE-SER-023 | Input de precio con formato numérico y símbolo $ | Crítica |
| FE-SER-024 | Checkbox "IVA incluido" | Alta |
| FE-SER-025 | Cálculo automático de precio con/sin IVA | Media |
| FE-SER-026 | Toggle de estado activo/inactivo | Media |
| FE-SER-027 | Vista de especialistas asignados (solo lectura) | Media |
| FE-SER-028 | Link para ir a gestión de comisiones | Baja |
| FE-SER-029 | Validaciones en tiempo real | Crítica |
| FE-SER-030 | Botones: Cancelar, Guardar | Crítica |
| FE-SER-031 | Confirmación si hay cambios sin guardar al cerrar | Alta |

### Estructura del Formulario

```typescript
interface ServicioFormData {
  nombre: string;
  descripcion?: string;
  categoria_id: number;
  duracion: number; // minutos
  precio: number;
  iva_incluido: boolean;
  estado: 'activo' | 'inactivo';
}
```

### Componentes UI

```typescript
<ServicioFormModal 
  mode="create" | "edit"
  servicio={existingData}
  onSave={handleSave}
  onClose={handleClose}
/>
  ├─ <ScrollArea> (para formulario largo)
  ├─ <Section title="Información Básica">
  │   ├─ <FormInput name="nombre" />
  │   ├─ <FormSelect name="categoria_id">
  │   │   └─ Options con color badge
  │   └─ <FormTextarea name="descripcion" />
  ├─ <Section title="Duración y Precios">
  │   ├─ <DurationPicker 
  │   │     value={duracion} 
  │   │     onChange={setDuracion}
  │   │     step={15} // múltiplos de 15
  │   │   />
  │   ├─ <FormInput 
  │   │     name="precio" 
  │   │     type="number"
  │   │     prefix="$"
  │   │   />
  │   ├─ <FormCheckbox name="iva_incluido" />
  │   └─ <PriceBreakdown 
  │         precio={precio}
  │         iva_incluido={iva_incluido}
  │       />
  ├─ <Section title="Estado">
  │   └─ <FormSwitch name="estado" />
  ├─ <Section title="Especialistas Asignados" (solo en edit mode)>
  │   ├─ <EspecialistasAssignedList especialistas={especialistas} />
  │   └─ <Button variant="outline" onClick={goToComisiones}>
  │         Gestionar Comisiones
  │       </Button>
  └─ <FormActions>
      ├─ <Button variant="outline">Cancelar</Button>
      └─ <Button type="submit">Guardar</Button>
```

### Validaciones Frontend

| Campo | Validaciones |
|-------|-------------|
| Nombre | Requerido, min 3 caracteres, max 200 |
| Categoría | Requerido, debe existir |
| Duración | Requerido, mínimo 15, múltiplo de 15 |
| Precio | Requerido, >= 0, máximo 2 decimales |

### Lógica de Cálculo de IVA

```typescript
// Si IVA incluido = true
const precio_base = precio / (1 + IVA_RATE);
const iva_monto = precio - precio_base;

// Si IVA incluido = false
const precio_base = precio;
const iva_monto = precio * IVA_RATE;
const precio_total = precio + iva_monto;

// Componente visual
<PriceBreakdown>
  {iva_incluido ? (
    <>
      <div>Precio total: ${precio.toFixed(2)}</div>
      <div className="text-muted">
        Base: ${precio_base.toFixed(2)} + IVA: ${iva_monto.toFixed(2)}
      </div>
    </>
  ) : (
    <>
      <div>Precio base: ${precio.toFixed(2)}</div>
      <div className="text-muted">
        + IVA ({IVA_RATE * 100}%): ${iva_monto.toFixed(2)}
      </div>
      <div className="font-semibold">
        Total: ${precio_total.toFixed(2)}
      </div>
    </>
  )}
</PriceBreakdown>
```

---

## 2.3 Componente Duration Picker

### Requisitos Funcionales

| ID | Requisito | Prioridad |
|----|-----------|-----------|
| FE-SER-046 | Modal o página dedicada de solo lectura | Media |
| FE-SER-047 | Mostrar toda la información del servicio | Media |
| FE-SER-048 | Lista de especialistas asignados con tipo de comisión | Media |
| FE-SER-049 | Estadísticas: veces agendado, ingresos totales | Baja |
| FE-SER-050 | Link a gestión de comisiones | Media |
| FE-SER-051 | Botones: Editar, Cerrar | Media |

### Componente

```typescript
<ServicioDetailModal servicio={servicio}>
  <ModalHeader>
    <ModalTitle>{servicio.nombre}</ModalTitle>
    <StatusBadge estado={servicio.estado} />
  </ModalHeader>
  
  <ModalBody>
    <Section title="Información General">
      <DetailRow label="Categoría">
        <CategoryBadge categoria={servicio.categoria} />
      </DetailRow>
      <DetailRow label="Duración">
        {formatDuration(servicio.duracion)}
      </DetailRow>
      <DetailRow label="Precio">
        ${servicio.precio} {servicio.iva_incluido && "(IVA incluido)"}
      </DetailRow>
      {servicio.descripcion && (
        <DetailRow label="Descripción">
          {servicio.descripcion}
        </DetailRow>
      )}
    </Section>
    
    {servicio.especialistas && servicio.especialistas.length > 0 && (
      <Section title="Especialistas Asignados">
        <div className="space-y-2">
          {servicio.especialistas.map(esp => (
            <div key={esp.id} className="flex justify-between items-center p-2 border rounded">
              <span className="font-medium">{esp.nombre} {esp.apellido}</span>
              <Badge variant={esp.tipo_comision === 'porcentaje' ? 'default' : 'secondary'}>
                {esp.tipo_comision === 'porcentaje' 
                  ? `${esp.valor_comision}%` 
                  : `$${esp.valor_comision}`
                }
              </Badge>
            </div>
          ))}
        </div>
        <Button 
          variant="outline" 
          className="mt-4"
          onClick={goToComisiones}
        >
          Gestionar Comisiones
        </Button>
      </Section>
    )}
    
    {/* Secciones opcionales de estadísticas */}
  </ModalBody>
  
  <ModalFooter>
    <Button variant="outline" onClick={onClose}>Cerrar</Button>
    <Button onClick={onEdit}>Editar</Button>
  </ModalFooter>
</ServicioDetailModal>
```

---

# 3. ASIGNACIÓN DE COMISIONES A ESPECIALISTAS

## 3.1 Vista de Comisiones por Servicio

### Requisitos Funcionales

| ID | Requisito | Prioridad |
|----|-----------|-----------|
| FE-COMSER-001 | Acceso desde vista de detalle de servicio | Alta |
| FE-COMSER-002 | Tabla de especialistas con comisión asignada | Crítica |
| FE-COMSER-003 | Columnas: Especialista, Tipo Comisión, Valor, Acciones | Crítica |
| FE-COMSER-004 | Indicador visual de tipo: Porcentaje (%) o Fijo ($) | Alta |
| FE-COMSER-005 | Botón "Asignar Especialista" con permisos `servicios.editar` | Crítica |
| FE-COMSER-006 | Búsqueda de especialistas no asignados | Alta |
| FE-COMSER-007 | Edición inline de comisión existente | Alta |
| FE-COMSER-008 | Botón eliminar asignación | Alta |
| FE-COMSER-009 | Validación en tiempo real al editar | Alta |
| FE-COMSER-010 | Vista de cálculo: mostrar monto en pesos si es porcentaje | Media |

### Componentes UI

```typescript
<ComisionesServicioView servicioId={servicio.id}>
  <Card>
    <CardHeader>
      <CardTitle>Comisiones por Especialista</CardTitle>
      <CardDescription>
        {servicio.nombre} - Precio base: ${servicio.precio}
      </CardDescription>
    </CardHeader>
    <CardContent>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Especialista</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Valor</TableHead>
            <TableHead className="text-right">Comisión ($)</TableHead>
            <TableHead className="w-[100px]">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {comisiones.map(c => (
            <TableRow key={c.especialista_id}>
              <TableCell>
                <div className="font-medium">
                  {c.especialista_nombre} {c.especialista_apellido}
                </div>
              </TableCell>
              <TableCell>
                <Badge variant={c.tipo_comision === 'porcentaje' ? 'default' : 'secondary'}>
                  {c.tipo_comision === 'porcentaje' ? 'Porcentaje' : 'Fijo'}
                </Badge>
              </TableCell>
              <TableCell>
                <ComisionValueInput
                  tipo={c.tipo_comision}
                  value={c.valor_comision}
                  onChange={(val) => handleUpdate(c.especialista_id, val)}
                />
              </TableCell>
              <TableCell className="text-right font-medium">
                {calcularComisionPesos(c, servicio.precio)}
              </TableCell>
              <TableCell>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDelete(c.especialista_id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
          {comisiones.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-muted">
                No hay especialistas asignados a este servicio
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </CardContent>
    <CardFooter>
      <Button onClick={openAsignarModal}>
        <UserPlus className="mr-2 h-4 w-4" />
        Asignar Especialista
      </Button>
    </CardFooter>
  </Card>
</ComisionesServicioView>
```

### Endpoints Consumidos

| Endpoint | Método | Uso |
|----------|--------|-----|
| `/api/especialistas/{id}/servicios` | GET | Listar servicios con comisiones del especialista |
| `/api/especialistas/{id}/servicios` | POST | Asignar servicio a especialista |
| `/api/especialistas/{id}/servicios/{servicio_id}` | PUT | Actualizar comisión |
| `/api/especialistas/{id}/servicios/{servicio_id}` | DELETE | Quitar servicio |

---

## 3.2 Modal de Asignar Especialista

### Requisitos Funcionales

| ID | Requisito | Prioridad |
|----|-----------|-----------|
| FE-COMSER-011 | Dialog/Modal para asignar nuevo especialista | Crítica |
| FE-COMSER-012 | Select de especialistas disponibles (no asignados) | Crítica |
| FE-COMSER-013 | Radio buttons para tipo: Porcentaje / Fijo | Crítica |
| FE-COMSER-014 | Input de valor según tipo seleccionado | Crítica |
| FE-COMSER-015 | Preview de comisión en pesos en tiempo real | Alta |
| FE-COMSER-016 | Validación: porcentaje 0-100, fijo >= 0 | Crítica |
| FE-COMSER-017 | Advertencia si comisión fija > precio del servicio | Media |
| FE-COMSER-018 | Botones: Cancelar, Asignar | Crítica |

### Componente

```typescript
<AsignarEspecialistaModal
  servicio={servicio}
  especialistasDisponibles={especialistas}
  onAssign={handleAssign}
  onClose={handleClose}
>
  <DialogHeader>
    <DialogTitle>Asignar Especialista</DialogTitle>
    <DialogDescription>
      {servicio.nombre} - Precio: ${servicio.precio}
    </DialogDescription>
  </DialogHeader>
  
  <DialogBody>
    <Form onSubmit={handleSubmit}>
      <FormField name="especialista_id">
        <FormLabel>Especialista</FormLabel>
        <Select>
          <SelectTrigger>
            <SelectValue placeholder="Seleccionar especialista" />
          </SelectTrigger>
          <SelectContent>
            {especialistasDisponibles.map(esp => (
              <SelectItem key={esp.id} value={esp.id}>
                {esp.nombre} {esp.apellido}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FormField>
      
      <FormField name="tipo_comision">
        <FormLabel>Tipo de Comisión</FormLabel>
        <RadioGroup value={tipoComision} onValueChange={setTipoComision}>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="porcentaje" id="porcentaje" />
            <Label htmlFor="porcentaje">Porcentaje (%)</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="fijo" id="fijo" />
            <Label htmlFor="fijo">Valor Fijo ($)</Label>
          </div>
        </RadioGroup>
      </FormField>
      
      <FormField name="valor_comision">
        <FormLabel>
          {tipoComision === 'porcentaje' ? 'Porcentaje (%)' : 'Valor Fijo ($)'}
        </FormLabel>
        <Input
          type="number"
          step={tipoComision === 'porcentaje' ? '0.01' : '1'}
          min="0"
          max={tipoComision === 'porcentaje' ? '100' : undefined}
          value={valorComision}
          onChange={(e) => setValorComision(e.target.value)}
          prefix={tipoComision === 'fijo' ? '$' : undefined}
          suffix={tipoComision === 'porcentaje' ? '%' : undefined}
        />
      </FormField>
      
      <Alert>
        <Calculator className="h-4 w-4" />
        <AlertTitle>Vista previa de comisión</AlertTitle>
        <AlertDescription>
          El especialista recibirá:{' '}
          <span className="font-semibold">
            ${calcularComisionPreview(tipoComision, valorComision, servicio.precio)}
          </span>
          {' '}por cada servicio realizado
          {tipoComision === 'fijo' && valorComision > servicio.precio && (
            <div className="text-destructive mt-2">
              ⚠️ La comisión fija es mayor al precio del servicio
            </div>
          )}
        </AlertDescription>
      </Alert>
    </Form>
  </DialogBody>
  
  <DialogFooter>
    <Button variant="outline" onClick={onClose}>Cancelar</Button>
    <Button type="submit" onClick={handleSubmit}>Asignar</Button>
  </DialogFooter>
</AsignarEspecialistaModal>
```

### Estructura de Datos

```typescript
interface ComisionEspecialista {
  especialista_id: number;
  especialista_nombre: string;
  especialista_apellido: string;
  tipo_comision: 'porcentaje' | 'fijo';
  valor_comision: number;
}

interface AsignarComisionFormData {
  especialista_id: number;
  tipo_comision: 'porcentaje' | 'fijo';
  valor_comision: number;
}
```

### Lógica de Cálculo de Comisión

```typescript
// Función para calcular comisión en pesos
const calcularComisionPesos = (
  comision: ComisionEspecialista,
  precioServicio: number
): string => {
  if (comision.tipo_comision === 'porcentaje') {
    return ((precioServicio * comision.valor_comision) / 100).toFixed(2);
  }
  return comision.valor_comision.toFixed(2);
};

// Preview en tiempo real
const calcularComisionPreview = (
  tipo: 'porcentaje' | 'fijo',
  valor: number,
  precioServicio: number
): string => {
  if (tipo === 'porcentaje') {
    return ((precioServicio * valor) / 100).toFixed(2);
  }
  return valor.toFixed(2);
};
```

---

## 3.3 Edición Inline de Comisión

### Requisitos Funcionales

| ID | Requisito | Prioridad |
|----|-----------|-----------|
| FE-COMSER-019 | Click en valor de comisión para editar inline | Alta |
| FE-COMSER-020 | Input numérico con validaciones | Crítica |
| FE-COMSER-021 | Botones: Guardar (✓), Cancelar (✕) | Alta |
| FE-COMSER-022 | Auto-guardado al presionar Enter | Media |
| FE-COMSER-023 | Cancelar al presionar Escape | Media |
| FE-COMSER-024 | Loading state durante guardado | Alta |
| FE-COMSER-025 | Revertir a valor anterior si error | Alta |

### Componente

```typescript
const ComisionValueInput = ({ 
  tipo, 
  value, 
  onChange 
}: {
  tipo: 'porcentaje' | 'fijo';
  value: number;
  onChange: (value: number) => void;
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const [isSaving, setIsSaving] = useState(false);
  
  const handleSave = async () => {
    if (editValue === value) {
      setIsEditing(false);
      return;
    }
    
    setIsSaving(true);
    try {
      await onChange(editValue);
      setIsEditing(false);
    } catch (error) {
      setEditValue(value); // Revertir
      toast.error('Error al actualizar comisión');
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleCancel = () => {
    setEditValue(value);
    setIsEditing(false);
  };
  
  if (!isEditing) {
    return (
      <div 
        className="cursor-pointer hover:bg-muted rounded px-2 py-1"
        onClick={() => setIsEditing(true)}
      >
        {tipo === 'porcentaje' ? `${value}%` : `$${value}`}
      </div>
    );
  }
  
  return (
    <div className="flex items-center gap-1">
      <Input
        type="number"
        step={tipo === 'porcentaje' ? '0.01' : '1'}
        min="0"
        max={tipo === 'porcentaje' ? '100' : undefined}
        value={editValue}
        onChange={(e) => setEditValue(parseFloat(e.target.value))}
        onKeyDown={(e) => {
          if (e.key === 'Enter') handleSave();
          if (e.key === 'Escape') handleCancel();
        }}
        className="w-24"
        autoFocus
        disabled={isSaving}
      />
      <Button
        size="icon"
        variant="ghost"
        onClick={handleSave}
        disabled={isSaving}
      >
        {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
      </Button>
      <Button
        size="icon"
        variant="ghost"
        onClick={handleCancel}
        disabled={isSaving}
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
};
```

---

## 3.4 Vista desde Módulo de Especialistas

### Requisitos Funcionales

| ID | Requisito | Prioridad |
|----|-----------|-----------|
| FE-COMSER-026 | Pestaña "Servicios" en perfil de especialista | Alta |
| FE-COMSER-027 | Tabla de servicios asignados con comisión | Crítica |
| FE-COMSER-028 | Botón "Agregar Servicio" | Alta |
| FE-COMSER-029 | Búsqueda de servicios no asignados | Alta |
| FE-COMSER-030 | Edición de comisión desde esta vista | Alta |
| FE-COMSER-031 | Estadísticas: Total servicios, Comisión promedio | Media |

### Componente

```typescript
<EspecialistaServiciosTab especialistaId={especialista.id}>
  <Card>
    <CardHeader>
      <div className="flex justify-between items-center">
        <div>
          <CardTitle>Servicios Asignados</CardTitle>
          <CardDescription>
            {servicios.length} servicios con comisión configurada
          </CardDescription>
        </div>
        <Button onClick={openAgregarServicio}>
          <Plus className="mr-2 h-4 w-4" />
          Agregar Servicio
        </Button>
      </div>
    </CardHeader>
    
    <CardContent>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Servicio</TableHead>
            <TableHead>Categoría</TableHead>
            <TableHead>Precio</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Valor</TableHead>
            <TableHead className="text-right">Comisión ($)</TableHead>
            <TableHead>Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {servicios.map(s => (
            <TableRow key={s.servicio_id}>
              <TableCell className="font-medium">{s.nombre}</TableCell>
              <TableCell>
                <CategoryBadge categoria={s.categoria} />
              </TableCell>
              <TableCell>${s.precio}</TableCell>
              <TableCell>
                <Badge variant={s.tipo_comision === 'porcentaje' ? 'default' : 'secondary'}>
                  {s.tipo_comision}
                </Badge>
              </TableCell>
              <TableCell>
                <ComisionValueInput
                  tipo={s.tipo_comision}
                  value={s.valor_comision}
                  onChange={(val) => handleUpdateComision(s.servicio_id, val)}
                />
              </TableCell>
              <TableCell className="text-right font-medium">
                ${calcularComisionPesos(s)}
              </TableCell>
              <TableCell>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRemoveServicio(s.servicio_id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </CardContent>
    
    <CardFooter>
      <div className="flex gap-4 text-sm text-muted-foreground">
        <div>
          Comisión promedio (porcentaje): {calcularPromedioComision()}%
        </div>
      </div>
    </CardFooter>
  </Card>
</EspecialistaServiciosTab>
```

---

## 3.5 Búsqueda de Servicios para Asignar

### Requisitos Funcionales

| ID | Requisito | Prioridad |
|----|-----------|-----------|
| FE-COMSER-032 | Combobox con búsqueda de servicios | Alta |
| FE-COMSER-033 | Mostrar solo servicios activos | Crítica |
| FE-COMSER-034 | Filtrar servicios ya asignados | Crítica |
| FE-COMSER-035 | Display: nombre, categoría, precio | Media |
| FE-COMSER-036 | Agrupación por categoría | Baja |

### Componente

```typescript
<ServicioSearchCombobox
  especialistaId={especialista.id}
  excludeIds={serviciosAsignados.map(s => s.servicio_id)}
  onSelect={handleSelectServicio}
>
  <ComboboxTrigger>
    <Search className="mr-2 h-4 w-4" />
    Buscar servicio para agregar
  </ComboboxTrigger>
  
  <ComboboxContent>
    <ComboboxInput placeholder="Buscar servicio..." />
    <ComboboxList>
      {serviciosPorCategoria.map(categoria => (
        <ComboboxGroup key={categoria.id} heading={categoria.nombre}>
          {categoria.servicios.map(servicio => (
            <ComboboxItem key={servicio.id} value={servicio}>
              <div className="flex justify-between w-full">
                <span>{servicio.nombre}</span>
                <span className="text-muted">${servicio.precio}</span>
              </div>
            </ComboboxItem>
          ))}
        </ComboboxGroup>
      ))}
    </ComboboxList>
  </ComboboxContent>
</ServicioSearchCombobox>
```

---

# 4. ESTADOS Y VALIDACIONES

## 4.1 Validaciones de Negocio (Frontend)

| Regla | Validación | Mensaje de Error |
|-------|------------|------------------|
| RN-SER-001 | Duración mínima 15 minutos | "La duración mínima debe ser 15 minutos" |
| RN-SER-002 | Duración múltiplo de 15 | "La duración debe ser múltiplo de 15 minutos" |
| RN-SER-003 | Precio >= 0 | "El precio no puede ser negativo" |
| RN-SER-004 | Color HEX válido | "Formato de color inválido. Use formato #RRGGBB" |
| RN-SER-005 | Categoría no eliminable con servicios | "No se puede eliminar una categoría con servicios asociados" |

### Implementación con Zod

```typescript
import { z } from 'zod';

// Schema de Categoría
export const categoriaSchema = z.object({
  nombre: z.string()
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(100, "El nombre no puede exceder 100 caracteres"),
  descripcion: z.string()
    .max(500, "La descripción no puede exceder 500 caracteres")
    .optional(),
  color: z.string()
    .regex(/^#[0-9A-F]{6}$/i, "Formato de color inválido. Use #RRGGBB"),
});

// Schema de Servicio
export const servicioSchema = z.object({
  nombre: z.string()
    .min(3, "El nombre debe tener al menos 3 caracteres")
    .max(200, "El nombre no puede exceder 200 caracteres"),
  descripcion: z.string()
    .max(500, "La descripción no puede exceder 500 caracteres")
    .optional(),
  categoria_id: z.number({
    required_error: "Debe seleccionar una categoría"
  }).positive("Seleccione una categoría válida"),
  duracion: z.number()
    .min(15, "La duración mínima es 15 minutos")
    .refine(
      (val) => val % 15 === 0,
      "La duración debe ser múltiplo de 15 minutos"
    ),
  precio: z.number()
    .min(0, "El precio no puede ser negativo")
    .refine(
      (val) => Number.isFinite(val) && val.toFixed(2) === val.toString(),
      "El precio debe tener máximo 2 decimales"
    ),
  iva_incluido: z.boolean(),
  estado: z.enum(['activo', 'inactivo']),
});
```

---

## 4.2 Estados de Loading y Error

### Estados de la Lista de Servicios

| Estado | Componente a Mostrar |
|--------|---------------------|
| Loading inicial | Skeleton de tabla (5-10 filas) |
| Loading paginación | Spinner en el paginador |
| Error de carga | Alert con mensaje y botón "Reintentar" |
| Sin resultados (filtros) | "No se encontraron servicios con los filtros aplicados" |
| Sin servicios (vacío) | EmptyState con ilustración y botón "Crear primer servicio" |

### Componentes de Loading

```typescript
// Skeleton para tabla de servicios
<ServiciosTableSkeleton>
  {[...Array(10)].map((_, i) => (
    <TableRow key={i}>
      <TableCell><Skeleton className="h-4 w-48" /></TableCell>
      <TableCell><Skeleton className="h-6 w-24" /></TableCell>
      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
      <TableCell><Skeleton className="h-6 w-16" /></TableCell>
      <TableCell><Skeleton className="h-8 w-20" /></TableCell>
    </TableRow>
  ))}
</ServiciosTableSkeleton>

// EmptyState para lista vacía
<EmptyState
  icon={<Package className="h-12 w-12" />}
  title="No hay servicios registrados"
  description="Comienza creando tu primer servicio para el salón"
  action={
    <Button onClick={openCreateModal}>
      <Plus className="mr-2 h-4 w-4" />
      Crear primer servicio
    </Button>
  }
/>

// Error state
<ErrorState
  title="Error al cargar servicios"
  description={error.message}
  action={
    <Button onClick={retry} variant="outline">
      <RefreshCw className="mr-2 h-4 w-4" />
      Reintentar
    </Button>
  }
/>
```

---

## 4.3 Notificaciones Toast

### Eventos que Disparan Toasts

| Evento | Tipo | Mensaje |
|--------|------|---------|
| Categoría creada | Success | "Categoría '{nombre}' creada exitosamente" |
| Categoría actualizada | Success | "Categoría actualizada exitosamente" |
| Categoría eliminada | Success | "Categoría eliminada" |
| Error al crear categoría | Error | "Error al crear categoría: {detalle}" |
| Servicio creado | Success | "Servicio '{nombre}' creado exitosamente" |
| Servicio actualizado | Success | "Servicio actualizado exitosamente" |
| Servicio activado | Success | "Servicio activado" |
| Servicio desactivado | Success | "Servicio desactivado" |
| Error al guardar servicio | Error | "Error al guardar servicio: {detalle}" |
| Error de validación | Warning | "Por favor corrige los errores en el formulario" |
| Orden de categorías guardado | Success | "Orden de categorías actualizado" |

### Implementación

```typescript
import { toast } from 'sonner';

// Success toast
toast.success("Servicio creado exitosamente", {
  description: servicio.nombre,
  duration: 3000,
});

// Error toast
toast.error("Error al guardar servicio", {
  description: error.message,
  action: {
    label: "Reintentar",
    onClick: handleRetry,
  },
});

// Warning toast
toast.warning("Revisa los campos del formulario", {
  description: "Hay errores de validación",
});
```

---

## 4.4 Responsive Design

### Breakpoints

| Dispositivo | Breakpoint | Adaptaciones |
|-------------|-----------|--------------|
| Mobile | < 640px | Lista de cards en lugar de tabla, drawer en lugar de modal |
| Tablet | 640px - 1024px | Tabla con columnas reducidas, modal estándar |
| Desktop | > 1024px | Tabla completa, modal grande |

### Adaptaciones Móviles

```typescript
// Lista de servicios en mobile
<MobileServiciosList className="md:hidden">
  {servicios.map(servicio => (
    <ServicioCard key={servicio.id}>
      <CardHeader>
        <div className="flex justify-between">
          <CardTitle>{servicio.nombre}</CardTitle>
          <StatusBadge estado={servicio.estado} />
        </div>
        <CategoryBadge categoria={servicio.categoria} />
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <span className="text-muted">Duración:</span>
            <div className="font-medium">{formatDuration(servicio.duracion)}</div>
          </div>
          <div>
            <span className="text-muted">Precio:</span>
            <div className="font-medium">${servicio.precio}</div>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button variant="outline" size="sm" onClick={() => viewDetails(servicio)}>
          Ver detalles
        </Button>
        <Button variant="outline" size="sm" onClick={() => edit(servicio)}>
          Editar
        </Button>
      </CardFooter>
    </ServicioCard>
  ))}
</MobileServiciosList>

// Tabla en desktop
<DesktopServiciosTable className="hidden md:table">
  {/* Tabla estándar */}
</DesktopServiciosTable>
```

---

## 4.5 Permisos y Acciones

### Matriz de Permisos

| Acción | Permiso Requerido | Componente Afectado |
|--------|------------------|---------------------|
| Ver lista de servicios | `servicios.ver` | ServiciosListView |
| Ver detalle de servicio | `servicios.ver` | ServicioDetailModal |
| Crear servicio | `servicios.crear` | Botón "Nuevo Servicio" |
| Editar servicio | `servicios.editar` | Botón "Editar", ServicioFormModal |
| Activar/Desactivar | `servicios.editar` | Toggle de estado |
| Eliminar servicio | `servicios.eliminar` | Botón "Eliminar" |
| Ver categorías | `servicios.ver` | CategoriasListView |
| Crear categoría | `servicios.crear` | Botón "Nueva Categoría" |
| Editar categoría | `servicios.editar` | Botón "Editar", CategoriaModal |
| Eliminar categoría | `servicios.eliminar` | Botón "Eliminar" |

### Hook de Permisos

```typescript
import { useAuth } from '@/lib/hooks/useAuth';

const ServiciosListView = () => {
  const { hasPermission } = useAuth();
  
  const canCreate = hasPermission('servicios.crear');
  const canEdit = hasPermission('servicios.editar');
  const canDelete = hasPermission('servicios.eliminar');
  
  return (
    <div>
      {canCreate && (
        <Button onClick={openCreateModal}>
          Nuevo Servicio
        </Button>
      )}
      
      <ServiciosTable>
        {/* ... */}
        <RowActions>
          {canEdit && <EditButton />}
          {canDelete && <DeleteButton />}
        </RowActions>
      </ServiciosTable>
    </div>
  );
};
```

---

## 4.6 Manejo de Estado Global

### Store de Servicios (Zustand)

```typescript
import { create } from 'zustand';

interface ServiciosStore {
  servicios: Servicio[];
  categorias: Categoria[];
  filters: {
    search: string;
    categoria_id?: number;
    estado?: 'activo' | 'inactivo';
    precio_min?: number;
    precio_max?: number;
  };
  pagination: {
    page: number;
    per_page: number;
    total: number;
  };
  
  // Actions
  setServicios: (servicios: Servicio[]) => void;
  setCategorias: (categorias: Categoria[]) => void;
  setFilters: (filters: Partial<ServiciosStore['filters']>) => void;
  setPagination: (pagination: Partial<ServiciosStore['pagination']>) => void;
  resetFilters: () => void;
}

export const useServiciosStore = create<ServiciosStore>((set) => ({
  servicios: [],
  categorias: [],
  filters: {
    search: '',
  },
  pagination: {
    page: 1,
    per_page: 25,
    total: 0,
  },
  
  setServicios: (servicios) => set({ servicios }),
  setCategorias: (categorias) => set({ categorias }),
  setFilters: (filters) => set((state) => ({
    filters: { ...state.filters, ...filters }
  })),
  setPagination: (pagination) => set((state) => ({
    pagination: { ...state.pagination, ...pagination }
  })),
  resetFilters: () => set({
    filters: { search: '' },
    pagination: { page: 1, per_page: 25, total: 0 }
  }),
}));
```

---

## 4.7 API Client

### Hook de React Query

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { serviciosApi } from '@/lib/api/servicios';

// Hook para listar servicios
export const useServicios = (filters: ServiciosFilters) => {
  return useQuery({
    queryKey: ['servicios', filters],
    queryFn: () => serviciosApi.list(filters),
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
};

// Hook para crear servicio
export const useCreateServicio = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: serviciosApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['servicios'] });
      toast.success('Servicio creado exitosamente');
    },
    onError: (error) => {
      toast.error('Error al crear servicio', {
        description: error.message,
      });
    },
  });
};

// Hook para actualizar servicio
export const useUpdateServicio = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: ServicioFormData }) =>
      serviciosApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['servicios'] });
      toast.success('Servicio actualizado exitosamente');
    },
    onError: (error) => {
      toast.error('Error al actualizar servicio', {
        description: error.message,
      });
    },
  });
};

// Hook para listar categorías
export const useCategorias = () => {
  return useQuery({
    queryKey: ['categorias'],
    queryFn: serviciosApi.listCategorias,
    staleTime: 1000 * 60 * 10, // 10 minutos
  });
};
```

### API Client

```typescript
import axios from '@/lib/axios';

export const serviciosApi = {
  // Servicios
  list: async (params: ServiciosParams) => {
    const { data } = await axios.get('/api/servicios', { params });
    return data;
  },
  
  get: async (id: number) => {
    const { data } = await axios.get(`/api/servicios/${id}`);
    return data;
  },
  
  create: async (servicio: ServicioFormData) => {
    const { data } = await axios.post('/api/servicios', servicio);
    return data;
  },
  
  update: async (id: number, servicio: ServicioFormData) => {
    const { data } = await axios.put(`/api/servicios/${id}`, servicio);
    return data;
  },
  
  delete: async (id: number) => {
    const { data } = await axios.delete(`/api/servicios/${id}`);
    return data;
  },
  
  // Categorías
  listCategorias: async () => {
    const { data } = await axios.get('/api/categorias-servicio');
    return data;
  },
  
  createCategoria: async (categoria: CategoriaFormData) => {
    const { data } = await axios.post('/api/categorias-servicio', categoria);
    return data;
  },
  
  updateCategoria: async (id: number, categoria: CategoriaFormData) => {
    const { data } = await axios.put(`/api/categorias-servicio/${id}`, categoria);
    return data;
  },
  
  deleteCategoria: async (id: number) => {
    const { data } = await axios.delete(`/api/categorias-servicio/${id}`);
    return data;
  },
  
  updateCategoriaOrden: async (orden: { id: number; orden: number }[]) => {
    const { data } = await axios.put('/api/categorias-servicio/orden', { orden });
    return data;
  },
};
```

---

## 4.8 Tipos TypeScript

```typescript
// types/servicio.ts

export interface Categoria {
  id: number;
  nombre: string;
  descripcion?: string;
  color: string;
  orden: number;
  servicios_count?: number;
  created_at: string;
  updated_at: string;
}

export interface Servicio {
  id: number;
  nombre: string;
  descripcion?: string;
  categoria_id: number;
  categoria: {
    id: number;
    nombre: string;
    color: string;
  };
  duracion: number; // minutos
  precio: number;
  iva_incluido: boolean;
  estado: 'activo' | 'inactivo';
  especialistas?: EspecialistaServicio[];
  created_at: string;
  updated_at: string;
}

export interface EspecialistaServicio {
  especialista_id: number;
  nombre: string;
  apellido: string;
  tipo_comision: 'porcentaje' | 'fijo';
  valor_comision: number;
}

export interface CategoriaFormData {
  nombre: string;
  descripcion?: string;
  color: string;
}

export interface ServicioFormData {
  nombre: string;
  descripcion?: string;
  categoria_id: number;
  duracion: number;
  precio: number;
  iva_incluido: boolean;
  estado: 'activo' | 'inactivo';
}

export interface ServiciosFilters {
  search?: string;
  categoria_id?: number;
  estado?: 'activo' | 'inactivo';
  precio_min?: number;
  precio_max?: number;
  page?: number;
  per_page?: number;
  sort_by?: 'nombre' | 'precio' | 'duracion';
  sort_order?: 'asc' | 'desc';
}

export interface ComisionEspecialista {
  especialista_id: number;
  especialista_nombre: string;
  especialista_apellido: string;
  tipo_comision: 'porcentaje' | 'fijo';
  valor_comision: number;
}

export interface AsignarComisionFormData {
  especialista_id: number;
  tipo_comision: 'porcentaje' | 'fijo';
  valor_comision: number;
}
```

---

## 4.9 Testing Considerations

### Tests Unitarios

```typescript
// Ejemplo de test para DurationPicker
describe('DurationPicker', () => {
  it('debe validar duración mínima de 15 minutos', () => {
    render(<DurationPicker value={10} onChange={vi.fn()} />);
    expect(screen.getByText(/mínima es 15 minutos/)).toBeInTheDocument();
  });
  
  it('debe validar múltiplos de 15', () => {
    render(<DurationPicker value={20} onChange={vi.fn()} />);
    expect(screen.getByText(/múltiplo de 15/)).toBeInTheDocument();
  });
});

// Test para validación de servicio
describe('servicioSchema', () => {
  it('debe rechazar precio negativo', () => {
    const result = servicioSchema.safeParse({
      nombre: 'Test',
      categoria_id: 1,
      duracion: 30,
      precio: -10,
      iva_incluido: true,
      estado: 'activo',
    });
    
    expect(result.success).toBe(false);
  });
});
```

---

## 5. RESUMEN DE COMPONENTES PRINCIPALES

### Jerarquía de Componentes

```
app/(dashboard)/servicios/
├─ page.tsx (Lista principal)
│   └─ ServiciosListView
│       ├─ TableToolbar
│       │   ├─ SearchInput
│       │   ├─ FilterCategory
│       │   ├─ FilterStatus
│       │   └─ NewServiceButton
│       ├─ ServiciosTable (desktop)
│       │   └─ ServicioRow
│       │       └─ RowActions
│       ├─ MobileServiciosList (mobile)
│       │   └─ ServicioCard
│       └─ TablePagination
│
├─ [id]/comisiones/
│   └─ page.tsx (Gestión de comisiones)
│       └─ ComisionesServicioView
│           ├─ ComisionesTable
│           │   └─ ComisionValueInput
│           ├─ AsignarEspecialistaModal
│           └─ ServicioSearchCombobox
│
├─ components/
│   ├─ ServicioFormModal
│   │   ├─ BasicInfoSection
│   │   │   ├─ FormInput (nombre)
│   │   │   ├─ CategorySelect
│   │   │   └─ FormTextarea (descripción)
│   │   ├─ PricingSection
│   │   │   ├─ DurationPicker
│   │   │   ├─ PriceInput
│   │   │   ├─ IvaCheckbox
│   │   │   └─ PriceBreakdown
│   │   ├─ EspecialistasAssignedSection (edit mode)
│   │   │   ├─ EspecialistasAssignedList
│   │   │   └─ ManageComisionesButton
│   │   └─ FormActions
│   │
│   ├─ ServicioDetailModal
│   │   ├─ BasicInfoDisplay
│   │   ├─ PricingDisplay
│   │   └─ EspecialistasDisplay
│   │
│   ├─ ComisionesManagement
│   │   ├─ ComisionesTable
│   │   ├─ ComisionValueInput (edición inline)
│   │   ├─ AsignarEspecialistaModal
│   │   └─ EspecialistaSearchCombobox
│   │
│   ├─ CategoriaFormModal
│   │   ├─ FormInput (nombre)
│   │   ├─ FormTextarea (descripción)
│   │   ├─ ColorPicker
│   │   └─ FormActions
│   │
│   └─ CategoriasManagement
│       ├─ CategoriasGrid
│       │   └─ CategoriaCard
│       │       ├─ ColorIndicator
│       │       ├─ ServiceCount
│       │       └─ ActionButtons
│       └─ NewCategoryButton
```

---

## 6. FLUJOS DE USUARIO

### 6.1 Crear Nueva Categoría

1. Usuario hace clic en "Nueva Categoría"
2. Se abre modal/drawer
3. Usuario ingresa nombre
4. Selecciona color con color picker
5. Opcionalmente agrega descripción
6. Hace clic en "Guardar"
7. Validación frontend
8. Request POST a `/api/categorias-servicio`
9. Si éxito:
   - Toast de confirmación
   - Modal se cierra
   - Lista se actualiza
10. Si error:
    - Toast de error
    - Modal permanece abierto
    - Mensajes de error en campos

### 6.2 Crear Nuevo Servicio

1. Usuario hace clic en "Nuevo Servicio"
2. Se abre modal/drawer de formulario
3. Completa información básica:
   - Nombre del servicio
   - Selecciona categoría
   - Descripción (opcional)
4. Configura duración y precio:
   - Selecciona horas y minutos
   - Ingresa precio
   - Marca si IVA incluido
   - Ve preview de cálculo
5. Opcionalmente agrega productos consumidos:
   - Busca producto
   - Ingresa cantidad
   - Agrega a lista
   - Puede agregar múltiples
6. Define estado (activo/inactivo)
7. Hace clic en "Guardar"
8. Validación completa del formulario
9. Request POST a `/api/servicios`
10. Si éxito:
    - Toast de confirmación
    - Modal se cierra
    - Lista se actualiza con nuevo servicio
11. Si error:
    - Toast de error
    - Mensajes específicos en campos con error

### 6.3 Editar Servicio Existente

1. Usuario hace clic en "Editar" de un servicio
2. Se abre modal con datos pre-cargados
3. Modifica campos necesarios
4. Si cambia productos:
   - Puede eliminar existentes
   - Puede agregar nuevos
5. Hace clic en "Guardar"
6. Validación de cambios
7. Request PUT a `/api/servicios/{id}`
8. Actualización en lista

### 6.4 Activar/Desactivar Servicio

1. Usuario hace toggle de estado en la fila
2. Confirmación rápida (opcional)
3. Request PUT a `/api/servicios/{id}`
4. Badge de estado se actualiza visualmente
5. Toast de confirmación

---

## 7. CONSIDERACIONES DE UX

### 7.1 Feedback Visual

- **Estados de carga**: Skeletons durante carga inicial, spinners para acciones
- **Confirmaciones destructivas**: Siempre dialog de confirmación para eliminar
- **Validación en tiempo real**: Mostrar errores conforme el usuario escribe
- **Optimistic updates**: Actualizar UI antes de confirmación del servidor (con rollback en error)
- **Indicadores de progreso**: Para formularios largos, mostrar pasos completados

### 7.2 Accesibilidad

- **Keyboard navigation**: Todas las acciones accesibles por teclado
- **ARIA labels**: En todos los botones de acción
- **Focus management**: Focus automático en campos principales al abrir modales
- **Screen reader**: Anuncios de cambios importantes (toasts)
- **Contraste de colores**: Asegurar WCAG AA compliance

### 7.3 Performance

- **Debounce en búsqueda**: 300ms de delay
- **Paginación**: Cargar máximo 50 items por página
- **Lazy loading**: Componentes pesados cargados bajo demanda
- **Memoización**: React.memo en componentes de lista
- **Virtual scrolling**: Para listas muy largas (>100 items)

---

## 8. INTEGRACIONES CON OTROS MÓDULOS

### Módulo de Agenda

- Selector de servicios al crear cita usa `/api/servicios/activos`
- Mostrar duración del servicio seleccionado
- Calcular hora fin automáticamente
- Filtrar servicios por especialista asignado

### Módulo de Punto de Venta

- Agregar servicios a factura
- Mostrar precio del servicio
- Descontar productos consumidos de inventario
- Calcular comisiones de especialistas

### Módulo de Inventario

- Validar existencia de productos al asociar
- Mostrar advertencia si stock bajo
- Link directo a producto desde tabla de consumidos

### Módulo de Reportes

- Servicios más vendidos
- Ingresos por categoría de servicio
- Promedio de duración por servicio
- Tasa de conversión de servicios

---

## 9. MEJORAS FUTURAS (Nice to Have)

- **Duplicar servicio**: Botón para crear copia de servicio existente
- **Import/Export**: CSV de servicios y categorías
- **Paquetes de servicios**: Combos con precio especial
- **Historial de precios**: Ver cambios históricos de precio
- **Servicios destacados**: Flag para mostrar en app móvil
- **Imágenes de servicios**: Upload de foto representativa
- **Servicios temporales**: Servicios de temporada con fecha inicio/fin
- **Recomendaciones**: IA para sugerir servicios basado en historial del cliente

---

## 10. CHECKLIST DE IMPLEMENTACIÓN

### Fase 1: Categorías (Sprint 1)
- [ ] Crear página de categorías
- [ ] Implementar lista con drag & drop
- [ ] Modal de crear/editar categoría
- [ ] Color picker funcional
- [ ] Validaciones de categoría
- [ ] Confirmación de eliminación
- [ ] API integration completa
- [ ] Tests unitarios

### Fase 2: Servicios Básico (Sprint 2)
- [ ] Crear página de servicios
- [ ] Tabla de servicios con filtros
- [ ] Modal de crear/editar servicio
- [ ] Sección de información básica
- [ ] Sección de precios
- [ ] Duration picker
- [ ] Validaciones completas
- [ ] API integration

### Fase 3: Comisiones de Especialistas (Sprint 3)
- [ ] Vista de comisiones por servicio
- [ ] Tabla de especialistas asignados
- [ ] Modal de asignar especialista
- [ ] Edición inline de comisiones
- [ ] Cálculo en tiempo real de comisiones
- [ ] Integración con módulo de especialistas
- [ ] Vista desde perfil de especialista

### Fase 4: Mejoras y Polish (Sprint 4)
- [ ] Vista de detalle de servicio
- [ ] Responsive design completo
- [ ] Optimizaciones de performance
- [ ] Accesibilidad completa
- [ ] Testing E2E
- [ ] Documentación de componentes

---

## 11. MÉTRICAS DE ÉXITO

| Métrica | Objetivo |
|---------|----------|
| Tiempo de carga inicial | < 2 segundos |
| Tiempo de guardado de servicio | < 1 segundo |
| Búsqueda responsiva | < 300ms |
| Tasa de error en formularios | < 5% |
| Accesibilidad WCAG | AA compliance |
| Cobertura de tests | > 80% |
| Mobile usability score | > 90/100 |

---

## NOTAS FINALES

Este documento de requerimientos está diseñado para ser implementado con Next.js 14+, TypeScript y las librerías modernas del ecosistema React. La estructura modular y componentizada permite desarrollo incremental y fácil mantenimiento.

Para cualquier duda o aclaración sobre algún requerimiento, referirse a los documentos de backend y base de datos complementarios.

**Versión**: 1.0  
**Fecha**: Diciembre 2025  
**Autor**: Equipo de Desarrollo Club de Alisados
