#!/usr/bin/env python
"""
Script para configurar conexión directa a PostgreSQL sin psycopg2
"""

import os
import sys
import django

# Configurar Django
sys.path.append('/Users/marcoangamarca/Desktop/web-teltec/django_backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'teltec_backend.settings')
django.setup()

import psycopg2
from django.db import connection

def configurar_conexion_postgres():
    """Configurar conexión directa a PostgreSQL"""
    
    # Configuración de la base de datos PostgreSQL
    DB_CONFIG = {
        'host': 'localhost',
        'port': '5432',
        'database': 'teltec_db',
        'user': 'teltec_user',
        'password': '12345678'
    }
    
    try:
        # Intentar conectar directamente a PostgreSQL
        conn = psycopg2.connect(**DB_CONFIG)
        cursor = conn.cursor()
        
        print("✅ Conexión exitosa a PostgreSQL")
        
        # Verificar usuarios existentes
        cursor.execute("SELECT COUNT(*) FROM usuarios")
        count = cursor.fetchone()[0]
        print(f"📊 Total de usuarios: {count}")
        
        if count > 0:
            cursor.execute("SELECT id, email, nombre, rol, activo FROM usuarios LIMIT 3")
            usuarios = cursor.fetchall()
            
            print("\n👥 Usuarios disponibles:")
            for usuario in usuarios:
                user_id, email, nombre, rol, activo = usuario
                print(f"   • {email} ({nombre}) - Rol: {rol}")
        
        cursor.close()
        conn.close()
        
        return True
        
    except Exception as e:
        print(f"❌ Error conectando a PostgreSQL: {e}")
        return False

if __name__ == "__main__":
    configurar_conexion_postgres()
