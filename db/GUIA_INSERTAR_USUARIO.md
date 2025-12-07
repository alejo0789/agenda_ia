# 📝 Guía: Cómo Insertar Usuario de Prueba en PostgreSQL

## 🎯 Objetivo
Insertar un usuario administrador de prueba en la base de datos PostgreSQL para poder hacer login en el sistema.

## 📋 Credenciales del Usuario de Prueba

```
Username: admin
Password: Admin123!@#
Email: admin@clubalisados.com
Rol: Administrador
```

## 🚀 Método 1: Desde la Consola de PostgreSQL (psql)

### Paso 1: Conectarse a PostgreSQL

```bash
# Abrir PowerShell o CMD y ejecutar:
psql -U postgres -d club_alisados
```

Te pedirá la contraseña de PostgreSQL (según tu .env es: `root`)

### Paso 2: Ejecutar el Script SQL

Una vez conectado a PostgreSQL, ejecuta:

```sql
-- Insertar usuario administrador
INSERT INTO usuarios (
    username,
    email,
    password_hash,
    nombre,
    rol_id,
    estado
) VALUES (
    'admin',
    'admin@clubalisados.com',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYIr.oUdNHu',
    'Administrador del Sistema',
    1,
    'activo'
);
```

### Paso 3: Verificar que se creó

```sql
SELECT id, username, email, nombre, rol_id, estado 
FROM usuarios 
WHERE username = 'admin';
```

### Paso 4: Salir de psql

```sql
\q
```

## 🚀 Método 2: Ejecutar el Script SQL Completo

### Opción A: Desde psql

```bash
# Conectarse y ejecutar el archivo
psql -U postgres -d club_alisados -f "C:\Users\alejandro.carvajal\Documents\large\software\db\insertar_usuario_prueba.sql"
```

### Opción B: Desde psql interactivo

```bash
# Conectarse a la base de datos
psql -U postgres -d club_alisados

# Dentro de psql, ejecutar:
\i 'C:/Users/alejandro.carvajal/Documents/large/software/db/insertar_usuario_prueba.sql'
```

## 🚀 Método 3: Usando pgAdmin

1. Abrir **pgAdmin**
2. Conectarse al servidor PostgreSQL
3. Navegar a: `Servers > PostgreSQL > Databases > club_alisados`
4. Click derecho en `club_alisados` → **Query Tool**
5. Copiar y pegar el siguiente SQL:

```sql
INSERT INTO usuarios (
    username,
    email,
    password_hash,
    nombre,
    rol_id,
    estado
) VALUES (
    'admin',
    'admin@clubalisados.com',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYIr.oUdNHu',
    'Administrador del Sistema',
    1,
    'activo'
);
```

6. Click en el botón **Execute/Run** (⚡ o F5)

## 🚀 Método 4: Usando Python (Recomendado)

Crea un archivo `crear_usuario_admin.py` en el directorio backend:

```python
import sys
import os
sys.path.append(os.getcwd())

from app.database import SessionLocal
from app.models.user import Usuario, Rol
from app.services.password_service import PasswordService

def crear_usuario_admin():
    db = SessionLocal()
    try:
        # Verificar si ya existe
        existing = db.query(Usuario).filter(Usuario.username == "admin").first()
        if existing:
            print("❌ El usuario 'admin' ya existe")
            return
        
        # Obtener rol de administrador
        admin_role = db.query(Rol).filter(Rol.nombre == "Administrador").first()
        if not admin_role:
            print("❌ No se encontró el rol de Administrador")
            return
        
        # Crear usuario
        admin_user = Usuario(
            username="admin",
            email="admin@clubalisados.com",
            password_hash=PasswordService.hash_password("Admin123!@#"),
            nombre="Administrador del Sistema",
            rol_id=admin_role.id,
            estado="activo"
        )
        
        db.add(admin_user)
        db.commit()
        db.refresh(admin_user)
        
        print("✅ Usuario administrador creado exitosamente!")
        print(f"   ID: {admin_user.id}")
        print(f"   Username: {admin_user.username}")
        print(f"   Email: {admin_user.email}")
        print(f"   Password: Admin123!@#")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    crear_usuario_admin()
```

Luego ejecutar:

```bash
python crear_usuario_admin.py
```

## ✅ Verificar que Funciona

### Opción 1: Desde SQL

```sql
SELECT 
    u.id,
    u.username,
    u.email,
    u.nombre,
    r.nombre as rol,
    u.estado
FROM usuarios u
INNER JOIN roles r ON u.rol_id = r.id
WHERE u.username = 'admin';
```

### Opción 2: Probar Login en la API

```bash
# Usando curl
curl -X POST "http://localhost:8000/api/auth/login" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=admin&password=Admin123!@#"
```

Debería retornar un token de acceso.

## 🔑 Información del Hash de Contraseña

El hash usado es:
```
$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYIr.oUdNHu
```

Este corresponde a la contraseña: `Admin123!@#`

## 📝 Comandos Útiles de PostgreSQL

```sql
-- Ver todos los usuarios
SELECT * FROM usuarios;

-- Ver usuarios con sus roles
SELECT u.username, u.email, r.nombre as rol 
FROM usuarios u 
JOIN roles r ON u.rol_id = r.id;

-- Eliminar usuario de prueba
DELETE FROM usuarios WHERE username = 'admin';

-- Cambiar estado de usuario
UPDATE usuarios SET estado = 'activo' WHERE username = 'admin';

-- Resetear intentos fallidos
UPDATE usuarios SET intentos_fallidos = 0, fecha_bloqueo = NULL 
WHERE username = 'admin';
```

## 🐛 Solución de Problemas

### Error: "relation usuarios does not exist"
La base de datos no está creada. Ejecuta primero:
```bash
psql -U postgres -d club_alisados -f "C:\Users\alejandro.carvajal\Documents\large\software\db\club_alisados.sql"
```

### Error: "duplicate key value violates unique constraint"
El usuario ya existe. Puedes:
1. Usar otro username
2. Eliminar el usuario existente: `DELETE FROM usuarios WHERE username = 'admin';`

### Error: "password authentication failed"
Verifica la contraseña de PostgreSQL en el archivo `.env`

### No puedo hacer login
1. Verifica que el usuario existe: `SELECT * FROM usuarios WHERE username = 'admin';`
2. Verifica que el estado sea 'activo'
3. Verifica que intentos_fallidos < 5
4. Verifica que el backend esté corriendo

## 📚 Archivos Relacionados

- **Script SQL**: `db/insertar_usuario_prueba.sql`
- **Base de datos completa**: `db/club_alisados.sql`
- **Configuración**: `backend/.env`

---

**¡Listo!** Ahora puedes hacer login con:
- **Username**: `admin`
- **Password**: `Admin123!@#`
