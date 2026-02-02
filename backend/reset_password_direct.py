"""
Script para resetear contraseña directamente usando SQL
"""
import psycopg2
from passlib.context import CryptContext

# Configuración de hash de contraseña (mismo que usa la app)
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def reset_password(username: str, new_password: str):
    print("=" * 60)
    print(f"  RESETEANDO CONTRASEÑA DE: {username}")
    print("=" * 60)
    
    try:
        conn = psycopg2.connect('postgresql://postgres:root@localhost:5432/club_alisados')
        cur = conn.cursor()
        
        # Generar hash
        password_hash = hash_password(new_password)
        
        # Actualizar contraseña
        cur.execute("""
            UPDATE usuarios 
            SET password_hash = %s, 
                intentos_fallidos = 0, 
                fecha_bloqueo = NULL, 
                estado = 'activo'
            WHERE username = %s
            RETURNING id, username, email
        """, (password_hash, username))
        
        result = cur.fetchone()
        
        if result:
            conn.commit()
            print(f"\n[OK] EXITO - Contrasena reseteada")
            print(f"   ID: {result[0]}")
            print(f"   Username: {result[1]}")
            print(f"   Email: {result[2]}")
            print(f"   Nueva contrasena: {new_password}")
        else:
            print(f"\n[X] Usuario '{username}' no encontrado")
        
        conn.close()
        print("=" * 60)
        
    except Exception as e:
        print(f"ERROR: {e}")

if __name__ == "__main__":
    reset_password("admin", "12345678")
