from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..dependencies import get_current_user
from ..models.user import Usuario
from ..services.dashboard_service import DashboardService
from ..schemas.dashboard import DashboardStats

router = APIRouter(
    prefix="/api/dashboard",
    tags=["dashboard"]
)

@router.get("/stats", response_model=DashboardStats)
def get_dashboard_stats(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    # Determinamos si el usuario es administrador (ID 1 es SuperAdmin, ID 2 es Admin de Sede usualmente)
    # Según Sidebar.tsx: 'Administrador' puede ver casi todo.
    # En app/models/user.py, el rol tiene un nombre.
    
    is_admin = current_user.rol.nombre in ["Administrador", "Super Administrador"] or current_user.rol_id == 1
    
    return DashboardService.get_stats(
        db, 
        sede_id=current_user.sede_id, 
        is_admin=is_admin
    )
