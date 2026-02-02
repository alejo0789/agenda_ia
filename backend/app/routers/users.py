from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from ..models import user as models
from ..schemas import user as schemas
from ..utils import security
from ..dependencies import get_current_user, require_permission
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
    auth_context: dict = Depends(require_permission("usuarios.crear"))
):
    current_user = auth_context["user"]
    from sqlalchemy import func
    db_user = db.query(models.Usuario).filter(func.lower(models.Usuario.email) == func.lower(user.email)).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    db_username = db.query(models.Usuario).filter(func.lower(models.Usuario.username) == func.lower(user.username)).first()
    if db_username:
        raise HTTPException(status_code=400, detail="Username already registered")

    # Validate password strength (RN-AUTH-005)
    is_valid, error_message = PasswordService.validate_password_strength(user.password)
    if not is_valid:
        raise HTTPException(status_code=400, detail=error_message)

    hashed_password = PasswordService.hash_password(user.password)
    # Validar Sede
    sede_id_to_assign = user.sede_id
    if current_user.rol_id != 1:  # No es Super Admin
         # Forzar asignación a su propia sede
         sede_id_to_assign = current_user.sede_id
    
    # Validar Rol
    rol_obj = db.query(models.Rol).filter(models.Rol.id == user.rol_id).first()
    if not rol_obj:
        raise HTTPException(status_code=400, detail="Invalid Role ID")
    
    if rol_obj.sede_id is not None:
        # Role is local, must match assigned sede
        if rol_obj.sede_id != sede_id_to_assign:
            raise HTTPException(status_code=400, detail="Role belongs to a different Sede")
            
    # Si es crear, por defecto primer_acceso es True y requiere_cambio_password es configurable
    
    db_user = models.Usuario(
        username=user.username,
        email=user.email,
        password_hash=hashed_password,
        nombre=user.nombre,
        rol_id=user.rol_id,
        sede_id=sede_id_to_assign,
        especialista_id=user.especialista_id,
        estado=user.estado,
        primer_acceso=user.primer_acceso if user.primer_acceso is not None else True,
        requiere_cambio_password=user.requiere_cambio_password if user.requiere_cambio_password is not None else False
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


@router.get("/", response_model=List[schemas.UserResponse])
def read_users(
    skip: int = 0, 
    limit: int = 100, 
    sede_id: int = None,
    db: Session = Depends(get_db),
    current_user: models.Usuario = Depends(get_current_user)
):
    query = db.query(models.Usuario)
    
    # Lógica de filtrado por sede
    if current_user.sede_id:
        # User is restricted to a sede
        query = query.filter(models.Usuario.sede_id == current_user.sede_id)
    else:
        # User is global (Super Admin), allow optional filtering
        if sede_id:
            query = query.filter(models.Usuario.sede_id == sede_id)
            
    users = query.offset(skip).limit(limit).all()
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
        from sqlalchemy import func
        existing = db.query(models.Usuario).filter(
            func.lower(models.Usuario.email) == func.lower(user_data.email),
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
        
    # Security check for Sede
    if current_user.sede_id and db_user.sede_id != current_user.sede_id:
        raise HTTPException(status_code=403, detail="No tiene permiso para ver este usuario")
        
    return db_user

@router.put("/{user_id}", response_model=schemas.UserResponse)
def update_user(
    user_id: int,
    user_data: schemas.UserUpdate,
    db: Session = Depends(get_db),
    auth_context: dict = Depends(require_permission("usuarios.editar"))
):
    current_user = auth_context["user"]
    db_user = db.query(models.Usuario).filter(models.Usuario.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
        
    # Security check for Sede
    if current_user.sede_id and db_user.sede_id != current_user.sede_id:
        raise HTTPException(status_code=403, detail="No tiene permiso para editar este usuario")
    
    if user_data.nombre:
        db_user.nombre = user_data.nombre
    if user_data.email:
        from sqlalchemy import func
        existing = db.query(models.Usuario).filter(
            func.lower(models.Usuario.email) == func.lower(user_data.email),
            models.Usuario.id != user_id
        ).first()
        if existing:
            raise HTTPException(status_code=400, detail="Email already in use")
        db_user.email = user_data.email
    if user_data.estado:
        db_user.estado = user_data.estado
    if user_data.rol_id:
        # Validate that the new role is valid for the user's sede
        new_rol = db.query(models.Rol).filter(models.Rol.id == user_data.rol_id).first()
        if not new_rol:
             raise HTTPException(status_code=400, detail="Invalid Role ID")
        
        # Determine effective Sede ID
        effective_sede_id = db_user.sede_id
        if user_data.sede_id and current_user.rol_id == 1:
            effective_sede_id = user_data.sede_id
            
        if new_rol.sede_id is not None and new_rol.sede_id != effective_sede_id:
             raise HTTPException(status_code=400, detail="Role belongs to a different Sede")

        # TODO: Validar que no se escale privilegios indebidamente
        db_user.rol_id = user_data.rol_id
    if user_data.sede_id:
        if current_user.rol_id == 1: # Solo super admin mueve de sede
            # Check current role compatibility with new sede
            current_rol = db.query(models.Rol).filter(models.Rol.id == db_user.rol_id).first()
            if current_rol.sede_id is not None and current_rol.sede_id != user_data.sede_id:
                 # If moving sede, and current role is Local, must assign a new valid role? 
                 # Or just block. Blocking is safer.
                 raise HTTPException(status_code=400, detail="Current role is specific to the old Sede. Change role first.")
            db_user.sede_id = user_data.sede_id
    if user_data.especialista_id is not None:
        db_user.especialista_id = user_data.especialista_id
            
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
    auth_context: dict = Depends(require_permission("usuarios.editar"))
):
    current_user = auth_context["user"]
    if estado not in ["activo", "inactivo", "bloqueado"]:
        raise HTTPException(status_code=400, detail="Invalid status")
    
    db_user = db.query(models.Usuario).filter(models.Usuario.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
        
    # Security check for Sede
    if current_user.sede_id and db_user.sede_id != current_user.sede_id:
        raise HTTPException(status_code=403, detail="No tiene permiso para cambiar el estado de este usuario")
    
    db_user.estado = estado
    db.commit()
    db.refresh(db_user)
    return db_user

@router.delete("/{user_id}")
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    auth_context: dict = Depends(require_permission("usuarios.eliminar"))
):
    current_user = auth_context["user"]
    db_user = db.query(models.Usuario).filter(models.Usuario.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
        
    # Security check for Sede
    if current_user.sede_id and db_user.sede_id != current_user.sede_id:
        raise HTTPException(status_code=403, detail="No tiene permiso para eliminar este usuario")

    # Seguridad: Evitar que usuarios eliminen a superiores o iguales si no son SuperAdmin
    # Si intentan eliminar a un Super Admin (rol_id 1) y no son Super Admin
    if db_user.rol_id == 1 and current_user.rol_id != 1:
         raise HTTPException(status_code=403, detail="No tiene permisos para eliminar a un Super Administrador")
    
    # Check if it's the last admin
    if db_user.rol_id == 1:  # Assuming 1 is admin role
        admin_count = db.query(models.Usuario).filter(models.Usuario.rol_id == 1).count()
        if admin_count <= 1:
            raise HTTPException(status_code=400, detail="Cannot delete the last administrator")
    
    # Soft delete by setting status to inactive
    db_user.estado = "inactivo"
    db.commit()
    return {"message": "User deactivated successfully"}
