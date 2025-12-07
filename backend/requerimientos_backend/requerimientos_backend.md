# Requerimientos de Backend - Club de Alisados
## Stack: FastAPI (Python)

---

## Resumen General

| Módulo | Endpoints | Servicios | Prioridad |
|--------|-----------|-----------|-----------|
| Control de Acceso | 22 | 6 | Crítica |
| Especialistas | 16 | 5 | Crítica |
| Servicios | 12 | 3 | Crítica |
| Clientes | 12 | 3 | Crítica |
| Agenda/Calendario | 10 | 5 | Crítica |
| Punto de Venta | 22 | 7 | Crítica |
| App Móvil | 10 | 3 | Alta |
| Inventario | 22 | 6 | Alta |
| Reportes | 16 | 4 | Alta |
| Nómina | 14 | 4 | Crítica |
| CRM | 5 | 2 | Media |
| Promociones | 10 | 3 | Media |
| Notificaciones | 6 | 4 | Media |
| Configuración | 6 | 2 | Media |
| **TOTAL** | **183** | **57** | - |

---

## Stack Tecnológico

| Componente | Tecnología |
|------------|------------|
| Framework | FastAPI |
| Lenguaje | Python 3.11+ |
| Base de Datos | PostgreSQL 15+ |
| ORM | SQLAlchemy 2.0 + Alembic |
| Validación | Pydantic v2 |
| Autenticación | JWT (python-jose) |
| Password Hash | passlib + bcrypt |
| Documentación | Swagger/OpenAPI (integrado) |
| Cola de tareas | Celery + Redis |
| Email | fastapi-mail |
| SMS | Twilio |
| Testing | pytest + httpx |

---

## Estructura de Proyecto

```
app/
├── main.py
├── config.py
├── database.py
├── dependencies.py
├── models/
├── schemas/
├── routers/
├── services/
├── utils/
├── jobs/
└── tests/
```

---

# MÓDULO 1: CONTROL DE ACCESO

## Endpoints de Autenticación

| ID | Método | Endpoint | Descripción |
|----|--------|----------|-------------|
| BE-AUTH-001 | POST | `/api/auth/login` | Iniciar sesión |
| BE-AUTH-002 | POST | `/api/auth/refresh` | Renovar token |
| BE-AUTH-003 | POST | `/api/auth/logout` | Cerrar sesión |
| BE-AUTH-004 | POST | `/api/auth/logout-all` | Cerrar todas las sesiones |
| BE-AUTH-005 | POST | `/api/auth/forgot-password` | Solicitar recuperación |
| BE-AUTH-006 | POST | `/api/auth/reset-password` | Restablecer contraseña |
| BE-AUTH-007 | PUT | `/api/auth/change-password` | Cambiar contraseña |

## Endpoints de Usuarios

| ID | Método | Endpoint | Descripción | Permiso |
|----|--------|----------|-------------|---------|
| BE-USR-001 | GET | `/api/usuarios` | Listar usuarios | `usuarios.ver` |
| BE-USR-002 | GET | `/api/usuarios/{id}` | Obtener usuario | `usuarios.ver` |
| BE-USR-003 | POST | `/api/usuarios` | Crear usuario | `usuarios.crear` |
| BE-USR-004 | PUT | `/api/usuarios/{id}` | Actualizar usuario | `usuarios.editar` |
| BE-USR-005 | DELETE | `/api/usuarios/{id}` | Eliminar usuario | `usuarios.eliminar` |
| BE-USR-006 | PUT | `/api/usuarios/{id}/estado` | Cambiar estado | `usuarios.editar` |
| BE-USR-007 | GET | `/api/usuarios/me` | Mi perfil | Autenticado |
| BE-USR-008 | PUT | `/api/usuarios/me` | Actualizar mi perfil | Autenticado |

## Endpoints de Roles y Permisos

| ID | Método | Endpoint | Descripción | Permiso |
|----|--------|----------|-------------|---------|
| BE-ROL-001 | GET | `/api/roles` | Listar roles | `usuarios.ver` |
| BE-ROL-002 | GET | `/api/roles/{id}` | Obtener rol | `usuarios.ver` |
| BE-ROL-003 | POST | `/api/roles` | Crear rol | `usuarios.crear` |
| BE-ROL-004 | PUT | `/api/roles/{id}` | Actualizar rol | `usuarios.editar` |
| BE-ROL-005 | DELETE | `/api/roles/{id}` | Eliminar rol | `usuarios.eliminar` |
| BE-ROL-006 | PUT | `/api/roles/{id}/permisos` | Asignar permisos | `usuarios.editar` |
| BE-ROL-007 | GET | `/api/permisos` | Listar permisos | `usuarios.ver` |

## Servicios

| Servicio | Descripción |
|----------|-------------|
| `AuthService` | Autenticación JWT con access y refresh tokens |
| `PasswordService` | Encriptación bcrypt, validación, tokens reset |
| `SessionService` | Control de sesiones activas |
| `PermissionService` | Verificación de permisos |
| `AuditService` | Registro de auditoría |
| `BruteForceProtection` | Bloqueo tras intentos fallidos |

## Reglas de Negocio

- RN-AUTH-001: Bloquear usuario tras 5 intentos fallidos por 30 minutos
- RN-AUTH-002: Access token expira en 15 min, refresh en 7 días
- RN-AUTH-003: No eliminar roles de sistema (es_sistema = true)
- RN-AUTH-004: No eliminar último usuario administrador
- RN-AUTH-005: Contraseña mínimo 8 caracteres con mayúscula, número y especial
- RN-AUTH-006: Registrar en auditoría: login, logout, cambios críticos
- RN-AUTH-007: Invalidar sesiones al cambiar contraseña

---

# MÓDULO 2: GESTIÓN DE ESPECIALISTAS

## Endpoints CRUD

| ID | Método | Endpoint | Descripción | Permiso |
|----|--------|----------|-------------|---------|
| BE-ESP-001 | GET | `/api/especialistas` | Listar especialistas | `especialistas.ver` |
| BE-ESP-002 | GET | `/api/especialistas/{id}` | Obtener especialista | `especialistas.ver` |
| BE-ESP-003 | POST | `/api/especialistas` | Crear especialista | `especialistas.crear` |
| BE-ESP-004 | PUT | `/api/especialistas/{id}` | Actualizar especialista | `especialistas.editar` |
| BE-ESP-005 | DELETE | `/api/especialistas/{id}` | Desactivar especialista | `especialistas.eliminar` |
| BE-ESP-006 | GET | `/api/especialistas/activos` | Listar activos | `agenda.ver` |

## Endpoints de Horarios

| ID | Método | Endpoint | Descripción | Permiso |
|----|--------|----------|-------------|---------|
| BE-HOR-001 | GET | `/api/especialistas/{id}/horarios` | Obtener horarios | `especialistas.ver` |
| BE-HOR-002 | PUT | `/api/especialistas/{id}/horarios` | Guardar horarios (batch) | `especialistas.editar` |
| BE-HOR-003 | POST | `/api/especialistas/{id}/horarios` | Agregar horario | `especialistas.editar` |
| BE-HOR-004 | DELETE | `/api/especialistas/{id}/horarios/{horario_id}` | Eliminar horario | `especialistas.editar` |

## Endpoints de Bloqueos

| ID | Método | Endpoint | Descripción | Permiso |
|----|--------|----------|-------------|---------|
| BE-BLQ-001 | GET | `/api/especialistas/{id}/bloqueos` | Listar bloqueos | `especialistas.ver` |
| BE-BLQ-002 | POST | `/api/especialistas/{id}/bloqueos` | Crear bloqueo | `especialistas.editar` |
| BE-BLQ-003 | PUT | `/api/especialistas/{id}/bloqueos/{bloqueo_id}` | Actualizar bloqueo | `especialistas.editar` |
| BE-BLQ-004 | DELETE | `/api/especialistas/{id}/bloqueos/{bloqueo_id}` | Eliminar bloqueo | `especialistas.editar` |

## Endpoints de Servicios del Especialista

| ID | Método | Endpoint | Descripción | Permiso |
|----|--------|----------|-------------|---------|
| BE-ESPSVC-001 | GET | `/api/especialistas/{id}/servicios` | Listar servicios asignados | `especialistas.ver` |
| BE-ESPSVC-002 | POST | `/api/especialistas/{id}/servicios` | Asignar servicio | `especialistas.editar` |
| BE-ESPSVC-003 | PUT | `/api/especialistas/{id}/servicios/{servicio_id}` | Actualizar comisión | `especialistas.editar` |
| BE-ESPSVC-004 | DELETE | `/api/especialistas/{id}/servicios/{servicio_id}` | Quitar servicio | `especialistas.editar` |

## Endpoints de Disponibilidad

| ID | Método | Endpoint | Descripción | Permiso |
|----|--------|----------|-------------|---------|
| BE-DISP-001 | GET | `/api/especialistas/{id}/disponibilidad` | Slots disponibles | `agenda.ver` |
| BE-DISP-002 | GET | `/api/especialistas/disponibilidad` | Disponibilidad general | `agenda.ver` |

## Servicios

| Servicio | Descripción |
|----------|-------------|
| `EspecialistaService` | CRUD con validaciones |
| `HorarioService` | Gestión de horarios semanales |
| `BloqueoService` | Bloqueos puntuales y recurrentes |
| `DisponibilidadService` | Cálculo de disponibilidad |
| `ComisionEspecialistaService` | Comisiones por servicio |

## Reglas de Negocio

- RN-ESP-001: Documento y email únicos
- RN-ESP-002: No eliminar con citas futuras pendientes
- RN-ESP-003: hora_fin > hora_inicio en horarios
- RN-ESP-004: Sin solapamiento de horarios del mismo día
- RN-ESP-005: Bloqueos recurrentes requieren días de semana
- RN-ESP-006: Comisión porcentaje entre 0 y 100

---

# MÓDULO 3: GESTIÓN DE SERVICIOS

## Endpoints de Categorías

| ID | Método | Endpoint | Descripción | Permiso |
|----|--------|----------|-------------|---------|
| BE-CATSER-001 | GET | `/api/categorias-servicio` | Listar categorías | `servicios.ver` |
| BE-CATSER-002 | GET | `/api/categorias-servicio/{id}` | Obtener categoría | `servicios.ver` |
| BE-CATSER-003 | POST | `/api/categorias-servicio` | Crear categoría | `servicios.crear` |
| BE-CATSER-004 | PUT | `/api/categorias-servicio/{id}` | Actualizar categoría | `servicios.editar` |
| BE-CATSER-005 | DELETE | `/api/categorias-servicio/{id}` | Eliminar categoría | `servicios.eliminar` |
| BE-CATSER-006 | PUT | `/api/categorias-servicio/orden` | Reordenar categorías | `servicios.editar` |

## Endpoints de Servicios

| ID | Método | Endpoint | Descripción | Permiso |
|----|--------|----------|-------------|---------|
| BE-SER-001 | GET | `/api/servicios` | Listar servicios | `servicios.ver` |
| BE-SER-002 | GET | `/api/servicios/{id}` | Obtener servicio | `servicios.ver` |
| BE-SER-003 | POST | `/api/servicios` | Crear servicio | `servicios.crear` |
| BE-SER-004 | PUT | `/api/servicios/{id}` | Actualizar servicio | `servicios.editar` |
| BE-SER-005 | DELETE | `/api/servicios/{id}` | Desactivar servicio | `servicios.eliminar` |
| BE-SER-006 | GET | `/api/servicios/activos` | Servicios activos por categoría | `agenda.ver` |

## Servicios

| Servicio | Descripción |
|----------|-------------|
| `CategoriaServicioService` | CRUD de categorías |
| `ServicioService` | CRUD de servicios |
| `ServicioProductoService` | Productos consumidos |

## Reglas de Negocio

- RN-SER-001: Duración mínima 15 minutos
- RN-SER-002: Duración múltiplo de 15
- RN-SER-003: Precio >= 0
- RN-SER-004: Color HEX válido (#RRGGBB)
- RN-SER-005: No eliminar categoría con servicios
- RN-SER-006: No eliminar servicio con citas futuras

---

# MÓDULO 4: GESTIÓN DE CLIENTES

## Endpoints CRUD

| ID | Método | Endpoint | Descripción | Permiso |
|----|--------|----------|-------------|---------|
| BE-CLI-001 | GET | `/api/clientes` | Listar clientes | `clientes.ver` |
| BE-CLI-002 | GET | `/api/clientes/{id}` | Obtener cliente | `clientes.ver` |
| BE-CLI-003 | POST | `/api/clientes` | Crear cliente | `clientes.crear` |
| BE-CLI-004 | PUT | `/api/clientes/{id}` | Actualizar cliente | `clientes.editar` |
| BE-CLI-005 | DELETE | `/api/clientes/{id}` | Desactivar cliente | `clientes.eliminar` |
| BE-CLI-006 | GET | `/api/clientes/buscar` | Búsqueda rápida | `clientes.ver` |

## Endpoints de Historial

| ID | Método | Endpoint | Descripción | Permiso |
|----|--------|----------|-------------|---------|
| BE-CLIHIST-001 | GET | `/api/clientes/{id}/citas` | Historial de citas | `clientes.ver` |
| BE-CLIHIST-002 | GET | `/api/clientes/{id}/facturas` | Historial de facturas | `clientes.ver` |
| BE-CLIHIST-003 | GET | `/api/clientes/{id}/estadisticas` | Estadísticas | `clientes.ver` |

## Endpoints de Preferencias

| ID | Método | Endpoint | Descripción | Permiso |
|----|--------|----------|-------------|---------|
| BE-CLIPREF-001 | GET | `/api/clientes/{id}/preferencias` | Obtener preferencias | `clientes.ver` |
| BE-CLIPREF-002 | PUT | `/api/clientes/{id}/preferencias` | Actualizar preferencias | `clientes.editar` |

## Endpoints de Etiquetas

| ID | Método | Endpoint | Descripción | Permiso |
|----|--------|----------|-------------|---------|
| BE-ETIQ-001 | GET | `/api/etiquetas` | Listar etiquetas | `clientes.ver` |
| BE-ETIQ-002 | POST | `/api/etiquetas` | Crear etiqueta | `clientes.crear` |
| BE-ETIQ-003 | DELETE | `/api/etiquetas/{id}` | Eliminar etiqueta | `clientes.eliminar` |

## Servicios

| Servicio | Descripción |
|----------|-------------|
| `ClienteService` | CRUD con búsqueda |
| `ClienteHistorialService` | Historial de citas/facturas |
| `EtiquetaService` | Segmentación de clientes |

## Reglas de Negocio

- RN-CLI-001: Nombre obligatorio
- RN-CLI-002: Validar formato teléfono
- RN-CLI-003: Validar formato email
- RN-CLI-004: Actualizar fecha_primera_visita automáticamente
- RN-CLI-005: Actualizar total_visitas via trigger
- RN-CLI-006: Búsqueda por nombre parcial y teléfono

---

# MÓDULO 5: AGENDA Y CALENDARIO

## Endpoints de Citas

| ID | Método | Endpoint | Descripción | Permiso |
|----|--------|----------|-------------|---------|
| BE-CIT-001 | GET | `/api/citas` | Listar citas | `agenda.ver` |
| BE-CIT-002 | GET | `/api/citas/{id}` | Obtener cita | `agenda.ver` |
| BE-CIT-003 | POST | `/api/citas` | Crear cita | `agenda.crear` |
| BE-CIT-004 | PUT | `/api/citas/{id}` | Actualizar cita | `agenda.editar` |
| BE-CIT-005 | DELETE | `/api/citas/{id}` | Cancelar cita | `agenda.cancelar` |
| BE-CIT-006 | PUT | `/api/citas/{id}/estado` | Cambiar estado | `agenda.editar` |

## Endpoints de Calendario

| ID | Método | Endpoint | Descripción | Permiso |
|----|--------|----------|-------------|---------|
| BE-CAL-001 | GET | `/api/calendario/dia` | Vista de día | `agenda.ver` |
| BE-CAL-002 | GET | `/api/calendario/semana` | Vista de semana | `agenda.ver` |
| BE-CAL-003 | GET | `/api/calendario/mes` | Resumen del mes | `agenda.ver` |

## Endpoints de Historial

| ID | Método | Endpoint | Descripción | Permiso |
|----|--------|----------|-------------|---------|
| BE-CITHIST-001 | GET | `/api/citas/{id}/historial` | Historial de cambios | `agenda.ver` |

## Servicios

| Servicio | Descripción |
|----------|-------------|
| `CitaService` | CRUD con validación de disponibilidad |
| `CalendarioService` | Generación de vistas |
| `ConflictoService` | Detección de conflictos |
| `HistorialCitaService` | Registro de cambios |
| `RecordatorioService` | Recordatorios automáticos |

## Reglas de Negocio

- RN-CIT-001: No permitir fuera del horario del especialista
- RN-CIT-002: No permitir en bloques bloqueados
- RN-CIT-003: No permitir solapamiento
- RN-CIT-004: hora_fin = hora_inicio + duración servicio
- RN-CIT-005: No crear en el pasado
- RN-CIT-006: Solo cancelar 'agendada' o 'confirmada'
- RN-CIT-007: Registrar cambios en historial
- RN-CIT-008: Actualizar estadísticas cliente al completar
- RN-CIT-009: Recordatorio 24h antes (configurable)

---

# MÓDULO 6: PUNTO DE VENTA (CAJA)

## Endpoints de Caja

| ID | Método | Endpoint | Descripción | Permiso |
|----|--------|----------|-------------|---------|
| BE-CAJA-001 | GET | `/api/cajas/actual` | Caja abierta actual | `caja.ver` |
| BE-CAJA-002 | POST | `/api/cajas/apertura` | Abrir caja | `caja.apertura` |
| BE-CAJA-003 | POST | `/api/cajas/cierre` | Cerrar caja | `caja.cierre` |
| BE-CAJA-004 | GET | `/api/cajas/{id}` | Detalle de caja | `caja.ver` |
| BE-CAJA-005 | GET | `/api/cajas/{id}/movimientos` | Movimientos de caja | `caja.ver` |
| BE-CAJA-006 | POST | `/api/cajas/{id}/movimientos` | Registrar movimiento | `caja.ver` |

## Endpoints de Facturas

| ID | Método | Endpoint | Descripción | Permiso |
|----|--------|----------|-------------|---------|
| BE-FAC-001 | GET | `/api/facturas` | Listar facturas | `caja.ver` |
| BE-FAC-002 | GET | `/api/facturas/{id}` | Obtener factura | `caja.ver` |
| BE-FAC-003 | POST | `/api/facturas` | Crear factura | `caja.facturar` |
| BE-FAC-004 | PUT | `/api/facturas/{id}/anular` | Anular factura | `caja.anular` |
| BE-FAC-005 | GET | `/api/facturas/{id}/ticket` | Generar ticket PDF | `caja.ver` |
| BE-FAC-006 | GET | `/api/facturas/{id}/imprimir` | Datos para impresión | `caja.ver` |

## Endpoints de Facturas Pendientes

| ID | Método | Endpoint | Descripción | Permiso |
|----|--------|----------|-------------|---------|
| BE-FACPEN-001 | GET | `/api/facturas-pendientes` | Listar pendientes | `caja.aprobar_pendientes` |
| BE-FACPEN-002 | GET | `/api/facturas-pendientes/{id}` | Detalle pendiente | `caja.aprobar_pendientes` |
| BE-FACPEN-003 | POST | `/api/facturas-pendientes/{id}/aprobar` | Aprobar | `caja.aprobar_pendientes` |
| BE-FACPEN-004 | POST | `/api/facturas-pendientes/{id}/rechazar` | Rechazar | `caja.aprobar_pendientes` |

## Endpoints de Ventas

| ID | Método | Endpoint | Descripción | Permiso |
|----|--------|----------|-------------|---------|
| BE-VTAS-001 | GET | `/api/ventas/dia` | Ventas del día | `caja.ver` |
| BE-VTAS-002 | GET | `/api/ventas/resumen` | Resumen por período | `caja.ver` |

## Endpoints de Métodos de Pago

| ID | Método | Endpoint | Descripción | Permiso |
|----|--------|----------|-------------|---------|
| BE-MPAGO-001 | GET | `/api/metodos-pago` | Listar métodos | `caja.ver` |
| BE-MPAGO-002 | PUT | `/api/metodos-pago/{id}` | Activar/desactivar | `config.editar` |

## Servicios

| Servicio | Descripción |
|----------|-------------|
| `CajaService` | Apertura, cierre, cuadre |
| `FacturaService` | Creación con cálculo de totales |
| `ComisionCalculator` | Cálculo de comisiones |
| `NumeroFacturaService` | Numeración secuencial |
| `FacturaPendienteService` | Gestión pendientes |
| `TicketService` | Generación de tickets |
| `MovimientoCajaService` | Registro de movimientos |

## Reglas de Negocio

- RN-CAJA-001: Solo una caja abierta a la vez
- RN-CAJA-002: No facturar sin caja abierta
- RN-CAJA-003: Registrar diferencia al cerrar
- RN-CAJA-004: Número factura secuencial único
- RN-CAJA-005: Descontar inventario al facturar producto
- RN-CAJA-006: Marcar cita completada al facturar servicio
- RN-CAJA-007: Calcular comisiones automáticamente
- RN-CAJA-008: Solo anular facturas del día (configurable)
- RN-CAJA-009: Reversar inventario al anular
- RN-CAJA-010: Reversar comisiones al anular
- RN-CAJA-011: Aplicar IVA según configuración
- RN-CAJA-012: Métodos electrónicos requieren referencia

---

# MÓDULO 7: APP MÓVIL ESPECIALISTAS

## Endpoints de Autenticación

| ID | Método | Endpoint | Descripción |
|----|--------|----------|-------------|
| BE-MOV-001 | POST | `/api/movil/login` | Login especialista |
| BE-MOV-002 | POST | `/api/movil/logout` | Cerrar sesión |
| BE-MOV-003 | POST | `/api/movil/refresh` | Renovar token |

## Endpoints de Agenda

| ID | Método | Endpoint | Descripción |
|----|--------|----------|-------------|
| BE-MOVAG-001 | GET | `/api/movil/mis-citas` | Mis citas del día |
| BE-MOVAG-002 | GET | `/api/movil/mis-citas/{id}` | Detalle de cita |
| BE-MOVAG-003 | PUT | `/api/movil/mis-citas/{id}/estado` | Cambiar estado |

## Endpoints de Servicios Realizados

| ID | Método | Endpoint | Descripción |
|----|--------|----------|-------------|
| BE-MOVSVC-001 | POST | `/api/movil/servicios-realizados` | Registrar servicio |
| BE-MOVSVC-002 | GET | `/api/movil/servicios-realizados` | Mis pendientes |
| BE-MOVSVC-003 | GET | `/api/movil/servicios-realizados/{id}` | Detalle |

## Endpoints de Resumen

| ID | Método | Endpoint | Descripción |
|----|--------|----------|-------------|
| BE-MOVRES-001 | GET | `/api/movil/mi-resumen` | Dashboard comisiones |

## Servicios

| Servicio | Descripción |
|----------|-------------|
| `MovilAuthService` | Autenticación móvil |
| `MovilCitaService` | Citas del especialista |
| `ServicioRealizadoService` | Registro para facturación |

## Reglas de Negocio

- RN-MOV-001: Solo especialistas activos
- RN-MOV-002: Solo ver sus propias citas
- RN-MOV-003: Crear factura_pendiente al registrar
- RN-MOV-004: Notificar al aprobar/rechazar
- RN-MOV-005: Permitir cliente existente o nombre temporal
- RN-MOV-006: Solo servicios asignados

---

# MÓDULO 8: GESTIÓN DE INVENTARIO

## Endpoints de Categorías

| ID | Método | Endpoint | Descripción | Permiso |
|----|--------|----------|-------------|---------|
| BE-CATPROD-001 | GET | `/api/categorias-producto` | Listar | `inventario.ver` |
| BE-CATPROD-002 | POST | `/api/categorias-producto` | Crear | `inventario.crear` |
| BE-CATPROD-003 | PUT | `/api/categorias-producto/{id}` | Actualizar | `inventario.editar` |
| BE-CATPROD-004 | DELETE | `/api/categorias-producto/{id}` | Eliminar | `inventario.editar` |

## Endpoints de Productos

| ID | Método | Endpoint | Descripción | Permiso |
|----|--------|----------|-------------|---------|
| BE-PROD-001 | GET | `/api/productos` | Listar | `inventario.ver` |
| BE-PROD-002 | GET | `/api/productos/{id}` | Obtener | `inventario.ver` |
| BE-PROD-003 | POST | `/api/productos` | Crear | `inventario.crear` |
| BE-PROD-004 | PUT | `/api/productos/{id}` | Actualizar | `inventario.editar` |
| BE-PROD-005 | DELETE | `/api/productos/{id}` | Desactivar | `inventario.editar` |
| BE-PROD-006 | GET | `/api/productos/buscar` | Búsqueda | `inventario.ver` |
| BE-PROD-007 | GET | `/api/productos/stock-bajo` | Stock bajo | `inventario.ver` |

## Endpoints de Movimientos

| ID | Método | Endpoint | Descripción | Permiso |
|----|--------|----------|-------------|---------|
| BE-MOVINV-001 | GET | `/api/productos/{id}/movimientos` | Kardex | `inventario.ver` |
| BE-MOVINV-002 | POST | `/api/productos/{id}/ajuste` | Ajuste | `inventario.ajustar` |
| BE-MOVINV-003 | POST | `/api/productos/{id}/entrada` | Entrada | `inventario.ajustar` |
| BE-MOVINV-004 | POST | `/api/inventario/ajuste-masivo` | Ajuste masivo | `inventario.ajustar` |

## Endpoints de Exportación/Importación

| ID | Método | Endpoint | Descripción | Permiso |
|----|--------|----------|-------------|---------|
| BE-EXP-001 | GET | `/api/inventario/exportar` | Exportar Excel | `inventario.exportar` |
| BE-EXP-002 | GET | `/api/inventario/plantilla` | Plantilla Excel | `inventario.ver` |
| BE-EXP-003 | POST | `/api/inventario/importar` | Importar Excel | `inventario.crear` |

## Endpoints de Proveedores

| ID | Método | Endpoint | Descripción | Permiso |
|----|--------|----------|-------------|---------|
| BE-PROV-001 | GET | `/api/proveedores` | Listar | `inventario.ver` |
| BE-PROV-002 | GET | `/api/proveedores/{id}` | Obtener | `inventario.ver` |
| BE-PROV-003 | POST | `/api/proveedores` | Crear | `inventario.crear` |
| BE-PROV-004 | PUT | `/api/proveedores/{id}` | Actualizar | `inventario.editar` |
| BE-PROV-005 | DELETE | `/api/proveedores/{id}` | Desactivar | `inventario.editar` |

## Endpoints de Órdenes de Compra

| ID | Método | Endpoint | Descripción | Permiso |
|----|--------|----------|-------------|---------|
| BE-OC-001 | GET | `/api/ordenes-compra` | Listar | `inventario.ver` |
| BE-OC-002 | GET | `/api/ordenes-compra/{id}` | Obtener | `inventario.ver` |
| BE-OC-003 | POST | `/api/ordenes-compra` | Crear | `inventario.crear` |
| BE-OC-004 | PUT | `/api/ordenes-compra/{id}` | Actualizar | `inventario.editar` |
| BE-OC-005 | POST | `/api/ordenes-compra/{id}/recibir` | Recibir | `inventario.ajustar` |
| BE-OC-006 | PUT | `/api/ordenes-compra/{id}/cancelar` | Cancelar | `inventario.editar` |

## Servicios

| Servicio | Descripción |
|----------|-------------|
| `ProductoService` | CRUD de productos |
| `MovimientoInventarioService` | Registro de movimientos |
| `AjusteInventarioService` | Ajustes individuales y masivos |
| `ExportacionService` | Generación Excel |
| `ImportacionService` | Carga masiva |
| `AlertaStockService` | Notificación stock bajo |

## Reglas de Negocio

- RN-INV-001: Código y código_barras únicos
- RN-INV-002: Stock no puede ser negativo
- RN-INV-003: Ajustes requieren motivo
- RN-INV-004: Alerta cuando stock <= stock_minimo
- RN-INV-005: Recibir orden crea movimientos entrada
- RN-INV-006: Warning si precio_venta < precio_compra
- RN-INV-007: Comisión entre 0 y 100
- RN-INV-008: Exportación respeta filtros
- RN-INV-009: Validar datos antes de importar
- RN-INV-010: No eliminar con movimientos históricos

---

# MÓDULO 9: REPORTES

## Endpoints de Ventas

| ID | Método | Endpoint | Descripción | Permiso |
|----|--------|----------|-------------|---------|
| BE-RPT-001 | GET | `/api/reportes/ventas/diario` | Ventas diarias | `reportes.ver` |
| BE-RPT-002 | GET | `/api/reportes/ventas/periodo` | Ventas por período | `reportes.ver` |
| BE-RPT-003 | GET | `/api/reportes/ventas/metodo-pago` | Por método pago | `reportes.ver` |
| BE-RPT-004 | GET | `/api/reportes/ventas/comparativo` | Comparativo | `reportes.ver` |

## Endpoints de Especialistas

| ID | Método | Endpoint | Descripción | Permiso |
|----|--------|----------|-------------|---------|
| BE-RPT-005 | GET | `/api/reportes/especialistas/rendimiento` | Rendimiento | `reportes.ver` |
| BE-RPT-006 | GET | `/api/reportes/especialistas/comisiones` | Comisiones | `reportes.ver` |
| BE-RPT-007 | GET | `/api/reportes/especialistas/servicios` | Servicios | `reportes.ver` |

## Endpoints de Servicios

| ID | Método | Endpoint | Descripción | Permiso |
|----|--------|----------|-------------|---------|
| BE-RPT-008 | GET | `/api/reportes/servicios/populares` | Más solicitados | `reportes.ver` |
| BE-RPT-009 | GET | `/api/reportes/servicios/ingresos` | Ingresos | `reportes.ver` |

## Endpoints de Productos

| ID | Método | Endpoint | Descripción | Permiso |
|----|--------|----------|-------------|---------|
| BE-RPT-010 | GET | `/api/reportes/productos/vendidos` | Más vendidos | `reportes.ver` |
| BE-RPT-011 | GET | `/api/reportes/productos/movimientos` | Movimientos | `reportes.ver` |
| BE-RPT-012 | GET | `/api/reportes/productos/rentabilidad` | Rentabilidad | `reportes.ver` |

## Endpoints de Clientes

| ID | Método | Endpoint | Descripción | Permiso |
|----|--------|----------|-------------|---------|
| BE-RPT-013 | GET | `/api/reportes/clientes/frecuentes` | Frecuentes | `reportes.ver` |
| BE-RPT-014 | GET | `/api/reportes/clientes/nuevos` | Nuevos | `reportes.ver` |

## Endpoints de Exportación

| ID | Método | Endpoint | Descripción | Permiso |
|----|--------|----------|-------------|---------|
| BE-RPTEXP-001 | GET | `/api/reportes/{tipo}/excel` | Exportar Excel | `reportes.exportar` |
| BE-RPTEXP-002 | GET | `/api/reportes/{tipo}/pdf` | Exportar PDF | `reportes.exportar` |

## Servicios

| Servicio | Descripción |
|----------|-------------|
| `ReporteVentasService` | Reportes de ventas |
| `ReporteEspecialistasService` | Rendimiento y comisiones |
| `ReporteProductosService` | Inventario y ventas |
| `ExportacionReportesService` | Excel y PDF |

---

# MÓDULO 10: GESTIÓN DE NÓMINA

## Endpoints de Períodos

| ID | Método | Endpoint | Descripción | Permiso |
|----|--------|----------|-------------|---------|
| BE-NOM-001 | GET | `/api/nomina/periodos` | Listar períodos | `nomina.ver` |
| BE-NOM-002 | GET | `/api/nomina/periodos/{id}` | Obtener período | `nomina.ver` |
| BE-NOM-003 | POST | `/api/nomina/periodos` | Crear período | `nomina.calcular` |
| BE-NOM-004 | POST | `/api/nomina/periodos/{id}/calcular` | Calcular nómina | `nomina.calcular` |
| BE-NOM-005 | POST | `/api/nomina/periodos/{id}/pagar` | Marcar pagado | `nomina.pagar` |
| BE-NOM-006 | POST | `/api/nomina/periodos/{id}/cerrar` | Cerrar período | `nomina.pagar` |

## Endpoints de Detalle

| ID | Método | Endpoint | Descripción | Permiso |
|----|--------|----------|-------------|---------|
| BE-NOMDET-001 | GET | `/api/nomina/periodos/{id}/especialistas/{esp_id}` | Detalle especialista | `nomina.ver` |
| BE-NOMDET-002 | GET | `/api/nomina/periodos/{id}/especialistas/{esp_id}/lineas` | Líneas detalladas | `nomina.ver` |
| BE-NOMDET-003 | POST | `/api/nomina/periodos/{id}/especialistas/{esp_id}/bonificacion` | Agregar bonificación | `nomina.calcular` |
| BE-NOMDET-004 | POST | `/api/nomina/periodos/{id}/especialistas/{esp_id}/deduccion` | Agregar deducción | `nomina.calcular` |
| BE-NOMDET-005 | DELETE | `/api/nomina/bonificaciones/{id}` | Eliminar | `nomina.calcular` |
| BE-NOMDET-006 | POST | `/api/nomina/periodos/{id}/especialistas/{esp_id}/pagar` | Pago individual | `nomina.pagar` |

## Endpoints de Exportación

| ID | Método | Endpoint | Descripción | Permiso |
|----|--------|----------|-------------|---------|
| BE-NOMEXP-001 | GET | `/api/nomina/periodos/{id}/excel` | Exportar Excel | `nomina.ver` |
| BE-NOMEXP-002 | GET | `/api/nomina/periodos/{id}/especialistas/{esp_id}/comprobante` | Comprobante PDF | `nomina.ver` |

## Servicios

| Servicio | Descripción |
|----------|-------------|
| `PeriodoNominaService` | Gestión de períodos |
| `CalculoNominaService` | Cálculo de comisiones |
| `BonificacionDeduccionService` | Ajustes manuales |
| `ComprobanteNominaService` | Comprobantes de pago |

## Reglas de Negocio

- RN-NOM-001: Períodos no pueden solaparse
- RN-NOM-002: Solo calcular período 'abierto'
- RN-NOM-003: Buscar facturas pagadas del período
- RN-NOM-004: Comisión servicio según especialista_servicios
- RN-NOM-005: Comisión producto según productos.comision_venta
- RN-NOM-006: Total = comisiones + bonificaciones - deducciones
- RN-NOM-007: No modificar período 'cerrado'
- RN-NOM-008: Actualizar estado_pago al pagar
- RN-NOM-009: Recalcular al agregar bonificación/deducción

---

# MÓDULO 11: CRM

## Endpoints

| ID | Método | Endpoint | Descripción | Permiso |
|----|--------|----------|-------------|---------|
| BE-CRM-001 | GET | `/api/clientes/{id}/comunicaciones` | Historial comunicación | `clientes.ver` |
| BE-CRM-002 | POST | `/api/clientes/{id}/comunicaciones` | Registrar comunicación | `clientes.editar` |
| BE-CRM-003 | GET | `/api/clientes/cumpleanos` | Cumpleaños del período | `clientes.ver` |
| BE-CRM-004 | GET | `/api/clientes/sin-visita` | Sin visita en N días | `clientes.ver` |
| BE-CRM-005 | POST | `/api/clientes/{id}/recordatorio` | Programar recordatorio | `clientes.editar` |

## Servicios

| Servicio | Descripción |
|----------|-------------|
| `ComunicacionService` | Registro de comunicaciones |
| `RecordatorioService` | Programación de recordatorios |

---

# MÓDULO 12: PROMOCIONES Y DESCUENTOS

## Endpoints de Promociones

| ID | Método | Endpoint | Descripción | Permiso |
|----|--------|----------|-------------|---------|
| BE-PROMO-001 | GET | `/api/promociones` | Listar | `config.ver` |
| BE-PROMO-002 | GET | `/api/promociones/{id}` | Obtener | `config.ver` |
| BE-PROMO-003 | POST | `/api/promociones` | Crear | `config.editar` |
| BE-PROMO-004 | PUT | `/api/promociones/{id}` | Actualizar | `config.editar` |
| BE-PROMO-005 | DELETE | `/api/promociones/{id}` | Desactivar | `config.editar` |
| BE-PROMO-006 | GET | `/api/promociones/vigentes` | Vigentes | `caja.ver` |

## Endpoints de Cupones

| ID | Método | Endpoint | Descripción | Permiso |
|----|--------|----------|-------------|---------|
| BE-CUP-001 | GET | `/api/cupones` | Listar | `config.ver` |
| BE-CUP-002 | POST | `/api/cupones` | Crear | `config.editar` |
| BE-CUP-003 | POST | `/api/cupones/validar` | Validar | `caja.facturar` |
| BE-CUP-004 | PUT | `/api/cupones/{id}` | Actualizar | `config.editar` |

## Servicios

| Servicio | Descripción |
|----------|-------------|
| `PromocionService` | CRUD promociones |
| `CuponService` | Gestión y validación |
| `DescuentoCalculator` | Cálculo de descuentos |

## Reglas de Negocio

- RN-PROMO-001: fecha_fin >= fecha_inicio
- RN-PROMO-002: Validar servicios/productos existan
- RN-PROMO-003: Cupón válido si activo, usos disponibles, no expirado
- RN-PROMO-004: Cupón específico solo para ese cliente
- RN-PROMO-005: Incrementar usos_actuales al usar
- RN-PROMO-006: Marcar 'agotado' cuando usos = máximo

---

# MÓDULO 13: NOTIFICACIONES

## Endpoints

| ID | Método | Endpoint | Descripción | Permiso |
|----|--------|----------|-------------|---------|
| BE-NOT-001 | GET | `/api/notificaciones` | Mis notificaciones | Autenticado |
| BE-NOT-002 | PUT | `/api/notificaciones/{id}/leer` | Marcar leída | Autenticado |
| BE-NOT-003 | PUT | `/api/notificaciones/leer-todas` | Marcar todas leídas | Autenticado |
| BE-NOT-004 | GET | `/api/notificaciones/no-leidas/count` | Contador | Autenticado |
| BE-PLANT-001 | GET | `/api/plantillas-mensaje` | Listar plantillas | `config.ver` |
| BE-PLANT-002 | PUT | `/api/plantillas-mensaje/{id}` | Actualizar plantilla | `config.editar` |

## Servicios

| Servicio | Descripción |
|----------|-------------|
| `NotificacionService` | Notificaciones internas |
| `EmailService` | Envío de emails |
| `SMSService` | Envío de SMS |
| `ColaNotificacionesService` | Cola con Celery |

## Jobs Programados (Celery)

| Job | Frecuencia | Descripción |
|-----|------------|-------------|
| `enviar_recordatorios_cita` | Cada hora | Recordatorios de citas |
| `enviar_felicitaciones_cumpleanos` | Diario 8am | Felicitaciones |
| `procesar_cola_notificaciones` | Cada 5 min | Procesar cola |
| `limpiar_notificaciones_antiguas` | Semanal | Limpieza |

---

# MÓDULO 14: CONFIGURACIÓN

## Endpoints

| ID | Método | Endpoint | Descripción | Permiso |
|----|--------|----------|-------------|---------|
| BE-CFG-001 | GET | `/api/configuracion` | Todas las configuraciones | `config.ver` |
| BE-CFG-002 | GET | `/api/configuracion/{clave}` | Configuración específica | `config.ver` |
| BE-CFG-003 | PUT | `/api/configuracion/{clave}` | Actualizar | `config.editar` |
| BE-CFG-004 | PUT | `/api/configuracion` | Actualizar múltiples | `config.editar` |
| BE-EMP-001 | GET | `/api/empresa` | Datos empresa | Público |
| BE-EMP-002 | PUT | `/api/empresa` | Actualizar empresa | `config.editar` |

## Servicios

| Servicio | Descripción |
|----------|-------------|
| `ConfiguracionService` | Gestión de configuraciones |
| `EmpresaService` | Datos de empresa |

## Configuraciones del Sistema

| Clave | Valor | Descripción |
|-------|-------|-------------|
| intervalo_citas | 15 | Minutos |
| impuesto_iva | 19 | Porcentaje |
| moneda | COP | Código |
| zona_horaria | America/Bogota | Zona |
| prefijo_factura | FAC | Prefijo |
| siguiente_numero_factura | 1 | Secuencial |
| recordatorio_cita_horas | 24 | Horas antes |
| stock_alerta_dias | 7 | Días |
| max_intentos_login | 5 | Intentos |
| tiempo_bloqueo_minutos | 30 | Minutos |
| dias_anular_factura | 1 | Días |

---

# DEPENDENCIAS (requirements.txt)

```txt
# Framework
fastapi>=0.104.0
uvicorn[standard]>=0.24.0
python-multipart>=0.0.6

# Base de datos
sqlalchemy>=2.0.0
psycopg2-binary>=2.9.9
alembic>=1.12.0

# Validación
pydantic>=2.5.0
pydantic-settings>=2.1.0

# Autenticación
python-jose[cryptography]>=3.3.0
passlib[bcrypt]>=1.7.4

# Tareas asíncronas
celery>=5.3.0
redis>=5.0.0

# Email y SMS
fastapi-mail>=1.4.0
twilio>=8.10.0

# Excel/PDF
openpyxl>=3.1.0
reportlab>=4.0.0

# Testing
pytest>=7.4.0
httpx>=0.25.0
```

---

# COMANDOS

```bash
# Desarrollo
uvicorn app.main:app --reload --port 8000

# Producción
uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4

# Celery worker
celery -A app.jobs worker --loglevel=info

# Celery beat
celery -A app.jobs beat --loglevel=info

# Migraciones
alembic upgrade head
alembic revision --autogenerate -m "descripcion"
```
