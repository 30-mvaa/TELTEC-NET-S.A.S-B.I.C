-- Script para actualizar fecha_registro de todos los clientes a enero del 2025
-- Ejecutar con precaución - HACE BACKUP ANTES DE EJECUTAR

-- Hacer backup antes de ejecutar:
-- pg_dump -d teltec_db -t clientes > backup_clientes_$(date +%Y%m%d_%H%M%S).sql

BEGIN;

-- Actualizar fecha_registro de todos los clientes a enero del 2025
UPDATE clientes 
SET 
    fecha_registro = '2025-01-15 10:00:00-05',
    fecha_actualizacion = CURRENT_TIMESTAMP
WHERE fecha_registro IS NOT NULL;

-- Verificar la actualización
SELECT 
    COUNT(*) as total_clientes_actualizados,
    MIN(fecha_registro) as fecha_minima,
    MAX(fecha_registro) as fecha_maxima
FROM clientes;

-- Mostrar algunos ejemplos de clientes actualizados
SELECT 
    id,
    cedula,
    nombres,
    apellidos,
    fecha_registro,
    fecha_actualizacion
FROM clientes 
ORDER BY id 
LIMIT 10;

COMMIT;

-- Verificar que todos los clientes tengan la fecha correcta
SELECT 
    'Verificación final:' as info,
    COUNT(*) as total_clientes,
    COUNT(CASE WHEN EXTRACT(YEAR FROM fecha_registro) = 2025 AND EXTRACT(MONTH FROM fecha_registro) = 1 THEN 1 END) as clientes_enero_2025,
    COUNT(CASE WHEN EXTRACT(YEAR FROM fecha_registro) != 2025 OR EXTRACT(MONTH FROM fecha_registro) != 1 THEN 1 END) as clientes_con_fecha_diferente
FROM clientes;
