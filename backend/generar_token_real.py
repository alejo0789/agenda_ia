import sys
import os
from datetime import datetime, timedelta
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from jose import jwt

# Configurar el path para importar la app
sys.path.append(os.getcwd())

from app.models.user import Usuario
from app.models.auth import Sesion

def generar_token_real_produccion(db_url, secret_key, username="admin"):
    print(f"\n[INFO] Generando token con la Secret Key de producción...")
    
    # Crear engine directo con la URL de producción
    engine = create_engine(db_url)
    SessionProd = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = SessionProd()
    
    try:
        user = db.query(Usuario).filter(Usuario.username == username).first()
        if not user:
            print(f"[ERROR] Usuario '{username}' no encontrado.")
            return

        # 1. Generar JWT Token de forma manual para asegurar que usamos la SECRET_KEY correcta
        expires_delta = timedelta(days=365 * 100)
        fecha_expiracion = datetime.utcnow() + expires_delta
        
        to_encode = {
            "sub": user.username,
            "user_id": user.id,
            "exp": fecha_expiracion,
            "type": "access"
        }
        
        # Usamos la clave proporcionada por el usuario
        token = jwt.encode(to_encode, secret_key, algorithm="HS256")
        
        # 2. Registrar/Actualizar la sesión en la base de datos
        # Primero borramos cualquier sesión permanente anterior para este usuario para evitar duplicados
        db.query(Sesion).filter(Sesion.usuario_id == user.id, Sesion.user_agent == "Permanente / Agente IA").delete()
        
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
        print(f" [EXITO] NUEVO TOKEN REAL REGISTRADO EN PRODUCCIÓN")
        print(f" Usuario: {user.username}")
        print(f" Válido hasta: {fecha_expiracion}")
        print("="*80)
        print(f"\nNUEVO TOKEN:\n{token}\n")
        print("="*80)
        print("\n[IMPORTANTE] Copia este nuevo token en n8n.")
        
    except Exception as e:
        print(f"[ERROR] Ocurrió un error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    PROD_DB = "postgresql://postgres:LfDDooXlptZClDMMHmyIHjjdnthSWTqz@crossover.proxy.rlwy.net:50039/railway"
    PROD_SECRET = ",Tc{av6Ym_F8l#<vrTdDcF-ALXM1+4fRzp%.qA}N){EP@#M"
    target_user = sys.argv[1] if len(sys.argv) > 1 else "admin"
    generar_token_real_produccion(PROD_DB, PROD_SECRET, target_user)
