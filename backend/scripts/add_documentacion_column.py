from app.database import engine, Base
from sqlalchemy import text

def update_schema():
    with engine.connect() as connection:
        # Check if column exists (PostgreSQL)
        result = connection.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name='especialistas' AND column_name='documentacion'"))
        exists = result.fetchone()
        
        if not exists:
            print("Adding documentacion column to especialistas table...")
            connection.execute(text("ALTER TABLE especialistas ADD COLUMN documentacion VARCHAR"))
            connection.commit()
            print("Column added successfully.")
        else:
            print("Column documentacion already exists.")

if __name__ == "__main__":
    update_schema()
