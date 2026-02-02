import psycopg2

try:
    conn = psycopg2.connect('postgresql://postgres:root@localhost:5432/club_alisados')
    cur = conn.cursor()
    
    print("=" * 60)
    print("  CONEXION A BASE DE DATOS: OK")
    print("=" * 60)
    
    # Listar columnas de usuarios
    cur.execute("SELECT column_name FROM information_schema.columns WHERE table_name = 'usuarios'")
    cols = [r[0] for r in cur.fetchall()]
    print(f"\nColumnas de usuarios: {cols}")
    
    # Listar usuarios
    cur.execute('SELECT id, username, email, estado FROM usuarios')
    users = cur.fetchall()
    
    print("\nUSUARIOS EN LA BASE DE DATOS:")
    print("-" * 60)
    for user in users:
        print(f"  ID: {user[0]}, Username: {user[1]}, Email: {user[2]}, Estado: {user[3]}")
    
    conn.close()
    
except Exception as e:
    print(f"ERROR DE CONEXION: {e}")
