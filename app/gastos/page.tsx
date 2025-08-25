"use client"

import React, { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import {
  ArrowLeft,
  Plus,
  Search,
  Edit,
  Trash2,
  Receipt,
  TrendingDown,
  Calendar,
  Building,
  Truck,
  Wrench,
  FileText,
  Download,
  Upload,
  Eye,
  X,
  RefreshCw,
  DollarSign,
  BarChart3,
  PieChart,
} from "lucide-react"
import { apiRequest, API_ENDPOINTS, isAuthenticated } from "@/lib/config/api"

interface Gasto {
  id: number
  descripcion: string
  categoria: string
  monto: number
  fecha_gasto: string
  proveedor: string
  metodo_pago: string
  comprobante_url?: string
  usuario_id: number
  usuario_nombre: string
  fecha_creacion: string
}

interface GastoStats {
  total_count: number
  total_amount: number
  month_count: number
  month_amount: number
  categorias: Array<{
    categoria: string
    count: number
    amount: number
  }>
  metodos: Array<{
    metodo: string
    count: number
    amount: number
  }>
  promedio: number
}

type FormData = {
  descripcion: string
  categoria: string
  monto: string
  fecha_gasto: string
  proveedor: string
  metodo_pago: string
  comprobante_url: string
}

export default function GastosPage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // Estados principales
  const [gastos, setGastos] = useState<Gasto[]>([])
  const [stats, setStats] = useState<GastoStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [searching, setSearching] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  
  // Estados de búsqueda y filtros
  const [searchTerm, setSearchTerm] = useState("")
  const [filterCategoria, setFilterCategoria] = useState("todos")
  const [filterMetodo, setFilterMetodo] = useState("todos")
  
  // Estados del modal
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingGasto, setEditingGasto] = useState<Gasto | null>(null)
  
  // Estados de confirmación
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean, gasto: Gasto | null }>({
    open: false,
    gasto: null
  })
  
  // Estados del formulario
  const [formData, setFormData] = useState<FormData>({
    descripcion: "",
    categoria: "",
    monto: "",
    fecha_gasto: new Date().toISOString().slice(0, 10),
    proveedor: "",
    metodo_pago: "",
    comprobante_url: ""
  })
  
  // Estados de archivos
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [filePreview, setFilePreview] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)

  const categorias = [
    { nombre: "Proveedores", icono: Building, color: "bg-blue-500" },
    { nombre: "Transporte", icono: Truck, color: "bg-green-500" },
    { nombre: "Mantenimiento", icono: Wrench, color: "bg-yellow-500" },
    { nombre: "Oficina", icono: FileText, color: "bg-purple-500" },
    { nombre: "Servicios", icono: Receipt, color: "bg-red-500" },
    { nombre: "Otros", icono: Receipt, color: "bg-gray-500" },
  ]

  const metodosPago = [
    { nombre: "Efectivo", color: "bg-green-100 text-green-800" },
    { nombre: "Transferencia", color: "bg-blue-100 text-blue-800" },
    { nombre: "Tarjeta", color: "bg-purple-100 text-purple-800" },
    { nombre: "Cheque", color: "bg-orange-100 text-orange-800" },
  ]

  // Verificar autenticación
  const checkAuth = () => {
    if (!isAuthenticated()) {
      router.push("/")
      return false
    }
    return true
  }

  // Verificar si un gasto se puede editar/eliminar (solo el mismo día)
  const canEditGasto = (fechaGasto: string) => {
    const today = new Date().toISOString().slice(0, 10) // YYYY-MM-DD
    return fechaGasto === today
  }

  // Cargar gastos
  const loadGastos = async () => {
    if (!checkAuth()) return
    
    if (searchTerm) {
      setSearching(true)
    } else {
      setLoading(true)
    }
    
    setError(null)
    try {
      const params = new URLSearchParams()
      if (searchTerm) params.set("search", searchTerm)
      if (filterCategoria !== "todos") params.set("categoria", filterCategoria)
      if (filterMetodo !== "todos") params.set("metodo_pago", filterMetodo)

      const url = `${API_ENDPOINTS.GASTOS}?${params.toString()}`
      const json = await apiRequest(url)
      
      if (json.success && Array.isArray(json.data)) {
        const parsed: Gasto[] = json.data.map((g: any) => ({
          ...g,
          monto: typeof g.monto === 'string' ? parseFloat(g.monto) : g.monto,
        }))
        setGastos(parsed)
      } else {
        throw new Error(json.message || "Error cargando gastos")
      }
    } catch (e) {
      console.error("Error en loadGastos:", e)
      setError((e as Error).message || "Error cargando gastos")
    } finally {
      setLoading(false)
      setSearching(false)
    }
  }

  // Cargar estadísticas
  const loadStats = async () => {
    try {
      const json = await apiRequest(`${API_ENDPOINTS.GASTOS}stats/`)
      if (json.success) {
        setStats(json.data)
      }
    } catch (e) {
      console.error("Error cargando estadísticas:", e)
    }
  }

  // Manejar selección de archivo
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Validar tipo de archivo
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf']
      if (!allowedTypes.includes(file.type)) {
        setError("Solo se permiten archivos PDF, JPG, PNG o GIF")
        return
      }
      
      // Validar tamaño (10MB)
      if (file.size > 10 * 1024 * 1024) {
        setError("El archivo no puede ser mayor a 10MB")
        return
      }
      
      setSelectedFile(file)
      setFormData(prev => ({ ...prev, comprobante_url: "" }))
      
      // Crear preview para imágenes
      if (file.type.startsWith('image/')) {
        const reader = new FileReader()
        reader.onload = (e) => setFilePreview(e.target?.result as string)
        reader.readAsDataURL(file)
      } else {
        setFilePreview(null)
      }
    }
  }

  // Abrir selector de archivo
  const openFileSelector = () => {
    fileInputRef.current?.click()
  }

  // Limpiar archivo seleccionado
  const clearFile = () => {
    setSelectedFile(null)
    setFilePreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  // Abrir modal para nuevo gasto
  const openNew = () => {
    setEditingGasto(null)
    setFormData({
      descripcion: "",
      categoria: "",
      monto: "",
      fecha_gasto: new Date().toISOString().slice(0, 10),
      proveedor: "",
      metodo_pago: "",
      comprobante_url: ""
    })
    setSelectedFile(null)
    setFilePreview(null)
    setError(null)
    setIsDialogOpen(true)
  }

  // Abrir modal de edición
  const handleEdit = (gasto: Gasto) => {
    setEditingGasto(gasto)
    setFormData({
      descripcion: gasto.descripcion,
      categoria: gasto.categoria,
      monto: gasto.monto.toString(),
      fecha_gasto: gasto.fecha_gasto.slice(0, 10),
      proveedor: gasto.proveedor,
      metodo_pago: gasto.metodo_pago,
      comprobante_url: gasto.comprobante_url || ""
    })
    setSelectedFile(null)
    setFilePreview(null)
    setError(null)
    setIsDialogOpen(true)
  }

  // Manejar envío del formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!checkAuth()) return

    // Validaciones
    if (!formData.descripcion.trim()) {
      setError("La descripción es obligatoria")
      return
    }

    if (!formData.monto || parseFloat(formData.monto) <= 0) {
      setError("El monto debe ser mayor a 0")
      return
    }

    if (!formData.categoria) {
      setError("La categoría es obligatoria")
      return
    }

    if (!formData.proveedor.trim()) {
      setError("El proveedor/lugar es obligatorio")
      return
    }

    if (!formData.metodo_pago) {
      setError("El método de pago es obligatorio")
      return
    }

    setUploading(true)
    setError(null)

    try {
      const formDataToSend = new FormData()
      formDataToSend.append('descripcion', formData.descripcion)
      formDataToSend.append('categoria', formData.categoria)
      formDataToSend.append('monto', formData.monto)
      formDataToSend.append('fecha_gasto', formData.fecha_gasto)
      formDataToSend.append('proveedor', formData.proveedor)
      formDataToSend.append('metodo_pago', formData.metodo_pago)
      
      if (selectedFile) {
        formDataToSend.append('comprobante', selectedFile)
      } else if (formData.comprobante_url) {
        formDataToSend.append('comprobante_url', formData.comprobante_url)
      }

      if (editingGasto) {
        formDataToSend.append('id', editingGasto.id.toString())
      }

      const url = editingGasto ? `${API_ENDPOINTS.GASTOS}update/` : `${API_ENDPOINTS.GASTOS}create/`
      const method = editingGasto ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        body: formDataToSend,
        headers: {
          'X-User-Email': localStorage.getItem('userEmail') || ''
        }
      })

      const json = await response.json()

      if (json.success) {
        setIsDialogOpen(false)
        setSuccess(editingGasto ? "Gasto actualizado exitosamente" : "Gasto creado exitosamente")
        setError(null)
        loadGastos()
        loadStats()
        
        // Limpiar mensaje de éxito después de 3 segundos
        setTimeout(() => setSuccess(null), 3000)
      } else {
        setError(json.message || "Error al guardar gasto")
      }
    } catch (e) {
      console.error("Error en handleSubmit:", e)
      setError((e as Error).message || "Error al guardar gasto")
    } finally {
      setUploading(false)
    }
  }

  // Abrir diálogo de confirmación de eliminación
  const handleDeleteClick = (gasto: Gasto) => {
    setDeleteDialog({ open: true, gasto })
  }

  // Confirmar eliminación
  const handleDeleteConfirm = async () => {
    if (!deleteDialog.gasto) return
    
    try {
      const response = await apiRequest(`${API_ENDPOINTS.GASTOS}delete/`, {
        method: 'DELETE',
        body: JSON.stringify({ id: deleteDialog.gasto.id })
      })

      if (response.success) {
        setSuccess("Gasto eliminado exitosamente")
        setError(null)
        loadGastos()
        loadStats()
        
        // Limpiar mensaje de éxito después de 3 segundos
        setTimeout(() => setSuccess(null), 3000)
      } else {
        setError(response.message || "Error al eliminar gasto")
      }
    } catch (e) {
      console.error("Error en handleDelete:", e)
      setError((e as Error).message || "Error al eliminar gasto")
    } finally {
      setDeleteDialog({ open: false, gasto: null })
    }
  }

  // Refrescar datos
  const handleRefresh = () => {
    setSearchTerm("")
    setFilterCategoria("todos")
    setFilterMetodo("todos")
    loadGastos()
    loadStats()
  }

  // Navegar de vuelta al dashboard
  const handleGoBack = () => {
    router.push("/dashboard")
  }

  // Exportar CSV
  const exportarReporte = () => {
    const csv = [
      "Fecha,Categoría,Descripción,Proveedor,Método,Monto,Usuario",
      ...gastos.map(g =>
        `${g.fecha_gasto},${g.categoria},"${g.descripcion}","${g.proveedor}",${g.metodo_pago},${g.monto.toFixed(2)},"${g.usuario_nombre}"`
      ),
    ].join("\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `gastos_${new Date().toISOString().split("T")[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  // Cargar datos al montar el componente
  useEffect(() => {
    if (checkAuth()) {
      loadGastos()
      loadStats()
    }
  }, [])

  // Búsqueda con debounce
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (checkAuth()) {
        loadGastos()
      }
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [searchTerm, filterCategoria, filterMetodo])

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
              <h1 className="text-3xl font-bold text-gray-900">Control de Gastos</h1>
              <p className="text-gray-600">Gestiona los gastos de la empresa</p>
            </div>
          </div>
        </div>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Cargando gastos...</p>
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
              <h1 className="text-3xl font-bold text-gray-900">Control de Gastos</h1>
              <p className="text-gray-600">Gestiona los gastos de la empresa</p>
            </div>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={exportarReporte} className="flex items-center space-x-2">
              <Download className="h-4 w-4" />
              Exportar
            </Button>
            <Button onClick={openNew} className="flex items-center space-x-2 bg-red-600 hover:bg-red-700 text-white">
              <Plus className="h-4 w-4" />
              Nuevo Gasto
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-gradient-to-r from-indigo-500 to-indigo-600 text-white hover:shadow-lg transition-shadow transform hover:scale-105">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-indigo-100 text-sm font-medium">Total Gastos</p>
                  <p className="text-3xl font-bold">
                    ${stats?.total_amount.toLocaleString(undefined, { minimumFractionDigits: 2 }) || '0.00'}
                  </p>
                </div>
                <div className="w-12 h-12 bg-indigo-400 bg-opacity-30 rounded-full flex items-center justify-center">
                  <TrendingDown className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white hover:shadow-lg transition-shadow transform hover:scale-105">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-emerald-100 text-sm font-medium">Gastos del Mes</p>
                  <p className="text-3xl font-bold">
                    ${stats?.month_amount.toLocaleString(undefined, { minimumFractionDigits: 2 }) || '0.00'}
                  </p>
                </div>
                <div className="w-12 h-12 bg-emerald-400 bg-opacity-30 rounded-full flex items-center justify-center">
                  <Calendar className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-violet-500 to-violet-600 text-white hover:shadow-lg transition-shadow transform hover:scale-105">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-violet-100 text-sm font-medium">Total Registros</p>
                  <p className="text-3xl font-bold">{stats?.total_count || 0}</p>
                </div>
                <div className="w-12 h-12 bg-violet-400 bg-opacity-30 rounded-full flex items-center justify-center">
                  <Receipt className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-amber-500 to-amber-600 text-white hover:shadow-lg transition-shadow transform hover:scale-105">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-amber-100 text-sm font-medium">Promedio por Gasto</p>
                  <p className="text-3xl font-bold">
                    ${stats?.promedio.toFixed(2) || '0.00'}
                  </p>
                </div>
                <div className="w-12 h-12 bg-amber-400 bg-opacity-30 rounded-full flex items-center justify-center">
                  <DollarSign className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="gastos" className="space-y-6">
          <TabsList className="grid grid-cols-3">
            <TabsTrigger value="gastos">Registro de Gastos</TabsTrigger>
            <TabsTrigger value="categorias">Por Categorías</TabsTrigger>
            <TabsTrigger value="reportes">Reportes</TabsTrigger>
          </TabsList>

          <TabsContent value="gastos" className="space-y-4">
            {/* Search & Filters */}
            <Card>
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row gap-4 items-center">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Buscar por descripción o proveedor..."
                      className="pl-10"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && loadGastos()}
                    />
                  </div>
                  
                  <Button onClick={handleRefresh} variant="outline" className="flex items-center space-x-2">
                    <RefreshCw className="h-4 w-4" />
                    Refrescar
                  </Button>

                  {/* Filtro por Categoría */}
                  <Select
                    value={filterCategoria}
                    onValueChange={setFilterCategoria}
                  >
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Todas las categorías" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todas las categorías</SelectItem>
                      {categorias.map(c => (
                        <SelectItem key={c.nombre} value={c.nombre}>
                          {c.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* Filtro por Método de Pago */}
                  <Select
                    value={filterMetodo}
                    onValueChange={setFilterMetodo}
                  >
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Todos los métodos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos los métodos</SelectItem>
                      {metodosPago.map(m => (
                        <SelectItem key={m.nombre} value={m.nombre}>
                          {m.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Tabla Gastos */}
            <Card>
              <CardHeader>
                <CardTitle>
                  Registro de Gastos ({gastos.length})
                  {searchTerm && (
                    <span className="text-sm font-normal text-gray-500 ml-2">
                      - Resultados para "{searchTerm}"
                    </span>
                  )}
                </CardTitle>
                <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg border border-blue-200">
                  <p className="font-medium text-blue-800 mb-1">📝 Regla de Edición:</p>
                  <p className="text-blue-700">
                    Los gastos solo se pueden editar o eliminar el mismo día en que fueron registrados. 
                    Los gastos de días anteriores se muestran como "No Editable" por seguridad.
                  </p>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Descripción</TableHead>
                        <TableHead>Categoría</TableHead>
                        <TableHead>Lugar</TableHead>
                        <TableHead>Método</TableHead>
                        <TableHead>Monto</TableHead>
                        <TableHead>Comprobante</TableHead>
                        <TableHead>Usuario</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead>Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {gastos.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={10} className="text-center py-8">
                            <div className="flex flex-col items-center space-y-2">
                              <Receipt className="h-8 w-8 text-gray-400" />
                              <p className="text-gray-500">
                                {searchTerm ? `No se encontraron gastos para "${searchTerm}"` : "No hay gastos registrados"}
                              </p>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : (
                        gastos.map(gasto => (
                          <TableRow key={gasto.id}>
                            <TableCell>{gasto.fecha_gasto}</TableCell>
                            <TableCell className="max-w-xs truncate">{gasto.descripcion}</TableCell>
                            <TableCell>
                              <Badge variant="outline">{gasto.categoria}</Badge>
                            </TableCell>
                            <TableCell>{gasto.proveedor}</TableCell>
                            <TableCell>
                              <Badge variant="secondary">{gasto.metodo_pago}</Badge>
                            </TableCell>
                            <TableCell className="text-red-600 font-semibold">
                              ${gasto.monto.toFixed(2)}
                            </TableCell>
                            <TableCell>
                              {gasto.comprobante_url ? (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => window.open(gasto.comprobante_url, '_blank')}
                                  className="flex items-center space-x-1"
                                >
                                  <Eye className="h-3 w-3" />
                                  <span>Ver</span>
                                </Button>
                              ) : (
                                <span className="text-gray-400 text-sm">Sin comprobante</span>
                              )}
                            </TableCell>
                            <TableCell>{gasto.usuario_nombre}</TableCell>
                            <TableCell>
                              <Badge 
                                variant="outline"
                                className={canEditGasto(gasto.fecha_gasto) 
                                  ? "border-green-500 text-green-700 bg-green-50" 
                                  : "border-gray-300 text-gray-500 bg-gray-50"
                                }
                              >
                                {canEditGasto(gasto.fecha_gasto) ? "Editable" : "No Editable"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center space-x-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleEdit(gasto)}
                                  disabled={!canEditGasto(gasto.fecha_gasto)}
                                  title={canEditGasto(gasto.fecha_gasto) ? "Editar gasto" : "Solo se puede editar gastos del día actual"}
                                  className={!canEditGasto(gasto.fecha_gasto) ? "opacity-50 cursor-not-allowed" : ""}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleDeleteClick(gasto)}
                                  disabled={!canEditGasto(gasto.fecha_gasto)}
                                  title={canEditGasto(gasto.fecha_gasto) ? "Eliminar gasto" : "Solo se puede eliminar gastos del día actual"}
                                  className={`text-red-600 hover:text-red-700 ${!canEditGasto(gasto.fecha_gasto) ? "opacity-50 cursor-not-allowed" : ""}`}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="categorias" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {stats?.categorias.map(cat => {
                const categoriaInfo = categorias.find(c => c.nombre === cat.categoria)
                const pct = stats.total_amount > 0 ? (cat.amount / stats.total_amount) * 100 : 0
                
                return (
                  <Card key={cat.categoria} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        {categoriaInfo?.icono && <categoriaInfo.icono className="mr-2 h-5 w-5" />}
                        {cat.categoria}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="font-bold text-xl">${cat.amount.toFixed(2)}</div>
                      <div className="text-sm text-gray-600">{cat.count} registros</div>
                      <div className="w-full bg-gray-200 h-2 rounded-full mt-2">
                        <div 
                          className={`h-2 ${categoriaInfo?.color || 'bg-blue-600'} rounded-full`} 
                          style={{width: `${pct}%`}}
                        />
                      </div>
                      <div className="text-sm text-gray-500">{pct.toFixed(1)}%</div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </TabsContent>

          <TabsContent value="reportes" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <BarChart3 className="mr-2 h-5 w-5" />
                    Gastos por Método
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {stats?.metodos.map(metodo => {
                    const metodoInfo = metodosPago.find(m => m.nombre === metodo.metodo)
                    const pct = stats.total_amount > 0 ? (metodo.amount / stats.total_amount) * 100 : 0
                    
                    return (
                      <div key={metodo.metodo} className="space-y-2 mb-4">
                        <div className="flex justify-between items-center">
                          <span className="font-medium">{metodo.metodo}</span>
                          <span className="font-bold">${metodo.amount.toFixed(2)}</span>
                        </div>
                        <div className="w-full bg-gray-200 h-2 rounded-full">
                          <div 
                            className="h-2 bg-red-600 rounded-full" 
                            style={{width: `${pct}%`}}
                          />
                        </div>
                        <div className="text-sm text-gray-600">
                          {metodo.count} registros ({pct.toFixed(1)}%)
                        </div>
                      </div>
                    )
                  })}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <PieChart className="mr-2 h-5 w-5" />
                    Resumen Financiero
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <span className="font-medium">Total Gastos</span>
                      <span className="font-bold text-lg">${stats?.total_amount.toFixed(2) || '0.00'}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <span className="font-medium">Gastos del Mes</span>
                      <span className="font-bold text-lg">${stats?.month_amount.toFixed(2) || '0.00'}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <span className="font-medium">Promedio por Gasto</span>
                      <span className="font-bold text-lg">${stats?.promedio.toFixed(2) || '0.00'}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <span className="font-medium">Total Registros</span>
                      <span className="font-bold text-lg">{stats?.total_count || 0}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Modal de formulario */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingGasto ? "Editar Gasto" : "Nuevo Gasto"}
            </DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="descripcion">Descripción *</Label>
                <Input
                  id="descripcion"
                  value={formData.descripcion}
                  onChange={(e) => setFormData(prev => ({ ...prev, descripcion: e.target.value }))}
                  placeholder="Descripción del gasto"
                />
              </div>
              
              <div>
                <Label htmlFor="categoria">Categoría *</Label>
                <Select value={formData.categoria} onValueChange={(v) => setFormData(prev => ({ ...prev, categoria: v }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    {categorias.map(c => (
                      <SelectItem key={c.nombre} value={c.nombre}>
                        {c.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="monto">Monto *</Label>
                <Input
                  id="monto"
                  type="number"
                  step="0.01"
                  value={formData.monto}
                  onChange={(e) => setFormData(prev => ({ ...prev, monto: e.target.value }))}
                  placeholder="0.00"
                />
              </div>
              
              <div>
                <Label htmlFor="fecha_gasto">Fecha del Gasto *</Label>
                <Input
                  id="fecha_gasto"
                  type="date"
                  value={formData.fecha_gasto}
                  onChange={(e) => setFormData(prev => ({ ...prev, fecha_gasto: e.target.value }))}
                />
              </div>
              
              <div>
                <Label htmlFor="proveedor">Lugar/Proveedor *</Label>
                <Input
                  id="proveedor"
                  value={formData.proveedor}
                  onChange={(e) => setFormData(prev => ({ ...prev, proveedor: e.target.value }))}
                  placeholder="Nombre del lugar o proveedor"
                />
              </div>
              
              <div>
                <Label htmlFor="metodo_pago">Método de Pago *</Label>
                <Select value={formData.metodo_pago} onValueChange={(v) => setFormData(prev => ({ ...prev, metodo_pago: v }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar método" />
                  </SelectTrigger>
                  <SelectContent>
                    {metodosPago.map(m => (
                      <SelectItem key={m.nombre} value={m.nombre}>
                        {m.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Sección de comprobante */}
            <div className="space-y-2">
              <Label>Comprobante</Label>
              
              {/* Opción 1: Subir archivo */}
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={openFileSelector}
                    className="flex items-center space-x-2"
                  >
                    <Upload className="h-4 w-4" />
                    Subir Archivo
                  </Button>
                  {selectedFile && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={clearFile}
                      className="flex items-center space-x-2 text-red-600"
                    >
                      <X className="h-4 w-4" />
                      Limpiar
                    </Button>
                  )}
                </div>
                
                {selectedFile && (
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm font-medium">{selectedFile.name}</p>
                    <p className="text-xs text-gray-500">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                    {filePreview && (
                      <img 
                        src={filePreview} 
                        alt="Preview" 
                        className="mt-2 max-w-xs rounded border"
                      />
                    )}
                  </div>
                )}
              </div>

              {/* Opción 2: URL */}
              <div className="space-y-2">
                <p className="text-sm text-gray-600">O ingresar URL del comprobante:</p>
                <Input
                  type="url"
                  value={formData.comprobante_url}
                  onChange={(e) => setFormData(prev => ({ ...prev, comprobante_url: e.target.value }))}
                  placeholder="https://ejemplo.com/comprobante.pdf"
                  disabled={!!selectedFile}
                />
              </div>
            </div>

            {/* Input de archivo oculto */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.gif"
              onChange={handleFileSelect}
              className="hidden"
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={uploading}>
                {uploading ? "Guardando..." : (editingGasto ? "Actualizar" : "Crear")} Gasto
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Diálogo de confirmación de eliminación */}
      <AlertDialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ open, gasto: null })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Está seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente el gasto{" "}
              <strong>{deleteDialog.gasto?.descripcion}</strong> por ${deleteDialog.gasto?.monto.toFixed(2)}.
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
