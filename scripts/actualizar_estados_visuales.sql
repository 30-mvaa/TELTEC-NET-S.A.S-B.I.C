-- Script para actualizar estados visuales basados en el color-coding
-- Sistema de colores: Verde (activo), Amarillo (pendiente), Rojo (vencido)

-- Función para calcular estado visual basado en fechas y pagos
CREATE OR REPLACE FUNCTION calcular_estado_visual()
RETURNS void AS $$
DECLARE
    cliente_record RECORD;
    meses_atraso INTEGER;
    dias_ultimo_pago INTEGER;
    estado_visual VARCHAR(20);
BEGIN
    FOR cliente_record IN SELECT * FROM clientes WHERE estado = 'activo'
    LOOP
        -- Calcular meses de atraso
        IF cliente_record.fecha_ultimo_pago IS NOT NULL THEN
            meses_atraso := EXTRACT(MONTH FROM AGE(CURRENT_DATE, cliente_record.fecha_ultimo_pago)) + 
                           EXTRACT(YEAR FROM AGE(CURRENT_DATE, cliente_record.fecha_ultimo_pago)) * 12;
        ELSE
            meses_atraso := EXTRACT(MONTH FROM AGE(CURRENT_DATE, cliente_record.fecha_registro)) + 
                           EXTRACT(YEAR FROM AGE(CURRENT_DATE, cliente_record.fecha_registro)) * 12;
        END IF;
        
        -- Calcular días desde el último pago
        IF cliente_record.fecha_ultimo_pago IS NOT NULL THEN
            dias_ultimo_pago := EXTRACT(DAY FROM AGE(CURRENT_DATE, cliente_record.fecha_ultimo_pago));
        ELSE
            dias_ultimo_pago := EXTRACT(DAY FROM AGE(CURRENT_DATE, cliente_record.fecha_registro));
        END IF;
        
        -- Determinar estado visual
        IF meses_atraso >= 3 THEN
            estado_visual := 'rojo'; -- Crítico/Vencido
        ELSIF meses_atraso >= 1 OR dias_ultimo_pago >= 30 THEN
            estado_visual := 'amarillo'; -- Pendiente/Reciente
        ELSE
            estado_visual := 'verde'; -- Activo/Pagado
        END IF;
        
        -- Actualizar estado del cliente
        UPDATE clientes SET
            estado_pago = CASE 
                WHEN estado_visual = 'verde' THEN 'al_dia'
                WHEN estado_visual = 'amarillo' THEN 'proximo_vencimiento'
                WHEN estado_visual = 'rojo' THEN 'vencido'
                ELSE 'al_dia'
            END,
            meses_pendientes = CASE 
                WHEN meses_atraso > 0 THEN meses_atraso
                ELSE 0
            END,
            monto_total_deuda = CASE 
                WHEN meses_atraso > 0 THEN precio_plan * meses_atraso
                ELSE 0.00
            END
        WHERE id = cliente_record.id;
        
        RAISE NOTICE 'Cliente %: % - Estado: % (meses atraso: %, días: %)', 
            cliente_record.id, 
            cliente_record.nombres || ' ' || cliente_record.apellidos,
            estado_visual,
            meses_atraso,
            dias_ultimo_pago;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Ejecutar actualización de estados visuales
SELECT calcular_estado_visual();

-- Verificar distribución de estados
SELECT 
    estado_pago,
    COUNT(*) as cantidad,
    CASE 
        WHEN estado_pago = 'al_dia' THEN '🟢 Verde (Activo)'
        WHEN estado_pago = 'proximo_vencimiento' THEN '🟡 Amarillo (Pendiente)'
        WHEN estado_pago = 'vencido' THEN '🔴 Rojo (Vencido)'
        ELSE '⚪ Sin estado'
    END as estado_visual
FROM clientes 
WHERE estado = 'activo'
GROUP BY estado_pago
ORDER BY 
    CASE estado_pago
        WHEN 'al_dia' THEN 1
        WHEN 'proximo_vencimiento' THEN 2
        WHEN 'vencido' THEN 3
        ELSE 4
    END;

-- Mostrar clientes por estado visual
SELECT 
    id,
    cedula,
    nombres || ' ' || apellidos as nombre_completo,
    fecha_registro,
    fecha_ultimo_pago,
    meses_pendientes,
    monto_total_deuda,
    CASE 
        WHEN estado_pago = 'al_dia' THEN '🟢 Verde'
        WHEN estado_pago = 'proximo_vencimiento' THEN '🟡 Amarillo'
        WHEN estado_pago = 'vencido' THEN '🔴 Rojo'
        ELSE '⚪ Sin estado'
    END as estado_visual
FROM clientes 
WHERE estado = 'activo'
ORDER BY 
    CASE estado_pago
        WHEN 'al_dia' THEN 1
        WHEN 'proximo_vencimiento' THEN 2
        WHEN 'vencido' THEN 3
        ELSE 4
    END,
    fecha_registro;
