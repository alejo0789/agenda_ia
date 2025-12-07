# Guía Rápida de Instalación - Frontend

## ⚡ Pasos para Iniciar el Frontend

### 1. Habilitar Ejecución de Scripts en PowerShell

Abre PowerShell como **Administrador** y ejecuta:

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

Cuando te pregunte, escribe `S` (Sí) y presiona Enter.

### 2. Navegar a la Carpeta del Frontend

Abre una nueva ventana de PowerShell (no necesita ser administrador) y ejecuta:

```powershell
cd c:\Users\alejandro.carvajal\Documents\large\software\frontend
```

### 3. Instalar Dependencias

```powershell
npm install
```

Este proceso puede tardar 2-3 minutos. Espera a que termine completamente.

### 4. Verificar que el Backend Esté Corriendo

Antes de iniciar el frontend, asegúrate de que el backend FastAPI esté corriendo:

```powershell
# En otra terminal, navega al backend
cd c:\Users\alejandro.carvajal\Documents\large\software\backend

# Activa el entorno virtual
.\venv\Scripts\Activate

# Ejecuta el backend
python main.py
```

El backend debe estar corriendo en `http://localhost:8000`

### 5. Iniciar el Frontend

Vuelve a la terminal del frontend y ejecuta:

```powershell
npm run dev
```

### 6. Abrir en el Navegador

Abre tu navegador y ve a:

```
http://localhost:3000
```

Deberías ver la página de login del sistema.

## 🔐 Credenciales de Prueba

- **Usuario**: `admin`
- **Contraseña**: `Admin123!`

## ✅ Verificación

Si todo está correcto, deberías ver:

1. ✅ La página de login con un diseño moderno (gradientes púrpura/rosa)
2. ✅ Al iniciar sesión, serás redirigido al dashboard
3. ✅ El dashboard mostrará tu nombre y rol
4. ✅ El menú lateral mostrará todos los módulos disponibles

## 🚨 Problemas Comunes

### Error: "npm no se reconoce como comando"

**Solución**: Instala Node.js desde https://nodejs.org/

### Error: "Cannot connect to backend"

**Solución**: Verifica que el backend esté corriendo en `http://localhost:8000`

### Error: "401 Unauthorized"

**Solución**: Las credenciales son incorrectas. Usa `admin` / `Admin123!`

### La página se ve sin estilos

**Solución**: 
1. Detén el servidor (Ctrl+C)
2. Ejecuta `npm install` nuevamente
3. Ejecuta `npm run dev`

## 📝 Comandos Útiles

```powershell
# Instalar dependencias
npm install

# Iniciar en modo desarrollo
npm run dev

# Compilar para producción
npm run build

# Iniciar en modo producción
npm start

# Verificar errores de código
npm run lint
```

## 🎯 Próximos Pasos

Una vez que el frontend esté corriendo:

1. Explora el dashboard y sus estadísticas
2. Revisa el menú lateral con todos los módulos
3. Prueba el modo oscuro (botón de luna en el header)
4. Prueba cerrar sesión y volver a iniciar

## 📞 Soporte

Si encuentras algún problema, revisa:

1. Que Node.js esté instalado (`node --version`)
2. Que npm esté instalado (`npm --version`)
3. Que el backend esté corriendo
4. Los logs en la consola del navegador (F12)
5. Los logs en la terminal donde corre el frontend
