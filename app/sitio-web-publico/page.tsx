"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Globe, Mail, Phone, MapPin, Building, Users, Package, Shield, Wifi, CheckCircle, Star } from "lucide-react"

export default function SitioWebPublicoPage() {
  const [sitioWeb, setSitioWeb] = useState<any>(null)
  const [loading, setLoading] = useState(true)
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
      }
    }
    
    fetchSitioWeb()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando sitio web...</p>
        </div>
      </div>
    )
  }

  if (!sitioWeb) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 flex items-center justify-center">
        <div className="text-center">
          <Globe className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Error al cargar</h1>
          <p className="text-gray-600 mb-4">No se pudieron cargar los datos del sitio web</p>
          <Button onClick={() => window.location.reload()}>
            Reintentar
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                onClick={() => router.push('/')}
                className="text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver
              </Button>
              <div className="flex items-center">
                <Wifi className="w-8 h-8 text-blue-600 mr-3" />
                <h1 className="text-2xl font-bold text-gray-900">
                  <span className="text-blue-600">Tel</span>
                  <span className="text-purple-600">Tec</span>
                  <span className="text-green-600"> Net</span>
                </h1>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <Button
                onClick={() => router.push('/login-simple')}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Iniciar Sesión
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl font-bold mb-6">
            {sitioWeb.informacion.titulo}
          </h1>
          <p className="text-xl mb-8 text-blue-100">
            {sitioWeb.informacion.subtitulo}
          </p>
          <p className="text-lg mb-8 max-w-3xl mx-auto text-blue-100">
            {sitioWeb.informacion.descripcion}
          </p>
          <div className="flex justify-center space-x-4">
            <Button
              onClick={() => router.push('/login-simple')}
              className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-3 text-lg font-semibold"
            >
              Iniciar Sesión
            </Button>
            <Button
              variant="outline"
              className="border-white text-white hover:bg-white hover:text-blue-600 px-8 py-3 text-lg font-semibold"
            >
              Contactar
            </Button>
          </div>
        </div>
      </section>

      {/* Servicios */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Nuestros Servicios</h2>
            <p className="text-xl text-gray-600">Soluciones de internet de alta calidad para hogares y empresas</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {sitioWeb.servicios.map((servicio: any) => (
              <Card key={servicio.id} className="hover:shadow-lg transition-shadow duration-300">
                <CardContent className="p-6">
                  <div className="text-center">
                    <Package className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900 mb-3">
                      {servicio.nombre}
                    </h3>
                    <p className="text-gray-600 mb-4">
                      {servicio.descripcion}
                    </p>
                    <div className="flex items-center justify-center">
                      <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                      <span className="text-sm text-green-600 font-medium">Disponible</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Información de Empresa */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold text-gray-900 mb-6">
                Sobre {sitioWeb.empresa.nombre}
              </h2>
              <p className="text-lg text-gray-600 mb-8">
                Somos una empresa comprometida con brindar el mejor servicio de internet a nuestros clientes. 
                Con años de experiencia en el sector, hemos desarrollado soluciones que satisfacen las necesidades 
                tanto de hogares como de empresas.
              </p>
              
              <div className="space-y-4">
                <div className="flex items-center">
                  <MapPin className="w-5 h-5 text-blue-600 mr-3" />
                  <span className="text-gray-700">{sitioWeb.empresa.direccion}</span>
                </div>
                <div className="flex items-center">
                  <Phone className="w-5 h-5 text-blue-600 mr-3" />
                  <span className="text-gray-700">{sitioWeb.empresa.telefono}</span>
                </div>
                <div className="flex items-center">
                  <Mail className="w-5 h-5 text-blue-600 mr-3" />
                  <span className="text-gray-700">{sitioWeb.empresa.email}</span>
                </div>
                <div className="flex items-center">
                  <Building className="w-5 h-5 text-blue-600 mr-3" />
                  <span className="text-gray-700">RUC: {sitioWeb.empresa.ruc}</span>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-8 rounded-lg shadow-lg">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Horario de Atención</h3>
              <div className="space-y-4">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                  <span className="text-gray-700">{sitioWeb.empresa.horario}</span>
                </div>
                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                  <p className="text-blue-800 font-medium">
                    Soporte técnico disponible 24/7 para clientes activos
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Redes Sociales */}
      {Object.keys(sitioWeb.redesSociales).length > 0 && (
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">Síguenos</h2>
            <p className="text-xl text-gray-600 mb-12">Mantente conectado con nosotros en redes sociales</p>
            
            <div className="flex justify-center space-x-6">
              {Object.entries(sitioWeb.redesSociales).map(([red, url]) => (
                <a
                  key={red}
                  href={url as string}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center hover:bg-blue-700 transition-colors"
                >
                  <Users className="w-6 h-6" />
                </a>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4">
                <span className="text-blue-400">Tel</span>
                <span className="text-purple-400">Tec</span>
                <span className="text-green-400"> Net</span>
              </h3>
              <p className="text-gray-400">
                {sitioWeb.informacion.lema}
              </p>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold mb-4">Contacto</h4>
              <div className="space-y-2 text-gray-400">
                <p>{sitioWeb.empresa.telefono}</p>
                <p>{sitioWeb.empresa.email}</p>
                <p>{sitioWeb.empresa.direccion}</p>
              </div>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold mb-4">Acceso</h4>
              <div className="space-y-2">
                <Button
                  variant="link"
                  onClick={() => router.push('/login-simple')}
                  className="text-blue-400 hover:text-blue-300 p-0 h-auto"
                >
                  Iniciar Sesión
                </Button>
                <br />
                <Button
                  variant="link"
                  onClick={() => router.push('/sitio-web')}
                  className="text-blue-400 hover:text-blue-300 p-0 h-auto"
                >
                  Panel Administrativo
                </Button>
              </div>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 {sitioWeb.empresa.nombre}. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
