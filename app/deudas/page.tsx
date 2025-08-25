"use client"

import React, { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Pagination } from "@/components/ui/pagination"
import { ExportButtons } from "@/components/ui/export-buttons"
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
  AlertCircle,
  User,
  Phone,
  Mail,
  MapPin,
  CreditCard,
  FileText,
  BarChart3,
  PieChart,
  TrendingDown,
  CheckCircle,
  XCircle,
  Clock as ClockIcon,
  X
} from "lucide-react"
import { apiRequest, API_ENDPOINTS, isAuthenticated } from "@/lib/config/api"

interface ClienteDeuda {
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
  total_pagado: number
  fecha_ultimo_pago: string | null
  fecha_vencimiento_pago: string | null
  estado: string
  sector: string
}

interface CuotaMensual {
  id: number
  mes: number
  año: number
  monto: number
  fecha_vencimiento: string
  fecha_pago: string | null
  estado: string
  pago_id: number | null
}

interface HistorialPago {
  id: number
  pago_id: number
  fecha: string
  descripcion: string
  monto_pagado: number
  concepto: string
  fecha_pago: string
  meses_cubiertos: number
}

interface EstadisticasDeudas {
  total_clientes: number
  clientes_al_dia: number
  clientes_vencidos: number
  clientes_proximo_vencimiento: number
  total_deuda: number
  promedio_deuda: number
  cuotas_vencidas: number
  deuda_por_estado: Array<{
    estado: string
    cantidad: number
    total_deuda: number
  }>
  top_deudores: Array<{
    nombres: string
    apellidos: string
    cedula: string
    monto_deuda: number
    estado_pago: string
  }>
}

export default function DeudasPage() {
  const router = useRouter()

  // Estados principales
  const [clientes, setClientes] = useState<ClienteDeuda[]>([])
  const [filtered, setFiltered] = useState<ClienteDeuda[]>([])
  const [stats, setStats] = useState<EstadisticasDeudas | null>(null)
  const [loading, setLoading] = useState(true)
  const [searching, setSearching] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  
  // Estados de búsqueda y filtros
  const [searchTerm, setSearchTerm] = useState("")
  const [filterEstado, setFilterEstado] = useState("todos")
  
  // Estados del modal de detalles
  const [selectedCliente, setSelectedCliente] = useState<ClienteDeuda | null>(null)
  const [cuotasCliente, setCuotasCliente] = useState<CuotaMensual[]>([])
  const [historialCliente, setHistorialCliente] = useState<HistorialPago[]>([])
  const [showDetails, setShowDetails] = useState(false)
  const [detailsLoading, setDetailsLoading] = useState(false)

  // Estados del modal de configuración
  const [showConfig, setShowConfig] = useState(false)
  const [config, setConfig] = useState({
    dia_vencimiento: 5,
    dias_gracia: 3
  })

  // Estados para paginación
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(50)
  const [pagination, setPagination] = useState({
    page: 1,
    page_size: 50,
    total_count: 0,
    total_pages: 1,
    has_next: false,
    has_previous: false,
    next_page: null,
    previous_page: null
  })

  // Función de debounce para la búsqueda
  const debounce = useCallback((func: Function, delay: number) => {
    let timeoutId: NodeJS.Timeout
    return (...args: any[]) => {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(() => func.apply(null, args), delay)
    }
  }, [])

  // Función de búsqueda con debounce
  const debouncedSearch = useCallback(
    debounce((term: string) => {
      setSearching(false)
    }, 300),
    []
  )

  // Manejar cambios en el término de búsqueda
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearchTerm(value)
    setSearching(true)
    debouncedSearch(value)
  }

  // Limpiar búsqueda
  const clearSearch = () => {
    setSearchTerm("")
    setSearching(false)
  }

  // Verificar autenticación
  const checkAuth = () => {
    if (!isAuthenticated()) {
      router.push("/")
      return false
    }
    return true
  }

  // Cargar datos principales
  const loadData = async (page = 1, size = 50) => {
    if (!checkAuth()) return
    
    setLoading(true)
    setError(null)
    try {
      // Primero actualizar los estados de deudas basado en pagos reales
      try {
        const updateResponse = await apiRequest(API_ENDPOINTS.DEUDAS_ACTUALIZAR_ESTADOS, {
          method: 'POST'
        })
        console.log("✅ Estados actualizados:", updateResponse)
      } catch (e) {
        console.warn("No se pudieron actualizar los estados automáticamente:", e)
      }
      
      // Construir parámetros de paginación
      const params = new URLSearchParams({
        page: page.toString(),
        page_size: size.toString()
      })
      
      // Agregar filtros si están presentes
      if (searchTerm) {
        params.append('search', searchTerm)
      }
      if (filterEstado && filterEstado !== 'todos') {
        params.append('estado', filterEstado)
      }
      
      const [clientesRes, statsRes] = await Promise.all([
        apiRequest(`${API_ENDPOINTS.DEUDAS}?${params.toString()}&_t=${Date.now()}`),
        apiRequest(API_ENDPOINTS.DEUDAS_STATS)
      ])

      if (clientesRes.success) {
        console.log("📊 Clientes cargados:", clientesRes.data.length)
        console.log("💰 Primer cliente con pagos:", clientesRes.data[0])

        setClientes(clientesRes.data)
        setFiltered(clientesRes.data)
        
        // Actualizar información de paginación
        if (clientesRes.pagination) {
          setPagination(clientesRes.pagination)
          setCurrentPage(clientesRes.pagination.page)
          setPageSize(clientesRes.pagination.page_size)
        }
      }
      
      if (statsRes.success) {
        console.log("📈 Estadísticas:", statsRes.data)
        setStats(statsRes.data)
      }
    } catch (e) {
      console.error("Error cargando datos:", e)
      setError("Error al cargar los datos")
    } finally {
      setLoading(false)
    }
  }

  // Función para manejar cambio de página
  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    loadData(page, pageSize)
  }

  // Función para manejar cambio de tamaño de página
  const handlePageSizeChange = (size: number) => {
    setPageSize(size)
    setCurrentPage(1)
    loadData(1, size)
  }

  // Función para manejar búsqueda
  const handleSearch = () => {
    setCurrentPage(1)
    loadData(1, pageSize)
  }

  // Función para limpiar filtros
  const limpiarFiltros = () => {
    setSearchTerm("")
    setFilterEstado("todos")
    setCurrentPage(1)
    loadData(1, pageSize)
  }

  // Cargar detalles del cliente
  const loadClienteDetails = async (cliente: ClienteDeuda) => {
    setSelectedCliente(cliente)
    setDetailsLoading(true)
    setShowDetails(true)
    
    try {
      const [cuotasRes, historialRes] = await Promise.all([
        apiRequest(API_ENDPOINTS.DEUDAS_CLIENTE_CUOTAS(cliente.id)),
        apiRequest(API_ENDPOINTS.DEUDAS_CLIENTE_HISTORIAL(cliente.id))
      ])

      if (cuotasRes.success) {
        setCuotasCliente(cuotasRes.data)
      }
      
      if (historialRes.success) {
        setHistorialCliente(historialRes.data)
      }
    } catch (e) {
      console.error("Error cargando detalles:", e)
      setError((e as Error).message || "Error cargando detalles del cliente")
    } finally {
      setDetailsLoading(false)
    }
  }

  // Actualizar estados del sistema
  const actualizarSistema = async () => {
    if (!checkAuth()) return
    
    setLoading(true)
    try {
      const response = await apiRequest(API_ENDPOINTS.DEUDAS_ACTUALIZAR_ESTADOS, {
        method: 'POST'
      })
      
      if (response.success) {
        setSuccess("Sistema actualizado exitosamente")
        await loadData()
      } else {
        setError(response.message || "Error actualizando sistema")
      }
    } catch (e) {
      console.error("Error actualizando sistema:", e)
      setError((e as Error).message || "Error actualizando sistema")
    } finally {
      setLoading(false)
    }
  }

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
    
    if (filterEstado !== "todos") {
      tmp = tmp.filter((c) => c.estado_pago === filterEstado)
    }
    

    setFiltered(tmp)
  }, [clientes, searchTerm, filterEstado])

  // Carga inicial
  useEffect(() => {
    loadData()
  }, [])

  // Función para obtener el badge de estado
  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case 'al_dia':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Al Día</Badge>
      case 'vencido':
        return <Badge className="bg-red-100 text-red-800 border-red-200">Vencido</Badge>
      case 'proximo_vencimiento':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Próximo Vencimiento</Badge>
      case 'sin_fecha':
        return <Badge className="bg-gray-100 text-gray-800 border-gray-200">Sin Fecha</Badge>
      default:
        return <Badge variant="outline">{estado}</Badge>
    }
  }

  // Función para obtener el badge de cuota
  const getCuotaBadge = (estado: string) => {
    switch (estado) {
      case 'pagada':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Pagada</Badge>
      case 'vencida':
        return <Badge className="bg-red-100 text-red-800 border-red-200">Vencida</Badge>
      case 'pendiente':
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Pendiente</Badge>
      default:
        return <Badge variant="outline">{estado}</Badge>
    }
  }

  // Función para obtener el nombre del mes
  const getMesNombre = (mes: number) => {
    const meses = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ]
    return meses[mes - 1] || `Mes ${mes}`
  }

  // Navegar de vuelta al dashboard
  const handleGoBack = () => {
    router.push("/dashboard")
  }

  if (loading) return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="outline" onClick={handleGoBack} className="flex items-center space-x-2">
              <ArrowLeft className="h-4 w-4" />
              Volver
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Gestión de Deudas</h1>
              <p className="text-gray-600">Control de pagos vencidos y deudas</p>
            </div>
          </div>
        </div>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Cargando datos de deudas...</p>
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="outline" onClick={handleGoBack} className="flex items-center space-x-2">
              <ArrowLeft className="h-4 w-4" />
              Volver
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Gestión de Deudas</h1>
              <p className="text-gray-600">Control de pagos vencidos y deudas</p>
            </div>
          </div>
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              onClick={actualizarSistema} 
              className="flex items-center space-x-2"
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Actualizar Sistema
            </Button>
            <Button 
              variant="outline" 
              onClick={async () => {
                try {
                  await apiRequest(API_ENDPOINTS.DEUDAS_ACTUALIZAR_ESTADOS, { method: 'POST' })
                  setSuccess('Estados de deudas actualizados correctamente')
                  loadData(currentPage, pageSize)
                } catch (e) {
                  setError('Error al actualizar estados de deudas')
                }
              }}
              className="flex items-center space-x-2"
              disabled={loading}
            >
              <RefreshCw className="h-4 w-4" />
              Recalcular Deudas
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setShowConfig(true)} 
              className="flex items-center space-x-2"
            >
              <Settings className="h-4 w-4" />
              Configuración
            </Button>
          </div>
        </div>

        {/* Mensajes de error y éxito */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800">{error}</p>
          </div>
        )}
        
        {success && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-800">{success}</p>
          </div>
        )}

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:shadow-lg transition-shadow transform hover:scale-105">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-sm font-medium">Total Clientes</p>
                    <p className="text-3xl font-bold">{stats.total_clientes}</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-400 bg-opacity-30 rounded-full flex items-center justify-center">
                    <Users className="h-6 w-6" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white hover:shadow-lg transition-shadow transform hover:scale-105">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100 text-sm font-medium">Al Día</p>
                    <p className="text-3xl font-bold">{stats.clientes_al_dia}</p>
                  </div>
                  <div className="w-12 h-12 bg-green-400 bg-opacity-30 rounded-full flex items-center justify-center">
                    <CheckCircle className="h-6 w-6" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-red-500 to-red-600 text-white hover:shadow-lg transition-shadow transform hover:scale-105">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-red-100 text-sm font-medium">Vencidos</p>
                    <p className="text-3xl font-bold">{stats.clientes_vencidos}</p>
                  </div>
                  <div className="w-12 h-12 bg-red-400 bg-opacity-30 rounded-full flex items-center justify-center">
                    <XCircle className="h-6 w-6" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white hover:shadow-lg transition-shadow transform hover:scale-105">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-100 text-sm font-medium">Total Deuda</p>
                    <p className="text-3xl font-bold">
                      ${stats.total_deuda.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-purple-400 bg-opacity-30 rounded-full flex items-center justify-center">
                    <DollarSign className="h-6 w-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tabs */}
        <Tabs defaultValue="clientes" className="space-y-6">
          <TabsList className="grid grid-cols-3">
            <TabsTrigger value="clientes">Clientes con Deudas</TabsTrigger>
            <TabsTrigger value="estadisticas">Estadísticas</TabsTrigger>
            <TabsTrigger value="top-deudores">Top Deudores</TabsTrigger>
          </TabsList>

          <TabsContent value="clientes" className="space-y-4">
            {/* Search & Filters */}
            <Card className="border-2 border-blue-100 bg-blue-50/30">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row gap-4 items-center">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-blue-500" />
                    <Input
                      placeholder="🔍 Buscar por nombre, cédula o email..."
                      className="pl-12 pr-10 h-12 text-lg border-2 border-blue-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                      value={searchTerm}
                      onChange={handleSearchChange}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          setSearching(false)
                        }
                      }}
                    />
                    {searchTerm && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearSearch}
                        className="absolute right-2 top-1/2 -translate-y-1/2 hover:bg-red-100 hover:text-red-600"
                        title="Limpiar búsqueda"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                    {searching && (
                      <div className="absolute right-10 top-1/2 -translate-y-1/2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                      </div>
                    )}
                  </div>
                  
                  <Select value={filterEstado} onValueChange={setFilterEstado}>
                    <SelectTrigger className="w-48 h-12 border-2 border-blue-200">
                      <SelectValue placeholder="Filtrar por estado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos los estados</SelectItem>
                      <SelectItem value="al_dia">Al Día</SelectItem>
                      <SelectItem value="vencido">Vencido</SelectItem>
                      <SelectItem value="proximo_vencimiento">Próximo Vencimiento</SelectItem>
                      <SelectItem value="sin_fecha">Sin Fecha</SelectItem>
                    </SelectContent>
                  </Select>

                  <Button 
                    onClick={() => loadData(1, pageSize)} 
                    variant="outline" 
                    className="flex items-center space-x-2 h-12 px-6 border-2 border-blue-200 hover:bg-blue-50"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Refrescar
                  </Button>
                </div>
                
                {/* Información de búsqueda */}
                {searchTerm && (
                  <div className="mt-4 p-3 bg-blue-100 rounded-lg">
                    <p className="text-blue-800 text-sm">
                      <Search className="inline h-4 w-4 mr-2" />
                      Buscando: <strong>"{searchTerm}"</strong> 
                      {filtered.length > 0 && (
                        <span className="ml-2">
                          - {filtered.length} resultado{filtered.length !== 1 ? 's' : ''} encontrado{filtered.length !== 1 ? 's' : ''}
                        </span>
                      )}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Tabla de Clientes */}
            <Card>
              <CardHeader>
                <CardTitle>
                  Clientes con Deudas ({filtered.length})
                  {searchTerm && (
                    <span className="text-sm font-normal text-gray-500 ml-2">
                      - Resultados para "{searchTerm}"
                    </span>
                  )}
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
                      <TableHead>Total Pagado</TableHead>
                      <TableHead>Deuda Total</TableHead>
                      <TableHead>Vencimiento</TableHead>
                      <TableHead>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8">
                          <div className="flex flex-col items-center space-y-2">
                            <Users className="h-8 w-8 text-gray-400" />
                            <p className="text-gray-500">No se encontraron clientes con deudas</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filtered.map((cliente) => (
                        <TableRow key={cliente.id}>
                          <TableCell>
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                <User className="h-4 w-4 text-blue-600" />
                              </div>
                              <div>
                                <p className="font-medium">{cliente.nombres} {cliente.apellidos}</p>
                                <p className="text-sm text-gray-500">{cliente.cedula}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{cliente.tipo_plan}</p>
                              <p className="text-sm text-gray-500">${cliente.precio_plan}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            {getEstadoBadge(cliente.estado_pago)}
                          </TableCell>
                          <TableCell>
                            <div className="text-center">
                              <p className="font-medium">{cliente.meses_pendientes}</p>
                              <p className="text-xs text-gray-500">meses</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-right">
                              <p className="font-medium text-green-600">
                                ${(cliente.total_pagado || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                              </p>

                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-right">
                              <p className="font-medium text-red-600">
                                ${cliente.monto_total_deuda.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-center">
                              {cliente.fecha_vencimiento_pago ? (
                                <p className="text-sm">
                                  {new Date(cliente.fecha_vencimiento_pago).toLocaleDateString()}
                                </p>
                              ) : (
                                <p className="text-sm text-gray-400">Sin fecha</p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => loadClienteDetails(cliente)}
                              className="flex items-center space-x-2"
                            >
                              <Eye className="h-4 w-4" />
                              Ver Detalles
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
                
                {/* Paginación */}
                {pagination.total_pages > 1 && (
                  <div className="mt-6">
                    <Pagination
                      currentPage={currentPage}
                      totalPages={pagination.total_pages}
                      totalCount={pagination.total_count}
                      pageSize={pageSize}
                      onPageChange={handlePageChange}
                      onPageSizeChange={handlePageSizeChange}
                      showPageSizeSelector={true}
                    />
                  </div>
                )}
                
                {/* Botones de Exportación */}
                <div className="mt-6 flex justify-end">
                  <ExportButtons
                    tipo="deudas"
                    className="ml-auto"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="estadisticas" className="space-y-4">
            {stats && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Deuda por Estado */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <PieChart className="h-5 w-5" />
                      Deuda por Estado
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {stats.deuda_por_estado.map((item, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center space-x-3">
                            {getEstadoBadge(item.estado)}
                            <span className="text-sm text-gray-600">{item.cantidad} clientes</span>
                          </div>
                          <span className="font-medium">
                            ${item.total_deuda.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Estadísticas Generales */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <BarChart3 className="h-5 w-5" />
                      Estadísticas Generales
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                        <span className="text-blue-800">Promedio de Deuda</span>
                        <span className="font-medium text-blue-800">
                          ${stats.promedio_deuda.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
                        <span className="text-yellow-800">Próximo Vencimiento</span>
                        <span className="font-medium text-yellow-800">{stats.clientes_proximo_vencimiento}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                        <span className="text-red-800">Cuotas Vencidas</span>
                        <span className="font-medium text-red-800">{stats.cuotas_vencidas}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          <TabsContent value="top-deudores" className="space-y-4">
            {stats && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <TrendingDown className="h-5 w-5" />
                    Top 5 Clientes con Mayor Deuda
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Cliente</TableHead>
                        <TableHead>Cédula</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead>Monto Deuda</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {stats.top_deudores.map((cliente, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                                <span className="text-sm font-medium text-red-600">{index + 1}</span>
                              </div>
                              <div>
                                <p className="font-medium">{cliente.nombres} {cliente.apellidos}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{cliente.cedula}</TableCell>
                          <TableCell>{getEstadoBadge(cliente.estado_pago)}</TableCell>
                          <TableCell>
                            <span className="font-medium text-red-600">
                              ${cliente.monto_deuda.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </span>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        {/* Modal de Detalles del Cliente */}
        <Dialog open={showDetails} onOpenChange={setShowDetails}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                Detalles del Cliente: {selectedCliente?.nombres} {selectedCliente?.apellidos}
              </DialogTitle>
            </DialogHeader>
            
            {detailsLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Cargando detalles...</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Información del Cliente */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Información del Cliente</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center space-x-3">
                        <User className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-500">Nombre</p>
                          <p className="font-medium">{selectedCliente?.nombres} {selectedCliente?.apellidos}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <CreditCard className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-500">Cédula</p>
                          <p className="font-medium">{selectedCliente?.cedula}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Mail className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-500">Email</p>
                          <p className="font-medium">{selectedCliente?.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Phone className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-500">Teléfono</p>
                          <p className="font-medium">{selectedCliente?.telefono}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <MapPin className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-500">Sector</p>
                          <p className="font-medium">{selectedCliente?.sector}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <DollarSign className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-500">Plan</p>
                          <p className="font-medium">{selectedCliente?.tipo_plan} - ${selectedCliente?.precio_plan}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <CheckCircle className="h-5 w-5 text-green-400" />
                        <div>
                          <p className="text-sm text-gray-500">Total Pagado</p>
                          <p className="font-medium text-green-600">${(selectedCliente?.total_pagado || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <AlertTriangle className="h-5 w-5 text-red-400" />
                        <div>
                          <p className="text-sm text-gray-500">Deuda Actual</p>
                          <p className="font-medium text-red-600">${selectedCliente?.monto_total_deuda.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Cuotas Mensuales */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Cuotas Mensuales</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Período</TableHead>
                          <TableHead>Monto</TableHead>
                          <TableHead>Vencimiento</TableHead>
                          <TableHead>Estado</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {cuotasCliente.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center py-4">
                              No hay cuotas registradas
                            </TableCell>
                          </TableRow>
                        ) : (
                          cuotasCliente.map((cuota) => (
                            <TableRow key={cuota.id}>
                              <TableCell>
                                {getMesNombre(cuota.mes)} {cuota.año}
                              </TableCell>
                              <TableCell>${cuota.monto}</TableCell>
                              <TableCell>
                                {cuota.fecha_vencimiento ? 
                                  new Date(cuota.fecha_vencimiento).toLocaleDateString() : 
                                  'Sin fecha'
                                }
                              </TableCell>
                              <TableCell>{getCuotaBadge(cuota.estado)}</TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>

                {/* Historial de Pagos */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Historial de Pagos</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Fecha</TableHead>
                          <TableHead>Concepto</TableHead>
                          <TableHead>Monto</TableHead>
                          <TableHead>Meses Cubiertos</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {historialCliente.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center py-4">
                              No hay historial de pagos
                            </TableCell>
                          </TableRow>
                        ) : (
                          historialCliente.map((pago) => (
                            <TableRow key={pago.id}>
                              <TableCell>
                                {new Date(pago.fecha_pago).toLocaleDateString()}
                              </TableCell>
                              <TableCell>{pago.concepto}</TableCell>
                              <TableCell>${pago.monto_pagado}</TableCell>
                              <TableCell>{pago.meses_cubiertos}</TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Modal de Configuración */}
        <Dialog open={showConfig} onOpenChange={setShowConfig}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Configuración del Sistema</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="dia_vencimiento">Día de Vencimiento</Label>
                <Input
                  id="dia_vencimiento"
                  type="number"
                  min="1"
                  max="31"
                  value={config.dia_vencimiento}
                  onChange={(e) => setConfig(prev => ({ ...prev, dia_vencimiento: parseInt(e.target.value) }))}
                />
              </div>
              <div>
                <Label htmlFor="dias_gracia">Días de Gracia</Label>
                <Input
                  id="dias_gracia"
                  type="number"
                  min="0"
                  max="30"
                  value={config.dias_gracia}
                  onChange={(e) => setConfig(prev => ({ ...prev, dias_gracia: parseInt(e.target.value) }))}
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowConfig(false)}>
                  Cancelar
                </Button>
                <Button onClick={() => setShowConfig(false)}>
                  Guardar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
} 