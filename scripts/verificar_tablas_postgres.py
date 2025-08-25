#!/usr/bin/env python
"""
Script para verificar las tablas y columnas en PostgreSQL
"""

import psycopg2

def verificar_tablas_postgres():
    """Verificar tablas y columnas en PostgreSQL"""
    
    print("🔍 Verificando tablas en PostgreSQL...")
    
    try:
        # Conectar a PostgreSQL
        conn = psycopg2.connect(
            host='localhost',
            port='5432',
            database='teltec_db',
            user='teltec_user',
            password='12345678'
        )
        cursor = conn.cursor()
        
        # Obtener todas las tablas
        cursor.execute("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
            ORDER BY table_name
        """)
        tablas = cursor.fetchall()
        
        print(f"📊 Tablas encontradas: {len(tablas)}")
        
        for tabla in tablas:
            nombre_tabla = tabla[0]
            print(f"\n📋 Tabla: {nombre_tabla}")
            
            # Obtener columnas de la tabla
            cursor.execute("""
                SELECT column_name, data_type, is_nullable
                FROM information_schema.columns
                WHERE table_name = %s
                ORDER BY ordinal_position
            """, [nombre_tabla])
            columnas = cursor.fetchall()
            
            print(f"   Columnas ({len(columnas)}):")
            for columna in columnas:
                nombre, tipo, nullable = columna
                print(f"     • {nombre}: {tipo} ({'NULL' if nullable == 'YES' else 'NOT NULL'})")
            
            # Contar registros
            try:
                cursor.execute(f"SELECT COUNT(*) FROM {nombre_tabla}")
                count = cursor.fetchone()[0]
                print(f"   📊 Registros: {count}")
                
                if count > 0 and count <= 5:
                    # Mostrar algunos registros
                    cursor.execute(f"SELECT * FROM {nombre_tabla} LIMIT 3")
                    registros = cursor.fetchall()
                    print(f"   📝 Primeros registros:")
                    for registro in registros:
                        print(f"     {registro}")
                        
            except Exception as e:
                print(f"   ❌ Error contando registros: {e}")
        
        cursor.close()
        conn.close()
        
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    verificar_tablas_postgres()
