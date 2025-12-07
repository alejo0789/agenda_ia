import re
from typing import Optional
from ..utils.security import get_password_hash, verify_password

class PasswordService:
    """Servicio para gestión de contraseñas"""
    
    @staticmethod
    def validate_password_strength(password: str) -> tuple[bool, Optional[str]]:
        """
        Valida que la contraseña cumpla con los requisitos de seguridad.
        RN-AUTH-005: Contraseña mínimo 8 caracteres con mayúscula, número y especial
        
        Returns:
            tuple[bool, Optional[str]]: (es_valida, mensaje_error)
        """
        if len(password) < 8:
            return False, "Password must be at least 8 characters long"
        
        if not re.search(r'[A-Z]', password):
            return False, "Password must contain at least one uppercase letter"
        
        if not re.search(r'[a-z]', password):
            return False, "Password must contain at least one lowercase letter"
        
        if not re.search(r'\d', password):
            return False, "Password must contain at least one number"
        
        if not re.search(r'[!@#$%^&*(),.?":{}|<>]', password):
            return False, "Password must contain at least one special character"
        
        return True, None
    
    @staticmethod
    def hash_password(password: str) -> str:
        """Hash a password using bcrypt"""
        return get_password_hash(password)
    
    @staticmethod
    def verify_password(plain_password: str, hashed_password: str) -> bool:
        """Verify a password against a hash"""
        return verify_password(plain_password, hashed_password)
    
    @staticmethod
    def generate_reset_token() -> str:
        """Generate a password reset token"""
        import secrets
        return secrets.token_urlsafe(32)
