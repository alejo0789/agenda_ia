"""
Script para crear usuario administrador de prueba
Ejecutar: python crear_usuario_admin.py
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
from app.services.password_service import PasswordService

def crear_usuario_admin():
    """Crear usuario administrador de prueba"""
    print("\n" + "="*60)
    print("  CREANDO USUARIO ADMINISTRADOR DE PRUEBA")
    print("="*60 + "\n")
    
    db = SessionLocal()
    try:
        # Verificar si ya existe
        existing = db.query(Usuario).filter(Usuario.username == "admin").first()
        if existing:
            print("[X] El usuario 'admin' ya existe")
            print(f"   ID: {existing.id}")
            print(f"   Email: {existing.email}")
            print(f"   Estado: {existing.estado}")
            print("\n[!] Si deseas recrearlo, primero eliminalo desde la base de datos:")
            print("   DELETE FROM usuarios WHERE username = 'admin';")
            return
        
        # Obtener rol de administrador
        admin_role = db.query(Rol).filter(Rol.nombre == "Administrador").first()
        if not admin_role:
            print("[X] No se encontro el rol de Administrador")
            print("   Verifica que la base de datos este inicializada correctamente")
            return
        
        print("[OK] Rol de Administrador encontrado (ID: {})".format(admin_role.id))
        
        # Crear usuario
        print("[OK] Generando hash de contrasena...")
        admin_user = Usuario(
            username="admin",
            email="admin@clubalisados.com",
            password_hash=PasswordService.hash_password("Admin123!@#"),
            nombre="Administrador del Sistema",
            rol_id=admin_role.id,
            estado="activo"
        )
        
        print("[OK] Guardando usuario en la base de datos...")
        db.add(admin_user)
        db.commit()
        db.refresh(admin_user)
        
        print("\n" + "="*60)
        print("  [EXITO] USUARIO ADMINISTRADOR CREADO EXITOSAMENTE")
        print("="*60)
        print(f"\n[INFO] Informacion del usuario:")
        print(f"   ID:       {admin_user.id}")
        print(f"   Username: {admin_user.username}")
        print(f"   Email:    {admin_user.email}")
        print(f"   Nombre:   {admin_user.nombre}")
        print(f"   Rol:      {admin_role.nombre}")
        print(f"   Estado:   {admin_user.estado}")
        
        print(f"\n[CREDENCIALES] Credenciales de acceso:")
        print(f"   Username: admin")
        print(f"   Password: Admin123!@#")
        
        print(f"\n[LOGIN] Ahora puedes hacer login en:")
        print(f"   http://localhost:8000/api/auth/login")
        
        print("\n" + "="*60 + "\n")
        
    except Exception as e:
        print(f"\n[ERROR] Error al crear usuario: {e}")
        import traceback
        traceback.print_exc()
        db.rollback()
    finally:
        db.close()

def crear_usuarios_prueba():
    """Crear múltiples usuarios de prueba"""
    print("\n" + "="*60)
    print("  CREANDO USUARIOS DE PRUEBA")
    print("="*60 + "\n")
    
    db = SessionLocal()
    try:
        # Obtener roles
        roles = {
            "Administrador": db.query(Rol).filter(Rol.nombre == "Administrador").first(),
            "Cajero": db.query(Rol).filter(Rol.nombre == "Cajero").first(),
            "Recepcionista": db.query(Rol).filter(Rol.nombre == "Recepcionista").first(),
        }
        
        # Usuarios a crear
        usuarios = [
            {
                "username": "admin",
                "email": "admin@clubalisados.com",
                "nombre": "Administrador del Sistema",
                "rol": "Administrador"
            },
            {
                "username": "cajero",
                "email": "cajero@clubalisados.com",
                "nombre": "Cajero de Prueba",
                "rol": "Cajero"
            },
            {
                "username": "recepcionista",
                "email": "recepcionista@clubalisados.com",
                "nombre": "Recepcionista de Prueba",
                "rol": "Recepcionista"
            }
        ]
        
        created_count = 0
        for user_data in usuarios:
            # Verificar si ya existe
            existing = db.query(Usuario).filter(Usuario.username == user_data["username"]).first()
            if existing:
                print(f"[!] Usuario '{user_data['username']}' ya existe (ID: {existing.id})")
                continue
            
            # Obtener rol
            rol = roles.get(user_data["rol"])
            if not rol:
                print(f"[X] Rol '{user_data['rol']}' no encontrado")
                continue
            
            # Crear usuario
            new_user = Usuario(
                username=user_data["username"],
                email=user_data["email"],
                password_hash=PasswordService.hash_password("Admin123!@#"),
                nombre=user_data["nombre"],
                rol_id=rol.id,
                estado="activo"
            )
            
            db.add(new_user)
            db.commit()
            db.refresh(new_user)
            
            print(f"[OK] Usuario '{new_user.username}' creado (ID: {new_user.id}, Rol: {user_data['rol']})")
            created_count += 1
        
        print("\n" + "="*60)
        print(f"  [EXITO] {created_count} USUARIOS CREADOS")
        print("="*60)
        
        if created_count > 0:
            print(f"\n[CREDENCIALES] Todos los usuarios tienen la contrasena: Admin123!@#")
            print(f"\n[INFO] Usuarios disponibles:")
            for user_data in usuarios:
                print(f"   - {user_data['username']} ({user_data['rol']})")
        
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
    
    parser = argparse.ArgumentParser(description='Crear usuarios de prueba')
    parser.add_argument('--all', action='store_true', help='Crear todos los usuarios de prueba')
    args = parser.parse_args()
    
    if args.all:
        crear_usuarios_prueba()
    else:
        crear_usuario_admin()
