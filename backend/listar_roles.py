from app.database import SessionLocal
from app.models import Rol

db = SessionLocal()
roles = db.query(Rol).all()
print("Roles encontrados:")
for r in roles:
    print(f"  - ID: {r.id}, Nombre: '{r.nombre}'")
db.close()
