import sys
import os
from dotenv import load_dotenv

# Cargar .env desde la carpeta backend
load_dotenv(os.path.join(os.path.dirname(__file__), 'backend', '.env'))

from backend.app.database import SessionLocal
from backend.app.models.caja import MetodoPago, Caja

def check_db():
    db = SessionLocal()
    try:
        print("--- Métodos de Pago ---")
        methods = db.query(MetodoPago).all()
        for m in methods:
            print(f"ID: {m.id} | Nombre: {m.nombre} | Activo: {m.activo}")
        
        print("\n--- Caja Actual ---")
        caja = db.query(Caja).filter(Caja.estado == 'abierta').first()
        if caja:
            print(f"Caja ID: {caja.id} | Sede ID: {caja.sede_id} | Fecha Apertura: {caja.fecha_apertura}")
        else:
            print("No hay ninguna caja abierta.")
            
    finally:
        db.close()

if __name__ == "__main__":
    check_db()
