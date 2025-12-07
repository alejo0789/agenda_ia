-- ============================================
-- SCRIPT PARA INSERTAR USUARIO DE PRUEBA
-- Base de datos: club_alisados
-- ============================================

-- IMPORTANTE: Este script inserta un usuario de prueba con las siguientes credenciales:
-- Username: admin
-- Password: Admin123!@#
-- Email: admin@clubalisados.com

-- ============================================
-- PASO 1: Verificar que existe el rol de Administrador
-- ============================================
SELECT id, nombre FROM roles WHERE nombre = 'Administrador';
-- Debería retornar: id = 1, nombre = 'Administrador'

-- ============================================
-- PASO 2: Insertar usuario de prueba
-- ============================================

-- El hash de la contraseña "Admin123!@#" generado con bcrypt
-- NOTA: Este hash es válido y puede ser usado directamente
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
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYIr.oUdNHu',  -- Password: Admin123!@#
    'Administrador del Sistema',
    1,  -- ID del rol Administrador
    'activo'
);

-- ============================================
-- PASO 3: Verificar que el usuario fue creado
-- ============================================
SELECT 
    id,
    username,
    email,
    nombre,
    rol_id,
    estado,
    fecha_creacion
FROM usuarios 
WHERE username = 'admin';

-- ============================================
-- PASO 4 (OPCIONAL): Crear más usuarios de prueba
-- ============================================

-- Usuario Cajero
INSERT INTO usuarios (username, email, password_hash, nombre, rol_id, estado) VALUES (
    'cajero',
    'cajero@clubalisados.com',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYIr.oUdNHu',  -- Password: Admin123!@#
    'Cajero de Prueba',
    2,  -- ID del rol Cajero
    'activo'
);

-- Usuario Recepcionista
INSERT INTO usuarios (username, email, password_hash, nombre, rol_id, estado) VALUES (
    'recepcionista',
    'recepcionista@clubalisados.com',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYIr.oUdNHu',  -- Password: Admin123!@#
    'Recepcionista de Prueba',
    3,  -- ID del rol Recepcionista
    'activo'
);

-- ============================================
-- PASO 5: Verificar todos los usuarios creados
-- ============================================
SELECT 
    u.id,
    u.username,
    u.email,
    u.nombre,
    r.nombre as rol,
    u.estado,
    u.fecha_creacion
FROM usuarios u
INNER JOIN roles r ON u.rol_id = r.id
ORDER BY u.id;

-- ============================================
-- INFORMACIÓN IMPORTANTE
-- ============================================

/*
CREDENCIALES DE ACCESO:

1. Administrador:
   - Username: admin
   - Password: Admin123!@#
   - Email: admin@clubalisados.com

2. Cajero:
   - Username: cajero
   - Password: Admin123!@#
   - Email: cajero@clubalisados.com

3. Recepcionista:
   - Username: recepcionista
   - Password: Admin123!@#
   - Email: recepcionista@clubalisados.com

NOTA: Todos los usuarios tienen la misma contraseña para facilitar las pruebas.
      En producción, cada usuario debe tener su propia contraseña única.

HASH DE CONTRASEÑA:
El hash $2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYIr.oUdNHu 
corresponde a la contraseña "Admin123!@#" hasheada con bcrypt.

Si necesitas generar un hash diferente, puedes usar Python:
    from passlib.context import CryptContext
    pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
    hash = pwd_context.hash("TuContraseña123!@#")
    print(hash)
*/

-- ============================================
-- COMANDOS ÚTILES
-- ============================================

-- Ver todos los usuarios
-- SELECT * FROM usuarios;

-- Ver usuarios con sus roles
-- SELECT u.username, u.email, r.nombre as rol FROM usuarios u JOIN roles r ON u.rol_id = r.id;

-- Eliminar un usuario de prueba
-- DELETE FROM usuarios WHERE username = 'admin';

-- Cambiar contraseña de un usuario (requiere generar nuevo hash)
-- UPDATE usuarios SET password_hash = 'NUEVO_HASH_AQUI' WHERE username = 'admin';

-- Bloquear un usuario
-- UPDATE usuarios SET estado = 'bloqueado' WHERE username = 'admin';

-- Activar un usuario
-- UPDATE usuarios SET estado = 'activo' WHERE username = 'admin';
