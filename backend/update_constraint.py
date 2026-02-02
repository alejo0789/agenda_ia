from sqlalchemy import create_engine, text
engine = create_engine('postgresql://postgres:root@localhost:5432/club_alisados')
with engine.connect() as conn:
    # Get current constraint name just in case
    conn.execute(text("ALTER TABLE facturas_pendientes DROP CONSTRAINT IF EXISTS facturas_pendientes_estado_check;"))
    conn.execute(text("ALTER TABLE facturas_pendientes ADD CONSTRAINT facturas_pendientes_estado_check CHECK (estado IN ('pendiente', 'aprobada', 'rechazada', 'facturada'));"))
    conn.commit()
print("Database constraint updated successfully")
