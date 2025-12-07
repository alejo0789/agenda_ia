import sys
import os
sys.path.append(os.getcwd())

from app.database import SessionLocal
from app.models.user import Rol, Usuario
from app.utils.security import get_password_hash
from sqlalchemy import text

def debug_creation():
    db = SessionLocal()
    try:
        # 1. Check Roles
        print("Checking roles...")
        roles = db.query(Rol).all()
        if not roles:
            print("ERROR: No roles found in the database! You need to populate the 'roles' table first.")
        else:
            print(f"Found {len(roles)} roles:")
            for r in roles:
                print(f" - ID: {r.id}, Name: {r.nombre}")

        # 2. Try to create a test user
        print("\nAttempting to create a test user...")
        if roles:
            test_role_id = roles[0].id
            try:
                new_user = Usuario(
                    username="testuser_debug",
                    email="test_debug@example.com",
                    password_hash=get_password_hash("password123"),
                    nombre="Test User Debug",
                    rol_id=test_role_id,
                    estado="activo"
                )
                db.add(new_user)
                db.commit()
                print("SUCCESS: Test user created successfully!")
                
                # Cleanup
                db.delete(new_user)
                db.commit()
                print("Test user deleted after verification.")
            except Exception as e:
                print(f"ERROR creating user: {e}")
                db.rollback()
        else:
            print("Skipping user creation attempt because no roles exist.")

    except Exception as e:
        print(f"General Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    debug_creation()
