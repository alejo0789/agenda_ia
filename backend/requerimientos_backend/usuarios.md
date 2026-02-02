Requerimientos de Frontend - Módulo de Administración de Usuarios
Club de Alisados - Stack: Next.js 14+ (App Router) + TypeScriptTabla de Contenido
Resumen y Arquitectura Multi-Sede
Gestión de Sedes
Gestión de Usuarios
Gestión de Roles y Permisos
Mi Perfil (Usuario Actual)
Primer Acceso de Especialistas
Estados, Validaciones y Seguridad
Componentes Compartidos
Flujos de Usuario
Integraciones con Otros Módulos
Consideraciones de UX
Checklist de Implementación
1. RESUMEN Y ARQUITECTURA MULTI-SEDE1.1 Descripción GeneralEl módulo de Administración de Usuarios gestiona el personal del sistema (administradores, cajeros, especialistas) con un sistema de roles y permisos segregados por sede. Incluye gestión de sedes, usuarios, roles y el flujo especial de primer acceso para especialistas.1.2 Arquitectura Multi-SedeJerarquía de RolesRolAlcanceCapacidadesSuper AdministradorGlobal (todas las sedes)Gestión completa del sistema, crear/editar sedes, ver reportes globales, gestionar usuarios de cualquier sedeAdministrador de SedeSu sede únicamenteGestionar usuarios, especialistas, clientes, inventario, reportes de su sedeCajeroSu sede únicamentePOS, gestión de citas, clientes de su sedeEspecialistaSu sede únicamenteVer sus citas, registrar servicios realizadosReglas de Segregación de DatosEntidadRegla de VisibilidadUsuariosSolo usuarios de la misma sede (excepto Super Admin)EspecialistasSolo especialistas de la misma sedeClientesSolo clientes atendidos en la sedeCitasSolo citas de la sedeFacturasSolo facturas de la sedeInventarioCada sede tiene su propio inventarioReportesFiltrados por sede (Super Admin puede ver consolidado)Diagrama de Contexto┌─────────────────────────────────────────────────────────────┐
│                    SUPER ADMINISTRADOR                       │
│              (Acceso global a todas las sedes)              │
└─────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        ▼                     ▼                     ▼
┌───────────────┐     ┌───────────────┐     ┌───────────────┐
│   SEDE NORTE  │     │  SEDE CENTRO  │     │   SEDE SUR    │
├───────────────┤     ├───────────────┤     ├───────────────┤
│ Admin Sede    │     │ Admin Sede    │     │ Admin Sede    │
│ Cajeros       │     │ Cajeros       │     │ Cajeros       │
│ Especialistas │     │ Especialistas │     │ Especialistas │
│ Clientes      │     │ Clientes      │     │ Clientes      │
│ Inventario    │     │ Inventario    │     │ Inventario    │
└───────────────┘     └───────────────┘     └───────────────┘1.3 Cambios Requeridos en Base de DatosNueva Tabla: sedessqlCREATE TABLE sedes (
    id SERIAL PRIMARY KEY,
    codigo VARCHAR(20) NOT NULL UNIQUE,
    nombre VARCHAR(100) NOT NULL,
    direccion TEXT,
    telefono VARCHAR(20),
    email VARCHAR(100),
    estado VARCHAR(20) DEFAULT 'activa' CHECK (estado IN ('activa', 'inactiva')),
    es_principal BOOLEAN DEFAULT FALSE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);Modificaciones a Tablas Existentessql-- Agregar sede_id a usuarios
ALTER TABLE usuarios ADD COLUMN sede_id INTEGER REFERENCES sedes(id);

-- Agregar sede_id a especialistas
ALTER TABLE especialistas ADD COLUMN sede_id INTEGER REFERENCES sedes(id);

-- Agregar sede_id a clientes
ALTER TABLE clientes ADD COLUMN sede_id INTEGER REFERENCES sedes(id);

-- Agregar sede_id a citas
ALTER TABLE citas ADD COLUMN sede_id INTEGER REFERENCES sedes(id);

-- Agregar sede_id a facturas
ALTER TABLE facturas ADD COLUMN sede_id INTEGER REFERENCES sedes(id);

-- Agregar sede_id a cajas
ALTER TABLE cajas ADD COLUMN sede_id INTEGER REFERENCES sedes(id);

-- Agregar campos para primer acceso en usuarios
ALTER TABLE usuarios ADD COLUMN requiere_cambio_password BOOLEAN DEFAULT FALSE;
ALTER TABLE usuarios ADD COLUMN primer_acceso BOOLEAN DEFAULT TRUE;1.4 Estructura de Rutas/admin
  /sedes                    → Gestión de sedes (Solo Super Admin)
  /usuarios                 → Lista de usuarios
  /usuarios/nuevo           → Crear usuario
  /usuarios/[id]            → Editar usuario
  /roles                    → Gestión de roles (Solo lectura, roles fijos)
  /mi-perfil                → Perfil del usuario actual

/auth
  /primer-acceso            → Flujo de primer acceso para especialistas2. GESTIÓN DE SEDES2.1 Lista de SedesRequisitos FuncionalesIDRequisitoPrioridadFE-SEDE-001Mostrar lista de sedes con código, nombre, dirección, estadoCríticaFE-SEDE-002Indicador visual de sede principal (badge especial)AltaFE-SEDE-003Badge de estado: Activa (verde), Inactiva (gris)AltaFE-SEDE-004Contador de usuarios por sedeMediaFE-SEDE-005Búsqueda por nombre o códigoAltaFE-SEDE-006Filtro por estado (Todas/Activas/Inactivas)MediaFE-SEDE-007Botón "Nueva Sede" - Solo Super AdminCríticaFE-SEDE-008Acciones por fila: Editar, Activar/DesactivarCríticaFE-SEDE-009No permitir desactivar sede con usuarios activosCríticaFE-SEDE-010Vista responsive: tabla en desktop, cards en mobileAltaComponentes UItypescript// Componente principal
<SedesListView />
  ├─ <PageHeader title="Gestión de Sedes" />
  ├─ <SedesToolbar>
  │   ├─ <SearchInput placeholder="Buscar sedes..." />
  │   ├─ <FilterStatus />
  │   └─ <Button>Nueva Sede</Button>
  ├─ <SedesTable>
  │   ├─ <TableHeader />
  │   └─ <TableBody>
  │       └─ <SedeRow>
  │           ├─ <SedeCode />
  │           ├─ <SedeName />
  │           ├─ <SedeAddress />
  │           ├─ <PrincipalBadge /> (condicional)
  │           ├─ <StatusBadge />
  │           ├─ <UsersCount />
  │           └─ <RowActions>
  │               ├─ <EditButton />
  │               └─ <ToggleStatusButton />
  └─ <EmptyState /> (cuando no hay sedes)Endpoints ConsumidosEndpointMétodoUso/api/sedesGETListar sedes/api/sedesPOSTCrear sede/api/sedes/{id}PUTActualizar sede/api/sedes/{id}/estadoPUTCambiar estadoValidaciones FrontendCampoValidacionesCódigoRequerido, 2-20 caracteres, alfanumérico, únicoNombreRequerido, 3-100 caracteresDirecciónOpcional, máximo 500 caracteresTeléfonoOpcional, formato válidoEmailOpcional, formato email válido2.2 Modal de Crear/Editar SedeRequisitos FuncionalesIDRequisitoPrioridadFE-SEDE-011Modal responsive (drawer en mobile)CríticaFE-SEDE-012Campos: código, nombre, dirección, teléfono, emailCríticaFE-SEDE-013Checkbox "Es sede principal" (solo puede haber una)AltaFE-SEDE-014Código auto-generado sugerido (editable)MediaFE-SEDE-015Validación en tiempo realCríticaFE-SEDE-016Loading state durante guardadoAltaFE-SEDE-017Toast de éxito/errorCríticaEstructura del Formulariotypescriptinterface SedeFormData {
  codigo: string;
  nombre: string;
  direccion?: string;
  telefono?: string;
  email?: string;
  es_principal: boolean;
}Componentes UItypescript<SedeFormModal 
  mode="create" | "edit"
  sede={existingData} // solo en edit
  onSave={handleSave}
  onClose={handleClose}
/>
  ├─ <FormInput name="codigo" label="Código" />
  ├─ <FormInput name="nombre" label="Nombre de la Sede" />
  ├─ <FormTextarea name="direccion" label="Dirección" />
  ├─ <FormInput name="telefono" label="Teléfono" />
  ├─ <FormInput name="email" label="Email" type="email" />
  ├─ <Checkbox name="es_principal" label="Es sede principal" />
  └─ <FormActions>
      ├─ <Button variant="outline">Cancelar</Button>
      └─ <Button type="submit" loading={isSaving}>Guardar</Button>Mockup ASCII - Modal Crear Sede┌─────────────────────────────────────────────────────────┐
│  Nueva Sede                                        [X]  │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Código *                                               │
│  ┌─────────────────────────────────────────────────┐   │
│  │ SEDE-001                                        │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  Nombre *                                               │
│  ┌─────────────────────────────────────────────────┐   │
│  │ Sede Centro                                     │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  Dirección                                              │
│  ┌─────────────────────────────────────────────────┐   │
│  │ Av. Principal #123, Centro                      │   │
│  │                                                 │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  Teléfono                      Email                    │
│  ┌──────────────────────┐     ┌──────────────────────┐ │
│  │ +57 300 123 4567     │     │ centro@club.com      │ │
│  └──────────────────────┘     └──────────────────────┘ │
│                                                         │
│  ☐ Es sede principal                                   │
│                                                         │
├─────────────────────────────────────────────────────────┤
│                        [Cancelar]  [💾 Guardar Sede]   │
└─────────────────────────────────────────────────────────┘3. GESTIÓN DE USUARIOS3.1 Lista de UsuariosRequisitos FuncionalesIDRequisitoPrioridadFE-USR-001Mostrar tabla con: nombre, username, email, rol, sede, estadoCríticaFE-USR-002Filtrar usuarios por sede actual (Admin Sede ve solo su sede)CríticaFE-USR-003Super Admin puede ver usuarios de todas las sedesCríticaFE-USR-004Selector de sede para filtrar (solo Super Admin)AltaFE-USR-005Badge de rol con color distintivoAltaFE-USR-006Badge de estado: Activo (verde), Inactivo (gris), Bloqueado (rojo)AltaFE-USR-007Indicador si usuario está vinculado a especialistaMediaFE-USR-008Búsqueda por nombre, username o emailCríticaFE-USR-009Filtros: Por rol, Por estadoAltaFE-USR-010Ordenamiento por: Nombre, Fecha creación, Último accesoMediaFE-USR-011Paginación (10, 25, 50 por página)MediaFE-USR-012Botón "Nuevo Usuario" con permiso usuarios.crearCríticaFE-USR-013Acciones: Ver, Editar, Cambiar estado, Resetear contraseñaCríticaFE-USR-014Fecha de último acceso formateada (hace 2 horas, ayer, etc.)MediaFE-USR-015Indicador visual de usuarios bloqueados por intentos fallidosAltaEstructura de la Tablatypescriptinterface UsuarioTableRow {
  id: number;
  username: string;
  email: string;
  nombre: string;
  rol: {
    id: number;
    nombre: string;
  };
  sede: {
    id: number;
    nombre: string;
    codigo: string;
  };
  especialista?: {
    id: number;
    nombre: string;
    apellido: string;
  };
  estado: 'activo' | 'inactivo' | 'bloqueado';
  ultimo_acceso?: string;
  intentos_fallidos: number;
  fecha_creacion: string;
}Componentes UItypescript<UsuariosListView />
  ├─ <PageHeader title="Gestión de Usuarios" />
  ├─ <UsuariosToolbar>
  │   ├─ <SearchInput placeholder="Buscar usuarios..." />
  │   ├─ <SedeSelector /> (solo Super Admin)
  │   ├─ <FilterRol />
  │   ├─ <FilterStatus />
  │   └─ <Button icon={Plus}>Nuevo Usuario</Button>
  ├─ <UsuariosTable>
  │   ├─ <TableHeader sortable />
  │   └─ <TableBody>
  │       └─ <UsuarioRow>
  │           ├─ <UserAvatar name={nombre} />
  │           ├─ <UserInfo>
  │           │   ├─ <UserName />
  │           │   └─ <UserEmail />
  │           ├─ <RolBadge />
  │           ├─ <SedeBadge />
  │           ├─ <EspecialistaLink /> (si vinculado)
  │           ├─ <StatusBadge />
  │           ├─ <LastAccess />
  │           └─ <RowActions>
  │               ├─ <ViewButton />
  │               ├─ <EditButton />
  │               ├─ <ResetPasswordButton />
  │               └─ <ToggleStatusDropdown />
  ├─ <TablePagination />
  └─ <EmptyState />Endpoints ConsumidosEndpointMétodoUso/api/usuariosGETListar usuarios (filtrado por sede del usuario actual)/api/usuarios?sede_id={id}GETFiltrar por sede (Super Admin)/api/usuarios/{id}GETObtener detalle/api/usuariosPOSTCrear usuario/api/usuarios/{id}PUTActualizar usuario/api/usuarios/{id}/estadoPUTCambiar estado/api/usuarios/{id}/reset-passwordPOSTForzar cambio de contraseña/api/usuarios/{id}/desbloquearPOSTDesbloquear usuarioValidaciones FrontendCampoValidacionesUsernameRequerido, 3-50 caracteres, alfanumérico y guiones, únicoEmailRequerido, formato email válido, únicoNombreRequerido, 2-100 caracteresRolRequerido, selección de listaSedeRequerido, selección de lista (auto-asignada para Admin Sede)ContraseñaMínimo 8 caracteres, 1 mayúscula, 1 número, 1 especialMockup ASCII - Lista de Usuarios┌─────────────────────────────────────────────────────────────────────────────┐
│  Gestión de Usuarios                                                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  🔍 Buscar usuarios...          [Sede: Todas ▼] [Rol ▼] [Estado ▼]  [+ Nuevo Usuario] │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │ Usuario          │ Rol              │ Sede      │ Estado   │ Acciones  ││
│  ├─────────────────────────────────────────────────────────────────────────┤│
│  │ 👤 María García   │ [Admin Sede]     │ Centro    │ 🟢 Activo │ ⋮        ││
│  │   maria@club.com │                  │           │          │          ││
│  │   Hace 2 horas   │                  │           │          │          ││
│  ├─────────────────────────────────────────────────────────────────────────┤│
│  │ 👤 Juan Pérez     │ [Cajero]         │ Centro    │ 🟢 Activo │ ⋮        ││
│  │   juan@club.com  │                  │           │          │          ││
│  │   Ayer           │                  │           │          │          ││
│  ├─────────────────────────────────────────────────────────────────────────┤│
│  │ 👤 Ana López      │ [Especialista]   │ Norte     │ 🔴 Bloq. │ ⋮        ││
│  │   ana@club.com   │ → Ana López (E)  │           │ 5 intent.│          ││
│  │   Hace 1 semana  │                  │           │          │          ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                                                             │
│  Mostrando 1-10 de 45 usuarios                    [< 1 2 3 4 5 >]          │
└─────────────────────────────────────────────────────────────────────────────┘3.2 Formulario Crear/Editar UsuarioRequisitos FuncionalesIDRequisitoPrioridadFE-USR-016Página completa para crear/editar (no modal)CríticaFE-USR-017Secciones: Información básica, Acceso, ConfiguraciónCríticaFE-USR-018Campo contraseña solo visible en modo crearCríticaFE-USR-019Generador de contraseña segura con botón "Generar"AltaFE-USR-020Selector de rol con descripción de permisosAltaFE-USR-021Selector de sede (deshabilitado para Admin Sede - usa su sede)CríticaFE-USR-022Vincular a especialista existente (si rol es Especialista)CríticaFE-USR-023Crear especialista automáticamente si no existeAltaFE-USR-024Checkbox "Forzar cambio de contraseña en primer acceso"AltaFE-USR-025Preview de permisos según rol seleccionadoMediaFE-USR-026Validación en tiempo real de username y email únicosCríticaFE-USR-027Breadcrumb de navegaciónMediaEstructura del Formulariotypescriptinterface UsuarioFormData {
  // Información básica
  nombre: string;
  username: string;
  email: string;
  
  // Acceso
  password?: string; // Solo en crear
  rol_id: number;
  sede_id: number;
  
  // Vinculación especialista
  vincular_especialista: boolean;
  especialista_id?: number; // Si ya existe
  crear_especialista?: boolean; // Crear nuevo
  especialista_data?: {
    documento_identidad: string;
    telefono?: string;
    fecha_ingreso?: string;
  };
  
  // Configuración
  estado: 'activo' | 'inactivo';
  forzar_cambio_password: boolean;
}Componentes UItypescript<UsuarioFormPage mode="create" | "edit" />
  ├─ <Breadcrumb>
  │   └─ Administración > Usuarios > Nuevo Usuario
  ├─ <PageHeader 
  │     title="Nuevo Usuario" | "Editar Usuario"
  │     actions={<SaveButton />}
  │   />
  ├─ <FormContainer>
  │   ├─ <Card title="Información Básica">
  │   │   ├─ <FormInput name="nombre" label="Nombre Completo" />
  │   │   ├─ <FormInput name="username" label="Usuario" />
  │   │   └─ <FormInput name="email" label="Email" type="email" />
  │   │
  │   ├─ <Card title="Acceso al Sistema">
  │   │   ├─ <PasswordSection> (solo crear)
  │   │   │   ├─ <FormInput name="password" type="password" />
  │   │   │   ├─ <GeneratePasswordButton />
  │   │   │   └─ <PasswordStrengthIndicator />
  │   │   ├─ <RolSelector>
  │   │   │   ├─ <RolOption rol="super_admin" />
  │   │   │   ├─ <RolOption rol="admin_sede" />
  │   │   │   ├─ <RolOption rol="cajero" />
  │   │   │   └─ <RolOption rol="especialista" />
  │   │   ├─ <SedeSelector /> (disabled para admin_sede)
  │   │   └─ <PermissionsPreview rol_id={selectedRol} />
  │   │
  │   ├─ <Card title="Vinculación Especialista"> (si rol = especialista)
  │   │   ├─ <RadioGroup>
  │   │   │   ├─ <Radio value="existing">Vincular a especialista existente</Radio>
  │   │   │   └─ <Radio value="create">Crear nuevo especialista</Radio>
  │   │   ├─ <EspecialistaCombobox /> (si existing)
  │   │   └─ <EspecialistaQuickForm /> (si create)
  │   │       ├─ <FormInput name="documento_identidad" />
  │   │       ├─ <FormInput name="telefono" />
  │   │       └─ <FormInput name="fecha_ingreso" type="date" />
  │   │
  │   └─ <Card title="Configuración">
  │       ├─ <StatusToggle estado={estado} />
  │       └─ <Checkbox name="forzar_cambio_password">
  │            Forzar cambio de contraseña en primer acceso
  │          </Checkbox>
  │
  └─ <FormActions sticky>
      ├─ <Button variant="outline" href="/admin/usuarios">Cancelar</Button>
      └─ <Button type="submit" loading={isSaving}>Guardar Usuario</Button>Mockup ASCII - Formulario Crear Usuario┌─────────────────────────────────────────────────────────────────────────────┐
│  ← Administración > Usuarios > Nuevo Usuario                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Nuevo Usuario                                          [Guardar Usuario]   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │ INFORMACIÓN BÁSICA                                                      ││
│  ├─────────────────────────────────────────────────────────────────────────┤│
│  │                                                                         ││
│  │  Nombre Completo *                                                      ││
│  │  ┌─────────────────────────────────────────────────────────────────┐   ││
│  │  │ María García López                                              │   ││
│  │  └─────────────────────────────────────────────────────────────────┘   ││
│  │                                                                         ││
│  │  Usuario *                          Email *                             ││
│  │  ┌────────────────────────┐        ┌────────────────────────────────┐  ││
│  │  │ mgarcia                │ ✓      │ maria.garcia@clubalisados.com  │  ││
│  │  └────────────────────────┘        └────────────────────────────────┘  ││
│  │                                                                         ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │ ACCESO AL SISTEMA                                                       ││
│  ├─────────────────────────────────────────────────────────────────────────┤│
│  │                                                                         ││
│  │  Contraseña *                                                           ││
│  │  ┌─────────────────────────────────────────────────────┐ [🔄 Generar]  ││
│  │  │ ••••••••••••                                        │               ││
│  │  └─────────────────────────────────────────────────────┘               ││
│  │  ████████░░ Fuerte                                                      ││
│  │                                                                         ││
│  │  Rol *                              Sede *                              ││
│  │  ┌────────────────────────┐        ┌────────────────────────────────┐  ││
│  │  │ Especialista        ▼  │        │ Sede Centro                 ▼  │  ││
│  │  └────────────────────────┘        └────────────────────────────────┘  ││
│  │                                                                         ││
│  │  📋 Permisos del rol:                                                   ││
│  │  • Ver agenda propia           • Ver citas asignadas                    ││
│  │  • Registrar servicios         • Ver clientes                          ││
│  │                                                                         ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │ VINCULACIÓN ESPECIALISTA                                                ││
│  ├─────────────────────────────────────────────────────────────────────────┤│
│  │                                                                         ││
│  │  ◉ Vincular a especialista existente                                    ││
│  │  ○ Crear nuevo especialista                                             ││
│  │                                                                         ││
│  │  Seleccionar Especialista                                               ││
│  │  ┌─────────────────────────────────────────────────────────────────┐   ││
│  │  │ 🔍 Buscar por nombre o documento...                             │   ││
│  │  └─────────────────────────────────────────────────────────────────┘   ││
│  │                                                                         ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │ CONFIGURACIÓN                                                           ││
│  ├─────────────────────────────────────────────────────────────────────────┤│
│  │                                                                         ││
│  │  Estado                                                                  ││
│  │  [🟢 Activo ═══════════○] Inactivo                                      ││
│  │                                                                         ││
│  │  ☑ Forzar cambio de contraseña en primer acceso                        ││
│  │                                                                         ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                                                             │
│                                      [Cancelar]  [💾 Guardar Usuario]       │
└─────────────────────────────────────────────────────────────────────────────┘3.3 Acciones sobre UsuariosCambiar Estado de UsuarioIDRequisitoPrioridadFE-USR-028Dropdown con opciones: Activar, Desactivar, BloquearCríticaFE-USR-029Confirmación antes de bloquear usuarioAltaFE-USR-030No permitir desactivar el propio usuarioCríticaFE-USR-031No permitir desactivar último Super AdminCríticaFE-USR-032Botón "Desbloquear" visible solo para usuarios bloqueadosAltaResetear ContraseñaIDRequisitoPrioridadFE-USR-033Modal de confirmación para resetear contraseñaCríticaFE-USR-034Opción: Generar contraseña temporal o establecer manualAltaFE-USR-035Mostrar contraseña generada una sola vez (con botón copiar)CríticaFE-USR-036Forzar cambio en próximo login automáticamenteCríticaFE-USR-037Notificación de que el usuario deberá cambiar contraseñaAltaMockup ASCII - Modal Resetear Contraseña┌─────────────────────────────────────────────────────────┐
│  Resetear Contraseña                               [X]  │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ⚠️ Esta acción reseteará la contraseña de:            │
│                                                         │
│  👤 María García (mgarcia)                             │
│                                                         │
│  ─────────────────────────────────────────────────────  │
│                                                         │
│  ◉ Generar contraseña temporal automática              │
│  ○ Establecer contraseña manualmente                   │
│                                                         │
│  ☑ El usuario deberá cambiar la contraseña en su       │
│    próximo inicio de sesión                            │
│                                                         │
├─────────────────────────────────────────────────────────┤
│                    [Cancelar]  [🔄 Resetear Contraseña] │
└─────────────────────────────────────────────────────────┘Mockup ASCII - Contraseña Generada┌─────────────────────────────────────────────────────────┐
│  Contraseña Reseteada                              [X]  │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ✅ La contraseña ha sido reseteada exitosamente       │
│                                                         │
│  Nueva contraseña temporal:                             │
│  ┌─────────────────────────────────────────────────┐   │
│  │ Xk9#mP2$vL7n                              [📋]  │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  ⚠️ Esta contraseña solo se mostrará una vez.         │
│     Asegúrese de copiarla y entregarla al usuario.    │
│                                                         │
│  El usuario deberá cambiar esta contraseña en su       │
│  próximo inicio de sesión.                             │
│                                                         │
├─────────────────────────────────────────────────────────┤
│                                           [Entendido]   │
└─────────────────────────────────────────────────────────┘4. GESTIÓN DE ROLES Y PERMISOS4.1 Vista de Roles (Solo Lectura)Requisitos FuncionalesIDRequisitoPrioridadFE-ROL-001Mostrar lista de roles del sistema (solo lectura)CríticaFE-ROL-002Vista en cards con descripción y permisosAltaFE-ROL-003Expandir/colapsar permisos por rolMediaFE-ROL-004Contador de usuarios por rolMediaFE-ROL-005Agrupar permisos por móduloAltaFE-ROL-006Indicador visual de rol de sistema (no editable)AltaFE-ROL-007Badge de alcance: Global / Por SedeAltaRoles Predefinidostypescriptconst ROLES_SISTEMA = [
  {
    id: 1,
    nombre: 'Super Administrador',
    codigo: 'super_admin',
    descripcion: 'Acceso completo a todas las sedes y funcionalidades del sistema',
    alcance: 'global',
    es_sistema: true,
    permisos: ['*'] // Todos los permisos
  },
  {
    id: 2,
    nombre: 'Administrador de Sede',
    codigo: 'admin_sede',
    descripcion: 'Gestión completa de una sede específica',
    alcance: 'sede',
    es_sistema: true,
    permisos: [
      'usuarios.ver', 'usuarios.crear', 'usuarios.editar',
      'especialistas.*', 'clientes.*', 'servicios.*',
      'agenda.*', 'caja.*', 'inventario.*', 'reportes.sede'
    ]
  },
  {
    id: 3,
    nombre: 'Cajero',
    codigo: 'cajero',
    descripcion: 'Gestión de punto de venta, citas y clientes',
    alcance: 'sede',
    es_sistema: true,
    permisos: [
      'clientes.ver', 'clientes.crear', 'clientes.editar',
      'agenda.ver', 'agenda.crear', 'agenda.editar',
      'caja.*', 'inventario.ver'
    ]
  },
  {
    id: 4,
    nombre: 'Especialista',
    codigo: 'especialista',
    descripcion: 'Acceso a agenda propia y registro de servicios',
    alcance: 'sede',
    es_sistema: true,
    permisos: [
      'agenda.ver_propia', 'servicios.ver',
      'clientes.ver', 'app_movil.*'
    ]
  }
];Componentes UItypescript<RolesListView />
  ├─ <PageHeader title="Roles del Sistema" />
  ├─ <InfoBanner>
  │   ℹ️ Los roles son predefinidos y no pueden modificarse
  ├─ <RolesGrid>
  │   └─ <RolCard>
  │       ├─ <RolHeader>
  │       │   ├─ <RolName />
  │       │   ├─ <AlcanceBadge global|sede />
  │       │   └─ <UsersCount />
  │       ├─ <RolDescription />
  │       └─ <PermissionsAccordion>
  │           ├─ <PermissionGroup modulo="Usuarios">
  │           │   ├─ <PermissionItem codigo="usuarios.ver" />
  │           │   └─ <PermissionItem codigo="usuarios.crear" />
  │           └─ <PermissionGroup modulo="Clientes">
  │               └─ ...
  └─ <EmptyState />Mockup ASCII - Vista de Roles┌─────────────────────────────────────────────────────────────────────────────┐
│  Roles del Sistema                                                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ℹ️ Los roles son predefinidos por el sistema y no pueden modificarse.     │
│                                                                             │
│  ┌─────────────────────────────────┐  ┌─────────────────────────────────┐  │
│  │ 👑 SUPER ADMINISTRADOR          │  │ 🏢 ADMINISTRADOR DE SEDE        │  │
│  │ [Global]           3 usuarios   │  │ [Por Sede]         5 usuarios   │  │
│  ├─────────────────────────────────┤  ├─────────────────────────────────┤  │
│  │ Acceso completo a todas las     │  │ Gestión completa de una sede    │  │
│  │ sedes y funcionalidades del     │  │ específica.                     │  │
│  │ sistema.                        │  │                                 │  │
│  │                                 │  │                                 │  │
│  │ ▼ Ver permisos (45)            │  │ ▼ Ver permisos (32)            │  │
│  │ ┌─────────────────────────────┐ │  │ ┌─────────────────────────────┐ │  │
│  │ │ Usuarios                    │ │  │ │ Usuarios                    │ │  │
│  │ │  ✓ Ver  ✓ Crear  ✓ Editar  │ │  │ │  ✓ Ver  ✓ Crear  ✓ Editar  │ │  │
│  │ │  ✓ Eliminar                │ │  │ │  ✗ Eliminar                │ │  │
│  │ │ Clientes                    │ │  │ │ Clientes                    │ │  │
│  │ │  ✓ Ver  ✓ Crear  ✓ Editar  │ │  │ │  ✓ Ver  ✓ Crear  ✓ Editar  │ │  │
│  │ │  ✓ Eliminar                │ │  │ │  ✓ Eliminar                │ │  │
│  │ └─────────────────────────────┘ │  │ └─────────────────────────────┘ │  │
│  └─────────────────────────────────┘  └─────────────────────────────────┘  │
│                                                                             │
│  ┌─────────────────────────────────┐  ┌─────────────────────────────────┐  │
│  │ 💰 CAJERO                       │  │ ✂️ ESPECIALISTA                 │  │
│  │ [Por Sede]        12 usuarios   │  │ [Por Sede]        25 usuarios   │  │
│  ├─────────────────────────────────┤  ├─────────────────────────────────┤  │
│  │ Gestión de punto de venta,      │  │ Acceso a agenda propia y        │  │
│  │ citas y clientes.               │  │ registro de servicios.          │  │
│  │                                 │  │                                 │  │
│  │ ▶ Ver permisos (18)            │  │ ▶ Ver permisos (8)             │  │
│  └─────────────────────────────────┘  └─────────────────────────────────┘  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘5. MI PERFIL (USUARIO ACTUAL)5.1 Vista de PerfilRequisitos FuncionalesIDRequisitoPrioridadFE-PERF-001Mostrar información del usuario actualCríticaFE-PERF-002Secciones: Datos personales, Seguridad, Sesiones activasCríticaFE-PERF-003Editar nombre y email (no username)AltaFE-PERF-004Cambiar contraseña propiaCríticaFE-PERF-005Ver sesiones activas con dispositivo, IP, fechaAltaFE-PERF-006Cerrar sesiones remotamente (excepto la actual)AltaFE-PERF-007Cerrar todas las sesiones excepto la actualMediaFE-PERF-008Mostrar rol y sede asignada (no editable)AltaFE-PERF-009Historial de actividad recienteMediaComponentes UItypescript<MiPerfilPage />
  ├─ <PageHeader title="Mi Perfil" />
  ├─ <ProfileGrid>
  │   ├─ <ProfileSidebar>
  │   │   ├─ <Avatar size="xl" />
  │   │   ├─ <UserName />
  │   │   ├─ <UserEmail />
  │   │   ├─ <RolBadge />
  │   │   └─ <SedeBadge />
  │   │
  │   └─ <ProfileContent>
  │       ├─ <Card title="Información Personal">
  │       │   ├─ <FormInput name="nombre" editable />
  │       │   ├─ <FormInput name="email" editable />
  │       │   ├─ <FormInput name="username" disabled />
  │       │   └─ <SaveButton />
  │       │
  │       ├─ <Card title="Seguridad">
  │       │   ├─ <PasswordChangeSection>
  │       │   │   ├─ <FormInput name="password_actual" type="password" />
  │       │   │   ├─ <FormInput name="password_nuevo" type="password" />
  │       │   │   ├─ <FormInput name="password_confirmar" type="password" />
  │       │   │   ├─ <PasswordStrengthIndicator />
  │       │   │   └─ <Button>Cambiar Contraseña</Button>
  │       │   └─ <LastPasswordChange date={fecha} />
  │       │
  │       └─ <Card title="Sesiones Activas">
  │           ├─ <SessionsList>
  │           │   └─ <SessionItem>
  │           │       ├─ <DeviceIcon />
  │           │       ├─ <DeviceInfo />
  │           │       ├─ <IPAddress />
  │           │       ├─ <LastActive />
  │           │       ├─ <CurrentBadge /> (si es la actual)
  │           │       └─ <CloseSessionButton />
  │           └─ <Button variant="outline">Cerrar todas las sesiones</Button>Endpoints ConsumidosEndpointMétodoUso/api/usuarios/meGETObtener perfil actual/api/usuarios/mePUTActualizar perfil/api/auth/change-passwordPUTCambiar contraseña/api/usuarios/me/sesionesGETListar sesiones activas/api/usuarios/me/sesiones/{id}DELETECerrar sesión específica/api/auth/logout-allPOSTCerrar todas las sesionesMockup ASCII - Mi Perfil┌─────────────────────────────────────────────────────────────────────────────┐
│  Mi Perfil                                                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌───────────────────┐  ┌─────────────────────────────────────────────────┐│
│  │                   │  │ INFORMACIÓN PERSONAL                            ││
│  │       👤          │  ├─────────────────────────────────────────────────┤│
│  │    (Avatar)       │  │                                                 ││
│  │                   │  │  Nombre Completo                                ││
│  │  María García     │  │  ┌─────────────────────────────────────────┐   ││
│  │  maria@club.com   │  │  │ María García López                      │   ││
│  │                   │  │  └─────────────────────────────────────────┘   ││
│  │  [Admin Sede]     │  │                                                 ││
│  │  📍 Sede Centro   │  │  Email                                         ││
│  │                   │  │  ┌─────────────────────────────────────────┐   ││
│  └───────────────────┘  │  │ maria.garcia@clubalisados.com           │   ││
│                         │  └─────────────────────────────────────────┘   ││
│                         │                                                 ││
│                         │  Usuario (no editable)                          ││
│                         │  ┌─────────────────────────────────────────┐   ││
│                         │  │ mgarcia                            🔒   │   ││
│                         │  └─────────────────────────────────────────┘   ││
│                         │                                                 ││
│                         │                              [Guardar Cambios]  ││
│                         └─────────────────────────────────────────────────┘│
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │ SEGURIDAD                                                               ││
│  ├─────────────────────────────────────────────────────────────────────────┤│
│  │                                                                         ││
│  │  Contraseña Actual *        Nueva Contraseña *                          ││
│  │  ┌──────────────────────┐  ┌──────────────────────────────────────┐   ││
│  │  │ ••••••••             │  │ ••••••••••••                         │   ││
│  │  └──────────────────────┘  └──────────────────────────────────────┘   ││
│  │                             ████████░░ Fuerte                          ││
│  │                                                                         ││
│  │  Confirmar Nueva Contraseña *                                           ││
│  │  ┌──────────────────────────────────────────────────────────────────┐  ││
│  │  │ ••••••••••••                                                     │  ││
│  │  └──────────────────────────────────────────────────────────────────┘  ││
│  │                                                                         ││
│  │  Último cambio de contraseña: Hace 45 días      [🔐 Cambiar Contraseña]││
│  │                                                                         ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │ SESIONES ACTIVAS                                                        ││
│  ├─────────────────────────────────────────────────────────────────────────┤│
│  │                                                                         ││
│  │  💻 Chrome en Windows              192.168.1.100                        ││
│  │     Activa ahora                   [Esta sesión]                        ││
│  │                                                                         ││
│  │  📱 Safari en iPhone               181.52.34.89                         ││
│  │     Hace 2 horas                   [Cerrar sesión]                      ││
│  │                                                                         ││
│  │  💻 Firefox en MacOS               192.168.1.105                        ││
│  │     Ayer                           [Cerrar sesión]                      ││
│  │                                                                         ││
│  │                            [🚪 Cerrar todas las otras sesiones]         ││
│  │                                                                         ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘6. PRIMER ACCESO DE ESPECIALISTAS6.1 Flujo de Primer AccesoDescripción del Flujo
Admin crea especialista en el módulo de especialistas
Sistema genera automáticamente un usuario vinculado con primer_acceso = true
Especialista va a la página de login
Ingresa su documento de identidad (cédula) como username
Sistema detecta que es primer acceso
Redirige a página de creación de contraseña
Especialista crea su contraseña
Sistema actualiza primer_acceso = false
Especialista es redirigido al dashboard
Requisitos FuncionalesIDRequisitoPrioridadFE-PRIMER-001Detectar primer acceso al ingresar cédula en loginCríticaFE-PRIMER-002Página especial para crear contraseña inicialCríticaFE-PRIMER-003Validación de documento de identidadCríticaFE-PRIMER-004Campos: Nueva contraseña, Confirmar contraseñaCríticaFE-PRIMER-005Indicador de fortaleza de contraseñaAltaFE-PRIMER-006Requisitos de contraseña visiblesAltaFE-PRIMER-007Mensaje de bienvenida personalizadoMediaFE-PRIMER-008Redirección automática tras crear contraseñaCríticaEndpoints ConsumidosEndpointMétodoUso/api/auth/check-first-accessPOSTVerificar si es primer acceso/api/auth/setup-passwordPOSTEstablecer contraseña inicialComponentes UItypescript<PrimerAccesoPage />
  ├─ <Logo />
  ├─ <WelcomeMessage>
  │   ¡Bienvenido/a al Club de Alisados!
  ├─ <PrimerAccesoForm>
  │   ├─ <FormInput 
  │   │     name="documento" 
  │   │     label="Documento de Identidad"
  │   │     disabled  // Ya viene del paso anterior
  │   │   />
  │   ├─ <FormInput 
  │   │     name="password" 
  │   │     label="Crear Contraseña"
  │   │     type="password"
  │   │   />
  │   ├─ <PasswordStrengthIndicator />
  │   ├─ <PasswordRequirements>
  │   │   ├─ ✓/✗ Mínimo 8 caracteres
  │   │   ├─ ✓/✗ Al menos una mayúscula
  │   │   ├─ ✓/✗ Al menos un número
  │   │   └─ ✓/✗ Al menos un carácter especial
  │   ├─ <FormInput 
  │   │     name="password_confirm" 
  │   │     label="Confirmar Contraseña"
  │   │     type="password"
  │   │   />
  │   └─ <Button type="submit" fullWidth>
  │        Crear mi cuenta
  │      </Button>
  └─ <HelpText>
      ¿Necesitas ayuda? Contacta a tu administradorMockup ASCII - Primer Acceso┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│                        ╔═══════════════╗                        │
│                        ║  CLUB DE      ║                        │
│                        ║  ALISADOS     ║                        │
│                        ╚═══════════════╝                        │
│                                                                 │
│              ¡Bienvenido/a al Club de Alisados!                │
│                                                                 │
│         Es tu primer acceso. Por favor, crea tu contraseña     │
│         para comenzar a usar el sistema.                        │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                                                         │   │
│  │  Documento de Identidad                                 │   │
│  │  ┌─────────────────────────────────────────────────┐   │   │
│  │  │ 1234567890                                  🔒  │   │   │
│  │  └─────────────────────────────────────────────────┘   │   │
│  │                                                         │   │
│  │  Crear Contraseña                                       │   │
│  │  ┌─────────────────────────────────────────────────┐   │   │
│  │  │ ••••••••••••                                    │   │   │
│  │  └─────────────────────────────────────────────────┘   │   │
│  │  ████████░░ Fuerte                                      │   │
│  │                                                         │   │
│  │  La contraseña debe tener:                              │   │
│  │  ✓ Mínimo 8 caracteres                                 │   │
│  │  ✓ Al menos una letra mayúscula                        │   │
│  │  ✓ Al menos un número                                  │   │
│  │  ✗ Al menos un carácter especial (!@#$%...)           │   │
│  │                                                         │   │
│  │  Confirmar Contraseña                                   │   │
│  │  ┌─────────────────────────────────────────────────┐   │   │
│  │  │ ••••••••••••                                    │   │   │
│  │  └─────────────────────────────────────────────────┘   │   │
│  │  ✓ Las contraseñas coinciden                           │   │
│  │                                                         │   │
│  │  ┌─────────────────────────────────────────────────┐   │   │
│  │  │              🚀 Crear mi cuenta                 │   │   │
│  │  └─────────────────────────────────────────────────┘   │   │
│  │                                                         │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│         ¿Necesitas ayuda? Contacta a tu administrador          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘Flujo de Login Modificadotypescript// Pseudocódigo del flujo de login
async function handleLogin(username: string) {
  // 1. Verificar si es primer acceso
  const { isPrimerAcceso, userId } = await checkFirstAccess(username);
  
  if (isPrimerAcceso) {
    // 2. Redirigir a página de primer acceso
    router.push(`/auth/primer-acceso?doc=${username}`);
    return;
  }
  
  // 3. Continuar con login normal
  // ... solicitar contraseña y autenticar
}7. ESTADOS, VALIDACIONES Y SEGURIDAD7.1 Estados de UsuarioEstadoDescripciónAcciones PermitidasactivoUsuario puede acceder normalmenteDesactivar, BloquearinactivoUsuario no puede acceder, pero datos se conservanActivarbloqueadoBloqueado por intentos fallidos o manualmenteDesbloquearTransiciones de Estado                    ┌──────────────┐
                    │              │
            ┌───────│   ACTIVO     │───────┐
            │       │              │       │
            │       └──────────────┘       │
            │              │               │
      Desactivar      Bloquear        5 intentos
            │              │            fallidos
            ▼              ▼               │
    ┌──────────────┐ ┌──────────────┐     │
    │              │ │              │◄────┘
    │  INACTIVO    │ │  BLOQUEADO   │
    │              │ │              │
    └──────────────┘ └──────────────┘
            │              │
            │          Desbloquear
            │              │
            └──────────────┴───────────────┐
                                           │
                                    ┌──────▼──────┐
                                    │             │
                                    │   ACTIVO    │
                                    │             │
                                    └─────────────┘7.2 Validaciones de Contraseñatypescriptconst passwordSchema = z.string()
  .min(8, 'Mínimo 8 caracteres')
  .regex(/[A-Z]/, 'Debe contener al menos una mayúscula')
  .regex(/[0-9]/, 'Debe contener al menos un número')
  .regex(/[!@#$%^&*(),.?":{}|<>]/, 'Debe contener al menos un carácter especial');

// Indicador de fortaleza
function getPasswordStrength(password: string): 'weak' | 'medium' | 'strong' {
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score++;
  
  if (score <= 2) return 'weak';
  if (score <= 4) return 'medium';
  return 'strong';
}7.3 Schemas de Validación (Zod)typescript// Schema para crear usuario
export const crearUsuarioSchema = z.object({
  nombre: z.string()
    .min(2, 'Mínimo 2 caracteres')
    .max(100, 'Máximo 100 caracteres'),
  username: z.string()
    .min(3, 'Mínimo 3 caracteres')
    .max(50, 'Máximo 50 caracteres')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Solo letras, números, guiones y guiones bajos'),
  email: z.string()
    .email('Email inválido'),
  password: passwordSchema,
  rol_id: z.number()
    .int()
    .positive('Seleccione un rol'),
  sede_id: z.number()
    .int()
    .positive('Seleccione una sede'),
  forzar_cambio_password: z.boolean().default(false),
  
  // Campos condicionales para especialista
  vincular_especialista: z.boolean().default(false),
  especialista_id: z.number().int().positive().optional(),
  crear_especialista: z.boolean().optional(),
  especialista_data: z.object({
    documento_identidad: z.string().min(5),
    telefono: z.string().optional(),
    fecha_ingreso: z.string().optional(),
  }).optional(),
}).refine((data) => {
  // Si el rol es especialista, debe vincular o crear uno
  if (data.rol_id === 4 && !data.vincular_especialista) {
    return false;
  }
  return true;
}, {
  message: 'El rol Especialista requiere vinculación con un especialista',
  path: ['vincular_especialista'],
});

// Schema para editar usuario
export const editarUsuarioSchema = crearUsuarioSchema.omit({ 
  password: true 
});

// Schema para cambiar contraseña
export const cambiarPasswordSchema = z.object({
  password_actual: z.string().min(1, 'Ingrese su contraseña actual'),
  password_nuevo: passwordSchema,
  password_confirmar: z.string(),
}).refine((data) => data.password_nuevo === data.password_confirmar, {
  message: 'Las contraseñas no coinciden',
  path: ['password_confirmar'],
});

// Schema para sede
export const sedeSchema = z.object({
  codigo: z.string()
    .min(2, 'Mínimo 2 caracteres')
    .max(20, 'Máximo 20 caracteres')
    .regex(/^[A-Z0-9-]+$/, 'Solo mayúsculas, números y guiones'),
  nombre: z.string()
    .min(3, 'Mínimo 3 caracteres')
    .max(100, 'Máximo 100 caracteres'),
  direccion: z.string().max(500).optional(),
  telefono: z.string().max(20).optional(),
  email: z.string().email().optional().or(z.literal('')),
  es_principal: z.boolean().default(false),
});7.4 Matriz de Permisos por AcciónAcciónPermiso RequeridoRestricciones AdicionalesVer lista usuariosusuarios.verSolo de su sede (excepto Super Admin)Crear usuariousuarios.crearSolo en su sede (excepto Super Admin)Editar usuariousuarios.editarSolo de su sede, no puede editar Super AdminCambiar estadousuarios.editarNo puede desactivarse a sí mismoResetear contraseñausuarios.editarSolo de su sedeVer sedesSuper Admin-Crear/Editar sedesSuper Admin-Ver rolesusuarios.verSolo lectura7.5 Reglas de Negocio Frontendtypescript// Validaciones de negocio
const reglasNegocio = {
  // No puede desactivar su propio usuario
  puedeDesactivarUsuario: (usuarioActual: Usuario, usuarioTarget: Usuario) => {
    return usuarioActual.id !== usuarioTarget.id;
  },
  
  // No puede eliminar último Super Admin
  puedeEliminarSuperAdmin: async (usuarioId: number) => {
    const superAdmins = await getSuperAdmins();
    return superAdmins.length > 1;
  },
  
  // Admin de Sede solo gestiona su sede
  puedeGestionarUsuario: (usuarioActual: Usuario, usuarioTarget: Usuario) => {
    if (usuarioActual.rol.codigo === 'super_admin') return true;
    return usuarioActual.sede_id === usuarioTarget.sede_id;
  },
  
  // No puede desactivar sede con usuarios activos
  puedeDesactivarSede: async (sedeId: number) => {
    const usuarios = await getUsuariosBySede(sedeId);
    return usuarios.filter(u => u.estado === 'activo').length === 0;
  },
  
  // Solo puede haber una sede principal
  puedeSerSedePrincipal: async (sedeId: number) => {
    const sedePrincipal = await getSedePrincipal();
    return !sedePrincipal || sedePrincipal.id === sedeId;
  },
};8. COMPONENTES COMPARTIDOS8.1 TypeScript Interfacestypescript// Tipos base
export interface Sede {
  id: number;
  codigo: string;
  nombre: string;
  direccion?: string;
  telefono?: string;
  email?: string;
  estado: 'activa' | 'inactiva';
  es_principal: boolean;
  fecha_creacion: string;
  fecha_actualizacion: string;
  usuarios_count?: number;
}

export interface Rol {
  id: number;
  nombre: string;
  codigo: string;
  descripcion?: string;
  alcance: 'global' | 'sede';
  es_sistema: boolean;
  permisos: Permiso[];
}

export interface Permiso {
  id: number;
  codigo: string;
  nombre: string;
  modulo: string;
  descripcion?: string;
}

export interface Usuario {
  id: number;
  username: string;
  email: string;
  nombre: string;
  rol: Rol;
  rol_id: number;
  sede: Sede;
  sede_id: number;
  especialista?: EspecialistaBasico;
  especialista_id?: number;
  estado: 'activo' | 'inactivo' | 'bloqueado';
  ultimo_acceso?: string;
  intentos_fallidos: number;
  fecha_bloqueo?: string;
  primer_acceso: boolean;
  requiere_cambio_password: boolean;
  fecha_creacion: string;
  fecha_actualizacion: string;
}

export interface EspecialistaBasico {
  id: number;
  nombre: string;
  apellido: string;
  documento_identidad: string;
}

export interface Sesion {
  id: number;
  usuario_id: number;
  ip: string;
  user_agent: string;
  dispositivo?: string; // Parseado del user_agent
  navegador?: string;
  es_actual: boolean;
  fecha_creacion: string;
  fecha_expiracion: string;
}

// Tipos para formularios
export interface UsuarioFormData {
  nombre: string;
  username: string;
  email: string;
  password?: string;
  rol_id: number;
  sede_id: number;
  estado: 'activo' | 'inactivo';
  forzar_cambio_password: boolean;
  vincular_especialista: boolean;
  especialista_id?: number;
  crear_especialista?: boolean;
  especialista_data?: {
    documento_identidad: string;
    telefono?: string;
    fecha_ingreso?: string;
  };
}

export interface SedeFormData {
  codigo: string;
  nombre: string;
  direccion?: string;
  telefono?: string;
  email?: string;
  es_principal: boolean;
}

export interface CambiarPasswordData {
  password_actual: string;
  password_nuevo: string;
  password_confirmar: string;
}8.2 Hooks Personalizadostypescript// Hook para gestión de usuarios
export function useUsuarios(filters?: UsuarioFilters) {
  return useQuery({
    queryKey: ['usuarios', filters],
    queryFn: () => fetchUsuarios(filters),
  });
}

// Hook para sedes
export function useSedes(filters?: SedeFilters) {
  return useQuery({
    queryKey: ['sedes', filters],
    queryFn: () => fetchSedes(filters),
  });
}

// Hook para el usuario actual
export function useCurrentUser() {
  return useQuery({
    queryKey: ['currentUser'],
    queryFn: fetchCurrentUser,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}

// Hook para permisos
export function usePermissions() {
  const { data: user } = useCurrentUser();
  
  const hasPermission = useCallback((permiso: string) => {
    if (!user) return false;
    if (user.rol.codigo === 'super_admin') return true;
    return user.rol.permisos.some(p => p.codigo === permiso);
  }, [user]);
  
  const isSuperAdmin = user?.rol.codigo === 'super_admin';
  const isAdminSede = user?.rol.codigo === 'admin_sede';
  
  return { hasPermission, isSuperAdmin, isAdminSede, user };
}

// Hook para verificar acceso a sede
export function useSedeAccess() {
  const { user, isSuperAdmin } = usePermissions();
  
  const canAccessSede = useCallback((sedeId: number) => {
    if (isSuperAdmin) return true;
    return user?.sede_id === sedeId;
  }, [user, isSuperAdmin]);
  
  const currentSedeId = user?.sede_id;
  
  return { canAccessSede, currentSedeId, isSuperAdmin };
}

// Hook para mutaciones de usuario
export function useUsuarioMutations() {
  const queryClient = useQueryClient();
  
  const createUsuario = useMutation({
    mutationFn: (data: UsuarioFormData) => api.post('/usuarios', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usuarios'] });
      toast.success('Usuario creado exitosamente');
    },
  });
  
  const updateUsuario = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<UsuarioFormData> }) => 
      api.put(`/usuarios/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usuarios'] });
      toast.success('Usuario actualizado exitosamente');
    },
  });
  
  const changeStatus = useMutation({
    mutationFn: ({ id, estado }: { id: number; estado: string }) =>
      api.put(`/usuarios/${id}/estado`, { estado }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usuarios'] });
      toast.success('Estado actualizado');
    },
  });
  
  const resetPassword = useMutation({
    mutationFn: (id: number) => api.post(`/usuarios/${id}/reset-password`),
  });
  
  const unlockUser = useMutation({
    mutationFn: (id: number) => api.post(`/usuarios/${id}/desbloquear`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usuarios'] });
      toast.success('Usuario desbloqueado');
    },
  });
  
  return { createUsuario, updateUsuario, changeStatus, resetPassword, unlockUser };
}8.3 Store Global (Zustand)typescriptimport { create } from 'zustand';

interface AdminStore {
  // Filtros de usuarios
  usuarioFilters: {
    search: string;
    sede_id?: number;
    rol_id?: number;
    estado?: string;
  };
  setUsuarioFilters: (filters: Partial<AdminStore['usuarioFilters']>) => void;
  
  // Filtros de sedes
  sedeFilters: {
    search: string;
    estado?: string;
  };
  setSedeFilters: (filters: Partial<AdminStore['sedeFilters']>) => void;
  
  // Usuario seleccionado para acciones
  selectedUsuario: Usuario | null;
  setSelectedUsuario: (usuario: Usuario | null) => void;
  
  // Modales
  modals: {
    resetPassword: boolean;
    changeStatus: boolean;
    createSede: boolean;
    editSede: boolean;
  };
  openModal: (modal: keyof AdminStore['modals']) => void;
  closeModal: (modal: keyof AdminStore['modals']) => void;
}

export const useAdminStore = create<AdminStore>((set) => ({
  usuarioFilters: {
    search: '',
  },
  setUsuarioFilters: (filters) =>
    set((state) => ({
      usuarioFilters: { ...state.usuarioFilters, ...filters },
    })),
  
  sedeFilters: {
    search: '',
  },
  setSedeFilters: (filters) =>
    set((state) => ({
      sedeFilters: { ...state.sedeFilters, ...filters },
    })),
  
  selectedUsuario: null,
  setSelectedUsuario: (usuario) => set({ selectedUsuario: usuario }),
  
  modals: {
    resetPassword: false,
    changeStatus: false,
    createSede: false,
    editSede: false,
  },
  openModal: (modal) =>
    set((state) => ({
      modals: { ...state.modals, [modal]: true },
    })),
  closeModal: (modal) =>
    set((state) => ({
      modals: { ...state.modals, [modal]: false },
    })),
}));8.4 Componentes Reutilizablestypescript// Selector de Sede (solo para Super Admin)
<SedeSelector
  value={sedeId}
  onChange={setSedeId}
  showAll={true} // Mostrar opción "Todas las sedes"
  disabled={!isSuperAdmin}
/>

// Badge de Rol con colores
<RolBadge rol={usuario.rol}>
  {/* Colores por rol:
    - super_admin: purple
    - admin_sede: blue
    - cajero: green
    - especialista: orange
  */}
</RolBadge>

// Badge de Estado
<StatusBadge estado={usuario.estado}>
  {/* Estados:
    - activo: green dot
    - inactivo: gray dot
    - bloqueado: red dot con warning
  */}
</StatusBadge>

// Indicador de Fortaleza de Contraseña
<PasswordStrengthIndicator password={password}>
  {/* Muestra barra de progreso con color según fortaleza */}
</PasswordStrengthIndicator>

// Lista de Requisitos de Contraseña
<PasswordRequirements password={password}>
  {/* Muestra checklist de requisitos cumplidos/faltantes */}
</PasswordRequirements>

// Generador de Contraseña
<PasswordGenerator onGenerate={(password) => setValue('password', password)}>
  {/* Botón que genera contraseña segura aleatoria */}
</PasswordGenerator>

// Avatar de Usuario
<UserAvatar 
  name={usuario.nombre}
  size="md" // sm | md | lg | xl
  showStatus={true}
  status={usuario.estado}
/>

// Formato de Último Acceso
<LastAccessTime date={usuario.ultimo_acceso}>
  {/* Formatea como: "Hace 2 horas", "Ayer", "Hace 3 días", etc. */}
</LastAccessTime>

// Preview de Permisos
<PermissionsPreview rol_id={selectedRolId}>
  {/* Muestra lista agrupada de permisos del rol */}
</PermissionsPreview>9. FLUJOS DE USUARIO9.1 Crear Nuevo Usuario (Admin)1. Admin navega a /admin/usuarios
2. Hace clic en "Nuevo Usuario"
3. Se carga página /admin/usuarios/nuevo
4. Completa información básica:
   - Nombre completo
   - Username (validación única en tiempo real)
   - Email (validación única en tiempo real)
5. Configura acceso:
   - Genera o ingresa contraseña
   - Selecciona rol
   - Selecciona sede (si es Super Admin)
6. Si rol es Especialista:
   - Selecciona especialista existente O
   - Crea datos básicos de nuevo especialista
7. Configura opciones:
   - Estado inicial
   - Forzar cambio de contraseña
8. Hace clic en "Guardar"
9. Validación completa
10. POST a /api/usuarios
11. Si éxito:
    - Toast de confirmación
    - Redirección a lista de usuarios
12. Si error:
    - Toast de error
    - Mostrar errores en campos9.2 Primer Acceso de Especialista1. Admin crea especialista en módulo de especialistas
2. Sistema genera usuario automáticamente:
   - username = documento_identidad
   - email = especialista.email
   - primer_acceso = true
   - rol = Especialista
   - sede = sede del especialista
3. Especialista abre el sistema
4. En login, ingresa su cédula
5. Sistema detecta primer_acceso = true
6. Redirige a /auth/primer-acceso?doc=CEDULA
7. Especialista ve formulario de crear contraseña
8. Ingresa y confirma nueva contraseña
9. Sistema valida requisitos
10. POST a /api/auth/setup-password
11. Sistema actualiza:
    - password_hash
    - primer_acceso = false
12. Redirige a dashboard de especialista
13. Siguiente login es normal9.3 Resetear Contraseña de Usuario1. Admin encuentra usuario en lista
2. Abre menú de acciones (⋮)
3. Selecciona "Resetear Contraseña"
4. Se abre modal de confirmación
5. Selecciona:
   - Generar automática O
   - Establecer manualmente
6. Confirma opción de forzar cambio
7. Hace clic en "Resetear"
8. POST a /api/usuarios/{id}/reset-password
9. Si generada automáticamente:
   - Modal muestra contraseña temporal
   - Botón para copiar
   - Advertencia de mostrar una sola vez
10. Admin entrega contraseña al usuario
11. Usuario usa contraseña temporal
12. Sistema detecta requiere_cambio_password = true
13. Redirige a página de cambio obligatorio9.4 Cambiar Contraseña Propia1. Usuario navega a /admin/mi-perfil
2. En sección Seguridad, completa:
   - Contraseña actual
   - Nueva contraseña
   - Confirmar nueva contraseña
3. Indicador de fortaleza se actualiza
4. Requisitos se marcan como cumplidos
5. Hace clic en "Cambiar Contraseña"
6. PUT a /api/auth/change-password
7. Si contraseña actual incorrecta:
   - Error en campo correspondiente
8. Si éxito:
   - Toast de confirmación
   - Opcionalmente cerrar otras sesiones
   - Campos se limpian10. INTEGRACIONES CON OTROS MÓDULOS10.1 Módulo de EspecialistasCreación automática de usuario al registrar especialista:typescript// En el servicio de especialistas (backend)
async function crearEspecialista(data: EspecialistaData) {
  // 1. Crear especialista
  const especialista = await Especialista.create(data);
  
  // 2. Crear usuario vinculado automáticamente
  const usuario = await Usuario.create({
    username: data.documento_identidad,
    email: data.email,
    nombre: `${data.nombre} ${data.apellido}`,
    rol_id: ROL_ESPECIALISTA,
    sede_id: data.sede_id,
    especialista_id: especialista.id,
    primer_acceso: true,
    password_hash: '', // Sin contraseña inicial
  });
  
  return { especialista, usuario };
}En el frontend de especialistas:typescript// Mostrar información del usuario vinculado
<EspecialistaDetail>
  {especialista.usuario && (
    <LinkedUserCard usuario={especialista.usuario}>
      <UserStatus status={especialista.usuario.estado} />
      <LastAccess date={especialista.usuario.ultimo_acceso} />
      {especialista.usuario.primer_acceso && (
        <Badge variant="warning">Pendiente de activación</Badge>
      )}
    </LinkedUserCard>
  )}
</EspecialistaDetail>10.2 Filtrado Global por SedeTodos los módulos deben filtrar por sede del usuario actual:typescript// Hook para obtener datos filtrados por sede
function useSedeFilteredQuery<T>(
  queryKey: string[],
  fetchFn: (sedeId?: number) => Promise<T>
) {
  const { currentSedeId, isSuperAdmin } = useSedeAccess();
  const [selectedSedeId, setSelectedSedeId] = useState<number | undefined>();
  
  // Si no es super admin, forzar su sede
  const effectiveSedeId = isSuperAdmin ? selectedSedeId : currentSedeId;
  
  const query = useQuery({
    queryKey: [...queryKey, effectiveSedeId],
    queryFn: () => fetchFn(effectiveSedeId),
  });
  
  return {
    ...query,
    selectedSedeId,
    setSelectedSedeId,
    canChangeSede: isSuperAdmin,
  };
}

// Uso en módulo de clientes
function ClientesListView() {
  const { data, selectedSedeId, setSelectedSedeId, canChangeSede } = 
    useSedeFilteredQuery(['clientes'], fetchClientes);
  
  return (
    <>
      {canChangeSede && (
        <SedeSelector 
          value={selectedSedeId} 
          onChange={setSelectedSedeId}
          showAll
        />
      )}
      <ClientesTable data={data} />
    </>
  );
}10.3 AuditoríaRegistrar todas las acciones críticas:typescript// Acciones a registrar en log_auditoria
const ACCIONES_AUDITORIA = {
  USUARIO_CREADO: 'usuario.crear',
  USUARIO_EDITADO: 'usuario.editar',
  USUARIO_ESTADO_CAMBIADO: 'usuario.cambiar_estado',
  USUARIO_PASSWORD_RESET: 'usuario.reset_password',
  USUARIO_DESBLOQUEADO: 'usuario.desbloquear',
  SEDE_CREADA: 'sede.crear',
  SEDE_EDITADA: 'sede.editar',
  SEDE_ESTADO_CAMBIADO: 'sede.cambiar_estado',
  LOGIN_EXITOSO: 'auth.login',
  LOGIN_FALLIDO: 'auth.login_fallido',
  LOGOUT: 'auth.logout',
  PASSWORD_CAMBIADO: 'auth.cambiar_password',
  PRIMER_ACCESO_COMPLETADO: 'auth.primer_acceso',
};11. CONSIDERACIONES DE UX11.1 Feedback Visual
Estados de carga: Skeletons en tablas, spinners en botones durante acciones
Confirmaciones destructivas: Dialog de confirmación para cambios de estado y reseteo de contraseña
Validación en tiempo real: Errores mostrados mientras el usuario escribe
Indicadores de unicidad: Check verde cuando username/email están disponibles
Toasts informativos: Éxito en verde, errores en rojo, advertencias en amarillo
11.2 Accesibilidad (WCAG 2.1 AA)
Navegación por teclado: Todas las acciones accesibles sin mouse
ARIA labels: En todos los botones de acción e íconos
Focus visible: Outline claro en elementos focuseados
Contraste de colores: Mínimo 4.5:1 para texto
Mensajes de error: Asociados a campos con aria-describedby
Screen reader: Anuncios de cambios de estado con aria-live
11.3 Responsive DesignBreakpointComportamientoMobile (< 640px)Cards en lugar de tablas, menú hamburguesa, modales fullscreenTablet (640px - 1024px)Tabla simplificada, sidebar colapsableDesktop (> 1024px)Vista completa con sidebar, tablas expandidas11.4 Performance
Debounce en búsqueda: 300ms antes de ejecutar
Paginación: Má