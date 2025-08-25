#!/usr/bin/env python
import os
import sys
import django

# Configurar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'teltec_backend.settings')
django.setup()

from django.db import connection

def check_table_structure():
    """Verificar la estructura de las tablas"""
    with connection.cursor() as cursor:
        # Verificar tabla usuarios
        cursor.execute("""
            SELECT column_name, data_type, is_nullable 
            FROM information_schema.columns 
            WHERE table_name = 'usuarios' 
            ORDER BY ordinal_position;
        """)
        columns = cursor.fetchall()
        
        print("📊 Estructura de la tabla 'usuarios':")
        for col in columns:
            print(f"  - {col[0]}: {col[1]} ({'NULL' if col[2] == 'YES' else 'NOT NULL'})")
        
        # Verificar tabla clientes
        cursor.execute("""
            SELECT column_name, data_type, is_nullable 
            FROM information_schema.columns 
            WHERE table_name = 'clientes' 
            ORDER BY ordinal_position;
        """)
        columns = cursor.fetchall()
        
        print("\n📊 Estructura de la tabla 'clientes':")
        for col in columns:
            print(f"  - {col[0]}: {col[1]} ({'NULL' if col[2] == 'YES' else 'NOT NULL'})")

if __name__ == '__main__':
    check_table_structure() 