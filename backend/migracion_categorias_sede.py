# -*- coding: utf-8 -*-
"""
Script de migración para asignar sede_id a categorías existentes
y eliminar duplicados.

Ejecutar con la URL de producción:
postgresql://postgres:LfDDooXlptZClDMMHmyIHjjdnthSWTqz@crossover.proxy.rlwy.net:50039/railway
"""

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
import sys
import io

# Configurar encoding UTF-8 para Windows
if sys.platform == 'win32':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    sys.stdin = io.TextIOWrapper(sys.stdin.buffer, encoding='utf-8')

# URL de la base de datos de producción
DATABASE_URL = "postgresql://postgres:LfDDooXlptZClDMMHmyIHjjdnthSWTqz@crossover.proxy.rlwy.net:50039/railway"

def migrate_categorias():
    """
    Migra las categorías existentes:
    1. Identifica categorías sin sede_id
    2. Asigna la primera sede disponible o permite elegir
    3. Elimina duplicados si existen
    """
    
    engine = create_engine(DATABASE_URL)
    SessionLocal = sessionmaker(bind=engine)
    db = SessionLocal()
    
    try:
        print("=" * 80)
        print("MIGRACIÓN DE CATEGORÍAS DE SERVICIO")
        print("=" * 80)
        
        # 1. Verificar sedes disponibles
        print("\n1. Verificando sedes disponibles...")
        sedes = db.execute(text("SELECT id, nombre FROM sedes ORDER BY id")).fetchall()
        
        if not sedes:
            print("❌ No hay sedes en la base de datos. Crea una sede primero.")
            return
        
        print(f"✅ Sedes encontradas: {len(sedes)}")
        for sede in sedes:
            print(f"   - ID: {sede[0]}, Nombre: {sede[1]}")
        
        # 2. Verificar categorías sin sede_id
        print("\n2. Verificando categorías sin sede_id...")
        categorias_sin_sede = db.execute(text("""
            SELECT id, nombre, descripcion, orden_visualizacion
            FROM categorias_servicio
            WHERE sede_id IS NULL
            ORDER BY id
        """)).fetchall()
        
        if not categorias_sin_sede:
            print("✅ No hay categorías sin sede_id")
        else:
            print(f"⚠️  Encontradas {len(categorias_sin_sede)} categorías sin sede_id:")
            for cat in categorias_sin_sede:
                print(f"   - ID: {cat[0]}, Nombre: {cat[1]}")
            
            # Asignar a la primera sede por defecto
            primera_sede_id = sedes[0][0]
            print(f"\n   Asignando todas las categorías sin sede a la sede ID {primera_sede_id} ({sedes[0][1]})...")
            
            for cat in categorias_sin_sede:
                db.execute(text("""
                    UPDATE categorias_servicio
                    SET sede_id = :sede_id
                    WHERE id = :cat_id
                """), {"sede_id": primera_sede_id, "cat_id": cat[0]})
            
            db.commit()
            print(f"✅ {len(categorias_sin_sede)} categorías actualizadas")
        
        # 3. Verificar duplicados por sede
        print("\n3. Verificando duplicados por sede...")
        duplicados = db.execute(text("""
            SELECT nombre, sede_id, COUNT(*) as count
            FROM categorias_servicio
            WHERE sede_id IS NOT NULL
            GROUP BY nombre, sede_id
            HAVING COUNT(*) > 1
        """)).fetchall()
        
        if not duplicados:
            print("✅ No hay duplicados")
        else:
            print(f"⚠️  Encontrados {len(duplicados)} grupos de duplicados:")
            for dup in duplicados:
                print(f"   - Nombre: '{dup[0]}', Sede ID: {dup[1]}, Cantidad: {dup[2]}")
            
            # Para cada duplicado, mantener solo el primero (más antiguo)
            print("\n   Eliminando duplicados (manteniendo el más antiguo)...")
            for dup in duplicados:
                nombre, sede_id = dup[0], dup[1]
                
                # Obtener todos los IDs de este duplicado
                ids = db.execute(text("""
                    SELECT id
                    FROM categorias_servicio
                    WHERE nombre = :nombre AND sede_id = :sede_id
                    ORDER BY id
                """), {"nombre": nombre, "sede_id": sede_id}).fetchall()
                
                # Mantener el primero, eliminar los demás
                ids_to_delete = [id[0] for id in ids[1:]]
                
                if ids_to_delete:
                    # Primero, actualizar servicios que usan las categorías duplicadas
                    # para que apunten a la categoría que vamos a mantener
                    categoria_a_mantener = ids[0][0]
                    
                    for id_to_delete in ids_to_delete:
                        db.execute(text("""
                            UPDATE servicios
                            SET categoria_id = :nueva_categoria_id
                            WHERE categoria_id = :vieja_categoria_id
                        """), {
                            "nueva_categoria_id": categoria_a_mantener,
                            "vieja_categoria_id": id_to_delete
                        })
                    
                    # Ahora eliminar las categorías duplicadas
                    for id_to_delete in ids_to_delete:
                        db.execute(text("""
                            DELETE FROM categorias_servicio
                            WHERE id = :id
                        """), {"id": id_to_delete})
                    
                    print(f"   ✅ Eliminados {len(ids_to_delete)} duplicados de '{nombre}' (Sede {sede_id})")
            
            db.commit()
        
        # 4. Resumen final
        print("\n4. Resumen final...")
        categorias_por_sede = db.execute(text("""
            SELECT s.nombre as sede_nombre, COUNT(cs.id) as total_categorias
            FROM sedes s
            LEFT JOIN categorias_servicio cs ON cs.sede_id = s.id
            GROUP BY s.id, s.nombre
            ORDER BY s.id
        """)).fetchall()
        
        print("\nCategorías por sede:")
        for sede in categorias_por_sede:
            print(f"   - {sede[0]}: {sede[1]} categorías")
        
        # Listar todas las categorías
        print("\nTodas las categorías:")
        todas_categorias = db.execute(text("""
            SELECT cs.id, cs.nombre, s.nombre as sede_nombre, cs.orden_visualizacion
            FROM categorias_servicio cs
            JOIN sedes s ON s.id = cs.sede_id
            ORDER BY s.id, cs.orden_visualizacion, cs.nombre
        """)).fetchall()
        
        for cat in todas_categorias:
            print(f"   - ID: {cat[0]}, Nombre: '{cat[1]}', Sede: {cat[2]}, Orden: {cat[3]}")
        
        print("\n" + "=" * 80)
        print("✅ MIGRACIÓN COMPLETADA EXITOSAMENTE")
        print("=" * 80)
        print("\nAhora puedes crear categorías con el mismo nombre en diferentes sedes.")
        
    except Exception as e:
        print(f"\n❌ Error durante la migración: {e}")
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    print("Este script actualizará la base de datos de PRODUCCIÓN")
    print("URL: postgresql://crossover.proxy.rlwy.net:50039/railway")
    print("\n⚠️  ADVERTENCIA: Esto modificará datos en producción")
    
    respuesta = input("\n¿Deseas continuar? (escribe 'SI' para confirmar): ")
    
    if respuesta.strip().upper() == "SI":
        migrate_categorias()
    else:
        print("Migración cancelada.")
