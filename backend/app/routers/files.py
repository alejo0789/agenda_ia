from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Depends
from fastapi.responses import JSONResponse
import shutil
import os
from pathlib import Path
from typing import List, Optional
from ..database import get_db
from sqlalchemy.orm import Session
from ..schemas.cliente import ClienteResponse  # Ajustar import
from ..services.cliente_service import ClienteService

# Definir router con prefijo /api/files
router = APIRouter(
    prefix="/api/files",
    tags=["Archivos"]
)

# Directorio base para subidas dentro del volumen persistente de Railway
UPLOAD_DIR = Path("storage/uploads")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

@router.post("/upload")
async def upload_file(
    file: UploadFile = File(...),
    cliente_id: Optional[int] = Form(None),
    especialista_id: Optional[int] = Form(None),
    # telefono: Optional[str] = Form(None), # Ya recibimos el cliente_id, podemos buscar el tel
    db: Session = Depends(get_db)
):
    try:
        # Lógica para Especialistas
        if especialista_id:
            folder_name = f"espe_{especialista_id}"
            target_dir = UPLOAD_DIR / folder_name
            target_dir.mkdir(parents=True, exist_ok=True)
            
            file_path = target_dir / file.filename
            with file_path.open("wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
                
            return {
                "filename": file.filename, 
                "status": "success", 
                "path": f"/uploads/{folder_name}/{file.filename}",
                "message": "Archivo de especialista subido correctamente"
            }

        # Lógica para Clientes (existente)
        target_phone = None
        
        if cliente_id:
            cliente = ClienteService.get_by_id_completo(db, cliente_id)
            if cliente:
                target_phone = cliente.get('telefono')
        
        # Fallback: si no hay telefono, quizas usar ID o requerirlo obligatoriamente
        if not target_phone:
             # Si el cliente no tiene telefono, podriamos usar su ID o rechazar la subida
             if cliente_id:
                 target_phone = f"cliente_{cliente_id}" 
             else:
                raise HTTPException(status_code=400, detail="No se pudo determinar el identificador del cliente (teléfono o ID)")

        # Limpiar caracteres no numéricos para el nombre de la carpeta (seguridad)
        clean_phone = "".join(filter(str.isdigit, str(target_phone)))
        
        if not clean_phone:
             # Si no quedan digitos valida (ej: telefono vacio o solo letras)
             if cliente_id:
                 clean_phone = f"cliente_{cliente_id}"
             else:
                raise HTTPException(status_code=400, detail="Identificador de cliente inválido")

        # Crear directorio específico del cliente
        client_dir = UPLOAD_DIR / clean_phone
        client_dir.mkdir(parents=True, exist_ok=True)
        
        # Guardar archivo
        file_path = client_dir / file.filename
        
        with file_path.open("wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        # Retornar info del archivo guardado
        # La URL dependerá de cómo montemos StaticFiles en main.py
        return {
            "filename": file.filename, 
            "status": "success", 
            "path": f"/uploads/{clean_phone}/{file.filename}",
            "message": "Archivo subido correctamente"
        }

    except Exception as e:
        print(f"Error subiendo archivo: {e}")
        raise HTTPException(status_code=500, detail=f"Error interno al subir archivo: {str(e)}")

@router.get("/list")
async def list_files(
    cliente_id: Optional[int] = None,
    especialista_id: Optional[int] = None,
    telefono: Optional[str] = None,
    cedula: Optional[str] = None,
    db: Session = Depends(get_db)
):
    target_dir = None
    url_prefix = ""

    # Lógica Especialista
    if especialista_id:
        folder_name = f"espe_{especialista_id}"
        target_dir = UPLOAD_DIR / folder_name
        url_prefix = f"/uploads/{folder_name}"

    # Lógica Cliente
    elif cliente_id or telefono or cedula:
        target_phone = telefono
        
        if not target_phone:
            if cliente_id:
                 cliente = ClienteService.get_by_id_completo(db, cliente_id)
                 if cliente:
                     target_phone = cliente.get('telefono')
            elif cedula:
                 pass 
                 
        if not target_phone and cliente_id:
            target_phone = f"cliente_{cliente_id}"

        if target_phone:
            clean_phone = "".join(filter(str.isdigit, str(target_phone)))
            target_dir = UPLOAD_DIR / clean_phone
            url_prefix = f"/uploads/{clean_phone}"

    if not target_dir:
         # Si no se pudo determinar el directorio
         if especialista_id:
              # Si venia ID pero no se armó, es raro, pero por seguridad
             folder_name = f"espe_{especialista_id}"
             target_dir = UPLOAD_DIR / folder_name
         else:
            raise HTTPException(status_code=400, detail="Se requiere parámetro válido para identificar al dueño de los archivos")
    
    if not target_dir.exists():
        return []
        
    files = []
    try:
        for entry in target_dir.iterdir():
            if entry.is_file():
                files.append({
                    "name": entry.name,
                    "url": f"{url_prefix}/{entry.name}",
                    "size": entry.stat().st_size
                })
    except Exception as e:
        print(f"Error listando archivos: {e}")
        return []
            
    return files

@router.delete("/delete")
async def delete_file(
    filename: str,
    cliente_id: Optional[int] = None,
    especialista_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    target_dir = None

    if especialista_id:
        folder_name = f"espe_{especialista_id}"
        target_dir = UPLOAD_DIR / folder_name
    elif cliente_id:
        # Resolver directorio cliente (reutilizar lógica si es posible o duplicar minimamente)
        cliente = ClienteService.get_by_id_completo(db, cliente_id)
        target_phone = cliente.get('telefono') if cliente else None
        
        if not target_phone: 
             target_phone = f"cliente_{cliente_id}"
             
        clean_phone = "".join(filter(str.isdigit, str(target_phone)))
        target_dir = UPLOAD_DIR / clean_phone
    
    if not target_dir:
        raise HTTPException(status_code=400, detail="Identificador inválido")
        
    file_path = target_dir / filename
    
    if not file_path.exists():
         raise HTTPException(status_code=404, detail="Archivo no encontrado")
         
    try:
        os.remove(file_path)
        return {"status": "success", "message": "Archivo eliminado correctamente"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al eliminar archivo: {str(e)}")
