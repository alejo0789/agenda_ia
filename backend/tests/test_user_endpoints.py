"""
Pruebas de integración para los endpoints de usuarios
"""
import pytest


class TestUserEndpoints:
    """Pruebas de integración para endpoints de usuarios"""
    
    def test_get_current_user(self, client, admin_user, active_session, admin_headers):
        """Prueba obtener usuario actual (me)"""
        response = client.get("/api/usuarios/me", headers=admin_headers)
        
        assert response.status_code == 200
        data = response.json()
        assert data["username"] == "admin_test"
        assert data["email"] == "admin@test.com"
        assert "password_hash" not in data
    
    def test_list_users(self, client, admin_user, normal_user, active_session, admin_headers):
        """Prueba listar usuarios"""
        response = client.get("/api/usuarios", headers=admin_headers)
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 2
    
    def test_get_user_by_id(self, client, admin_user, active_session, admin_headers):
        """Prueba obtener usuario por ID"""
        response = client.get(f"/api/usuarios/{admin_user.id}", headers=admin_headers)
        
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == admin_user.id
        assert data["username"] == "admin_test"
    
    def test_get_nonexistent_user(self, client, active_session, admin_headers):
        """Prueba obtener usuario inexistente"""
        response = client.get("/api/usuarios/99999", headers=admin_headers)
        assert response.status_code == 404
    
    def test_create_user_success(self, client, admin_role, active_session, admin_headers):
        """Prueba crear usuario exitosamente"""
        response = client.post(
            "/api/usuarios",
            headers=admin_headers,
            json={
                "username": "newuser",
                "email": "newuser@test.com",
                "nombre": "New User",
                "password": "NewUser123!@#",
                "rol_id": admin_role.id
            }
        )
        
        assert response.status_code == 201
        data = response.json()
        assert data["username"] == "newuser"
        assert data["email"] == "newuser@test.com"
    
    def test_create_user_weak_password(self, client, admin_role, active_session, admin_headers):
        """Prueba RN-AUTH-005: Rechazo de contraseña débil al crear usuario"""
        response = client.post(
            "/api/usuarios",
            headers=admin_headers,
            json={
                "username": "weakuser",
                "email": "weak@test.com",
                "nombre": "Weak User",
                "password": "weak",
                "rol_id": admin_role.id
            }
        )
        
        assert response.status_code == 400
    
    def test_create_user_duplicate_username(self, client, admin_user, admin_role, active_session, admin_headers):
        """Prueba crear usuario con username duplicado"""
        response = client.post(
            "/api/usuarios",
            headers=admin_headers,
            json={
                "username": "admin_test",  # Ya existe
                "email": "another@test.com",
                "nombre": "Another User",
                "password": "Password123!@#",
                "rol_id": admin_role.id
            }
        )
        
        assert response.status_code == 400
    
    def test_create_user_duplicate_email(self, client, admin_user, admin_role, active_session, admin_headers):
        """Prueba crear usuario con email duplicado"""
        response = client.post(
            "/api/usuarios",
            headers=admin_headers,
            json={
                "username": "anotheruser",
                "email": "admin@test.com",  # Ya existe
                "nombre": "Another User",
                "password": "Password123!@#",
                "rol_id": admin_role.id
            }
        )
        
        assert response.status_code == 400
    
    def test_update_user(self, client, normal_user, active_session, admin_headers):
        """Prueba actualizar usuario"""
        response = client.put(
            f"/api/usuarios/{normal_user.id}",
            headers=admin_headers,
            json={
                "nombre": "Updated Name",
                "email": "updated@test.com"
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["nombre"] == "Updated Name"
        assert data["email"] == "updated@test.com"
    
    def test_update_user_me(self, client, admin_user, active_session, admin_headers):
        """Prueba actualizar perfil propio"""
        response = client.put(
            "/api/usuarios/me",
            headers=admin_headers,
            json={
                "nombre": "Updated Admin Name",
                "email": "updated_admin@test.com"
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["nombre"] == "Updated Admin Name"
    
    def test_delete_user(self, client, normal_user, active_session, admin_headers):
        """Prueba eliminar usuario"""
        response = client.delete(
            f"/api/usuarios/{normal_user.id}",
            headers=admin_headers
        )
        
        assert response.status_code == 200
    
    def test_change_user_status(self, client, normal_user, active_session, admin_headers):
        """Prueba cambiar estado de usuario"""
        response = client.put(
            f"/api/usuarios/{normal_user.id}/estado",
            headers=admin_headers,
            json={"estado": "inactivo"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["estado"] == "inactivo"
    
    def test_unauthorized_access(self, client):
        """Prueba acceso sin autenticación"""
        response = client.get("/api/usuarios")
        assert response.status_code == 401
