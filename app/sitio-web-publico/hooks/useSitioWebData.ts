import { useState, useEffect } from "react"
import { API_ENDPOINTS } from "@/lib/config/api"
import {
  EMPRESA_DATA,
  SERVICIOS_DATA,
  PLANES_DATA,
  SECTORES_DATA,
  TESTIMONIOS_DATA,
  FAQ_DATA,
  GARANTIAS_DATA,
  FEATURES_DATA,
  EmpresaInfo,
  ServicioItem,
  PlanItem,
  SectorItem,
  TestimonioItem,
  FAQItem,
  GarantiaItem,
  FeatureItem
} from "../lib/defaultData"

export interface SitioWebPublicoState {
  empresa: EmpresaInfo
  informacion: {
    titulo: string
    subtitulo: string
    lema: string
    descripcion: string
  }
  features: FeatureItem[]
  garantias: GarantiaItem[]
  servicios: ServicioItem[]
  planes: PlanItem[]
  sectores: SectorItem[]
  testimonios: TestimonioItem[]
  faqs: FAQItem[]
  contactos: Array<{
    id: number
    tipo: "telefono" | "email" | "whatsapp" | "direccion" | "horario"
    titulo: string
    valor: string
    url: string
    activo: boolean
  }>
  redesSociales: Record<string, string>
}

export function useSitioWebData() {
  const [data, setData] = useState<SitioWebPublicoState>({
    empresa: EMPRESA_DATA,
    informacion: {
      titulo: EMPRESA_DATA.titulo,
      subtitulo: EMPRESA_DATA.subtitulo,
      lema: EMPRESA_DATA.lema,
      descripcion: EMPRESA_DATA.descripcion
    },
    features: FEATURES_DATA,
    garantias: GARANTIAS_DATA,
    servicios: SERVICIOS_DATA,
    planes: PLANES_DATA,
    sectores: SECTORES_DATA,
    testimonios: TESTIMONIOS_DATA,
    faqs: FAQ_DATA,
    contactos: [
      { id: 1, tipo: "telefono", titulo: "Teléfono Principal", valor: EMPRESA_DATA.telefono, url: `tel:${EMPRESA_DATA.telefono}`, activo: true },
      { id: 2, tipo: "whatsapp", titulo: "WhatsApp Directo", valor: EMPRESA_DATA.telefono, url: `https://wa.me/${EMPRESA_DATA.whatsappInternacional}`, activo: true },
      { id: 3, tipo: "email", titulo: "Correo Electrónico", valor: EMPRESA_DATA.email, url: `mailto:${EMPRESA_DATA.email}`, activo: true },
      { id: 4, tipo: "direccion", titulo: "Oficina Matriz", valor: EMPRESA_DATA.direccion, url: "", activo: true },
      { id: 5, tipo: "horario", titulo: "Horario de Atención", valor: EMPRESA_DATA.horarioCompleto, url: "", activo: true }
    ],
    redesSociales: {
      facebook: "",
      instagram: "",
      tiktok: ""
    }
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    const fetchData = async () => {
      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 6000)
        const response = await fetch(API_ENDPOINTS.SITIO_WEB_PUBLICO, { signal: controller.signal })
        clearTimeout(timeoutId)

        if (!response.ok) {
          // Servidor no disponible o responde con error; mantenemos los datos por defecto
          return
        }

        const result = await response.json()
        if (!isMounted || !result?.success || !result?.data) return

        const apiData = result.data

        // Procesar planes de la API asegurando solo los 4 planes confirmados
        let planesFinales = PLANES_DATA
        if (Array.isArray(apiData.planes) && apiData.planes.length > 0) {
          const validApiPlans = apiData.planes
            .filter((p: any) => {
              const name = (p.tipo_plan || "").trim().toLowerCase()
              // Mantener únicamente los 4 planes oficiales confirmados en BD
              return (
                name === "plan personalizado" ||
                name === "plan básico" ||
                name === "plan basico" ||
                name === "plan tercera edad" ||
                name === "plan familiar"
              )
            })
            .map((p: any): PlanItem => {
              const name = (p.tipo_plan || "").trim()
              const lower = name.toLowerCase()
              const isFamiliar = lower.includes("familiar")
              const isTerceraEdad = lower.includes("tercera")
              const isPersonalizado = lower.includes("personalizado")

              return {
                id: p.id || Math.random(),
                nombre: name,
                precio: Number(p.precio) || (isPersonalizado ? 10 : isTerceraEdad ? 18 : isFamiliar ? 20 : 15),
                precioPeriodo: "mes",
                categoria: "hogar",
                destacado: isFamiliar,
                popularBadge: isFamiliar ? "Más Popular" : undefined,
                velocidadPlaceholder: isFamiliar
                  ? "Alta velocidad multidispositivo"
                  : isTerceraEdad
                  ? "Conectividad garantizada"
                  : isPersonalizado
                  ? "Velocidad que se adapta a ti"
                  : "Velocidad estándar para el hogar",
                caracteristicas: [
                  "Instalación incluida",
                  "Soporte técnico",
                  "WiFi amplio",
                  "Fibra óptica de alta calidad",
                  "Sin contratos forzosos"
                ],
                descripcion: p.descripcion || (isTerceraEdad ? "Plan especial para adultos mayores" : isFamiliar ? "Plan completo para familias" : "Plan básico de servicios"),
                estado: "activo"
              }
            })

          if (validApiPlans.length > 0) {
            planesFinales = validApiPlans
          }
        }

        // Procesar sectores asegurando los 20 sectores de la base de datos
        let sectoresFinales = SECTORES_DATA
        if (Array.isArray(apiData.sectores) && apiData.sectores.length > 0) {
          const apiSectores = apiData.sectores
            .filter((s: any) => {
              const rawName = (s.nombre_sector || s.nombre || "").trim().toLowerCase()
              // Excluir sectores de prueba o inactivos como cuenca
              return !rawName.includes("cuenca") && !rawName.includes("fusa")
            })
            .map((s: any, idx: number): SectorItem => {
              const rawName = (s.nombre_sector || s.nombre || `Sector ${idx + 1}`).trim()
              let nombreLimpio = rawName
              if (rawName.toLowerCase().includes("mariaaaa") || rawName.toLowerCase().includes("ana maria")) {
                nombreLimpio = "Sector de Ana maria"
              } else if (rawName.toLowerCase().includes("centrooo") || rawName.toLowerCase().includes("caguanapamba")) {
                nombreLimpio = "Sector de Caguanapamba Centro"
              }

              const isComercial = nombreLimpio.toLowerCase().includes("acopio")
              const isUrbano =
                nombreLimpio.toLowerCase().includes("tambo") ||
                nombreLimpio.toLowerCase().includes("ingapirca") ||
                nombreLimpio.toLowerCase().includes("caguanapamba")

              return {
                id: s.id || idx + 1,
                nombre: nombreLimpio,
                descripcion: s.descripcion || `Sector de ${nombreLimpio}`,
                categoria: isComercial ? "comercial" : isUrbano ? "urbano" : "rural",
                estado: "activo"
              }
            })
          if (apiSectores.length > 0) {
            sectoresFinales = apiSectores
          }
        }

        setData((prev) => ({
          ...prev,
          empresa: {
            ...prev.empresa,
            nombre: apiData.empresa?.nombre || prev.empresa.nombre,
            direccion: apiData.empresa?.direccion || prev.empresa.direccion,
            telefono: apiData.empresa?.telefono || prev.empresa.telefono,
            email: apiData.empresa?.email || prev.empresa.email,
            horarioCompleto: apiData.empresa?.horario || prev.empresa.horarioCompleto
          },
          informacion: {
            titulo: apiData.informacion?.titulo || prev.informacion.titulo,
            subtitulo: apiData.informacion?.subtitulo || prev.informacion.subtitulo,
            lema: apiData.informacion?.lema || prev.informacion.lema,
            descripcion: apiData.informacion?.descripcion || prev.informacion.descripcion
          },
          planes: planesFinales,
          sectores: sectoresFinales
        }))
      } catch (err) {
        // En caso de fallo de red, se mantienen los datos cargados por defecto
        console.info("Nota: Usando datos locales de TelTec Net:", err instanceof Error ? err.message : err)
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    fetchData()
    return () => {
      isMounted = false
    }
  }, [])

  return { data, loading, error }
}
