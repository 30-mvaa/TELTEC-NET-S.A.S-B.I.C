-- Script para registrar pagos de María Aurora Tenezaca Cuzco - AÑO 2025
-- Cliente ID: 4, Cédula: 0300791845

-- Registrar pago de Enero 2025
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
    4, 
    20.00, 
    '2025-01-20', 
    'efectivo', 
    'Pago mensual - Enero 2025 - Plan familiar', 
    'completado', 
    true, 
    'TELTEC-20250120-00006', 
    '2025-01-20 14:30:00'
);

-- Registrar pago de Febrero 2025
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
    4, 
    20.00, 
    '2025-02-18', 
    'efectivo', 
    'Pago mensual - Febrero 2025 - Plan familiar', 
    'completado', 
    true, 
    'TELTEC-20250218-00007', 
    '2025-02-18 15:45:00'
);

-- Registrar pago de Marzo 2025
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
    4, 
    20.00, 
    '2025-03-15', 
    'efectivo', 
    'Pago mensual - Marzo 2025 - Plan familiar', 
    'completado', 
    true, 
    'TELTEC-20250315-00008', 
    '2025-03-15 16:20:00'
);

-- Registrar pago de Abril 2025
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
    4, 
    20.00, 
    '2025-04-12', 
    'efectivo', 
    'Pago mensual - Abril 2025 - Plan familiar', 
    'completado', 
    true, 
    'TELTEC-20250412-00009', 
    '2025-04-12 17:10:00'
);

-- Registrar pago de Mayo 2025
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
    4, 
    20.00, 
    '2025-05-10', 
    'efectivo', 
    'Pago mensual - Mayo 2025 - Plan familiar', 
    'completado', 
    true, 
    'TELTEC-20250510-00010', 
    '2025-05-10 18:30:00'
);

-- Actualizar estado del cliente
UPDATE clientes SET
    fecha_ultimo_pago = '2025-05-10',
    meses_pendientes = 0,
    monto_total_deuda = 0.00,
    fecha_vencimiento_pago = '2025-06-10',
    estado_pago = 'al_dia'
WHERE id = 4;

-- Verificar los pagos registrados
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
