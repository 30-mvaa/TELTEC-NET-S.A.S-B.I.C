-- Script para arreglar permisos específicos de teltec_db
-- Conectarse como superusuario postgres

-- Crear usuario si no existe
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'teltec_user') THEN
        CREATE USER teltec_user WITH PASSWORD '12345678';
    END IF;
END
$$;

-- Otorgar permisos completos sobre la base de datos
GRANT ALL PRIVILEGES ON DATABASE teltec_db TO teltec_user;

-- Conectarse a la base de datos teltec_db
\c teltec_db;

-- Otorgar permisos sobre el esquema public
GRANT ALL ON SCHEMA public TO teltec_user;

-- Otorgar permisos sobre todas las tablas existentes
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO teltec_user;

-- Otorgar permisos sobre todas las secuencias (para IDs auto-incrementales)
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO teltec_user;

-- Otorgar permisos sobre futuras tablas y secuencias
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO teltec_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO teltec_user;

-- Verificar permisos específicos en la tabla clientes
GRANT SELECT, INSERT, UPDATE, DELETE ON public.clientes TO teltec_user;

-- Mostrar información de verificación
SELECT 
    schemaname,
    tablename,
    tableowner,
    hasinserts,
    hasselects,
    hasupdates,
    hasdeletes
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'clientes';

-- Verificar que el usuario puede acceder
SELECT current_user, current_database();

\echo 'Permisos configurados correctamente para teltec_user en teltec_db'
