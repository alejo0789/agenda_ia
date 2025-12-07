from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from ..models import Rol, Permiso, RolPermiso
from ..schemas.user import RolBase, RolResponse
from ..schemas.auth import PermisoResponse
from ..dependencies import get_current_user
from ..models import Usuario

router = APIRouter(
    prefix="/api/roles",
    tags=["roles"],
)

@router.get("/", response_model=List[RolResponse])
def list_roles(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    roles = db.query(Rol).offset(skip).limit(limit).all()
    return roles

@router.get("/{rol_id}", response_model=RolResponse)
def get_role(
    rol_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    rol = db.query(Rol).filter(Rol.id == rol_id).first()
    if not rol:
        raise HTTPException(status_code=404, detail="Role not found")
    return rol

@router.post("/", response_model=RolResponse, status_code=status.HTTP_201_CREATED)
def create_role(
    rol: RolBase,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    db_rol = db.query(Rol).filter(Rol.nombre == rol.nombre).first()
    if db_rol:
        raise HTTPException(status_code=400, detail="Role name already exists")
    
    new_rol = Rol(
        nombre=rol.nombre,
        descripcion=rol.descripcion,
        es_sistema=False
    )
    db.add(new_rol)
    db.commit()
    db.refresh(new_rol)
    return new_rol

@router.put("/{rol_id}", response_model=RolResponse)
def update_role(
    rol_id: int,
    rol_data: RolBase,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    db_rol = db.query(Rol).filter(Rol.id == rol_id).first()
    if not db_rol:
        raise HTTPException(status_code=404, detail="Role not found")
    
    if db_rol.es_sistema:
        raise HTTPException(status_code=400, detail="Cannot modify system roles")
    
    db_rol.nombre = rol_data.nombre
    db_rol.descripcion = rol_data.descripcion
    db.commit()
    db.refresh(db_rol)
    return db_rol

@router.delete("/{rol_id}")
def delete_role(
    rol_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    db_rol = db.query(Rol).filter(Rol.id == rol_id).first()
    if not db_rol:
        raise HTTPException(status_code=404, detail="Role not found")
    
    if db_rol.es_sistema:
        raise HTTPException(status_code=400, detail="Cannot delete system roles")
    
    # Check if role has users
    if db_rol.usuarios:
        raise HTTPException(status_code=400, detail="Cannot delete role with assigned users")
    
    db.delete(db_rol)
    db.commit()
    return {"message": "Role deleted successfully"}

@router.put("/{rol_id}/permisos")
def assign_permissions(
    rol_id: int,
    permiso_ids: List[int],
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    db_rol = db.query(Rol).filter(Rol.id == rol_id).first()
    if not db_rol:
        raise HTTPException(status_code=404, detail="Role not found")
    
    # Delete existing permissions
    db.query(RolPermiso).filter(RolPermiso.rol_id == rol_id).delete()
    
    # Add new permissions
    for permiso_id in permiso_ids:
        permiso = db.query(Permiso).filter(Permiso.id == permiso_id).first()
        if not permiso:
            raise HTTPException(status_code=404, detail=f"Permission {permiso_id} not found")
        
        rol_permiso = RolPermiso(rol_id=rol_id, permiso_id=permiso_id)
        db.add(rol_permiso)
    
    db.commit()
    return {"message": "Permissions assigned successfully"}

# Permisos endpoint - separate from roles
permisos_router = APIRouter(
    prefix="/api/permisos",
    tags=["permisos"],
)

@permisos_router.get("/", response_model=List[PermisoResponse])
def list_permissions(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    permisos = db.query(Permiso).offset(skip).limit(limit).all()
    return permisos
