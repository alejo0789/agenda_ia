from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from ..models import Usuario, Rol, Permiso, RolPermiso
from ..schemas import auth as schemas
from ..services.auth_service import AuthService
from ..services.password_service import PasswordService
from ..dependencies import get_current_user, oauth2_scheme

router = APIRouter(
    prefix="/api/auth",
    tags=["autenticación"],
)

@router.post("/login", response_model=schemas.Token)
def login(
    request: Request,
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    user = AuthService.authenticate_user(
        db, 
        form_data.username, 
        form_data.password,
        ip=request.client.host if request.client else None
    )
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token, refresh_token = AuthService.create_session(
        db, 
        user,
        ip=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent")
    )
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer"
    }

@router.post("/refresh", response_model=dict)
def refresh_token(
    refresh_token: str,
    db: Session = Depends(get_db)
):
    new_access_token = AuthService.refresh_access_token(db, refresh_token)
    return {"access_token": new_access_token, "token_type": "bearer"}

@router.post("/logout")
def logout(
    request: Request,
    token: str = Depends(oauth2_scheme),
    current_user: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    AuthService.logout(
        db, 
        token, 
        current_user.id,
        ip=request.client.host if request.client else None
    )
    return {"message": "Successfully logged out"}

@router.post("/logout-all")
def logout_all(
    request: Request,
    current_user: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    AuthService.logout_all(
        db, 
        current_user.id,
        ip=request.client.host if request.client else None
    )
    return {"message": "All sessions closed successfully"}

@router.put("/change-password")
def change_password(
    request: Request,
    password_data: schemas.ChangePasswordRequest,
    current_user: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    AuthService.change_password(
        db,
        current_user,
        password_data.old_password,
        password_data.new_password,
        ip=request.client.host if request.client else None
    )
    return {"message": "Password changed successfully"}

@router.post("/forgot-password")
def forgot_password(
    password_data: schemas.ForgotPasswordRequest,
    db: Session = Depends(get_db)
):
    # TODO: Implement email sending with reset token
    # For now, just return a message
    user = db.query(Usuario).filter(Usuario.email == password_data.email).first()
    if not user:
        # Don't reveal if email exists or not
        return {"message": "If the email exists, a reset link will be sent"}
    
    # TODO: Generate reset token and send email
    return {"message": "If the email exists, a reset link will be sent"}

@router.post("/reset-password")
def reset_password(
    password_data: schemas.ResetPasswordRequest,
    db: Session = Depends(get_db)
):
    # TODO: Implement password reset with token validation
    return {"message": "Password reset functionality will be implemented"}

@router.post("/check-first-access")
def check_first_access(
    data: schemas.CheckFirstAccessRequest,
    db: Session = Depends(get_db)
):
    from sqlalchemy import func
    user = db.query(Usuario).filter(func.lower(Usuario.username) == func.lower(data.username)).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    
    return {
        "is_first_access": user.primer_acceso,
        "user_id": user.id
    }

@router.post("/setup-password")
def setup_password(
    data: schemas.SetupPasswordRequest,
    db: Session = Depends(get_db)
    # request: Request, # Podríamos auto-logear, pero por seguridad mejor que haga login normal
):
    from sqlalchemy import func
    user = db.query(Usuario).filter(func.lower(Usuario.username) == func.lower(data.username)).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    
    if not user.primer_acceso:
        raise HTTPException(status_code=400, detail="El usuario ya ha configurado su contraseña")
        
    # Validate password strength (RN-AUTH-005)
    is_valid, error_message = PasswordService.validate_password_strength(data.new_password)
    if not is_valid:
        raise HTTPException(status_code=400, detail=error_message)
        
    user.password_hash = PasswordService.hash_password(data.new_password)
    user.primer_acceso = False
    user.estado = "activo" # Asegurar que esté activo
    
    db.commit()
    return {"message": "Contraseña configurada exitosamente. Ahora puede iniciar sesión."}

