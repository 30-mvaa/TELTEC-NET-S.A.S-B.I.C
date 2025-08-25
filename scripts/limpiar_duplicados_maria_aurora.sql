-- Script para limpiar pagos duplicados de María Aurora Tenezaca Cuzco
-- Mantener solo los pagos más recientes de cada mes

-- Eliminar pagos duplicados de enero (mantener el más reciente)
DELETE FROM pagos WHERE id = 11; -- TELTEC-20250110-00006 (más antiguo)

-- Eliminar pagos duplicados de febrero (mantener el más reciente)
DELETE FROM pagos WHERE id = 12; -- TELTEC-20250208-00007 (más antiguo)

-- Eliminar pagos duplicados de marzo (mantener el más reciente)
DELETE FROM pagos WHERE id = 13; -- TELTEC-20250312-00008 (más antiguo)

-- Eliminar pagos duplicados de abril (mantener el más reciente)
DELETE FROM pagos WHERE id = 14; -- TELTEC-20250415-00009 (más antiguo)

-- Verificar pagos restantes
SELECT 
    p.id,
    p.numero_comprobante,
    p.fecha_pago,
    p.monto,
    c.nombres || ' ' || c.apellidos as cliente
FROM pagos p 
JOIN clientes c ON p.cliente_id = c.id 
WHERE p.cliente_id = 4 
ORDER BY p.fecha_pago;

-- Verificar estado actual del cliente
SELECT 
    id,
    cedula,
    nombres || ' ' || apellidos as nombre_completo,
    fecha_ultimo_pago,
    meses_pendientes,
    monto_total_deuda,
    fecha_vencimiento_pago,
    estado_pago
FROM clientes 
WHERE id = 4;
