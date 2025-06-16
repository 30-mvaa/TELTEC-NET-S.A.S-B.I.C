"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, Plus, Search, Send, MessageSquare, Bell, Clock, CheckCircle, XCircle, Phone } from "lucide-react"

interface Notificacion {
  id: number
  cliente_id: number
  cliente_nombre: string
  cliente_telefono: string
  tipo: "pago_proximo" | "pago_vencido" | "corte_servicio" | "promocion" | "mantenimiento"
  mensaje: string
  fecha_envio?: string
  estado: "pendiente" | "enviado" | "fallido"
  canal: "whatsapp" | "email" | "sms"
  fecha_creacion: string
}

export default function NotificacionesPage() {
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [filterTipo, setFilterTipo] = useState<string>("todos")
  const [filterEstado, setFilterEstado] = useState<string>("todos")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [formData, setFormData] = useState({
    cliente_nombre: "",
    cliente_telefono: "",
    tipo: "pago_proximo" as const,
    mensaje: "",
    canal: "whatsapp" as const,
  })
  const router = useRouter()

  const tiposNotificacion = [
    { valor: "pago_proximo", label: "Pago Próximo", color: "bg-yellow-100 text-yellow-800" },
    { valor: "pago_vencido", label: "Pago Vencido", color: "bg-red-100 text-red-800" },
    { valor: "corte_servicio", label: "Corte de Servicio", color: "bg-red-100 text-red-800" },
    { valor: "promocion", label: "Promoción", color: "bg-blue-100 text-blue-800" },
    { valor: "mantenimiento", label: "Mantenimiento", color: "bg-purple-100 text-purple-800" },
  ]

  useEffect(() => {
    // Verificar autenticación
    const userData = localStorage.getItem("user")
    if (!userData) {
      router.push("/")
      return
    }

    // Cargar notificaciones de ejemplo
    const notificacionesEjemplo: Notificacion[] = [
      {
        id: 1,
        cliente_id: 1,
        cliente_nombre: "Juan Carlos Pérez",
        cliente_telefono: "0999123456",
        tipo: "pago_vencido",
        mensaje:
          "Estimado cliente, su pago está vencido. Por favor regularice su situación para evitar la suspensión del servicio.",
        estado: "pendiente",
        canal: "whatsapp",
        fecha_creacion: "2024-06-13",
      },
      {
        id: 2,
        cliente_id: 2,
        cliente_nombre: "María Elena Rodríguez",
        cliente_telefono: "0998765432",
        tipo: "pago_proximo",
        mensaje:
          "Recordatorio: Su pago vence en 3 días (16/06/2024). Puede realizar el pago en nuestras oficinas o por transferencia.",
        fecha_envio: "2024-06-13",
        estado: "enviado",
        canal: "whatsapp",
        fecha_creacion: "2024-06-13",
      },
      {
        id: 3,
        cliente_id: 3,
        cliente_nombre: "Carlos Alberto Mendoza",
        cliente_telefono: "0997654321",
        tipo: "promocion",
        mensaje: "¡Oferta especial! Upgrade a nuestro plan Premium 50MB por solo $5 adicionales este mes. ¡Aprovecha!",
        fecha_envio: "2024-06-12",
        estado: "enviado",
        canal: "whatsapp",
        fecha_creacion: "2024-06-12",
      },
      {
        id: 4,
        cliente_id: 4,
        cliente_nombre: "Ana Sofía Vargas",
        cliente_telefono: "0996543210",
        tipo: "corte_servicio",
        mensaje:
          "AVISO IMPORTANTE: Su servicio será suspendido mañana por falta de pago. Contacte inmediatamente para evitar el corte.",
        estado: "fallido",
        canal: "whatsapp",
        fecha_creacion: "2024-06-11",
      },
    ]
    setNotificaciones(notificacionesEjemplo)
  }, [router])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const nuevaNotificacion: Notificacion = {
      id: Date.now(),
      cliente_id: Math.floor(Math.random() * 1000),
      cliente_nombre: formData.cliente_nombre,
      cliente_telefono: formData.cliente_telefono,
      tipo: formData.tipo,
      mensaje: formData.mensaje,
      estado: "pendiente",
      canal: formData.canal,
      fecha_creacion: new Date().toISOString().split("T")[0],
    }

    setNotificaciones([nuevaNotificacion, ...notificaciones])
    setIsDialogOpen(false)
    setFormData({
      cliente_nombre: "",
      cliente_telefono: "",
      tipo: "pago_proximo",
      mensaje: "",
      canal: "whatsapp",
    })
  }

  const enviarNotificacion = async (id: number) => {
    try {
      // Simular envío
      await new Promise((resolve) => setTimeout(resolve, 1000))

      setNotificaciones(
        notificaciones.map((notif) =>
          notif.id === id
            ? {
                ...notif,
                estado: "enviado" as const,
                fecha_envio: new Date().toISOString().split("T")[0],
              }
            : notif,
        ),
      )

      alert("Notificación enviada exitosamente")
    } catch (error) {
      setNotificaciones(
        notificaciones.map((notif) => (notif.id === id ? { ...notif, estado: "fallido" as const } : notif)),
      )
      alert("Error al enviar la notificación")
    }
  }

  const enviarMasivo = async () => {
    const pendientes = notificaciones.filter((n) => n.estado === "pendiente")
    if (pendientes.length === 0) {
      alert("No hay notificaciones pendientes")
      return
    }

    if (confirm(`¿Enviar ${pendientes.length} notificaciones pendientes?`)) {
      for (const notif of pendientes) {
        await enviarNotificacion(notif.id)
        await new Promise((resolve) => setTimeout(resolve, 500)) // Delay entre envíos
      }
    }
  }

  const filteredNotificaciones = notificaciones.filter((notif) => {
    const matchesSearch =
      notif.cliente_nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      notif.mensaje.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesTipo = filterTipo === "todos" || notif.tipo === filterTipo
    const matchesEstado = filterEstado === "todos" || notif.estado === filterEstado

    return matchesSearch && matchesTipo && matchesEstado
  })

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case "enviado":
        return <Badge className="bg-green-100 text-green-800">Enviado</Badge>
      case "pendiente":
        return <Badge className="bg-yellow-100 text-yellow-800">Pendiente</Badge>
      case "fallido":
        return <Badge className="bg-red-100 text-red-800">Fallido</Badge>
      default:
        return <Badge>{estado}</Badge>
    }
  }

  const getTipoBadge = (tipo: string) => {
    const tipoConfig = tiposNotificacion.find((t) => t.valor === tipo)
    return <Badge className={tipoConfig?.color}>{tipoConfig?.label}</Badge>
  }

  const pendientes = notificaciones.filter((n) => n.estado === "pendiente").length
  const enviadas = notificaciones.filter((n) => n.estado === "enviado").length
  const fallidas = notificaciones.filter((n) => n.estado === "fallido").length

  const mensajesPredefinidos = {
    pago_proximo:
      "Recordatorio: Su pago vence en [DIAS] días. Fecha límite: [FECHA]. Puede realizar el pago en nuestras oficinas o por transferencia.",
    pago_vencido:
      "Estimado cliente, su pago está vencido desde el [FECHA]. Por favor regularice su situación para evitar la suspensión del servicio.",
    corte_servicio:
      "AVISO IMPORTANTE: Su servicio será suspendido por falta de pago. Contacte inmediatamente al 0999859689 para evitar el corte.",
    promocion:
      "¡Oferta especial! Tenemos promociones disponibles para mejorar su plan de internet. ¡Consulte por WhatsApp!",
    mantenimiento:
      "Informamos que realizaremos mantenimiento en su sector el [FECHA] de [HORA_INICIO] a [HORA_FIN]. Disculpe las molestias.",
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
                <p className="text-slate-600">WhatsApp, Email y SMS automatizados</p>
              </div>
            </div>

            <div className="flex space-x-2">
              <Button
                variant="outline"
                onClick={enviarMasivo}
                disabled={pendientes === 0}
                className="flex items-center space-x-2"
              >
                <Send className="h-4 w-4" />
                <span>Enviar Pendientes ({pendientes})</span>
              </Button>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="flex items-center space-x-2 bg-green-600 hover:bg-green-700">
                    <Plus className="h-4 w-4" />
                    <span>Nueva Notificación</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle className="flex items-center space-x-2">
                      <MessageSquare className="h-5 w-5" />
                      <span>Nueva Notificación</span>
                    </DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <Label htmlFor="cliente_nombre">Nombre del Cliente *</Label>
                      <Input
                        id="cliente_nombre"
                        value={formData.cliente_nombre}
                        onChange={(e) => setFormData({ ...formData, cliente_nombre: e.target.value })}
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="cliente_telefono">Teléfono *</Label>
                      <Input
                        id="cliente_telefono"
                        value={formData.cliente_telefono}
                        onChange={(e) => setFormData({ ...formData, cliente_telefono: e.target.value })}
                        placeholder="0999123456"
                        maxLength={10}
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="tipo">Tipo *</Label>
                        <Select
                          value={formData.tipo}
                          onValueChange={(value: any) => {
                            setFormData({
                              ...formData,
                              tipo: value,
                              mensaje: mensajesPredefinidos[value as keyof typeof mensajesPredefinidos] || "",
                            })
                          }}
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
                        <Label htmlFor="canal">Canal *</Label>
                        <Select
                          value={formData.canal}
                          onValueChange={(value: "whatsapp" | "email" | "sms") =>
                            setFormData({ ...formData, canal: value })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="whatsapp">WhatsApp</SelectItem>
                            <SelectItem value="email">Email</SelectItem>
                            <SelectItem value="sms">SMS</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="mensaje">Mensaje *</Label>
                      <Textarea
                        id="mensaje"
                        value={formData.mensaje}
                        onChange={(e) => setFormData({ ...formData, mensaje: e.target.value })}
                        placeholder="Escriba el mensaje a enviar..."
                        rows={4}
                        required
                      />
                      <div className="text-xs text-slate-500 mt-1">
                        Variables disponibles: [DIAS], [FECHA], [HORA_INICIO], [HORA_FIN]
                      </div>
                    </div>

                    <div className="flex justify-end space-x-2 pt-4">
                      <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                        Cancelar
                      </Button>
                      <Button type="submit">Programar Notificación</Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium opacity-90 flex items-center">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Total Notificaciones
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{notificaciones.length}</div>
                <p className="text-xs opacity-90">Registros en el sistema</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium opacity-90 flex items-center">
                  <Clock className="h-4 w-4 mr-2" />
                  Pendientes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{pendientes}</div>
                <p className="text-xs opacity-90">Por enviar</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium opacity-90 flex items-center">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Enviadas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{enviadas}</div>
                <p className="text-xs opacity-90">Exitosas</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-red-500 to-red-600 text-white">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium opacity-90 flex items-center">
                  <XCircle className="h-4 w-4 mr-2" />
                  Fallidas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{fallidas}</div>
                <p className="text-xs opacity-90">Con errores</p>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="notificaciones" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="notificaciones">Lista de Notificaciones</TabsTrigger>
              <TabsTrigger value="plantillas">Plantillas</TabsTrigger>
              <TabsTrigger value="configuracion">Configuración</TabsTrigger>
            </TabsList>

            <TabsContent value="notificaciones" className="space-y-4">
              {/* Search and Filters */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 relative">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                      <Input
                        placeholder="Buscar por cliente o mensaje..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    <Select value={filterTipo} onValueChange={setFilterTipo}>
                      <SelectTrigger className="w-full md:w-48">
                        <SelectValue placeholder="Tipo" />
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
                    <Select value={filterEstado} onValueChange={setFilterEstado}>
                      <SelectTrigger className="w-full md:w-48">
                        <SelectValue placeholder="Estado" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todos">Todos los estados</SelectItem>
                        <SelectItem value="pendiente">Pendientes</SelectItem>
                        <SelectItem value="enviado">Enviadas</SelectItem>
                        <SelectItem value="fallido">Fallidas</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Notifications Table */}
              <Card>
                <CardHeader>
                  <CardTitle>Lista de Notificaciones ({filteredNotificaciones.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Cliente</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Mensaje</TableHead>
                        <TableHead>Canal</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredNotificaciones.map((notif) => (
                        <TableRow key={notif.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{notif.cliente_nombre}</div>
                              <div className="text-sm text-slate-500 flex items-center">
                                <Phone className="h-3 w-3 mr-1" />
                                {notif.cliente_telefono}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{getTipoBadge(notif.tipo)}</TableCell>
                          <TableCell className="max-w-xs">
                            <div className="truncate" title={notif.mensaje}>
                              {notif.mensaje}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="capitalize">
                              {notif.canal}
                            </Badge>
                          </TableCell>
                          <TableCell>{getEstadoBadge(notif.estado)}</TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <div>Creado: {notif.fecha_creacion}</div>
                              {notif.fecha_envio && <div>Enviado: {notif.fecha_envio}</div>}
                            </div>
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

            <TabsContent value="plantillas" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {Object.entries(mensajesPredefinidos).map(([tipo, mensaje]) => {
                  const tipoConfig = tiposNotificacion.find((t) => t.valor === tipo)
                  return (
                    <Card key={tipo}>
                      <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                          <Bell className="h-5 w-5" />
                          <span>{tipoConfig?.label}</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="p-3 bg-slate-50 rounded-lg">
                            <div className="text-sm text-slate-600 whitespace-pre-wrap">{mensaje}</div>
                          </div>
                          <Button variant="outline" size="sm" className="w-full">
                            Editar Plantilla
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </TabsContent>

            <TabsContent value="configuracion" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Configuración de WhatsApp</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label>Número de WhatsApp Business</Label>
                      <Input value="0999859689" disabled />
                    </div>
                    <div>
                      <Label>API Token</Label>
                      <Input type="password" value="••••••••••••••••" disabled />
                    </div>
                    <div>
                      <Label>Estado de la Conexión</Label>
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        <span className="text-sm text-green-600">Conectado</span>
                      </div>
                    </div>
                    <Button variant="outline">Probar Conexión</Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Configuración de Email</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label>Email del Sistema</Label>
                      <Input value="vangamarca4@gmail.com" disabled />
                    </div>
                    <div>
                      <Label>Servidor SMTP</Label>
                      <Input value="smtp.gmail.com" disabled />
                    </div>
                    <div>
                      <Label>Puerto</Label>
                      <Input value="587" disabled />
                    </div>
                    <div>
                      <Label>Estado de la Conexión</Label>
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        <span className="text-sm text-green-600">Configurado</span>
                      </div>
                    </div>
                    <Button variant="outline">Probar Email</Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
