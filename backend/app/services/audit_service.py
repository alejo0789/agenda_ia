from sqlalchemy.orm import Session
from datetime import datetime
from typing import Optional, Dict, Any
from ..models.auth import LogAuditoria

class AuditService:
    """Servicio para registro de auditoría"""
    
    @staticmethod
    def log(
        db: Session,
        usuario_id: Optional[int],
        accion: str,
        modulo: str,
        entidad: Optional[str] = None,
        entidad_id: Optional[int] = None,
        datos_anteriores: Optional[Dict[str, Any]] = None,
        datos_nuevos: Optional[Dict[str, Any]] = None,
        ip: Optional[str] = None
    ) -> LogAuditoria:
        """
        Registrar una acción en el log de auditoría.
        RN-AUTH-006: Registrar en auditoría: login, logout, cambios críticos
        """
        log = LogAuditoria(
            usuario_id=usuario_id,
            accion=accion,
            modulo=modulo,
            entidad=entidad,
            entidad_id=entidad_id,
            datos_anteriores=datos_anteriores,
            datos_nuevos=datos_nuevos,
            ip=ip
        )
        db.add(log)
        db.commit()
        db.refresh(log)
        return log
    
    @staticmethod
    def log_login(db: Session, usuario_id: int, ip: Optional[str] = None):
        """Registrar inicio de sesión"""
        return AuditService.log(
            db=db,
            usuario_id=usuario_id,
            accion="login",
            modulo="auth",
            ip=ip
        )
    
    @staticmethod
    def log_logout(db: Session, usuario_id: int, ip: Optional[str] = None):
        """Registrar cierre de sesión"""
        return AuditService.log(
            db=db,
            usuario_id=usuario_id,
            accion="logout",
            modulo="auth",
            ip=ip
        )
    
    @staticmethod
    def log_password_change(db: Session, usuario_id: int, ip: Optional[str] = None):
        """Registrar cambio de contraseña"""
        return AuditService.log(
            db=db,
            usuario_id=usuario_id,
            accion="cambio_password",
            modulo="auth",
            ip=ip
        )
    
    @staticmethod
    def log_user_blocked(db: Session, usuario_id: int, motivo: str, ip: Optional[str] = None):
        """Registrar bloqueo de usuario"""
        return AuditService.log(
            db=db,
            usuario_id=usuario_id,
            accion="bloqueo_usuario",
            modulo="auth",
            datos_nuevos={"motivo": motivo},
            ip=ip
        )
    
    @staticmethod
    def log_create(db: Session, usuario_id: int, modulo: str, entidad: str, 
                   entidad_id: int, datos: Dict[str, Any], ip: Optional[str] = None):
        """Registrar creación de entidad"""
        return AuditService.log(
            db=db,
            usuario_id=usuario_id,
            accion="crear",
            modulo=modulo,
            entidad=entidad,
            entidad_id=entidad_id,
            datos_nuevos=datos,
            ip=ip
        )
    
    @staticmethod
    def log_update(db: Session, usuario_id: int, modulo: str, entidad: str,
                   entidad_id: int, datos_anteriores: Dict[str, Any], 
                   datos_nuevos: Dict[str, Any], ip: Optional[str] = None):
        """Registrar actualización de entidad"""
        return AuditService.log(
            db=db,
            usuario_id=usuario_id,
            accion="actualizar",
            modulo=modulo,
            entidad=entidad,
            entidad_id=entidad_id,
            datos_anteriores=datos_anteriores,
            datos_nuevos=datos_nuevos,
            ip=ip
        )
    
    @staticmethod
    def log_delete(db: Session, usuario_id: int, modulo: str, entidad: str,
                   entidad_id: int, datos: Dict[str, Any], ip: Optional[str] = None):
        """Registrar eliminación de entidad"""
        return AuditService.log(
            db=db,
            usuario_id=usuario_id,
            accion="eliminar",
            modulo=modulo,
            entidad=entidad,
            entidad_id=entidad_id,
            datos_anteriores=datos,
            ip=ip
        )
    
    @staticmethod
    def get_user_logs(db: Session, usuario_id: int, limit: int = 100):
        """Obtener logs de un usuario"""
        return db.query(LogAuditoria).filter(
            LogAuditoria.usuario_id == usuario_id
        ).order_by(LogAuditoria.fecha.desc()).limit(limit).all()
    
    @staticmethod
    def get_entity_logs(db: Session, entidad: str, entidad_id: int, limit: int = 100):
        """Obtener logs de una entidad específica"""
        return db.query(LogAuditoria).filter(
            LogAuditoria.entidad == entidad,
            LogAuditoria.entidad_id == entidad_id
        ).order_by(LogAuditoria.fecha.desc()).limit(limit).all()
