from datetime import datetime
from pydantic import BaseModel
from typing import Optional, List

class CitaDashboard(BaseModel):
    id: int
    hora: str
    cliente: str
    servicio: str
    especialista: str
    estado: str

class DashboardStats(BaseModel):
    citas_hoy: int
    clientes_activos: int
    especialistas_activos: int
    ingresos_mes: Optional[float] = None
    proximas_citas: List[CitaDashboard] = []
