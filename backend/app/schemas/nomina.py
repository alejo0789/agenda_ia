from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from decimal import Decimal

class NominaItem(BaseModel):
    fecha: datetime
    factura_numero: str
    item_nombre: str
    tipo: str  # 'servicio' | 'producto'
    cantidad: Decimal
    precio_unitario: Decimal
    subtotal: Decimal
    comision_porcentaje: Decimal
    comision_valor: Decimal
    
    class Config:
        from_attributes = True

class NominaResumenEspecialista(BaseModel):
    especialista_id: int
    nombre: str
    apellido: str
    total_servicios: Decimal  # Monto total vendido en servicios
    total_productos: Decimal  # Monto total vendido en productos
    comision_servicios: Decimal
    comision_productos: Decimal
    total_comision: Decimal
    items: List[NominaItem] = [] # Optional, for detailed view

    class Config:
        from_attributes = True

class NominaResponse(BaseModel):
    fecha_inicio: datetime
    fecha_fin: datetime
    resumen: List[NominaResumenEspecialista]
