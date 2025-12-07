# Pruebas del Módulo de Control de Acceso

Este directorio contiene las pruebas unitarias e integración para el módulo de control de acceso del sistema.

## Estructura de Pruebas

```
tests/
├── __init__.py
├── conftest.py                      # Fixtures compartidas
├── test_auth_service.py             # Pruebas de AuthService
├── test_password_service.py         # Pruebas de PasswordService
├── test_permission_service.py       # Pruebas de PermissionService
├── test_auth_endpoints.py           # Pruebas de endpoints de autenticación
├── test_user_endpoints.py           # Pruebas de endpoints de usuarios
└── test_role_permission_endpoints.py # Pruebas de endpoints de roles/permisos
```

## Instalación de Dependencias

```bash
# Activar entorno virtual
.\venv\Scripts\activate

# Instalar dependencias de testing
pip install -r requirements.txt
```

## Ejecutar Pruebas

### Opción 1: Usando el script de pruebas

```bash
# Ejecutar todas las pruebas
python run_tests.py

# Ejecutar con reporte de cobertura
python run_tests.py --coverage
```

### Opción 2: Usando pytest directamente

```bash
# Ejecutar todas las pruebas
pytest

# Ejecutar pruebas específicas
pytest tests/test_auth_service.py

# Ejecutar con más detalle
pytest -v

# Ejecutar con cobertura
pytest --cov=app --cov-report=html
```

### Opción 3: Usando los scripts legacy

```bash
# Script de pruebas completo (requiere servidor corriendo)
python test_control_acceso.py

# Script de pruebas básico
python test_auth.py
```

## Cobertura de Pruebas

Las pruebas cubren los siguientes componentes:

### Servicios (Pruebas Unitarias)
- ✅ **AuthService**: Autenticación, sesiones, cambio de contraseña
- ✅ **PasswordService**: Validación y hash de contraseñas
- ✅ **PermissionService**: Gestión de permisos

### Endpoints (Pruebas de Integración)
- ✅ **Autenticación**: Login, logout, refresh token, cambio de contraseña
- ✅ **Usuarios**: CRUD completo, perfil, cambio de estado
- ✅ **Roles**: CRUD completo, asignación de permisos
- ✅ **Permisos**: CRUD completo

## Reglas de Negocio Probadas

- ✅ **RN-AUTH-001**: Bloqueo tras 5 intentos fallidos por 30 minutos
- ✅ **RN-AUTH-002**: Access token 15 min, refresh token 7 días
- ✅ **RN-AUTH-003**: No eliminar roles de sistema
- ✅ **RN-AUTH-005**: Validación de contraseña fuerte
- ✅ **RN-AUTH-007**: Invalidar sesiones al cambiar contraseña

## Fixtures Disponibles

Las siguientes fixtures están disponibles en `conftest.py`:

- `db_engine`: Engine de base de datos SQLite en memoria
- `db_session`: Sesión de base de datos para pruebas
- `client`: Cliente de prueba de FastAPI
- `admin_role`: Rol de administrador
- `user_role`: Rol de usuario normal
- `permissions`: Lista de permisos de prueba
- `admin_user`: Usuario administrador de prueba
- `normal_user`: Usuario normal de prueba
- `blocked_user`: Usuario bloqueado de prueba
- `admin_token`: Token de acceso para admin
- `user_token`: Token de acceso para usuario normal
- `admin_headers`: Headers con autenticación de admin
- `user_headers`: Headers con autenticación de usuario
- `active_session`: Sesión activa de prueba

## Ejemplos de Uso

### Prueba Unitaria

```python
def test_authenticate_user_success(db_session, admin_user):
    """Prueba autenticación exitosa"""
    user = AuthService.authenticate_user(
        db_session, 
        "admin_test", 
        "Admin123!@#"
    )
    assert user is not None
    assert user.username == "admin_test"
```

### Prueba de Integración

```python
def test_login_success(client, admin_user):
    """Prueba login exitoso"""
    response = client.post(
        "/api/auth/login",
        data={
            "username": "admin_test",
            "password": "Admin123!@#"
        }
    )
    assert response.status_code == 200
    assert "access_token" in response.json()
```

## Notas Importantes

1. **Base de Datos**: Las pruebas usan SQLite en memoria, no afectan la BD de producción
2. **Aislamiento**: Cada prueba tiene su propia sesión de BD que se limpia después
3. **Fixtures**: Las fixtures se recrean para cada prueba (scope="function")
4. **Autenticación**: Las pruebas de endpoints usan tokens JWT reales

## Solución de Problemas

### Error: "No module named 'pytest'"
```bash
pip install pytest pytest-asyncio httpx faker
```

### Error: "Database is locked"
Las pruebas usan SQLite en memoria, este error no debería ocurrir. Si ocurre, verifica que no haya sesiones abiertas.

### Error: "Fixture not found"
Verifica que `conftest.py` esté en el directorio `tests/`.

## Contribuir

Al agregar nuevas funcionalidades:

1. Escribe pruebas unitarias para servicios
2. Escribe pruebas de integración para endpoints
3. Asegúrate de que todas las pruebas pasen
4. Mantén la cobertura de código > 80%

## Comandos Útiles

```bash
# Ver lista de pruebas sin ejecutarlas
pytest --collect-only

# Ejecutar solo pruebas marcadas
pytest -m unit
pytest -m integration

# Ejecutar con output detallado
pytest -vv -s

# Detener en la primera falla
pytest -x

# Ejecutar pruebas en paralelo (requiere pytest-xdist)
pytest -n auto
```
