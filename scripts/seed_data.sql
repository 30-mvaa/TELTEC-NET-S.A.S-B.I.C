-- Insertar datos de ejemplo para TelTec Net

-- Insertar clientes de ejemplo
INSERT INTO clientes (cedula, nombres, apellidos, tipo_plan, fecha_nacimiento, direccion, sector, email, telefono, estado) VALUES
('1234567890', 'Juan Carlos', 'Pérez González', 'Básico 10MB', '1985-03-15', 'Av. Principal 123', 'Centro', 'juan.perez@email.com', '0999123456', 'activo'),
('0987654321', 'María Elena', 'Rodríguez Silva', 'Premium 50MB', '1990-07-22', 'Calle Secundaria 456', 'Norte', 'maria.rodriguez@email.com', '0998765432', 'activo'),
('1122334455', 'Carlos Alberto', 'Mendoza Torres', 'Estándar 25MB', '1988-11-10', 'Av. Los Pinos 789', 'Sur', 'carlos.mendoza@email.com', '0997654321', 'activo'),
('5566778899', 'Ana Sofía', 'Vargas López', 'Ultra 100MB', '1992-05-18', 'Calle Las Flores 321', 'Este', 'ana.vargas@email.com', '0996543210', 'suspendido'),
('9988776655', 'Luis Fernando', 'Castro Ruiz', 'Básico 10MB', '1987-09-25', 'Av. Central 654', 'Oeste', 'luis.castro@email.com', '0995432109', 'activo')
ON CONFLICT (cedula) DO NOTHING;

-- Insertar pagos de ejemplo
INSERT INTO pagos (cliente_id, monto, fecha_pago, metodo_pago, concepto, estado, comprobante_enviado) VALUES
(1, 25.00, '2024-06-13', 'Efectivo', 'Pago mensual - Básico 10MB', 'completado', true),
(2, 45.00, '2024-06-12', 'Transferencia', 'Pago mensual - Premium 50MB', 'completado', false),
(3, 35.00, '2024-06-11', 'Tarjeta', 'Pago mensual - Estándar 25MB', 'completado', true),
(1, 25.00, '2024-05-13', 'Efectivo', 'Pago mensual - Básico 10MB', 'completado', true),
(2, 45.00, '2024-05-12', 'Transferencia', 'Pago mensual - Premium 50MB', 'completado', true),
(5, 25.00, '2024-06-10', 'Efectivo', 'Pago mensual - Básico 10MB', 'completado', false);

-- Insertar gastos de ejemplo
INSERT INTO gastos (descripcion, categoria, monto, fecha_gasto, proveedor, metodo_pago, usuario_id) VALUES
('Pago a proveedor de internet', 'Proveedores', 2500.00, '2024-06-01', 'ISP Principal', 'Transferencia', 1),
('Combustible para vehículos', 'Transporte', 150.00, '2024-06-05', 'Gasolinera Central', 'Efectivo', 1),
('Mantenimiento de equipos', 'Mantenimiento', 300.00, '2024-06-08', 'TecService', 'Cheque', 1),
('Materiales de oficina', 'Oficina', 75.50, '2024-06-10', 'Papelería Moderna', 'Tarjeta', 2),
('Pago de servicios básicos', 'Servicios', 120.00, '2024-06-12', 'Empresa Eléctrica', 'Transferencia', 2);

-- Insertar notificaciones de ejemplo
INSERT INTO notificaciones (cliente_id, tipo, mensaje, estado, canal) VALUES
(4, 'pago_vencido', 'Su pago está vencido. Por favor regularice su situación.', 'pendiente', 'whatsapp'),
(1, 'pago_proximo', 'Su pago vence en 5 días. Fecha límite: 2024-06-18', 'enviado', 'whatsapp'),
(2, 'pago_proximo', 'Su pago vence en 3 días. Fecha límite: 2024-06-16', 'pendiente', 'whatsapp'),
(4, 'corte_servicio', 'Su servicio será suspendido por falta de pago.', 'pendiente', 'whatsapp');
