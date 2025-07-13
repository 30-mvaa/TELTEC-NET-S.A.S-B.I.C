-- Mejoras para el sistema de recaudación - Gestión de Deudas
-- Ejecutar después de la estructura actual

-- 1. Agregar campos a la tabla clientes para control de pagos
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS fecha_ultimo_pago DATE;
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS meses_pendientes INTEGER DEFAULT 0;
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS monto_total_deuda DECIMAL(10,2) DEFAULT 0.00;
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS fecha_vencimiento_pago DATE;
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS estado_pago VARCHAR(20) DEFAULT 'al_dia';

-- 2. Crear tabla de cuotas mensuales
CREATE TABLE IF NOT EXISTS cuotas_mensuales (
    id SERIAL PRIMARY KEY,
    cliente_id INTEGER REFERENCES clientes(id) ON DELETE CASCADE,
    mes INTEGER NOT NULL, -- 1-12
    año INTEGER NOT NULL,
    monto DECIMAL(10,2) NOT NULL,
    fecha_vencimiento DATE NOT NULL,
    fecha_pago DATE,
    estado VARCHAR(20) DEFAULT 'pendiente', -- pendiente, pagado, vencido
    pago_id INTEGER REFERENCES pagos(id),
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Crear tabla de historial de pagos por cliente
CREATE TABLE IF NOT EXISTS historial_pagos_cliente (
    id SERIAL PRIMARY KEY,
    cliente_id INTEGER REFERENCES clientes(id) ON DELETE CASCADE,
    pago_id INTEGER REFERENCES pagos(id) ON DELETE CASCADE,
    monto_pagado DECIMAL(10,2) NOT NULL,
    concepto VARCHAR(255),
    fecha_pago DATE NOT NULL,
    meses_cubiertos INTEGER DEFAULT 1, -- cuántos meses cubre este pago
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Crear tabla de configuraciones de pago
CREATE TABLE IF NOT EXISTS configuracion_pagos (
    id SERIAL PRIMARY KEY,
    dia_vencimiento INTEGER DEFAULT 5, -- día del mes en que vence el pago
    dias_gracia INTEGER DEFAULT 3, -- días de gracia después del vencimiento
    multa_por_atraso DECIMAL(5,2) DEFAULT 5.00, -- porcentaje de multa
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Insertar configuración por defecto
INSERT INTO configuracion_pagos (dia_vencimiento, dias_gracia, multa_por_atraso) 
VALUES (5, 3, 5.00) 
ON CONFLICT DO NOTHING;

-- 6. Crear índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_cuotas_cliente_mes_año ON cuotas_mensuales(cliente_id, mes, año);
CREATE INDEX IF NOT EXISTS idx_cuotas_estado ON cuotas_mensuales(estado);
CREATE INDEX IF NOT EXISTS idx_historial_cliente ON historial_pagos_cliente(cliente_id);
CREATE INDEX IF NOT EXISTS idx_clientes_estado_pago ON clientes(estado_pago);

-- 7. Función para generar cuotas mensuales automáticamente
CREATE OR REPLACE FUNCTION generar_cuotas_mensuales()
RETURNS void AS $$
DECLARE
    cliente_record RECORD;
    config_record RECORD;
    fecha_vencimiento DATE;
    mes_actual INTEGER;
    año_actual INTEGER;
BEGIN
    -- Obtener configuración
    SELECT * INTO config_record FROM configuracion_pagos LIMIT 1;
    
    -- Obtener mes y año actual
    mes_actual := EXTRACT(MONTH FROM CURRENT_DATE);
    año_actual := EXTRACT(YEAR FROM CURRENT_DATE);
    
    -- Para cada cliente activo
    FOR cliente_record IN 
        SELECT id, tipo_plan, precio_plan 
        FROM clientes 
        WHERE estado = 'activo'
    LOOP
        -- Verificar si ya existe la cuota para este mes
        IF NOT EXISTS (
            SELECT 1 FROM cuotas_mensuales 
            WHERE cliente_id = cliente_record.id 
            AND mes = mes_actual 
            AND año = año_actual
        ) THEN
            -- Calcular fecha de vencimiento
            fecha_vencimiento := DATE(año_actual || '-' || 
                                    LPAD(mes_actual::TEXT, 2, '0') || '-' || 
                                    LPAD(config_record.dia_vencimiento::TEXT, 2, '0'));
            
            -- Insertar cuota mensual
            INSERT INTO cuotas_mensuales (
                cliente_id, mes, año, monto, fecha_vencimiento, estado
            ) VALUES (
                cliente_record.id, 
                mes_actual, 
                año_actual, 
                cliente_record.precio_plan, 
                fecha_vencimiento, 
                'pendiente'
            );
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- 8. Función para actualizar estado de pagos de clientes
CREATE OR REPLACE FUNCTION actualizar_estado_pagos_clientes()
RETURNS void AS $$
DECLARE
    cliente_record RECORD;
    config_record RECORD;
    cuotas_vencidas INTEGER;
    monto_deuda DECIMAL(10,2);
    fecha_ultimo_pago DATE;
BEGIN
    -- Obtener configuración
    SELECT * INTO config_record FROM configuracion_pagos LIMIT 1;
    
    -- Para cada cliente
    FOR cliente_record IN SELECT id FROM clientes WHERE estado = 'activo'
    LOOP
        -- Contar cuotas vencidas
        SELECT COUNT(*), COALESCE(SUM(monto), 0)
        INTO cuotas_vencidas, monto_deuda
        FROM cuotas_mensuales 
        WHERE cliente_id = cliente_record.id 
        AND estado = 'vencido';
        
        -- Obtener fecha del último pago
        SELECT MAX(fecha_pago) INTO fecha_ultimo_pago
        FROM historial_pagos_cliente 
        WHERE cliente_id = cliente_record.id;
        
        -- Actualizar cliente
        UPDATE clientes SET
            meses_pendientes = cuotas_vencidas,
            monto_total_deuda = monto_deuda,
            fecha_ultimo_pago = fecha_ultimo_pago,
            estado_pago = CASE 
                WHEN cuotas_vencidas = 0 THEN 'al_dia'
                WHEN cuotas_vencidas = 1 THEN 'proximo_vencimiento'
                WHEN cuotas_vencidas <= 3 THEN 'vencido'
                ELSE 'corte_pendiente'
            END
        WHERE id = cliente_record.id;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- 9. Trigger para actualizar cuotas cuando se crea un pago
CREATE OR REPLACE FUNCTION actualizar_cuotas_despues_pago()
RETURNS TRIGGER AS $$
DECLARE
    cliente_record RECORD;
    cuota_record RECORD;
    meses_cubiertos INTEGER;
    monto_restante DECIMAL(10,2);
BEGIN
    -- Obtener información del cliente
    SELECT * INTO cliente_record FROM clientes WHERE id = NEW.cliente_id;
    
    -- Insertar en historial
    INSERT INTO historial_pagos_cliente (
        cliente_id, pago_id, monto_pagado, concepto, fecha_pago
    ) VALUES (
        NEW.cliente_id, NEW.id, NEW.monto, NEW.concepto, NEW.fecha_pago::DATE
    );
    
    -- Actualizar cuotas pendientes
    monto_restante := NEW.monto;
    
    FOR cuota_record IN 
        SELECT id, monto 
        FROM cuotas_mensuales 
        WHERE cliente_id = NEW.cliente_id 
        AND estado = 'pendiente' 
        ORDER BY fecha_vencimiento ASC
    LOOP
        IF monto_restante >= cuota_record.monto THEN
            -- Pagar cuota completa
            UPDATE cuotas_mensuales SET
                estado = 'pagado',
                fecha_pago = CURRENT_DATE,
                pago_id = NEW.id
            WHERE id = cuota_record.id;
            
            monto_restante := monto_restante - cuota_record.monto;
        ELSE
            -- Pago parcial (no implementado en esta versión)
            EXIT;
        END IF;
    END LOOP;
    
    -- Actualizar estado del cliente
    PERFORM actualizar_estado_pagos_clientes();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 10. Crear trigger
DROP TRIGGER IF EXISTS trigger_actualizar_cuotas ON pagos;
CREATE TRIGGER trigger_actualizar_cuotas
    AFTER INSERT ON pagos
    FOR EACH ROW
    EXECUTE FUNCTION actualizar_cuotas_despues_pago();

-- 11. Función para marcar cuotas vencidas
CREATE OR REPLACE FUNCTION marcar_cuotas_vencidas()
RETURNS void AS $$
DECLARE
    config_record RECORD;
BEGIN
    -- Obtener configuración
    SELECT * INTO config_record FROM configuracion_pagos LIMIT 1;
    
    -- Marcar cuotas vencidas
    UPDATE cuotas_mensuales SET
        estado = 'vencido'
    WHERE estado = 'pendiente' 
    AND fecha_vencimiento < (CURRENT_DATE - config_record.dias_gracia);
    
    -- Actualizar estado de clientes
    PERFORM actualizar_estado_pagos_clientes();
END;
$$ LANGUAGE plpgsql;

-- 12. Comentarios para documentación
COMMENT ON TABLE cuotas_mensuales IS 'Control de cuotas mensuales por cliente';
COMMENT ON TABLE historial_pagos_cliente IS 'Historial completo de pagos por cliente';
COMMENT ON TABLE configuracion_pagos IS 'Configuración del sistema de pagos';
COMMENT ON FUNCTION generar_cuotas_mensuales() IS 'Genera cuotas mensuales automáticamente';
COMMENT ON FUNCTION actualizar_estado_pagos_clientes() IS 'Actualiza el estado de pagos de todos los clientes';
COMMENT ON FUNCTION marcar_cuotas_vencidas() IS 'Marca cuotas como vencidas según configuración'; 