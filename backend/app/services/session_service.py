from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import List, Optional
from ..models.auth import Sesion
from ..models.user import Usuario

class SessionService:
    """Servicio para control de sesiones activas"""
    
    @staticmethod
    def get_active_sessions(db: Session, user_id: int) -> List[Sesion]:
        """Obtener todas las sesiones activas de un usuario"""
        return db.query(Sesion).filter(
            Sesion.usuario_id == user_id,
            Sesion.fecha_expiracion > datetime.utcnow()
        ).all()
    
    @staticmethod
    def get_session_by_token(db: Session, token: str) -> Optional[Sesion]:
        """Obtener sesión por token"""
        return db.query(Sesion).filter(
            Sesion.token == token,
            Sesion.fecha_expiracion > datetime.utcnow()
        ).first()
    
    @staticmethod
    def invalidate_session(db: Session, token: str) -> bool:
        """Invalidar una sesión específica"""
        result = db.query(Sesion).filter(Sesion.token == token).delete()
        db.commit()
        return result > 0
    
    @staticmethod
    def invalidate_all_sessions(db: Session, user_id: int) -> int:
        """Invalidar todas las sesiones de un usuario"""
        result = db.query(Sesion).filter(Sesion.usuario_id == user_id).delete()
        db.commit()
        return result
    
    @staticmethod
    def cleanup_expired_sessions(db: Session) -> int:
        """Limpiar sesiones expiradas"""
        result = db.query(Sesion).filter(
            Sesion.fecha_expiracion <= datetime.utcnow()
        ).delete()
        db.commit()
        return result
    
    @staticmethod
    def get_session_count(db: Session, user_id: int) -> int:
        """Contar sesiones activas de un usuario"""
        return db.query(Sesion).filter(
            Sesion.usuario_id == user_id,
            Sesion.fecha_expiracion > datetime.utcnow()
        ).count()
