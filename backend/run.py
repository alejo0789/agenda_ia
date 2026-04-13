import uvicorn
import os
from dotenv import load_dotenv

# Cargar variables de entorno desde .env si existe
load_dotenv()

if __name__ == "__main__":
    # Obtener puerto de variable de entorno o usar 8000 por defecto
    port = int(os.getenv("PORT", 8000))
    
    print(f"Iniciando servidor en http://0.0.0.0:{port}")
    print("Documentación en http://0.0.0.0:{port}/docs")
    
    uvicorn.run(
        "app.main:app", 
        host="0.0.0.0", 
        port=port, 
        reload=True,
        proxy_headers=True,
        forwarded_allow_ips="*"
    )
