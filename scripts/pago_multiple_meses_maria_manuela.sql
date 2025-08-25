-- Script alternativo: Pago único por múltiples meses
-- Para María Manuela Angamarca - Cliente ID: 2

-- Limpiar pagos existentes de este cliente
DELETE FROM pagos WHERE cliente_id = 2;

-- Registrar pago único por 5 meses (Enero a Mayo)
INSERT INTO pagos (
    cliente_id, 
    monto, 
    fecha_pago, 
    metodo_pago, 
    concepto, 
    estado, 
    comprobante_enviado, 
    numero_comprobante, 
    fecha_creacion
) VALUES (
    2, 
    100.00, -- 5 meses x $20
    '2024-05-05', 
    'efectivo', 
    'Pago múltiples meses - Enero a Mayo 2024 (5 meses) - Plan familiar', 
    'completado', 
    true, 
    'TELTEC-20240505-00001', 
    '2024-05-05 09:20:00'
);

-- Actualizar información del cliente
UPDATE clientes SET
    fecha_ultimo_pago = '2024-05-05',
    meses_pendientes = 0,
    monto_total_deuda = 0.00,
    fecha_vencimiento_pago = '2024-06-05',
    estado_pago = 'al_dia'
WHERE id = 2;

-- Verificar el pago registrado
SELECT 
    p.id,
    p.numero_comprobante,
    p.fecha_pago,
    p.monto,
    p.concepto,
    p.estado,
    c.nombres || ' ' || c.apellidos as cliente_nombre
FROM pagos p
JOIN clientes c ON p.cliente_id = c.id
WHERE p.cliente_id = 2;

-- Verificar estado actual del cliente
SELECT 
    id,
    nombres || ' ' || apellidos as nombre_completo,
    tipo_plan,
    precio_plan,
    fecha_ultimo_pago,
    meses_pendientes,
    monto_total_deuda,
    fecha_vencimiento_pago,
    estado_pago
FROM clientes 
WHERE id = 2;
