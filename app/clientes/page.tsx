"use client"

import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  Card,
  CardHeader,
  CardContent,
  CardTitle,
} from "@/components/ui/card"
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
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Plus, Edit, Trash2, RefreshCw, Search, User, Mail, Phone, MapPin, X } from "lucide-react"
import { validarCedulaEcuatoriana, formatearCedula, validarMayorEdad, calcularEdad, obtenerFechaMinima, obtenerFechaMaxima, formatearFecha } from "@/lib/utils"
import { Switch } from '@/components/ui/switch'
import { apiRequest, API_ENDPOINTS } from "@/lib/config/api"
import { isAuthenticated } from "@/lib/config/api"

interface Cliente {
  id: number
  cedula: string
  nombres: string
  apellidos: string
  tipo_plan: string
  precio_plan: number
  fecha_nacimiento: string
  direccion: string
  sector: string
  email: string
  telefono: string
  telegram_chat_id?: string
  estado: "activo" | "inactivo" | "suspendido"
  fecha_registro: string
  fecha_actualizacion: string
  fecha_ultimo_pago?: string | null
  meses_pendientes?: number
  monto_total_deuda?: number
  fecha_vencimiento_pago?: string | null
  estado_pago?: string
}

interface FormData {
  cedula: string
  nombres: string
  apellidos: string
  tipo_plan: string
  precio_plan: number
  fecha_nacimiento: string
  direccion: string
  sector: string
  email: string
  telefono: string
  telegram_chat_id: string
  estado: Cliente["estado"]
}

export default function ClientesPage() {
  const router = useRouter()

  // Estados principales
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [loading, setLoading] = useState(true)
  const [searching, setSearching] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  
  // Estados de búsqueda y filtros
  const [searchTerm, setSearchTerm] = useState("")
  const [filterEstado, setFilterEstado] = useState<Cliente["estado"] | "todos">("todos")
  
  // Estados del modal
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Cliente | null>(null)
  
  // Estados de datos
  const [sectores, setSectores] = useState<string[]>([])
  const [planes, setPlanes] = useState<{ tipo_plan: string, precio_plan: number }[]>([])
  
  // Estados de validación
  const [cedulaError, setCedulaError] = useState<string | null>(null)
  const [cedulaValida, setCedulaValida] = useState(false)
  const [fechaError, setFechaError] = useState<string | null>(null)
  const [edadCalculada, setEdadCalculada] = useState<number | null>(null)
  
  // Estados de confirmación
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean, cliente: Cliente | null }>({
    open: false,
    cliente: null
  })
  
  // Estado del formulario
  const [formData, setFormData] = useState<FormData>({
    cedula: "",
    nombres: "",
    apellidos: "",
    tipo_plan: "",
    precio_plan: 0,
    fecha_nacimiento: "",
    direccion: "",
    sector: "",
    email: "",
    telefono: "",
    telegram_chat_id: "",
    estado: "activo",
  })

  // Verificar autenticación
  const checkAuth = () => {
    if (!isAuthenticated()) {
      router.push("/")
      return false
    }
    return true
  }

  // Cargar datos de clientes
  async function loadData() {
    if (!checkAuth()) return
    
    // Si hay término de búsqueda, mostrar estado de búsqueda
    if (searchTerm) {
      setSearching(true)
    } else {
      setLoading(true)
    }
    
    setError(null)
    try {
      const params = new URLSearchParams()
      if (searchTerm) params.set("search", searchTerm)
      if (filterEstado !== "todos") params.set("estado", filterEstado)
      
      const url = `${API_ENDPOINTS.CLIENTES}?${params.toString()}`
      const json = await apiRequest(url)
      
      if (json.success && Array.isArray(json.data)) {
        setClientes(json.data)
      } else {
        throw new Error(json.message || "Error cargando clientes")
      }
    } catch (e) {
      console.error("Error en loadData:", e)
      setError((e as Error).message || "Error cargando clientes")
    } finally {
      setLoading(false)
      setSearching(false)
    }
  }

  // Cargar valores únicos (sectores y planes)
  async function loadValoresUnicos() {
    if (!checkAuth()) return
    
    try {
      const data = await apiRequest(API_ENDPOINTS.CLIENTES_VALORES_UNICOS)
      
      if (data.success) {
        setSectores(data.sectores || [])
        setPlanes(data.planes || [])
      }
    } catch (err) {
      console.error('Error cargando valores únicos:', err)
    }
  }

  // Validar cédula en tiempo real
  const validarCedulaEnTiempoReal = (cedula: string) => {
    if (cedula.length === 0) {
      setCedulaError(null)
      setCedulaValida(false)
      return
    }

    if (cedula.length < 10) {
      setCedulaError("La cédula debe tener 10 dígitos")
      setCedulaValida(false)
      return
    }

    if (!/^\d+$/.test(cedula)) {
      setCedulaError("La cédula solo debe contener números")
      setCedulaValida(false)
      return
    }

    if (cedula.length === 10) {
      if (validarCedulaEcuatoriana(cedula)) {
        setCedulaError(null)
        setCedulaValida(true)
      } else {
        setCedulaError("Cédula ecuatoriana inválida")
        setCedulaValida(false)
      }
    } else {
      setCedulaError("La cédula debe tener exactamente 10 dígitos")
      setCedulaValida(false)
    }
  }

  // Validar fecha de nacimiento en tiempo real
  const validarFechaNacimientoEnTiempoReal = (fecha: string) => {
    if (!fecha) {
      setFechaError(null)
      setEdadCalculada(null)
      return
    }

    const fechaSeleccionada = new Date(fecha)
    const fechaMinima = new Date(obtenerFechaMinima())
    const fechaMaxima = new Date(obtenerFechaMaxima())

    if (fechaSeleccionada > fechaMinima) {
      setFechaError("El usuario debe ser mayor de 18 años")
      setEdadCalculada(null)
      return
    }

    if (fechaSeleccionada < fechaMaxima) {
      setFechaError("Fecha de nacimiento inválida")
      setEdadCalculada(null)
      return
    }

    const edad = calcularEdad(fecha)
    setEdadCalculada(edad)
    setFechaError(null)
  }

  // Abrir modal para nuevo cliente
  const openNew = () => {
    setEditing(null)
    setFormData({
      cedula: "",
      nombres: "",
      apellidos: "",
      tipo_plan: "",
      precio_plan: 0,
      fecha_nacimiento: "",
      direccion: "",
      sector: "",
      email: "",
      telefono: "",
      telegram_chat_id: "",
      estado: "activo",
    })
    setCedulaError(null)
    setCedulaValida(false)
    setFechaError(null)
    setEdadCalculada(null)
    setIsDialogOpen(true)
  }

  // Manejar cambio de plan
  const handlePlanChange = (tipoPlan: string) => {
    const planSeleccionado = planes.find(p => p.tipo_plan === tipoPlan)
    setFormData(prev => ({
      ...prev,
      tipo_plan: tipoPlan,
      precio_plan: planSeleccionado?.precio_plan || 0
    }))
  }

  // Manejar envío del formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!checkAuth()) return

    // Validaciones
    if (!cedulaValida) {
      setError("Por favor, ingrese una cédula válida")
      return
    }

    if (fechaError) {
      setError("Por favor, ingrese una fecha de nacimiento válida")
      return
    }

    if (!formData.nombres.trim() || !formData.apellidos.trim()) {
      setError("Los nombres y apellidos son obligatorios")
      return
    }

    if (!formData.tipo_plan) {
      setError("Debe seleccionar un plan")
      return
    }

    if (!formData.sector) {
      setError("Debe seleccionar un sector")
      return
    }

    try {
      const url = editing 
        ? `${API_ENDPOINTS.CLIENTES}${editing.id}/` 
        : API_ENDPOINTS.CLIENTES
      
      const method = editing ? 'PUT' : 'POST'
      
      const response = await apiRequest(url, {
        method,
        body: JSON.stringify(formData)
      })

      if (response.success) {
        setIsDialogOpen(false)
        setSuccess(editing ? "Cliente actualizado exitosamente" : "Cliente creado exitosamente")
        setError(null)
        loadData()
        
        // Limpiar mensaje de éxito después de 3 segundos
        setTimeout(() => setSuccess(null), 3000)
      } else {
        setError(response.message || "Error al guardar cliente")
      }
    } catch (e) {
      console.error("Error en handleSubmit:", e)
      setError((e as Error).message || "Error al guardar cliente")
    }
  }

  // Abrir modal de edición
  const handleEdit = (c: Cliente) => {
    setEditing(c)
    setFormData({
      cedula: c.cedula,
      nombres: c.nombres,
      apellidos: c.apellidos,
      tipo_plan: c.tipo_plan,
      precio_plan: c.precio_plan,
      fecha_nacimiento: c.fecha_nacimiento,
      direccion: c.direccion,
      sector: c.sector,
      email: c.email,
      telefono: c.telefono,
      telegram_chat_id: c.telegram_chat_id || "",
      estado: c.estado,
    })
    setCedulaError(null)
    setCedulaValida(true)
    setFechaError(null)
    setEdadCalculada(calcularEdad(c.fecha_nacimiento))
    setIsDialogOpen(true)
  }

  // Abrir diálogo de confirmación de eliminación
  const handleDeleteClick = (cliente: Cliente) => {
    setDeleteDialog({ open: true, cliente })
  }

  // Confirmar eliminación
  const handleDeleteConfirm = async () => {
    if (!deleteDialog.cliente) return
    
    try {
      const response = await apiRequest(`${API_ENDPOINTS.CLIENTES}${deleteDialog.cliente.id}/`, {
        method: 'DELETE'
      })

      if (response.success) {
        setSuccess("Cliente eliminado exitosamente")
        setError(null)
        loadData()
        
        // Limpiar mensaje de éxito después de 3 segundos
        setTimeout(() => setSuccess(null), 3000)
      } else {
        setError(response.message || "Error al eliminar cliente")
      }
    } catch (e) {
      console.error("Error en handleDelete:", e)
      setError((e as Error).message || "Error al eliminar cliente")
    } finally {
      setDeleteDialog({ open: false, cliente: null })
    }
  }

  // Calcular estadísticas
  const getStats = () => {
    const total = clientes.length
    const activos = clientes.filter(c => c.estado === 'activo').length
    const suspendidos = clientes.filter(c => c.estado === 'suspendido').length
    const inactivos = clientes.filter(c => c.estado === 'inactivo').length

    return {
      total,
      activos,
      suspendidos,
      inactivos,
      porcentajeActivos: total > 0 ? Math.round((activos / total) * 100) : 0,
      porcentajeSuspendidos: total > 0 ? Math.round((suspendidos / total) * 100) : 0,
      porcentajeInactivos: total > 0 ? Math.round((inactivos / total) * 100) : 0
    }
  }

  // Refrescar datos
  const handleRefresh = () => {
    setSearchTerm("")
    setFilterEstado("todos")
    loadData()
    loadValoresUnicos()
  }

  // Cargar datos al montar el componente
  useEffect(() => {
    if (checkAuth()) {
      loadData()
      loadValoresUnicos()
    }
  }, [])

  // Búsqueda con debounce
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (checkAuth()) {
        loadData()
      }
    }, 300) // Esperar 300ms después de que el usuario deje de escribir

    return () => clearTimeout(timeoutId)
  }, [searchTerm, filterEstado])

  if (loading) return <div className="p-6 text-center">Cargando clientes...</div>

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              onClick={() => router.push("/dashboard")}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Volver
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Gestión de Clientes</h1>
              <p className="text-gray-600">Administra los clientes del sistema</p>
            </div>
          </div>
          <Button onClick={openNew} className="flex items-center space-x-2">
            <Plus className="h-4 w-4" />
            Nuevo Cliente
          </Button>
        </div>

        {/* Mensajes de error y éxito */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800">{error}</p>
          </div>
        )}
        
        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-800">{success}</p>
          </div>
        )}

        {/* Estadísticas */}
        <div className="flex justify-center mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full max-w-6xl">
            {(() => {
              const stats = getStats()
              return (
                <>
                  <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:shadow-lg transition-shadow transform hover:scale-105">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-blue-100 text-sm font-medium">Total Clientes</p>
                          <p className="text-3xl font-bold">{stats.total}</p>
                          <p className="text-blue-200 text-xs mt-1">
                            {stats.total > 0 ? 'Todos los registros' : 'Sin clientes'}
                          </p>
                        </div>
                        <div className="w-12 h-12 bg-blue-400 bg-opacity-30 rounded-full flex items-center justify-center">
                          <User className="h-6 w-6" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white hover:shadow-lg transition-shadow transform hover:scale-105">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-green-100 text-sm font-medium">Activos</p>
                          <p className="text-3xl font-bold">{stats.activos}</p>
                          <p className="text-green-200 text-xs mt-1">
                            {stats.porcentajeActivos}% del total
                          </p>
                        </div>
                        <div className="w-12 h-12 bg-green-400 bg-opacity-30 rounded-full flex items-center justify-center">
                          <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white hover:shadow-lg transition-shadow transform hover:scale-105">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-yellow-100 text-sm font-medium">Suspendidos</p>
                          <p className="text-3xl font-bold">{stats.suspendidos}</p>
                          <p className="text-yellow-200 text-xs mt-1">
                            {stats.porcentajeSuspendidos}% del total
                          </p>
                        </div>
                        <div className="w-12 h-12 bg-yellow-400 bg-opacity-30 rounded-full flex items-center justify-center">
                          <div className="w-3 h-3 bg-white rounded-full"></div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-r from-red-500 to-red-600 text-white hover:shadow-lg transition-shadow transform hover:scale-105">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-red-100 text-sm font-medium">Inactivos</p>
                          <p className="text-3xl font-bold">{stats.inactivos}</p>
                          <p className="text-red-200 text-xs mt-1">
                            {stats.porcentajeInactivos}% del total
                          </p>
                        </div>
                        <div className="w-12 h-12 bg-red-400 bg-opacity-30 rounded-full flex items-center justify-center">
                          <div className="w-3 h-3 bg-white rounded-full"></div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </>
              )
            })()}
          </div>
        </div>

        {/* Filtros y búsqueda */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <Label htmlFor="search">Buscar</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="search"
                    placeholder="Buscar por nombre, cédula, email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        loadData()
                      }
                    }}
                    className={`pl-10 ${searching ? 'pr-10' : ''}`}
                    disabled={searching}
                  />
                  {searching && (
                    <div className="absolute right-3 top-3">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    </div>
                  )}
                  {searchTerm && !searching && (
                    <button
                      type="button"
                      onClick={() => setSearchTerm("")}
                      className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
              <div className="w-full md:w-48">
                <Label htmlFor="estado">Estado</Label>
                <Select value={filterEstado} onValueChange={(value: any) => setFilterEstado(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    <SelectItem value="activo">Activo</SelectItem>
                    <SelectItem value="inactivo">Inactivo</SelectItem>
                    <SelectItem value="suspendido">Suspendido</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button onClick={handleRefresh} variant="outline" className="flex items-center space-x-2">
                  <RefreshCw className="h-4 w-4" />
                  Refrescar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabla de clientes */}
        <Card>
          <CardHeader>
            <CardTitle>
              Clientes ({clientes.length})
              {searchTerm && (
                <span className="text-sm font-normal text-gray-500 ml-2">
                  - Resultados para "{searchTerm}"
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Cédula</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Contacto</TableHead>
                    <TableHead>Sector</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clientes.map((cliente) => (
                    <TableRow key={cliente.id}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <User className="h-4 w-4 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-medium">{cliente.nombres} {cliente.apellidos}</p>
                            <p className="text-sm text-gray-500">
                              Registrado: {formatearFecha(cliente.fecha_registro)}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <code className="bg-gray-100 px-2 py-1 rounded text-sm">
                          {formatearCedula(cliente.cedula)}
                        </code>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{cliente.tipo_plan}</p>
                          <p className="text-sm text-gray-500">${cliente.precio_plan}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <Mail className="h-3 w-3 text-gray-400" />
                            <span className="text-sm">{cliente.email}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Phone className="h-3 w-3 text-gray-400" />
                            <span className="text-sm">{cliente.telefono}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <MapPin className="h-3 w-3 text-gray-400" />
                          <span className="text-sm">{cliente.sector}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={
                            cliente.estado === 'activo' ? 'default' : 
                            cliente.estado === 'inactivo' ? 'secondary' : 'destructive'
                          }
                        >
                          {cliente.estado}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(cliente)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteClick(cliente)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Modal de formulario */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editing ? "Editar Cliente" : "Nuevo Cliente"}
            </DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Cédula */}
              <div>
                <Label htmlFor="cedula">Cédula *</Label>
                <Input
                  id="cedula"
                  value={formData.cedula}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '')
                    setFormData(prev => ({ ...prev, cedula: value }))
                    validarCedulaEnTiempoReal(value)
                  }}
                  placeholder="1234567890"
                  maxLength={10}
                />
                {cedulaError && (
                  <p className="text-sm text-red-600 mt-1">{cedulaError}</p>
                )}
                {cedulaValida && (
                  <p className="text-sm text-green-600 mt-1">✓ Cédula válida</p>
                )}
              </div>

              {/* Nombres */}
              <div>
                <Label htmlFor="nombres">Nombres *</Label>
                <Input
                  id="nombres"
                  value={formData.nombres}
                  onChange={(e) => setFormData(prev => ({ ...prev, nombres: e.target.value }))}
                  placeholder="Juan Carlos"
                />
              </div>

              {/* Apellidos */}
              <div>
                <Label htmlFor="apellidos">Apellidos *</Label>
                <Input
                  id="apellidos"
                  value={formData.apellidos}
                  onChange={(e) => setFormData(prev => ({ ...prev, apellidos: e.target.value }))}
                  placeholder="Pérez González"
                />
              </div>

              {/* Fecha de nacimiento */}
              <div>
                <Label htmlFor="fecha_nacimiento">Fecha de Nacimiento *</Label>
                <Input
                  id="fecha_nacimiento"
                  type="date"
                  value={formData.fecha_nacimiento}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, fecha_nacimiento: e.target.value }))
                    validarFechaNacimientoEnTiempoReal(e.target.value)
                  }}
                  max={obtenerFechaMinima()}
                  min={obtenerFechaMaxima()}
                />
                {fechaError && (
                  <p className="text-sm text-red-600 mt-1">{fechaError}</p>
                )}
                {edadCalculada && (
                  <p className="text-sm text-green-600 mt-1">✓ Edad: {edadCalculada} años</p>
                )}
              </div>

              {/* Plan */}
              <div>
                <Label htmlFor="tipo_plan">Plan *</Label>
                <Select value={formData.tipo_plan} onValueChange={handlePlanChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione un plan" />
                  </SelectTrigger>
                  <SelectContent>
                    {planes.map((plan) => (
                      <SelectItem key={plan.tipo_plan} value={plan.tipo_plan}>
                        {plan.tipo_plan} - ${plan.precio_plan}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Precio del plan */}
              <div>
                <Label htmlFor="precio_plan">Precio del Plan</Label>
                <Input
                  id="precio_plan"
                  type="number"
                  value={formData.precio_plan}
                  onChange={(e) => setFormData(prev => ({ ...prev, precio_plan: Number(e.target.value) }))}
                  placeholder="0.00"
                  step="0.01"
                  readOnly
                />
              </div>

              {/* Sector */}
              <div>
                <Label htmlFor="sector">Sector *</Label>
                <Select value={formData.sector} onValueChange={(value) => setFormData(prev => ({ ...prev, sector: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione un sector" />
                  </SelectTrigger>
                  <SelectContent>
                    {sectores.map((sector) => (
                      <SelectItem key={sector} value={sector}>
                        {sector}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Email */}
              <div>
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="cliente@email.com"
                />
              </div>

              {/* Teléfono */}
              <div>
                <Label htmlFor="telefono">Teléfono *</Label>
                <Input
                  id="telefono"
                  value={formData.telefono}
                  onChange={(e) => setFormData(prev => ({ ...prev, telefono: e.target.value.replace(/\D/g, '') }))}
                  placeholder="0987654321"
                  maxLength={10}
                />
              </div>

              {/* Dirección */}
              <div className="md:col-span-2">
                <Label htmlFor="direccion">Dirección</Label>
                <Input
                  id="direccion"
                  value={formData.direccion}
                  onChange={(e) => setFormData(prev => ({ ...prev, direccion: e.target.value }))}
                  placeholder="Av. Principal 123"
                />
              </div>

              {/* Telegram Chat ID */}
              <div>
                <Label htmlFor="telegram_chat_id">ID de Chat Telegram</Label>
                <Input
                  id="telegram_chat_id"
                  value={formData.telegram_chat_id}
                  onChange={(e) => setFormData(prev => ({ ...prev, telegram_chat_id: e.target.value }))}
                  placeholder="123456789"
                />
              </div>

              {/* Estado */}
              <div>
                <Label htmlFor="estado">Estado</Label>
                <Select value={formData.estado} onValueChange={(value: any) => setFormData(prev => ({ ...prev, estado: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="activo">Activo</SelectItem>
                    <SelectItem value="inactivo">Inactivo</SelectItem>
                    <SelectItem value="suspendido">Suspendido</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">
                {editing ? "Actualizar" : "Crear"} Cliente
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Diálogo de confirmación de eliminación */}
      <AlertDialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ open, cliente: null })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Está seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente el cliente{" "}
              <strong>{deleteDialog.cliente?.nombres} {deleteDialog.cliente?.apellidos}</strong>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-red-600 hover:bg-red-700">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
