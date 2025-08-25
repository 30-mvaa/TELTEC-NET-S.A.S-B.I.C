"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { 
  ArrowLeft, 
  Calendar, 
  DollarSign, 
  Users, 
  Filter, 
  Download, 
  RefreshCw, 
  BarChart3,
  Mail,
  FileText,
  TrendingUp,
  TrendingDown
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Pagination } from "@/components/ui/pagination"
import { FinancialChart } from "../components/FinancialChart"

// Interfaces
interface ClienteAnualData {
  id: number;
  cedula: string;
  nombres: string;
  apellidos: string;
  nombre_completo: string;
  tipo_plan: string;
  precio_plan: number;
  sector: string;
  estado: string;
  fecha_registro: string;
  meses_estado: Record<number, {
    pagado: boolean;
    cantidad_pagos: number;
    total_pagado: number;
    color: string;
  }>;
  total_anual: number;
  pagos_anual: number;
  meses_pagados: number;
  meses_sin_pagar: number;
  porcentaje_cumplimiento: number;
}

interface ReporteAnualData {
  anio: number;
  clientes: ClienteAnualData[];
  total_clientes: number;
  resumen: {
    total_recaudado_anio: number;
    total_pagos_anio: number;
    promedio_cumplimiento: number;
  };
}

interface UtilidadesAnualesData {
  anio: number;
  recaudacion_anual: number;
  gastos_anuales: number;
  utilidad_anual: number;
  total_pagos: number;
  total_gastos: number;
  porcentaje_utilidad: number;
}

interface RecaudacionMensualData {
  mes: number;
  nombre_mes: string;
  nombre_mes_corto: string;
  total_recaudado: number;
  total_pagos: number;
  es_mayor_recaudacion: boolean;
  es_menor_recaudacion: boolean;
}

interface ReporteGraficoAnualData {
  anio: number;
  datos_mensuales: RecaudacionMensualData[];
  estadisticas: {
    total_anual: number;
    total_pagos_anual: number;
    promedio_mensual: number;
    meses_mayor_recaudacion: RecaudacionMensualData[];
    meses_menor_recaudacion: RecaudacionMensualData[];
  };
  variacion_mensual: Array<{
    mes: number;
    nombre_mes: string;
    variacion_porcentual: number;
  }>;
  fecha_generacion: string;
}

interface PagoData {
  id: number;
  numero_comprobante: string;
  fecha_pago: string;
  cliente_nombre: string;
  cliente_cedula: string;
  tipo_plan: string;
  concepto: string;
  metodo_pago: string;
  monto: number;
  estado: string;
  comprobante_enviado: boolean;
}

interface GastoData {
  id: number;
  fecha_gasto: string;
  descripcion: string;
  categoria: string;
  monto: number;
  proveedor: string;
  metodo_pago: string;
  usuario_nombre: string;
}

export default function ReportesPage() {
  const router = useRouter()
  const now = new Date()
  const baseYear = now.getFullYear()

  // Estados principales
  const [activeTab, setActiveTab] = useState("anual")
  const [selectedYear, setSelectedYear] = useState(baseYear)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Estados para reporte anual
  const [reporteAnualData, setReporteAnualData] = useState<ReporteAnualData | null>(null)
  const [anualSearch, setAnualSearch] = useState("")
  const [anualSector, setAnualSector] = useState("todos")
  const [sectores, setSectores] = useState<string[]>([])

  // Estados para reporte gráfico anual
  const [reporteGraficoData, setReporteGraficoData] = useState<ReporteGraficoAnualData | null>(null)
  const [utilidadesAnuales, setUtilidadesAnuales] = useState<UtilidadesAnualesData | null>(null)
  const [anioUtilidades, setAnioUtilidades] = useState(baseYear)
  const [chartType, setChartType] = useState<'bar' | 'line'>('bar')

  // Estados para pagos
  const [pagosData, setPagosData] = useState<PagoData[]>([])
  const [pagosSearch, setPagosSearch] = useState("")
  const [pagosMetodo, setPagosMetodo] = useState("todos")
  const [pagosEstado, setPagosEstado] = useState("todos")
  const [pagosPage, setPagosPage] = useState(1)
  const [pagosPageSize, setPagosPageSize] = useState(10)
  const [selectedPagos, setSelectedPagos] = useState<number[]>([])
  const [isSendingComprobantes, setIsSendingComprobantes] = useState(false)
  const [pagosMes, setPagosMes] = useState(now.getMonth() + 1)

  // Estados para gastos
  const [gastosData, setGastosData] = useState<GastoData[]>([])
  const [gastosSearch, setGastosSearch] = useState("")
  const [gastosCategoria, setGastosCategoria] = useState("todos")
  const [gastosPage, setGastosPage] = useState(1)
  const [gastosPageSize, setGastosPageSize] = useState(10)
  const [gastosMes, setGastosMes] = useState(now.getMonth() + 1)

  // Funciones auxiliares
  const generateYears = () => {
    const years = []
    const currentYear = new Date().getFullYear()
    for (let year = currentYear; year >= currentYear - 5; year--) {
      years.push(year)
    }
    return years
  }

  // Función para obtener los meses únicos que tienen datos
  const getMesesConDatos = (clientes: ClienteAnualData[]) => {
    const mesesSet = new Set<number>()
    clientes.forEach(cliente => {
      Object.keys(cliente.meses_estado).forEach(mesStr => {
        const mes = parseInt(mesStr)
        if (cliente.meses_estado[mes].total_pagado > 0) {
          mesesSet.add(mes)
        }
      })
    })
    return Array.from(mesesSet).sort((a, b) => a - b)
  }

  const getAllMeses = () => {
    return Array.from({ length: 12 }, (_, i) => i + 1)
  }

  // Funciones de fetch
  const fetchSectores = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/reportes/sectores/')
      const data = await response.json()
      
      if (data.success && Array.isArray(data.sectores)) {
        // Filtrar y limpiar los sectores antes de establecerlos
        const cleanSectores = data.sectores
          .filter((sector: any) => sector && typeof sector === 'string' && sector.trim() !== '')
          .map((sector: string) => sector.trim())
        setSectores(cleanSectores)
      } else {
        setSectores([])
      }
    } catch (error) {
      console.error("Error fetching sectores:", error)
      setSectores([])
    }
  }

  const fetchUtilidadesAnuales = async () => {
    try {
      const response = await fetch(`http://localhost:8000/api/reportes/utilidades-anuales/?year=${anioUtilidades}`)
      const data = await response.json()
      
      if (data.success) {
        setUtilidadesAnuales(data)
      }
    } catch (error) {
      console.error("Error fetching utilidades anuales:", error)
    }
  }

  const fetchReporteAnual = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch(`http://localhost:8000/api/reportes/anual-clientes/?year=${selectedYear}`)
      const data = await response.json()
      
      if (data.success && data.data) {
        setReporteAnualData(data.data)
      } else {
        setError(data.message || 'Error al cargar reporte anual')
        setReporteAnualData(null)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido")
      setReporteAnualData(null)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchReporteGraficoAnual = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch(`http://localhost:8000/api/reportes/grafico-anual-recaudacion/?year=${selectedYear}`)
      const data = await response.json()
      
      if (data.success) {
        setReporteGraficoData(data)
      } else {
        setError(data.message || 'Error al cargar el reporte gráfico anual')
        setReporteGraficoData(null)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido")
      setReporteGraficoData(null)
    } finally {
      setIsLoading(false)
    }
  }

  const descargarReportePDF = async () => {
    try {
      const response = await fetch(`http://localhost:8000/api/reportes/descargar-grafico-pdf/?year=${selectedYear}`, {
        method: 'GET',
      })
      
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `reporte_recaudacion_anual_${selectedYear}.pdf`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      } else {
        setError('Error al descargar el PDF')
      }
    } catch (err) {
      setError('Error al descargar el PDF')
    }
  }

  const fetchPagosData = async () => {
    try {
      const response = await fetch(`http://localhost:8000/api/reportes/pagos/?month=${pagosMes}&year=${selectedYear}`)
      const data = await response.json()
      
      if (data.success) {
        setPagosData(data.data || [])
      }
    } catch (error) {
      console.error("Error fetching pagos:", error)
      setPagosData([])
    }
  }

  const fetchGastosData = async () => {
    try {
      const response = await fetch(`http://localhost:8000/api/reportes/gastos/?month=${gastosMes}&year=${selectedYear}`)
      const data = await response.json()
      
      if (data.success) {
        setGastosData(data.data || [])
      }
    } catch (error) {
      console.error("Error fetching gastos:", error)
      setGastosData([])
    }
  }

  // Funciones de pagos
  const togglePago = (id: number) => {
    setSelectedPagos(prev => 
      prev.includes(id) 
        ? prev.filter(p => p !== id)
        : [...prev, id]
    )
  }

  const toggleAllPagos = () => {
    const currentPagePagos = pagosFiltrados.slice((pagosPage - 1) * pagosPageSize, pagosPage * pagosPageSize)
    const allSelected = currentPagePagos.every(p => selectedPagos.includes(p.id))
    
    if (allSelected) {
      setSelectedPagos(prev => prev.filter(id => !currentPagePagos.some(p => p.id === id)))
    } else {
      setSelectedPagos(prev => [...new Set([...prev, ...currentPagePagos.map(p => p.id)])])
    }
  }

  const enviarComprobantesMasivos = async () => {
    setIsSendingComprobantes(true)
    try {
      const response = await fetch('/api/comprobantes/enviar-masivo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pagoIds: selectedPagos })
      })
      
      if (response.ok) {
        alert('Comprobantes enviados exitosamente')
        setSelectedPagos([])
        fetchPagosData()
      } else {
        alert('Error al enviar comprobantes')
      }
    } catch (error) {
      alert('Error al enviar comprobantes')
    } finally {
      setIsSendingComprobantes(false)
    }
  }

  // Cálculos derivados
  const pagosFiltrados = pagosData.filter(pago => {
    const matchesSearch = !pagosSearch || 
      pago.cliente_nombre.toLowerCase().includes(pagosSearch.toLowerCase()) ||
      pago.cliente_cedula.includes(pagosSearch) ||
      pago.numero_comprobante.includes(pagosSearch) ||
      pago.concepto.toLowerCase().includes(pagosSearch.toLowerCase())
    
    const matchesMetodo = pagosMetodo === "todos" || pago.metodo_pago === pagosMetodo
    const matchesEstado = pagosEstado === "todos" || pago.estado === pagosEstado
    
    return matchesSearch && matchesMetodo && matchesEstado
  })

  const pagosPageData = pagosFiltrados.slice((pagosPage - 1) * pagosPageSize, pagosPage * pagosPageSize)
  const pagosTotalPages = Math.ceil(pagosFiltrados.length / pagosPageSize)
  const pagosNoEnviadosPage = pagosPageData.filter(p => !p.comprobante_enviado)
  const canShowEnviarComprobantes = pagosNoEnviadosPage.length > 0

  // useEffect hooks
  useEffect(() => {
    fetchSectores()
  }, [])

  useEffect(() => {
    if (activeTab === 'utilidades') {
      fetchUtilidadesAnuales()
    }
  }, [activeTab, anioUtilidades])

  useEffect(() => {
    if (activeTab === 'anual') {
      fetchReporteAnual()
      fetchReporteGraficoAnual()
    }
  }, [activeTab, selectedYear])

  useEffect(() => {
    if (activeTab === 'grafico') {
      fetchReporteGraficoAnual()
    }
  }, [activeTab, selectedYear])

  useEffect(() => {
    if (activeTab === 'anual' && !reporteAnualData) {
      fetchReporteAnual()
    }
  }, [])

  useEffect(() => {
    if (activeTab === 'pagos') {
      fetchPagosData()
    }
  }, [activeTab, selectedYear, pagosMes, pagosSearch, pagosMetodo, pagosEstado])

  useEffect(() => {
    if (activeTab === 'gastos') {
      fetchGastosData()
    }
  }, [activeTab, selectedYear, gastosMes])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Header */}
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
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
                <h1 className="text-3xl font-bold text-slate-900">Reportes y Estadísticas</h1>
                <p className="text-slate-600">Dashboard ejecutivo y reportes detallados</p>
              </div>
            </div>
          </div>

          {/* Tabs de navegación */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="anual" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" /> Anual
              </TabsTrigger>
              <TabsTrigger value="grafico" className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" /> Gráfico
              </TabsTrigger>
              <TabsTrigger value="utilidades" className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" /> Utilidades
              </TabsTrigger>
              <TabsTrigger value="pagos" className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" /> Pagos
              </TabsTrigger>
              <TabsTrigger value="gastos" className="flex items-center gap-2">
                <TrendingDown className="h-4 w-4" /> Gastos
              </TabsTrigger>
            </TabsList>

            {/* Tab Reporte Anual de Clientes */}
            <TabsContent value="anual" className="space-y-6">
              {/* Filtros */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Reporte Anual de Clientes - {selectedYear}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-row flex-wrap gap-4 items-end">
                    <div className="flex-1 min-w-[200px]">
                      <label className="text-sm font-medium">Año</label>
                      <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar año" />
                        </SelectTrigger>
                        <SelectContent>
                          {generateYears().map((year) => (
                            <SelectItem key={year} value={year.toString()}>
                              {year}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex-1 min-w-[200px]">
                      <label className="text-sm font-medium">Buscar Cliente</label>
                      <Input
                        placeholder="Nombre o cédula..."
                        value={anualSearch}
                        onChange={(e) => setAnualSearch(e.target.value)}
                      />
                    </div>
                    <div className="flex-1 min-w-[200px]">
                      <label className="text-sm font-medium">Sector</label>
                      <Select value={anualSector} onValueChange={setAnualSector}>
                        <SelectTrigger>
                          <SelectValue placeholder="Todos los sectores" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="todos">Todos los sectores</SelectItem>
                          {Array.isArray(sectores) && sectores.length > 0 && sectores
                            .filter(sector => sector && typeof sector === 'string' && sector.trim() !== '')
                            .map((sector) => {
                              const cleanSector = sector.trim()
                              // Verificación adicional para evitar valores vacíos
                              if (!cleanSector || cleanSector === '') {
                                return null
                              }
                              return (
                                <SelectItem key={cleanSector} value={cleanSector}>
                                  {cleanSector}
                                </SelectItem>
                              )
                            }).filter(Boolean)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="min-w-[150px]">
                      <Button onClick={() => fetchReporteAnual()} className="w-full flex items-center gap-2">
                        <RefreshCw className="h-4 w-4" /> Actualizar
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Resumen del Año */}
              {reporteAnualData && (
                <div className="flex flex-row overflow-x-auto gap-4 pb-4">
                  <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white min-w-[200px] flex-shrink-0">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium opacity-90">Total Clientes</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold">{reporteAnualData.total_clientes}</div>
                    </CardContent>
                  </Card>
                  <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white min-w-[200px] flex-shrink-0">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium opacity-90">Total Recaudado</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold">${reporteAnualData.resumen.total_recaudado_anio.toLocaleString()}</div>
                    </CardContent>
                  </Card>
                  <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white min-w-[200px] flex-shrink-0">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium opacity-90">Total Pagos</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold">{reporteAnualData.resumen.total_pagos_anio}</div>
                    </CardContent>
                  </Card>
                  <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white min-w-[200px] flex-shrink-0">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium opacity-90">Promedio Cumplimiento</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold">{reporteAnualData.resumen.promedio_cumplimiento}%</div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Tabla de Clientes con Estado de Pagos */}
              {reporteAnualData && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Estado de Pagos por Cliente - {selectedYear}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="min-w-[150px]">Cliente</TableHead>
                            <TableHead className="min-w-[100px]">Cédula</TableHead>
                            <TableHead className="min-w-[120px]">Plan</TableHead>
                            <TableHead className="min-w-[100px]">Sector</TableHead>
                            <TableHead className="min-w-[100px]">Estado</TableHead>
                            {getAllMeses().map((mes) => (
                              <TableHead key={mes} className="min-w-[80px] text-center">
                                {new Date(selectedYear, mes - 1).toLocaleDateString('es-ES', { month: 'short' })}
                              </TableHead>
                            ))}
                            <TableHead className="min-w-[100px]">Total Anual</TableHead>
                            <TableHead className="min-w-[120px]">Cumplimiento</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {reporteAnualData.clientes
                            .filter(cliente => 
                              (anualSearch === "" || 
                               cliente.nombre_completo.toLowerCase().includes(anualSearch.toLowerCase()) ||
                               cliente.cedula.includes(anualSearch)) &&
                              (anualSector === "todos" || cliente.sector === anualSector)
                            )
                            .map((cliente) => (
                              <TableRow key={cliente.id} className="hover:bg-gray-50">
                                <TableCell className="font-medium">{cliente.nombre_completo}</TableCell>
                                <TableCell>{cliente.cedula}</TableCell>
                                <TableCell>{cliente.tipo_plan}</TableCell>
                                <TableCell>{cliente.sector}</TableCell>
                                <TableCell>
                                  <Badge className={cliente.estado === 'activo' ? 'bg-green-500' : 'bg-red-500'}>
                                    {cliente.estado}
                                  </Badge>
                                </TableCell>
                                {getAllMeses().map((mes) => {
                                  const mesData = cliente.meses_estado[mes]
                                  const tienePagos = mesData && mesData.total_pagado > 0
                                  return (
                                    <TableCell key={mes} className="text-center">
                                      <div className="flex flex-col items-center">
                                        <div 
                                          className={`w-8 h-8 rounded-full mx-auto shadow-md ${
                                            tienePagos 
                                              ? 'bg-green-500' 
                                              : 'bg-red-500'
                                          }`}
                                        />
                                        {tienePagos && (
                                          <span className="text-gray-600 mt-1 font-medium text-xs">
                                            ${mesData.total_pagado}
                                          </span>
                                        )}
                                      </div>
                                    </TableCell>
                                  )
                                })}
                                <TableCell className="font-medium">
                                  ${cliente.total_anual.toLocaleString()}
                                </TableCell>
                                <TableCell>
                                  <Badge 
                                    className={`${
                                      cliente.porcentaje_cumplimiento >= 80 
                                        ? 'bg-green-500' 
                                        : cliente.porcentaje_cumplimiento >= 60 
                                          ? 'bg-yellow-500' 
                                          : 'bg-red-500'
                                    } hover:opacity-80`}
                                  >
                                    {cliente.porcentaje_cumplimiento}%
                                  </Badge>
                                </TableCell>
                              </TableRow>
                            ))}
                          {reporteAnualData.clientes.filter(cliente => 
                            (anualSearch === "" || 
                             cliente.nombre_completo.toLowerCase().includes(anualSearch.toLowerCase()) ||
                             cliente.cedula.includes(anualSearch)) &&
                            (anualSector === "todos" || cliente.sector === anualSector)
                          ).length === 0 && (
                            <TableRow>
                              <TableCell colSpan={16} className="text-center py-8">
                                <div className="text-center">
                                  <Users className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                                  <h3 className="text-lg font-semibold text-gray-700 mb-2">No se encontraron clientes</h3>
                                  <p className="text-gray-500">Intenta ajustar los filtros de búsqueda o sector</p>
                                </div>
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Estado de carga */}
              {isLoading && (
                <Card>
                  <CardContent className="flex items-center justify-center py-12">
                    <div className="text-center">
                      <RefreshCw className="h-12 w-12 animate-spin mx-auto mb-4 text-blue-500" />
                      <h3 className="text-lg font-semibold text-gray-700 mb-2">Cargando reporte anual</h3>
                      <p className="text-gray-500">Obteniendo datos de clientes y pagos...</p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Error */}
              {error && (
                <Card className="border-red-200 bg-red-50">
                  <CardContent className="flex items-center justify-center py-8">
                    <div className="text-center">
                      <div className="text-red-500 text-4xl mb-4">⚠️</div>
                      <h3 className="text-lg font-semibold text-red-700 mb-2">Error al cargar datos</h3>
                      <p className="text-red-600 mb-4">{error}</p>
                      <Button onClick={fetchReporteAnual} variant="outline">
                        Reintentar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Sin datos */}
              {!isLoading && !error && !reporteAnualData && (
                <Card>
                  <CardContent className="flex items-center justify-center py-12">
                    <div className="text-center">
                      <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                      <h3 className="text-lg font-semibold text-gray-700 mb-2">No hay datos disponibles</h3>
                      <p className="text-gray-500">Selecciona un año para ver el reporte anual</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Tab Reporte Gráfico Anual */}
            <TabsContent value="grafico" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Reporte Gráfico Anual de Recaudación - {selectedYear}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {/* Filtros */}
                  <div className="flex flex-row flex-wrap gap-4 items-end mb-6">
                    <div className="flex-1 min-w-[200px]">
                      <label className="text-sm font-medium">Año</label>
                      <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar año" />
                        </SelectTrigger>
                        <SelectContent>
                          {generateYears().map((year) => (
                            <SelectItem key={year} value={year.toString()}>
                              {year}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-end gap-2">
                      <Button onClick={() => fetchReporteGraficoAnual()} className="flex items-center gap-2">
                        <RefreshCw className="h-4 w-4" /> Actualizar
                      </Button>
                      <Button 
                        onClick={descargarReportePDF} 
                        variant="outline" 
                        className="flex items-center gap-2 bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
                      >
                        <FileText className="h-4 w-4" /> Descargar PDF
                      </Button>
                    </div>
                  </div>

                  {/* Estado de carga */}
                  {isLoading && (
                    <div className="flex items-center justify-center py-8">
                      <RefreshCw className="h-8 w-8 animate-spin mr-2" />
                      <span>Cargando reporte gráfico...</span>
                    </div>
                  )}

                  {/* Error */}
                  {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                      <p className="text-red-800">{error}</p>
                    </div>
                  )}

                  {/* Gráfico de Recaudación Mensual */}
                  {reporteGraficoData && !isLoading && (
                    <div className="space-y-6">
                      {/* Estadísticas Generales */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 justify-items-center">
                        <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white w-full max-w-xs shadow-lg hover:shadow-xl transition-shadow duration-300">
                          <CardHeader className="pb-2 text-center">
                            <CardTitle className="text-sm font-medium opacity-90">Total Anual</CardTitle>
                          </CardHeader>
                          <CardContent className="text-center">
                            <div className="text-3xl font-bold mb-1">${reporteGraficoData.estadisticas.total_anual.toLocaleString()}</div>
                            <p className="text-xs opacity-75">Recaudación total del año</p>
                          </CardContent>
                        </Card>
                        <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white w-full max-w-xs shadow-lg hover:shadow-xl transition-shadow duration-300">
                          <CardHeader className="pb-2 text-center">
                            <CardTitle className="text-sm font-medium opacity-90">Promedio Mensual</CardTitle>
                          </CardHeader>
                          <CardContent className="text-center">
                            <div className="text-3xl font-bold mb-1">${reporteGraficoData.estadisticas.promedio_mensual.toLocaleString()}</div>
                            <p className="text-xs opacity-75">Promedio por mes</p>
                          </CardContent>
                        </Card>
                        <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white w-full max-w-xs shadow-lg hover:shadow-xl transition-shadow duration-300">
                          <CardHeader className="pb-2 text-center">
                            <CardTitle className="text-sm font-medium opacity-90">Total Pagos</CardTitle>
                          </CardHeader>
                          <CardContent className="text-center">
                            <div className="text-3xl font-bold mb-1">{reporteGraficoData.estadisticas.total_pagos_anual}</div>
                            <p className="text-xs opacity-75">Pagos realizados</p>
                          </CardContent>
                        </Card>
                        <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white w-full max-w-xs shadow-lg hover:shadow-xl transition-shadow duration-300">
                          <CardHeader className="pb-2 text-center">
                            <CardTitle className="text-sm font-medium opacity-90">Año Analizado</CardTitle>
                          </CardHeader>
                          <CardContent className="text-center">
                            <div className="text-3xl font-bold mb-1">{reporteGraficoData.anio}</div>
                            <p className="text-xs opacity-75">Período del reporte</p>
                          </CardContent>
                        </Card>
                      </div>

                      {/* Gráfico Financiero Profesional */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <TrendingUp className="h-5 w-5 text-green-600" />
                            Gráfico Financiero Anual
                          </CardTitle>
                          <p className="text-sm text-gray-600">
                            Análisis profesional de la recaudación mensual durante {reporteGraficoData.anio}
                          </p>
                          <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                              <span className="text-sm text-blue-700 font-medium">
                                Datos completos del año {reporteGraficoData.anio} - Análisis financiero detallado
                              </span>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-6">
                            {/* Selector de tipo de gráfico */}
                            <div className="flex justify-center gap-4">
                              <Button 
                                variant="outline" 
                                className="flex items-center gap-2"
                                onClick={() => setChartType('bar')}
                              >
                                <BarChart3 className="h-4 w-4" />
                                Gráfico de Barras
                              </Button>
                              <Button 
                                variant="outline" 
                                className="flex items-center gap-2"
                                onClick={() => setChartType('line')}
                              >
                                <TrendingUp className="h-4 w-4" />
                                Gráfico de Líneas
                              </Button>
                            </div>

                            {/* Gráfico financiero profesional */}
                            <FinancialChart 
                              data={reporteGraficoData} 
                              chartType={chartType} 
                            />

                            {/* Análisis financiero */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                              <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200">
                                <CardContent className="p-4">
                                  <div className="flex items-center gap-2 mb-2">
                                    <TrendingUp className="h-4 w-4 text-green-600" />
                                    <span className="text-sm font-semibold text-green-800">Tendencia Positiva</span>
                                  </div>
                                  <p className="text-xs text-green-700">
                                    La recaudación muestra una tendencia creciente a lo largo del año
                                  </p>
                                </CardContent>
                              </Card>
                              
                              <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
                                <CardContent className="p-4">
                                  <div className="flex items-center gap-2 mb-2">
                                    <DollarSign className="h-4 w-4 text-blue-600" />
                                    <span className="text-sm font-semibold text-blue-800">Crecimiento Estable</span>
                                  </div>
                                  <p className="text-xs text-blue-700">
                                    Promedio mensual de ${reporteGraficoData.estadisticas.promedio_mensual.toLocaleString()}
                                  </p>
                                </CardContent>
                              </Card>
                              
                              <Card className="bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200">
                                <CardContent className="p-4">
                                  <div className="flex items-center gap-2 mb-2">
                                    <Calendar className="h-4 w-4 text-purple-600" />
                                    <span className="text-sm font-semibold text-purple-800">Período Analizado</span>
                                  </div>
                                  <p className="text-xs text-purple-700">
                                    {reporteGraficoData.estadisticas.total_pagos_anual} pagos en {reporteGraficoData.anio}
                                  </p>
                                </CardContent>
                              </Card>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Tabla de Datos Detallados */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-center">Datos Detallados por Mes</CardTitle>
                          <p className="text-sm text-gray-600 text-center">
                            Información completa de recaudación y pagos por mes
                          </p>
                        </CardHeader>
                        <CardContent>
                          <div className="overflow-x-auto">
                            <Table className="w-full">
                              <TableHeader>
                                <TableRow className="bg-gray-50">
                                  <TableHead className="text-center font-bold">Mes</TableHead>
                                  <TableHead className="text-center font-bold">Recaudación</TableHead>
                                  <TableHead className="text-center font-bold">Total Pagos</TableHead>
                                  <TableHead className="text-center font-bold">Variación</TableHead>
                                  <TableHead className="text-center font-bold">Estado</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {reporteGraficoData.datos_mensuales.map((mes) => {
                                  const variacion = reporteGraficoData.variacion_mensual.find(v => v.mes === mes.mes)
                                                                     return (
                                     <TableRow key={mes.mes} className="hover:bg-gray-50 transition-colors">
                                       <TableCell className="font-medium text-center">{mes.nombre_mes}</TableCell>
                                       <TableCell className="text-center font-semibold">${mes.total_recaudado.toLocaleString()}</TableCell>
                                       <TableCell className="text-center">{mes.total_pagos}</TableCell>
                                       <TableCell className="text-center">
                                         {variacion && (
                                           <span className={`font-bold px-2 py-1 rounded-full text-xs ${
                                             variacion.variacion_porcentual > 0 ? 'bg-green-100 text-green-700' : 
                                             variacion.variacion_porcentual < 0 ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'
                                           }`}>
                                             {variacion.variacion_porcentual > 0 ? '+' : ''}{variacion.variacion_porcentual}%
                                           </span>
                                         )}
                                       </TableCell>
                                       <TableCell className="text-center">
                                         {mes.es_mayor_recaudacion && (
                                           <Badge className="bg-green-100 text-green-800 border-green-300">↑ Mayor</Badge>
                                         )}
                                         {mes.es_menor_recaudacion && (
                                           <Badge className="bg-red-100 text-red-800 border-red-300">↓ Menor</Badge>
                                         )}
                                         {!mes.es_mayor_recaudacion && !mes.es_menor_recaudacion && (
                                           <Badge variant="outline" className="border-gray-300">Normal</Badge>
                                         )}
                                       </TableCell>
                                     </TableRow>
                                   )
                                })}
                              </TableBody>
                            </Table>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Resumen Ejecutivo */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-center">Resumen Ejecutivo</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                              <h4 className="font-semibold text-gray-800">Meses Destacados</h4>
                              <div className="space-y-2">
                                {reporteGraficoData.estadisticas.meses_mayor_recaudacion.length > 0 && (
                                  <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                                    <span className="text-sm">
                                      <strong>Mayor recaudación:</strong> {reporteGraficoData.estadisticas.meses_mayor_recaudacion.map(m => m.nombre_mes).join(', ')}
                                    </span>
                                  </div>
                                )}
                                {reporteGraficoData.estadisticas.meses_menor_recaudacion.length > 0 && (
                                  <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                                    <span className="text-sm">
                                      <strong>Menor recaudación:</strong> {reporteGraficoData.estadisticas.meses_menor_recaudacion.map(m => m.nombre_mes).join(', ')}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="space-y-4">
                              <h4 className="font-semibold text-gray-800">Recomendaciones</h4>
                              <div className="space-y-2 text-sm text-gray-600">
                                <div className="flex items-start gap-2">
                                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                                  <span>Analizar estrategias de los meses con mayor recaudación</span>
                                </div>
                                <div className="flex items-start gap-2">
                                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                                  <span>Implementar campañas especiales en meses de baja recaudación</span>
                                </div>
                                <div className="flex items-start gap-2">
                                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                                  <span>Mantener seguimiento continuo de pagos pendientes</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  )}

                  {/* Estado sin datos */}
                  {!reporteGraficoData && !isLoading && !error && (
                    <div className="text-center py-8">
                      <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-700 mb-2">No hay datos disponibles</h3>
                      <p className="text-gray-500">Selecciona un año para ver el reporte gráfico anual</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab Utilidades Anuales */}
            <TabsContent value="utilidades" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Utilidades Anuales - {anioUtilidades}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {/* Filtro de año para utilidades */}
                  <div className="flex items-center gap-4 mb-6">
                    <div className="flex-1 max-w-xs">
                      <label className="text-sm font-medium">Año para Utilidades</label>
                      <Select value={anioUtilidades.toString()} onValueChange={(value) => setAnioUtilidades(parseInt(value))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar año" />
                        </SelectTrigger>
                        <SelectContent>
                          {generateYears().map((year) => (
                            <SelectItem key={year} value={year.toString()}>
                              {year}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-end">
                      <Button onClick={() => fetchUtilidadesAnuales()} className="flex items-center gap-2">
                        <RefreshCw className="h-4 w-4" /> Actualizar
                      </Button>
                    </div>
                  </div>

                  {/* Tarjetas de Utilidades */}
                  {utilidadesAnuales && (
                    <div className="flex flex-row overflow-x-auto gap-4 pb-4">
                      <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white min-w-[200px] flex-shrink-0">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium opacity-90">Recaudación Anual</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-3xl font-bold">${utilidadesAnuales.recaudacion_anual.toLocaleString()}</div>
                          <p className="text-xs opacity-75 mt-1">{utilidadesAnuales.total_pagos} pagos realizados</p>
                        </CardContent>
                      </Card>
                      <Card className="bg-gradient-to-r from-red-500 to-red-600 text-white min-w-[200px] flex-shrink-0">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium opacity-90">Gastos Anuales</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-3xl font-bold">${utilidadesAnuales.gastos_anuales.toLocaleString()}</div>
                          <p className="text-xs opacity-75 mt-1">{utilidadesAnuales.total_gastos} gastos registrados</p>
                        </CardContent>
                      </Card>
                      <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white min-w-[200px] flex-shrink-0">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium opacity-90">Utilidad Anual</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-3xl font-bold">${utilidadesAnuales.utilidad_anual.toLocaleString()}</div>
                          <p className="text-xs opacity-75 mt-1">{utilidadesAnuales.porcentaje_utilidad.toFixed(1)}% de margen</p>
                        </CardContent>
                      </Card>
                    </div>
                  )}

                  {/* Estado de carga para utilidades */}
                  {!utilidadesAnuales && (
                    <div className="flex items-center justify-center py-8">
                      <RefreshCw className="h-8 w-8 animate-spin mr-2" />
                      <span>Cargando utilidades anuales...</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab Pagos */}
            <TabsContent value="pagos" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    Reporte de Pagos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {/* Filtros de fecha para pagos */}
                  <div className="flex flex-wrap gap-4 mb-4">
                    <div className="flex-1 max-w-xs">
                      <label className="text-sm font-medium">Año</label>
                      <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar año" />
                        </SelectTrigger>
                        <SelectContent>
                          {generateYears().map((year) => (
                            <SelectItem key={year} value={year.toString()}>
                              {year}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex-1 max-w-xs">
                      <label className="text-sm font-medium">Mes</label>
                      <Select value={pagosMes.toString()} onValueChange={(value) => setPagosMes(parseInt(value))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar mes" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">Enero</SelectItem>
                          <SelectItem value="2">Febrero</SelectItem>
                          <SelectItem value="3">Marzo</SelectItem>
                          <SelectItem value="4">Abril</SelectItem>
                          <SelectItem value="5">Mayo</SelectItem>
                          <SelectItem value="6">Junio</SelectItem>
                          <SelectItem value="7">Julio</SelectItem>
                          <SelectItem value="8">Agosto</SelectItem>
                          <SelectItem value="9">Septiembre</SelectItem>
                          <SelectItem value="10">Octubre</SelectItem>
                          <SelectItem value="11">Noviembre</SelectItem>
                          <SelectItem value="12">Diciembre</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-end">
                      <Button onClick={() => fetchPagosData()} className="flex items-center gap-2">
                        <RefreshCw className="h-4 w-4" /> Actualizar
                      </Button>
                    </div>
                  </div>

                  {/* Resumen de Pagos */}
                  {pagosData.length > 0 && (
                    <div className="flex flex-row overflow-x-auto gap-4 pb-4 mb-4">
                      <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white min-w-[200px] flex-shrink-0">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium opacity-90">Total Pagos</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-3xl font-bold">{pagosData.length}</div>
                          <p className="text-xs opacity-75 mt-1">registros en {selectedYear}</p>
                        </CardContent>
                      </Card>
                      <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white min-w-[200px] flex-shrink-0">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium opacity-90">Monto Total</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-3xl font-bold">${pagosData.reduce((sum, pago) => sum + pago.monto, 0).toLocaleString()}</div>
                          <p className="text-xs opacity-75 mt-1">valor total</p>
                        </CardContent>
                      </Card>
                      <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white min-w-[200px] flex-shrink-0">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium opacity-90">Promedio</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-3xl font-bold">${(pagosData.reduce((sum, pago) => sum + pago.monto, 0) / pagosData.length).toFixed(0)}</div>
                          <p className="text-xs opacity-75 mt-1">por pago</p>
                        </CardContent>
                      </Card>
                      <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white min-w-[200px] flex-shrink-0">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium opacity-90">Comprobantes Enviados</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-3xl font-bold">{pagosData.filter(p => p.comprobante_enviado).length}</div>
                          <p className="text-xs opacity-75 mt-1">de {pagosData.length} total</p>
                        </CardContent>
                      </Card>
                    </div>
                  )}

                  {/* Filtros de búsqueda */}
                  <div className="flex flex-wrap gap-4 mb-4">
                    <Input
                      placeholder="Buscar por cliente, cédula, comprobante, concepto..."
                      value={pagosSearch}
                      onChange={e => { setPagosSearch(e.target.value); setPagosPage(1) }}
                      className="max-w-xs"
                    />
                    <Select value={pagosMetodo} onValueChange={v => { setPagosMetodo(v); setPagosPage(1) }}>
                      <SelectTrigger className="w-40"><SelectValue placeholder="Método de pago" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todos">Todos los métodos</SelectItem>
                        <SelectItem value="efectivo">Efectivo</SelectItem>
                        <SelectItem value="transferencia">Transferencia</SelectItem>
                        <SelectItem value="tarjeta">Tarjeta</SelectItem>
                        <SelectItem value="otro">Otro</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={pagosEstado} onValueChange={v => { setPagosEstado(v); setPagosPage(1) }}>
                      <SelectTrigger className="w-40"><SelectValue placeholder="Estado" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todos">Todos los estados</SelectItem>
                        <SelectItem value="completado">Completado</SelectItem>
                        <SelectItem value="pendiente">Pendiente</SelectItem>
                        <SelectItem value="fallido">Fallido</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button onClick={() => {}} disabled={pagosFiltrados.length === 0} className="flex items-center gap-2">
                      <Download className="h-4 w-4" /> Exportar CSV
                    </Button>
                  </div>

                  {/* Estado de carga para pagos */}
                  {pagosData.length === 0 && !isLoading && (
                    <div className="flex items-center justify-center py-8">
                      <RefreshCw className="h-8 w-8 animate-spin mr-2" />
                      <span>Cargando pagos...</span>
                    </div>
                  )}

                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>
                            <input type="checkbox" checked={pagosNoEnviadosPage.length > 0 && pagosNoEnviadosPage.every(p => selectedPagos.includes(p.id))} onChange={toggleAllPagos} />
                          </TableHead>
                          <TableHead>Comprobante</TableHead>
                          <TableHead>Fecha</TableHead>
                          <TableHead>Cliente</TableHead>
                          <TableHead>Cédula</TableHead>
                          <TableHead>Plan</TableHead>
                          <TableHead>Concepto</TableHead>
                          <TableHead>Método</TableHead>
                          <TableHead>Monto</TableHead>
                          <TableHead>Estado</TableHead>
                          <TableHead>Comprobante Enviado</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {pagosPageData.map((p, i) => (
                          <TableRow key={p.id + '-' + i}>
                            <TableCell>
                              <input type="checkbox" checked={selectedPagos.includes(p.id)} onChange={() => togglePago(p.id)} disabled={p.comprobante_enviado} />
                            </TableCell>
                            <TableCell>{p.numero_comprobante}</TableCell>
                            <TableCell>{new Date(p.fecha_pago).toLocaleDateString('es-ES')}</TableCell>
                            <TableCell>{p.cliente_nombre}</TableCell>
                            <TableCell>{p.cliente_cedula}</TableCell>
                            <TableCell>{p.tipo_plan}</TableCell>
                            <TableCell>{p.concepto}</TableCell>
                            <TableCell>{p.metodo_pago}</TableCell>
                            <TableCell>${p.monto.toFixed(2)}</TableCell>
                            <TableCell>{p.estado}</TableCell>
                            <TableCell>{p.comprobante_enviado ? <span className="text-green-600 font-semibold">Enviado</span> : <span className="text-gray-400">Pendiente</span>}</TableCell>
                          </TableRow>
                        ))}
                        {pagosPageData.length === 0 && (
                          <TableRow><TableCell colSpan={11} className="text-center">No hay pagos para mostrar</TableCell></TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                  <Pagination
                    currentPage={pagosPage}
                    totalPages={pagosTotalPages}
                    totalCount={pagosData.length}
                    pageSize={pagosPageSize}
                    onPageChange={setPagosPage}
                    showPageSizeSelector={true}
                    onPageSizeChange={setPagosPageSize}
                  />
                  {canShowEnviarComprobantes && (
                    <Button
                      onClick={enviarComprobantesMasivos}
                      disabled={selectedPagos.filter(id => {
                        const pago = pagosPageData.find(p => p.id === id)
                        return pago && !pago.comprobante_enviado
                      }).length === 0 || isSendingComprobantes}
                      className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-semibold shadow-md mt-4 px-6 py-2 rounded-lg hover:from-blue-700 hover:to-cyan-600 transition-all"
                    >
                      <Mail className="h-4 w-4" />
                      {isSendingComprobantes ? 'Enviando comprobantes...' : 'Enviar comprobantes por email'}
                    </Button>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab Gastos */}
            <TabsContent value="gastos" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingDown className="h-5 w-5" />
                    Reporte de Gastos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {/* Filtros de fecha para gastos */}
                  <div className="flex flex-wrap gap-4 mb-4">
                    <div className="flex-1 max-w-xs">
                      <label className="text-sm font-medium">Año</label>
                      <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar año" />
                        </SelectTrigger>
                        <SelectContent>
                          {generateYears().map((year) => (
                            <SelectItem key={year} value={year.toString()}>
                              {year}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex-1 max-w-xs">
                      <label className="text-sm font-medium">Mes</label>
                      <Select value={gastosMes.toString()} onValueChange={(value) => setGastosMes(parseInt(value))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar mes" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">Enero</SelectItem>
                          <SelectItem value="2">Febrero</SelectItem>
                          <SelectItem value="3">Marzo</SelectItem>
                          <SelectItem value="4">Abril</SelectItem>
                          <SelectItem value="5">Mayo</SelectItem>
                          <SelectItem value="6">Junio</SelectItem>
                          <SelectItem value="7">Julio</SelectItem>
                          <SelectItem value="8">Agosto</SelectItem>
                          <SelectItem value="9">Septiembre</SelectItem>
                          <SelectItem value="10">Octubre</SelectItem>
                          <SelectItem value="11">Noviembre</SelectItem>
                          <SelectItem value="12">Diciembre</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-end">
                      <Button onClick={() => fetchGastosData()} className="flex items-center gap-2">
                        <RefreshCw className="h-4 w-4" /> Actualizar
                      </Button>
                    </div>
                  </div>

                  {/* Resumen de Gastos */}
                  {gastosData.length > 0 && (
                    <div className="flex flex-row overflow-x-auto gap-4 pb-4 mb-4">
                      <Card className="bg-gradient-to-r from-red-500 to-red-600 text-white min-w-[200px] flex-shrink-0">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium opacity-90">Total Gastos</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-3xl font-bold">{gastosData.length}</div>
                          <p className="text-xs opacity-75 mt-1">registros en {selectedYear}</p>
                        </CardContent>
                      </Card>
                      <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white min-w-[200px] flex-shrink-0">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium opacity-90">Monto Total</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-3xl font-bold">${gastosData.reduce((sum, gasto) => sum + gasto.monto, 0).toLocaleString()}</div>
                          <p className="text-xs opacity-75 mt-1">valor total</p>
                        </CardContent>
                      </Card>
                      <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white min-w-[200px] flex-shrink-0">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium opacity-90">Promedio</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-3xl font-bold">${(gastosData.reduce((sum, gasto) => sum + gasto.monto, 0) / gastosData.length).toFixed(0)}</div>
                          <p className="text-xs opacity-75 mt-1">por gasto</p>
                        </CardContent>
                      </Card>
                    </div>
                  )}

                  {/* Filtros de búsqueda */}
                  <div className="flex flex-wrap gap-4 mb-4">
                    <Input
                      placeholder="Buscar por descripción, proveedor, categoría..."
                      value={gastosSearch}
                      onChange={e => { setGastosSearch(e.target.value); setGastosPage(1) }}
                      className="max-w-xs"
                    />
                    <Select value={gastosCategoria} onValueChange={v => { setGastosCategoria(v); setGastosPage(1) }}>
                      <SelectTrigger className="w-40"><SelectValue placeholder="Categoría" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todos">Todas las categorías</SelectItem>
                        <SelectItem value="Transporte">Transporte</SelectItem>
                        <SelectItem value="Proveedores">Proveedores</SelectItem>
                        <SelectItem value="Servicios">Servicios</SelectItem>
                        <SelectItem value="Otros">Otros</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button onClick={() => {}} disabled={gastosData.length === 0} className="flex items-center gap-2">
                      <Download className="h-4 w-4" /> Exportar CSV
                    </Button>
                  </div>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>ID</TableHead>
                          <TableHead>Fecha</TableHead>
                          <TableHead>Descripción</TableHead>
                          <TableHead>Categoría</TableHead>
                          <TableHead>Proveedor</TableHead>
                          <TableHead>Método de Pago</TableHead>
                          <TableHead>Monto</TableHead>
                          <TableHead>Usuario</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {gastosData
                          .filter(gasto => {
                            const matchesSearch = !gastosSearch || 
                              gasto.descripcion.toLowerCase().includes(gastosSearch.toLowerCase()) ||
                              gasto.proveedor.toLowerCase().includes(gastosSearch.toLowerCase()) ||
                              gasto.categoria.toLowerCase().includes(gastosSearch.toLowerCase())
                            
                            const matchesCategoria = gastosCategoria === "todos" || gasto.categoria === gastosCategoria
                            
                            return matchesSearch && matchesCategoria
                          })
                          .slice((gastosPage - 1) * gastosPageSize, gastosPage * gastosPageSize)
                          .map((gasto) => (
                            <TableRow key={gasto.id}>
                              <TableCell>{gasto.id}</TableCell>
                              <TableCell>{new Date(gasto.fecha_gasto).toLocaleDateString('es-ES')}</TableCell>
                              <TableCell>{gasto.descripcion}</TableCell>
                              <TableCell>{gasto.categoria}</TableCell>
                              <TableCell>{gasto.proveedor}</TableCell>
                              <TableCell>{gasto.metodo_pago}</TableCell>
                              <TableCell>${gasto.monto.toFixed(2)}</TableCell>
                              <TableCell>{gasto.usuario_nombre}</TableCell>
                            </TableRow>
                          ))}
                        {gastosData.length === 0 && (
                          <TableRow><TableCell colSpan={8} className="text-center">No hay gastos para mostrar</TableCell></TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                  <Pagination
                    currentPage={gastosPage}
                    totalPages={Math.ceil(gastosData.length / gastosPageSize)}
                    totalCount={gastosData.length}
                    pageSize={gastosPageSize}
                    onPageChange={setGastosPage}
                    showPageSizeSelector={true}
                    onPageSizeChange={setGastosPageSize}
                  />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}







