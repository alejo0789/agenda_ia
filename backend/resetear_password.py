"""
Script para resetear contrasena de un usuario
"""
import sys
import os

# Configurar encoding para Windows
if sys.platform == 'win32':
    import codecs
    sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer, 'strict')
    sys.stderr = codecs.getwriter('utf-8')(sys.stderr.buffer, 'strict')

sys.path.append(os.getcwd())

from app.database import SessionLocal
from app.models.user import Usuario
from app.services.password_service import PasswordService

def resetear_password(username, nueva_password="Admin123!@#"):
    """Resetear contrasena de un usuario"""
    print("\n" + "="*60)
    print(f"  RESETEANDO CONTRASENA DEL USUARIO: {username}")
    print("="*60 + "\n")
    
    db = SessionLocal()
    try:
        # Buscar usuario
        user = db.query(Usuario).filter(Usuario.username == username).first()
        if not user:
            print(f"[X] Usuario '{username}' no encontrado")
            return
        
        print(f"[OK] Usuario encontrado:")
        print(f"   ID:       {user.id}")
        print(f"   Username: {user.username}")
        print(f"   Email:    {user.email}")
        print(f"   Estado:   {user.estado}")
        print(f"   Intentos fallidos: {user.intentos_fallidos}")
        
        # Resetear contrasena
        print(f"\n[OK] Generando nuevo hash de contrasena...")
        user.password_hash = PasswordService.hash_password(nueva_password)
        
        # Resetear intentos fallidos y desbloquear
        user.intentos_fallidos = 0
        user.fecha_bloqueo = None
        user.estado = 'activo'
        
        db.commit()
        
        print("\n" + "="*60)
        print("  [EXITO] CONTRASENA RESETEADA EXITOSAMENTE")
        print("="*60)
        print(f"\n[CREDENCIALES] Nuevas credenciales:")
        print(f"   Username: {user.username}")
        print(f"   Password: {nueva_password}")
        print(f"   Email:    {user.email}")
        print(f"\n[INFO] El usuario ha sido desbloqueado y los intentos fallidos reseteados")
        print("\n" + "="*60 + "\n")
        
    except Exception as e:
        print(f"\n[ERROR] Error: {e}")
        import traceback
        traceback.print_exc()
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description='Resetear contrasena de usuario')
    parser.add_argument('username', help='Username del usuario')
    parser.add_argument('--password', default='Admin123!@#', help='Nueva contrasena (default: Admin123!@#)')
    args = parser.parse_args()
    
    resetear_password(args.username, args.password)
