from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from ..models import user as models
from ..schemas import user as schemas
from ..utils import security
from ..dependencies import get_current_user
from ..services.password_service import PasswordService

router = APIRouter(
    prefix="/api/usuarios",
    tags=["usuarios"],
    responses={404: {"description": "Not found"}},
)

@router.post("/", response_model=schemas.UserResponse, status_code=status.HTTP_201_CREATED)
def create_user(
    user: schemas.UserCreate, 
    db: Session = Depends(get_db),
    current_user: models.Usuario = Depends(get_current_user)
):
    db_user = db.query(models.Usuario).filter(models.Usuario.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    db_username = db.query(models.Usuario).filter(models.Usuario.username == user.username).first()
    if db_username:
        raise HTTPException(status_code=400, detail="Username already registered")

    # Validate password strength (RN-AUTH-005)
    is_valid, error_message = PasswordService.validate_password_strength(user.password)
    if not is_valid:
        raise HTTPException(status_code=400, detail=error_message)

    hashed_password = PasswordService.hash_password(user.password)
    db_user = models.Usuario(
        username=user.username,
        email=user.email,
        password_hash=hashed_password,
        nombre=user.nombre,
        rol_id=user.rol_id,
        estado=user.estado
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

@router.get("/", response_model=List[schemas.UserResponse])
def read_users(
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db),
    current_user: models.Usuario = Depends(get_current_user)
):
    users = db.query(models.Usuario).offset(skip).limit(limit).all()
    return users

@router.get("/me", response_model=schemas.UserResponse)
def read_user_me(current_user: models.Usuario = Depends(get_current_user)):
    return current_user

@router.put("/me", response_model=schemas.UserResponse)
def update_user_me(
    user_data: schemas.UserUpdate,
    current_user: models.Usuario = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if user_data.nombre:
        current_user.nombre = user_data.nombre
    if user_data.email:
        # Check if email is already taken
        existing = db.query(models.Usuario).filter(
            models.Usuario.email == user_data.email,
            models.Usuario.id != current_user.id
        ).first()
        if existing:
            raise HTTPException(status_code=400, detail="Email already in use")
        current_user.email = user_data.email
    if user_data.password:
        # Validate password strength (RN-AUTH-005)
        is_valid, error_message = PasswordService.validate_password_strength(user_data.password)
        if not is_valid:
            raise HTTPException(status_code=400, detail=error_message)
        current_user.password_hash = PasswordService.hash_password(user_data.password)
    
    db.commit()
    db.refresh(current_user)
    return current_user

@router.get("/{user_id}", response_model=schemas.UserResponse)
def read_user(
    user_id: int, 
    db: Session = Depends(get_db),
    current_user: models.Usuario = Depends(get_current_user)
):
    db_user = db.query(models.Usuario).filter(models.Usuario.id == user_id).first()
    if db_user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return db_user

@router.put("/{user_id}", response_model=schemas.UserResponse)
def update_user(
    user_id: int,
    user_data: schemas.UserUpdate,
    db: Session = Depends(get_db),
    current_user: models.Usuario = Depends(get_current_user)
):
    db_user = db.query(models.Usuario).filter(models.Usuario.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user_data.nombre:
        db_user.nombre = user_data.nombre
    if user_data.email:
        existing = db.query(models.Usuario).filter(
            models.Usuario.email == user_data.email,
            models.Usuario.id != user_id
        ).first()
        if existing:
            raise HTTPException(status_code=400, detail="Email already in use")
        db_user.email = user_data.email
    if user_data.estado:
        db_user.estado = user_data.estado
    if user_data.password:
        # Validate password strength (RN-AUTH-005)
        is_valid, error_message = PasswordService.validate_password_strength(user_data.password)
        if not is_valid:
            raise HTTPException(status_code=400, detail=error_message)
        db_user.password_hash = PasswordService.hash_password(user_data.password)
    
    db.commit()
    db.refresh(db_user)
    return db_user

@router.put("/{user_id}/estado", response_model=schemas.UserResponse)
def change_user_status(
    user_id: int,
    estado: str,
    db: Session = Depends(get_db),
    current_user: models.Usuario = Depends(get_current_user)
):
    if estado not in ["activo", "inactivo", "bloqueado"]:
        raise HTTPException(status_code=400, detail="Invalid status")
    
    db_user = db.query(models.Usuario).filter(models.Usuario.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    db_user.estado = estado
    db.commit()
    db.refresh(db_user)
    return db_user

@router.delete("/{user_id}")
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: models.Usuario = Depends(get_current_user)
):
    db_user = db.query(models.Usuario).filter(models.Usuario.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Check if it's the last admin
    if db_user.rol_id == 1:  # Assuming 1 is admin role
        admin_count = db.query(models.Usuario).filter(models.Usuario.rol_id == 1).count()
        if admin_count <= 1:
            raise HTTPException(status_code=400, detail="Cannot delete the last administrator")
    
    # Soft delete by setting status to inactive
    db_user.estado = "inactivo"
    db.commit()
    return {"message": "User deactivated successfully"}
