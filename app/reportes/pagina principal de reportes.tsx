"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts"
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Users,
  DollarSign,
  Download,
  RefreshCw,
  Calendar,
  Filter,
} from "lucide-react"

interface ReporteData {
  reporteFinanciero: {
    ingresos: number;
    gastos: number;
    utilidad: number;
    crecimiento: number;
  };
  reporteClientes: {
    total: number;
    activos: number;
    nuevos: number;
    bajas: number;
  };
}

export default function ReportesPage() {
  // ----- lóg. año-base para salto en diciembre -----
  const now = new Date()
  const currentYear = now.getFullYear()
  // si es diciembre (mes 11), usamos año siguiente como base
  const baseYear = now.getMonth() === 11 ? currentYear + 1 : currentYear

  // Estados para filtros
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1)
  const [selectedYear, setSelectedYear]   = useState(baseYear)
  const [reportType, setReportType]       = useState("general")
  
  // Estados para datos y carga
  const [reporteData, setReporteData] = useState<ReporteData>({
    reporteFinanciero: { ingresos: 0, gastos: 0, utilidad: 0, crecimiento: 0 },
    reporteClientes:  { activos: 0, total: 0, nuevos: 0, bajas: 0 }
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError]         = useState<string | null>(null)
  
  const router = useRouter()

  // Opciones para los selectores
  const months = [
    { value: 1, label: "Enero" },
    { value: 2, label: "Febrero" },
    { value: 3, label: "Marzo" },
    { value: 4, label: "Abril" },
    { value: 5, label: "Mayo" },
    { value: 6, label: "Junio" },
    { value: 7, label: "Julio" },
    { value: 8, label: "Agosto" },
    { value: 9, label: "Septiembre" },
    { value: 10, label: "Octubre" },
    { value: 11, label: "Noviembre" },
    { value: 12, label: "Diciembre" },
  ]

  const reportTypes = [
    { value: "general", label: "Reporte General" },
    { value: "clientes", label: "Clientes" },
    { value: "pagos", label: "Pagos y Recaudación" },
    { value: "gastos", label: "Gastos" },
  ]

  // Generador de años basado en baseYear
  const generateYears = () => {
    const years: number[] = []
    for (let y = baseYear - 5; y <= baseYear + 1; y++) {
      years.push(y)
    }
    return years
  }

  // Obtener nombre del mes seleccionado
  const getMonthName = () => {
    return months.find(m => m.value === selectedMonth)?.label || ""
  }

  // Fetch datos cuando cambien los filtros
  useEffect(() => {
    fetchReportData()
  }, [selectedMonth, selectedYear, reportType])

  const fetchReportData = async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      const monthStr = selectedMonth.toString().padStart(2, '0')
      const response = await fetch(
        `/api/reportes?month=${monthStr}&year=${selectedYear}&type=${reportType}`
      )
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`)
      }
      
      const data = await response.json()
      if ("message" in data) {
        // No hay datos para este período
        setReporteData({
          reporteFinanciero: { ingresos: 0, gastos: 0, utilidad: 0, crecimiento: 0 },
          reporteClientes:  { activos: 0, total: 0, nuevos: 0, bajas: 0 }
        })
      } else {
        setReporteData(data)
      }
    } catch (err) {
      console.error("Error fetching report data:", err)
      setError(err instanceof Error ? err.message : "Error desconocido")
      setReporteData({
        reporteFinanciero: { ingresos: 0, gastos: 0, utilidad: 0, crecimiento: 0 },
        reporteClientes:  { activos: 0, total: 0, nuevos: 0, bajas: 0 }
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Preparar datos para gráficos
  const datosFinancieros = [
    { name: "Ingresos", monto: reporteData.reporteFinanciero.ingresos },
    { name: "Gastos",   monto: reporteData.reporteFinanciero.gastos },
    { name: "Utilidad", monto: reporteData.reporteFinanciero.utilidad },
  ]
  const datosClientes = [
    { name: "Activos", cantidad: reporteData.reporteClientes.activos },
    { name: "Nuevos",  cantidad: reporteData.reporteClientes.nuevos },
    { name: "Bajas",   cantidad: reporteData.reporteClientes.bajas },
  ]
  const hasDatos = datosFinancieros.some(d => d.monto > 0) || datosClientes.some(d => d.cantidad > 0)

  // Exportar CSV
  const exportarReporte = () => {
    // ...igual que antes...
  }

  // Resetear filtros a valores base
  const resetFilters = () => {
    setSelectedMonth(now.getMonth() + 1)
    setSelectedYear(baseYear)
    setReportType("general")
  }

  useEffect(() => {
  // Obtener los datos del gráfico
  const fetchReporteFinanciero = async () => {
    try {
      const response = await fetch('/api/reportes/financieros')  // Cambiar a la ruta adecuada para obtener los datos
      const data = await response.json()

      // Actualizar los datos del reporte financiero y de clientes
      setReporteData((prevData) => ({
        ...prevData,
        reporteFinanciero: {
          ingresos: data.ingresos,
          gastos: data.gastos,
          utilidad: data.utilidad,
          crecimiento: data.crecimiento,
        },
        reporteClientes: {
          activos: data.activos,
          total: data.totalClientes,
          nuevos: data.nuevosClientes,
          bajas: data.bajasClientes,
        }
      }))
    } catch (error) {
      console.error("Error al cargar datos del reporte financiero:", error)
    }
  }

  fetchReporteFinanciero()
}, [])



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
                <h1 className="text-3xl font-bold text-slate-900">Reportes y Análisis</h1>
                <p className="text-slate-600">Dashboard ejecutivo y reportes detallados</p>
              </div>
            </div>
            
            <div className="flex gap-3">
              <Button variant="outline" onClick={fetchReportData} disabled={isLoading}>
                {isLoading ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                Actualizar
              </Button>
              <Button onClick={exportarReporte} disabled={!hasDatos}>
                <Download className="h-4 w-4 mr-2" />
                Exportar
              </Button>
            </div>
          </div>
          aui estos deben quedarse estaticos 
          {/* Reporte Total de Pagos, Gastos y Utilidad */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {/* Ingresos Totales */}
              <Card className="bg-gradient-to-r from-gray-300 to-gray-500 text-black">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium opacity-90 flex items-center">
                    <TrendingUp className="h-4 w-4 mr-2" />
                    Ingresos Totales
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">${reporteData.reporteFinanciero.ingresos.toLocaleString()}</div>
                  <p className="text-xs opacity-80">
                    <span className="text-gray-700">↗ +{reporteData.reporteFinanciero.crecimiento}%</span> vs mes anterior
                  </p>
                </CardContent>
              </Card>

              {/* Gastos Totales */}
              <Card className="bg-gradient-to-r from-zinc-400 to-zinc-600 text-white">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium opacity-90 flex items-center">
                    <TrendingDown className="h-4 w-4 mr-2" />
                    Gastos Totales
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">${reporteData.reporteFinanciero.gastos.toLocaleString()}</div>
                  <p className="text-xs opacity-90">
                    {((reporteData.reporteFinanciero.gastos / reporteData.reporteFinanciero.ingresos) * 100).toFixed(1)}% de los ingresos
                  </p>
                </CardContent>
              </Card>

              {/* Utilidad Neta */}
              <Card className="bg-gradient-to-r from-slate-400 to-slate-600 text-white">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium opacity-90 flex items-center">
                    <DollarSign className="h-4 w-4 mr-2" />
                    Utilidad Neta
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">${reporteData.reporteFinanciero.utilidad.toLocaleString()}</div>
                  <p className="text-xs opacity-90">
                    {((reporteData.reporteFinanciero.utilidad / reporteData.reporteFinanciero.ingresos) * 100).toFixed(1)}% margen
                  </p>
                </CardContent>
              </Card>

              {/* Clientes Activos */}
              <Card className="bg-gradient-to-r from-neutral-400 to-neutral-600 text-white">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium opacity-90 flex items-center">
                    <Users className="h-4 w-4 mr-2" />
                    Clientes Activos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{reporteData.reporteClientes.activos.toLocaleString()}</div>
                  <p className="text-xs opacity-90">
                    {((reporteData.reporteClientes.activos / reporteData.reporteClientes.total) * 100).toFixed(1)}% del total
                  </p>
                </CardContent>
              </Card>
            </div>

              





          {/* Panel de Filtros Mejorado */}
          <Card className="mb-6">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Filter className="h-5 w-5 text-blue-600" />
                Filtros de Reportes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Selector de Mes */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Mes</label>
                  <Select value={selectedMonth.toString()} onValueChange={(value) => setSelectedMonth(parseInt(value))}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Seleccionar mes" />
                    </SelectTrigger>
                    <SelectContent>
                      {months.map((month) => (
                        <SelectItem key={month.value} value={month.value.toString()}>
                          {month.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Selector de Año */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Año</label>
                  <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
                    <SelectTrigger className="w-full">
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

                {/* Tipo de Reporte */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Tipo de Reporte</label>
                  <Select value={reportType} onValueChange={setReportType}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Tipo de reporte" />
                    </SelectTrigger>
                    <SelectContent>
                      {reportTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Botones de Acción */}
                
              </div>

              {/* Filtros Activos */}
              <div className="flex flex-wrap gap-2 pt-2 border-t">
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {getMonthName()} {selectedYear}
                </Badge>
                <Badge variant="outline">
                  {reportTypes.find(t => t.value === reportType)?.label}
                </Badge>
                {error && (
                  <Badge variant="destructive">
                    Error en datos
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Indicador del período */}
          <div className="mb-6 px-4">
            <p className="text-lg text-slate-700">
              Reporte correspondiente a: <strong>{getMonthName()} {selectedYear}</strong>
              {isLoading && <span className="ml-2 text-blue-600">Cargando...</span>}
            </p>
          </div>

          {/* Mensaje de Error */}
          {error && (
            <Card className="mb-6 border-red-200 bg-red-50">
              <CardContent className="pt-6">
                <p className="text-red-600">Error: {error}</p>
              </CardContent>
            </Card>
          )}
        aqui estos fraficos deben cambiar segun el filtrado 
          {/* KPI Cards Mejoradas */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white hover:shadow-lg transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium opacity-90 flex items-center">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Ingresos Totales
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  ${reporteData.reporteFinanciero.ingresos.toLocaleString()}
                </div>
                <p className="text-xs opacity-75 mt-1">
                  {reporteData.reporteFinanciero.crecimiento > 0 ? '+' : ''}{reporteData.reporteFinanciero.crecimiento.toFixed(1)}% vs mes anterior
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-red-500 to-red-600 text-white hover:shadow-lg transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium opacity-90 flex items-center">
                  <TrendingDown className="h-4 w-4 mr-2" />
                  Gastos Totales
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  ${reporteData.reporteFinanciero.gastos.toLocaleString()}
                </div>
                <p className="text-xs opacity-75 mt-1">
                  {((reporteData.reporteFinanciero.gastos / reporteData.reporteFinanciero.ingresos) * 100).toFixed(1)}% de ingresos
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:shadow-lg transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium opacity-90 flex items-center">
                  <DollarSign className="h-4 w-4 mr-2" />
                  Utilidad Neta
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  ${reporteData.reporteFinanciero.utilidad.toLocaleString()}
                </div>
                <p className="text-xs opacity-75 mt-1">
                  Margen: {reporteData.reporteFinanciero.ingresos > 0 ? ((reporteData.reporteFinanciero.utilidad / reporteData.reporteFinanciero.ingresos) * 100).toFixed(1) : 0}%
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white hover:shadow-lg transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium opacity-90 flex items-center">
                  <Users className="h-4 w-4 mr-2" />
                  Clientes Activos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {reporteData.reporteClientes.activos.toLocaleString()}
                </div>
                <p className="text-xs opacity-75 mt-1">
                  {reporteData.reporteClientes.nuevos} nuevos este mes
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Gráficos Mejorados */}
          {isLoading ? (
            <div className="text-center py-12">
              <RefreshCw className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
              <p className="text-gray-500">Cargando datos del reporte...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* Gráfico Financiero */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                    Resumen Financiero
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {hasDatos ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={datosFinancieros}>
                        <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                        <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                        <YAxis tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} tick={{ fontSize: 12 }} />
                        <Tooltip formatter={(value: number) => [`$${value.toLocaleString()}`, '']} />
                        <Bar dataKey="monto" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-64 flex items-center justify-center text-gray-500">
                      No hay datos financieros para mostrar
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Gráfico de Clientes */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-purple-600" />
                    Estadísticas de Clientes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {reporteData.reporteClientes.total > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={datosClientes}>
                        <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                        <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                        <YAxis tick={{ fontSize: 12 }} />
                        <Tooltip formatter={(value: number) => [value.toLocaleString(), 'Clientes']} />
                        <Bar dataKey="cantidad" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-64 flex items-center justify-center text-gray-500">
                      No hay datos de clientes para mostrar
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Mensaje cuando no hay datos */}
          {!isLoading && !hasDatos && (
            <Card className="text-center py-12">
              <CardContent>
                <div className="text-gray-500">
                  <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-medium mb-2">No hay datos disponibles</h3>
                  <p>No se encontraron datos para {getMonthName()} {selectedYear}</p>
                  <p className="text-sm mt-2">Intenta seleccionar un período diferente</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}








"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts"
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Users,
  DollarSign,
  Download,
  RefreshCw,
  Filter,
} from "lucide-react"

interface ReporteData {
  reporteFinanciero: {
    ingresos: number;
    gastos: number;
    utilidad: number;
    crecimiento: number;
  };
  reporteClientes: {
    total: number;
    activos: number;
    nuevos: number;
    bajas: number;
  };
}

export default function ReportesPage() {
  // ----- lóg. año-base para salto en diciembre -----
  const now = new Date()
  const currentYear = now.getFullYear()
  const baseYear = now.getMonth() === 11 ? currentYear + 1 : currentYear

  // Estados para filtros
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState(baseYear)
  const [reportType, setReportType] = useState("general")
  
  // **KPIs estáticos** (no deben cambiar con los filtros)
  const staticData = {
    ingresos: 155, // Estático
    gastos: 281,   // Estático
    utilidad: -126, // Estático
    clientesActivos: 200, // Estático
  }

  // Datos que cambiarán con los filtros (solo para los gráficos)
  const [reporteData, setReporteData] = useState<ReporteData>({
    reporteFinanciero: { ingresos: 0, gastos: 0, utilidad: 0, crecimiento: 0 },
    reporteClientes:  { activos: 0, total: 0, nuevos: 0, bajas: 0 }
  })

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const router = useRouter()

  // Opciones para los selectores
  const months = [
    { value: 1, label: "Enero" },
    { value: 2, label: "Febrero" },
    { value: 3, label: "Marzo" },
    { value: 4, label: "Abril" },
    { value: 5, label: "Mayo" },
    { value: 6, label: "Junio" },
    { value: 7, label: "Julio" },
    { value: 8, label: "Agosto" },
    { value: 9, label: "Septiembre" },
    { value: 10, label: "Octubre" },
    { value: 11, label: "Noviembre" },
    { value: 12, label: "Diciembre" },
  ]

  const reportTypes = [
    { value: "general", label: "Reporte General" },
    { value: "clientes", label: "Clientes" },
    { value: "pagos", label: "Pagos y Recaudación" },
    { value: "gastos", label: "Gastos" },
  ]

  // Generador de años basado en baseYear
  const generateYears = () => {
    const years: number[] = []
    for (let y = baseYear - 5; y <= baseYear + 1; y++) {
      years.push(y)
    }
    return years
  }

  // Obtener nombre del mes seleccionado
  const getMonthName = () => {
    return months.find(m => m.value === selectedMonth)?.label || ""
  }

  // Fetch datos cuando cambian los filtros
  useEffect(() => {
    fetchReportData()
  }, [selectedMonth, selectedYear, reportType])

  const fetchReportData = async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      const monthStr = selectedMonth.toString().padStart(2, '0')
      const response = await fetch(
        `/api/reportes?month=${monthStr}&year=${selectedYear}&type=${reportType}`
      )
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`)
      }
      
      const data = await response.json()
      if ("message" in data) {
        // No hay datos para este período
        setReporteData({
          reporteFinanciero: { ingresos: 0, gastos: 0, utilidad: 0, crecimiento: 0 },
          reporteClientes:  { activos: 0, total: 0, nuevos: 0, bajas: 0 }
        })
      } else {
        setReporteData(data)
      }
    } catch (err) {
      console.error("Error fetching report data:", err)
      setError(err instanceof Error ? err.message : "Error desconocido")
      setReporteData({
        reporteFinanciero: { ingresos: 0, gastos: 0, utilidad: 0, crecimiento: 0 },
        reporteClientes:  { activos: 0, total: 0, nuevos: 0, bajas: 0 }
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Preparar datos para gráficos
  const datosFinancieros = [
    { name: "Ingresos", monto: reporteData.reporteFinanciero.ingresos },
    { name: "Gastos",   monto: reporteData.reporteFinanciero.gastos },
    { name: "Utilidad", monto: reporteData.reporteFinanciero.utilidad },
  ]
  const datosClientes = [
    { name: "Activos", cantidad: reporteData.reporteClientes.activos },
    { name: "Nuevos",  cantidad: reporteData.reporteClientes.nuevos },
    { name: "Bajas",   cantidad: reporteData.reporteClientes.bajas },
  ]
  const hasDatos = datosFinancieros.some(d => d.monto > 0) || datosClientes.some(d => d.cantidad > 0)

  // Exportar CSV
  const exportarReporte = () => {
    // ...igual que antes...
  }

  // Resetear filtros a valores base
  const resetFilters = () => {
    setSelectedMonth(now.getMonth() + 1)
    setSelectedYear(baseYear)
    setReportType("general")
  }

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
                <h1 className="text-3xl font-bold text-slate-900">Reportes y Análisis</h1>
                <p className="text-slate-600">Dashboard ejecutivo y reportes detallados</p>
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={fetchReportData} disabled={isLoading}>
                {isLoading ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                Actualizar
              </Button>
              <Button onClick={exportarReporte} disabled={!hasDatos}>
                <Download className="h-4 w-4 mr-2" />
                Exportar
              </Button>
            </div>
          </div>

          {/* Reporte Total de Pagos, Gastos y Utilidad (Fijos) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium opacity-90 flex items-center">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Ingresos Totales
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">${staticData.ingresos.toLocaleString()}</div>
                <p className="text-xs opacity-90">
                  <span className="text-green-200">↗ +{reporteData.reporteFinanciero.crecimiento}%</span> vs mes anterior
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-red-500 to-red-600 text-white">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium opacity-90 flex items-center">
                  <TrendingDown className="h-4 w-4 mr-2" />
                  Gastos Totales
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">${staticData.gastos.toLocaleString()}</div>
                <p className="text-xs opacity-90">
                  {((staticData.gastos / staticData.ingresos) * 100).toFixed(1)}% de los ingresos
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium opacity-90 flex items-center">
                  <DollarSign className="h-4 w-4 mr-2" />
                  Utilidad Neta
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">${staticData.utilidad.toLocaleString()}</div>
                <p className="text-xs opacity-90">
                  {((staticData.utilidad / staticData.ingresos) * 100).toFixed(1)}% margen
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium opacity-90 flex items-center">
                  <Users className="h-4 w-4 mr-2" />
                  Clientes Activos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{staticData.clientesActivos.toLocaleString()}</div>
                <p className="text-xs opacity-90">
                  {((staticData.clientesActivos / 500) * 100).toFixed(1)}% del total
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Panel de Filtros (y datos dinámicos) */}
          <Card className="mb-6">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Filter className="h-5 w-5 text-blue-600" />
                Filtros de Reportes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Selector de Mes */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Mes</label>
                  <Select value={selectedMonth.toString()} onValueChange={(value) => setSelectedMonth(parseInt(value))}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Seleccionar mes" />
                    </SelectTrigger>
                    <SelectContent>
                      {months.map((month) => (
                        <SelectItem key={month.value} value={month.value.toString()}>
                          {month.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Selector de Año */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Año</label>
                  <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
                    <SelectTrigger className="w-full">
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

                {/* Tipo de Reporte */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Tipo de Reporte</label>
                  <Select value={reportType} onValueChange={setReportType}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Tipo de reporte" />
                    </SelectTrigger>
                    <SelectContent>
                      {reportTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Gráficos Mejorados */}
          {isLoading ? (
            <div className="text-center py-12">
              <RefreshCw className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
              <p className="text-gray-500">Cargando datos del reporte...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* Gráfico Financiero */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                    Resumen Financiero
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {hasDatos ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={datosFinancieros}>
                        <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                        <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                        <YAxis tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} tick={{ fontSize: 12 }} />
                        <Tooltip formatter={(value: number) => [`$${value.toLocaleString()}`, '']} />
                        <Bar dataKey="monto" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-64 flex items-center justify-center text-gray-500">
                      No hay datos financieros para mostrar
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Gráfico de Clientes */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-purple-600" />
                    Estadísticas de Clientes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {reporteData.reporteClientes.total > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={datosClientes}>
                        <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                        <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                        <YAxis tick={{ fontSize: 12 }} />
                        <Tooltip formatter={(value: number) => [value.toLocaleString(), 'Clientes']} />
                        <Bar dataKey="cantidad" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-64 flex items-center justify-center text-gray-500">
                      No hay datos de clientes para mostrar
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}




 <div className="space-y-4 mb-8">
              {/* Ingresos Totales */}
              <div className="flex items-center justify-between bg-gray-100 p-4 rounded-xl shadow-sm">
                <div className="flex items-center gap-2 text-gray-800 font-medium">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  Ingresos Totales:
                </div>
                <div className="text-2xl font-semibold text-right text-black">
                  ${datosEstadisticos.reporteFinanciero.ingresos.toLocaleString()}
                  <p className="text-sm text-gray-600">
                    ↗ +{datosEstadisticos.reporteFinanciero.crecimiento}% vs mes anterior
                  </p>
                </div>
              </div>

              {/* Gastos Totales */}
              <div className="flex items-center justify-between bg-zinc-200 p-4 rounded-xl shadow-sm">
                <div className="flex items-center gap-2 text-zinc-800 font-medium">
                  <TrendingDown className="h-5 w-5 text-red-600" />
                  Gastos Totales:
                </div>
                <div className="text-2xl font-semibold text-right text-black">
                  ${datosEstadisticos.reporteFinanciero.gastos.toLocaleString()}
                  <p className="text-sm text-zinc-700">
                    {datosEstadisticos.reporteFinanciero.ingresos > 0 
                      ? ((datosEstadisticos.reporteFinanciero.gastos / datosEstadisticos.reporteFinanciero.ingresos) * 100).toFixed(1)
                      : 0
                    }% de los ingresos
                  </p>
                </div>
              </div>

              {/* Utilidad Neta */}
              <div className="flex items-center justify-between bg-slate-200 p-4 rounded-xl shadow-sm">
                <div className="flex items-center gap-2 text-slate-800 font-medium">
                  <DollarSign className="h-5 w-5 text-blue-600" />
                  Utilidad Neta:
                </div>
                <div className="text-2xl font-semibold text-right text-black">
                  ${datosEstadisticos.reporteFinanciero.utilidad.toLocaleString()}
                  <p className="text-sm text-slate-700">
                    {datosEstadisticos.reporteFinanciero.ingresos > 0 
                      ? ((datosEstadisticos.reporteFinanciero.utilidad / datosEstadisticos.reporteFinanciero.ingresos) * 100).toFixed(1)
                      : 0
                    }% margen
                  </p>
                </div>
              </div>

              {/* Clientes Activos */}
              <div className="flex items-center justify-between bg-neutral-200 p-4 rounded-xl shadow-sm">
                <div className="flex items-center gap-2 text-neutral-800 font-medium">
                  <Users className="h-5 w-5 text-purple-600" />
                  Clientes Activos:
                </div>
                <div className="text-2xl font-semibold text-right text-black">
                  {datosEstadisticos.reporteClientes.activos.toLocaleString()}
                  <p className="text-sm text-neutral-700">
                    {datosEstadisticos.reporteClientes.total > 0
                      ? ((datosEstadisticos.reporteClientes.activos / datosEstadisticos.reporteClientes.total) * 100).toFixed(1)
                      : 0
                    }% del total
                  </p>
                </div>
              </div>
            </div>
            