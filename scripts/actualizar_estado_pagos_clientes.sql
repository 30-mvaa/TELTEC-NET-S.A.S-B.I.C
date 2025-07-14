CREATE OR REPLACE FUNCTION actualizar_estado_pagos_clientes()
RETURNS void AS $$
DECLARE
    c RECORD;
    cuotas_pendientes INT;
    monto_deuda NUMERIC;
    v_fecha_ultimo_pago DATE;
    v_fecha_vencimiento DATE;
    v_estado_pago TEXT;
BEGIN
    FOR c IN SELECT * FROM clientes WHERE estado = 'activo' LOOP
        -- Cuotas pendientes
        SELECT COUNT(*) INTO cuotas_pendientes FROM cuotas_mensuales WHERE cliente_id = c.id AND estado = 'pendiente';
        -- Monto total de deuda
        SELECT COALESCE(SUM(monto),0) INTO monto_deuda FROM cuotas_mensuales WHERE cliente_id = c.id AND estado = 'pendiente';
        -- Fecha del último pago
        SELECT MAX(fecha_pago) INTO v_fecha_ultimo_pago FROM cuotas_mensuales WHERE cliente_id = c.id AND estado = 'pagado';
        -- Fecha de la próxima cuota pendiente
        SELECT MIN(fecha_vencimiento) INTO v_fecha_vencimiento FROM cuotas_mensuales WHERE cliente_id = c.id AND estado = 'pendiente';
        -- Estado de pago
        IF cuotas_pendientes = 0 THEN
            v_estado_pago := 'al_dia';
        ELSIF v_fecha_vencimiento IS NOT NULL AND v_fecha_vencimiento < CURRENT_DATE THEN
            v_estado_pago := 'vencido';
        ELSIF v_fecha_vencimiento IS NOT NULL AND v_fecha_vencimiento >= CURRENT_DATE AND v_fecha_vencimiento <= CURRENT_DATE + INTERVAL '5 days' THEN
            v_estado_pago := 'proximo_vencimiento';
        ELSE
            v_estado_pago := 'corte_pendiente';
        END IF;
        -- Actualizar cliente
        UPDATE clientes SET
            fecha_ultimo_pago = v_fecha_ultimo_pago,
            meses_pendientes = cuotas_pendientes,
            monto_total_deuda = monto_deuda,
            fecha_vencimiento_pago = v_fecha_vencimiento,
            estado_pago = v_estado_pago
        WHERE id = c.id;
    END LOOP;
END;
$$ LANGUAGE plpgsql; 