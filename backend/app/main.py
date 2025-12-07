from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routers import users, auth, roles, especialistas, servicios, clientes
from .database import engine, Base

# Importar modelos para que estén registrados en Base.metadata
from .models import user, auth as auth_models, especialista, servicio, cliente

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
    """,
    version="1.0.0",
    swagger_ui_parameters={
        "persistAuthorization": True,  # Mantener el token entre recargas
        "displayRequestDuration": True,  # Mostrar duración de requests
    }
)

origins = [
    "http://localhost",
    "http://localhost:3000", # React default
    "http://localhost:3001", # Next.js alternate port
    "http://localhost:5173", # Vite default
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(roles.router)
app.include_router(roles.permisos_router)
app.include_router(especialistas.router)
app.include_router(servicios.categorias_router)
app.include_router(servicios.servicios_router)
app.include_router(clientes.router)
app.include_router(clientes.etiquetas_router)

@app.get("/")
def read_root():
    return {"message": "Welcome to Club Alisados API"}
