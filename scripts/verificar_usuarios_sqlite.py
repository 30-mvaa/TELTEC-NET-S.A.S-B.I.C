#!/usr/bin/env python
"""
Script para verificar usuarios en SQLite
"""

import os
import sys
import django

# Configurar Django
sys.path.append('/Users/marcoangamarca/Desktop/web-teltec/django_backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'teltec_backend.settings')
django.setup()

from django.db import connection

def verificar_usuarios_sqlite():
    """Verificar usuarios en SQLite"""
    
    print("🔍 Verificando usuarios en SQLite...")
    
    try:
        with connection.cursor() as cursor:
            # Verificar si la tabla existe
            cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='usuarios'")
            if not cursor.fetchone():
                print("❌ La tabla 'usuarios' no existe")
                return
            
            # Obtener estructura de la tabla
            cursor.execute("PRAGMA table_info(usuarios)")
            columnas = cursor.fetchall()
            
            print("📋 Columnas en la tabla usuarios:")
            for columna in columnas:
                cid, nombre, tipo, notnull, default, pk = columna
                print(f"   • {nombre}: {tipo}")
            
            # Contar usuarios
            cursor.execute("SELECT COUNT(*) FROM usuarios")
            count = cursor.fetchone()[0]
            print(f"\n📊 Total de usuarios: {count}")
            
            if count > 0:
                # Obtener algunos usuarios
                cursor.execute("SELECT * FROM usuarios LIMIT 3")
                usuarios = cursor.fetchall()
                
                print("\n👥 Primeros usuarios:")
                for usuario in usuarios:
                    print(f"   {usuario}")
                    
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    verificar_usuarios_sqlite()
