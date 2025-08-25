-- Script para registrar pagos de María Manuela Angamarca
-- Cliente ID: 2, Plan: Plan familiar ($20)

-- Limpiar pagos existentes de este cliente (por si acaso)
DELETE FROM pagos WHERE cliente_id = 2;

-- Registrar pago de Enero 2024
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
    20.00, 
    '2024-01-15', 
    'efectivo', 
    'Pago mensual - Enero 2024 - Plan familiar', 
    'completado', 
    true, 
    'TELTEC-20240115-00001', 
    '2024-01-15 10:00:00'
);

-- Registrar pago de Febrero 2024
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
    20.00, 
    '2024-02-12', 
    'efectivo', 
    'Pago mensual - Febrero 2024 - Plan familiar', 
    'completado', 
    true, 
    'TELTEC-20240212-00002', 
    '2024-02-12 14:30:00'
);

-- Registrar pago de Marzo 2024
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
    20.00, 
    '2024-03-10', 
    'efectivo', 
    'Pago mensual - Marzo 2024 - Plan familiar', 
    'completado', 
    true, 
    'TELTEC-20240310-00003', 
    '2024-03-10 11:15:00'
);

-- Registrar pago de Abril 2024
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
    20.00, 
    '2024-04-08', 
    'efectivo', 
    'Pago mensual - Abril 2024 - Plan familiar', 
    'completado', 
    true, 
    'TELTEC-20240408-00004', 
    '2024-04-08 16:45:00'
);

-- Registrar pago de Mayo 2024
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
    20.00, 
    '2024-05-05', 
    'efectivo', 
    'Pago mensual - Mayo 2024 - Plan familiar', 
    'completado', 
    true, 
    'TELTEC-20240505-00005', 
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

-- Verificar los pagos registrados
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
WHERE p.cliente_id = 2
ORDER BY p.fecha_pago;

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
