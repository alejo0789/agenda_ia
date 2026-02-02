from fastapi import APIRouter, Depends, Query, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from datetime import date
from typing import Optional
import io

from ..database import get_db
from ..services.report_service import ReportService
from ..dependencies import require_permission

router = APIRouter(
    prefix="/api/reportes",
    tags=["Reportes"]
)

@router.get("/citas/export")
def exportar_citas(
    fecha_inicio: date = Query(...),
    fecha_fin: date = Query(...),
    incluir_cliente: bool = Query(True),
    db: Session = Depends(get_db),
    user: dict = Depends(require_permission("caja.ver")) # Usamos caja.ver para reportes general
):
    """
    Exporta el listado de citas a Excel.
    """
    sede_id = user["user"].sede_id
    excel_file = ReportService.export_citas_excel(
        db=db,
        sede_id=sede_id,
        fecha_inicio=fecha_inicio,
        fecha_fin=fecha_fin,
        incluir_cliente=incluir_cliente
    )
    
    filename = f"reporte_citas_{fecha_inicio}_al_{fecha_fin}.xlsx"
    
    return StreamingResponse(
        excel_file,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )
