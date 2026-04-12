from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles  # Importar StaticFiles
from .routers import users, auth, roles, especialistas, servicios, clientes, citas, productos, inventario, sedes, dashboard
from .routers import cajas, facturas, facturas_pendientes, ventas, comisiones, abonos, reportes, nomina, files, descuentos, fichas_tecnicas, lizto_mapping
from .database import engine, Base
from uvicorn.middleware.proxy_headers import ProxyHeadersMiddleware

# Importar modelos para que estén registrados en Base.metadata
from .models import user, auth as auth_models, especialista, servicio, cliente, cita, sede
from .models import producto as producto_models  # Nuevo módulo de productos e inventario
from .models import caja as caja_models  # Módulo de caja
from .models import abono as abono_models  # Módulo de abonos
from .models import descuento as descuento_models  # Módulo de descuentos

# Create tables if they don't exist
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Club Alisados API",
    description="""
    ## Backend para Sistema de Gestión de Club de Alisados
    
    ### Autenticación
    Para probar los endpoints protegidos:
    1. Haz login en `/api/auth/login` con tus credenciales
    2. Copia el `access_token` de la respuesta
    3. Haz click en el botón **"Authorize"** 🔓 (arriba a la derecha)
    4. Pega el token en el campo "Value" (sin el prefijo "Bearer")
    5. Haz click en "Authorize" y luego "Close"
    6. Ahora puedes probar todos los endpoints protegidos
    
    ### Credenciales de Prueba
    - **Username**: admin
    - **Password**: Admin123!@#
    
    ### Módulos Disponibles
    - **Autenticación**: Login, logout, refresh token
    - **Usuarios**: Gestión de usuarios del sistema
    - **Roles y Permisos**: Control de acceso
    - **Especialistas**: Gestión de estilistas
    - **Servicios**: Catálogo de servicios
    - **Clientes**: Gestión de clientes
    - **Citas**: Gestión de agenda
    - **Productos**: Catálogo de productos e inventario
    - **Inventario**: Control de stock y movimientos
    - **Caja/POS**: Facturación, pagos mixtos, apertura/cierre de caja
    - **Ventas**: Reportes de ventas diarias y por período
    - **Comisiones**: Consulta de comisiones de especialistas
    - **Archivos**: Subida y gestión de archivos (fotos clientes)
    """,
    version="1.0.0",
    swagger_ui_parameters={
        "persistAuthorization": True,  # Mantener el token entre recargas
        "displayRequestDuration": True,  # Mostrar duración de requests
    }
)

# Handle HTTPS behind proxy
app.add_middleware(ProxyHeadersMiddleware, trusted_hosts="*")

# Configuración de CORS
origins = [
    "http://localhost",
    "http://localhost:3000",
    "http://localhost:3001",
    "http://192.168.1.171:3000",
    "http://192.168.1.171:3001",
    "http://192.168.1.8:3000",
    "https://siagenda.com",
    "https://www.siagenda.com",
    "https://agendaia-production.up.railway.app",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=r"https://.*\.siagenda\.com|https://siagenda\.com|https://.*\.railway\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Montar directorio de uploads como estático
# Asegurarse que el directorio existe dentro del volumen persistente
import os
os.makedirs("storage/uploads", exist_ok=True)
os.makedirs("storage/documentacion", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="storage/uploads"), name="uploads")
app.mount("/storage", StaticFiles(directory="storage"), name="storage")


# Include routers
app.include_router(auth.router)
app.include_router(dashboard.router)
app.include_router(users.router)
app.include_router(sedes.router)
app.include_router(roles.router)
app.include_router(roles.permisos_router)
app.include_router(especialistas.router)
app.include_router(servicios.categorias_router)
app.include_router(servicios.servicios_router)
app.include_router(clientes.etiquetas_router)
app.include_router(clientes.router)
app.include_router(citas.router)

# Routers de Productos e Inventario
app.include_router(productos.proveedores_router)
app.include_router(productos.productos_router)
app.include_router(inventario.router)

# Routers de Caja/POS
app.include_router(cajas.router)
app.include_router(facturas.router)
app.include_router(facturas_pendientes.router)
app.include_router(ventas.ventas_router)
app.include_router(ventas.metodos_router)
app.include_router(comisiones.router)
app.include_router(abonos.router)
app.include_router(reportes.router)
app.include_router(nomina.router)
app.include_router(files.router)  # Registrar router de archivos
app.include_router(descuentos.router)
app.include_router(fichas_tecnicas.router)
app.include_router(lizto_mapping.router)

@app.get("/")
def read_root():
    return {"message": "Welcome to Club Alisados API"}
