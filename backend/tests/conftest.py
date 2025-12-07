"""
Configuración de fixtures para pytest
"""
import pytest
import sys
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from fastapi.testclient import TestClient
from datetime import datetime, timedelta

# Configurar variable de entorno para testing antes de importar
os.environ["TESTING"] = "1"
os.environ["DATABASE_URL"] = "sqlite:///./test.db"

# Agregar el directorio raíz al path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import Base
from app.models.user import Usuario, Rol
from app.models.auth import Permiso, RolPermiso, Sesion
from app.services.password_service import PasswordService
from app.utils.jwt import create_access_token

# Base de datos de prueba en memoria
SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"

@pytest.fixture(scope="function")
def db_engine():
    """Crear engine de base de datos para pruebas"""
    engine = create_engine(
        SQLALCHEMY_DATABASE_URL,
        connect_args={"check_same_thread": False}
    )
    Base.metadata.create_all(bind=engine)
    yield engine
    Base.metadata.drop_all(bind=engine)

@pytest.fixture(scope="function")
def db_session(db_engine):
    """Crear sesión de base de datos para pruebas"""
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=db_engine)
    session = TestingSessionLocal()
    yield session
    session.close()

@pytest.fixture(scope="function")
def client(db_session):
    """Cliente de prueba de FastAPI"""
    # Importar app después de configurar variables de entorno
    from app.main import app
    from app.database import get_db
    
    def override_get_db():
        try:
            yield db_session
        finally:
            pass
    
    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()

@pytest.fixture(scope="function")
def admin_role(db_session):
    """Crear rol de administrador"""
    role = Rol(
        nombre="Administrador",
        descripcion="Rol de administrador del sistema",
        es_sistema=True
    )
    db_session.add(role)
    db_session.commit()
    db_session.refresh(role)
    return role

@pytest.fixture(scope="function")
def user_role(db_session):
    """Crear rol de usuario normal"""
    role = Rol(
        nombre="Usuario",
        descripcion="Rol de usuario normal",
        es_sistema=False
    )
    db_session.add(role)
    db_session.commit()
    db_session.refresh(role)
    return role

@pytest.fixture(scope="function")
def permissions(db_session):
    """Crear permisos de prueba"""
    permisos = [
        Permiso(codigo="usuarios.crear", nombre="Crear Usuarios", modulo="usuarios"),
        Permiso(codigo="usuarios.leer", nombre="Leer Usuarios", modulo="usuarios"),
        Permiso(codigo="usuarios.actualizar", nombre="Actualizar Usuarios", modulo="usuarios"),
        Permiso(codigo="usuarios.eliminar", nombre="Eliminar Usuarios", modulo="usuarios"),
        Permiso(codigo="roles.crear", nombre="Crear Roles", modulo="roles"),
        Permiso(codigo="roles.leer", nombre="Leer Roles", modulo="roles"),
    ]
    for permiso in permisos:
        db_session.add(permiso)
    db_session.commit()
    return permisos

@pytest.fixture(scope="function")
def admin_user(db_session, admin_role, permissions):
    """Crear usuario administrador de prueba"""
    # Asignar todos los permisos al rol admin
    for permiso in permissions:
        rol_permiso = RolPermiso(rol_id=admin_role.id, permiso_id=permiso.id)
        db_session.add(rol_permiso)
    
    user = Usuario(
        username="admin_test",
        email="admin@test.com",
        password_hash=PasswordService.hash_password("Admin123!@#"),
        nombre="Admin Test",
        rol_id=admin_role.id,
        estado="activo"
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user

@pytest.fixture(scope="function")
def normal_user(db_session, user_role):
    """Crear usuario normal de prueba"""
    user = Usuario(
        username="user_test",
        email="user@test.com",
        password_hash=PasswordService.hash_password("User123!@#"),
        nombre="User Test",
        rol_id=user_role.id,
        estado="activo"
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user

@pytest.fixture(scope="function")
def blocked_user(db_session, user_role):
    """Crear usuario bloqueado de prueba"""
    user = Usuario(
        username="blocked_test",
        email="blocked@test.com",
        password_hash=PasswordService.hash_password("Blocked123!@#"),
        nombre="Blocked Test",
        rol_id=user_role.id,
        estado="bloqueado",
        intentos_fallidos=5,
        fecha_bloqueo=datetime.utcnow()
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user

@pytest.fixture(scope="function")
def admin_token(admin_user):
    """Generar token de acceso para usuario administrador"""
    return create_access_token(data={"sub": admin_user.username, "user_id": admin_user.id})

@pytest.fixture(scope="function")
def user_token(normal_user):
    """Generar token de acceso para usuario normal"""
    return create_access_token(data={"sub": normal_user.username, "user_id": normal_user.id})

@pytest.fixture(scope="function")
def admin_headers(admin_token):
    """Headers con autenticación de administrador"""
    return {"Authorization": f"Bearer {admin_token}"}

@pytest.fixture(scope="function")
def user_headers(user_token):
    """Headers con autenticación de usuario normal"""
    return {"Authorization": f"Bearer {user_token}"}

@pytest.fixture(scope="function")
def active_session(db_session, admin_user, admin_token):
    """Crear sesión activa de prueba"""
    session = Sesion(
        usuario_id=admin_user.id,
        token=admin_token,
        ip="127.0.0.1",
        user_agent="pytest",
        fecha_expiracion=datetime.utcnow() + timedelta(minutes=15)
    )
    db_session.add(session)
    db_session.commit()
    db_session.refresh(session)
    return session
