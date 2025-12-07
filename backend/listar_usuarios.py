"""
Script para verificar usuarios existentes en la base de datos
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
from app.models.user import Usuario, Rol

def listar_usuarios():
    """Listar todos los usuarios de la base de datos"""
    print("\n" + "="*70)
    print("  USUARIOS EXISTENTES EN LA BASE DE DATOS")
    print("="*70 + "\n")
    
    db = SessionLocal()
    try:
        usuarios = db.query(Usuario).join(Rol).all()
        
        if not usuarios:
            print("[!] No hay usuarios en la base de datos")
            return
        
        print(f"Total de usuarios: {len(usuarios)}\n")
        
        for user in usuarios:
            print("-" * 70)
            print(f"ID:              {user.id}")
            print(f"Username:        {user.username}")
            print(f"Email:           {user.email}")
            print(f"Nombre:          {user.nombre}")
            print(f"Rol:             {user.rol.nombre}")
            print(f"Estado:          {user.estado}")
            print(f"Intentos fallidos: {user.intentos_fallidos}")
            if user.fecha_bloqueo:
                print(f"Fecha bloqueo:   {user.fecha_bloqueo}")
            print(f"Fecha creacion:  {user.fecha_creacion}")
            print()
        
        print("="*70)
        print("\n[INFO] Para hacer login, usa el username y la contrasena que configuraste")
        print("[INFO] Si no recuerdas la contrasena, puedes:")
        print("  1. Eliminar el usuario: DELETE FROM usuarios WHERE username = 'admin';")
        print("  2. Ejecutar: python crear_usuario_admin.py")
        print("  3. O actualizar la contrasena directamente en la BD")
        print("\n" + "="*70 + "\n")
        
    except Exception as e:
        print(f"[ERROR] Error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    listar_usuarios()
