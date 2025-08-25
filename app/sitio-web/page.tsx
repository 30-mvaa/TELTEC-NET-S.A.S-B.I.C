"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { ArrowLeft, Globe, Settings, Save, Mail, Phone, MapPin, Building, Users, Package, Shield, Eye, Edit, Plus, Trash2, Check, X } from "lucide-react"
import { apiRequest, API_ENDPOINTS } from "@/lib/config/api"

// Spinner simple
const Spinner = () => (
  <svg className="animate-spin mr-2 h-4 w-4 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
  </svg>
)

export default function SitioWebPage() {
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [sitioWeb, setSitioWeb] = useState({
    informacion: {
      titulo: "TelTec Net - Proveedor de Internet",
      subtitulo: "Conectando comunidades con tecnología de vanguardia",
      descripcion: "Somos una empresa líder en servicios de internet de alta velocidad, comprometida con brindar conectividad confiable y soporte técnico excepcional.",
      lema: "Conectando tu mundo digital"
    },
    empresa: {
      nombre: "TelTec Net",
      direccion: "Av. Principal 123, Centro",
      telefono: "0999859689",
      email: "info@teltecnet.com",
      ruc: "1234567890001",
      horario: "Lunes a Viernes: 8:00 AM - 6:00 PM"
    },
    servicios: [
      { id: 1, nombre: "Internet Residencial", descripcion: "Planes de internet de alta velocidad para hogares", activo: true },
      { id: 2, nombre: "Internet Empresarial", descripcion: "Soluciones de conectividad para empresas", activo: true },
      { id: 3, nombre: "Soporte Técnico 24/7", descripcion: "Asistencia técnica disponible todo el día", activo: true },
      { id: 4, nombre: "Instalación Gratuita", descripcion: "Instalación sin costo adicional", activo: true }
    ],
    redesSociales: {
      facebook: "https://facebook.com/teltecnet",
      instagram: "https://instagram.com/teltecnet",
      twitter: "https://twitter.com/teltecnet",
      linkedin: "https://linkedin.com/company/teltecnet"
    },
    configuracion: {
      mostrar_precios: true,
      mostrar_contacto: true,
      mostrar_testimonios: true,
      modo_mantenimiento: false
    }
  })
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [errors, setErrors] = useState<any>({})
  const router = useRouter()
  const [lastFetchedData, setLastFetchedData] = useState<any>(null)
  const [isDirty, setIsDirty] = useState(false)
  const [editingService, setEditingService] = useState<any>(null)
  const [showAddService, setShowAddService] = useState(false)

  // Detectar cambios locales
  useEffect(() => {
    if (!lastFetchedData) return
    setIsDirty(JSON.stringify(sitioWeb) !== JSON.stringify(lastFetchedData))
  }, [sitioWeb, lastFetchedData])

  // Hacer que el mensaje desaparezca automáticamente
  useEffect(() => {
    if (message) {
      const timeout = setTimeout(() => setMessage(null), 3000)
      return () => clearTimeout(timeout)
    }
  }, [message])

  // Verificar autenticación y permisos
  useEffect(() => {
    const userEmail = localStorage.getItem('userEmail')
    const userName = localStorage.getItem('userName')
    const userRole = localStorage.getItem('userRole')
    const userId = localStorage.getItem('userId')

    if (!userEmail || !userName || !userRole || !userId) {
    router.push('/login-simple')
      return
    }

    const user = {
      email: userEmail,
      nombre: userName,
      role: userRole,
      id: userId
    }
    setCurrentUser(user)
    
    if (userRole !== "administrador") {
      router.push("/dashboard")
      return
    }

    // Cargar datos del sitio web
    const fetchSitioWeb = async () => {
      try {
        const data = await apiRequest(API_ENDPOINTS.SITIO_WEB_CONFIGURACION)
        if (data.success && data.data) {
          if (!isDirty) {
            setSitioWeb(data.data)
            setLastFetchedData(data.data)
          }
        }
      } catch (error) {
        console.error('Error cargando configuración del sitio web:', error)
      } finally {
        setLoading(false)
      }
    }
    
    fetchSitioWeb()
  }, [router, isDirty])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando configuración del sitio web...</p>
        </div>
      </div>
    )
  }

  if (!currentUser || currentUser.role !== "administrador") {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50">
      <div className="max-w-7xl mx-auto py-8 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
      {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
              <Button 
                  variant="ghost"
                  onClick={() => router.push('/dashboard')}
                  className="text-gray-600 hover:text-gray-900"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Volver al Dashboard
                </Button>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                    <Globe className="w-8 h-8 mr-3 text-blue-600" />
                    Sitio Web
                  </h1>
                  <p className="text-gray-600 mt-1">Administra la información de tu sitio web corporativo</p>
                </div>
              </div>
            </div>
          </div>

          {/* Mensaje de estado */}
          {message && (
            <div className={`mb-6 p-4 rounded-lg ${
              message.includes('Error') ? 'bg-red-50 border border-red-200 text-red-700' : 'bg-green-50 border border-green-200 text-green-700'
            }`}>
              {message}
            </div>
          )}

          <Card>
              <CardHeader>
              <CardTitle className="flex items-center">
                <Globe className="w-5 h-5 mr-2" />
                Configuración del Sitio Web
              </CardTitle>
              </CardHeader>
              <CardContent>
              <div className="text-center py-8">
                <Globe className="w-16 h-16 text-blue-600 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Módulo en Desarrollo</h2>
                <p className="text-gray-600 mb-4">
                  El módulo de configuración del sitio web está siendo implementado.
                </p>
                <Button 
                  onClick={() => router.push('/dashboard')}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Volver al Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
} 
