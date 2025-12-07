"""
Pruebas unitarias para el servicio de contraseñas (PasswordService)
"""
import pytest
from app.services.password_service import PasswordService


class TestPasswordService:
    """Pruebas para PasswordService"""
    
    def test_validate_password_strength_valid(self):
        """Prueba RN-AUTH-005: Contraseña válida"""
        is_valid, message = PasswordService.validate_password_strength("Test123!@#")
        assert is_valid is True
        assert message is None
    
    def test_validate_password_too_short(self):
        """Prueba rechazo de contraseña corta (< 8 caracteres)"""
        is_valid, message = PasswordService.validate_password_strength("Test1!")
        assert is_valid is False
        assert "at least 8 characters" in message
    
    def test_validate_password_no_uppercase(self):
        """Prueba rechazo de contraseña sin mayúsculas"""
        is_valid, message = PasswordService.validate_password_strength("test123!@#")
        assert is_valid is False
        assert "uppercase letter" in message
    
    def test_validate_password_no_lowercase(self):
        """Prueba rechazo de contraseña sin minúsculas"""
        is_valid, message = PasswordService.validate_password_strength("TEST123!@#")
        assert is_valid is False
        assert "lowercase letter" in message
    
    def test_validate_password_no_digit(self):
        """Prueba rechazo de contraseña sin números"""
        is_valid, message = PasswordService.validate_password_strength("TestTest!@#")
        assert is_valid is False
        assert "number" in message
    
    def test_validate_password_no_special_char(self):
        """Prueba rechazo de contraseña sin caracteres especiales"""
        is_valid, message = PasswordService.validate_password_strength("Test1234")
        assert is_valid is False
        assert "special character" in message
    
    def test_hash_password(self):
        """Prueba hash de contraseña"""
        password = "Test123!@#"
        hashed = PasswordService.hash_password(password)
        
        assert hashed is not None
        assert hashed != password
        assert len(hashed) > 0
    
    def test_hash_password_different_hashes(self):
        """Prueba que el mismo password genera diferentes hashes (salt)"""
        password = "Test123!@#"
        hash1 = PasswordService.hash_password(password)
        hash2 = PasswordService.hash_password(password)
        
        # Los hashes deben ser diferentes debido al salt
        assert hash1 != hash2
    
    def test_verify_password_correct(self):
        """Prueba verificación de contraseña correcta"""
        from app.utils.security import verify_password
        
        password = "Test123!@#"
        hashed = PasswordService.hash_password(password)
        
        assert verify_password(password, hashed) is True
    
    def test_verify_password_incorrect(self):
        """Prueba verificación de contraseña incorrecta"""
        from app.utils.security import verify_password
        
        password = "Test123!@#"
        hashed = PasswordService.hash_password(password)
        
        assert verify_password("WrongPassword", hashed) is False
