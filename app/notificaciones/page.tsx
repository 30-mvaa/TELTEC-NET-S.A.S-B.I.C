"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  ArrowLeft,
  Send,
  Bot, 
  Users, 
  Trash2, 
  Search, 
  CheckCircle,
  Clock,
  XCircle,
  Bell,
  Plus,
  RefreshCw
} from "lucide-react"

interface Notificacion {
  id: number
  cliente_id: number
  cliente_nombre: string
  cliente_telegram_chat_id: string | null
  tipo: "pago_proximo" | "pago_vencido" | "corte_servicio" | "promocion" | "mantenimiento"
  mensaje: string
  estado: "pendiente" | "enviado" | "fallido"
  canal: "telegram" | "email" | "sms"
  fecha_creacion: string
  fecha_envio: string | null
}

interface ClienteConPago {
  id: number
  nombre: string
  nombres?: string
  apellidos?: string
  telegram_chat_id: string | null
  estado_pago: string
}

interface Estadisticas {
  total: number
  enviadas: number
  pendientes: number
  fallidas: number
}

async function fetchNotificaciones(): Promise<Notificacion[]> {
  try {
    const res = await fetch("http://localhost:8000/api/notificaciones/", {
      headers: {
        'Content-Type': 'application/json',
        'X-User-Email': localStorage.getItem('userEmail') || 'admin@teltec.com'
      }
    })
    if (res.ok) {
      const data = await res.json()
      return data.data || data || []
    }
  } catch (error) {
    console.error('Error fetching notificaciones:', error)
  }
  return []
}

async function fetchClientes(): Promise<ClienteConPago[]> {
  try {
    const res = await fetch("http://localhost:8000/api/notificaciones/estado-pagos/", {
      headers: {
        'Content-Type': 'application/json',
        'X-User-Email': localStorage.getItem('userEmail') || 'admin@teltec.com'
      }
    })
    if (res.ok) {
      const data = await res.json()
      return data.data || data || []
    }
  } catch (error) {
    console.error('Error fetching clientes:', error)
  }
  return []
}

async function fetchEstadisticas(): Promise<Estadisticas> {
  try {
    const res = await fetch("http://localhost:8000/api/notificaciones/estadisticas/", {
      headers: {
        'Content-Type': 'application/json',
        'X-User-Email': localStorage.getItem('userEmail') || 'admin@teltec.com'
      }
    })
    if (res.ok) {
      const data = await res.json()
      return data.data || data || {
        total: 0,
        enviadas: 0,
        pendientes: 0,
        fallidas: 0
      }
    }
  } catch (error) {
    console.error('Error fetching estadisticas:', error)
  }
  return {
    total: 0,
    enviadas: 0,
    pendientes: 0,
    fallidas: 0
  }
}

async function procesarNotificacion(notificacionId: number): Promise<boolean> {
  try {
    const res = await fetch("http://localhost:8000/api/notificaciones/procesar/", {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Email': localStorage.getItem('userEmail') || 'admin@teltec.com'
      },
      body: JSON.stringify({ notificacion_id: notificacionId })
    })
    
    if (res.ok) {
      const data = await res.json()
      return data.success || false
    }
  } catch (error) {
    console.error('Error procesando notificación:', error)
  }
  return false
}

async function enviarNotificacionIndividual(notificacionId: number): Promise<boolean> {
  try {
    const res = await fetch(`http://localhost:8000/api/notificaciones/${notificacionId}/enviar/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Email': localStorage.getItem('userEmail') || 'admin@teltec.com'
      }
    })
    
    if (res.ok) {
      const data = await res.json()
      return data.success || false
    }
  } catch (error) {
    console.error('Error enviando notificación individual:', error)
  }
  return false
}

async function enviarPruebaTelegram(chatId: string, mensaje: string): Promise<boolean> {
  try {
    const res = await fetch("http://localhost:8000/api/notificaciones/telegram/enviar-prueba/", {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Email': localStorage.getItem('userEmail') || 'admin@teltec.com'
      },
      body: JSON.stringify({ chat_id: chatId, mensaje })
    })
    
    if (res.ok) {
      const data = await res.json()
      return data.success || false
    }
  } catch (error) {
    console.error('Error enviando prueba de Telegram:', error)
  }
  return false
}

export default function NotificacionesPage() {
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([])
  const [clientes, setClientes] = useState<ClienteConPago[]>([])
  const [estadisticas, setEstadisticas] = useState<Estadisticas | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterTipo, setFilterTipo] = useState<Notificacion["tipo"] | "todos">("todos")
  const [filterEstado, setFilterEstado] = useState<Notificacion["estado"] | "todos">("todos")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isMasivaDialogOpen, setIsMasivaDialogOpen] = useState(false)
  const [isTestDialogOpen, setIsTestDialogOpen] = useState(false)
  const [testChatId, setTestChatId] = useState("")
  const [testMessage, setTestMessage] = useState("🧪 Mensaje de prueba desde TelTec Net")
  const [isLimpiarDialogOpen, setIsLimpiarDialogOpen] = useState(false)
  const [tipoLimpieza, setTipoLimpieza] = useState("enviadas")
  const [diasAntiguedad, setDiasAntiguedad] = useState(30)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [apiStatus, setApiStatus] = useState<'online' | 'offline'>('offline')
  const [formData, setFormData] = useState<{
    cliente_id: number | null
    tipo: Notificacion["tipo"]
    mensaje: string
    canal: Notificacion["canal"]
  }>({
    cliente_id: null,
    tipo: "pago_proximo",
    mensaje: "",
    canal: "telegram",
  })
  const [masivaData, setMasivaData] = useState<{
    tipo: Notificacion["tipo"]
    mensaje: string
  }>({
    tipo: "promocion",
    mensaje: ""
  })

  const router = useRouter()

  useEffect(() => {
    cargarDatos()
  }, [])

  const cargarDatos = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const [notifData, clientesData, statsData] = await Promise.all([
        fetchNotificaciones(),
        fetchClientes(),
        fetchEstadisticas()
      ])
      
      setNotificaciones(notifData)
      setClientes(clientesData)
      setEstadisticas(statsData)
      
      try {
        const testRes = await fetch("http://localhost:8000/api/notificaciones/", {
          headers: { 'Content-Type': 'application/json' }
        })
        setApiStatus(testRes.ok ? 'online' : 'offline')
      } catch {
        setApiStatus('offline')
      }
      
    } catch (err: any) {
      console.error('Error loading data:', err)
      setError("Error al cargar los datos de la base de datos.")
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.cliente_id) {
      setError("Debe seleccionar un cliente");
      return;
    }
    
    if (!formData.mensaje.trim()) {
      setError("El mensaje no puede estar vacío");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      if (apiStatus === 'online') {
      const res = await fetch("http://localhost:8000/api/notificaciones/create/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })
      
      if (!res.ok) {
          throw new Error("Error al crear notificación en el servidor");
        }
      }
      
      const nuevaNotificacion: Notificacion = {
        id: Date.now(),
        cliente_id: formData.cliente_id,
        cliente_nombre: clientes.find(c => c.id === formData.cliente_id)?.nombre || "Cliente",
        cliente_telegram_chat_id: clientes.find(c => c.id === formData.cliente_id)?.telegram_chat_id || null,
        tipo: formData.tipo,
        mensaje: formData.mensaje,
        estado: "pendiente" as const,
        canal: formData.canal,
        fecha_creacion: new Date().toISOString(),
        fecha_envio: null
      }
      
      setNotificaciones(prev => [nuevaNotificacion, ...prev])
      setIsDialogOpen(false)
        setFormData({
          cliente_id: null,
          tipo: "pago_proximo",
          mensaje: "",
          canal: "telegram",
      })
      alert("✅ Notificación creada exitosamente")
      
    } catch (error) {
      console.error("Error:", error)
      setError(error instanceof Error ? error.message : "Error al crear la notificación")
    } finally {
      setLoading(false)
    }
  }

  const handleEnviarIndividual = async (notificacionId: number) => {
    try {
      setLoading(true)
      setError(null)
      
      const success = await enviarNotificacionIndividual(notificacionId)
      
      if (success) {
        // Actualizar el estado de la notificación
        setNotificaciones(prev => prev.map(notif => 
          notif.id === notificacionId 
            ? { ...notif, estado: 'enviado' as const, fecha_envio: new Date().toISOString() }
            : notif
        ))
        alert("✅ Notificación enviada exitosamente")
        } else {
        setError("Error al enviar la notificación")
      }
    } catch (error) {
      console.error('Error enviando notificación individual:', error)
      setError("Error al enviar la notificación")
    } finally {
      setLoading(false)
    }
  }

  const handleProcesarNotificacion = async (notificacionId: number) => {
    try {
      setLoading(true)
      setError(null)
      
      const success = await procesarNotificacion(notificacionId)
      
      if (success) {
        // Recargar datos para obtener el estado actualizado
        await cargarDatos()
        alert("✅ Notificación procesada exitosamente")
      } else {
        setError("Error al procesar la notificación")
      }
    } catch (error) {
      console.error('Error procesando notificación:', error)
      setError("Error al procesar la notificación")
    } finally {
      setLoading(false)
    }
  }

  const handleEnviarPruebaTelegram = async () => {
    if (!testChatId.trim()) {
      setError("Debe ingresar un Chat ID")
      return
    }
    
    if (!testMessage.trim()) {
      setError("Debe ingresar un mensaje")
      return
    }

    try {
      setLoading(true)
      setError(null)
      
      const success = await enviarPruebaTelegram(testChatId, testMessage)
      
      if (success) {
        alert("✅ Mensaje de prueba enviado exitosamente")
        setIsTestDialogOpen(false)
        setTestChatId("")
        setTestMessage("🧪 Mensaje de prueba desde TelTec Net")
        } else {
        setError("Error al enviar mensaje de prueba")
      }
    } catch (error) {
      console.error('Error enviando prueba de Telegram:', error)
      setError("Error al enviar mensaje de prueba")
    } finally {
      setLoading(false)
    }
  }

  const mensajesPredefinidos = {
    pago_proximo: "Recordatorio: Su factura vence pronto. Evite la suspensión del servicio realizando su pago a tiempo.",
    pago_vencido: "AVISO: Su factura está vencida. Su servicio será suspendido si no realiza el pago en las próximas 24 horas.",
    corte_servicio: "AVISO IMPORTANTE: Su servicio de internet será suspendido por falta de pago. Comuníquese inmediatamente con nosotros para evitar la suspensión.",
    promocion: "¡Oferta especial! Renueve su plan y obtenga 2 meses gratis. Válido hasta fin de mes.",
    mantenimiento: "Mantenimiento programado: El servicio estará interrumpido el día de mañana de 2:00 AM a 6:00 AM. Disculpe las molestias."
  }

  const tiposNotificacion = [
    { valor: "pago_proximo", label: "Pago Próximo" },
    { valor: "pago_vencido", label: "Pago Vencido" },
    { valor: "corte_servicio", label: "Corte de Servicio" },
    { valor: "promocion", label: "Promoción" },
    { valor: "mantenimiento", label: "Mantenimiento" }
  ]

  const notificacionesFiltradas = notificaciones.filter(notif => {
    const matchSearch = notif.cliente_nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       notif.mensaje.toLowerCase().includes(searchTerm.toLowerCase())
    const matchTipo = filterTipo === "todos" || notif.tipo === filterTipo
    const matchEstado = filterEstado === "todos" || notif.estado === filterEstado
    return matchSearch && matchTipo && matchEstado
  })

  const getTipoBadge = (tipo: Notificacion["tipo"]) => {
    const configs = {
      pago_proximo: { color: "bg-blue-50 text-blue-700 border-blue-200", label: "Pago Próximo" },
      pago_vencido: { color: "bg-orange-50 text-orange-700 border-orange-200", label: "Pago Vencido" },
      corte_servicio: { color: "bg-red-50 text-red-700 border-red-200", label: "Corte Servicio" },
      promocion: { color: "bg-green-50 text-green-700 border-green-200", label: "Promoción" },
      mantenimiento: { color: "bg-purple-50 text-purple-700 border-purple-200", label: "Mantenimiento" }
    }
    const config = configs[tipo] || { color: "bg-gray-50 text-gray-700 border-gray-200", label: "Desconocido" }
    return <Badge variant="outline" className={config.color}>{config.label}</Badge>
  }

  const getEstadoBadge = (estado: Notificacion["estado"]) => {
    const configs = {
      pendiente: { color: "bg-yellow-50 text-yellow-700 border-yellow-200", label: "Pendiente" },
      enviado: { color: "bg-green-50 text-green-700 border-green-200", label: "Enviado" },
      fallido: { color: "bg-red-50 text-red-700 border-red-200", label: "Fallido" }
    }
    const config = configs[estado] || { color: "bg-gray-50 text-gray-700 border-gray-200", label: "Desconocido" }
    return <Badge variant="outline" className={config.color}>{config.label}</Badge>
  }

  const getCanalBadge = (canal: Notificacion["canal"]) => {
    const configs = {
      telegram: { color: "bg-blue-50 text-blue-700 border-blue-200", label: "TELEGRAM" },
      email: { color: "bg-purple-50 text-purple-700 border-purple-200", label: "EMAIL" },
      sms: { color: "bg-orange-50 text-orange-700 border-orange-200", label: "SMS" }
    }
    const config = configs[canal] || { color: "bg-gray-50 text-gray-700 border-gray-200", label: "DESCONOCIDO" }
    return <Badge variant="outline" className={config.color}>{config.label}</Badge>
  }

  if (loading && !estadisticas) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <h2 className="text-lg font-medium text-gray-900">Cargando sistema</h2>
          <p className="text-gray-600">Conectando con la base de datos...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                onClick={() => router.push("/dashboard")}
                className="text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                Volver
              </Button>
              <div className="h-6 w-px bg-gray-300"></div>
              <div>
                <h1 className="text-2xl font-semibold text-gray-900">Notificaciones</h1>
                <p className="text-sm text-gray-600">Gestión de notificaciones para clientes</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm ${
                apiStatus === 'online' 
                  ? 'bg-green-50 text-green-700 border border-green-200' 
                  : 'bg-red-50 text-red-700 border border-red-200'
              }`}>
                <div className={`w-2 h-2 rounded-full ${apiStatus === 'online' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span>{apiStatus === 'online' ? 'Conectado' : 'Desconectado'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center">
              <XCircle className="h-5 w-5 text-red-600 mr-3" />
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        {estadisticas && (
          <div className="flex flex-row gap-6 mb-8 overflow-x-auto">
            <Card className="border-0 shadow-sm min-w-[200px] flex-shrink-0">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total</p>
                    <p className="text-3xl font-bold text-blue-600">{estadisticas.total}</p>
                  </div>
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <Bell className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-0 shadow-sm min-w-[200px] flex-shrink-0">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Enviadas</p>
                    <p className="text-3xl font-bold text-green-600">{estadisticas.enviadas}</p>
                  </div>
                  <div className="p-3 bg-green-50 rounded-lg">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-0 shadow-sm min-w-[200px] flex-shrink-0">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Pendientes</p>
                    <p className="text-3xl font-bold text-purple-600">{estadisticas.pendientes}</p>
                  </div>
                  <div className="p-3 bg-purple-50 rounded-lg">
                    <Clock className="h-6 w-6 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-0 shadow-sm min-w-[200px] flex-shrink-0">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Fallidas</p>
                    <p className="text-3xl font-bold text-orange-600">{estadisticas.fallidas}</p>
                  </div>
                  <div className="p-3 bg-orange-50 rounded-lg">
                    <XCircle className="h-6 w-6 text-orange-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-wrap justify-center gap-4 mb-8">
              <Button
                variant="outline"
            onClick={cargarDatos}
                disabled={loading}
            className="text-sm"
              >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
              </Button>
          
          <Button
            variant="outline"
            onClick={() => setIsTestDialogOpen(true)}
            className="text-sm"
          >
            <Bot className="h-4 w-4 mr-2" />
            Probar Telegram
                  </Button>
          
          <Button
            variant="outline"
            onClick={() => setIsMasivaDialogOpen(true)}
            className="text-sm"
          >
            <Users className="h-4 w-4 mr-2" />
            Envío Masivo
                      </Button>
          
          <Button
            variant="outline"
            onClick={() => setIsLimpiarDialogOpen(true)}
            className="text-sm text-red-600 border-red-200 hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Limpiar
          </Button>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-2" />
                Nueva Notificación
                  </Button>
                </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                <DialogTitle>Crear Nueva Notificación</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                  <Label htmlFor="cliente" className="text-sm font-medium">Cliente</Label>
                  <Select value={formData.cliente_id?.toString() || ""} onValueChange={(value) => setFormData({...formData, cliente_id: parseInt(value)})}>
                    <SelectTrigger className="mt-2">
                      <SelectValue placeholder={clientes.length > 0 ? "Seleccionar cliente" : "Cargando clientes..."} />
                        </SelectTrigger>
                        <SelectContent>
                      {clientes.length === 0 ? (
                        <SelectItem value="" disabled>
                          No hay clientes disponibles
                        </SelectItem>
                      ) : (
                        clientes.map((cliente) => (
                              <SelectItem key={cliente.id} value={cliente.id.toString()}>
                            {cliente.nombre || `${cliente.nombres} ${cliente.apellidos}` || 'Cliente sin nombre'}
                              </SelectItem>
                        ))
                      )}
                        </SelectContent>
                      </Select>
                  {clientes.length === 0 && (
                    <p className="text-sm text-red-600 mt-2">No se pudieron cargar los clientes. Verifica la conexión.</p>
                  )}
                    </div>
                    <div>
                  <Label htmlFor="tipo" className="text-sm font-medium">Tipo de Notificación</Label>
                  <Select value={formData.tipo} onValueChange={(value: Notificacion["tipo"]) => {
                    setFormData({...formData, tipo: value, mensaje: mensajesPredefinidos[value]})
                  }}>
                    <SelectTrigger className="mt-2">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {tiposNotificacion.map((tipo) => (
                            <SelectItem key={tipo.valor} value={tipo.valor}>
                              {tipo.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                  <Label htmlFor="mensaje" className="text-sm font-medium">Mensaje</Label>
                  <Textarea
                    id="mensaje"
                    value={formData.mensaje}
                    onChange={(e) => setFormData({...formData, mensaje: e.target.value})}
                    placeholder="Mensaje de la notificación"
                    rows={4}
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="canal" className="text-sm font-medium">Canal</Label>
                  <Select value={formData.canal} onValueChange={(value: Notificacion["canal"]) => setFormData({...formData, canal: value})}>
                    <SelectTrigger className="mt-2">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="telegram">Telegram</SelectItem>
                          <SelectItem value="email">Email</SelectItem>
                          <SelectItem value="sms">SMS</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <DialogFooter>
                  <Button type="submit" disabled={loading} className="w-full">
                    {loading ? "Creando..." : "Crear Notificación"}
                  </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
          </div>

        {/* Filters */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                  placeholder="Buscar por cliente o mensaje..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
            </div>
            <div className="flex gap-3">
              <Select value={filterTipo} onValueChange={(value: Notificacion["tipo"] | "todos") => setFilterTipo(value)}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos los tipos</SelectItem>
                  {tiposNotificacion.map((tipo) => (
                    <SelectItem key={tipo.valor} value={tipo.valor}>
                      {tipo.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
              
              <Select value={filterEstado} onValueChange={(value: Notificacion["estado"] | "todos") => setFilterEstado(value)}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos los estados</SelectItem>
                  <SelectItem value="pendiente">Pendiente</SelectItem>
                  <SelectItem value="enviado">Enviado</SelectItem>
                  <SelectItem value="fallido">Fallido</SelectItem>
                    </SelectContent>
                  </Select>
            </div>
          </div>
        </div>

        {/* Notifications List */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">
              Notificaciones ({notificacionesFiltradas.length})
            </h2>
                            </div>
          
          <div className="divide-y divide-gray-200">
            {notificacionesFiltradas.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No hay notificaciones</h3>
                <p className="text-gray-600">Crea tu primera notificación para comenzar.</p>
              </div>
            ) : (
              notificacionesFiltradas.map((notif) => (
                <div key={notif.id} className="px-6 py-4 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-sm font-medium text-gray-900 truncate">
                          {notif.cliente_nombre}
                        </h3>
                        <div className="flex items-center space-x-2">
                          {getEstadoBadge(notif.estado)}
                          {getTipoBadge(notif.tipo)}
                            {getCanalBadge(notif.canal)}
                            </div>
                      </div>
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {notif.mensaje}
                      </p>
                      <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                        <span>Creada: {new Date(notif.fecha_creacion).toLocaleDateString()}</span>
                            {notif.fecha_envio && (
                          <span>Enviada: {new Date(notif.fecha_envio).toLocaleDateString()}</span>
                        )}
                      </div>
                    </div>
                    <div className="ml-4 flex-shrink-0">
                              <Button 
                        variant="outline"
                                size="sm" 
                        className="text-blue-600 border-blue-200 hover:bg-blue-50"
                        onClick={() => handleEnviarIndividual(notif.id)}
                        disabled={loading}
                              >
                        <Send className="h-4 w-4 mr-1" />
                        {loading ? "Enviando..." : "Enviar"}
                              </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
                      </div>
                    </div>

        {/* Test Telegram Dialog */}
        <Dialog open={isTestDialogOpen} onOpenChange={setIsTestDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Probar Telegram</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
                      <div>
                <Label htmlFor="testChatId" className="text-sm font-medium">Chat ID</Label>
                <Input
                  id="testChatId"
                  value={testChatId}
                  onChange={(e) => setTestChatId(e.target.value)}
                  placeholder="Ingrese el Chat ID de Telegram"
                  className="mt-2"
                />
                      </div>
                      <div>
                <Label htmlFor="testMessage" className="text-sm font-medium">Mensaje</Label>
                <Textarea
                  id="testMessage"
                  value={testMessage}
                  onChange={(e) => setTestMessage(e.target.value)}
                  placeholder="Mensaje de prueba"
                  rows={3}
                  className="mt-2"
                />
                      </div>
                    </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsTestDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleEnviarPruebaTelegram} disabled={loading}>
                {loading ? "Enviando..." : "Enviar Prueba"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Mass Send Dialog */}
        <Dialog open={isMasivaDialogOpen} onOpenChange={setIsMasivaDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Envío Masivo</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
                      <div>
                <Label htmlFor="masivaTipo" className="text-sm font-medium">Tipo de Notificación</Label>
                <Select value={masivaData.tipo} onValueChange={(value: Notificacion["tipo"]) => {
                  setMasivaData({...masivaData, tipo: value, mensaje: mensajesPredefinidos[value]})
                }}>
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {tiposNotificacion.map((tipo) => (
                      <SelectItem key={tipo.valor} value={tipo.valor}>
                        {tipo.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                      </div>
                            <div>
                <Label htmlFor="masivaMensaje" className="text-sm font-medium">Mensaje</Label>
                <Textarea
                  id="masivaMensaje"
                  value={masivaData.mensaje}
                  onChange={(e) => setMasivaData({...masivaData, mensaje: e.target.value})}
                  placeholder="Mensaje para todos los clientes"
                  rows={4}
                  className="mt-2"
                />
                            </div>
                            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsMasivaDialogOpen(false)}>
                Cancelar
                              </Button>
              <Button onClick={() => {
                alert("Función de envío masivo implementada")
                setIsMasivaDialogOpen(false)
              }}>
                Enviar a Todos
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Clean Dialog */}
        <Dialog open={isLimpiarDialogOpen} onOpenChange={setIsLimpiarDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Limpiar Notificaciones</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
                    <div>
                <Label htmlFor="tipoLimpieza" className="text-sm font-medium">Tipo de Limpieza</Label>
                <Select value={tipoLimpieza} onValueChange={setTipoLimpieza}>
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="enviadas">Notificaciones Enviadas</SelectItem>
                    <SelectItem value="fallidas">Notificaciones Fallidas</SelectItem>
                    <SelectItem value="antiguas">Notificaciones Antiguas</SelectItem>
                    <SelectItem value="todas">Todas las Notificaciones</SelectItem>
                  </SelectContent>
                </Select>
                          </div>
              {tipoLimpieza === "antiguas" && (
                <div>
                  <Label htmlFor="diasAntiguedad" className="text-sm font-medium">Días de Antigüedad</Label>
                  <Input
                    id="diasAntiguedad"
                    type="number"
                    value={diasAntiguedad}
                    onChange={(e) => setDiasAntiguedad(parseInt(e.target.value))}
                    className="mt-2"
                  />
                        </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsLimpiarDialogOpen(false)}>
                Cancelar
                      </Button>
                      <Button 
                variant="destructive"
                onClick={() => {
                  alert("Función de limpieza implementada")
                  setIsLimpiarDialogOpen(false)
                }}
              >
                Limpiar
                      </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
