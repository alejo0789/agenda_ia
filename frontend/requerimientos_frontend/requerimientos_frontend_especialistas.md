# Requerimientos Frontend - Módulo de Especialistas
## Sistema Club de Alisados - Next.js 14+ TypeScript

---

## Índice
1. [Visión General](#visión-general)
2. [Lista de Especialistas](#lista-de-especialistas)
3. [Crear/Editar Especialista](#crear-editar-especialista)
4. [Gestión de Horarios](#gestión-de-horarios)
5. [Gestión de Bloqueos](#gestión-de-bloqueos)
6. [Asignación de Servicios](#asignación-de-servicios)
7. [Detalle del Especialista](#detalle-del-especialista)
8. [Componentes Técnicos](#componentes-técnicos)
9. [Validaciones](#validaciones)
10. [Estados y Store](#estados-y-store)
11. [API Integration](#api-integration)

---

# VISIÓN GENERAL

## Objetivo del Módulo
Gestionar toda la información relacionada con los especialistas del salón: datos personales, horarios laborales, bloqueos de agenda, servicios que realizan y sus comisiones.

## Funcionalidades Principales

| Funcionalidad | Prioridad | Complejidad |
|--------------|-----------|-------------|
| CRUD de especialistas | Crítica | Media |
| Gestión de horarios semanales | Crítica | Alta |
| Gestión de bloqueos (puntuales y recurrentes) | Alta | Alta |
| Asignación de servicios y comisiones | Crítica | Media |
| Cambio de estado (activo/inactivo) | Media | Baja |
| Vista de detalle completa | Media | Media |
| Búsqueda y filtros | Alta | Baja |

## Permisos Requeridos

| Acción | Permiso Necesario |
|--------|------------------|
| Ver lista | `especialistas.ver` |
| Ver detalle | `especialistas.ver` |
| Crear | `especialistas.crear` |
| Editar | `especialistas.editar` |
| Cambiar estado | `especialistas.editar` |
| Eliminar/Desactivar | `especialistas.eliminar` |

---

# LISTA DE ESPECIALISTAS

## Ruta
`/dashboard/especialistas`

## Requisitos Funcionales

| ID | Requisito | Prioridad |
|----|-----------|-----------|
| FE-ESP-LST-001 | Tabla con paginación de especialistas | Crítica |
| FE-ESP-LST-002 | Búsqueda por nombre, apellido, documento | Alta |
| FE-ESP-LST-003 | Filtro por estado (activo/inactivo) | Media |
| FE-ESP-LST-004 | Ordenamiento por columnas | Media |
| FE-ESP-LST-005 | Botón "Nuevo Especialista" (según permiso) | Crítica |
| FE-ESP-LST-006 | Mostrar foto o iniciales del especialista | Alta |
| FE-ESP-LST-007 | Badge visual para estado | Alta |
| FE-ESP-LST-008 | Acciones rápidas por fila | Crítica |
| FE-ESP-LST-009 | Loading skeleton durante carga | Alta |
| FE-ESP-LST-010 | Empty state cuando no hay datos | Media |

## Diseño UI

```
┌────────────────────────────────────────────────────────────────────────────────┐
│ ESPECIALISTAS                                            [+ Nuevo Especialista]│
├────────────────────────────────────────────────────────────────────────────────┤
│                                                                                │
│  [🔍 Buscar por nombre, documento...]           [Estado ▼] [Ordenar ▼]        │
│                                                                                │
├────────────────────────────────────────────────────────────────────────────────┤
│                                                                                │
│  ┌────┬──────────────────────┬──────────────┬───────────────┬──────┬─────────┐│
│  │Foto│ Nombre               │ Documento    │ Teléfono      │Estado│Acciones ││
│  ├────┼──────────────────────┼──────────────┼───────────────┼──────┼─────────┤│
│  │ MG │ María García Rodríguez│ 1234567890  │ 300-123-4567  │●Activo│   ⋮    ││
│  │ 👤 │                       │              │               │      │         ││
│  ├────┼──────────────────────┼──────────────┼───────────────┼──────┼─────────┤│
│  │ CL │ Carlos López Martínez│ 9876543210   │ 311-987-6543  │●Activo│   ⋮    ││
│  │ 👤 │                       │              │               │      │         ││
│  ├────┼──────────────────────┼──────────────┼───────────────┼──────┼─────────┤│
│  │ AM │ Ana Martínez Sánchez │ 5555555555   │ 320-555-5555  │⊗Inact.│   ⋮    ││
│  │ 👤 │                       │              │               │      │         ││
│  ├────┼──────────────────────┼──────────────┼───────────────┼──────┼─────────┤│
│  │ PR │ Pedro Ruiz Torres    │ 1111222233   │ 315-111-2222  │●Activo│   ⋮    ││
│  │ 👤 │                       │              │               │      │         ││
│  └────┴──────────────────────┴──────────────┴───────────────┴──────┴─────────┘│
│                                                                                │
│  Mostrando 1-10 de 24 especialistas                                           │
│  [◀ Anterior]  [1] [2] [3]  [Siguiente ▶]                                    │
│                                                                                │
└────────────────────────────────────────────────────────────────────────────────┘
```

## Menú de Acciones (⋮)

```
┌───────────────────────────┐
│ 👁  Ver Detalle           │
│ ✏️  Editar                │
│ ───────────────────────   │
│ 🗓  Gestionar Horarios    │
│ 🚫  Gestionar Bloqueos    │
│ 🔧  Servicios y Comisiones│
│ ───────────────────────   │
│ 📊  Ver Estadísticas      │
│ ───────────────────────   │
│ ⊗  Desactivar            │
└───────────────────────────┘
```

## Columnas de la Tabla

| Columna | Tipo | Ordenable | Descripción |
|---------|------|-----------|-------------|
| Foto | Imagen/Avatar | No | Foto del especialista o iniciales en círculo de color |
| Nombre | Texto | Sí | Nombre completo (nombre + apellido) |
| Documento | Texto | Sí | Cédula o documento de identidad |
| Teléfono | Texto | No | Número de contacto principal |
| Estado | Badge | Sí | Activo (●verde) / Inactivo (⊗gris) |
| Acciones | Menú | No | Menú desplegable con acciones |

## Búsqueda

### Campos Indexados
- Nombre
- Apellido
- Documento de identidad
- Teléfono
- Email

### Comportamiento
- **Debounce**: 300ms
- **Mínimo caracteres**: 2
- **Búsqueda en vivo**: Sí
- **Case insensitive**: Sí
- **Busca en múltiples campos**: Sí

### Ejemplo de Uso
```
Usuario escribe: "mar"
↓
Sistema busca en:
- Nombre: "María", "Marta"
- Apellido: "Martínez", "Marín"
- Documento: si empieza con "mar"
↓
Muestra resultados filtrados
```

## Filtros

### Por Estado
```
┌─────────────────┐
│ Estado          │
├─────────────────┤
│ ☑ Todos         │
│ ☐ Activos       │
│ ☐ Inactivos     │
└─────────────────┘
```

### Por Servicios
```
┌─────────────────────────┐
│ Servicios que realizan  │
├─────────────────────────┤
│ ☐ Alisados              │
│ ☐ Cortes                │
│ ☐ Tintes                │
│ ☐ Manicure              │
└─────────────────────────┘
```

## Paginación

- **Items por página**: 10, 25, 50, 100
- **Predeterminado**: 10
- **Estilo**: Números con anterior/siguiente
- **Persistencia**: Guardar en localStorage

## Empty State

```
┌────────────────────────────────────────────────┐
│                                                │
│              👤                                │
│                                                │
│        No hay especialistas registrados        │
│                                                │
│  Comienza agregando tu primer especialista    │
│  para gestionar la agenda del salón           │
│                                                │
│         [+ Crear Primer Especialista]         │
│                                                │
└────────────────────────────────────────────────┘
```

## Loading State

```
┌────────────────────────────────────────────────┐
│  ┌─────────────────────────────────────────┐  │
│  │ [████████░░░░░░░░░░░░] Cargando...     │  │
│  │                                         │  │
│  │ ▓▓▓▓▓ ░░░░░░░░░░░ ░░░░░░░ ░░░░ ░░░    │  │
│  │ ▓▓▓▓▓ ░░░░░░░░░░░ ░░░░░░░ ░░░░ ░░░    │  │
│  │ ▓▓▓▓▓ ░░░░░░░░░░░ ░░░░░░░ ░░░░ ░░░    │  │
│  └─────────────────────────────────────────┘  │
└────────────────────────────────────────────────┘
```

---

# CREAR/EDITAR ESPECIALISTA

## Rutas
- Crear: `/dashboard/especialistas/nuevo`
- Editar: `/dashboard/especialistas/[id]/editar`

## Modal vs Página Completa

**Decisión**: Usar **página completa** para mejor experiencia con campos múltiples y validaciones complejas.

## Requisitos Funcionales

| ID | Requisito | Prioridad |
|----|-----------|-----------|
| FE-ESP-FORM-001 | Formulario de datos personales | Crítica |
| FE-ESP-FORM-002 | Upload de foto con preview | Alta |
| FE-ESP-FORM-003 | Validación en tiempo real | Crítica |
| FE-ESP-FORM-004 | Mensajes de error claros | Alta |
| FE-ESP-FORM-005 | Breadcrumb de navegación | Media |
| FE-ESP-FORM-006 | Confirmación antes de salir sin guardar | Alta |
| FE-ESP-FORM-007 | Auto-guardado (draft) | Baja |
| FE-ESP-FORM-008 | Formato automático de campos | Media |

## Diseño UI - Crear Nuevo

```
┌────────────────────────────────────────────────────────────────────────────────┐
│ Especialistas › Nuevo Especialista                              [✕ Cancelar]   │
├────────────────────────────────────────────────────────────────────────────────┤
│                                                                                │
│  ┌──────────────────────────────────────────────────────────────────────────┐ │
│  │                                                                          │ │
│  │  📋 INFORMACIÓN PERSONAL                                                 │ │
│  │                                                                          │ │
│  │  ┌────────────────────────────┐  ┌────────────────────────────────────┐│ │
│  │  │                            │  │                                    ││ │
│  │  │        [📷 Subir Foto]     │  │  Nombre *                          ││ │
│  │  │                            │  │  [María_____________________]      ││ │
│  │  │    o arrastrar aquí        │  │                                    ││ │
│  │  │                            │  │  Apellido *                        ││ │
│  │  │   Máx: 5MB                 │  │  [García Rodríguez___________]    ││ │
│  │  │   JPG, PNG                 │  │                                    ││ │
│  │  │                            │  │  Documento de Identidad            ││ │
│  │  └────────────────────────────┘  │  [1234567890______________]        ││ │
│  │                                   │  ℹ️ Cédula de ciudadanía           ││ │
│  │                                   │                                    ││ │
│  │                                   │  Teléfono *                        ││ │
│  │                                   │  [+57 300-123-4567________]        ││ │
│  │                                   │  ✓ Formato válido                  ││ │
│  │                                   │                                    ││ │
│  │                                   │  Email                             ││ │
│  │                                   │  [maria.garcia@email.com___]       ││ │
│  │                                   │                                    ││ │
│  │                                   │  Fecha de Ingreso                  ││ │
│  │                                   │  [06/12/2024________] 📅           ││ │
│  │                                   │                                    ││ │
│  │                                   └────────────────────────────────────┘│ │
│  │                                                                          │ │
│  └──────────────────────────────────────────────────────────────────────────┘ │
│                                                                                │
│  ┌──────────────────────────────────────────────────────────────────────────┐ │
│  │                                                                          │ │
│  │  👤 CONFIGURACIÓN DE USUARIO (Opcional)                                 │ │
│  │                                                                          │ │
│  │  ☑ Crear usuario para este especialista                                 │ │
│  │                                                                          │ │
│  │  Username                          Contraseña Temporal                  │ │
│  │  [mgarcia______________]           [generada-auto_______] 🔄 Generar    │ │
│  │  ✓ Disponible                      ℹ️ Se enviará por email              │ │
│  │                                                                          │ │
│  │  Rol                                                                     │ │
│  │  [Especialista ▼____________]                                            │ │
│  │                                                                          │ │
│  └──────────────────────────────────────────────────────────────────────────┘ │
│                                                                                │
│  ┌──────────────────────────────────────────────────────────────────────────┐ │
│  │                                                                          │ │
│  │  📝 NOTAS ADICIONALES (Opcional)                                         │ │
│  │                                                                          │ │
│  │  ┌────────────────────────────────────────────────────────────────────┐ │ │
│  │  │ Notas internas sobre el especialista                               │ │ │
│  │  │                                                                    │ │ │
│  │  │ [Ej: Especialista en tratamientos de keratina, prefiere trabajar__│ │ │
│  │  │  en horarios de tarde___________________________________________]  │ │ │
│  │  │                                                                    │ │ │
│  │  └────────────────────────────────────────────────────────────────────┘ │ │
│  │                                                                          │ │
│  └──────────────────────────────────────────────────────────────────────────┘ │
│                                                                                │
│                                                                                │
│  [← Cancelar]                                          [Guardar Especialista] │
│                                                                                │
└────────────────────────────────────────────────────────────────────────────────┘
```

## Campos del Formulario

### Información Personal

| Campo | Tipo | Requerido | Validación | Formato |
|-------|------|-----------|------------|---------|
| Foto | File Upload | No | Max 5MB, JPG/PNG | - |
| Nombre | Text | Sí | 2-50 caracteres | Capitalizar |
| Apellido | Text | Sí | 2-50 caracteres | Capitalizar |
| Documento | Text | No | Único, 6-15 caracteres | Solo números |
| Teléfono | Text | Sí | Formato válido | +57 XXX-XXX-XXXX |
| Email | Email | No | Formato email, único | Lowercase |
| Fecha Ingreso | Date | No | No futuro | DD/MM/YYYY |

### Upload de Foto

**Especificaciones**:
- Formatos: JPG, PNG, WEBP
- Tamaño máximo: 5MB
- Dimensiones recomendadas: 400x400px
- Recorte: Circular automático
- Compresión: Automática si > 1MB

**Flujo de Upload**:
```
Usuario selecciona archivo
↓
Validar formato y tamaño
↓
Mostrar preview
↓
Permitir crop/ajuste (opcional)
↓
Comprimir si necesario
↓
Guardar en estado temporal
↓
Upload al guardar formulario
```

**Estados del Upload**:
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│                 │    │   ⏳ Loading    │    │      ✓          │
│   📷 Subir      │ →  │                 │ →  │   [Preview]     │
│                 │    │   Subiendo...   │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                                │ [🗑 Eliminar]  │
                                                │ [🔄 Cambiar]   │
```

## Validaciones en Tiempo Real

### Nombre y Apellido
```typescript
// Mientras escribe
- Min 2 caracteres: "⚠️ Muy corto"
- Max 50 caracteres: "⚠️ Muy largo"
- Solo letras y espacios: "⚠️ Solo letras"
- Auto-capitalizar primera letra
```

### Documento
```typescript
// Al salir del campo (onBlur)
- Verificar unicidad en API
- Si existe: "❌ Documento ya registrado"
- Si disponible: "✓ Disponible"
```

### Teléfono
```typescript
// Mientras escribe
- Formato automático: 3001234567 → +57 300-123-4567
- Validar longitud: 10 dígitos
- Al terminar: "✓ Formato válido"
```

### Email
```typescript
// Al salir del campo
- Validar formato: email@domain.com
- Verificar unicidad en API
- Si existe: "❌ Email ya registrado"
- Si disponible: "✓ Disponible"
```

## Modo Edición

### Diferencias con Crear

1. **Título**: "Editar Especialista - [Nombre]"
2. **Breadcrumb**: `Especialistas › María García › Editar`
3. **Foto actual**: Mostrar foto existente con opción de cambiar
4. **Campos prellenados**: Todos los datos actuales
5. **Botón**: "Guardar Cambios" en lugar de "Guardar Especialista"
6. **Historial**: Mostrar última actualización

```
┌────────────────────────────────────────────────────────────────┐
│ Especialistas › María García › Editar              [✕ Cancelar]│
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  ℹ️ Última actualización: 05/12/2024 10:30 por Juan Pérez     │
│                                                                │
│  [Formulario igual que crear pero con datos prellenados]      │
│                                                                │
│  [← Cancelar]                          [Guardar Cambios]      │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

## Confirmación de Salida

Si hay cambios sin guardar:

```
┌──────────────────────────────────────────┐
│  ⚠️  Cambios sin guardar                │
│                                          │
│  ¿Estás seguro que deseas salir?        │
│  Los cambios no se guardarán.           │
│                                          │
│  [Cancelar]  [Descartar cambios]        │
└──────────────────────────────────────────┘
```

---

# GESTIÓN DE HORARIOS

## Ruta Modal
Modal desde: `/dashboard/especialistas/[id]/horarios`

## Requisitos Funcionales

| ID | Requisito | Prioridad |
|----|-----------|-----------|
| FE-HOR-001 | Vista semanal de horarios | Crítica |
| FE-HOR-002 | Activar/desactivar días | Crítica |
| FE-HOR-003 | Configurar múltiples turnos por día | Alta |
| FE-HOR-004 | Time pickers con intervalos de 15 min | Crítica |
| FE-HOR-005 | Validación de horarios (hora_fin > hora_inicio) | Crítica |
| FE-HOR-006 | Validación de solapamientos | Alta |
| FE-HOR-007 | Template rápido (Copiar a todos los días) | Media |
| FE-HOR-008 | Previsualización de cambios | Media |

## Diseño UI

```
┌────────────────────────────────────────────────────────────────────────────────┐
│ ✕                    Horarios - María García                                   │
├────────────────────────────────────────────────────────────────────────────────┤
│                                                                                │
│  💡 Define los horarios laborales de la semana                                │
│                                                                                │
│  ┌──────────────────────────────────────────────────────────────────────────┐ │
│  │                                                                          │ │
│  │  📋 PLANTILLA RÁPIDA                                                     │ │
│  │                                                                          │ │
│  │  Lunes a Viernes: [08:00] a [18:00]  [Aplicar a todos los días laborales]│ │
│  │  Sábado:         [09:00] a [14:00]  [Aplicar solo sábados]              │ │
│  │                                                                          │ │
│  └──────────────────────────────────────────────────────────────────────────┘ │
│                                                                                │
│  ┌──────────────────────────────────────────────────────────────────────────┐ │
│  │                                                                          │ │
│  │  📅 HORARIO SEMANAL                                                      │ │
│  │                                                                          │ │
│  │  ┌────────────────────────────────────────────────────────────────────┐ │ │
│  │  │ ☑ Lunes                                           [+ Agregar turno]│ │ │
│  │  │                                                                    │ │ │
│  │  │   Turno 1:  [08:00 ▼] a [13:00 ▼]                         [🗑]    │ │ │
│  │  │   Turno 2:  [14:00 ▼] a [18:00 ▼]                         [🗑]    │ │ │
│  │  │                                                                    │ │ │
│  │  └────────────────────────────────────────────────────────────────────┘ │ │
│  │                                                                          │ │
│  │  ┌────────────────────────────────────────────────────────────────────┐ │ │
│  │  │ ☑ Martes                                          [+ Agregar turno]│ │ │
│  │  │                                                                    │ │ │
│  │  │   Turno 1:  [08:00 ▼] a [18:00 ▼]                         [🗑]    │ │ │
│  │  │                                                                    │ │ │
│  │  └────────────────────────────────────────────────────────────────────┘ │ │
│  │                                                                          │ │
│  │  ┌────────────────────────────────────────────────────────────────────┐ │ │
│  │  │ ☑ Miércoles                                       [+ Agregar turno]│ │ │
│  │  │                                                                    │ │ │
│  │  │   Turno 1:  [08:00 ▼] a [18:00 ▼]                         [🗑]    │ │ │
│  │  │                                                                    │ │ │
│  │  └────────────────────────────────────────────────────────────────────┘ │ │
│  │                                                                          │ │
│  │  ┌────────────────────────────────────────────────────────────────────┐ │ │
│  │  │ ☑ Jueves                                          [+ Agregar turno]│ │ │
│  │  │                                                                    │ │ │
│  │  │   Turno 1:  [08:00 ▼] a [18:00 ▼]                         [🗑]    │ │ │
│  │  │                                                                    │ │ │
│  │  └────────────────────────────────────────────────────────────────────┘ │ │
│  │                                                                          │ │
│  │  ┌────────────────────────────────────────────────────────────────────┐ │ │
│  │  │ ☑ Viernes                                         [+ Agregar turno]│ │ │
│  │  │                                                                    │ │ │
│  │  │   Turno 1:  [08:00 ▼] a [18:00 ▼]                         [🗑]    │ │ │
│  │  │                                                                    │ │ │
│  │  └────────────────────────────────────────────────────────────────────┘ │ │
│  │                                                                          │ │
│  │  ┌────────────────────────────────────────────────────────────────────┐ │ │
│  │  │ ☑ Sábado                                          [+ Agregar turno]│ │ │
│  │  │                                                                    │ │ │
│  │  │   Turno 1:  [09:00 ▼] a [14:00 ▼]                         [🗑]    │ │ │
│  │  │                                                                    │ │ │
│  │  └────────────────────────────────────────────────────────────────────┘ │ │
│  │                                                                          │ │
│  │  ┌────────────────────────────────────────────────────────────────────┐ │ │
│  │  │ ☐ Domingo                                                          │ │ │
│  │  │                                                                    │ │ │
│  │  │   No trabaja                                                       │ │ │
│  │  │                                                                    │ │ │
│  │  └────────────────────────────────────────────────────────────────────┘ │ │
│  │                                                                          │ │
│  └──────────────────────────────────────────────────────────────────────────┘ │
│                                                                                │
│                                                                                │
│  [Cancelar]                                            [Guardar Horarios]     │
│                                                                                │
└────────────────────────────────────────────────────────────────────────────────┘
```

## Interacciones

### Activar/Desactivar Día
```
Click en checkbox ☑ Lunes
↓
Si se desactiva (☐):
  - Ocultar campos de horarios
  - Mostrar "No trabaja"
  - Marcar como inactivo
↓
Si se activa (☑):
  - Mostrar campos de horarios
  - Agregar turno por defecto si está vacío
```

### Agregar Turno
```
Click en [+ Agregar turno]
↓
Agregar nueva fila de horarios
↓
Validar que no solape con turnos existentes
↓
Si solapa:
  - Mostrar error: "⚠️ Este turno solapa con otro existente"
  - No permitir guardar
```

### Eliminar Turno
```
Click en [🗑]
↓
Si es el único turno:
  - Confirmar: "¿Desactivar este día?"
  - Opciones: [Cancelar] [Sí, desactivar]
↓
Si hay múltiples turnos:
  - Eliminar inmediatamente
  - Mostrar toast: "Turno eliminado"
```

### Plantilla Rápida
```
Usuario configura:
  Lunes a Viernes: 08:00 - 18:00
↓
Click en [Aplicar a todos los días laborales]
↓
Modal de confirmación:
  "Esto sobrescribirá los horarios actuales
   de lunes a viernes. ¿Continuar?"
↓
Si confirma:
  - Aplicar horario a L-V
  - Activar esos días
  - Mostrar toast: "Horarios aplicados"
```

## Time Pickers

### Especificaciones
- Intervalos: 15 minutos
- Rango: 06:00 - 22:00
- Formato: 24 horas
- Scroll: Suave
- Teclado: Permitir escribir directo

### Ejemplo de Dropdown
```
┌──────────┐
│  06:00   │
│  06:15   │
│  06:30   │
│  06:45   │
│  07:00   │  ← Seleccionado
│  07:15   │
│  07:30   │
│  ...     │
└──────────┘
```

## Validaciones

### Hora Fin > Hora Inicio
```typescript
if (hora_fin <= hora_inicio) {
  error = "La hora fin debe ser mayor a la hora inicio"
  mostrar en rojo debajo del campo
}
```

### No Solapamiento entre Turnos
```typescript
// Ejemplo:
Turno 1: 08:00 - 13:00
Turno 2: 12:00 - 18:00  ❌ Solapa

// Validación:
if (turno2.inicio < turno1.fin) {
  error = "Este turno solapa con el turno anterior"
}
```

### Día Completo
```typescript
// Validar que al menos un turno esté configurado
if (dia.activo && dia.turnos.length === 0) {
  error = "Agrega al menos un turno o desactiva este día"
}
```

## Resumen Visual

Mostrar resumen de horas totales al final:

```
┌────────────────────────────────────────┐
│  📊 RESUMEN SEMANAL                    │
├────────────────────────────────────────┤
│  Total horas semanales:  50 horas      │
│  Promedio diario:        8.3 horas     │
│  Días laborales:         6 días        │
└────────────────────────────────────────┘
```

---

# GESTIÓN DE BLOQUEOS

## Ruta Modal
Modal desde: `/dashboard/especialistas/[id]/bloqueos`

## Requisitos Funcionales

| ID | Requisito | Prioridad |
|----|-----------|-----------|
| FE-BLQ-001 | Lista de bloqueos activos | Crítica |
| FE-BLQ-002 | Crear bloqueo puntual | Crítica |
| FE-BLQ-003 | Crear bloqueo recurrente | Alta |
| FE-BLQ-004 | Editar bloqueos existentes | Alta |
| FE-BLQ-005 | Eliminar bloqueos | Alta |
| FE-BLQ-006 | Filtrar por tipo (puntual/recurrente) | Media |
| FE-BLQ-007 | Validar fechas (fin >= inicio) | Crítica |
| FE-BLQ-008 | Vista de calendario de bloqueos | Baja |

## Diseño UI - Lista de Bloqueos

```
┌────────────────────────────────────────────────────────────────────────────────┐
│ ✕                    Bloqueos - María García                [+ Nuevo Bloqueo]  │
├────────────────────────────────────────────────────────────────────────────────┤
│                                                                                │
│  💡 Gestiona los períodos en que el especialista no estará disponible         │
│                                                                                │
│  [Todos ▼] [Puntuales] [Recurrentes]                         🔍 [Buscar...]   │
│                                                                                │
│  ┌──────────────────────────────────────────────────────────────────────────┐ │
│  │                                                                          │ │
│  │  📅 BLOQUEOS PRÓXIMOS                                                    │ │
│  │                                                                          │ │
│  │  ┌────────────────────────────────────────────────────────────────────┐ │ │
│  │  │  🗓  VACACIONES NAVIDEÑAS                                          │ │ │
│  │  │                                                                    │ │ │
│  │  │  📅 15/12/2024 - 05/01/2025                                        │ │ │
│  │  │  ⏰ Todo el día                                                    │ │ │
│  │  │  📝 Vacaciones programadas de fin de año                          │ │ │
│  │  │  🏷  Puntual                                                       │ │ │
│  │  │                                                                    │ │ │
│  │  │                                    [✏️ Editar]     [🗑 Eliminar]   │ │ │
│  │  └────────────────────────────────────────────────────────────────────┘ │ │
│  │                                                                          │ │
│  │  ┌────────────────────────────────────────────────────────────────────┐ │ │
│  │  │  🍽  ALMUERZO                                                      │ │ │
│  │  │                                                                    │ │ │
│  │  │  📅 Todos los días                                                 │ │ │
│  │  │  ⏰ 12:00 - 14:00                                                  │ │ │
│  │  │  📝 Hora de almuerzo diaria                                       │ │ │
│  │  │  🏷  Recurrente                                                    │ │ │
│  │  │  🔄 Lunes a Sábado                                                │ │ │
│  │  │                                                                    │ │ │
│  │  │                                    [✏️ Editar]     [🗑 Eliminar]   │ │ │
│  │  └────────────────────────────────────────────────────────────────────┘ │ │
│  │                                                                          │ │
│  │  ┌────────────────────────────────────────────────────────────────────┐ │ │
│  │  │  🏥 CITA MÉDICA                                                    │ │ │
│  │  │                                                                    │ │ │
│  │  │  📅 20/12/2024                                                     │ │ │
│  │  │  ⏰ 15:00 - 17:00                                                  │ │ │
│  │  │  📝 Control médico                                                │ │ │
│  │  │  🏷  Puntual                                                       │ │ │
│  │  │                                                                    │ │ │
│  │  │                                    [✏️ Editar]     [🗑 Eliminar]   │ │ │
│  │  └────────────────────────────────────────────────────────────────────┘ │ │
│  │                                                                          │ │
│  └──────────────────────────────────────────────────────────────────────────┘ │
│                                                                                │
│  ┌──────────────────────────────────────────────────────────────────────────┐ │
│  │                                                                          │ │
│  │  📅 BLOQUEOS HISTÓRICOS (ver todo)                                       │ │
│  │                                                                          │ │
│  │  • 01-10/12/2024 - Capacitación externa                                 │ │
│  │  • 15-20/11/2024 - Vacaciones                                            │ │
│  │                                                                          │ │
│  └──────────────────────────────────────────────────────────────────────────┘ │
│                                                                                │
│                                                                [Cerrar]         │
│                                                                                │
└────────────────────────────────────────────────────────────────────────────────┘
```

## Diseño UI - Crear Bloqueo

```
┌────────────────────────────────────────────────────────────────────────────────┐
│ ✕                         Nuevo Bloqueo                                        │
├────────────────────────────────────────────────────────────────────────────────┤
│                                                                                │
│  ┌──────────────────────────────────────────────────────────────────────────┐ │
│  │                                                                          │ │
│  │  🏷  TIPO DE BLOQUEO                                                     │ │
│  │                                                                          │ │
│  │  ┌──────────────────┐     ┌──────────────────┐                          │ │
│  │  │  ◉  Puntual      │     │  ○  Recurrente   │                          │ │
│  │  │                  │     │                  │                          │ │
│  │  │  Bloqueo único   │     │  Se repite       │                          │ │
│  │  │  en fechas       │     │  periódicamente  │                          │ │
│  │  │  específicas     │     │                  │                          │ │
│  │  └──────────────────┘     └──────────────────┘                          │ │
│  │                                                                          │ │
│  └──────────────────────────────────────────────────────────────────────────┘ │
│                                                                                │
│  ┌──────────────────────────────────────────────────────────────────────────┐ │
│  │                                                                          │ │
│  │  📅 FECHAS                                                               │ │
│  │                                                                          │ │
│  │  ┌──────────────────────────┐  ┌──────────────────────────────┐        │ │
│  │  │ Fecha inicio *           │  │ Fecha fin *                  │        │ │
│  │  │ [15/12/2024______] 📅    │  │ [05/01/2025________] 📅      │        │ │
│  │  │                          │  │                              │        │ │
│  │  └──────────────────────────┘  └──────────────────────────────┘        │ │
│  │                                                                          │ │
│  │  ℹ️  Duración: 22 días                                                  │ │
│  │                                                                          │ │
│  └──────────────────────────────────────────────────────────────────────────┘ │
│                                                                                │
│  ┌──────────────────────────────────────────────────────────────────────────┐ │
│  │                                                                          │ │
│  │  ⏰ HORARIO                                                              │ │
│  │                                                                          │ │
│  │  ○  Todo el día                                                          │ │
│  │  ◉  Horario específico                                                   │ │
│  │                                                                          │ │
│  │  ┌──────────────────┐     ┌──────────────────┐                          │ │
│  │  │ Hora inicio      │     │ Hora fin         │                          │ │
│  │  │ [12:00 ▼_____]   │     │ [14:00 ▼_____]   │                          │ │
│  │  └──────────────────┘     └──────────────────┘                          │ │
│  │                                                                          │ │
│  │  ℹ️  Duración: 2 horas                                                  │ │
│  │                                                                          │ │
│  └──────────────────────────────────────────────────────────────────────────┘ │
│                                                                                │
│  ┌──────────────────────────────────────────────────────────────────────────┐ │
│  │                                                                          │ │
│  │  📝 DETALLES                                                             │ │
│  │                                                                          │ │
│  │  Título del bloqueo *                                                    │ │
│  │  [Vacaciones Navideñas_______________________________________]           │ │
│  │                                                                          │ │
│  │  Motivo / Descripción                                                    │ │
│  │  ┌────────────────────────────────────────────────────────────────────┐ │ │
│  │  │ Vacaciones programadas de fin de año                               │ │ │
│  │  │ [____________________________________________________________]     │ │ │
│  │  │                                                                    │ │ │
│  │  └────────────────────────────────────────────────────────────────────┘ │ │
│  │                                                                          │ │
│  │  🎨 Color (opcional)                                                     │ │
│  │  [🔴] [🟠] [🟡] [🟢] [🔵] [🟣] [⚫]                                        │ │
│  │                                                                          │ │
│  └──────────────────────────────────────────────────────────────────────────┘ │
│                                                                                │
│                                                                                │
│  [Cancelar]                                                [Crear Bloqueo]    │
│                                                                                │
└────────────────────────────────────────────────────────────────────────────────┘
```

## Bloqueo Recurrente

Cuando se selecciona "Recurrente":

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  🔄 RECURRENCIA                                                              │
│                                                                              │
│  Patrón de repetición                                                        │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │  ◉  Diario                                                             │ │
│  │  ○  Semanal                                                            │ │
│  │  ○  Mensual                                                            │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│  [Si "Semanal" está seleccionado:]                                          │
│                                                                              │
│  Repetir cada:                                                               │
│  ☑ Lunes    ☑ Martes    ☑ Miércoles    ☑ Jueves    ☑ Viernes    ☑ Sábado  │
│  ☐ Domingo                                                                   │
│                                                                              │
│  Vista previa:                                                               │
│  "Se bloqueará todos los lunes a viernes de 12:00 a 14:00"                  │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

## Validaciones

### Fecha Fin >= Fecha Inicio
```typescript
if (fecha_fin < fecha_inicio) {
  error = "La fecha fin debe ser igual o posterior a la fecha inicio"
}
```

### Hora Fin > Hora Inicio
```typescript
if (hora_fin <= hora_inicio) {
  error = "La hora fin debe ser mayor a la hora inicio"
}
```

### Solapamiento con Citas Existentes
```typescript
// Al crear bloqueo, verificar si hay citas afectadas
if (hay_citas_en_rango) {
  warning = `
    ⚠️  Hay 3 citas agendadas en este período
    
    ¿Deseas continuar? Las citas deberán ser reagendadas.
    
    [Ver citas afectadas]  [Cancelar]  [Sí, crear bloqueo]
  `
}
```

## Modal de Confirmación de Eliminación

```
┌──────────────────────────────────────────────────────┐
│  🗑  Eliminar Bloqueo                                │
│                                                      │
│  ¿Estás seguro de eliminar este bloqueo?            │
│                                                      │
│  📅 Vacaciones Navideñas                             │
│  15/12/2024 - 05/01/2025                            │
│                                                      │
│  Esta acción no se puede deshacer.                  │
│                                                      │
│  [Cancelar]              [Sí, eliminar]             │
└──────────────────────────────────────────────────────┘
```

---

# ASIGNACIÓN DE SERVICIOS Y COMISIONES

## Ruta Modal
Modal desde: `/dashboard/especialistas/[id]/servicios`

## Requisitos Funcionales

| ID | Requisito | Prioridad |
|----|-----------|-----------|
| FE-SVC-001 | Lista de servicios asignados | Crítica |
| FE-SVC-002 | Agregar nuevo servicio | Crítica |
| FE-SVC-003 | Configurar tipo de comisión (% o fijo) | Crítica |
| FE-SVC-004 | Editar comisión existente | Alta |
| FE-SVC-005 | Eliminar asignación de servicio | Alta |
| FE-SVC-006 | Cálculo automático de comisión | Alta |
| FE-SVC-007 | Validación de valores de comisión | Crítica |
| FE-SVC-008 | Búsqueda de servicios disponibles | Media |

## Diseño UI

```
┌────────────────────────────────────────────────────────────────────────────────┐
│ ✕              Servicios y Comisiones - María García                          │
├────────────────────────────────────────────────────────────────────────────────┤
│                                                                                │
│  💡 Define qué servicios puede realizar y sus comisiones                      │
│                                                                                │
│  ┌──────────────────────────────────────────────────────────────────────────┐ │
│  │                                                                          │ │
│  │  ✅ SERVICIOS ASIGNADOS (5)                                              │ │
│  │                                                                          │ │
│  │  ┌────────────────────────────────────────────────────────────────────┐ │ │
│  │  │ Servicio              │ Precio Base │ Comisión      │ Valor      │ │ │ │
│  │  ├───────────────────────┼─────────────┼───────────────┼────────────┤ │ │ │
│  │  │                       │             │               │            │ │ │ │
│  │  │ 💇 Alisado Brasileño  │  $150,000   │ 40 %          │ $60,000    │ │ │ │
│  │  │                       │             │ [40____] %    │            │ │ │ │
│  │  │                       │             │               │   [✏️] [🗑]│ │ │ │
│  │  │                       │             │               │            │ │ │ │
│  │  ├───────────────────────┼─────────────┼───────────────┼────────────┤ │ │ │
│  │  │                       │             │               │            │ │ │ │
│  │  │ ✂️ Corte Mujer        │  $35,000    │ 35 %          │ $12,250    │ │ │ │
│  │  │                       │             │ [35____] %    │            │ │ │ │
│  │  │                       │             │               │   [✏️] [🗑]│ │ │ │
│  │  │                       │             │               │            │ │ │ │
│  │  ├───────────────────────┼─────────────┼───────────────┼────────────┤ │ │ │
│  │  │                       │             │               │            │ │ │ │
│  │  │ 🎨 Tinte Completo     │  $80,000    │ $ Fijo        │ $20,000    │ │ │ │
│  │  │                       │             │ [$20,000_] $  │            │ │ │ │
│  │  │                       │             │               │   [✏️] [🗑]│ │ │ │
│  │  │                       │             │               │            │ │ │ │
│  │  ├───────────────────────┼─────────────┼───────────────┼────────────┤ │ │ │
│  │  │                       │             │               │            │ │ │ │
│  │  │ 🌈 Mechas             │  $100,000   │ 38 %          │ $38,000    │ │ │ │
│  │  │                       │             │ [38____] %    │            │ │ │ │
│  │  │                       │             │               │   [✏️] [🗑]│ │ │ │
│  │  │                       │             │               │            │ │ │ │
│  │  ├───────────────────────┼─────────────┼───────────────┼────────────┤ │ │ │
│  │  │                       │             │               │            │ │ │ │
│  │  │ 💆 Keratina           │  $180,000   │ 42 %          │ $75,600    │ │ │ │
│  │  │                       │             │ [42____] %    │            │ │ │ │
│  │  │                       │             │               │   [✏️] [🗑]│ │ │ │
│  │  │                       │             │               │            │ │ │ │
│  │  └────────────────────────────────────────────────────────────────────┘ │ │
│  │                                                                          │ │
│  └──────────────────────────────────────────────────────────────────────────┘ │
│                                                                                │
│  ┌──────────────────────────────────────────────────────────────────────────┐ │
│  │                                                                          │ │
│  │  ➕ AGREGAR SERVICIO                                                     │ │
│  │                                                                          │ │
│  │  ┌────────────────────────────────┐  ┌──────────────┐  ┌─────────────┐ │ │
│  │  │ Buscar servicio...             │  │ Tipo         │  │ Valor       │ │ │
│  │  │ [Buscar... ▼_______________]   │  │ [% ▼_____]   │  │ [_______]   │ │ │
│  │  │                                │  │              │  │             │ │ │
│  │  │  📋 Sugerencias:               │  │ ○ Porcentaje │  │             │ │ │
│  │  │  • Corte Hombre                │  │ ○ Fijo ($)   │  │             │ │ │
│  │  │  • Botox Capilar               │  │              │  │             │ │ │
│  │  │  • Manicure                    │  │              │  │             │ │ │
│  │  │                                │  │              │  │             │ │ │
│  │  └────────────────────────────────┘  └──────────────┘  └─────────────┘ │ │
│  │                                                                          │ │
│  │  💡 Solo se muestran servicios que aún no tiene asignados               │ │
│  │                                                        [+ Agregar]       │ │
│  │                                                                          │ │
│  └──────────────────────────────────────────────────────────────────────────┘ │
│                                                                                │
│  ┌──────────────────────────────────────────────────────────────────────────┐ │
│  │                                                                          │ │
│  │  📊 RESUMEN                                                              │ │
│  │                                                                          │ │
│  │  Servicios asignados:        5 servicios                                │ │
│  │  Comisión promedio:          39.6 %                                     │ │
│  │  Estimado mensual*:          $2,500,000                                 │ │
│  │                                                                          │ │
│  │  * Basado en 50 servicios/mes con precios promedio                      │ │
│  │                                                                          │ │
│  └──────────────────────────────────────────────────────────────────────────┘ │
│                                                                                │
│                                                                                │
│  [Cerrar]                                                  [Guardar Cambios]  │
│                                                                                │
└────────────────────────────────────────────────────────────────────────────────┘
```

## Componente de Edición Inline

Cuando se hace click en [✏️]:

```
┌────────────────────────────────────────────────────────────┐
│ 💇 Alisado Brasileño                          [Guardar] [✕]│
├────────────────────────────────────────────────────────────┤
│                                                            │
│  Precio base: $150,000  (No editable)                     │
│                                                            │
│  Tipo de comisión:                                        │
│  ◉ Porcentaje     ○ Valor fijo                           │
│                                                            │
│  ┌──────────────────────┐                                 │
│  │ Porcentaje *         │                                 │
│  │ [40____________] %   │                                 │
│  └──────────────────────┘                                 │
│                                                            │
│  Comisión calculada: $60,000                              │
│                                                            │
│  💡 Representa el 40% del precio del servicio             │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

## Búsqueda de Servicios

Autocomplete con sugerencias:

```
┌─────────────────────────────────────┐
│ Buscar servicio...                  │
│ [cor___________________________]    │
│                                     │
│  Resultados:                        │
│  ┌───────────────────────────────┐ │
│  │ ✂️ Corte Hombre    $25,000    │ │ ← Click para seleccionar
│  │ ✂️ Corte Niño      $20,000    │ │
│  └───────────────────────────────┘ │
│                                     │
│  Ya asignados (no disponibles):     │
│  • Corte Mujer                      │
│                                     │
└─────────────────────────────────────┘
```

## Validaciones

### Porcentaje
```typescript
if (tipo === 'porcentaje') {
  if (valor < 0 || valor > 100) {
    error = "El porcentaje debe estar entre 0 y 100"
  }
}
```

### Valor Fijo
```typescript
if (tipo === 'fijo') {
  if (valor < 0) {
    error = "El valor debe ser mayor a 0"
  }
  if (valor > precio_base) {
    warning = "⚠️ La comisión es mayor al precio del servicio"
  }
}
```

### Servicio Duplicado
```typescript
if (servicio_ya_asignado) {
  error = "Este servicio ya está asignado"
  deshabilitar_agregar()
}
```

## Cálculo Automático

```typescript
// En tiempo real mientras edita
if (tipo === 'porcentaje') {
  comision = precio_base * (porcentaje / 100)
  mostrar_calculada(comision)
}

if (tipo === 'fijo') {
  comision = valor_fijo
  porcentaje_equivalente = (valor_fijo / precio_base) * 100
  mostrar_equivalente(porcentaje_equivalente)
}
```

---

# DETALLE DEL ESPECIALISTA

## Ruta
`/dashboard/especialistas/[id]`

## Requisitos Funcionales

| ID | Requisito | Prioridad |
|----|-----------|-----------|
| FE-DET-001 | Vista completa de información | Alta |
| FE-DET-002 | Tabs para organizar contenido | Alta |
| FE-DET-003 | Estadísticas del especialista | Media |
| FE-DET-004 | Historial de citas realizadas | Media |
| FE-DET-005 | Gráficos de rendimiento | Baja |
| FE-DET-006 | Acciones rápidas en header | Alta |
| FE-DET-007 | Breadcrumb de navegación | Media |

## Diseño UI

```
┌────────────────────────────────────────────────────────────────────────────────┐
│ ← Especialistas › María García                                                │
├────────────────────────────────────────────────────────────────────────────────┤
│                                                                                │
│  ┌────────────────────────────────────────────────────────────────────────────┐
│  │                                                                            │
│  │  ┌──────────┐                                                             │
│  │  │          │   María García Rodríguez                      ●Activo       │
│  │  │    MG    │                                                             │
│  │  │   👤     │   📞 +57 300-123-4567                                       │
│  │  │          │   📧 maria.garcia@email.com                                 │
│  │  └──────────┘   📄 CC 1234567890                                          │
│  │                                                                            │
│  │                 Ingreso: 15/01/2023 (1 año, 11 meses)                     │
│  │                                                                            │
│  │  [✏️ Editar]  [🗓 Horarios]  [🚫 Bloqueos]  [🔧 Servicios]  [⊗ Desactivar]│
│  │                                                                            │
│  └────────────────────────────────────────────────────────────────────────────┘
│                                                                                │
│  ┌────────────────────────────────────────────────────────────────────────────┐
│  │ [📊 Resumen] [🗓 Horarios] [🚫 Bloqueos] [🔧 Servicios] [📈 Rendimiento] │
│  ├────────────────────────────────────────────────────────────────────────────┤
│  │                                                                            │
│  │  📊 ESTADÍSTICAS                                                           │
│  │                                                                            │
│  │  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐        │
│  │  │ Citas Este Mes   │  │ Ingresos Mes     │  │ Comisiones Mes   │        │
│  │  │                  │  │                  │  │                  │        │
│  │  │      127         │  │   $4,500,000     │  │   $1,800,000     │        │
│  │  │  ↑ 12% vs ant.   │  │   ↑ 8% vs ant.   │  │   ↑ 15% vs ant.  │        │
│  │  └──────────────────┘  └──────────────────┘  └──────────────────┘        │
│  │                                                                            │
│  │  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐        │
│  │  │ Promedio Diario  │  │ Tasa Ocupación   │  │ Calificación     │        │
│  │  │                  │  │                  │  │                  │        │
│  │  │    5.3 citas     │  │       85%        │  │   4.8 / 5.0 ⭐   │        │
│  │  │                  │  │                  │  │   (45 reseñas)   │        │
│  │  └──────────────────┘  └──────────────────┘  └──────────────────┘        │
│  │                                                                            │
│  │                                                                            │
│  │  🏆 SERVICIOS MÁS REALIZADOS (Este mes)                                   │
│  │                                                                            │
│  │  1. Alisado Brasileño     45 servicios    $2,025,000                      │
│  │  2. Corte Mujer           38 servicios    $1,330,000                      │
│  │  3. Tinte Completo        24 servicios    $1,920,000                      │
│  │  4. Mechas                15 servicios    $1,500,000                      │
│  │  5. Keratina              5 servicios     $900,000                        │
│  │                                                                            │
│  │                                                                            │
│  │  📅 HISTORIAL RECIENTE                                                    │
│  │                                                                            │
│  │  ┌────────────┬──────────────────┬────────────────┬──────────┬─────────┐ │
│  │  │ Fecha      │ Cliente          │ Servicio       │ Duración │ Estado  │ │
│  │  ├────────────┼──────────────────┼────────────────┼──────────┼─────────┤ │
│  │  │ 06/12 09:00│ Laura Gómez      │ Alisado Brasil.│ 90 min   │✓Complet.│ │
│  │  │ 06/12 11:00│ Sofia Torres     │ Corte Mujer    │ 45 min   │✓Complet.│ │
│  │  │ 05/12 15:00│ Ana Ruiz         │ Tinte          │ 60 min   │✓Complet.│ │
│  │  │ 05/12 17:00│ Pedro Martínez   │ Corte Hombre   │ 30 min   │⊗No Show │ │
│  │  │ 04/12 10:00│ Carmen López     │ Keratina       │120 min   │✓Complet.│ │
│  │  └────────────┴──────────────────┴────────────────┴──────────┴─────────┘ │
│  │                                                                            │
│  │  [Ver historial completo]                                                 │
│  │                                                                            │
│  └────────────────────────────────────────────────────────────────────────────┘
│                                                                                │
└────────────────────────────────────────────────────────────────────────────────┘
```

## Tabs del Detalle

### 📊 Resumen
- Estadísticas generales
- Servicios más realizados
- Historial reciente
- Gráfico de rendimiento

### 🗓 Horarios
- Vista de horarios semanales configurados
- Botón para editar horarios
- Total de horas semanales

### 🚫 Bloqueos
- Lista de bloqueos activos
- Próximos bloqueos
- Botón para gestionar bloqueos

### 🔧 Servicios
- Servicios asignados
- Comisiones configuradas
- Botón para gestionar servicios

### 📈 Rendimiento
- Gráficos de ventas
- Tendencias mensuales
- Comparativas

---

# COMPONENTES TÉCNICOS

## Estructura de Archivos

```
app/
└── (dashboard)/
    └── especialistas/
        ├── page.tsx                    # Lista
        ├── nuevo/
        │   └── page.tsx                # Crear
        ├── [id]/
        │   ├── page.tsx                # Detalle
        │   └── editar/
        │       └── page.tsx            # Editar

components/
└── especialistas/
    ├── EspecialistaTable.tsx           # Tabla con filtros
    ├── EspecialistaForm.tsx            # Formulario crear/editar
    ├── EspecialistaCard.tsx            # Card de info
    ├── HorariosModal.tsx               # Modal horarios
    ├── BloqueosList.tsx                # Lista de bloqueos
    ├── BloqueoForm.tsx                 # Form crear bloqueo
    ├── ServiciosAsignacion.tsx         # Modal servicios
    └── EspecialistaStats.tsx           # Estadísticas

lib/
├── validations/
│   └── especialista.ts                 # Schemas Zod
├── api/
│   └── especialistas.ts                # API calls
└── hooks/
    ├── useEspecialistas.ts             # Hook lista
    ├── useEspecialista.ts              # Hook detalle
    └── useHorarios.ts                  # Hook horarios

stores/
└── especialistaStore.ts                # Estado global
```

## Componentes React

### EspecialistaTable.tsx

```typescript
'use client'

import { useState } from 'react'
import { useEspecialistas } from '@/lib/hooks/useEspecialistas'

interface EspecialistaTableProps {
  initialData?: Especialista[]
}

export function EspecialistaTable({ initialData }: EspecialistaTableProps) {
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState({})
  const [pagination, setPagination] = useState({ page: 1, perPage: 10 })

  const { data, isLoading, error } = useEspecialistas({
    search,
    filters,
    pagination,
    initialData
  })

  // ... resto del componente
}
```

### EspecialistaForm.tsx

```typescript
'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { especialistaSchema } from '@/lib/validations/especialista'

interface EspecialistaFormProps {
  especialista?: Especialista
  onSuccess?: (data: Especialista) => void
}

export function EspecialistaForm({ especialista, onSuccess }: EspecialistaFormProps) {
  const form = useForm({
    resolver: zodResolver(especialistaSchema),
    defaultValues: especialista || {
      nombre: '',
      apellido: '',
      documento: '',
      telefono: '',
      email: '',
      fecha_ingreso: new Date(),
    }
  })

  // ... resto del componente
}
```

### HorariosModal.tsx

```typescript
'use client'

import { useState } from 'react'
import { useHorarios } from '@/lib/hooks/useHorarios'

interface HorariosModalProps {
  especialistaId: number
  isOpen: boolean
  onClose: () => void
}

export function HorariosModal({ especialistaId, isOpen, onClose }: HorariosModalProps) {
  const { horarios, updateHorarios, isLoading } = useHorarios(especialistaId)
  const [localHorarios, setLocalHorarios] = useState(horarios)

  // ... resto del componente
}
```

---

# VALIDACIONES

## Schema Zod - Especialista

```typescript
import { z } from 'zod'

export const especialistaSchema = z.object({
  nombre: z.string()
    .min(2, 'Mínimo 2 caracteres')
    .max(50, 'Máximo 50 caracteres')
    .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, 'Solo letras'),
  
  apellido: z.string()
    .min(2, 'Mínimo 2 caracteres')
    .max(50, 'Máximo 50 caracteres')
    .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, 'Solo letras'),
  
  documento: z.string()
    .min(6, 'Mínimo 6 caracteres')
    .max(15, 'Máximo 15 caracteres')
    .regex(/^[0-9]+$/, 'Solo números')
    .optional()
    .or(z.literal('')),
  
  telefono: z.string()
    .min(10, 'Mínimo 10 dígitos')
    .max(15, 'Máximo 15 caracteres')
    .regex(/^\+?[0-9\s-]+$/, 'Formato inválido'),
  
  email: z.string()
    .email('Email inválido')
    .optional()
    .or(z.literal('')),
  
  fecha_ingreso: z.date()
    .max(new Date(), 'No puede ser fecha futura')
    .optional(),
  
  foto: z.instanceof(File)
    .refine(file => file.size <= 5000000, 'Máximo 5MB')
    .refine(
      file => ['image/jpeg', 'image/png', 'image/webp'].includes(file.type),
      'Solo JPG, PNG o WEBP'
    )
    .optional(),
})
```

## Schema Zod - Horario

```typescript
export const horarioSchema = z.object({
  dia_semana: z.number().min(0).max(6),
  
  hora_inicio: z.string()
    .regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, 'Formato HH:MM'),
  
  hora_fin: z.string()
    .regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, 'Formato HH:MM'),
  
  activo: z.boolean().default(true),
}).refine(
  data => data.hora_fin > data.hora_inicio,
  {
    message: 'Hora fin debe ser mayor a hora inicio',
    path: ['hora_fin'],
  }
)

export const horariosSemanalesSchema = z.object({
  horarios: z.array(horarioSchema)
}).refine(
  data => {
    // Validar no solapamiento entre turnos del mismo día
    const porDia = {}
    for (const h of data.horarios) {
      if (!porDia[h.dia_semana]) porDia[h.dia_semana] = []
      porDia[h.dia_semana].push(h)
    }
    
    for (const dia in porDia) {
      const turnos = porDia[dia].sort((a, b) => 
        a.hora_inicio.localeCompare(b.hora_inicio)
      )
      
      for (let i = 0; i < turnos.length - 1; i++) {
        if (turnos[i].hora_fin > turnos[i + 1].hora_inicio) {
          return false
        }
      }
    }
    
    return true
  },
  {
    message: 'Hay turnos que se solapan',
  }
)
```

## Schema Zod - Bloqueo

```typescript
export const bloqueoSchema = z.object({
  titulo: z.string()
    .min(3, 'Mínimo 3 caracteres')
    .max(100, 'Máximo 100 caracteres'),
  
  fecha_inicio: z.date(),
  
  fecha_fin: z.date(),
  
  hora_inicio: z.string()
    .regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/)
    .optional(),
  
  hora_fin: z.string()
    .regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/)
    .optional(),
  
  todo_el_dia: z.boolean().default(false),
  
  es_recurrente: z.boolean().default(false),
  
  dias_semana: z.array(z.number().min(0).max(6))
    .optional(),
  
  motivo: z.string().max(500).optional(),
  
  color: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
}).refine(
  data => data.fecha_fin >= data.fecha_inicio,
  {
    message: 'Fecha fin debe ser mayor o igual a fecha inicio',
    path: ['fecha_fin'],
  }
).refine(
  data => {
    if (!data.todo_el_dia && data.hora_fin) {
      return data.hora_fin > data.hora_inicio
    }
    return true
  },
  {
    message: 'Hora fin debe ser mayor a hora inicio',
    path: ['hora_fin'],
  }
)
```

## Schema Zod - Servicio Asignado

```typescript
export const servicioAsignadoSchema = z.object({
  servicio_id: z.number().positive(),
  
  tipo_comision: z.enum(['porcentaje', 'fijo']),
  
  valor_comision: z.number()
    .positive('Debe ser mayor a 0'),
}).refine(
  data => {
    if (data.tipo_comision === 'porcentaje') {
      return data.valor_comision >= 0 && data.valor_comision <= 100
    }
    return true
  },
  {
    message: 'El porcentaje debe estar entre 0 y 100',
    path: ['valor_comision'],
  }
)
```

---

# ESTADOS Y STORE

## Zustand Store

```typescript
// stores/especialistaStore.ts
import { create } from 'zustand'

interface EspecialistaStore {
  // Estado
  especialistas: Especialista[]
  selectedEspecialista: Especialista | null
  isLoading: boolean
  error: string | null
  filters: EspecialistaFilters
  pagination: Pagination
  
  // Acciones
  setEspecialistas: (especialistas: Especialista[]) => void
  setSelectedEspecialista: (especialista: Especialista | null) => void
  setFilters: (filters: Partial<EspecialistaFilters>) => void
  setPagination: (pagination: Partial<Pagination>) => void
  
  // CRUD
  createEspecialista: (data: EspecialistaFormData) => Promise<Especialista>
  updateEspecialista: (id: number, data: Partial<EspecialistaFormData>) => Promise<Especialista>
  deleteEspecialista: (id: number) => Promise<void>
  
  // Horarios
  updateHorarios: (especialistaId: number, horarios: Horario[]) => Promise<void>
  
  // Bloqueos
  addBloqueo: (especialistaId: number, bloqueo: BloqueoFormData) => Promise<Bloqueo>
  updateBloqueo: (id: number, data: Partial<BloqueoFormData>) => Promise<Bloqueo>
  deleteBloqueo: (id: number) => Promise<void>
  
  // Servicios
  assignServicio: (especialistaId: number, data: ServicioAsignadoFormData) => Promise<void>
  updateServicioComision: (especialistaId: number, servicioId: number, data: Partial<ServicioAsignadoFormData>) => Promise<void>
  removeServicio: (especialistaId: number, servicioId: number) => Promise<void>
}

export const useEspecialistaStore = create<EspecialistaStore>((set, get) => ({
  // ... implementación
}))
```

---

# API INTEGRATION

## API Client

```typescript
// lib/api/especialistas.ts
import { apiClient } from './client'

export const especialistasApi = {
  // Lista
  getAll: async (params?: GetEspecialistasParams) => {
    const response = await apiClient.get('/api/especialistas', { params })
    return response.data
  },
  
  // Detalle
  getById: async (id: number) => {
    const response = await apiClient.get(`/api/especialistas/${id}`)
    return response.data
  },
  
  // Crear
  create: async (data: EspecialistaFormData) => {
    const formData = new FormData()
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        formData.append(key, value)
      }
    })
    
    const response = await apiClient.post('/api/especialistas', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    return response.data
  },
  
  // Actualizar
  update: async (id: number, data: Partial<EspecialistaFormData>) => {
    const response = await apiClient.put(`/api/especialistas/${id}`, data)
    return response.data
  },
  
  // Eliminar/Desactivar
  delete: async (id: number) => {
    const response = await apiClient.delete(`/api/especialistas/${id}`)
    return response.data
  },
  
  // Horarios
  getHorarios: async (id: number) => {
    const response = await apiClient.get(`/api/especialistas/${id}/horarios`)
    return response.data
  },
  
  updateHorarios: async (id: number, horarios: Horario[]) => {
    const response = await apiClient.put(`/api/especialistas/${id}/horarios`, { horarios })
    return response.data
  },
  
  // Bloqueos
  getBloqueos: async (id: number) => {
    const response = await apiClient.get(`/api/especialistas/${id}/bloqueos`)
    return response.data
  },
  
  createBloqueo: async (id: number, data: BloqueoFormData) => {
    const response = await apiClient.post(`/api/especialistas/${id}/bloqueos`, data)
    return response.data
  },
  
  updateBloqueo: async (id: number, bloqueoId: number, data: Partial<BloqueoFormData>) => {
    const response = await apiClient.put(`/api/especialistas/${id}/bloqueos/${bloqueoId}`, data)
    return response.data
  },
  
  deleteBloqueo: async (id: number, bloqueoId: number) => {
    const response = await apiClient.delete(`/api/especialistas/${id}/bloqueos/${bloqueoId}`)
    return response.data
  },
  
  // Servicios
  getServicios: async (id: number) => {
    const response = await apiClient.get(`/api/especialistas/${id}/servicios`)
    return response.data
  },
  
  assignServicio: async (id: number, data: ServicioAsignadoFormData) => {
    const response = await apiClient.post(`/api/especialistas/${id}/servicios`, data)
    return response.data
  },
  
  updateServicio: async (id: number, servicioId: number, data: Partial<ServicioAsignadoFormData>) => {
    const response = await apiClient.put(`/api/especialistas/${id}/servicios/${servicioId}`, data)
    return response.data
  },
  
  removeServicio: async (id: number, servicioId: number) => {
    const response = await apiClient.delete(`/api/especialistas/${id}/servicios/${servicioId}`)
    return response.data
  },
}
```

## Custom Hooks

```typescript
// lib/hooks/useEspecialistas.ts
import useSWR from 'swr'
import { especialistasApi } from '@/lib/api/especialistas'

export function useEspecialistas(params?: GetEspecialistasParams) {
  const { data, error, isLoading, mutate } = useSWR(
    ['/api/especialistas', params],
    ([_, params]) => especialistasApi.getAll(params)
  )
  
  return {
    especialistas: data,
    isLoading,
    error,
    mutate,
  }
}

// lib/hooks/useEspecialista.ts
export function useEspecialista(id: number) {
  const { data, error, isLoading, mutate } = useSWR(
    id ? `/api/especialistas/${id}` : null,
    () => especialistasApi.getById(id)
  )
  
  return {
    especialista: data,
    isLoading,
    error,
    mutate,
  }
}

// lib/hooks/useHorarios.ts
export function useHorarios(especialistaId: number) {
  const { data, error, isLoading, mutate } = useSWR(
    `/api/especialistas/${especialistaId}/horarios`,
    () => especialistasApi.getHorarios(especialistaId)
  )
  
  const updateHorarios = async (horarios: Horario[]) => {
    await especialistasApi.updateHorarios(especialistaId, horarios)
    mutate()
  }
  
  return {
    horarios: data,
    isLoading,
    error,
    updateHorarios,
  }
}
```

---

# TIPOS TYPESCRIPT

```typescript
// types/especialista.ts

export interface Especialista {
  id: number
  nombre: string
  apellido: string
  nombre_completo: string  // Computed
  documento_identidad?: string
  telefono: string
  email?: string
  foto?: string
  estado: 'activo' | 'inactivo'
  fecha_ingreso?: Date
  fecha_creacion: Date
  fecha_actualizacion: Date
}

export interface EspecialistaFormData {
  nombre: string
  apellido: string
  documento_identidad?: string
  telefono: string
  email?: string
  foto?: File
  fecha_ingreso?: Date
}

export interface Horario {
  id: number
  especialista_id: number
  dia_semana: number  // 0-6
  hora_inicio: string  // HH:MM
  hora_fin: string     // HH:MM
  activo: boolean
}

export interface Bloqueo {
  id: number
  especialista_id: number
  titulo: string
  fecha_inicio: Date
  fecha_fin: Date
  hora_inicio?: string
  hora_fin?: string
  todo_el_dia: boolean
  es_recurrente: boolean
  dias_semana?: number[]
  motivo?: string
  color?: string
  fecha_creacion: Date
}

export interface BloqueoFormData {
  titulo: string
  fecha_inicio: Date
  fecha_fin: Date
  hora_inicio?: string
  hora_fin?: string
  todo_el_dia?: boolean
  es_recurrente?: boolean
  dias_semana?: number[]
  motivo?: string
  color?: string
}

export interface ServicioAsignado {
  servicio_id: number
  servicio_nombre: string
  precio_base: number
  tipo_comision: 'porcentaje' | 'fijo'
  valor_comision: number
  comision_calculada: number  // Computed
}

export interface ServicioAsignadoFormData {
  servicio_id: number
  tipo_comision: 'porcentaje' | 'fijo'
  valor_comision: number
}

export interface EspecialistaFilters {
  estado?: 'activo' | 'inactivo'
  servicios?: number[]
  search?: string
}

export interface Pagination {
  page: number
  perPage: number
  total: number
  totalPages: number
}

export interface GetEspecialistasParams {
  search?: string
  estado?: string
  page?: number
  perPage?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}
```

---

**Documento creado para:** Sistema Club de Alisados - Módulo Especialistas  
**Stack:** Next.js 14+ con TypeScript  
**Fecha:** Diciembre 2024  
**Versión:** 1.0
