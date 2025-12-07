# Club de Alisados - Frontend

Sistema de gestión integral para salón de belleza construido con Next.js 14, TypeScript y Tailwind CSS.

## 🚀 Características

- ✨ Diseño moderno y atractivo con gradientes y animaciones
- 🔐 Sistema de autenticación completo
- 📊 Dashboard con estadísticas y métricas
- 📱 Diseño responsive y mobile-first
- 🌙 Modo oscuro integrado
- 🎨 Sistema de diseño consistente con Tailwind CSS
- 🔔 Notificaciones toast con Sonner
- 📋 Formularios con validación en tiempo real
- 🎯 Navegación intuitiva con sidebar colapsable

## 📋 Requisitos Previos

- Node.js 18.x o superior
- npm o yarn
- Backend FastAPI corriendo en `http://localhost:8000`

## 🛠️ Instalación

### Opción 1: Usando PowerShell con permisos (Recomendado)

1. Abre PowerShell como Administrador
2. Ejecuta el siguiente comando para permitir la ejecución de scripts:
   ```powershell
   Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
   ```
3. Navega a la carpeta del frontend:
   ```powershell
   cd c:\Users\alejandro.carvajal\Documents\large\software\frontend
   ```
4. Instala las dependencias:
   ```powershell
   npm install
   ```

### Opción 2: Usando CMD

1. Abre CMD (Símbolo del sistema)
2. Navega a la carpeta del frontend:
   ```cmd
   cd c:\Users\alejandro.carvajal\Documents\large\software\frontend
   ```
3. Instala las dependencias:
   ```cmd
   npm install
   ```

## 🏃‍♂️ Ejecutar el Proyecto

### Modo Desarrollo

```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:3000`

### Modo Producción

```bash
npm run build
npm start
```

## 📁 Estructura del Proyecto

```
frontend/
├── src/
│   ├── app/                    # App Router de Next.js
│   │   ├── (auth)/            # Rutas de autenticación
│   │   │   └── login/         # Página de login
│   │   ├── dashboard/         # Rutas del dashboard
│   │   │   ├── layout.tsx     # Layout del dashboard
│   │   │   └── page.tsx       # Página principal del dashboard
│   │   ├── globals.css        # Estilos globales
│   │   ├── layout.tsx         # Layout raíz
│   │   └── page.tsx           # Página de inicio
│   ├── components/            # Componentes reutilizables
│   │   ├── ui/               # Componentes UI base
│   │   │   ├── button.tsx
│   │   │   ├── input.tsx
│   │   │   ├── card.tsx
│   │   │   ├── label.tsx
│   │   │   └── sonner.tsx
│   │   └── layout/           # Componentes de layout
│   │       ├── Sidebar.tsx
│   │       └── Header.tsx
│   ├── lib/                  # Utilidades y configuración
│   │   ├── api/             # Cliente API
│   │   │   ├── client.ts    # Configuración de Axios
│   │   │   └── auth.ts      # API de autenticación
│   │   └── utils.ts         # Funciones utilitarias
│   ├── stores/              # Estado global (Zustand)
│   │   └── authStore.ts     # Store de autenticación
│   └── types/               # Tipos TypeScript
├── public/                  # Archivos estáticos
├── .env.local              # Variables de entorno
├── next.config.js          # Configuración de Next.js
├── tailwind.config.ts      # Configuración de Tailwind
├── tsconfig.json           # Configuración de TypeScript
└── package.json            # Dependencias del proyecto
```

## 🔐 Autenticación

El sistema utiliza JWT (JSON Web Tokens) para la autenticación:

1. El usuario ingresa sus credenciales en `/login`
2. El backend valida y retorna un token JWT
3. El token se almacena en localStorage
4. Todas las peticiones subsecuentes incluyen el token en el header `Authorization`
5. Si el token expira, el usuario es redirigido automáticamente al login

## 🎨 Sistema de Diseño

### Colores Principales

- **Primary**: Púrpura (#8B5CF6) - Acciones principales
- **Secondary**: Rosa (#EC4899) - Acentos y gradientes
- **Success**: Verde (#10B981) - Estados positivos
- **Error**: Rojo (#EF4444) - Estados de error
- **Warning**: Naranja (#F59E0B) - Advertencias

### Componentes UI

Todos los componentes UI están basados en Shadcn/ui y son completamente personalizables:

- **Button**: Múltiples variantes (default, destructive, outline, ghost, link)
- **Input**: Con validación y estados de error
- **Card**: Para contenedores de contenido
- **Label**: Para etiquetas de formularios
- **Toast**: Notificaciones con Sonner

## 🌐 Conexión con el Backend

La URL del backend se configura en `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

El cliente API (`src/lib/api/client.ts`) está configurado con:

- Interceptores para agregar el token JWT automáticamente
- Manejo de errores 401 (redirección al login)
- Headers por defecto

## 📱 Módulos Disponibles

El sidebar incluye acceso a los siguientes módulos:

1. **Dashboard** - Vista general y estadísticas
2. **Calendario** - Gestión de citas (próximamente)
3. **Especialistas** - Gestión de especialistas (próximamente)
4. **Servicios** - Catálogo de servicios (próximamente)
5. **Clientes** - Base de datos de clientes (próximamente)
6. **Caja** - Control de pagos e ingresos (próximamente)
7. **Inventario** - Gestión de productos (próximamente)
8. **Nómina** - Gestión de pagos a empleados (próximamente)
9. **Reportes** - Reportes y análisis (próximamente)
10. **Usuarios** - Gestión de usuarios del sistema (próximamente)
11. **Configuración** - Configuración general (próximamente)

## 🔧 Tecnologías Utilizadas

- **Next.js 14** - Framework React con App Router
- **TypeScript** - Tipado estático
- **Tailwind CSS** - Estilos utilitarios
- **Zustand** - Gestión de estado
- **React Hook Form** - Manejo de formularios
- **Zod** - Validación de esquemas
- **Axios** - Cliente HTTP
- **Lucide React** - Iconos
- **Sonner** - Notificaciones toast
- **date-fns** - Manejo de fechas

## 👨‍💻 Desarrollo

### Principios de HCI y UX Aplicados

1. **Visibilidad del estado del sistema**: Loading states, feedback inmediato
2. **Consistencia**: Sistema de diseño unificado
3. **Prevención de errores**: Validación en tiempo real
4. **Reconocimiento vs. Recuerdo**: Navegación clara y visible
5. **Flexibilidad**: Sidebar colapsable, modo oscuro
6. **Diseño estético**: Gradientes, animaciones suaves, espaciado consistente

### Mejores Prácticas

- Componentes pequeños y reutilizables
- Separación de lógica y presentación
- Tipado estricto con TypeScript
- Validación de formularios con Zod
- Manejo centralizado de errores
- Estado global mínimo (solo autenticación)

## 📝 Credenciales de Prueba

Para probar el sistema, puedes usar las credenciales creadas en el backend:

- **Usuario**: admin
- **Contraseña**: Admin123!

## 🐛 Solución de Problemas

### Error: "Cannot find module"

Asegúrate de haber instalado todas las dependencias:
```bash
npm install
```

### Error: "Execution of scripts is disabled"

Ejecuta PowerShell como administrador y permite la ejecución de scripts:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Backend no responde

Verifica que el backend FastAPI esté corriendo en `http://localhost:8000`

## 📄 Licencia

Este proyecto es privado y confidencial.

## 👥 Autor

Desarrollado con ❤️ siguiendo los principios de HCI y UX para crear una experiencia de usuario excepcional.
