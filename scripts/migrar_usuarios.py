#!/usr/bin/env python
"""
Script para migrar usuarios existentes de SQL a Django
"""

import os
import sys
import django

# Configurar Django
sys.path.append('/Users/marcoangamarca/Desktop/web-teltec/django_backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'teltec_backend.settings')
django.setup()

from django.db import connection
from usuarios.models import Usuario
import bcrypt

def migrar_usuarios():
    """Migrar usuarios existentes de SQL a Django"""
    
    print("🚀 Migrando usuarios existentes...")
    
    try:
        # Obtener usuarios existentes de la base de datos
        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT id, email, password_hash, nombre, rol, activo, fecha_creacion, fecha_actualizacion
                FROM usuarios
            """)
            usuarios_existentes = cursor.fetchall()
        
        print(f"📋 Encontrados {len(usuarios_existentes)} usuarios en la base de datos")
        
        for usuario_data in usuarios_existentes:
            user_id, email, password_hash, nombre, rol, activo, fecha_creacion, fecha_actualizacion = usuario_data
            
            # Verificar si el usuario ya existe en Django
            if Usuario.objects.filter(email=email).exists():
                print(f"ℹ️  Usuario {email} ya existe en Django, saltando...")
                continue
            
            try:
                # Crear usuario en Django
                # Para las contraseñas existentes, usamos un hash temporal
                # Los usuarios deberán cambiar su contraseña en el primer login
                password_temporal = "cambiar123"
                
                user = Usuario.objects.create_user(
                    username=email,  # Django requiere username
                    email=email,
                    password=password_temporal,
                    nombre=nombre,
                    rol=rol,
                    is_active=activo,
                    is_staff=(rol == 'administrador'),
                    is_superuser=(rol == 'administrador')
                )
                
                print(f"✅ Usuario migrado: {email} ({nombre}) - Rol: {rol}")
                
            except Exception as e:
                print(f"❌ Error migrando usuario {email}: {e}")
        
        print("\n🎉 Migración completada!")
        print("\n📋 Usuarios en Django:")
        for user in Usuario.objects.all():
            print(f"   • {user.email} ({user.nombre}) - Rol: {user.rol}")
        
        print("\n⚠️  IMPORTANTE:")
        print("   Los usuarios migrados tienen contraseña temporal: 'cambiar123'")
        print("   Deben cambiar su contraseña en el primer login")
        
    except Exception as e:
        print(f"❌ Error en la migración: {e}")

def crear_usuario_admin():
    """Crear usuario administrador por defecto"""
    
    print("\n🔧 Creando usuario administrador por defecto...")
    
    try:
        # Verificar si ya existe un admin
        if Usuario.objects.filter(rol='administrador').exists():
            print("ℹ️  Ya existe un usuario administrador")
            return
        
        # Crear usuario administrador
        admin_user = Usuario.objects.create_user(
            username='admin@teltecnet.com',
            email='admin@teltecnet.com',
            password='admin123',
            nombre='Administrador',
            rol='administrador',
            is_active=True,
            is_staff=True,
            is_superuser=True
        )
        
        print("✅ Usuario administrador creado:")
        print(f"   Email: admin@teltecnet.com")
        print(f"   Contraseña: admin123")
        
    except Exception as e:
        print(f"❌ Error creando usuario administrador: {e}")

if __name__ == "__main__":
    migrar_usuarios()
    crear_usuario_admin()
