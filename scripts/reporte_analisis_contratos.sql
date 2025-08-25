-- Reporte de Análisis de Contratos
-- Basado en el sistema de color-coding

-- 1. Resumen General
SELECT 
    'RESUMEN GENERAL DE CONTRATOS' as titulo,
    COUNT(*) as total_clientes,
    COUNT(CASE WHEN estado_pago = 'al_dia' THEN 1 END) as clientes_verdes,
    COUNT(CASE WHEN estado_pago = 'proximo_vencimiento' THEN 1 END) as clientes_amarillos,
    COUNT(CASE WHEN estado_pago = 'vencido' THEN 1 END) as clientes_rojos,
    COALESCE(SUM(monto_total_deuda), 0) as deuda_total
FROM clientes 
WHERE estado = 'activo';

-- 2. Distribución por Mes de Contrato
SELECT 
    EXTRACT(MONTH FROM fecha_registro) as mes,
    TO_CHAR(fecha_registro, 'Month YYYY') as mes_nombre,
    COUNT(*) as total_contratos,
    COUNT(CASE WHEN estado_pago = 'al_dia' THEN 1 END) as verdes,
    COUNT(CASE WHEN estado_pago = 'proximo_vencimiento' THEN 1 END) as amarillos,
    COUNT(CASE WHEN estado_pago = 'vencido' THEN 1 END) as rojos
FROM clientes 
WHERE estado = 'activo'
GROUP BY EXTRACT(MONTH FROM fecha_registro), TO_CHAR(fecha_registro, 'Month YYYY')
ORDER BY EXTRACT(MONTH FROM fecha_registro);

-- 3. Top 5 Clientes con Mayor Deuda
SELECT 
    'TOP 5 CLIENTES CON MAYOR DEUDA' as titulo,
    '' as separador;

SELECT 
    ROW_NUMBER() OVER (ORDER BY monto_total_deuda DESC) as ranking,
    cedula,
    nombres || ' ' || apellidos as nombre_completo,
    fecha_registro,
    meses_pendientes,
    monto_total_deuda,
    CASE 
        WHEN estado_pago = 'al_dia' THEN '🟢 Verde'
        WHEN estado_pago = 'proximo_vencimiento' THEN '🟡 Amarillo'
        WHEN estado_pago = 'vencido' THEN '🔴 Rojo'
        ELSE '⚪ Sin estado'
    END as estado_visual
FROM clientes 
WHERE estado = 'activo' AND monto_total_deuda > 0
ORDER BY monto_total_deuda DESC
LIMIT 5;

-- 4. Clientes por Vencer (Próximos 30 días)
SELECT 
    'CLIENTES POR VENCER (PRÓXIMOS 30 DÍAS)' as titulo,
    '' as separador;

SELECT 
    cedula,
    nombres || ' ' || apellidos as nombre_completo,
    fecha_registro,
    fecha_ultimo_pago,
    EXTRACT(DAY FROM AGE(CURRENT_DATE, fecha_registro)) as dias_desde_registro,
    CASE 
        WHEN estado_pago = 'al_dia' THEN '🟢 Verde'
        WHEN estado_pago = 'proximo_vencimiento' THEN '🟡 Amarillo'
        WHEN estado_pago = 'vencido' THEN '🔴 Rojo'
        ELSE '⚪ Sin estado'
    END as estado_visual
FROM clientes 
WHERE estado = 'activo' 
AND EXTRACT(DAY FROM AGE(CURRENT_DATE, fecha_registro)) BETWEEN 25 AND 35
ORDER BY fecha_registro;

-- 5. Análisis de Sectores (si están definidos)
SELECT 
    'ANÁLISIS POR SECTORES' as titulo,
    '' as separador;

SELECT 
    COALESCE(sector, 'Sin sector definido') as sector,
    COUNT(*) as total_clientes,
    COUNT(CASE WHEN estado_pago = 'al_dia' THEN 1 END) as verdes,
    COUNT(CASE WHEN estado_pago = 'proximo_vencimiento' THEN 1 END) as amarillos,
    COUNT(CASE WHEN estado_pago = 'vencido' THEN 1 END) as rojos,
    COALESCE(SUM(monto_total_deuda), 0) as deuda_sector
FROM clientes 
WHERE estado = 'activo'
GROUP BY sector
ORDER BY total_clientes DESC;

-- 6. Tendencias de Pago
SELECT 
    'TENDENCIAS DE PAGO' as titulo,
    '' as separador;

SELECT 
    CASE 
        WHEN fecha_ultimo_pago IS NULL THEN 'Sin pagos registrados'
        WHEN EXTRACT(DAY FROM AGE(CURRENT_DATE, fecha_ultimo_pago)) <= 30 THEN 'Pagos recientes (≤30 días)'
        WHEN EXTRACT(DAY FROM AGE(CURRENT_DATE, fecha_ultimo_pago)) <= 90 THEN 'Pagos moderados (31-90 días)'
        ELSE 'Pagos antiguos (>90 días)'
    END as categoria_pago,
    COUNT(*) as cantidad_clientes,
    COALESCE(SUM(monto_total_deuda), 0) as deuda_categoria
FROM clientes 
WHERE estado = 'activo'
GROUP BY 
    CASE 
        WHEN fecha_ultimo_pago IS NULL THEN 'Sin pagos registrados'
        WHEN EXTRACT(DAY FROM AGE(CURRENT_DATE, fecha_ultimo_pago)) <= 30 THEN 'Pagos recientes (≤30 días)'
        WHEN EXTRACT(DAY FROM AGE(CURRENT_DATE, fecha_ultimo_pago)) <= 90 THEN 'Pagos moderados (31-90 días)'
        ELSE 'Pagos antiguos (>90 días)'
    END
ORDER BY 
    CASE categoria_pago
        WHEN 'Pagos recientes (≤30 días)' THEN 1
        WHEN 'Pagos moderados (31-90 días)' THEN 2
        WHEN 'Pagos antiguos (>90 días)' THEN 3
        WHEN 'Sin pagos registrados' THEN 4
    END;
