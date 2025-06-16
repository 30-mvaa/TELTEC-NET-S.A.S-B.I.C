-- SCRIPT ACTUALIZADO PARA POSTGRESQL
-- Ejecutar como superusuario de PostgreSQL

-- Crear base de datos
CREATE DATABASE teltec_db
    WITH 
    OWNER = postgres
    ENCODING = 'UTF8'
    LC_COLLATE = 'es_ES.UTF-8'
    LC_CTYPE = 'es_ES.UTF-8'
    TABLESPACE = pg_default
    CONNECTION LIMIT = -1;

-- Conectar a la base de datos
\c teltec_db;

-- Crear extensiones útiles
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Crear tabla de usuarios del sistema
CREATE TABLE IF NOT EXISTS usuarios (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    nombre VARCHAR(255) NOT NULL,
    rol VARCHAR(50) NOT NULL CHECK (rol IN ('administrador', 'economia', 'atencion_cliente')),
    activo BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Crear tabla de clientes
CREATE TABLE IF NOT EXISTS clientes (
    id SERIAL PRIMARY KEY,
    cedula VARCHAR(20) UNIQUE NOT NULL,
    nombres VARCHAR(255) NOT NULL,
    apellidos VARCHAR(255) NOT NULL,
    tipo_plan VARCHAR(100) NOT NULL,
    fecha_nacimiento DATE NOT NULL,
    edad INTEGER GENERATED ALWAYS AS (
        EXTRACT(YEAR FROM AGE(CURRENT_DATE, fecha_nacimiento))
    ) STORED,
    direccion TEXT NOT NULL,
    sector VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    telefono VARCHAR(20) NOT NULL,
    estado VARCHAR(20) DEFAULT 'activo' CHECK (estado IN ('activo', 'inactivo', 'suspendido')),
    fecha_registro TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Crear tabla de pagos/recaudación
CREATE TABLE IF NOT EXISTS pagos (
    id SERIAL PRIMARY KEY,
    cliente_id INTEGER REFERENCES clientes(id) ON DELETE CASCADE,
    monto DECIMAL(10,2) NOT NULL CHECK (monto > 0),
    fecha_pago DATE NOT NULL DEFAULT CURRENT_DATE,
    metodo_pago VARCHAR(50) NOT NULL,
    concepto TEXT NOT NULL,
    estado VARCHAR(20) DEFAULT 'completado' CHECK (estado IN ('completado', 'pendiente', 'fallido')),
    comprobante_enviado BOOLEAN DEFAULT FALSE,
    numero_comprobante VARCHAR(50) UNIQUE NOT NULL,
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Crear tabla de gastos
CREATE TABLE IF NOT EXISTS gastos (
    id SERIAL PRIMARY KEY,
    descripcion TEXT NOT NULL,
    categoria VARCHAR(100) NOT NULL,
    monto DECIMAL(10,2) NOT NULL CHECK (monto > 0),
    fecha_gasto DATE NOT NULL DEFAULT CURRENT_DATE,
    proveedor VARCHAR(255),
    metodo_pago VARCHAR(50),
    comprobante_url VARCHAR(500),
    usuario_id INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Crear tabla de notificaciones
CREATE TABLE IF NOT EXISTS notificaciones (
    id SERIAL PRIMARY KEY,
    cliente_id INTEGER REFERENCES clientes(id) ON DELETE CASCADE,
    tipo VARCHAR(50) NOT NULL CHECK (tipo IN ('pago_proximo', 'pago_vencido', 'corte_servicio', 'bienvenida')),
    mensaje TEXT NOT NULL,
    fecha_envio TIMESTAMP WITH TIME ZONE,
    estado VARCHAR(20) DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'enviado', 'fallido')),
    canal VARCHAR(20) DEFAULT 'whatsapp' CHECK (canal IN ('whatsapp', 'email', 'sms')),
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Crear tabla de configuración del sistema
CREATE TABLE IF NOT EXISTS configuracion (
    id SERIAL PRIMARY KEY,
    clave VARCHAR(100) UNIQUE NOT NULL,
    valor TEXT NOT NULL,
    descripcion TEXT,
    fecha_actualizacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Crear tabla de auditoría
CREATE TABLE IF NOT EXISTS auditoria (
    id SERIAL PRIMARY KEY,
    tabla VARCHAR(50) NOT NULL,
    operacion VARCHAR(10) NOT NULL CHECK (operacion IN ('INSERT', 'UPDATE', 'DELETE')),
    registro_id INTEGER NOT NULL,
    datos_anteriores JSONB,
    datos_nuevos JSONB,
    usuario_id INTEGER REFERENCES usuarios(id),
    fecha_operacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Crear índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_clientes_cedula ON clientes(cedula);
CREATE INDEX IF NOT EXISTS idx_clientes_email ON clientes(email);
CREATE INDEX IF NOT EXISTS idx_clientes_estado ON clientes(estado);
CREATE INDEX IF NOT EXISTS idx_clientes_sector ON clientes(sector);
CREATE INDEX IF NOT EXISTS idx_clientes_tipo_plan ON clientes(tipo_plan);
CREATE INDEX IF NOT EXISTS idx_clientes_nombres_apellidos ON clientes(nombres, apellidos);

CREATE INDEX IF NOT EXISTS idx_pagos_cliente_id ON pagos(cliente_id);
CREATE INDEX IF NOT EXISTS idx_pagos_fecha ON pagos(fecha_pago);
CREATE INDEX IF NOT EXISTS idx_pagos_estado ON pagos(estado);
CREATE INDEX IF NOT EXISTS idx_pagos_metodo ON pagos(metodo_pago);
CREATE INDEX IF NOT EXISTS idx_pagos_comprobante ON pagos(numero_comprobante);

CREATE INDEX IF NOT EXISTS idx_gastos_categoria ON gastos(categoria);
CREATE INDEX IF NOT EXISTS idx_gastos_fecha ON gastos(fecha_gasto);
CREATE INDEX IF NOT EXISTS idx_gastos_usuario ON gastos(usuario_id);

CREATE INDEX IF NOT EXISTS idx_notificaciones_cliente_id ON notificaciones(cliente_id);
CREATE INDEX IF NOT EXISTS idx_notificaciones_estado ON notificaciones(estado);
CREATE INDEX IF NOT EXISTS idx_notificaciones_tipo ON notificaciones(tipo);

-- Índices para búsqueda de texto
CREATE INDEX IF NOT EXISTS idx_clientes_search ON clientes USING gin((nombres || ' ' || apellidos || ' ' || cedula || ' ' || email) gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_gastos_search ON gastos USING gin((descripcion || ' ' || categoria || ' ' || COALESCE(proveedor, '')) gin_trgm_ops);

-- Crear función para actualizar fecha_actualizacion
CREATE OR REPLACE FUNCTION actualizar_fecha_actualizacion()
RETURNS TRIGGER AS $$
BEGIN
    NEW.fecha_actualizacion = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Crear triggers para actualizar fecha_actualizacion
CREATE TRIGGER trigger_usuarios_fecha_actualizacion
    BEFORE UPDATE ON usuarios
    FOR EACH ROW
    EXECUTE FUNCTION actualizar_fecha_actualizacion();

CREATE TRIGGER trigger_clientes_fecha_actualizacion
    BEFORE UPDATE ON clientes
    FOR EACH ROW
    EXECUTE FUNCTION actualizar_fecha_actualizacion();

CREATE TRIGGER trigger_configuracion_fecha_actualizacion
    BEFORE UPDATE ON configuracion
    FOR EACH ROW
    EXECUTE FUNCTION actualizar_fecha_actualizacion();

-- Insertar usuarios por defecto con contraseñas hasheadas
INSERT INTO usuarios (email, password_hash, nombre, rol) VALUES
('admin@teltec.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/VjPoyNdO2', 'Administrador TelTec', 'administrador'),
('economia@teltec.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/VjPoyNdO2', 'Departamento Economía', 'economia'),
('atencion@teltec.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/VjPoyNdO2', 'Atención al Cliente', 'atencion_cliente')
ON CONFLICT (email) DO NOTHING;

-- Insertar configuración inicial del sistema
INSERT INTO configuracion (clave, valor, descripcion) VALUES
('whatsapp_numero', '0999859689', 'Número de WhatsApp para notificaciones automáticas'),
('email_sistema', 'vangamarca4@gmail.com', 'Email principal del sistema para notificaciones'),
('dias_aviso_pago', '5', 'Días de aviso antes del vencimiento de pago'),
('dias_corte_servicio', '5', 'Días después del vencimiento para corte de servicio'),
('empresa_nombre', 'TelTec Net', 'Nombre de la empresa'),
('empresa_direccion', 'Av. Principal 123, Ciudad', 'Dirección de la empresa'),
('empresa_telefono', '0999859689', 'Teléfono principal de la empresa'),
('moneda', 'USD', 'Moneda utilizada en el sistema'),
('iva_porcentaje', '12', 'Porcentaje de IVA aplicado'),
('backup_automatico', 'true', 'Activar backup automático de la base de datos')
ON CONFLICT (clave) DO NOTHING;

-- Crear vista para reportes de clientes
CREATE OR REPLACE VIEW vista_clientes_completa AS
SELECT 
    c.*,
    COUNT(p.id) as total_pagos,
    COALESCE(SUM(p.monto), 0) as total_pagado,
    MAX(p.fecha_pago) as ultimo_pago,
    CASE 
        WHEN MAX(p.fecha_pago) IS NULL THEN 'Sin pagos'
        WHEN MAX(p.fecha_pago) < CURRENT_DATE - INTERVAL '30 days' THEN 'Moroso'
        WHEN MAX(p.fecha_pago) < CURRENT_DATE - INTERVAL '25 days' THEN 'Por vencer'
        ELSE 'Al día'
    END as estado_pago
FROM clientes c
LEFT JOIN pagos p ON c.id = p.cliente_id AND p.estado = 'completado'
GROUP BY c.id;

-- Crear vista para dashboard
CREATE OR REPLACE VIEW vista_dashboard AS
SELECT 
    (SELECT COUNT(*) FROM clientes WHERE estado = 'activo') as clientes_activos,
    (SELECT COUNT(*) FROM clientes WHERE estado = 'suspendido') as clientes_suspendidos,
    (SELECT COUNT(*) FROM clientes WHERE estado = 'inactivo') as clientes_inactivos,
    (SELECT COALESCE(SUM(monto), 0) FROM pagos WHERE DATE_PART('month', fecha_pago) = DATE_PART('month', CURRENT_DATE) AND estado = 'completado') as recaudacion_mes,
    (SELECT COALESCE(SUM(monto), 0) FROM gastos WHERE DATE_PART('month', fecha_gasto) = DATE_PART('month', CURRENT_DATE)) as gastos_mes,
    (SELECT COUNT(*) FROM notificaciones WHERE estado = 'pendiente') as notificaciones_pendientes;

-- Crear función para generar número de comprobante
CREATE OR REPLACE FUNCTION generar_numero_comprobante()
RETURNS TEXT AS $$
DECLARE
    numero TEXT;
    existe BOOLEAN;
BEGIN
    LOOP
        numero := 'COMP-' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '-' || LPAD((RANDOM() * 9999)::INTEGER::TEXT, 4, '0');
        SELECT EXISTS(SELECT 1 FROM pagos WHERE numero_comprobante = numero) INTO existe;
        IF NOT existe THEN
            EXIT;
        END IF;
    END LOOP;
    RETURN numero;
END;
$$ LANGUAGE plpgsql;

-- Crear función para trigger de número de comprobante
CREATE OR REPLACE FUNCTION asignar_numero_comprobante()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.numero_comprobante IS NULL OR NEW.numero_comprobante = '' THEN
        NEW.numero_comprobante := generar_numero_comprobante();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger para asignar número de comprobante automáticamente
CREATE TRIGGER trigger_pagos_numero_comprobante
    BEFORE INSERT ON pagos
    FOR EACH ROW
    EXECUTE FUNCTION asignar_numero_comprobante();

-- Crear función para auditoría
CREATE OR REPLACE FUNCTION auditoria_trigger()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        INSERT INTO auditoria (tabla, operacion, registro_id, datos_anteriores)
        VALUES (TG_TABLE_NAME, TG_OP, OLD.id, row_to_json(OLD));
        RETURN OLD;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO auditoria (tabla, operacion, registro_id, datos_anteriores, datos_nuevos)
        VALUES (TG_TABLE_NAME, TG_OP, NEW.id, row_to_json(OLD), row_to_json(NEW));
        RETURN NEW;
    ELSIF TG_OP = 'INSERT' THEN
        INSERT INTO auditoria (tabla, operacion, registro_id, datos_nuevos)
        VALUES (TG_TABLE_NAME, TG_OP, NEW.id, row_to_json(NEW));
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Aplicar auditoría a tablas importantes
CREATE TRIGGER trigger_auditoria_clientes
    AFTER INSERT OR UPDATE OR DELETE ON clientes
    FOR EACH ROW EXECUTE FUNCTION auditoria_trigger();

CREATE TRIGGER trigger_auditoria_pagos
    AFTER INSERT OR UPDATE OR DELETE ON pagos
    FOR EACH ROW EXECUTE FUNCTION auditoria_trigger();

CREATE TRIGGER trigger_auditoria_usuarios
    AFTER INSERT OR UPDATE OR DELETE ON usuarios
    FOR EACH ROW EXECUTE FUNCTION auditoria_trigger();

-- Otorgar permisos
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO postgres;
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO postgres;

-- Mensaje de confirmación
DO $$
BEGIN
    RAISE NOTICE '✅ Base de datos TelTec creada exitosamente con todas las tablas, índices, triggers y funciones.';
    RAISE NOTICE '📊 Tablas creadas: usuarios, clientes, pagos, gastos, notificaciones, configuracion, auditoria';
    RAISE NOTICE '🔍 Índices optimizados para búsquedas y rendimiento';
    RAISE NOTICE '⚡ Triggers configurados para auditoría y automatización';
    RAISE NOTICE '👤 Usuarios por defecto creados (contraseña: admin123, economia123, atencion123)';
END $$;
