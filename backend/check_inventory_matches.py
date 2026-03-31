
import pandas as pd
from app.database import SessionLocal
from app.models.producto import Producto

def check_matches():
    df = pd.read_excel(r'C:\Users\alejandro.carvajal\Documents\large\software\Inventario 374.xlsx')
    db = SessionLocal()
    
    matches = 0
    misses = 0
    
    products_db = db.query(Producto).all()
    db_names = {p.nombre.lower().strip(): p for p in products_db}
    
    print(f"{'Excel Name':<40} | {'Status':<10}")
    print("-" * 55)
    
    for _, row in df.iterrows():
        excel_name = str(row['Producto']).strip()
        excel_name_lower = excel_name.lower()
        
        if excel_name_lower in db_names:
            print(f"{excel_name:<40} | MATCH")
            matches += 1
        else:
            print(f"{excel_name:<40} | NOT FOUND")
            misses += 1
            
    print("-" * 55)
    print(f"Total Matches: {matches}")
    print(f"Total Misses: {misses}")
    db.close()

if __name__ == "__main__":
    check_matches()
