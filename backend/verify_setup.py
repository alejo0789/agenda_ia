import sys
import os
# Add the current directory to sys.path so we can import app
sys.path.append(os.getcwd())

from app.database import SessionLocal
from sqlalchemy import text

def test_db_connection():
    try:
        db = SessionLocal()
        db.execute(text("SELECT 1"))
        print("Database connection successful!")
        db.close()
    except Exception as e:
        print(f"Database connection failed: {e}")

if __name__ == "__main__":
    test_db_connection()
