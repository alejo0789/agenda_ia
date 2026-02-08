import os
from sqlalchemy import create_engine, text

# Get DB URL from env or fallback
database_url = os.environ.get("DATABASE_URL")
if not database_url:
    print("Error: DATABASE_URL environment variable not set")
    exit(1)

if database_url.startswith("postgres://"):
    database_url = database_url.replace("postgres://", "postgresql://", 1)

print(f"Connecting to: {database_url.split('@')[-1]}") # Print host only for security

engine = create_engine(database_url)

def check():
    with engine.connect() as conn:
        # Get all tables
        res = conn.execute(text("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'"))
        tables = [r[0] for r in res.fetchall()]
        print(f"Tables found: {tables}")
        
        for table in tables:
            print(f"\nChecking columns for table: {table}")
            res = conn.execute(text(f"SELECT column_name FROM information_schema.columns WHERE table_name = '{table}'"))
            cols = [r[0] for r in res.fetchall()]
            print(f"  Columns: {cols}")

if __name__ == "__main__":
    check()
