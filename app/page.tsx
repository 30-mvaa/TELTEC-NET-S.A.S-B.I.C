
"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

export default function HomePage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const redirectToSitioWeb = async () => {
      try {
        // Pequeña pausa para mostrar el loading
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        // Redirigir automáticamente al sitio web público
        router.push('/sitio-web-publico')
      } catch (error) {
        console.error('Error en redirección:', error)
        setIsLoading(false)
      }
    }
    
    redirectToSitioWeb()
  }, [router])

  if (!isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">TelTec Net</h1>
          <p className="text-gray-600 mb-4">Sistema de Gestión Empresarial</p>
          <div className="space-y-2">
            <button 
              onClick={() => router.push('/sitio-web-publico')}
              className="block w-full bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Sitio Web
            </button>
            <button 
              onClick={() => router.push('/login-simple')}
              className="block w-full bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
            >
              Iniciar Sesión
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Cargando sitio web...</p>
      </div>
    </div>
  )
}



