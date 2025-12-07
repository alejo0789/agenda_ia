# 🔐 Guía: Cómo Usar Autenticación en Swagger/FastAPI Docs

## 📋 Problema Resuelto

Ahora los **FastAPI Docs** (Swagger UI) tienen el botón **"Authorize"** 🔓 para que puedas probar endpoints protegidos fácilmente.

---

## 🚀 Cómo Usar la Autenticación en Swagger

### Paso 1: Abrir FastAPI Docs

1. Asegúrate de que el backend esté corriendo:
   ```bash
   cd c:\Users\alejandro.carvajal\Documents\large\software\backend
   uvicorn app.main:app --reload
   ```

2. Abre tu navegador en:
   ```
   http://localhost:8000/docs
   ```

### Paso 2: Hacer Login

1. Busca el endpoint **`POST /api/auth/login`**
2. Haz click en **"Try it out"**
3. Ingresa las credenciales:
   ```
   username: admin
   password: Admin123!@#
   ```
4. Haz click en **"Execute"**
5. En la respuesta, **copia el `access_token`** (sin las comillas)

**Ejemplo de respuesta:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer"
}
```

### Paso 3: Autorizar en Swagger

1. **Busca el botón "Authorize" 🔓** en la parte superior derecha de la página
2. Haz click en él
3. Se abrirá un modal con el campo **"Value"**
4. **Pega el `access_token`** que copiaste (SIN el prefijo "Bearer")
5. Haz click en **"Authorize"**
6. Haz click en **"Close"**

**¡Listo!** Ahora verás un candado cerrado 🔒 junto a cada endpoint protegido.

### Paso 4: Probar Endpoints Protegidos

Ahora puedes probar cualquier endpoint protegido:

1. Por ejemplo, **`GET /api/usuarios/me`**
2. Haz click en **"Try it out"**
3. Haz click en **"Execute"**
4. ✅ Deberías recibir tu información de usuario

---

## 🎯 Endpoints para Probar

### Autenticación (No requieren token)
- ✅ `POST /api/auth/login` - Hacer login
- ✅ `POST /api/auth/refresh` - Refrescar token

### Usuarios (Requieren token) 🔒
- 🔒 `GET /api/usuarios/me` - Obtener usuario actual
- 🔒 `GET /api/usuarios` - Listar todos los usuarios
- 🔒 `GET /api/usuarios/{id}` - Obtener usuario por ID
- 🔒 `POST /api/usuarios` - Crear nuevo usuario
- 🔒 `PUT /api/usuarios/{id}` - Actualizar usuario
- 🔒 `DELETE /api/usuarios/{id}` - Eliminar usuario

### Roles (Requieren token) 🔒
- 🔒 `GET /api/roles` - Listar roles
- 🔒 `GET /api/roles/{id}` - Obtener rol por ID
- 🔒 `POST /api/roles` - Crear rol
- 🔒 `PUT /api/roles/{id}` - Actualizar rol
- 🔒 `DELETE /api/roles/{id}` - Eliminar rol

### Permisos (Requieren token) 🔒
- 🔒 `GET /api/permisos` - Listar permisos

---

## 🔄 Si el Token Expira

Los tokens de acceso expiran en **15 minutos**. Si recibes un error `401 Unauthorized`:

### Opción 1: Hacer Login Nuevamente
1. Repite el Paso 2 (hacer login)
2. Copia el nuevo `access_token`
3. Haz click en **"Authorize"** 🔓
4. Pega el nuevo token
5. Haz click en **"Authorize"** y luego **"Close"**

### Opción 2: Usar Refresh Token
1. Usa el endpoint `POST /api/auth/refresh`
2. Envía el `refresh_token` que obtuviste en el login
3. Obtendrás un nuevo `access_token`
4. Actualiza la autorización con el nuevo token

---

## 📝 Notas Importantes

### ✅ Qué Hacer
- ✅ Copiar solo el `access_token` (sin comillas)
- ✅ NO agregar el prefijo "Bearer" al pegar el token
- ✅ Hacer click en "Authorize" después de pegar el token
- ✅ El token se mantendrá entre recargas de página

### ❌ Qué NO Hacer
- ❌ NO pegues el token con comillas: `"eyJhbG..."`
- ❌ NO agregues "Bearer" antes del token: `Bearer eyJhbG...`
- ❌ NO uses el `refresh_token` para autorizar (usa el `access_token`)

---

## 🎨 Mejoras Implementadas

He actualizado el archivo `app/main.py` con:

1. **Descripción mejorada** con instrucciones de autenticación
2. **Credenciales de prueba** visibles en la documentación
3. **`persistAuthorization: True`** - El token se mantiene entre recargas
4. **`displayRequestDuration: True`** - Muestra el tiempo de respuesta

---

## 🐛 Solución de Problemas

### Problema: No veo el botón "Authorize"
**Solución**: 
1. Reinicia el servidor: `Ctrl+C` y luego `uvicorn app.main:app --reload`
2. Recarga la página de docs: `http://localhost:8000/docs`

### Problema: El token no funciona (401 Unauthorized)
**Solución**:
1. Verifica que copiaste el `access_token` completo
2. Verifica que NO agregaste "Bearer" antes del token
3. Verifica que el token no haya expirado (15 minutos)
4. Haz login nuevamente para obtener un token fresco

### Problema: "Could not validate credentials"
**Solución**:
1. El token puede estar mal formado o expirado
2. Haz login nuevamente
3. Copia el nuevo token
4. Actualiza la autorización

### Problema: "User account is inactive"
**Solución**:
```bash
python resetear_password.py admin
```

---

## 🎯 Ejemplo Completo

### 1. Login
```bash
POST /api/auth/login
Body (form-data):
  username: admin
  password: Admin123!@#

Response:
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhZG1pbiIsInVzZXJfaWQiOjMsImV4cCI6MTcwMTg4MjAwMCwidHlwZSI6ImFjY2VzcyJ9.xxxxx",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhZG1pbiIsInVzZXJfaWQiOjMsImV4cCI6MTcwMjQ4NjgwMCwidHlwZSI6InJlZnJlc2gifQ.xxxxx",
  "token_type": "bearer"
}
```

### 2. Autorizar en Swagger
- Click en **"Authorize"** 🔓
- Pegar: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhZG1pbiIsInVzZXJfaWQiOjMsImV4cCI6MTcwMTg4MjAwMCwidHlwZSI6ImFjY2VzcyJ9.xxxxx`
- Click en **"Authorize"**
- Click en **"Close"**

### 3. Probar Endpoint Protegido
```bash
GET /api/usuarios/me

Response:
{
  "id": 3,
  "username": "admin",
  "email": "user@example.com",
  "nombre": "string",
  "rol_id": 1,
  "estado": "activo",
  "fecha_creacion": "2025-12-06T13:25:37.034193"
}
```

---

## ✨ ¡Listo!

Ahora puedes probar todos los endpoints protegidos directamente desde Swagger sin problemas de autenticación. 🎉

**URL de Docs**: http://localhost:8000/docs
**Credenciales**: admin / Admin123!@#
