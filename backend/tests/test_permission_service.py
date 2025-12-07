"""
Pruebas unitarias para el servicio de permisos (PermissionService)
"""
import pytest
from app.services.permission_service import PermissionService
from app.models.auth import Permiso, RolPermiso


class TestPermissionService:
    """Pruebas para PermissionService"""
    
    def test_get_user_permissions(self, db_session, admin_user, permissions):
        """Prueba obtención de permisos de usuario"""
        permisos = PermissionService.get_user_permissions(db_session, admin_user.id)
        
        assert len(permisos) == len(permissions)
        assert "usuarios.crear" in permisos
        assert "usuarios.leer" in permisos
    
    def test_get_user_permissions_nonexistent_user(self, db_session):
        """Prueba obtención de permisos de usuario inexistente"""
        permisos = PermissionService.get_user_permissions(db_session, 99999)
        assert permisos == []
    
    def test_user_has_permission_true(self, db_session, admin_user, permissions):
        """Prueba verificación de permiso existente"""
        has_permission = PermissionService.user_has_permission(
            db_session, 
            admin_user.id, 
            "usuarios.crear"
        )
        assert has_permission is True
    
    def test_user_has_permission_false(self, db_session, normal_user):
        """Prueba verificación de permiso no existente"""
        has_permission = PermissionService.user_has_permission(
            db_session, 
            normal_user.id, 
            "usuarios.crear"
        )
        assert has_permission is False
    
    def test_user_has_any_permission_true(self, db_session, admin_user, permissions):
        """Prueba verificación de al menos un permiso"""
        has_any = PermissionService.user_has_any_permission(
            db_session,
            admin_user.id,
            ["usuarios.crear", "nonexistent.permission"]
        )
        assert has_any is True
    
    def test_user_has_any_permission_false(self, db_session, normal_user):
        """Prueba verificación cuando no tiene ningún permiso"""
        has_any = PermissionService.user_has_any_permission(
            db_session,
            normal_user.id,
            ["usuarios.crear", "usuarios.eliminar"]
        )
        assert has_any is False
    
    def test_user_has_all_permissions_true(self, db_session, admin_user, permissions):
        """Prueba verificación de todos los permisos"""
        has_all = PermissionService.user_has_all_permissions(
            db_session,
            admin_user.id,
            ["usuarios.crear", "usuarios.leer"]
        )
        assert has_all is True
    
    def test_user_has_all_permissions_false(self, db_session, admin_user, permissions):
        """Prueba verificación cuando no tiene todos los permisos"""
        has_all = PermissionService.user_has_all_permissions(
            db_session,
            admin_user.id,
            ["usuarios.crear", "nonexistent.permission"]
        )
        assert has_all is False
    
    def test_get_role_permissions(self, db_session, admin_role, permissions):
        """Prueba obtención de permisos de un rol"""
        permisos = PermissionService.get_role_permissions(db_session, admin_role.id)
        
        assert len(permisos) == len(permissions)
        assert all(isinstance(p, Permiso) for p in permisos)
    
    def test_assign_permissions_to_role(self, db_session, user_role, permissions):
        """Prueba asignación de permisos a un rol"""
        permission_ids = [p.id for p in permissions[:3]]
        
        result = PermissionService.assign_permissions_to_role(
            db_session,
            user_role.id,
            permission_ids
        )
        
        assert result is True
        
        # Verificar que se asignaron los permisos
        assigned = db_session.query(RolPermiso).filter(
            RolPermiso.rol_id == user_role.id
        ).all()
        assert len(assigned) == 3
    
    def test_assign_permissions_replaces_existing(self, db_session, admin_role, permissions):
        """Prueba que asignar permisos reemplaza los existentes"""
        # Asignar solo 2 permisos
        new_permission_ids = [permissions[0].id, permissions[1].id]
        
        PermissionService.assign_permissions_to_role(
            db_session,
            admin_role.id,
            new_permission_ids
        )
        
        # Verificar que solo quedan 2 permisos
        assigned = db_session.query(RolPermiso).filter(
            RolPermiso.rol_id == admin_role.id
        ).all()
        assert len(assigned) == 2
