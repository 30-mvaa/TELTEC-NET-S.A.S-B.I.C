CREATE OR REPLACE FUNCTION generar_cuotas_mensuales()
RETURNS void AS $$
DECLARE
    cliente RECORD;
    fecha_inicio DATE;
    fecha_actual DATE := CURRENT_DATE;
    v_mes INT;
    v_anio INT;
    fecha_cuota DATE;
BEGIN
    FOR cliente IN SELECT id, fecha_registro, precio_plan FROM clientes WHERE estado = 'activo' LOOP
        fecha_inicio := date_trunc('month', cliente.fecha_registro);
        WHILE fecha_inicio <= date_trunc('month', fecha_actual) LOOP
            v_mes := EXTRACT(MONTH FROM fecha_inicio);
            v_anio := EXTRACT(YEAR FROM fecha_inicio);
            -- Solo insertar si no existe ya una cuota para ese mes/año
            IF NOT EXISTS (
                SELECT 1 FROM cuotas_mensuales
                WHERE cliente_id = cliente.id AND mes = v_mes AND año = v_anio
            ) THEN
                -- Fecha de vencimiento: el 5 del mes siguiente, por ejemplo
                fecha_cuota := (fecha_inicio + INTERVAL '1 month')::date;
                fecha_cuota := fecha_cuota + (5 - 1); -- 5 = día de vencimiento
                INSERT INTO cuotas_mensuales (cliente_id, mes, año, monto, fecha_vencimiento, estado)
                VALUES (cliente.id, v_mes, v_anio, cliente.precio_plan, fecha_cuota, 'pendiente');
            END IF;
            -- Siguiente mes
            fecha_inicio := (fecha_inicio + INTERVAL '1 month')::date;
        END LOOP;
    END LOOP;
END;
$$ LANGUAGE plpgsql; 