from sqlalchemy.orm import Session
from typing import List, Optional
from ..models.user import Usuario, Rol
from ..models.auth import Permiso, RolPermiso

class PermissionService:
    """Servicio para verificación de permisos"""
    
    @staticmethod
    def get_user_permissions(db: Session, user_id: int) -> List[str]:
        """Obtener todos los códigos de permisos de un usuario"""
        user = db.query(Usuario).filter(Usuario.id == user_id).first()
        if not user:
            return []
        
        # Get permissions through role
        permisos = db.query(Permiso).join(
            RolPermiso, RolPermiso.permiso_id == Permiso.id
        ).filter(
            RolPermiso.rol_id == user.rol_id
        ).all()
        
        return [p.codigo for p in permisos]
    
    @staticmethod
    def user_has_permission(db: Session, user_id: int, permission_code: str) -> bool:
        """Verificar si un usuario tiene un permiso específico"""
        permissions = PermissionService.get_user_permissions(db, user_id)
        return permission_code in permissions
    
    @staticmethod
    def user_has_any_permission(db: Session, user_id: int, permission_codes: List[str]) -> bool:
        """Verificar si un usuario tiene al menos uno de los permisos especificados"""
        permissions = PermissionService.get_user_permissions(db, user_id)
        return any(code in permissions for code in permission_codes)
    
    @staticmethod
    def user_has_all_permissions(db: Session, user_id: int, permission_codes: List[str]) -> bool:
        """Verificar si un usuario tiene todos los permisos especificados"""
        permissions = PermissionService.get_user_permissions(db, user_id)
        return all(code in permissions for code in permission_codes)
    
    @staticmethod
    def get_role_permissions(db: Session, rol_id: int) -> List[Permiso]:
        """Obtener todos los permisos de un rol"""
        return db.query(Permiso).join(
            RolPermiso, RolPermiso.permiso_id == Permiso.id
        ).filter(
            RolPermiso.rol_id == rol_id
        ).all()
    
    @staticmethod
    def assign_permissions_to_role(db: Session, rol_id: int, permission_ids: List[int]) -> bool:
        """Asignar permisos a un rol"""
        # Delete existing permissions
        db.query(RolPermiso).filter(RolPermiso.rol_id == rol_id).delete()
        
        # Add new permissions
        for permission_id in permission_ids:
            rol_permiso = RolPermiso(rol_id=rol_id, permiso_id=permission_id)
            db.add(rol_permiso)
        
        db.commit()
        return True
