"""
Pruebas de integración para los endpoints de roles y permisos
"""
import pytest


class TestRoleEndpoints:
    """Pruebas de integración para endpoints de roles"""
    
    def test_list_roles(self, client, admin_role, user_role, active_session, admin_headers):
        """Prueba listar roles"""
        response = client.get("/api/roles", headers=admin_headers)
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 2
    
    def test_get_role_by_id(self, client, admin_role, active_session, admin_headers):
        """Prueba obtener rol por ID"""
        response = client.get(f"/api/roles/{admin_role.id}", headers=admin_headers)
        
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == admin_role.id
        assert data["nombre"] == "Administrador"
    
    def test_get_nonexistent_role(self, client, active_session, admin_headers):
        """Prueba obtener rol inexistente"""
        response = client.get("/api/roles/99999", headers=admin_headers)
        assert response.status_code == 404
    
    def test_create_role(self, client, active_session, admin_headers):
        """Prueba crear rol"""
        response = client.post(
            "/api/roles",
            headers=admin_headers,
            json={
                "nombre": "Supervisor",
                "descripcion": "Rol de supervisor",
                "es_sistema": False
            }
        )
        
        assert response.status_code == 201
        data = response.json()
        assert data["nombre"] == "Supervisor"
        assert data["es_sistema"] is False
    
    def test_create_role_duplicate_name(self, client, admin_role, active_session, admin_headers):
        """Prueba crear rol con nombre duplicado"""
        response = client.post(
            "/api/roles",
            headers=admin_headers,
            json={
                "nombre": "Administrador",  # Ya existe
                "descripcion": "Otro admin"
            }
        )
        
        assert response.status_code == 400
    
    def test_update_role(self, client, user_role, active_session, admin_headers):
        """Prueba actualizar rol"""
        response = client.put(
            f"/api/roles/{user_role.id}",
            headers=admin_headers,
            json={
                "nombre": "Usuario Actualizado",
                "descripcion": "Descripción actualizada"
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["nombre"] == "Usuario Actualizado"
    
    def test_delete_role(self, client, user_role, active_session, admin_headers):
        """Prueba eliminar rol"""
        response = client.delete(
            f"/api/roles/{user_role.id}",
            headers=admin_headers
        )
        
        assert response.status_code == 200
    
    def test_delete_system_role(self, client, admin_role, active_session, admin_headers):
        """Prueba RN-AUTH-003: No se puede eliminar rol de sistema"""
        response = client.delete(
            f"/api/roles/{admin_role.id}",
            headers=admin_headers
        )
        
        assert response.status_code == 400
        assert "sistema" in response.json()["detail"].lower()
    
    def test_assign_permissions_to_role(self, client, user_role, permissions, active_session, admin_headers):
        """Prueba asignar permisos a rol"""
        permission_ids = [p.id for p in permissions[:3]]
        
        response = client.put(
            f"/api/roles/{user_role.id}/permisos",
            headers=admin_headers,
            json={"permiso_ids": permission_ids}
        )
        
        assert response.status_code == 200


class TestPermissionEndpoints:
    """Pruebas de integración para endpoints de permisos"""
    
    def test_list_permissions(self, client, permissions, active_session, admin_headers):
        """Prueba listar permisos"""
        response = client.get("/api/permisos", headers=admin_headers)
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= len(permissions)
    
    def test_get_permission_by_id(self, client, permissions, active_session, admin_headers):
        """Prueba obtener permiso por ID"""
        permiso = permissions[0]
        response = client.get(f"/api/permisos/{permiso.id}", headers=admin_headers)
        
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == permiso.id
        assert data["codigo"] == permiso.codigo
    
    def test_create_permission(self, client, active_session, admin_headers):
        """Prueba crear permiso"""
        response = client.post(
            "/api/permisos",
            headers=admin_headers,
            json={
                "codigo": "test.permiso",
                "nombre": "Test Permiso",
                "modulo": "test",
                "descripcion": "Permiso de prueba"
            }
        )
        
        assert response.status_code == 201
        data = response.json()
        assert data["codigo"] == "test.permiso"
    
    def test_create_permission_duplicate_code(self, client, permissions, active_session, admin_headers):
        """Prueba crear permiso con código duplicado"""
        response = client.post(
            "/api/permisos",
            headers=admin_headers,
            json={
                "codigo": "usuarios.crear",  # Ya existe
                "nombre": "Otro permiso",
                "modulo": "test"
            }
        )
        
        assert response.status_code == 400
    
    def test_update_permission(self, client, permissions, active_session, admin_headers):
        """Prueba actualizar permiso"""
        permiso = permissions[0]
        response = client.put(
            f"/api/permisos/{permiso.id}",
            headers=admin_headers,
            json={
                "nombre": "Nombre Actualizado",
                "descripcion": "Descripción actualizada"
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["nombre"] == "Nombre Actualizado"
    
    def test_delete_permission(self, client, permissions, active_session, admin_headers):
        """Prueba eliminar permiso"""
        # Crear un permiso temporal para eliminar
        response = client.post(
            "/api/permisos",
            headers=admin_headers,
            json={
                "codigo": "temp.delete",
                "nombre": "Temp Delete",
                "modulo": "temp"
            }
        )
        permiso_id = response.json()["id"]
        
        response = client.delete(
            f"/api/permisos/{permiso_id}",
            headers=admin_headers
        )
        
        assert response.status_code == 200
