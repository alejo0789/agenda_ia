from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from .database import get_db
from .models import Usuario, Sesion
from .utils.jwt import verify_token
from .services.permission_service import PermissionService
from datetime import datetime

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> Usuario:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    payload = verify_token(token, "access")
    if payload is None:
        raise credentials_exception
    
    username: str = payload.get("sub")
    if username is None:
        raise credentials_exception
    
    # Verify session exists and is not expired
    sesion = db.query(Sesion).filter(
        Sesion.token == token,
        Sesion.fecha_expiracion > datetime.utcnow()
    ).first()
    
    if not sesion:
        raise credentials_exception
    
    user = db.query(Usuario).filter(Usuario.username == username).first()
    if user is None:
        raise credentials_exception
    
    if user.estado != "activo":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive"
        )
    
    return user

async def get_current_active_user(
    current_user: Usuario = Depends(get_current_user)
) -> Usuario:
    if current_user.estado != "activo":
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user


def require_permission(permission_code: str):
    """
    Dependency to check if current user has a specific permission
    Usage: Depends(require_permission("especialistas.ver"))
    """
    async def permission_checker(
        current_user: Usuario = Depends(get_current_user),
        db: Session = Depends(get_db)
    ):
        has_permission = PermissionService.user_has_permission(
            db, current_user.id, permission_code
        )
        
        if not has_permission:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"No tiene permiso para realizar esta acción: {permission_code}"
            )
        
        return {"user": current_user, "permission": permission_code}
    
    return permission_checker
