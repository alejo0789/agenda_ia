import sys
import os
from datetime import datetime, timedelta
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Configurar el path para importar la app
sys.path.append(os.getcwd())

from app.models.user import Usuario
from app.models.auth import Sesion
from app.utils.jwt import create_access_token
from app.config import settings

def generar_token_produccion(db_url, username="admin"):
    print(f"\n[INFO] Conectando a la base de datos de producción...")
    
    # Crear engine directo con la URL de producción
    engine = create_engine(db_url)
    SessionProd = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = SessionProd()
    
    try:
        user = db.query(Usuario).filter(Usuario.username == username).first()
        if not user:
            print(f"[ERROR] Usuario '{username}' no encontrado en la base de datos de producción.")
            return

        # 1. Generar JWT Token (100 años)
        expires_delta = timedelta(days=365 * 100)
        token = create_access_token(
            data={"sub": user.username, "user_id": user.id},
            expires_delta=expires_delta
        )
        
        # 2. Registrar la sesión en la base de datos para que sea válida
        fecha_expiracion = datetime.utcnow() + expires_delta
        
        nueva_sesion = Sesion(
            usuario_id=user.id,
            token=token,
            ip="0.0.0.0",
            user_agent="Permanente / Agente IA",
            fecha_expiracion=fecha_expiracion
        )
        
        db.add(nueva_sesion)
        db.commit()
        
        print("\n" + "="*80)
        print(f" [EXITO] TOKEN PERMANENTE REGISTRADO EN PRODUCCIÓN")
        print(f" Usuario: {user.username} (ID: {user.id})")
        print(f" Válido hasta: {fecha_expiracion}")
        print("="*80)
        print(f"\nTOKEN:\n{token}\n")
        print("="*80)
        print("\n[IMPORTANTE] Úsalo en el header 'Authorization: Bearer <token>'")
        
    except Exception as e:
        print(f"[ERROR] Ocurrió un error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    PROD_DB = "postgresql://postgres:LfDDooXlptZClDMMHmyIHjjdnthSWTqz@crossover.proxy.rlwy.net:50039/railway"
    target_user = sys.argv[1] if len(sys.argv) > 1 else "admin"
    generar_token_produccion(PROD_DB, target_user)
