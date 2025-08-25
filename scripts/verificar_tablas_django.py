#!/usr/bin/env python
"""
Script para verificar las tablas usando Django ORM
"""

import os
import sys
import django

# Configurar Django
sys.path.append('/Users/marcoangamarca/Desktop/web-teltec/django_backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'teltec_backend.settings')
django.setup()

from django.db import connection

def verificar_tablas_django():
    """Verificar tablas usando Django"""
    
    print("🔍 Verificando tablas usando Django...")
    
    try:
        with connection.cursor() as cursor:
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
        
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    verificar_tablas_django()
