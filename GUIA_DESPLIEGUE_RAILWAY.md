# Guía de Despliegue en Railway - Club Alisados

Esta guía detalla los pasos para desplegar el proyecto (Backend FastAPI + Frontend Next.js + PostgreSQL) en Railway utilizando GitHub.

## 1. Preparación del Repositorio en GitHub

### Paso 1: Crear un repositorio en GitHub
1. Ve a [github.com](https://github.com) y crea un nuevo repositorio llamado `club-alisados`.
2. No lo inicialices con README ni .gitignore (ya los tenemos localmente).

### Paso 2: Subir tu código actual
Asegúrate de estar en la raíz del proyecto (`.../software`) y ejecuta:

```bash
# Agregar todos los archivos
git add .

# Crear el primer commit
git commit -m "Preparando para despliegue en Railway"

# Vincular con tu repo de GitHub (Reemplaza con tu URL)
git remote add origin https://github.com/TU_USUARIO/club-alisados.git

# Subir el código
git push -u origin main
```

---

## 2. Configuración en Railway

### Paso 1: Crear el proyecto y la Base de Datos
1. Entra a [Railway.app](https://railway.app) e inicia sesión con GitHub.
2. Haz clic en **"New Project"** -> **"Provision PostgreSQL"**.
3. Esto creará una base de datos PostgreSQL vacía.

### Paso 2: Desplegar el Backend (FastAPI)
1. Haz clic en **"New"** -> **"GitHub Repo"** -> Selecciona `club-alisados`.
2. Una vez agregado, ve a los ajustes del servicio (**Settings**):
   - **Service Name**: Cambialo a `backend`.
   - **Root Directory**: Escribe `backend`.
3. Ve a **Variables** y agrega:
   - Haz clic en **"New Variable"** -> **"Add Reference"** -> Selecciona `DATABASE_URL` de la base de datos PostgreSQL.
   - `SECRET_KEY`: Una cadena aleatoria larga (ej: `tu_llave_secreta_super_segura`).
   - `ALGORITHM`: `HS256`
   - `ACCESS_TOKEN_EXPIRE_MINUTES`: `1440` (24 horas)
   - `PORT`: `8000` (Railway suele asignarlo automáticamente, pero es bueno tenerlo).
4. El backend se desplegará automáticamente. Railway detectará el `requirements.txt` y lo instalará.

### Paso 3: Desplegar el Frontend (Next.js)
1. Haz clic en **"New"** -> **"GitHub Repo"** -> Selecciona el mismo repo `club-alisados`.
2. Ve a los ajustes del servicio (**Settings**):
   - **Service Name**: Cambialo a `frontend`.
   - **Root Directory**: Escribe `frontend`.
3. Ve a **Variables** y agrega:
   - `NEXT_PUBLIC_API_URL`: Aquí debes poner la URL que Railway le asignó a tu servicio de backend + `/api`. 
     - Ejemplo: `https://backend-production-xxxx.up.railway.app/api`
4. Railway detectará que es un proyecto Next.js y ejecutará `npm run build` y `npm start`.

---

## 3. Notas Importantes

### Migraciones de Base de Datos
El backend está configurado para crear las tablas automáticamente al iniciar (`Base.metadata.create_all`). La primera vez que el backend se conecte a PostgreSQL en Railway, creará toda la estructura necesaria.

### URL del Frontend
Para que el backend acepte peticiones del frontend, asegúrate de que el frontend tenga un dominio asignado en Railway (**Settings** -> **Public Networking** -> **Generate Domain**).

### Scripts de Inicialización
Si necesitas crear el usuario administrador inicial en la base de datos de Railway, puedes usar la terminal de Railway o ejecutar localmente apuntando a la base de datos remota:
1. Copia la `DATABASE_URL` externa de Railway.
2. Ejecuta: `DATABASE_URL=tu_url_de_railway python crear_usuario_admin.py` (desde la carpeta backend).
