"""
Pruebas de integración para los endpoints de autenticación
"""
import pytest
from datetime import datetime, timedelta


class TestAuthEndpoints:
    """Pruebas de integración para endpoints de autenticación"""
    
    def test_login_success(self, client, admin_user):
        """Prueba login exitoso"""
        response = client.post(
            "/api/auth/login",
            data={
                "username": "admin_test",
                "password": "Admin123!@#"
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert "refresh_token" in data
        assert data["token_type"] == "bearer"
    
    def test_login_wrong_password(self, client, admin_user):
        """Prueba login con contraseña incorrecta"""
        response = client.post(
            "/api/auth/login",
            data={
                "username": "admin_test",
                "password": "WrongPassword"
            }
        )
        
        assert response.status_code == 401
    
    def test_login_nonexistent_user(self, client):
        """Prueba login con usuario inexistente"""
        response = client.post(
            "/api/auth/login",
            data={
                "username": "nonexistent",
                "password": "Password123!"
            }
        )
        
        assert response.status_code == 401
    
    def test_login_blocked_user(self, client, blocked_user):
        """Prueba login con usuario bloqueado"""
        response = client.post(
            "/api/auth/login",
            data={
                "username": "blocked_test",
                "password": "Blocked123!@#"
            }
        )
        
        assert response.status_code == 403
        assert "blocked" in response.json()["detail"].lower()
    
    def test_brute_force_protection_endpoint(self, client, admin_user):
        """Prueba RN-AUTH-001: Protección contra fuerza bruta en endpoint"""
        # Realizar 5 intentos fallidos
        for i in range(5):
            response = client.post(
                "/api/auth/login",
                data={
                    "username": "admin_test",
                    "password": "WrongPassword"
                }
            )
            assert response.status_code == 401
        
        # El 6to intento debe ser bloqueado
        response = client.post(
            "/api/auth/login",
            data={
                "username": "admin_test",
                "password": "Admin123!@#"
            }
        )
        assert response.status_code == 403
    
    def test_logout(self, client, admin_user, active_session, admin_headers):
        """Prueba logout exitoso"""
        response = client.post(
            "/api/auth/logout",
            headers=admin_headers
        )
        
        assert response.status_code == 200
        assert "logged out" in response.json()["message"].lower()
    
    def test_logout_without_auth(self, client):
        """Prueba logout sin autenticación"""
        response = client.post("/api/auth/logout")
        assert response.status_code == 401
    
    def test_logout_all(self, client, admin_user, active_session, admin_headers):
        """Prueba cierre de todas las sesiones"""
        response = client.post(
            "/api/auth/logout-all",
            headers=admin_headers
        )
        
        assert response.status_code == 200
        assert "sessions closed" in response.json()["message"].lower()
    
    def test_change_password_success(self, client, admin_user, active_session, admin_headers):
        """Prueba cambio de contraseña exitoso"""
        response = client.put(
            "/api/auth/change-password",
            headers=admin_headers,
            json={
                "old_password": "Admin123!@#",
                "new_password": "NewPassword123!@#"
            }
        )
        
        assert response.status_code == 200
        assert "changed" in response.json()["message"].lower()
    
    def test_change_password_wrong_old(self, client, admin_user, active_session, admin_headers):
        """Prueba cambio de contraseña con contraseña antigua incorrecta"""
        response = client.put(
            "/api/auth/change-password",
            headers=admin_headers,
            json={
                "old_password": "WrongPassword",
                "new_password": "NewPassword123!@#"
            }
        )
        
        assert response.status_code == 400
    
    def test_change_password_weak_new(self, client, admin_user, active_session, admin_headers):
        """Prueba RN-AUTH-005: Rechazo de contraseña débil en endpoint"""
        response = client.put(
            "/api/auth/change-password",
            headers=admin_headers,
            json={
                "old_password": "Admin123!@#",
                "new_password": "weak"
            }
        )
        
        assert response.status_code == 400
    
    def test_protected_endpoint_without_token(self, client):
        """Prueba acceso a endpoint protegido sin token"""
        response = client.get("/api/usuarios/me")
        assert response.status_code == 401
    
    def test_protected_endpoint_with_token(self, client, admin_user, active_session, admin_headers):
        """Prueba acceso a endpoint protegido con token válido"""
        response = client.get("/api/usuarios/me", headers=admin_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["username"] == "admin_test"
    
    def test_protected_endpoint_invalid_token(self, client):
        """Prueba acceso con token inválido"""
        headers = {"Authorization": "Bearer invalid_token"}
        response = client.get("/api/usuarios/me", headers=headers)
        assert response.status_code == 401
