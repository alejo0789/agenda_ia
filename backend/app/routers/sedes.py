from fastapi import APIRouter, Depends, HTTPException, status
from ..dependencies import require_permission
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from ..models import sede as models
from ..models.user import Usuario
from ..schemas import sede as schemas
from ..dependencies import get_current_user

router = APIRouter(
    prefix="/api/sedes",
    tags=["sedes"],
    responses={404: {"description": "Sede no encontrada"}},
)

@router.post("/", response_model=schemas.SedeResponse, status_code=status.HTTP_201_CREATED)
def create_sede(
    sede: schemas.SedeCreate, 
    db: Session = Depends(get_db),
    _: dict = Depends(require_permission("sedes.crear"))
):
    # Verificar si ya existe código
    db_sede = db.query(models.Sede).filter(models.Sede.codigo == sede.codigo).first()
    if db_sede:
        raise HTTPException(status_code=400, detail="El código de sede ya existe")
    
    # Validar lógica de sede principal
    if sede.es_principal:
        # Desactivar principal anterior si existe
        sede_principal = db.query(models.Sede).filter(models.Sede.es_principal == True).first()
        if sede_principal:
            sede_principal.es_principal = False
            
    nueva_sede = models.Sede(**sede.model_dump())
    db.add(nueva_sede)
    db.commit()
    db.refresh(nueva_sede)
    return nueva_sede

@router.get("/", response_model=List[schemas.SedeResponse])
def read_sedes(
    skip: int = 0, 
    limit: int = 100, 
    estado: str = None,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    # Logic for Sede listing
    if current_user.rol_id == 1 and current_user.sede_id is None:
        # Super Admin sees all
        query = db.query(models.Sede)
        if estado:
            query = query.filter(models.Sede.estado == estado)
        sedes = query.offset(skip).limit(limit).all()
        return sedes
    elif current_user.sede_id is not None:
         # Sede Admin or other user with sede assigned
         # Return only their own sede
         sede = db.query(models.Sede).filter(models.Sede.id == current_user.sede_id).first()
         return [sede] if sede else []
    else:
        # No permissions
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="Acceso denegado"
        )

@router.get("/{sede_id}", response_model=schemas.SedeResponse)
def read_sede(
    sede_id: int, 
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    # Un usuario solo puede ver su propia sede, a menos que sea Super Admin
    if current_user.rol_id != 1 and current_user.sede_id != sede_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="No tiene permiso para ver información de otra sede"
        )

    sede = db.query(models.Sede).filter(models.Sede.id == sede_id).first()
    if sede is None:
        raise HTTPException(status_code=404, detail="Sede no encontrada")
    return sede

@router.put("/{sede_id}", response_model=schemas.SedeResponse)
def update_sede(
    sede_id: int,
    sede_data: schemas.SedeUpdate,
    db: Session = Depends(get_db),
    _: dict = Depends(require_permission("sedes.editar"))
):
    db_sede = db.query(models.Sede).filter(models.Sede.id == sede_id).first()
    if not db_sede:
        raise HTTPException(status_code=404, detail="Sede no encontrada")
    
    # Validar unicidad de código
    if sede_data.codigo and sede_data.codigo != db_sede.codigo:
        existe = db.query(models.Sede).filter(models.Sede.codigo == sede_data.codigo).first()
        if existe:
            raise HTTPException(status_code=400, detail="El código ya está en uso")
            
    # Lógica sede principal
    if sede_data.es_principal is not None and sede_data.es_principal:
        # Si se marca como principal, las demás dejan de serlo
        db.query(models.Sede).filter(models.Sede.es_principal == True).update({"es_principal": False})
    
    for key, value in sede_data.model_dump(exclude_unset=True).items():
        setattr(db_sede, key, value)
        
    db.commit()
    db.refresh(db_sede)
    return db_sede

@router.put("/{sede_id}/estado", response_model=schemas.SedeResponse)
def change_sede_status(
    sede_id: int,
    estado: str,
    db: Session = Depends(get_db),
    _: dict = Depends(require_permission("sedes.editar"))
):
    if estado not in ["activa", "inactiva"]:
        raise HTTPException(status_code=400, detail="Estado inválido. Use 'activa' o 'inactiva'")
    
    db_sede = db.query(models.Sede).filter(models.Sede.id == sede_id).first()
    if not db_sede:
        raise HTTPException(status_code=404, detail="Sede no encontrada")
        
    # Validar usuarios activos si se intenta desactivar
    if estado == 'inactiva':
        usuarios_activos = db.query(Usuario).filter(Usuario.sede_id == sede_id, Usuario.estado == 'activo').count()
        if usuarios_activos > 0:
            raise HTTPException(status_code=400, detail=f"No se puede desactivar la sede porque tiene {usuarios_activos} usuarios activos")
    
    db_sede.estado = estado
    db.commit()
    db.refresh(db_sede)
    return db_sede
