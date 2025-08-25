"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import TTnetLogo from "@/app/components/TTnetLogo"
import ImageCarousel from "@/app/components/ImageCarousel"
import { 
  ArrowLeft, 
  Mail, 
  Phone, 
  MapPin, 
  Building, 
  Wifi, 
  CheckCircle, 
  Star,
  ArrowRight,
  Play,
  Zap,
  Home,
  Briefcase,
  Tv,
  Settings,
  MessageCircle,
  MessageSquare,
  PhoneCall,
  AtSign,
  Facebook,
  Instagram,
  Twitter,
  Youtube,
  Map,
  Clock,
  Award,
  Heart,
  ChevronRight,
  ChevronLeft,
  Eye,
  Globe,
  Shield,
  Users,
  TrendingUp,
  Headphones,
  Wifi as WifiIcon,
  Signal,
  Download,
  Upload,
  Menu,
  X,
  Search,
  User,
  ShoppingCart,
  Bell,
  HelpCircle,
  ExternalLink,
  Music
} from "lucide-react"

export default function SitioWebPublicoPage() {
  const [sitioWeb, setSitioWeb] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [currentTestimonial, setCurrentTestimonial] = useState(0)
  const [isVisible, setIsVisible] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const fetchSitioWeb = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/sitio-web/publico/')
        const data = await response.json()
        
        if (data.success) {
          setSitioWeb(data.data)
        }
      } catch (error) {
        console.error('Error cargando datos del sitio web:', error)
      } finally {
        setLoading(false)
        setIsVisible(true)
      }
    }
    
    fetchSitioWeb()
  }, [])

  // Testimonios reales de clientes
  const testimonios = [
    {
      nombre: "María Aurora",
      comunidad: "El Tambo",
      texto: "Excelente servicio, desde que contraté T&Tnet mi conexión es súper estable. El soporte técnico responde rápido cuando necesito ayuda.",
      rating: 5,
      avatar: "MA",
      plan: "Plan Familiar"
    },
    {
      nombre: "Carlos Mendoza",
      comunidad: "Azogues",
      texto: "Llevo 2 años con T&Tnet y no he tenido problemas. La velocidad es consistente y el precio es justo para la calidad que ofrecen.",
      rating: 5,
      avatar: "CM",
      plan: "Plan Empresarial"
    },
    {
      nombre: "Ana Lucía",
      comunidad: "Cañar",
      texto: "Me encanta el servicio. Los técnicos son muy profesionales y la instalación fue rápida. Recomiendo T&Tnet a todos mis vecinos.",
      rating: 5,
      avatar: "AL",
      plan: "Plan Básico"
    }
  ]

  // Planes con información detallada
  const planes = [
    {
      nombre: "Plan Básico",
      velocidad: "15 MB",
      precio: "$15",
      caracteristicas: [
        "Ideal para navegación web",
        "Email y redes sociales",
        "Hasta 2 dispositivos",
        "Soporte técnico incluido",
        "Sin límite de datos"
      ],
      popular: false,
      color: "blue",
      icon: Home
    },
    {
      nombre: "Plan Familiar",
      velocidad: "30 MB",
      precio: "$20",
      caracteristicas: [
        "Perfecto para familias",
        "Streaming HD sin interrupciones",
        "Hasta 5 dispositivos",
        "Soporte técnico prioritario",
        "Router WiFi 6 incluido"
      ],
      popular: true,
      color: "green",
      icon: Users
    },
    {
      nombre: "Plan Personalizado",
      velocidad: "A medida",
      precio: "Consultar",
      caracteristicas: [
        "Para negocios y oficinas",
        "Conexión dedicada",
        "Soporte técnico 24/7",
        "IP fija incluida",
        "Panel de administración"
      ],
      popular: false,
      color: "blue",
      icon: Briefcase
    }
  ]

  // Comunidades atendidas
  const comunidades = [
     "Cañar", "El Tambo",
    
    "Sisid", "San Rafael", "Ingapirca", 
  ]

  // Estadísticas
  const estadisticas = [
    { numero: "2,500+", texto: "Clientes Satisfechos", icono: Users, color: "indigo" },
    { numero: "18", texto: "Comunidades Atendidas", icono: Map, color: "purple" },
    { numero: "24/7", texto: "Soporte Técnico", icono: Headphones, color: "pink" },
    { numero: "99.9%", texto: "Tiempo de Actividad", icono: TrendingUp, color: "emerald" }
  ]

  // Carrusel de imágenes y videos
  const carouselItems = [
    {
      id: 1,
      type: 'image' as const,
      src: '/images/hero-1.jpg',
      alt: 'Instalación de fibra óptica',
      title: 'Instalación Profesional',
      description: 'Nuestro equipo técnico especializado garantiza instalaciones de calidad'
    },
    {
      id: 2,
      type: 'image' as const,
      src: '/images/hero-2.jpg',
      alt: 'Equipo técnico trabajando',
      title: 'Soporte Técnico 24/7',
      description: 'Estamos disponibles para ayudarte en cualquier momento'
    },
    {
      id: 3,
      type: 'video' as const,
      src: '/videos/ttnet-promo.mp4',
      alt: 'Video promocional T&Tnet',
      title: 'Conectando el Cañar',
      description: 'Descubre cómo llevamos conectividad a toda la provincia'
    },
    {
      id: 4,
      type: 'image' as const,
      src: '/images/hero-4.jpg',
      alt: 'Clientes satisfechos',
      title: 'Más de 2,500 Clientes',
      description: 'Únete a nuestra comunidad de usuarios satisfechos'
    }
  ]

  // Servicios
  const servicios = [
    
    {
      icono: Briefcase,
      titulo: "Internet Emprendimientos y Negocios",
      descripcion: "Soluciones de conectividad dedicada para empresas. Conexión estable y soporte técnico especializado.",
      color: "green",
      features: ["Conexión dedicada", "Soporte 24/7", "IP fija"]
    },
    {
      icono: Tv,
      titulo: "Televisión Digital",
      descripcion: "Entretenimiento familiar con canales de calidad. Zapping rápido y programación variada.",
      color: "blue",
      features: ["100+ canales", "HD y 4K", "Grabación en la nube"]
    },
    {
      icono: Eye,
      titulo: "Cámaras de Seguridad",
      descripcion: "Sistemas de vigilancia profesional para hogares y negocios. Monitoreo 24/7 con acceso remoto.",
      color: "purple",
      features: ["HD y 4K", "Acceso remoto", "Grabación en la nube"]
    },
    {
      icono: Settings,
      titulo: "Instalación y Soporte",
      descripcion: "Instalación profesional y soporte técnico 24/7. Nuestro equipo está siempre disponible para ayudarte.",
      color: "green",
      features: ["Instalación gratuita", "Soporte remoto", "Mantenimiento"]
    }
  ]

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <div className="absolute inset-0 w-16 h-16 border-4 border-purple-500 border-b-transparent rounded-full animate-spin mx-auto" style={{ animationDelay: '0.5s' }}></div>
          </div>
          <p className="text-gray-600 font-medium text-lg">Cargando T&Tnet...</p>
          <p className="text-gray-400 text-sm mt-2">Conectando con el futuro</p>
        </div>
      </div>
    )
  }

  if (!sitioWeb) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <Wifi className="w-20 h-20 text-red-400 mx-auto mb-6" />
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Error de Conexión</h1>
          <p className="text-gray-600 mb-6">No se pudieron cargar los datos del sitio web</p>
          <Button onClick={() => window.location.reload()} className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3">
            Reintentar Conexión
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header Moderno */}
      <header className="bg-white/95 backdrop-blur-xl shadow-lg border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-6">
              
              
              <div className="flex items-center">
                <div className="relative mr-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-green-600 rounded-2xl flex items-center justify-center shadow-xl">
                    <Wifi className="w-7 h-7 text-white" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white shadow-lg"></div>
                </div>
                <TTnetLogo size="lg" useImage={true} imageSrc="/images/ttnet-logo.png" />
              </div>
            </div>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-6">
              <nav className="flex items-center space-x-8">
                <a href="#servicios" className="text-gray-600 hover:text-blue-600 font-medium transition-colors">Servicios</a>
                <a href="#planes" className="text-gray-600 hover:text-blue-600 font-medium transition-colors">Planes</a>
                <a href="#cobertura" className="text-gray-600 hover:text-blue-600 font-medium transition-colors">Cobertura</a>
                <a href="#contacto" className="text-gray-600 hover:text-blue-600 font-medium transition-colors">Contacto</a>
              </nav>
              <Button
                onClick={() => router.push('/login-simple')}
                className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-white font-semibold px-6 py-2 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
              >
                Iniciar Sesión
              </Button>
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <Button
                variant="ghost"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="text-gray-600 hover:text-blue-600"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </Button>
            </div>
          </div>

          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <div className="md:hidden py-4 border-t border-gray-100">
              <nav className="flex flex-col space-y-4">
                <a href="#servicios" className="text-gray-600 hover:text-blue-600 font-medium transition-colors">Servicios</a>
                <a href="#planes" className="text-gray-600 hover:text-blue-600 font-medium transition-colors">Planes</a>
                <a href="#cobertura" className="text-gray-600 hover:text-blue-600 font-medium transition-colors">Cobertura</a>
                <a href="#contacto" className="text-gray-600 hover:text-blue-600 font-medium transition-colors">Contacto</a>
                <Button
                  onClick={() => router.push('/login-simple')}
                  className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-white font-semibold px-6 py-2 rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  Iniciar Sesión
                </Button>
              </nav>
            </div>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-green-50 overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-96 h-96 bg-blue-500/10 rounded-full mix-blend-multiply filter blur-3xl animate-blob"></div>
          <div className="absolute top-0 right-0 w-96 h-96 bg-green-500/10 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-400/10 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000"></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center min-h-screen">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className={`transition-all duration-1000 ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-10'}`}>
                              <div className="mb-8">
                  <TTnetLogo size="xl" variant="gradient" className="mb-6" />
                  <h1 className="text-5xl md:text-7xl font-black mb-6 leading-tight">
                    <span className="bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
                      Conexión
                    </span>
                    <br />
                    <span className="text-gray-900">sin límites</span>
                  </h1>
                <p className="text-xl md:text-2xl mb-8 text-gray-600 leading-relaxed font-light">
                  Llevamos conectividad de alta velocidad a toda la provincia del Cañar. 
                  Conectamos hogares, empresas y comunidades con el mundo digital.
                </p>
              </div>
              
                              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                  <Button
                    onClick={() => document.getElementById('planes')?.scrollIntoView({ behavior: 'smooth' })}
                    className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-white px-8 py-4 text-lg font-bold rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 group transform hover:scale-105"
                  >
                    Ver Planes
                    <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => document.getElementById('contacto')?.scrollIntoView({ behavior: 'smooth' })}
                    className="border-2 border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white px-8 py-4 text-lg font-semibold rounded-full transition-all duration-300"
                  >
                    <Phone className="w-5 h-5 mr-2" />
                    Contáctanos
                  </Button>
                </div>
              
                              <div className="flex items-center space-x-8 text-gray-600">
                  <div className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                    <span className="font-medium">Conexión 24/7</span>
                  </div>
                  <div className="flex items-center">
                    <Shield className="w-5 h-5 text-blue-500 mr-2" />
                    <span className="font-medium">Soporte Técnico</span>
                  </div>
                  <div className="flex items-center">
                    <Zap className="w-5 h-5 text-yellow-500 mr-2" />
                    <span className="font-medium">Alta Velocidad</span>
                  </div>
                </div>
            </div>
            
            <div className={`transition-all duration-1000 delay-300 ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-10'}`}>
              <div className="relative">
                <ImageCarousel 
                  items={carouselItems}
                  autoPlay={true}
                  interval={6000}
                  showControls={true}
                  showIndicators={true}
                  className="w-full"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Estadísticas */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {estadisticas.map((stat, index) => (
              <div 
                key={index}
                className={`text-center transition-all duration-1000 delay-${index * 200} ${
                  isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
                }`}
              >
                <div className={`w-16 h-16 bg-gradient-to-br from-${stat.color}-500 to-${stat.color}-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl`}>
                  <stat.icono className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-3xl font-black text-gray-900 mb-2">{stat.numero}</h3>
                <p className="text-gray-600 font-medium">{stat.texto}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Características Destacadas */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-6">
              ¿Por qué elegir <span className="bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">T&Tnet</span>?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Conectividad de próxima generación con tecnología de vanguardia
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { icono: Download, titulo: "Descarga", valor: "Hasta 100 Mbps", color: "blue" },
              { icono: Upload, titulo: "Subida", valor: "Hasta 50 Mbps", color: "green" },
              { icono: Signal, titulo: "Latencia", valor: "< 20ms", color: "blue" },
              { icono: Eye, titulo: "Seguridad", valor: "24/7 Monitoreo", color: "purple" }
            ].map((stat, index) => (
              <div key={index} className="text-center group">
                <div className={`w-20 h-20 bg-gradient-to-br from-${stat.color}-500/20 to-${stat.color}-600/20 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-xl group-hover:scale-110 transition-transform duration-300`}>
                  <stat.icono className={`w-10 h-10 text-${stat.color}-600`} />
                </div>
                <h4 className="text-gray-900 font-bold text-lg mb-2">{stat.titulo}</h4>
                <p className={`text-${stat.color}-600 font-semibold`}>{stat.valor}</p>
              </div>
            ))}
          </div>
          
          <div className="mt-12 p-6 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-3xl border border-indigo-100">
            <p className="text-gray-700 text-center font-bold text-lg">
               Conectividad y seguridad de próxima generación disponible en toda la provincia del Cañar
            </p>
          </div>
        </div>
      </section>

      {/* Servicios */}
      <section id="servicios" className="py-20 bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-6">
              Nuestros <span className="bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">Servicios</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Ofrecemos soluciones integrales de conectividad y seguridad diseñadas para satisfacer 
              las necesidades de hogares y empresas en toda la provincia del Cañar.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {servicios.map((servicio, index) => (
              <Card 
                key={index} 
                className="group bg-white hover:shadow-2xl transition-all duration-500 border-0 shadow-xl hover:-translate-y-2"
              >
                <CardContent className="p-8 text-center">
                  <div className={`w-20 h-20 bg-gradient-to-br from-${servicio.color}-500 to-${servicio.color}-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl group-hover:scale-110 transition-transform duration-300`}>
                    <servicio.icono className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-4">{servicio.titulo}</h3>
                  <p className="text-gray-600 leading-relaxed mb-6">
                    {servicio.descripcion}
                  </p>
                  <ul className="space-y-2">
                    {servicio.features.map((feature, idx) => (
                      <li key={idx} className="flex items-center text-sm text-gray-600">
                        <CheckCircle className="w-4 h-4 text-emerald-500 mr-2 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Planes */}
      <section id="planes" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-6">
              Nuestros <span className="bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">Planes</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Planes flexibles diseñados para diferentes necesidades. 
              Encuentra el plan perfecto para ti y tu familia.
            </p>
          </div>
          
          <div className="flex flex-col lg:flex-row gap-8 items-stretch justify-center">
            {planes.map((plan, index) => (
              <Card 
                key={index} 
                className={`relative bg-white hover:shadow-2xl transition-all duration-500 border-2 w-full lg:w-1/3 max-w-sm ${
                  plan.popular 
                    ? 'border-green-500 shadow-2xl scale-105 ring-4 ring-green-500/20' 
                    : 'border-gray-200 hover:border-gray-300'
                } group`}
              >
                                  {plan.popular && (
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                      <span className="bg-gradient-to-r from-blue-600 to-green-600 text-white px-6 py-2 rounded-full text-sm font-bold shadow-xl">
                        Más Popular
                      </span>
                    </div>
                  )}
                <CardContent className="p-8 text-center">
                  <div className={`w-16 h-16 bg-gradient-to-br from-${plan.color}-500 to-${plan.color}-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg`}>
                    <plan.icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">{plan.nombre}</h3>
                  <div className="mb-6">
                    <span className="text-5xl font-black bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                      {plan.precio}
                    </span>
                    <span className="text-gray-600 text-lg">/mes</span>
                  </div>
                  <div className="mb-6">
                    <span className="text-xl font-bold text-gray-700">{plan.velocidad}</span>
                  </div>
                  <ul className="space-y-4 mb-8">
                    {plan.caracteristicas.map((caracteristica, idx) => (
                      <li key={idx} className="flex items-center text-gray-600">
                        <CheckCircle className="w-5 h-5 text-emerald-500 mr-3 flex-shrink-0" />
                        {caracteristica}
                      </li>
                    ))}
                  </ul>
                                      <Button 
                      className={`w-full py-4 font-bold rounded-full transition-all duration-300 ${
                        plan.popular 
                          ? 'bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-white shadow-xl hover:shadow-2xl' 
                          : 'bg-gray-100 hover:bg-gray-200 text-gray-900 hover:shadow-lg'
                      }`}
                    >
                      Contratar Plan
                    </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Cobertura */}
      <section id="cobertura" className="py-20 bg-gradient-to-br from-slate-50 to-indigo-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-6">
              Nuestra <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">Cobertura</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Llevamos conectividad a toda la provincia del Cañar. 
              ¿No ves tu comunidad? ¡Contáctanos!
            </p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="bg-white p-8 rounded-3xl shadow-2xl border border-gray-100">
                <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                  <Map className="w-7 h-7 mr-3 text-indigo-600" />
                  Comunidades Atendidas
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  {comunidades.map((comunidad, index) => (
                    <div key={index} className="flex items-center text-gray-700 hover:text-indigo-600 transition-colors">
                      <CheckCircle className="w-4 h-4 text-emerald-500 mr-3 flex-shrink-0" />
                      {comunidad}
                    </div>
                  ))}
                </div>
                <div className="mt-6 p-4 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl text-white">
                  <p className="font-bold text-center">
                    ¿No ves tu comunidad? ¡Contáctanos para expandir nuestra cobertura!
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-8 rounded-3xl shadow-2xl border border-gray-100">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Mapa de Cobertura</h3>
              <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-8 text-center">
                <div className="w-32 h-32 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl">
                  <Map className="w-16 h-16 text-white" />
                </div>
                <p className="text-gray-700 font-bold text-lg mb-2">
                  Mapa interactivo de cobertura
                </p>
                <p className="text-gray-500">
                  Próximamente podrás ver nuestra cobertura en tiempo real
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonios */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-6">
              Lo que dicen nuestros <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">clientes</span>
            </h2>
            <p className="text-xl text-gray-600">
              Testimonios reales de clientes satisfechos en toda la provincia del Cañar
            </p>
          </div>
          
          <div className="relative">
            <div className="flex overflow-hidden">
              {testimonios.map((testimonio, index) => (
                <div 
                  key={index}
                  className={`w-full flex-shrink-0 transition-transform duration-700 ease-in-out ${
                    index === currentTestimonial ? 'translate-x-0' : 'translate-x-full'
                  }`}
                >
                  <Card className="bg-gradient-to-br from-slate-50 to-indigo-50 border-0 shadow-2xl max-w-4xl mx-auto">
                    <CardContent className="p-12 text-center">
                      <div className="flex justify-center mb-8">
                        {[...Array(testimonio.rating)].map((_, i) => (
                          <Star key={i} className="w-8 h-8 text-yellow-400 fill-current" />
                        ))}
                      </div>
                      <blockquote className="text-2xl text-gray-700 mb-10 italic leading-relaxed">
                        "{testimonio.texto}"
                      </blockquote>
                      <div className="flex items-center justify-center">
                        <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center mr-6 shadow-xl">
                          <span className="text-white font-bold text-lg">
                            {testimonio.avatar}
                          </span>
                        </div>
                        <div>
                          <p className="font-bold text-gray-900 text-lg">{testimonio.nombre}</p>
                          <p className="text-gray-600">{testimonio.comunidad}</p>
                          <p className="text-sm text-indigo-600 font-medium">{testimonio.plan}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
            
            <button
              onClick={() => setCurrentTestimonial((prev) => (prev > 0 ? prev - 1 : testimonios.length - 1))}
              className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white rounded-full p-4 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-110"
            >
              <ChevronLeft className="w-6 h-6 text-gray-600" />
            </button>
            
            <button
              onClick={() => setCurrentTestimonial((prev) => (prev < testimonios.length - 1 ? prev + 1 : 0))}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white rounded-full p-4 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-110"
            >
              <ChevronRight className="w-6 h-6 text-gray-600" />
            </button>
          </div>
          
          <div className="flex justify-center mt-8 space-x-3">
            {testimonios.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentTestimonial(index)}
                className={`w-4 h-4 rounded-full transition-all duration-300 ${
                  index === currentTestimonial ? 'bg-indigo-600 scale-125' : 'bg-gray-300 hover:bg-gray-400'
                }`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Contacto */}
      <section id="contacto" className="py-12 bg-gradient-to-br from-slate-50 to-indigo-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-4">
              <span className="bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">Contáctanos</span>
            </h2>
            <p className="text-lg text-gray-600">
              ¿Tienes preguntas? Estamos aquí para ayudarte
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {[
             { icono: MessageCircle, titulo: "WhatsApp", texto: "0984517703", color: "emerald", url: "https://wa.me/593984517703" },
             { icono: Facebook, titulo: "Facebook", texto: "TeltecNet", color: "blue", url: "https://facebook.com/teltecnet" },
             { icono: Instagram, titulo: "Instagram", texto: "@teltecnet", color: "pink", url: "https://instagram.com/teltecnet" },
             { icono: Phone, titulo: "Teléfono", texto: "0984517703", color: "blue", url: "tel:0984517703" },
             { icono: Mail, titulo: "Email", texto: "teltecnet@outlook.com", color: "purple", url: "mailto:teltecnet@outlook.com" },
             { icono: Music, titulo: "TikTok", texto: "@teltecnet", color: "gray", url: "https://tiktok.com/@teltecnet" }
             
            ].map((item, index) => (
              <a 
                key={index}
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center p-4 bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 group"
              >

                
                <div className={`w-12 h-12 bg-gradient-to-br from-${item.color}-500 to-${item.color}-600 rounded-xl flex items-center justify-center mr-4 group-hover:scale-110 transition-transform duration-300`}>
                  <item.icono className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 text-sm">{item.titulo}</h4>
                  <p className="text-gray-600 text-sm">{item.texto}</p>
                </div>
              </a>
            ))}
          </div>
          
          <div className="bg-gradient-to-br from-blue-50 to-green-50 p-6 rounded-2xl shadow-xl border border-blue-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">Envíanos un mensaje</h3>
             
            </div>
            <form className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[
                  { label: "Nombre", type: "text" },
                  { label: "Email", type: "email" }
                ].map((field, index) => (
                  <div key={index}>
                    <label className="block text-xs font-medium text-gray-700 mb-1">{field.label}</label>
                    <input 
                      type={field.type} 
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 bg-white text-sm" 
                    />
                  </div>
                ))}
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Mensaje</label>
                <textarea 
                  rows={2} 
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 bg-white text-sm"
                ></textarea>
              </div>
              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-white py-2 font-bold rounded-lg shadow-md hover:shadow-lg transition-all duration-300 text-sm"
              >
                Enviar mensaje
              </Button>
            </form>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gradient-to-br from-gray-900 via-blue-900 to-green-900 text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center mb-4">
                <div className="relative mr-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-green-500 rounded-2xl flex items-center justify-center shadow-2xl">
                    <Wifi className="w-6 h-6 text-white" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                </div>
                <TTnetLogo size="md" useImage={true} imageSrc="/images/ttnet-logo-white.png" />
              </div>
              <p className="text-gray-300 mb-4 leading-relaxed text-sm">
                Conexión sin límites en toda la provincia del Cañar. 
                Llevamos conectividad de calidad a hogares y empresas desde 2020.
              </p>
            </div>
            
            <div>
              <h4 className="text-lg font-bold mb-3">Servicios</h4>
              <ul className="space-y-2 text-gray-300 text-sm">
                <li>Internet para Emprendimientos y Negocios</li>
                <li>Cámaras de seguridad</li>
                <li>Televisión Digital</li>
                <li>Instalación y Soporte</li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-6 pt-6 text-center text-gray-400">
            <p className="mb-2 text-sm">
              © 2025 T&T net - Todos los derechos reservados | Desarrollado en Ecuador 🇪🇨
            </p>
            <p className="text-xs">
              📞 0984517703 | ✉️ teltecnet@outlook.com | 🛠️ Soporte técnico 24/7
            </p>
          </div>
        </div>
      </footer>

      <style jsx>{`
        @keyframes blob {
          0% {
            transform: translate(0px, 0px) scale(1) rotate(0deg);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1) rotate(120deg);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9) rotate(240deg);
          }
          100% {
            transform: translate(0px, 0px) scale(1) rotate(360deg);
          }
        }
        
        .animate-blob {
          animation: blob 10s infinite ease-in-out;
        }
        
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  )
}
