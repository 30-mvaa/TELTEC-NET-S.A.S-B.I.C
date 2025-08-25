#!/usr/bin/env python
"""
Script para crear un usuario de prueba en SQLite
"""

import os
import sys
import django

# Configurar Django
sys.path.append('/Users/marcoangamarca/Desktop/web-teltec/django_backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'teltec_backend.settings')
django.setup()

from django.db import connection
import bcrypt

def crear_usuario_prueba():
    """Crear usuario de prueba en SQLite"""
    
    print("🔧 Creando usuario de prueba...")
    
    try:
        # Hash de la contraseña
        password = "admin123"
        password_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        
        with connection.cursor() as cursor:
            # Crear tabla usuarios si no existe
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS usuarios (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    email TEXT UNIQUE NOT NULL,
                    password_hash TEXT NOT NULL,
                    nombre TEXT NOT NULL,
                    rol TEXT NOT NULL,
                    activo BOOLEAN DEFAULT 1,
                    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
                    fecha_actualizacion DATETIME DEFAULT CURRENT_TIMESTAMP,
                    reset_token TEXT,
                    reset_expires DATETIME,
                    reset_token_expires DATETIME
                )
            """)
            
            # Verificar si el usuario ya existe
            cursor.execute("SELECT id FROM usuarios WHERE email = ?", ['admin@teltecnet.com'])
            if cursor.fetchone():
                print("ℹ️  Usuario admin@teltecnet.com ya existe")
                return
            
            # Insertar usuario de prueba
            cursor.execute("""
                INSERT INTO usuarios (email, password_hash, nombre, rol, activo)
                VALUES (?, ?, ?, ?, ?)
            """, ['admin@teltecnet.com', password_hash, 'Administrador', 'administrador', True])
            
            print("✅ Usuario de prueba creado exitosamente!")
            print(f"   Email: admin@teltecnet.com")
            print(f"   Contraseña: {password}")
            print(f"   Rol: administrador")
            
    except Exception as e:
        print(f"❌ Error creando usuario: {e}")

if __name__ == "__main__":
    crear_usuario_prueba()
