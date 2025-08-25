#!/usr/bin/env python
"""
Script para verificar usuarios en PostgreSQL
"""

import psycopg2
import bcrypt

def verificar_usuarios_postgres():
    """Verificar usuarios en PostgreSQL"""
    
    print("🔍 Verificando usuarios en PostgreSQL...")
    
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
        
        # Obtener usuarios
        cursor.execute("SELECT id, email, nombre, rol, activo, password_hash FROM usuarios")
        usuarios = cursor.fetchall()
        
        print(f"📊 Total de usuarios: {len(usuarios)}")
        
        for usuario in usuarios:
            user_id, email, nombre, rol, activo, password_hash = usuario
            print(f"\n👤 Usuario: {email}")
            print(f"   • ID: {user_id}")
            print(f"   • Nombre: {nombre}")
            print(f"   • Rol: {rol}")
            print(f"   • Activo: {activo}")
            print(f"   • Password Hash: {password_hash[:20]}...")
            
            # Probar contraseñas comunes
            contraseñas_prueba = [
                "123456",
                "password",
                "admin",
                "admin123",
                "12345678",
                "qwerty",
                "dario123",
                "vangamarca123",
                "teltec123"
            ]
            
            print("   🔑 Probando contraseñas:")
            for pwd in contraseñas_prueba:
                try:
                    if bcrypt.checkpw(pwd.encode('utf-8'), password_hash.encode('utf-8')):
                        print(f"      ✅ Contraseña encontrada: {pwd}")
                        break
                except:
                    pass
            else:
                print(f"      ❌ No se encontró contraseña común")
        
        cursor.close()
        conn.close()
        
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    verificar_usuarios_postgres()
