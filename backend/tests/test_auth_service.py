"""
Pruebas unitarias para el servicio de autenticación (AuthService)
"""
import pytest
from datetime import datetime, timedelta
from fastapi import HTTPException

from app.services.auth_service import AuthService
from app.models.user import Usuario
from app.models.auth import Sesion


class TestAuthService:
    """Pruebas para AuthService"""
    
    def test_authenticate_user_success(self, db_session, admin_user):
        """Prueba autenticación exitosa"""
        user = AuthService.authenticate_user(
            db_session, 
            "admin_test", 
            "Admin123!@#",
            ip="127.0.0.1"
        )
        assert user is not None
        assert user.username == "admin_test"
        assert user.intentos_fallidos == 0
    
    def test_authenticate_user_wrong_password(self, db_session, admin_user):
        """Prueba autenticación con contraseña incorrecta"""
        user = AuthService.authenticate_user(
            db_session, 
            "admin_test", 
            "WrongPassword123!",
            ip="127.0.0.1"
        )
        assert user is None
        
        # Verificar que se incrementaron los intentos fallidos
        db_session.refresh(admin_user)
        assert admin_user.intentos_fallidos == 1
    
    def test_authenticate_user_nonexistent(self, db_session):
        """Prueba autenticación con usuario inexistente"""
        user = AuthService.authenticate_user(
            db_session, 
            "nonexistent_user", 
            "Password123!",
            ip="127.0.0.1"
        )
        assert user is None
    
    def test_brute_force_protection(self, db_session, admin_user):
        """Prueba RN-AUTH-001: Bloqueo tras 5 intentos fallidos"""
        # Realizar 5 intentos fallidos
        for i in range(5):
            user = AuthService.authenticate_user(
                db_session, 
                "admin_test", 
                "WrongPassword",
                ip="127.0.0.1"
            )
            assert user is None
        
        # Verificar que el usuario está bloqueado
        db_session.refresh(admin_user)
        assert admin_user.estado == "bloqueado"
        assert admin_user.intentos_fallidos == 5
        assert admin_user.fecha_bloqueo is not None
        
        # El 6to intento debe lanzar excepción
        with pytest.raises(HTTPException) as exc_info:
            AuthService.authenticate_user(
                db_session, 
                "admin_test", 
                "Admin123!@#",
                ip="127.0.0.1"
            )
        assert exc_info.value.status_code == 403
    
    def test_blocked_user_unblock_after_30_minutes(self, db_session, blocked_user):
        """Prueba desbloqueo automático después de 30 minutos"""
        # Simular que han pasado 30 minutos
        blocked_user.fecha_bloqueo = datetime.utcnow() - timedelta(minutes=31)
        db_session.commit()
        
        # Intentar autenticar
        user = AuthService.authenticate_user(
            db_session, 
            "blocked_test", 
            "Blocked123!@#",
            ip="127.0.0.1"
        )
        
        assert user is not None
        assert user.estado == "activo"
        assert user.intentos_fallidos == 0
        assert user.fecha_bloqueo is None
    
    def test_create_session(self, db_session, admin_user):
        """Prueba RN-AUTH-002: Creación de sesión con tokens"""
        access_token, refresh_token = AuthService.create_session(
            db_session,
            admin_user,
            ip="127.0.0.1",
            user_agent="pytest"
        )
        
        assert access_token is not None
        assert refresh_token is not None
        
        # Verificar que se creó la sesión en la BD
        session = db_session.query(Sesion).filter(
            Sesion.usuario_id == admin_user.id
        ).first()
        assert session is not None
        assert session.token == access_token
        assert session.ip == "127.0.0.1"
        assert session.user_agent == "pytest"
    
    def test_logout(self, db_session, admin_user, active_session):
        """Prueba cierre de sesión"""
        AuthService.logout(
            db_session,
            active_session.token,
            admin_user.id,
            ip="127.0.0.1"
        )
        
        # Verificar que se eliminó la sesión
        session = db_session.query(Sesion).filter(
            Sesion.token == active_session.token
        ).first()
        assert session is None
    
    def test_logout_all(self, db_session, admin_user):
        """Prueba cierre de todas las sesiones"""
        # Crear múltiples sesiones
        for i in range(3):
            session = Sesion(
                usuario_id=admin_user.id,
                token=f"token_{i}",
                fecha_expiracion=datetime.utcnow() + timedelta(minutes=15)
            )
            db_session.add(session)
        db_session.commit()
        
        # Cerrar todas las sesiones
        AuthService.logout_all(db_session, admin_user.id, ip="127.0.0.1")
        
        # Verificar que no quedan sesiones
        sessions = db_session.query(Sesion).filter(
            Sesion.usuario_id == admin_user.id
        ).all()
        assert len(sessions) == 0
    
    def test_change_password_success(self, db_session, admin_user):
        """Prueba RN-AUTH-007: Cambio de contraseña exitoso"""
        # Crear una sesión activa
        session = Sesion(
            usuario_id=admin_user.id,
            token="test_token",
            fecha_expiracion=datetime.utcnow() + timedelta(minutes=15)
        )
        db_session.add(session)
        db_session.commit()
        
        # Cambiar contraseña
        AuthService.change_password(
            db_session,
            admin_user,
            "Admin123!@#",
            "NewPassword123!@#",
            ip="127.0.0.1"
        )
        
        # Verificar que se invalidaron todas las sesiones
        sessions = db_session.query(Sesion).filter(
            Sesion.usuario_id == admin_user.id
        ).all()
        assert len(sessions) == 0
    
    def test_change_password_wrong_old_password(self, db_session, admin_user):
        """Prueba cambio de contraseña con contraseña antigua incorrecta"""
        with pytest.raises(HTTPException) as exc_info:
            AuthService.change_password(
                db_session,
                admin_user,
                "WrongOldPassword",
                "NewPassword123!@#",
                ip="127.0.0.1"
            )
        assert exc_info.value.status_code == 400
    
    def test_change_password_weak_new_password(self, db_session, admin_user):
        """Prueba RN-AUTH-005: Rechazo de contraseña débil"""
        with pytest.raises(HTTPException) as exc_info:
            AuthService.change_password(
                db_session,
                admin_user,
                "Admin123!@#",
                "weak",
                ip="127.0.0.1"
            )
        assert exc_info.value.status_code == 400
