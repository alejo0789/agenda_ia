"""
Crear tablas de fichas técnicas en la base de datos de PostgreSQL
"""
import sys
import os
from sqlalchemy import create_engine
from app.models.ficha_tecnica import PlantillaFicha, CampoFicha, CitaFicha, RespuestaFicha
from app.database import Base

# Construir URL de la base de datos
DB_URL = "postgresql://postgres:root@localhost:5432/club_alisados"

print(f"============================================================")
print(f"  CREANDO TABLAS DE FICHAS TÉCNICAS")
print(f"============================================================")
print(f"Conectando a POSTGRESQL...")

try:
    engine = create_engine(DB_URL)
    
    # Crear las tablas solo si no existen
    PlantillaFicha.__table__.create(bind=engine, checkfirst=True)
    CampoFicha.__table__.create(bind=engine, checkfirst=True)
    CitaFicha.__table__.create(bind=engine, checkfirst=True)
    RespuestaFicha.__table__.create(bind=engine, checkfirst=True)

    print("Tablas creadas exitosamente!")

except Exception as e:
    print(f"ERROR: {e}")
