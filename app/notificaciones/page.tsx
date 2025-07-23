"use client";
import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select"
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table"
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import {
  ArrowLeft,
  Plus,
  Search,
  Send,
  MessageSquare,
  Bell,
  Clock,
  CheckCircle,
  XCircle,
  Phone,
  Users,
  AlertTriangle,
  Calendar,
  Zap,
} from "lucide-react"

interface Notificacion {
  id: number
  cliente_id: number
  cliente_nombre: string
  cliente_telefono: string
  cliente_telegram_chat_id?: string
  tipo: "pago_proximo" | "pago_vencido" | "corte_servicio" | "promocion" | "mantenimiento"
  mensaje: string
  fecha_envio?: string
  estado: "pendiente" | "enviado" | "fallido"
  canal: "telegram" | "email" | "sms"
  fecha_creacion: string
}

interface ClienteConPago {
  id: number
  nombres: string
  apellidos: string
  telefono: string
  email?: string
  precio_plan: number
  dias_desde_registro: number
  dias_sin_pago: number
  debe_pagar: boolean
  estado_pago: 'al_dia' | 'proximo_vencimiento' | 'vencido' | 'corte_pendiente'
}

interface Estadisticas {
  total: number
  pendientes: number
  enviadas: number
  fallidas: number
  telegram: number
  email: number
  sms: number
}

// --- API HELPERS ---
async function fetchNotificaciones(): Promise<Notificacion[]> {
  const res = await fetch("/api/notificaciones")
  if (res.status === 401) throw new Error("UNAUTHORIZED")
  if (!res.ok) throw new Error("FETCH_ERROR")
  return res.json()
}

async function fetchClientes(): Promise<ClienteConPago[]> {
  const res = await fetch("/api/notificaciones/clientes")
  if (!res.ok) throw new Error("FETCH_ERROR")
  return res.json()
}

async function fetchEstadisticas(): Promise<Estadisticas> {
  const res = await fetch("/api/notificaciones/estadisticas")
  if (!res.ok) throw new Error("FETCH_ERROR")
  return res.json()
}



async function enviarTelegramApi(to: string, mensaje: string) {
  const res = await fetch("/api/notificaciones/send-telegram", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ to, body: mensaje }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Error al enviar Telegram");
  }
}

async function procesarNotificaciones() {
  const res = await fetch("/api/notificaciones/procesar", { method: "POST" });
  if (!res.ok) throw new Error("Error al procesar notificaciones");
  return res.json();
}

async function enviarNotificacionMasiva(tipo: string, mensaje: string) {
  const res = await fetch("/api/notificaciones/masiva", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tipo, mensaje }),
  });
  if (!res.ok) throw new Error("Error al enviar notificación masiva");
  return res.json();
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
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
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
    mensaje: "",
  })
  const router = useRouter()
  const [sectores, setSectores] = useState<string[]>([]);

  useEffect(() => {
    fetch("/api/clientes/valores-unicos")
      .then(res => res.json())
      .then(data => {
        if (data.success) setSectores(data.sectores);
      });
  }, []);

  const tiposNotificacion = [
    { valor: "pago_proximo", label: "Pago Próximo", color: "bg-yellow-100 text-yellow-800", icon: Calendar },
    { valor: "pago_vencido", label: "Pago Vencido", color: "bg-red-100 text-red-800", icon: AlertTriangle },
    { valor: "corte_servicio", label: "Corte Servicio", color: "bg-red-100 text-red-800", icon: Zap },
    { valor: "promocion", label: "Promoción", color: "bg-blue-100 text-blue-800", icon: MessageSquare },
    { valor: "mantenimiento", label: "Mantenimiento", color: "bg-purple-100 text-purple-800", icon: Clock },
  ] as const

  const mensajesPredefinidos: Record<Notificacion["tipo"], string> = {
    pago_proximo: "🔔 Estimado cliente, se aproxima la fecha de pago de su servicio de internet. Por favor acérquese a cancelar. ¡Gracias por su preferencia! - TelTec",
    pago_vencido: "⚠️ Estimado cliente, su pago está vencido. Su servicio de internet será posteriormente cortado. Acérquese a cancelar el servicio para restablecer la conexión. - TelTec",
    corte_servicio: "🚨 AVISO IMPORTANTE: Su servicio de internet será suspendido por falta de pago. Comuníquese inmediatamente con nosotros para evitar la suspensión. TelTec",
    promocion: "🎉 ¡Oferta especial! Consulte nuestras promociones de internet. ¡No se pierda esta oportunidad! - TelTec",
    mantenimiento: "🔧 Mantenimiento programado en su sector. Le informaremos cuando esté completado. Gracias por su comprensión. - TelTec",
  }

  // Carga inicial
  useEffect(() => {
    cargarDatos()
  }, [])

  const cargarDatos = async () => {
    try {
      setLoading(true)
      const [notifData, clientesData, statsData] = await Promise.all([
        fetchNotificaciones(),
        fetchClientes(),
        fetchEstadisticas()
      ])
      setNotificaciones(notifData)
      setClientes(clientesData)
      setEstadisticas(statsData)
    } catch (err: any) {
      if (err.message === "UNAUTHORIZED") {
        router.push("/")
      } else {
        console.error(err)
        setError("No se pudieron cargar los datos. Intente más tarde.")
      }
    } finally {
      setLoading(false)
    }
  }

  // Crear nueva notificación
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.cliente_id) return

    try {
      const res = await fetch("/api/notificaciones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })
      if (!res.ok) throw new Error("Error al crear notificación")
      
      await cargarDatos()
      setIsDialogOpen(false)
      setFormData({
        cliente_id: null,
        tipo: "pago_proximo",
        mensaje: "",
        canal: "telegram",
      })
    } catch (error) {
      console.error("Error:", error)
      setError("Error al crear la notificación")
    }
  }

  // Enviar notificación masiva
  const handleMasivaSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setLoading(true)
      const result = await enviarNotificacionMasiva(masivaData.tipo, masivaData.mensaje)
      alert(`Se crearon ${result.notificaciones_creadas} notificaciones para envío`)
      await cargarDatos()
      setIsMasivaDialogOpen(false)
      setMasivaData({
        tipo: "promocion",
        mensaje: "",
      })
    } catch (error) {
      console.error("Error:", error)
      setError("Error al crear notificaciones masivas")
    } finally {
      setLoading(false)
    }
  }

  // Enviar una notificación
  const enviarNotificacion = async (id: number) => {
    const notif = notificaciones.find((n) => n.id === id);
    if (!notif) return;

    try {
      if (notif.canal === 'telegram') {
        await enviarTelegramApi(notif.cliente_telegram_chat_id || '', notif.mensaje);
      }
      await fetch(`/api/notificaciones/${id}/mark-enviado`, { method: "PATCH" });
      await cargarDatos()
    } catch (error) {
      console.error("Error:", error)
      setError("Error al enviar la notificación")
    }
  }

  // Procesar todas las notificaciones
  const handleProcesarNotificaciones = async () => {
    try {
      setLoading(true)
      const result = await procesarNotificaciones()
      alert(`Procesamiento completado: ${result.procesadas} enviadas, ${result.errores} errores`)
      await cargarDatos()
    } catch (error) {
      console.error("Error:", error)
      setError("Error al procesar notificaciones")
    } finally {
      setLoading(false)
    }
  }

  // Filtrar notificaciones
  const filteredNotificaciones = notificaciones.filter((n) => {
    const matchSearch = n.cliente_nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       n.mensaje.toLowerCase().includes(searchTerm.toLowerCase())
    const matchTipo = filterTipo === "todos" || n.tipo === filterTipo
    const matchEstado = filterEstado === "todos" || n.estado === filterEstado
    return matchSearch && matchTipo && matchEstado
  })

  // Badges
  const getEstadoBadge = (estado: Notificacion["estado"]) => {
    const configs = {
      enviado: { color: "bg-green-100 text-green-800", icon: CheckCircle },
      pendiente: { color: "bg-yellow-100 text-yellow-800", icon: Clock },
      fallido: { color: "bg-red-100 text-red-800", icon: XCircle }
    }
    const config = configs[estado]
    const Icon = config.icon
    return (
      <Badge className={config.color}>
        <Icon className="h-3 w-3 mr-1" />
        {estado.charAt(0).toUpperCase() + estado.slice(1)}
      </Badge>
    )
  }

  const getTipoBadge = (tipo: Notificacion["tipo"]) => {
    const config = tiposNotificacion.find((x) => x.valor === tipo)
    if (!config) return null
    const Icon = config.icon
    return (
      <Badge className={config.color}>
        <Icon className="h-3 w-3 mr-1" />
        {config.label}
      </Badge>
    )
  }

  const getEstadoPagoBadge = (estado: string) => {
    const configs = {
      al_dia: { color: "bg-green-100 text-green-800", label: "Al día" },
      proximo_vencimiento: { color: "bg-yellow-100 text-yellow-800", label: "Próximo a vencer" },
      vencido: { color: "bg-red-100 text-red-800", label: "Vencido" },
      corte_pendiente: { color: "bg-red-200 text-red-900", label: "Corte pendiente" }
    }
    const config = configs[estado as keyof typeof configs] || configs.al_dia
    return <Badge className={config.color}>{config.label}</Badge>
  }

  const getCanalBadge = (canal: Notificacion["canal"]) => {
    const configs = {
      telegram: { color: "bg-blue-100 text-blue-800", label: "TELEGRAM" },
      email: { color: "bg-purple-100 text-purple-800", label: "EMAIL" },
      sms: { color: "bg-orange-100 text-orange-800", label: "SMS" }
    }
    const config = configs[canal] || { color: "bg-gray-100 text-gray-800", label: "DESCONOCIDO" }
    return <Badge className={config.color}>{config.label}</Badge>
  }

  if (loading && !estadisticas) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Cargando sistema de notificaciones...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                onClick={() => router.push("/dashboard")}
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Volver</span>
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-slate-900">Sistema de Notificaciones</h1>
                <p className="text-slate-600">Telegram automatizado para TelTec</p>
              </div>
            </div>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                onClick={handleProcesarNotificaciones}
                disabled={loading}
                className="flex items-center space-x-2"
              >
                <Send className="h-4 w-4" />
                <span>Procesar Automático</span>
              </Button>
              <Dialog open={isMasivaDialogOpen} onOpenChange={setIsMasivaDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="flex items-center space-x-2">
                    <Users className="h-4 w-4" />
                    <span>Envío Masivo</span>
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Envío Masivo a Todos los Clientes</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleMasivaSubmit} className="space-y-4">
                    <div>
                      <Label htmlFor="tipo-masiva">Tipo de Notificación</Label>
                      <Select
                        value={masivaData.tipo}
                        onValueChange={(value) => setMasivaData(prev => ({ 
                          ...prev, 
                          tipo: value as Notificacion["tipo"],
                          mensaje: mensajesPredefinidos[value as Notificacion["tipo"]]
                        }))}
                      >
                        <SelectTrigger>
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
                      <Label htmlFor="mensaje-masiva">Mensaje</Label>
                      <Textarea
                        id="mensaje-masiva"
                        value={masivaData.mensaje}
                        onChange={(e) => setMasivaData(prev => ({ ...prev, mensaje: e.target.value }))}
                        placeholder="Escriba el mensaje..."
                        rows={4}
                        required
                      />
                    </div>
                    <DialogFooter>
                      <Button type="submit" disabled={loading}>
                        {loading ? "Creando..." : "Crear Notificaciones"}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-green-600 hover:bg-green-700 text-white flex items-center space-x-2">
                    <Plus className="h-4 w-4" />
                    <span>Nueva Notificación</span>
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Nueva Notificación</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <Label htmlFor="cliente">Cliente</Label>
                      <Select
                        value={formData.cliente_id?.toString() || ""}
                        onValueChange={(value) => setFormData(prev => ({ ...prev, cliente_id: parseInt(value) }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar cliente" />
                        </SelectTrigger>
                        <SelectContent>
                          {clientes
                            .filter(cliente => cliente.id && cliente.nombres && cliente.apellidos)
                            .map((cliente) => (
                              <SelectItem key={cliente.id} value={cliente.id.toString()}>
                                {cliente.nombres} {cliente.apellidos} - {cliente.telefono}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="tipo">Tipo</Label>
                      <Select
                        value={formData.tipo}
                        onValueChange={(value) => setFormData(prev => ({ 
                          ...prev, 
                          tipo: value as Notificacion["tipo"],
                          mensaje: mensajesPredefinidos[value as Notificacion["tipo"]]
                        }))}
                      >
                        <SelectTrigger>
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
                      <Label htmlFor="canal">Canal</Label>
                      <Select
                        value={formData.canal}
                        onValueChange={(value) => setFormData(prev => ({ ...prev, canal: value as Notificacion["canal"] }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="telegram">Telegram</SelectItem>
                          <SelectItem value="email">Email</SelectItem>
                          <SelectItem value="sms">SMS</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="mensaje">Mensaje</Label>
                      <Textarea
                        id="mensaje"
                        value={formData.mensaje}
                        onChange={(e) => setFormData(prev => ({ ...prev, mensaje: e.target.value }))}
                        placeholder="Escriba el mensaje..."
                        rows={4}
                        required
                      />
                    </div>
                    <DialogFooter>
                      <Button type="submit">Crear Notificación</Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Error */}
          {error && (
            <Card className="mb-6 border-red-200 bg-red-50">
              <CardContent className="p-4">
                <p className="text-red-600">{error}</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setError(null)}
                  className="mt-2"
                >
                  Cerrar
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Estadísticas */}
          {estadisticas && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
              <Card className="bg-gray-600 text-white">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Total</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{estadisticas.total}</div>
                </CardContent>
              </Card>
              <Card className="bg-yellow-500 text-white">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{estadisticas.pendientes}</div>
                </CardContent>
              </Card>
              <Card className="bg-green-600 text-white">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Enviadas</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{estadisticas.enviadas}</div>
                </CardContent>
              </Card>
              <Card className="bg-red-600 text-white">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Fallidas</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{estadisticas.fallidas}</div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Tabs */}
          <Tabs defaultValue="notificaciones" className="space-y-6">
            <TabsList className="grid grid-cols-3">
              <TabsTrigger value="notificaciones">Notificaciones</TabsTrigger>
              <TabsTrigger value="clientes">Clientes</TabsTrigger>
              <TabsTrigger value="configuracion">Configuración</TabsTrigger>
            </TabsList>

            <TabsContent value="notificaciones" className="space-y-4">
              <Card>
                <CardContent className="flex flex-col md:flex-row gap-4 p-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <Input
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Buscar notificaciones..."
                      className="pl-10"
                    />
                  </div>
                  <Select
                    value={filterTipo}
                    onValueChange={(v) => setFilterTipo(v as any)}
                  >
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos los tipos</SelectItem>
                      {tiposNotificacion.map((t) => (
                        <SelectItem key={t.valor} value={t.valor}>
                          {t.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select
                    value={filterEstado}
                    onValueChange={(v) => setFilterEstado(v as any)}
                  >
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Estado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos los estados</SelectItem>
                      <SelectItem value="pendiente">Pendientes</SelectItem>
                      <SelectItem value="enviado">Enviadas</SelectItem>
                      <SelectItem value="fallido">Fallidas</SelectItem>
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Notificaciones ({filteredNotificaciones.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Cliente</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Canal</TableHead>
                        <TableHead>Mensaje</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredNotificaciones.map((notif) => (
                        <TableRow key={notif.id}>
                          <TableCell>
                            <div className="font-medium">{notif.cliente_nombre}</div>
                            <div className="text-sm text-slate-500 flex items-center">
                              <Phone className="h-3 w-3 mr-1" />
                              {notif.cliente_telefono}
                            </div>
                          </TableCell>
                          <TableCell>{getTipoBadge(notif.tipo)}</TableCell>
                          <TableCell>
                            {getCanalBadge(notif.canal)}
                          </TableCell>
                          <TableCell className="max-w-xs">
                            <div className="truncate" title={notif.mensaje}>
                              {notif.mensaje}
                            </div>
                          </TableCell>
                          <TableCell>{getEstadoBadge(notif.estado)}</TableCell>
                          <TableCell className="text-sm">
                            <div>Creado: {new Date(notif.fecha_creacion).toLocaleDateString()}</div>
                            {notif.fecha_envio && (
                              <div>Enviado: {new Date(notif.fecha_envio).toLocaleDateString()}</div>
                            )}
                          </TableCell>
                          <TableCell>
                            {notif.estado === "pendiente" && (
                              <Button 
                                size="sm" 
                                onClick={() => enviarNotificacion(notif.id)}
                                className="flex items-center space-x-1"
                              >
                                <Send className="h-3 w-3" />
                                <span>Enviar</span>
                              </Button>
                            )}
                            {notif.estado === "fallido" && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => enviarNotificacion(notif.id)}
                                className="flex items-center space-x-1"
                              >
                                <Send className="h-3 w-3" />
                                <span>Reintentar</span>
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="clientes" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Estado de Pagos de Clientes ({clientes.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Cliente</TableHead>
                        <TableHead>Teléfono</TableHead>
                        <TableHead>Plan</TableHead>
                        <TableHead>Días sin Pago</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead>Debe Pagar</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {clientes.map((cliente) => (
                        <TableRow key={cliente.id}>
                          <TableCell className="font-medium">
                            {cliente.nombres} {cliente.apellidos}
                          </TableCell>
                          <TableCell>{cliente.telefono}</TableCell>
                          <TableCell>${cliente.precio_plan}</TableCell>
                          <TableCell>
                            <span className={cliente.dias_sin_pago > 30 ? "text-red-600 font-semibold" : ""}>
                              {cliente.dias_sin_pago} días
                            </span>
                          </TableCell>
                          <TableCell>{getEstadoPagoBadge(cliente.estado_pago)}</TableCell>
                          <TableCell>
                            {cliente.debe_pagar ? (
                              <Badge className="bg-red-100 text-red-800">Sí</Badge>
                            ) : (
                              <Badge className="bg-green-100 text-green-800">No</Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="configuracion" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Configuración del Sistema</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-lg font-semibold mb-2">Notificaciones Automáticas</h3>
                      <ul className="space-y-2 text-sm">
                        <li>• Pagos próximos: 5 días antes (25-29 días)</li>
                        <li>• Pagos vencidos: Después de 30 días</li>
                        <li>• Corte de servicio: Después de 35 días</li>
                      </ul>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold mb-2">Configuración Telegram</h3>
                      <ul className="space-y-2 text-sm">
                        <li>• Bot Token: {process.env.TELEGRAM_BOT_TOKEN ? "Configurado" : "No configurado"}</li>
                        <li>• Estado: {process.env.TELEGRAM_BOT_TOKEN ? "Activo" : "Inactivo"}</li>
                      </ul>
                    </div>
                  </div>
                  <div className="pt-4">
                    <Button onClick={handleProcesarNotificaciones} disabled={loading}>
                      {loading ? "Procesando..." : "Ejecutar Proceso Automático"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}