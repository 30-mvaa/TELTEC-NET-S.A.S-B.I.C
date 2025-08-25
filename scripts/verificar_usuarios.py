#!/usr/bin/env python
"""
Script para verificar la estructura de la tabla usuarios
"""

import os
import sys
import django

# Configurar Django
sys.path.append('/Users/marcoangamarca/Desktop/web-teltec/django_backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'teltec_backend.settings')
django.setup()

from django.db import connection

def verificar_estructura_tabla():
    """Verificar la estructura de la tabla usuarios"""
    
    print("🔍 Verificando estructura de la tabla usuarios...")
    
    try:
        with connection.cursor() as cursor:
            # Obtener información de las columnas
            cursor.execute("""
                SELECT column_name, data_type, is_nullable
                FROM information_schema.columns
                WHERE table_name = 'usuarios'
                ORDER BY ordinal_position
            """)
            columnas = cursor.fetchall()
            
            print("📋 Columnas en la tabla usuarios:")
            for columna in columnas:
                nombre, tipo, nullable = columna
                print(f"   • {nombre}: {tipo} ({'NULL' if nullable == 'YES' else 'NOT NULL'})")
            
            # Intentar obtener algunos registros
            cursor.execute("SELECT COUNT(*) FROM usuarios")
            count = cursor.fetchone()[0]
            print(f"\n📊 Total de usuarios en la tabla: {count}")
            
            if count > 0:
                cursor.execute("SELECT * FROM usuarios LIMIT 3")
                usuarios = cursor.fetchall()
                
                print("\n👥 Primeros usuarios:")
                for usuario in usuarios:
                    print(f"   {usuario}")
                    
    except Exception as e:
        print(f"❌ Error verificando tabla: {e}")

if __name__ == "__main__":
    verificar_estructura_tabla()
