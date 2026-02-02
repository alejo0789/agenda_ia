from pydantic import BaseModel
from typing import Optional

class DashboardStats(BaseModel):
    citas_hoy: int
    clientes_activos: int
    especialistas_activos: int
    ingresos_mes: Optional[float] = None
