from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from fastapi import HTTPException, status
from ..models import Usuario, Sesion, LogAuditoria
from ..utils.security import verify_password, get_password_hash
from ..utils.jwt import create_access_token, create_refresh_token, verify_token
from .password_service import PasswordService
from .audit_service import AuditService
from typing import Optional
from sqlalchemy import or_
from ..config import settings

class AuthService:
    @staticmethod
    def authenticate_user(db: Session, username: str, password: str, ip: str = None) -> Optional[Usuario]:
        # Support login by username or email
        from sqlalchemy import func
        user = db.query(Usuario).filter(
            or_(
                func.lower(Usuario.username) == func.lower(username),
                func.lower(Usuario.email) == func.lower(username)
            )
        ).first()
        
        if not user:
            return None
        
        # Check if user is blocked
        if user.estado == "bloqueado":
            if user.fecha_bloqueo:
                # Check if 30 minutes have passed (RN-AUTH-001)
                if datetime.utcnow() < user.fecha_bloqueo + timedelta(minutes=30):
                    raise HTTPException(
                        status_code=status.HTTP_403_FORBIDDEN,
                        detail="Account is temporarily blocked. Try again later."
                    )
                else:
                    # Unblock user
                    user.estado = "activo"
                    user.intentos_fallidos = 0
                    user.fecha_bloqueo = None
                    db.commit()
        
        if not verify_password(password, user.password_hash):
            # Increment failed attempts
            user.intentos_fallidos = (user.intentos_fallidos or 0) + 1
            
            # Block after 5 failed attempts (RN-AUTH-001)
            if user.intentos_fallidos >= 5:
                user.estado = "bloqueado"
                user.fecha_bloqueo = datetime.utcnow()
                
                # Log audit
                AuditService.log_user_blocked(
                    db, user.id, "5 intentos fallidos", ip
                )
            
            db.commit()
            return None
        
        # Reset failed attempts on successful login
        user.intentos_fallidos = 0
        user.ultimo_acceso = datetime.utcnow()
        db.commit()
        
        return user
    
    @staticmethod
    def create_session(db: Session, user: Usuario, ip: str = None, user_agent: str = None) -> tuple[str, str]:
        # Create access and refresh tokens (RN-AUTH-002: Access 15min, Refresh 7 days)
        access_token = create_access_token(data={"sub": user.username, "user_id": user.id})
        refresh_token = create_refresh_token(data={"sub": user.username, "user_id": user.id})
        
        # Store session
        sesion = Sesion(
            usuario_id=user.id,
            token=access_token,
            ip=ip,
            user_agent=user_agent,
            fecha_expiracion=datetime.utcnow() + timedelta(minutes=settings.access_token_expire_minutes)
        )
        db.add(sesion)
        
        # Log audit
        AuditService.log_login(db, user.id, ip)
        
        db.commit()
        
        return access_token, refresh_token
    
    @staticmethod
    def logout(db: Session, token: str, user_id: int, ip: str = None):
        # Delete session
        db.query(Sesion).filter(Sesion.token == token).delete()
        
        # Log audit
        AuditService.log_logout(db, user_id, ip)
        
        db.commit()
    
    @staticmethod
    def logout_all(db: Session, user_id: int, ip: str = None):
        # Delete all sessions for user
        db.query(Sesion).filter(Sesion.usuario_id == user_id).delete()
        
        # Log audit
        AuditService.log(db, user_id, "logout_all", "auth", ip=ip)
        
        db.commit()
    
    @staticmethod
    def refresh_access_token(db: Session, refresh_token: str) -> str:
        payload = verify_token(refresh_token, "refresh")
        if not payload:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid refresh token"
            )
        
        username = payload.get("sub")
        user_id = payload.get("user_id")
        
        # Create new access token
        new_access_token = create_access_token(data={"sub": username, "user_id": user_id})
        
        # Create new session
        sesion = Sesion(
            usuario_id=user_id,
            token=new_access_token,
            fecha_expiracion=datetime.utcnow() + timedelta(minutes=settings.access_token_expire_minutes)
        )
        db.add(sesion)
        db.commit()
        
        return new_access_token
    
    @staticmethod
    def change_password(db: Session, user: Usuario, old_password: str, new_password: str, ip: str = None):
        if not verify_password(old_password, user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Incorrect old password"
            )
        
        # Validate new password strength (RN-AUTH-005)
        is_valid, error_message = PasswordService.validate_password_strength(new_password)
        if not is_valid:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=error_message
            )
        
        # Update password
        user.password_hash = PasswordService.hash_password(new_password)
        
        # Invalidate all sessions (RN-AUTH-007)
        db.query(Sesion).filter(Sesion.usuario_id == user.id).delete()
        
        # Log audit
        AuditService.log_password_change(db, user.id, ip)
        
        db.commit()
