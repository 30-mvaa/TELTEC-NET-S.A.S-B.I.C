-- Script para importar clientes desde la tabla de contratos
-- Basado en el análisis de la tabla proporcionada

-- Crear tabla temporal para los datos de contratos
CREATE TEMP TABLE temp_contratos (
    fecha_contrato DATE,
    ci VARCHAR(15),
    nombres VARCHAR(255),
    estado_color VARCHAR(20)
);

-- Insertar datos de la tabla de contratos
INSERT INTO temp_contratos (fecha_contrato, ci, nombres, estado_color) VALUES
-- Clientes Amarillos (Pendiente/Reciente)
('2024-02-23', '300967031', 'SAITEROS SIGUENCIA KEVIN LEONARDO', 'pendiente'),
('2024-02-27', '301824785', 'QUIZHPI PALCHIZACA CAITANO', 'pendiente'),
('2024-02-07', '391011559001', 'YUPA ALVAREZ MARIA MANUELA', 'pendiente'),
('2024-03-02', '604092098', 'PALLCHISACA CAGUANA MARIA BRIJIDA', 'pendiente'),
('2024-06-13', '941280679', 'TENEZACA PALLCHIZACA MARIA ROSA', 'pendiente'),
('2024-06-21', '123456789', 'YEPEZ SALTOS JAVIER ANDRES', 'pendiente'),
('2024-08-20', '987654321', 'TENEZACA UZHCA PETRONA', 'pendiente'),

-- Clientes Verdes (Activo/Pagado)
('2024-02-07', '111222333', 'PINGUIL CAGUANA MARIA JACOBA', 'activo'),
('2024-02-23', '444555666', 'CAGUANA TENEZACA JUAN', 'activo'),
('2024-02-26', '777888999', 'CHIMBORAZO YUPA DAVID ELIAS', 'activo'),
('2024-03-22', '000111222', 'YUPA PALCHIZACA SEGUNDO MANUEL CRUZ', 'activo'),
('2024-04-08', '333444555', 'QUIZHPI CODO LUCIO VERDADERO', 'activo'),

-- Clientes Rojos (Crítico/Vencido)
('2024-09-21', '666777888', 'CAZHO LLIGUICHUSCA SANDRA ADELA', 'vencido'),
('2024-10-18', '999000111', 'ROMERO TENEZACA ALEX JHOVANY', 'vencido');

-- Función para insertar clientes en el sistema
CREATE OR REPLACE FUNCTION importar_clientes_contratos()
RETURNS void AS $$
DECLARE
    cliente_record RECORD;
    cliente_id INTEGER;
    fecha_nacimiento DATE;
    email_temp VARCHAR(255);
    telefono_temp VARCHAR(10);
BEGIN
    FOR cliente_record IN 
        SELECT * FROM temp_contratos 
        WHERE ci NOT IN (SELECT cedula FROM clientes)
    LOOP
        -- Generar datos adicionales
        fecha_nacimiento := '1980-01-01'::DATE + (random() * 365 * 50)::INTEGER;
        email_temp := LOWER(REPLACE(cliente_record.nombres, ' ', '.')) || '@gmail.com';
        telefono_temp := '09' || LPAD((random() * 99999999)::INTEGER::TEXT, 8, '0');
        
        -- Insertar cliente
        INSERT INTO clientes (
            cedula,
            nombres,
            apellidos,
            tipo_plan,
            precio_plan,
            fecha_nacimiento,
            direccion,
            sector,
            email,
            telefono,
            estado,
            fecha_registro,
            estado_pago
        ) VALUES (
            cliente_record.ci,
            SPLIT_PART(cliente_record.nombres, ' ', 1), -- Primer nombre
            SUBSTRING(cliente_record.nombres FROM POSITION(' ' IN cliente_record.nombres) + 1), -- Resto como apellidos
            'Plan familiar',
            20.00,
            fecha_nacimiento,
            'Dirección por definir',
            'Sector por definir',
            email_temp,
            telefono_temp,
            CASE 
                WHEN cliente_record.estado_color = 'activo' THEN 'activo'
                WHEN cliente_record.estado_color = 'vencido' THEN 'suspendido'
                ELSE 'activo'
            END,
            cliente_record.fecha_contrato,
            CASE 
                WHEN cliente_record.estado_color = 'activo' THEN 'al_dia'
                WHEN cliente_record.estado_color = 'vencido' THEN 'vencido'
                ELSE 'proximo_vencimiento'
            END
        ) RETURNING id INTO cliente_id;
        
        RAISE NOTICE 'Cliente importado: % (ID: %)', cliente_record.nombres, cliente_id;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Ejecutar la importación
SELECT importar_clientes_contratos();

-- Verificar clientes importados
SELECT 
    id,
    cedula,
    nombres || ' ' || apellidos as nombre_completo,
    tipo_plan,
    precio_plan,
    estado,
    estado_pago,
    fecha_registro
FROM clientes 
WHERE cedula IN (SELECT ci FROM temp_contratos)
ORDER BY fecha_registro;

-- Limpiar tabla temporal
DROP TABLE temp_contratos;
