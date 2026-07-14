-- ===================================================
-- SQL para TelTec Net Backend (PostgreSQL)
-- Tablas: planes, sectores, sitio_web_*
-- ===================================================

-- 1. TABLAS LEGACY
CREATE TABLE IF NOT EXISTS public.planes (
    id_plan integer NOT NULL,
    tipo_plan character varying(50) NOT NULL,
    precio numeric(10,2) NOT NULL,
    descripcion text,
    estado character varying(20) DEFAULT 'activo',
    fecha_creacion timestamp DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion timestamp DEFAULT CURRENT_TIMESTAMP
);

CREATE SEQUENCE IF NOT EXISTS public.planes_id_plan_seq
    AS integer START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
ALTER TABLE public.planes ALTER COLUMN id_plan SET DEFAULT nextval('public.planes_id_plan_seq');
ALTER SEQUENCE public.planes_id_plan_seq OWNED BY public.planes.id_plan;

CREATE TABLE IF NOT EXISTS public.sectores (
    id_sector integer NOT NULL,
    nombre_sector character varying(100) NOT NULL,
    descripcion text,
    estado character varying(20) DEFAULT 'activo',
    fecha_creacion timestamp DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion timestamp DEFAULT CURRENT_TIMESTAMP
);

CREATE SEQUENCE IF NOT EXISTS public.sectores_id_sector_seq
    AS integer START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
ALTER TABLE public.sectores ALTER COLUMN id_sector SET DEFAULT nextval('public.sectores_id_sector_seq');
ALTER SEQUENCE public.sectores_id_sector_seq OWNED BY public.sectores.id_sector;

-- 2. TABLAS sitio_web
CREATE TABLE IF NOT EXISTS public.sitio_web_informacionsitio (
    id integer NOT NULL,
    titulo character varying(200) DEFAULT 'TelTec Net - Proveedor de Internet',
    subtitulo character varying(300) DEFAULT 'Conectando comunidades con tecnología de vanguardia',
    descripcion text DEFAULT 'Somos una empresa líder en servicios de internet de alta velocidad',
    lema character varying(200) DEFAULT 'Conectando tu mundo digital',
    fecha_actualizacion timestamp DEFAULT CURRENT_TIMESTAMP
);

CREATE SEQUENCE IF NOT EXISTS public.sitio_web_informacionsitio_id_seq
    AS integer START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
ALTER TABLE public.sitio_web_informacionsitio ALTER COLUMN id SET DEFAULT nextval('public.sitio_web_informacionsitio_id_seq');
ALTER SEQUENCE public.sitio_web_informacionsitio_id_seq OWNED BY public.sitio_web_informacionsitio.id;

CREATE TABLE IF NOT EXISTS public.sitio_web_empresa (
    id integer NOT NULL,
    nombre character varying(200) DEFAULT 'TelTec Net',
    descripcion text DEFAULT 'Empresa líder en servicios de internet de alta velocidad',
    direccion character varying(500) DEFAULT 'Sisid Centro, Cañar, Ecuador',
    telefono character varying(50) DEFAULT '+593 98 765 4321',
    email character varying(200) DEFAULT 'info@teltecnet.com',
    horario_atencion character varying(200) DEFAULT 'Lunes a Viernes: 8:00 AM - 6:00 PM',
    mision text DEFAULT 'Proporcionar servicios de internet de alta calidad',
    vision text DEFAULT 'Ser el proveedor de internet más confiable',
    valores text DEFAULT 'Confianza, Calidad, Innovación',
    fecha_actualizacion timestamp DEFAULT CURRENT_TIMESTAMP,
    ruc character varying(20) DEFAULT '1234567890001',
    horario character varying(200) DEFAULT 'Lunes a Viernes: 8:00 AM - 6:00 PM'
);

CREATE SEQUENCE IF NOT EXISTS public.sitio_web_empresa_id_seq
    AS integer START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
ALTER TABLE public.sitio_web_empresa ALTER COLUMN id SET DEFAULT nextval('public.sitio_web_empresa_id_seq');
ALTER SEQUENCE public.sitio_web_empresa_id_seq OWNED BY public.sitio_web_empresa.id;

CREATE TABLE IF NOT EXISTS public.sitio_web_servicio (
    id integer NOT NULL,
    nombre character varying(200) NOT NULL,
    descripcion text,
    precio numeric(10,2) DEFAULT 0.00,
    velocidad character varying(50),
    caracteristicas text,
    activo boolean DEFAULT true,
    fecha_creacion timestamp DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion timestamp DEFAULT CURRENT_TIMESTAMP,
    orden integer DEFAULT 0,
    icono character varying(50),
    imagen character varying(200)
);

CREATE SEQUENCE IF NOT EXISTS public.sitio_web_servicio_id_seq
    AS integer START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
ALTER TABLE public.sitio_web_servicio ALTER COLUMN id SET DEFAULT nextval('public.sitio_web_servicio_id_seq');
ALTER SEQUENCE public.sitio_web_servicio_id_seq OWNED BY public.sitio_web_servicio.id;

CREATE TABLE IF NOT EXISTS public.sitio_web_plan (
    id bigint NOT NULL,
    nombre character varying(200) NOT NULL,
    velocidad character varying(100) NOT NULL,
    precio numeric(10,2) NOT NULL,
    descripcion text NOT NULL,
    caracteristicas jsonb NOT NULL,
    popular boolean NOT NULL,
    activo boolean NOT NULL,
    orden integer NOT NULL,
    fecha_creacion timestamp with time zone NOT NULL,
    fecha_actualizacion timestamp with time zone NOT NULL
);

CREATE SEQUENCE IF NOT EXISTS public.sitio_web_plan_id_seq
    AS integer START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
ALTER TABLE public.sitio_web_plan ALTER COLUMN id SET DEFAULT nextval('public.sitio_web_plan_id_seq');
ALTER SEQUENCE public.sitio_web_plan_id_seq OWNED BY public.sitio_web_plan.id;

CREATE TABLE IF NOT EXISTS public.sitio_web_cobertura (
    id bigint NOT NULL,
    zona character varying(200) NOT NULL,
    descripcion text NOT NULL,
    coordenadas jsonb NOT NULL,
    activo boolean NOT NULL,
    orden integer NOT NULL,
    fecha_creacion timestamp with time zone NOT NULL,
    fecha_actualizacion timestamp with time zone NOT NULL
);

CREATE SEQUENCE IF NOT EXISTS public.sitio_web_cobertura_id_seq
    AS integer START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
ALTER TABLE public.sitio_web_cobertura ALTER COLUMN id SET DEFAULT nextval('public.sitio_web_cobertura_id_seq');
ALTER SEQUENCE public.sitio_web_cobertura_id_seq OWNED BY public.sitio_web_cobertura.id;

CREATE TABLE IF NOT EXISTS public.sitio_web_contacto (
    id bigint NOT NULL,
    tipo character varying(20) NOT NULL,
    titulo character varying(100) NOT NULL,
    valor character varying(300) NOT NULL,
    icono character varying(50),
    url character varying(200),
    activo boolean NOT NULL,
    orden integer NOT NULL,
    fecha_creacion timestamp with time zone NOT NULL,
    fecha_actualizacion timestamp with time zone NOT NULL
);

CREATE SEQUENCE IF NOT EXISTS public.sitio_web_contacto_id_seq
    AS integer START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
ALTER TABLE public.sitio_web_contacto ALTER COLUMN id SET DEFAULT nextval('public.sitio_web_contacto_id_seq');
ALTER SEQUENCE public.sitio_web_contacto_id_seq OWNED BY public.sitio_web_contacto.id;

CREATE TABLE IF NOT EXISTS public.sitio_web_redsocial (
    id integer NOT NULL,
    nombre character varying(100) NOT NULL,
    url character varying(500),
    icono character varying(100),
    activo boolean DEFAULT true,
    fecha_creacion timestamp DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion timestamp DEFAULT CURRENT_TIMESTAMP,
    tipo character varying(50) DEFAULT 'social'
);

CREATE SEQUENCE IF NOT EXISTS public.sitio_web_redsocial_id_seq
    AS integer START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
ALTER TABLE public.sitio_web_redsocial ALTER COLUMN id SET DEFAULT nextval('public.sitio_web_redsocial_id_seq');
ALTER SEQUENCE public.sitio_web_redsocial_id_seq OWNED BY public.sitio_web_redsocial.id;

CREATE TABLE IF NOT EXISTS public.sitio_web_carrusel (
    id bigint NOT NULL,
    titulo character varying(200) NOT NULL,
    descripcion text,
    imagen character varying(200) NOT NULL,
    video character varying(200),
    enlace character varying(200),
    activo boolean NOT NULL,
    orden integer NOT NULL,
    fecha_creacion timestamp with time zone NOT NULL,
    fecha_actualizacion timestamp with time zone NOT NULL
);

CREATE SEQUENCE IF NOT EXISTS public.sitio_web_carrusel_id_seq
    AS integer START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
ALTER TABLE public.sitio_web_carrusel ALTER COLUMN id SET DEFAULT nextval('public.sitio_web_carrusel_id_seq');
ALTER SEQUENCE public.sitio_web_carrusel_id_seq OWNED BY public.sitio_web_carrusel.id;

CREATE TABLE IF NOT EXISTS public.sitio_web_configuracionsitio (
    id integer NOT NULL,
    mostrar_estadisticas boolean DEFAULT true,
    mostrar_testimonios boolean DEFAULT true,
    mostrar_servicios boolean DEFAULT true,
    mostrar_contacto boolean DEFAULT true,
    tema_color character varying(50) DEFAULT 'blue',
    logo_url character varying(500) DEFAULT '/images/logo.png',
    favicon_url character varying(500) DEFAULT '/images/favicon.ico',
    fecha_actualizacion timestamp DEFAULT CURRENT_TIMESTAMP,
    mostrar_precios boolean DEFAULT true,
    modo_mantenimiento boolean DEFAULT false,
    mensaje_mantenimiento text DEFAULT 'Sitio en mantenimiento'
);

CREATE SEQUENCE IF NOT EXISTS public.sitio_web_configuracionsitio_id_seq
    AS integer START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
ALTER TABLE public.sitio_web_configuracionsitio ALTER COLUMN id SET DEFAULT nextval('public.sitio_web_configuracionsitio_id_seq');
ALTER SEQUENCE public.sitio_web_configuracionsitio_id_seq OWNED BY public.sitio_web_configuracionsitio.id;

CREATE TABLE IF NOT EXISTS public.sitio_web_header (
    id bigint NOT NULL,
    logo_url character varying(200),
    logo_alt character varying(200) NOT NULL,
    mostrar_menu boolean NOT NULL,
    color_fondo character varying(7) NOT NULL,
    color_texto character varying(7) NOT NULL,
    fecha_actualizacion timestamp with time zone NOT NULL
);

CREATE SEQUENCE IF NOT EXISTS public.sitio_web_header_id_seq
    AS integer START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
ALTER TABLE public.sitio_web_header ALTER COLUMN id SET DEFAULT nextval('public.sitio_web_header_id_seq');
ALTER SEQUENCE public.sitio_web_header_id_seq OWNED BY public.sitio_web_header.id;

CREATE TABLE IF NOT EXISTS public.sitio_web_footer (
    id bigint NOT NULL,
    texto_copyright character varying(300) NOT NULL,
    mostrar_redes_sociales boolean NOT NULL,
    mostrar_contacto boolean NOT NULL,
    color_fondo character varying(7) NOT NULL,
    color_texto character varying(7) NOT NULL,
    fecha_actualizacion timestamp with time zone NOT NULL
);

CREATE SEQUENCE IF NOT EXISTS public.sitio_web_footer_id_seq
    AS integer START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
ALTER TABLE public.sitio_web_footer ALTER COLUMN id SET DEFAULT nextval('public.sitio_web_footer_id_seq');
ALTER SEQUENCE public.sitio_web_footer_id_seq OWNED BY public.sitio_web_footer.id;

-- ===================================================
-- 3. DATOS
-- ===================================================

-- Planes (legacy)
INSERT INTO public.planes (id_plan, tipo_plan, precio, descripcion, estado, fecha_creacion, fecha_actualizacion) VALUES
(1, 'Plan familiar', 20.00, 'Plan completo para familias', 'activo', NOW(), NOW()),
(2, 'Plan Tercera Edad', 18.00, 'Plan especial para adultos mayores', 'activo', NOW(), NOW()),
(3, 'Plan Básico', 15.00, 'Plan básico de servicios', 'activo', NOW(), NOW()),
(4, 'Plan Negocios', 25.00, 'Plan para negocios', 'activo', NOW(), NOW())
ON CONFLICT (id_plan) DO NOTHING;

-- Sectores (legacy)
INSERT INTO public.sectores (id_sector, nombre_sector, descripcion, estado, fecha_creacion, fecha_actualizacion) VALUES
(1, 'Sisid Centro', 'Sector central de Sisid', 'activo', NOW(), NOW()),
(2, 'Caguanapamba', 'Sector de Caguanapamba', 'activo', NOW(), NOW()),
(3, 'Tambo', 'Sector del Tambo', 'activo', NOW(), NOW()),
(4, 'Chuichun', 'Sector de Chuichun', 'activo', NOW(), NOW()),
(5, 'Marcopamba', 'Sector de Marcopamba', 'activo', NOW(), NOW()),
(6, 'Cullcaloma', 'Sector de Cullcaloma', 'activo', NOW(), NOW()),
(7, 'Zarapamba', 'Sector de Zarapamba', 'activo', NOW(), NOW()),
(8, 'Galuay', 'Sector de Galuay', 'activo', NOW(), NOW()),
(9, 'Ingapirca', 'Sector de Ingapirca', 'activo', NOW(), NOW()),
(10, 'Centro', 'Centro principal', 'activo', NOW(), NOW())
ON CONFLICT (id_sector) DO NOTHING;

-- Informacion del sitio
INSERT INTO public.sitio_web_informacionsitio (id, titulo, subtitulo, descripcion, lema) VALUES
(1, 'TelTec Net - Internet de Alta Velocidad', 'Conectando comunidades con tecnología de vanguardia', 'Somos una empresa líder en servicios de internet de alta velocidad.', 'Conectando tu mundo digital')
ON CONFLICT (id) DO NOTHING;

-- Empresa
INSERT INTO public.sitio_web_empresa (id, nombre, telefono, email, direccion, horario, ruc) VALUES
(1, 'TelTec Net', '0984517703', 'teltecnet@outlook.com', 'CAÑAR - COMUNIDAD SISID', 'Lunes a Viernes: 8:00 AM - 6:00 PM', '1234567890001')
ON CONFLICT (id) DO NOTHING;

-- Planes (sitio_web)
INSERT INTO public.sitio_web_plan (id, nombre, velocidad, precio, descripcion, caracteristicas, popular, activo, orden, fecha_creacion, fecha_actualizacion) VALUES
(10, 'Plan Básico', '15 MB', 15.00, 'Perfecto para usuarios individuales.', '["Internet estable", "Soporte técnico", "Sin límite de datos", "Instalación incluida"]', false, true, 1, NOW(), NOW()),
(11, 'Plan Familiar', '30 MB', 20.00, 'Ideal para familias.', '["Internet de alta velocidad", "Soporte técnico 24/7", "Sin límite de datos", "Instalación gratuita"]', true, true, 2, NOW(), NOW()),
(12, 'Plan Empresarial', '50 MB', 35.00, 'Soluciones a medida para empresas.', '["Velocidad personalizada", "Soporte prioritario", "SLA garantizado", "Consultoría técnica"]', false, true, 3, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Servicios
INSERT INTO public.sitio_web_servicio (id, nombre, descripcion, activo, orden, icono) VALUES
(33, 'Internet para Emprendimientos', 'Conexión de alta velocidad para emprendedores.', true, 1, 'wifi'),
(34, 'Internet Empresarial', 'Soluciones de conectividad dedicada para empresas.', true, 2, 'building'),
(35, 'Cámaras de Seguridad', 'Sistemas de videovigilancia profesional EZVIZ.', true, 3, 'camera'),
(36, 'Desarrollo de Apps', 'Desarrollo de aplicaciones móviles y web.', true, 4, 'smartphone'),
(37, 'Soporte Técnico', 'Mantenimiento y soporte técnico especializado.', true, 5, 'settings')
ON CONFLICT (id) DO NOTHING;

-- Contactos
INSERT INTO public.sitio_web_contacto (id, tipo, titulo, valor, url, activo, orden, fecha_creacion, fecha_actualizacion) VALUES
(16, 'telefono', 'Teléfono Principal', '0984517703', 'tel:0984517703', true, 1, NOW(), NOW()),
(17, 'email', 'Email de Contacto', 'teltecnet@outlook.com', 'mailto:teltecnet@outlook.com', true, 2, NOW(), NOW()),
(18, 'whatsapp', 'WhatsApp', '0984517703', 'https://wa.me/593984517703', true, 3, NOW(), NOW()),
(19, 'direccion', 'Dirección', 'CAÑAR - COMUNIDAD SISID', '', true, 4, NOW(), NOW()),
(20, 'horario', 'Horario de Atención', 'Lunes a Viernes: 8:00 AM - 6:00 PM', '', true, 5, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Redes Sociales
INSERT INTO public.sitio_web_redsocial (id, nombre, url, tipo) VALUES
(31, 'Facebook', 'https://facebook.com/teltecnet', 'facebook'),
(32, 'Instagram', 'https://instagram.com/teltecnet', 'instagram'),
(33, 'TikTok', 'https://tiktok.com/@teltecnet', 'tiktok')
ON CONFLICT (id) DO NOTHING;

-- Header
INSERT INTO public.sitio_web_header (id, logo_url, logo_alt, mostrar_menu, color_fondo, color_texto, fecha_actualizacion) VALUES
(1, '/images/ttnet-logo.png', 'TelTec Net Logo', true, '#ffffff', '#000000', NOW())
ON CONFLICT (id) DO NOTHING;

-- Footer
INSERT INTO public.sitio_web_footer (id, texto_copyright, mostrar_redes_sociales, mostrar_contacto, color_fondo, color_texto, fecha_actualizacion) VALUES
(1, '© 2025 TelTec Net - Todos los derechos reservados', true, true, '#1f2937', '#ffffff', NOW())
ON CONFLICT (id) DO NOTHING;

-- Configuracion
INSERT INTO public.sitio_web_configuracionsitio (id, mostrar_precios, modo_mantenimiento) VALUES
(1, true, false)
ON CONFLICT (id) DO NOTHING;

-- Carrusel
INSERT INTO public.sitio_web_carrusel (id, titulo, descripcion, imagen, activo, orden, fecha_creacion, fecha_actualizacion) VALUES
(10, 'Internet de Alta Velocidad', 'Conectividad confiable para tu hogar y negocio', '/images/hero-1.jpg', true, 1, NOW(), NOW()),
(11, 'Soporte Técnico 24/7', 'Estamos siempre disponibles para ayudarte', '/images/hero-2.jpg', true, 2, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Cobertura
INSERT INTO public.sitio_web_cobertura (id, zona, descripcion, coordenadas, activo, orden, fecha_creacion, fecha_actualizacion) VALUES
(10, 'Centro de Azogues', 'Cobertura completa en el centro histórico.', '{"lat": -2.7397, "lng": -78.8486}', true, 1, NOW(), NOW()),
(11, 'El Tambo', 'Servicio extendido a la parroquia de El Tambo.', '{"lat": -2.8, "lng": -78.9}', true, 2, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- ===================================================
-- VERIFICAR DATOS
-- ===================================================
SELECT 'planes' as tabla, COUNT(*) as total FROM public.planes
UNION ALL SELECT 'sectores', COUNT(*) FROM public.sectores
UNION ALL SELECT 'sitio_web_informacionsitio', COUNT(*) FROM public.sitio_web_informacionsitio
UNION ALL SELECT 'sitio_web_empresa', COUNT(*) FROM public.sitio_web_empresa
UNION ALL SELECT 'sitio_web_servicio', COUNT(*) FROM public.sitio_web_servicio
UNION ALL SELECT 'sitio_web_plan', COUNT(*) FROM public.sitio_web_plan
UNION ALL SELECT 'sitio_web_contacto', COUNT(*) FROM public.sitio_web_contacto
UNION ALL SELECT 'sitio_web_redsocial', COUNT(*) FROM public.sitio_web_redsocial
UNION ALL SELECT 'sitio_web_header', COUNT(*) FROM public.sitio_web_header
UNION ALL SELECT 'sitio_web_footer', COUNT(*) FROM public.sitio_web_footer
UNION ALL SELECT 'sitio_web_configuracionsitio', COUNT(*) FROM public.sitio_web_configuracionsitio
UNION ALL SELECT 'sitio_web_carrusel', COUNT(*) FROM public.sitio_web_carrusel
UNION ALL SELECT 'sitio_web_cobertura', COUNT(*) FROM public.sitio_web_cobertura;
