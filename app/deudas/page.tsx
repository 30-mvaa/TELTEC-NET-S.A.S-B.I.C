"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { 
  ArrowLeft, 
  Search, 
  DollarSign, 
  AlertTriangle, 
  Clock, 
  Users, 
  RefreshCw,
  Settings,
  Eye,
  Calendar,
  TrendingUp,
  AlertCircle
} from "lucide-react"

type ClienteDeuda = {
  id: number
  cedula: string
  nombres: string
  apellidos: string
  tipo_plan: string
  precio_plan: number
  email: string
  telefono: string
  estado_pago: string
  meses_pendientes: number
  monto_total_deuda: number
  fecha_ultimo_pago: string | null
  fecha_vencimiento_pago: string | null
}

type CuotaMensual = {
  id: number
  mes: number
  año: number
  monto: number
  fecha_vencimiento: string
  fecha_pago: string | null
  estado: string
}

type HistorialPago = {
  id: number
  monto_pagado: number
  concepto: string
  fecha_pago: string
  meses_cubiertos: number
}

type EstadisticasDeudas = {
  total_clientes: number
  clientes_al_dia: number
  clientes_vencidos: number
  clientes_proximo_vencimiento: number
  total_deuda: number
  promedio_deuda: number
  cuotas_vencidas: number
}

export default function DeudasPage() {
  const router = useRouter()

  // Estados
  const [clientes, setClientes] = useState<ClienteDeuda[]>([])
  const [filtered, setFiltered] = useState<ClienteDeuda[]>([])
  const [stats, setStats] = useState<EstadisticasDeudas>({
    total_clientes: 0,
    clientes_al_dia: 0,
    clientes_vencidos: 0,
    clientes_proximo_vencimiento: 0,
    total_deuda: 0,
    promedio_deuda: 0,
    cuotas_vencidas: 0
  })
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [fEstado, setFEstado] = useState("todos")
  const [selectedCliente, setSelectedCliente] = useState<ClienteDeuda | null>(null)
  const [cuotasCliente, setCuotasCliente] = useState<CuotaMensual[]>([])
  const [historialCliente, setHistorialCliente] = useState<HistorialPago[]>([])
  const [showDetails, setShowDetails] = useState(false)
  const [showConfig, setShowConfig] = useState(false)
  const [config, setConfig] = useState({
    dia_vencimiento: 5,
    dias_gracia: 3
  })

  // Carga inicial
  useEffect(() => {
    if (!localStorage.getItem("user")) {
      router.push("/")
      return
    }
    loadAll()
  }, [router])

  // Filtrar clientes
  useEffect(() => {
    let tmp = clientes.slice()
    if (searchTerm) {
      const t = searchTerm.toLowerCase()
      tmp = tmp.filter(
        (c) =>
          c.nombres.toLowerCase().includes(t) ||
          c.apellidos.toLowerCase().includes(t) ||
          c.cedula.includes(t) ||
          c.email.toLowerCase().includes(t)
      )
    }
    if (fEstado !== "todos") tmp = tmp.filter((c) => c.estado_pago === fEstado)
    setFiltered(tmp)
  }, [clientes, searchTerm, fEstado])

  // Cargar datos
  async function loadAll() {
    setLoading(true)
    try {
      const [clientesRes, statsRes, configRes] = await Promise.all([
        fetch("/api/deudas"),
        fetch("/api/deudas?action=estadisticas"),
        fetch("/api/deudas?action=configuracion")
      ])

      const clientesJson = await clientesRes.json()
      const statsJson = await statsRes.json()
      const configJson = await configRes.json()

      if (clientesRes.ok && clientesJson.success) setClientes(clientesJson.data)
      if (statsRes.ok && statsJson.success) setStats(statsJson.data)
      if (configRes.ok && configJson.success) setConfig(configJson.data)
    } catch (error) {
      console.error("Error cargando datos:", error)
    }
    setLoading(false)
  }

  // Ver detalles del cliente
  async function verDetalles(cliente: ClienteDeuda) {
    setSelectedCliente(cliente)
    setLoading(true)
    try {
      const [cuotasRes, historialRes] = await Promise.all([
        fetch(`/api/deudas?action=cuotas&clienteId=${cliente.id}`),
        fetch(`/api/deudas?action=historial&clienteId=${cliente.id}`)
      ])

      const cuotasJson = await cuotasRes.json()
      const historialJson = await historialRes.json()

      if (cuotasRes.ok && cuotasJson.success) setCuotasCliente(cuotasJson.data)
      if (historialRes.ok && historialJson.success) setHistorialCliente(historialJson.data)
    } catch (error) {
      console.error("Error cargando detalles:", error)
    }
    setLoading(false)
    setShowDetails(true)
  }

  // Actualizar sistema
  async function actualizarSistema() {
    setLoading(true)
    try {
      const res = await fetch("/api/deudas?action=actualizar-sistema", {
        method: "POST"
      })
      const json = await res.json()
      
      if (res.ok && json.success) {
        alert("Sistema actualizado exitosamente")
        await loadAll()
      } else {
        alert("Error actualizando sistema: " + json.message)
      }
    } catch (error) {
      console.error("Error actualizando sistema:", error)
      alert("Error actualizando sistema")
    }
    setLoading(false)
  }

  // Actualizar configuración
  async function actualizarConfiguracion() {
    setLoading(true)
    try {
      const res = await fetch("/api/deudas?action=configuracion", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config)
      })
      const json = await res.json()
      
      if (res.ok && json.success) {
        alert("Configuración actualizada exitosamente")
        setShowConfig(false)
      } else {
        alert("Error actualizando configuración: " + json.message)
      }
    } catch (error) {
      console.error("Error actualizando configuración:", error)
      alert("Error actualizando configuración")
    }
    setLoading(false)
  }

  // Badge de estado
  function badgeEstado(estado: string) {
    switch (estado) {
      case "al_dia":
        return <Badge className="bg-green-100 text-green-800">Al Día</Badge>
      case "proximo_vencimiento":
        return <Badge className="bg-yellow-100 text-yellow-800">Próximo Vencimiento</Badge>
      case "vencido":
        return <Badge className="bg-orange-100 text-orange-800">Vencido</Badge>
      case "corte_pendiente":
        return <Badge className="bg-red-100 text-red-800">Corte Pendiente</Badge>
      default:
        return <Badge className="bg-gray-100 text-gray-800">{estado}</Badge>
    }
  }

  // Badge de estado de cuota
  function badgeCuota(estado: string) {
    switch (estado) {
      case "pagado":
        return <Badge className="bg-green-100 text-green-800">Pagado</Badge>
      case "pendiente":
        return <Badge className="bg-yellow-100 text-yellow-800">Pendiente</Badge>
      case "vencido":
        return <Badge className="bg-red-100 text-red-800">Vencido</Badge>
      default:
        return <Badge className="bg-gray-100 text-gray-800">{estado}</Badge>
    }
  }

  return (
    <div className="p-6 bg-slate-50 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div className="flex items-start space-x-4">
          <Button variant="outline" onClick={() => router.push("/dashboard")}>
            <ArrowLeft className="mr-1" /> Volver
          </Button>
          <div className="mt-2">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">
              Gestión de Deudas
            </h1>
            <p className="text-slate-600 text-lg">
              Control y administración de pagos vencidos
            </p>
          </div>
        </div>
        <div className="flex gap-2 mt-2">
          <Button
            onClick={actualizarSistema}
            disabled={loading}
            className="bg-blue-500 text-white flex items-center"
          >
            <RefreshCw className={`mr-1 ${loading ? 'animate-spin' : ''}`} />
            Actualizar Sistema
          </Button>
          <Button
            onClick={() => setShowConfig(true)}
            variant="outline"
            className="flex items-center"
          >
            <Settings className="mr-1" />
            Configuración
          </Button>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <Card className="bg-green-500 text-white">
          <CardContent className="flex items-center px-6 py-4">
            <Users className="h-6 w-6 mr-3" />
            <div>
              <div className="text-2xl font-bold">{stats.clientes_al_dia}</div>
              <div className="text-sm">Al Día</div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-orange-500 text-white">
          <CardContent className="flex items-center px-6 py-4">
            <AlertTriangle className="h-6 w-6 mr-3" />
            <div>
              <div className="text-2xl font-bold">{stats.clientes_vencidos}</div>
              <div className="text-sm">Vencidos</div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-yellow-500 text-white">
          <CardContent className="flex items-center px-6 py-4">
            <Clock className="h-6 w-6 mr-3" />
            <div>
              <div className="text-2xl font-bold">{stats.clientes_proximo_vencimiento}</div>
              <div className="text-sm">Próximo Vencimiento</div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-red-500 text-white">
          <CardContent className="flex items-center px-6 py-4">
            <DollarSign className="h-6 w-6 mr-3" />
            <div>
              <div className="text-2xl font-bold">${stats.total_deuda.toLocaleString()}</div>
              <div className="text-sm">Total Deuda</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <div className="flex flex-col md:flex-row items-center gap-4 bg-white p-4 rounded-lg shadow mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <Input
            className="pl-10"
            placeholder="Buscar por nombre, cédula o email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="w-full md:w-48">
          <Select value={fEstado} onValueChange={setFEstado}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Todos los estados" />
            </SelectTrigger>
            <SelectContent>
              {[
                { value: "todos", label: "Todos los Estados" },
                { value: "al_dia", label: "Al Día" },
                { value: "proximo_vencimiento", label: "Próximo Vencimiento" },
                { value: "vencido", label: "Vencido" },
                { value: "corte_pendiente", label: "Corte Pendiente" }
              ].map((estado) => (
                <SelectItem key={estado.value} value={estado.value}>
                  {estado.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Tabla de Clientes */}
      <Card className="bg-white shadow rounded-lg overflow-hidden">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-500" />
            Clientes con Deudas ({filtered.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Meses Pendientes</TableHead>
                <TableHead>Deuda Total</TableHead>
                <TableHead>Último Pago</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((cliente) => (
                <TableRow key={cliente.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{cliente.nombres} {cliente.apellidos}</div>
                      <div className="text-sm text-gray-500">{cliente.cedula}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{cliente.tipo_plan}</div>
                      <div className="text-sm text-gray-500">${cliente.precio_plan}</div>
                    </div>
                  </TableCell>
                  <TableCell>{badgeEstado(cliente.estado_pago)}</TableCell>
                  <TableCell>
                    <span className="font-medium text-red-600">
                      {cliente.meses_pendientes}
                    </span>
                  </TableCell>
                                      <TableCell>
                      <span className="font-medium text-red-600">
                        ${Number(cliente.monto_total_deuda || 0).toFixed(2)}
                      </span>
                    </TableCell>
                  <TableCell>
                    {cliente.fecha_ultimo_pago ? (
                      <div className="text-sm">
                        {new Date(cliente.fecha_ultimo_pago).toLocaleDateString()}
                      </div>
                    ) : (
                      <span className="text-sm text-gray-500">Sin pagos</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => verDetalles(cliente)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Ver Detalles
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Modal de Detalles */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Detalles de Deuda - {selectedCliente?.nombres} {selectedCliente?.apellidos}
            </DialogTitle>
          </DialogHeader>
          
          {selectedCliente && (
            <Tabs defaultValue="cuotas" className="space-y-4">
              <TabsList>
                <TabsTrigger value="cuotas">Cuotas Mensuales</TabsTrigger>
                <TabsTrigger value="historial">Historial de Pagos</TabsTrigger>
                <TabsTrigger value="resumen">Resumen</TabsTrigger>
              </TabsList>

              <TabsContent value="cuotas">
                <Card>
                  <CardHeader>
                    <CardTitle>Cuotas Mensuales</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Mes/Año</TableHead>
                          <TableHead>Monto</TableHead>
                          <TableHead>Vencimiento</TableHead>
                          <TableHead>Estado</TableHead>
                          <TableHead>Fecha Pago</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {cuotasCliente.map((cuota) => (
                          <TableRow key={cuota.id}>
                            <TableCell>
                              {cuota.mes}/{cuota.año}
                            </TableCell>
                            <TableCell>${cuota.monto}</TableCell>
                            <TableCell>
                              {new Date(cuota.fecha_vencimiento).toLocaleDateString()}
                            </TableCell>
                            <TableCell>{badgeCuota(cuota.estado)}</TableCell>
                            <TableCell>
                              {cuota.fecha_pago ? (
                                new Date(cuota.fecha_pago).toLocaleDateString()
                              ) : (
                                <span className="text-gray-500">-</span>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="historial">
                <Card>
                  <CardHeader>
                    <CardTitle>Historial de Pagos</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Fecha</TableHead>
                          <TableHead>Monto</TableHead>
                          <TableHead>Concepto</TableHead>
                          <TableHead>Meses Cubiertos</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {historialCliente.map((pago) => (
                          <TableRow key={pago.id}>
                            <TableCell>
                              {new Date(pago.fecha_pago).toLocaleDateString()}
                            </TableCell>
                            <TableCell>${pago.monto_pagado}</TableCell>
                            <TableCell>{pago.concepto}</TableCell>
                            <TableCell>{pago.meses_cubiertos}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="resumen">
                <Card>
                  <CardHeader>
                    <CardTitle>Resumen de Deuda</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="text-sm text-gray-600">Estado Actual</div>
                        <div className="text-lg font-medium">{badgeEstado(selectedCliente.estado_pago)}</div>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="text-sm text-gray-600">Meses Pendientes</div>
                        <div className="text-lg font-medium text-red-600">{selectedCliente.meses_pendientes}</div>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="text-sm text-gray-600">Deuda Total</div>
                                                 <div className="text-lg font-medium text-red-600">${Number(selectedCliente.monto_total_deuda || 0).toFixed(2)}</div>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="text-sm text-gray-600">Plan Mensual</div>
                        <div className="text-lg font-medium">${selectedCliente.precio_plan}</div>
                      </div>
                    </div>
                    
                    <div className="mt-4">
                      <Button 
                        onClick={() => router.push(`/recaudacion?cliente=${selectedCliente.id}`)}
                        className="w-full bg-green-500 text-white"
                      >
                        Registrar Pago
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de Configuración */}
      <Dialog open={showConfig} onOpenChange={setShowConfig}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Configuración del Sistema de Deudas</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label>Día de Vencimiento</Label>
              <Input
                type="number"
                min="1"
                max="31"
                value={config.dia_vencimiento}
                onChange={(e) => setConfig({...config, dia_vencimiento: Number(e.target.value)})}
              />
            </div>
            
            <div>
              <Label>Días de Gracia</Label>
              <Input
                type="number"
                min="0"
                max="30"
                value={config.dias_gracia}
                onChange={(e) => setConfig({...config, dias_gracia: Number(e.target.value)})}
              />
            </div>
            
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowConfig(false)}>
                Cancelar
              </Button>
              <Button onClick={actualizarConfiguracion} disabled={loading}>
                {loading ? "Guardando..." : "Guardar"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
} 