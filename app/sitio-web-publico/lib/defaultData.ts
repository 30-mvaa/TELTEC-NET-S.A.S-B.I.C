/**
 * Fuente de verdad unificada para datos de TelTec Net
 * Reconciliada con los planes y sectores confirmados por el usuario.
 */

export interface EmpresaInfo {
  nombre: string
  subtitulo: string
  titulo: string
  lema: string
  descripcion: string
  telefono: string
  telefonoFormateado: string
  whatsapp: string
  whatsappInternacional: string
  email: string
  direccion: string
  horarioSemana: string
  horarioSabado: string
  horarioCompleto: string
  metricas: {
    clientes: string
    uptime: string
  }
}

export interface FeatureItem {
  id: string
  titulo: string
  descripcion: string
  icono: "Headphones" | "Zap" | "Activity" | "Shield"
}

export interface GarantiaItem {
  id: string
  titulo: string
  descripcion: string
  icono: "Clock" | "Headphones" | "FileCheck"
}

export interface ServicioItem {
  id: number
  nombre: string
  descripcion: string
  icono: "cpu" | "home" | "code" | "video" | "bell" | "lock"
  serviceType: string
  features: string[]
  actionText: string
  gradient: string
}

export interface PlanItem {
  id: number
  nombre: string
  precio: number
  precioPeriodo: string
  categoria: "hogar" | "gaming" | "empresa"
  destacado?: boolean
  popularBadge?: string
  velocidadPlaceholder: string
  caracteristicas: string[]
  descripcion: string
  estado: "activo"
}

export interface SectorItem {
  id: number
  nombre: string
  descripcion: string
  categoria: "rural" | "urbano" | "comercial"
  estado: "activo"
}

export interface TestimonioItem {
  id: number
  nombre: string
  rol: string
  comentario: string
  calificacion: number
}

export interface FAQItem {
  id: number
  pregunta: string
  respuesta: string
}

export interface RedSocialItem {
  id: string
  nombre: string
  url?: string
  icono: "facebook" | "instagram" | "tiktok"
  verificado: boolean
}

export const EMPRESA_DATA: EmpresaInfo = {
  nombre: "TelTec Net",
  subtitulo: "INTERNET DE NUEVA GENERACIÓN",
  titulo: "TelTec Net — Internet de Alta Velocidad",
  lema: "Conectando tu mundo digital",
  descripcion:
    "Somos una empresa líder en servicios de internet de alta velocidad, comprometida con brindar conectividad confiable y soporte técnico excepcional en toda la provincia del Cañar.",
  telefono: "0984517703",
  telefonoFormateado: "098 451 7703",
  whatsapp: "0984517703",
  whatsappInternacional: "593984517703",
  email: "info@teltecnet.com",
  direccion: "Av. 24 de Mayo 123, Centro de Azogues, Cañar",
  horarioSemana: "Lunes a Viernes: 8:00 AM - 6:00 PM",
  horarioSabado: "Sábados: 8:00 AM - 2:00 PM",
  horarioCompleto: "Lunes a Viernes: 8:00 AM - 6:00 PM | Sábados: 8:00 AM - 2:00 PM",
  metricas: {
    clientes: "100+",
    uptime: "99.9%"
  }
}

export const FEATURES_DATA: FeatureItem[] = [
  {
    id: "soporte-local",
    titulo: "Soporte local",
    descripcion: "Atención directa sin robots. Resolvemos tus dudas en minutos.",
    icono: "Headphones"
  },
  {
    id: "planes-flexibles",
    titulo: "Planes flexibles",
    descripcion: "Velocidad que se adapta a tus necesidades. Escoge la ideal para ti.",
    icono: "Zap"
  },
  {
    id: "monitoreo-247",
    titulo: "Monitoreo 24/7",
    descripcion: "Supervisamos tu conexión constantemente para garantizar estabilidad.",
    icono: "Activity"
  }
]

export const GARANTIAS_DATA: GarantiaItem[] = [
  {
    id: "instalacion-express",
    titulo: "Instalación Express",
    descripcion: "Instalamos tu servicio en un plazo de 24 a 48 horas hábiles.",
    icono: "Clock"
  },
  {
    id: "soporte-247",
    titulo: "Soporte 24/7",
    descripcion: "Asistencia técnica constante para que nunca te quedes sin conexión.",
    icono: "Headphones"
  },
  {
    id: "sin-contratos",
    titulo: "Sin Contratos Forzosos",
    descripcion: "Creemos en la calidad de nuestro servicio, por eso no te atamos con contratos abusivos.",
    icono: "FileCheck"
  }
]

export const SERVICIOS_DATA: ServicioItem[] = [
  {
    id: 1,
    nombre: "Domotizaciones",
    descripcion: "Automatiza tu hogar con sistemas inteligentes.",
    icono: "cpu",
    serviceType: "domotizaciones",
    features: ["Control de iluminación y tomas", "Automatización por horarios", "Control remoto desde app móvil"],
    actionText: "Más info",
    gradient: "from-blue-600 to-cyan-500"
  },
  {
    id: 2,
    nombre: "Casas Inteligentes",
    descripcion: "Transforma tu vivienda con tecnología.",
    icono: "home",
    serviceType: "casas_inteligentes",
    features: ["Integración completa de sensores", "Gestión inteligente de energía", "Confort y seguridad para tu familia"],
    actionText: "Más info",
    gradient: "from-cyan-500 to-blue-500"
  },
  {
    id: 3,
    nombre: "Desarrollo Software",
    descripcion: "Soluciones personalizadas para empresas.",
    icono: "code",
    serviceType: "desarrollo_software",
    features: ["Sistemas web y plataformas a medida", "Digitalización de cobros y procesos", "Arquitectura escalable en la nube"],
    actionText: "Más info",
    gradient: "from-emerald-500 to-teal-500"
  },
  {
    id: 4,
    nombre: "Cámaras Seguridad",
    descripcion: "Videovigilancia HD con acceso remoto.",
    icono: "video",
    serviceType: "camaras_seguridad",
    features: ["Cámaras EZVIZ HD y 2K+", "Visión nocturna a color y audio 2 vías", "Monitoreo en tiempo real desde el teléfono"],
    actionText: "Más info",
    gradient: "from-blue-500 to-indigo-600"
  },
  {
    id: 5,
    nombre: "Alarmas",
    descripcion: "Sistemas con monitoreo 24/7.",
    icono: "bell",
    serviceType: "alarmas",
    features: ["Sensores de intrusión y apertura", "Notificaciones inmediatas a tu celular", "Batería de respaldo anti-cortes"],
    actionText: "Más info",
    gradient: "from-indigo-500 to-purple-600"
  },
  {
    id: 6,
    nombre: "Cierres Eléctricos",
    descripcion: "Automatización de puertas y portones.",
    icono: "lock",
    serviceType: "cierres_electricos",
    features: ["Motores para portones corredizos y batientes", "Apertura mediante control y celular", "Cerraduras magnéticas de alta resistencia"],
    actionText: "Más info",
    gradient: "from-teal-500 to-emerald-600"
  }
]

/**
 * PLANES CONFIRMADOS EN BASE DE DATOS
 * Exactamente los 4 planes existentes:
 * 1. Plan personalizado - $10.00
 * 2. Plan Básico - $15.00
 * 3. Plan Tercera Edad - $18.00
 * 4. Plan familiar - $20.00
 */
export const PLANES_DATA: PlanItem[] = [
  {
    id: 7,
    nombre: "Plan personalizado",
    precio: 10.0,
    precioPeriodo: "mes",
    categoria: "hogar",
    velocidadPlaceholder: "Velocidad que se adapta a ti",
    caracteristicas: [
      "Instalación incluida",
      "Soporte técnico",
      "WiFi amplio",
      "Conexión estable por fibra",
      "Sin contratos forzosos"
    ],
    descripcion: "Plan flexible y accesible adaptado a tus necesidades diarias.",
    estado: "activo"
  },
  {
    id: 3,
    nombre: "Plan Básico",
    precio: 15.0,
    precioPeriodo: "mes",
    categoria: "hogar",
    velocidadPlaceholder: "Velocidad estándar para el hogar",
    caracteristicas: [
      "Plan básico de servicios",
      "Instalación incluida",
      "Soporte técnico",
      "WiFi amplio",
      "Navegación ilimitada 24/7"
    ],
    descripcion: "Plan básico de servicios para navegación, redes sociales y tareas de estudio.",
    estado: "activo"
  },
  {
    id: 2,
    nombre: "Plan Tercera Edad",
    precio: 18.0,
    precioPeriodo: "mes",
    categoria: "hogar",
    velocidadPlaceholder: "Conectividad garantizada",
    caracteristicas: [
      "Plan especial para adultos mayores",
      "Instalación incluida",
      "Soporte técnico paciente y directo",
      "WiFi amplio en todo el domicilio",
      "Comunicación continua con tu familia"
    ],
    descripcion: "Plan especial para adultos mayores, pensado para mantenerte siempre conectado.",
    estado: "activo"
  },
  {
    id: 1,
    nombre: "Plan familiar",
    precio: 20.0,
    precioPeriodo: "mes",
    categoria: "hogar",
    destacado: true,
    popularBadge: "Más Popular",
    velocidadPlaceholder: "Alta velocidad multidispositivo",
    caracteristicas: [
      "Plan completo para familias",
      "Instalación incluida",
      "Soporte técnico prioritario",
      "WiFi amplio de alta cobertura",
      "Optimizado para streaming y juegos simultáneos"
    ],
    descripcion: "Plan completo para familias que requieren trabajar, estudiar y divertirse al mismo tiempo.",
    estado: "activo"
  }
]

/**
 * 20 SECTORES CONFIRMADOS EN BASE DE DATOS
 */
export const SECTORES_DATA: SectorItem[] = [
  { id: 1, nombre: "Sector de Ana maria", descripcion: "Sector de Ana María", categoria: "rural", estado: "activo" },
  { id: 2, nombre: "Sector de Caguanapamba Centro", descripcion: "Sector de Caguanapamba Centro", categoria: "urbano", estado: "activo" },
  { id: 3, nombre: "Cajon Tambo", descripcion: "Comunidad Cajón Tambo", categoria: "rural", estado: "activo" },
  { id: 4, nombre: "Cashaloma", descripcion: "Comunidad Cashaloma", categoria: "rural", estado: "activo" },
  { id: 5, nombre: "Centro de acopio Sisid", descripcion: "Sector Centro de acopio Sisid", categoria: "comercial", estado: "activo" },
  { id: 6, nombre: "Centro de acopio Vende Leche", descripcion: "Sector Centro de acopio Vende Leche", categoria: "comercial", estado: "activo" },
  { id: 7, nombre: "Churuguayco", descripcion: "Comunidad Churuguayco", categoria: "rural", estado: "activo" },
  { id: 8, nombre: "Cullcaloma", descripcion: "Sector Cullcaloma", categoria: "rural", estado: "activo" },
  { id: 9, nombre: "Galuay", descripcion: "Comunidad Galuay", categoria: "rural", estado: "activo" },
  { id: 10, nombre: "Ingapirca", descripcion: "Sector de Ingapirca", categoria: "urbano", estado: "activo" },
  { id: 11, nombre: "Lirio Loma", descripcion: "Sector de Lirio Loma", categoria: "rural", estado: "activo" },
  { id: 12, nombre: "Marco Pamba", descripcion: "Sector de Marco Pamba", categoria: "rural", estado: "activo" },
  { id: 13, nombre: "Naug Nag", descripcion: "Sector de Naug Nag", categoria: "rural", estado: "activo" },
  { id: 14, nombre: "Rumiloma", descripcion: "Sector de Rumiloma", categoria: "rural", estado: "activo" },
  { id: 15, nombre: "Sisid Anejo", descripcion: "Sector de Sisid Anejo", categoria: "rural", estado: "activo" },
  { id: 16, nombre: "Sisid Centro", descripcion: "Sector de Sisid Centro", categoria: "rural", estado: "activo" },
  { id: 17, nombre: "Tambo", descripcion: "Sector de Tambo", categoria: "urbano", estado: "activo" },
  { id: 18, nombre: "Tambo Reservorio", descripcion: "Sector de Tambo Reservorio", categoria: "urbano", estado: "activo" },
  { id: 19, nombre: "Zarapamba", descripcion: "Sector de Zarapamba", categoria: "rural", estado: "activo" },
  { id: 20, nombre: "Zharo", descripcion: "Sector de Zharo", categoria: "rural", estado: "activo" }
]

export const TESTIMONIOS_DATA: TestimonioItem[] = [
  {
    id: 1,
    nombre: "Juan Pérez",
    rol: "Residencia - Cañar",
    comentario: "Increíble velocidad y estabilidad. Finalmente tengo un internet que no se cae durante mis reuniones de trabajo. ¡Muy recomendados!",
    calificacion: 5
  },
  {
    id: 2,
    nombre: "María López",
    rol: "Dueña de Negocio",
    comentario: "La instalación fue rapidísima. El soporte técnico es atento y el plan corporativo ha mejorado mucho la eficiencia de mi local.",
    calificacion: 5
  },
  {
    id: 3,
    nombre: "Carlos Guamán",
    rol: "Estudiante / Gamer",
    comentario: "El ping es bajísimo, ideal para jugar en línea. Además, el precio es muy competitivo comparado con otras empresas de la zona.",
    calificacion: 4
  },
  {
    id: 4,
    nombre: "Ana Quizhpi",
    rol: "Familia",
    comentario: "Excelente servicio. Ahora todos en casa podemos estar conectados al mismo tiempo sin que se ponga lento el internet.",
    calificacion: 5
  }
]

export const FAQ_DATA: FAQItem[] = [
  {
    id: 1,
    pregunta: "¿Cómo puedo contratar el servicio?",
    respuesta:
      "Puedes contratarnos a través de nuestro botón de WhatsApp o llamando al 0984517703. Solo necesitamos validar la cobertura en tu sector y coordinar la instalación."
  },
  {
    id: 2,
    pregunta: "¿Qué pasa si tengo problemas con mi conexión?",
    respuesta:
      "Contamos con soporte técnico especializado disponible 24/7. Puedes reportar cualquier incidencia vía WhatsApp y nuestro equipo técnico te asistirá a la brevedad."
  },
  {
    id: 3,
    pregunta: "¿Tienen planes para empresas o negocios?",
    respuesta:
      "Sí, ofrecemos planes con mayor ancho de banda, IP fija y soporte prioritario para garantizar la continuidad de tu negocio. Contáctanos por WhatsApp para consultar requerimientos específicos."
  },
  {
    id: 4,
    pregunta: "¿Cuáles son los métodos de pago disponibles?",
    respuesta:
      "Aceptamos transferencias bancarias locales y depósitos. Escríbenos a nuestro WhatsApp o llámanos al 0984517703 para darte las cuentas bancarias autorizadas."
  },
  {
    id: 5,
    pregunta: "¿En cuánto tiempo instalan el servicio?",
    respuesta:
      "Una vez validada la cobertura y el plan seleccionado, la instalación se realiza generalmente en un plazo de 24 a 48 horas hábiles."
  }
]
