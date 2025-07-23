"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Label,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
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
  BarChart3,
  PieChart as PieChartIcon,
  FileText,
  Settings,
  Mail,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table"
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination"
import { ClienteModel } from '@/lib/models/Cliente'

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
  period?: {
    month: number;
    year: number;
    type?: string;
  };
}

interface ClienteData {
  id: number;
  cedula: string;
  nombres: string;
  apellidos: string;
  tipo_plan: string;
  precio_plan: number;
  sector: string;
  estado: string;
  fecha_registro: string;
  // Añadido para reporte anual:
  pagos_por_mes?: Record<number, { total: number; cantidad: number } | null>;
  total_pagos_anio?: number;
  // Añadido para reporte mensual:
  monto_pagado_mes?: number;
  cantidad_pagos_mes?: number;
  fechas_pago_mes?: string[];
}

interface ClienteDetalladoData {
  id: number;
  cedula: string;
  nombres: string;
  apellidos: string;
  tipo_plan: string;
  precio_plan: number;
  sector: string;
  estado: string;
  fecha_registro: string;
  pagos_por_mes: Record<number, { total: number; cantidad: number }>;
  total_pagado_anio: number;
  total_pagos_anio: number;
}

interface ReporteDetalladoData {
  clientes: ClienteDetalladoData[];
  anio: number;
  total_clientes: number;
  resumen: {
    total_recaudado_anio: number;
    total_pagos_anio: number;
    clientes_con_pagos: number;
    clientes_sin_pagos: number;
  };
}

// --- Tipos para pagos y gastos ---
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
  proveedor?: string;
  metodo_pago?: string;
  usuario_nombre?: string;
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
  const [activeTab, setActiveTab] = useState("dashboard")
  
  // Estados para datos y carga
  const [reporteData, setReporteData] = useState<ReporteData>({
    reporteFinanciero: { ingresos: 0, gastos: 0, utilidad: 0, crecimiento: 0 },
    reporteClientes: { activos: 0, total: 0, nuevos: 0, bajas: 0 }
  })
  const [clientesData, setClientesData] = useState<ClienteData[]>([])
  const [reporteDetalladoData, setReporteDetalladoData] = useState<ReporteDetalladoData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Estados para pagos y gastos
  const [pagosData, setPagosData] = useState<PagoData[]>([])
  const [gastosData, setGastosData] = useState<GastoData[]>([])
  const [pagosSearch, setPagosSearch] = useState("")
  const [pagosMetodo, setPagosMetodo] = useState("todos")
  const [pagosEstado, setPagosEstado] = useState("todos")
  const [pagosPage, setPagosPage] = useState(1)
  const [gastosSearch, setGastosSearch] = useState("")
  const [gastosCategoria, setGastosCategoria] = useState("todas")
  const [gastosPage, setGastosPage] = useState(1)
  const [categoriasGasto, setCategoriasGasto] = useState<string[]>([])

  // 1. Estado para selección múltiple de pagos
  const [selectedPagos, setSelectedPagos] = useState<number[]>([])
  const [isSendingComprobantes, setIsSendingComprobantes] = useState(false)

  // --- Corrección y unificación de lógica de filtros y fetch ---
  // Estados para el tipo de reporte de clientes
  const [clientesReportType, setClientesReportType] = useState('general')

  // Actualizar automáticamente el reporte de clientes al cambiar año o tipo
  useEffect(() => {
    if (activeTab === 'clientes') {
      fetchClientesReport(clientesReportType)
    }
  }, [selectedYear, clientesReportType, activeTab])

  // Botones de reporte de clientes
  const handleClientesReport = (type: string) => {
    setClientesReportType(type)
  }

  // --- Dashboard y financiero: actualizan con filtros globales ---
  useEffect(() => {
    if (activeTab === 'dashboard' || activeTab === 'dashboard-financiero') {
      fetchReportData()
    }
  }, [selectedMonth, selectedYear, reportType, activeTab])

  // --- Pagos y gastos: actualizan con filtros globales ---
  useEffect(() => {
    if (activeTab === 'pagos') {
      fetchPagosData()
    }
  }, [activeTab, selectedMonth, selectedYear, pagosSearch, pagosMetodo, pagosEstado])

  useEffect(() => {
    if (activeTab === 'gastos') {
      fetchGastosData()
      fetchCategoriasGasto()
    }
  }, [activeTab, selectedMonth, selectedYear, gastosSearch, gastosCategoria])

  const pagosPerPage = 10
  const gastosPerPage = 10
  
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
      console.log('Datos recibidos de la API:', data) // Debug temporal
      if ("message" in data) {
        setReporteData({
          reporteFinanciero: { ingresos: 0, gastos: 0, utilidad: 0, crecimiento: 0 },
          reporteClientes: { activos: 0, total: 0, nuevos: 0, bajas: 0 }
        })
      } else {
        // Asegurar que los datos tengan la estructura correcta
        const reporteData = {
          reporteFinanciero: {
            ingresos: data.reporteFinanciero?.ingresos || 0,
            gastos: data.reporteFinanciero?.gastos || 0,
            utilidad: data.reporteFinanciero?.utilidad || 0,
            crecimiento: data.reporteFinanciero?.crecimiento || 0
          },
          reporteClientes: {
            total: data.reporteClientes?.total || 0,
            activos: data.reporteClientes?.activos || 0,
            nuevos: data.reporteClientes?.nuevos || 0,
            bajas: data.reporteClientes?.bajas || 0
          },
          period: data.period
        }
        console.log('Datos procesados:', reporteData) // Debug temporal
        setReporteData(reporteData)
      }
    } catch (err) {
      console.error("Error fetching report data:", err)
      setError(err instanceof Error ? err.message : "Error desconocido")
      setReporteData({
        reporteFinanciero: { ingresos: 0, gastos: 0, utilidad: 0, crecimiento: 0 },
        reporteClientes: { activos: 0, total: 0, nuevos: 0, bajas: 0 }
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Cargar reporte de clientes
  const fetchClientesReport = async (action: string, params?: any) => {
    setIsLoading(true)
    setError(null)
    
    try {
      const url = new URL('/api/reportes/clientes', window.location.origin)
      url.searchParams.set('action', action)
      
      // Solo usar el filtro de año
      const year = params?.year || selectedYear
      url.searchParams.set('year', year.toString())
      
      // Para reportes mensuales, usar el mes actual
      if (action === 'mensual') {
        const month = params?.month || selectedMonth
        url.searchParams.set('month', month.toString())
      }
      
      const response = await fetch(url.toString())
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`)
      }
      
      const data = await response.json()
      if (data.success && data.data) {
        if (action === 'detallado') {
          setReporteDetalladoData({
            clientes: data.data,
            resumen: data.resumen,
            anio: data.anio,
            total_clientes: data.data.length
          });
          setClientesData([]);
        } else {
          setClientesData(Array.isArray(data.data) ? data.data : []);
          setReporteDetalladoData(null);
        }
        return data;
      } else {
        throw new Error(data.error || 'Error al cargar reporte');
      }
    } catch (err) {
      console.error("Error fetching clientes report:", err)
      setError(err instanceof Error ? err.message : "Error desconocido")
      setClientesData([])
      setReporteDetalladoData(null)
    } finally {
      setIsLoading(false)
    }
  }

  // Fetch pagos y gastos al cambiar tab o filtros
  const fetchPagosData = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const monthStr = selectedMonth.toString().padStart(2, '0')
      const response = await fetch(`/api/reportes/pagos?month=${monthStr}&year=${selectedYear}`)
      const data = await response.json()
      // Ajuste: usar data.data si existe, si no usar data directamente
      if (data.success && Array.isArray(data.data)) {
        setPagosData(data.data)
      } else if (Array.isArray(data)) {
        setPagosData(data)
      } else if (data.data && Array.isArray(data.data)) {
        setPagosData(data.data)
      } else {
        setPagosData([])
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido")
      setPagosData([])
    } finally {
      setIsLoading(false)
    }
  }

  const fetchGastosData = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/reportes/gastos?month=${selectedMonth}&year=${selectedYear}`)
      const data = await response.json()
      if (data.success && Array.isArray(data.data)) {
        setGastosData(data.data)
      } else if (Array.isArray(data)) {
        setGastosData(data)
      } else {
        setGastosData([])
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido")
      setGastosData([])
    } finally {
      setIsLoading(false)
    }
  }

  const fetchCategoriasGasto = async () => {
    try {
      const res = await fetch('/api/gastos/categorias')
      if (res.ok) {
        const data = await res.json()
        setCategoriasGasto(Array.isArray(data) ? data : [])
      }
    } catch {}
  }

  // Preparar datos para gráficos
  const datosFinancieros = [
    { id: "ingresos", name: "Ingresos", monto: reporteData.reporteFinanciero?.ingresos || 0 },
    { id: "gastos", name: "Gastos", monto: reporteData.reporteFinanciero?.gastos || 0 },
    { id: "utilidad", name: "Utilidad", monto: reporteData.reporteFinanciero?.utilidad || 0 },
  ]
  const datosClientes = [
    { id: "activos", name: "Activos", cantidad: reporteData.reporteClientes?.activos || 0 },
    { id: "nuevos", name: "Nuevos", cantidad: reporteData.reporteClientes?.nuevos || 0 },
    { id: "bajas", name: "Bajas", cantidad: reporteData.reporteClientes?.bajas || 0 },
  ]
  const hasDatos = datosFinancieros.some(d => d.monto > 0) || datosClientes.some(d => d.cantidad > 0)

  // Exportar CSV
  const exportarReporte = () => {
    const headers = ['Mes', 'Año', 'Tipo de Reporte', 'Ingresos', 'Gastos', 'Utilidad', 'Clientes Activos']
    const rows = [
      [
        getMonthName(),
        selectedYear,
        reportType,
        reporteData.reporteFinanciero?.ingresos || 0,
        reporteData.reporteFinanciero?.gastos || 0,
        reporteData.reporteFinanciero?.utilidad || 0,
        reporteData.reporteClientes?.activos || 0,
      ]
    ]

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = 'reporte.csv'
    link.click()
  }

  // Exportar CSV de clientes
  const exportarClientesCSV = () => {
    if (reporteDetalladoData) {
      // Exportar reporte detallado
      const headers = [
        'ID', 'Cédula', 'Nombres', 'Apellidos', 'Tipo Plan', 'Precio Plan', 'Sector', 'Estado', 
        'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic', 'Total Año'
      ]
      
      const rows = reporteDetalladoData.clientes.map(cliente => [
        cliente.id,
        cliente.cedula,
        cliente.nombres,
        cliente.apellidos,
        cliente.tipo_plan,
        cliente.precio_plan,
        cliente.sector,
        cliente.estado,
        ...Array.from({ length: 12 }, (_, i) => {
          const mes = i + 1;
          const pagoMes = cliente.pagos_por_mes[mes];
          return pagoMes ? pagoMes.total : 0;
        }),
        cliente.total_pagado_anio
      ])

      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(x => `"${String(x).replace(/"/g, '""')}"`).join(','))
      ].join('\n')

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = `reporte_detallado_clientes_${selectedYear}.csv`
      link.click()
    } else if (clientesData.length > 0) {
      // Exportar reporte normal
      const headers = ['ID', 'Cédula', 'Nombres', 'Apellidos', 'Plan', 'Precio', 'Sector', 'Estado', 'Fecha Registro']
      const rows = clientesData.map(c => [
        c.id, c.cedula, c.nombres, c.apellidos, c.tipo_plan, c.precio_plan, c.sector, c.estado, c.fecha_registro
      ])

      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(x => `"${String(x).replace(/"/g, '""')}"`).join(','))
      ].join('\n')

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = 'reporte_clientes.csv'
      link.click()
    }
  }

  // --- Filtros y paginación pagos ---
  const pagosFiltrados = pagosData.filter(p =>
    (pagosSearch === "" ||
      p.cliente_nombre.toLowerCase().includes(pagosSearch.toLowerCase()) ||
      p.cliente_cedula.includes(pagosSearch) ||
      p.numero_comprobante.toLowerCase().includes(pagosSearch.toLowerCase()) ||
      p.concepto.toLowerCase().includes(pagosSearch.toLowerCase())
    ) &&
    (pagosMetodo === "todos" || p.metodo_pago === pagosMetodo) &&
    (pagosEstado === "todos" || p.estado === pagosEstado)
  )
  const pagosTotalPages = Math.ceil(pagosFiltrados.length / pagosPerPage)
  const pagosPageData = pagosFiltrados.slice((pagosPage-1)*pagosPerPage, pagosPage*pagosPerPage)
  // --- Filtros y paginación gastos ---
  const gastosFiltrados = gastosData.filter(g =>
    (gastosSearch === "" ||
      g.descripcion.toLowerCase().includes(gastosSearch.toLowerCase()) ||
      g.categoria.toLowerCase().includes(gastosSearch.toLowerCase()) ||
      (g.proveedor || "").toLowerCase().includes(gastosSearch.toLowerCase()) ||
      (g.usuario_nombre || "").toLowerCase().includes(gastosSearch.toLowerCase())
    ) &&
    (gastosCategoria === "todas" || g.categoria === gastosCategoria)
  )
  const gastosTotalPages = Math.ceil(gastosFiltrados.length / gastosPerPage)
  const gastosPageData = gastosFiltrados.slice((gastosPage-1)*gastosPerPage, gastosPage*gastosPerPage)
  // --- Exportar CSV pagos ---
  const exportarPagosCSV = () => {
    const headers = ["Comprobante","Fecha","Cliente","Cédula","Plan","Concepto","Método","Monto","Estado"]
    const rows = pagosFiltrados.map(p => [
      p.numero_comprobante,
      p.fecha_pago,
      p.cliente_nombre,
      p.cliente_cedula,
      p.tipo_plan,
      p.concepto,
      p.metodo_pago,
      p.monto,
      p.estado
    ])
    const csvContent = [headers.join(','), ...rows.map(row => row.map(x => `"${String(x).replace(/"/g, '""')}"`).join(','))].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = 'reporte_pagos.csv'
    link.click()
  }
  // --- Exportar CSV gastos ---
  const exportarGastosCSV = () => {
    const headers = ["Fecha","Descripción","Categoría","Monto","Proveedor","Método","Responsable"]
    const rows = gastosFiltrados.map(g => [
      g.fecha_gasto,
      g.descripcion,
      g.categoria,
      g.monto,
      g.proveedor || '',
      g.metodo_pago || '',
      g.usuario_nombre || ''
    ])
    const csvContent = [headers.join(','), ...rows.map(row => row.map(x => `"${String(x).replace(/"/g, '""')}"`).join(','))].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = 'reporte_gastos.csv'
    link.click()
  }

  // Cambiar la lógica de selección y envío:
  const pagosNoEnviadosPage = pagosPageData.filter(p => !p.comprobante_enviado)
  const canShowEnviarComprobantes = pagosNoEnviadosPage.length > 0
  const togglePago = (id: number) => {
    const pago = pagosPageData.find(p => p.id === id)
    if (!pago || pago.comprobante_enviado) return
    setSelectedPagos(prev => prev.includes(id) ? prev.filter(pid => pid !== id) : [...prev, id])
  }
  const toggleAllPagos = () => {
    const allIds = pagosNoEnviadosPage.map(p => p.id)
    const allSelected = allIds.every(id => selectedPagos.includes(id))
    setSelectedPagos(allSelected ? selectedPagos.filter(id => !allIds.includes(id)) : [...selectedPagos, ...allIds.filter(id => !selectedPagos.includes(id))])
  }
  const enviarComprobantesMasivos = async () => {
    // Solo enviar los que no han sido enviados
    const idsAEnviar = selectedPagos.filter(id => {
      const pago = pagosPageData.find(p => p.id === id)
      return pago && !pago.comprobante_enviado
    })
    if (idsAEnviar.length === 0) return
    const confirmMsg = `¿Seguro que deseas enviar comprobantes por email a ${idsAEnviar.length} pago(s) seleccionado(s)?`
    if (!window.confirm(confirmMsg)) return
    setIsSendingComprobantes(true)
    try {
      const res = await fetch('/api/reportes/pagos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pagoIds: idsAEnviar })
      })
      const data = await res.json()
      if (data.success) {
        const exitosos = data.resultados.filter((r: { success: boolean }) => r.success)
        const fallidos = data.resultados.filter((r: { success: boolean }) => !r.success)
        let msg = `✅ Comprobantes enviados: ${exitosos.length}`
        if (fallidos.length > 0) {
          msg += `\n❌ Errores: ${fallidos.length}\nIDs con error: ${fallidos.map((r: any) => r.id).join(', ')}`
        }
        alert(msg)
      } else {
        alert('Error al enviar comprobantes: ' + (data.message || ''))
      }
      setSelectedPagos([])
      fetchPagosData()
    } catch (err) {
      alert('Error inesperado al enviar comprobantes')
    } finally {
      setIsSendingComprobantes(false)
    }
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
                <h1 className="text-3xl font-bold text-slate-900">Reportes y Estadísticas</h1>
                <p className="text-slate-600">Dashboard ejecutivo y reportes detallados</p>
              </div>
            </div>
            
           
          </div>

          {/* Tabs de navegación */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="dashboard" className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" /> Dashboard
              </TabsTrigger>
              <TabsTrigger value="clientes" className="flex items-center gap-2">
                <Users className="h-4 w-4" /> Clientes
              </TabsTrigger>
             
              <TabsTrigger value="pagos" className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" /> Pagos
              </TabsTrigger>
             
              <TabsTrigger value="dashboard-financiero" className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" /> Dashboard Financiero
              </TabsTrigger>
             
             
            </TabsList>

            {/* Tab Dashboard */}
            <TabsContent value="dashboard" className="space-y-6">
              {/* Filtros */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Filter className="h-5 w-5" />
                    Filtros de Reporte
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                         <div>
                       <label className="text-sm font-medium">Mes</label>
                       <Select value={selectedMonth.toString()} onValueChange={(value) => setSelectedMonth(parseInt(value))}>
                         <SelectTrigger>
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
                     
                     <div>
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
                    
                                         <div>
                       <label className="text-sm font-medium">Tipo de Reporte</label>
                       <Select value={reportType} onValueChange={setReportType}>
                         <SelectTrigger>
                           <SelectValue placeholder="Seleccionar tipo" />
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
                    
                    <div className="flex items-end">
                      <Button variant="outline" onClick={resetFilters} className="w-full">
                        Resetear
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* KPI Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium opacity-90 flex items-center">
                      <TrendingUp className="h-4 w-4 mr-2" />
                      Ingresos Totales
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                                    <div className="text-3xl font-bold">
                  ${(reporteData.reporteFinanciero?.ingresos || 0).toLocaleString()}
                </div>
                <p className="text-xs opacity-75 mt-1">
                  {(reporteData.reporteFinanciero?.crecimiento || 0) > 0 ? '+' : ''}{(reporteData.reporteFinanciero?.crecimiento || 0).toFixed(1)}% vs mes anterior
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
                  ${(reporteData.reporteFinanciero?.gastos || 0).toLocaleString()}
                </div>
                    <p className="text-xs opacity-75 mt-1">
                      Gastos del período
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
                  ${(reporteData.reporteFinanciero?.utilidad || 0).toLocaleString()}
                </div>
                    <p className="text-xs opacity-75 mt-1">
                      Ingresos - Gastos
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
                  {(reporteData.reporteClientes?.activos || 0).toLocaleString()}
                </div>
                <p className="text-xs opacity-75 mt-1">
                  {reporteData.reporteClientes?.nuevos || 0} nuevos este mes
                </p>
                  </CardContent>
                </Card>
              </div>

              {/* Gráficos */}
              {hasDatos && reporteData.reporteFinanciero && reporteData.reporteClientes && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Análisis Financiero</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={datosFinancieros}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip formatter={(value) => [`$${value.toLocaleString()}`, 'Monto']} />
                          <Bar dataKey="monto" fill="#3b82f6" />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Estado de Clientes</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={datosClientes}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="cantidad"
                          >
                                                       {datosClientes.map((entry, index) => (
                             <Cell key={`cell-${entry.id}-${index}`} fill={['#3b82f6', '#10b981', '#ef4444'][index % 3]} />
                           ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </div>
              )}

              {error && (
                <Card className="border-red-200 bg-red-50">
                  <CardContent className="pt-6">
                    <p className="text-red-600">{error}</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Tab Clientes */}
            <TabsContent value="clientes" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Reportes de Clientes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {/* Filtro de año para reportes de clientes */}
                  <Card className="mb-6">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Filter className="h-5 w-5" />
                        Filtro por Año
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-4">
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
                        
                        <div className="flex items-end">
                          <Button 
                            onClick={() => {
                              setClientesData([])
                              setReporteDetalladoData(null)
                            }}
                            variant="outline"
                          >
                            Limpiar
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Botones de reporte de clientes */}
                  <div className="flex flex-wrap gap-4 mb-6 items-center justify-center">
                    <Button onClick={() => handleClientesReport('general')} disabled={isLoading} className="flex items-center gap-2">
                      <FileText className="h-4 w-4" /> Reporte General
                    </Button>
                    <Button onClick={() => handleClientesReport('anual')} disabled={isLoading} className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" /> Reporte Anual
                    </Button>
                    <Button onClick={() => handleClientesReport('mensual')} disabled={isLoading} className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" /> Reporte Mensual
                    </Button>
                    <Button 
                      onClick={exportarClientesCSV}
                      disabled={clientesData.length === 0 && !reporteDetalladoData}
                      className="flex items-center gap-2"
                    >
                      <Download className="h-4 w-4" />
                      Exportar CSV
                    </Button>
                  </div>
                  
                  {/* Filtros específicos para clientes */}


                                    {/* Resumen del reporte detallado */}
                  {/* Eliminar la opción y la lógica de reporteDetalladoData */}

                  {/* Tabla de resultados */}
                  {/* --- Renderizado de la tabla de clientes según el tipo de reporte --- */}
                  {clientesReportType === 'general' && clientesData.length > 0 && (
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse border border-gray-300">
                        <thead>
                          <tr className="bg-gray-100">
                            <th className="border border-gray-300 px-4 py-2">ID</th>
                            <th className="border border-gray-300 px-4 py-2">Cédula</th>
                            <th className="border border-gray-300 px-4 py-2">Nombres</th>
                            <th className="border border-gray-300 px-4 py-2">Apellidos</th>
                            <th className="border border-gray-300 px-4 py-2">Plan</th>
                            <th className="border border-gray-300 px-4 py-2">Precio</th>
                            <th className="border border-gray-300 px-4 py-2">Sector</th>
                            <th className="border border-gray-300 px-4 py-2">Estado</th>
                            <th className="border border-gray-300 px-4 py-2">Fecha Registro</th>
                          </tr>
                        </thead>
                        <tbody>
                          {clientesData.map((cliente, index) => (
                            <tr key={`cliente-${cliente.id}-${index}`}>
                              <td className="border border-gray-300 px-4 py-2">{cliente.id}</td>
                              <td className="border border-gray-300 px-4 py-2">{cliente.cedula}</td>
                              <td className="border border-gray-300 px-4 py-2">{cliente.nombres}</td>
                              <td className="border border-gray-300 px-4 py-2">{cliente.apellidos}</td>
                              <td className="border border-gray-300 px-4 py-2">{cliente.tipo_plan}</td>
                              <td className="border border-gray-300 px-4 py-2">${cliente.precio_plan}</td>
                              <td className="border border-gray-300 px-4 py-2">{cliente.sector}</td>
                              <td className="border border-gray-300 px-4 py-2">
                                <Badge variant={cliente.estado === 'activo' ? 'default' : 'secondary'}>
                                  {cliente.estado}
                                </Badge>
                              </td>
                              <td className="border border-gray-300 px-4 py-2">{cliente.fecha_registro}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {clientesReportType === 'anual' && clientesData.length > 0 && (
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse border border-gray-300">
                        <thead>
                          <tr className="bg-gray-100">
                            <th className="border border-gray-300 px-4 py-2">Cliente</th>
                            <th className="border border-gray-300 px-4 py-2">Plan</th>
                            <th className="border border-gray-300 px-4 py-2">Sector</th>
                            <th className="border border-gray-300 px-4 py-2">Estado</th>
                            {Array.from({ length: 12 }, (_, i) => (
                              <th key={i} className="border border-gray-300 px-2 py-2 text-xs">{months[i].label}</th>
                            ))}
                            <th className="border border-gray-300 px-4 py-2">Total Año</th>
                          </tr>
                        </thead>
                        <tbody>
                          {clientesData.map((cliente, index) => (
                            <tr key={`anual-${cliente.id}-${index}`}>
                              <td className="border border-gray-300 px-4 py-2">
                                <div className="font-medium">{cliente.nombres} {cliente.apellidos}</div>
                                <div className="text-xs text-gray-500">{cliente.cedula}</div>
                              </td>
                              <td className="border border-gray-300 px-4 py-2">{cliente.tipo_plan}</td>
                              <td className="border border-gray-300 px-4 py-2">{cliente.sector}</td>
                              <td className="border border-gray-300 px-4 py-2">
                                <Badge variant={cliente.estado === 'activo' ? 'default' : 'secondary'}>{cliente.estado}</Badge>
                              </td>
                              {Array.from({ length: 12 }, (_, i) => {
                                const mes = i + 1;
                                const pagoMes = cliente.pagos_por_mes?.[mes];
                                return (
                                  <td key={mes} className="border border-gray-300 px-2 py-2 text-xs text-center">
                                    {pagoMes && (pagoMes.cantidad || pagoMes.total) ? (
                                      <div className="font-medium text-green-600">
                                        {pagoMes.cantidad ? `${pagoMes.cantidad} pago${pagoMes.cantidad > 1 ? 's' : ''}` : ''}
                                        {pagoMes.cantidad && pagoMes.total ? ' / ' : ''}
                                        {pagoMes.total ? `$${pagoMes.total}` : ''}
                                      </div>
                                    ) : (
                                      <div className="text-gray-400">-</div>
                                    )}
                                  </td>
                                );
                              })}
                              <td className="border border-gray-300 px-4 py-2 font-bold">
                                <div className="text-green-600">{cliente.total_pagos_anio || 0}</div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {clientesReportType === 'mensual' && clientesData.length > 0 && (
                    <div className="overflow-x-auto">
                      {/* Encabezado con el mes y año seleccionado */}
                      <div className="mb-2 text-sm font-semibold text-blue-700">
                        Reporte Mensual: {getMonthName()} {selectedYear}
                      </div>
                      <table className="w-full border-collapse border border-gray-300">
                        <thead>
                          <tr className="bg-gray-100">
                            <th className="border border-gray-300 px-4 py-2">Cliente</th>
                            <th className="border border-gray-300 px-4 py-2">Cédula</th>
                            <th className="border border-gray-300 px-4 py-2">Plan</th>
                            <th className="border border-gray-300 px-4 py-2">Mes</th>
                            <th className="border border-gray-300 px-4 py-2">Monto Pagado</th>
                            <th className="border border-gray-300 px-4 py-2">Cantidad Pagos</th>
                            <th className="border border-gray-300 px-4 py-2">Fechas de Pago</th>
                          </tr>
                        </thead>
                        <tbody>
                          {clientesData.map((cliente, index) => (
                            <tr key={`mensual-${cliente.id}-${index}`}>
                              <td className="border border-gray-300 px-4 py-2">{cliente.nombres} {cliente.apellidos}</td>
                              <td className="border border-gray-300 px-4 py-2">{cliente.cedula}</td>
                              <td className="border border-gray-300 px-4 py-2">{cliente.tipo_plan}</td>
                              <td className="border border-gray-300 px-4 py-2">{getMonthName()}</td>
                              <td className="border border-gray-300 px-4 py-2">${cliente.monto_pagado_mes || 0}</td>
                              <td className="border border-gray-300 px-4 py-2">{cliente.cantidad_pagos_mes || 0}</td>
                              <td className="border border-gray-300 px-4 py-2">{Array.isArray(cliente.fechas_pago_mes) ? cliente.fechas_pago_mes.join(', ') : ''}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Mensaje si no hay datos */}
                  {!isLoading && clientesData.length === 0 && (
                    <div className="text-center py-8 text-gray-500">No hay datos de clientes para mostrar</div>
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
                    <Button onClick={exportarPagosCSV} disabled={pagosFiltrados.length === 0} className="flex items-center gap-2">
                      <Download className="h-4 w-4" /> Exportar CSV
                    </Button>
                  </div>
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
                            <TableCell>{p.fecha_pago}</TableCell>
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
                  <Pagination className="mt-4">
                    <PaginationContent>
                      <PaginationPrevious onClick={() => setPagosPage(p => Math.max(1, p-1))} />
                      {[...Array(pagosTotalPages)].map((_, i) => (
                        <PaginationItem key={i}>
                          <PaginationLink isActive={pagosPage === i+1} onClick={() => setPagosPage(i+1)}>{i+1}</PaginationLink>
                        </PaginationItem>
                      ))}
                      <PaginationNext onClick={() => setPagosPage(p => Math.min(pagosTotalPages, p+1))} />
                    </PaginationContent>
                  </Pagination>
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
                  <div className="flex flex-wrap gap-4 mb-4">
                    <Input
                      placeholder="Buscar por descripción, categoría, proveedor, responsable..."
                      value={gastosSearch}
                      onChange={e => { setGastosSearch(e.target.value); setGastosPage(1) }}
                      className="max-w-xs"
                    />
                    <Select value={gastosCategoria} onValueChange={v => { setGastosCategoria(v); setGastosPage(1) }}>
                      <SelectTrigger className="w-40"><SelectValue placeholder="Categoría" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todas">Todas las categorías</SelectItem>
                        {categoriasGasto.map(cat => (
                          <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button onClick={exportarGastosCSV} disabled={gastosFiltrados.length === 0} className="flex items-center gap-2">
                      <Download className="h-4 w-4" /> Exportar CSV
                    </Button>
                  </div>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Fecha</TableHead>
                          <TableHead>Descripción</TableHead>
                          <TableHead>Categoría</TableHead>
                          <TableHead>Monto</TableHead>
                          <TableHead>Proveedor</TableHead>
                          <TableHead>Método</TableHead>
                          <TableHead>Responsable</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {gastosPageData.map((g, i) => (
                          <TableRow key={g.id + '-' + i}>
                            <TableCell>{g.fecha_gasto}</TableCell>
                            <TableCell>{g.descripcion}</TableCell>
                            <TableCell>{g.categoria}</TableCell>
                            <TableCell>${g.monto.toFixed(2)}</TableCell>
                            <TableCell>{g.proveedor}</TableCell>
                            <TableCell>{g.metodo_pago}</TableCell>
                            <TableCell>{g.usuario_nombre}</TableCell>
                          </TableRow>
                        ))}
                        {gastosPageData.length === 0 && (
                          <TableRow><TableCell colSpan={7} className="text-center">No hay gastos para mostrar</TableCell></TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                  <Pagination className="mt-4">
                    <PaginationContent>
                      <PaginationPrevious onClick={() => setGastosPage(p => Math.max(1, p-1))} />
                      {[...Array(gastosTotalPages)].map((_, i) => (
                        <PaginationItem key={i}>
                          <PaginationLink isActive={gastosPage === i+1} onClick={() => setGastosPage(i+1)}>{i+1}</PaginationLink>
                        </PaginationItem>
                      ))}
                      <PaginationNext onClick={() => setGastosPage(p => Math.min(gastosTotalPages, p+1))} />
                    </PaginationContent>
                  </Pagination>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab Configuración */}
            <TabsContent value="configuracion" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Configuración de Reportes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-medium mb-2">Información del Sistema</h3>
                      <p className="text-sm text-gray-600">
                        El sistema de reportes está configurado para mostrar datos filtrados por año.
                        Todos los reportes de clientes utilizan el filtro de año seleccionado.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab Dashboard Financiero Mensual */}
            <TabsContent value="dashboard-financiero" className="space-y-6">
              {/* Filtros */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Filter className="h-5 w-5" />
                    Filtros de Reporte Financiero
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <label className="text-sm font-medium">Mes</label>
                      <Select value={selectedMonth.toString()} onValueChange={(value) => setSelectedMonth(parseInt(value))}>
                        <SelectTrigger>
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
                    <div>
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
                    <div className="flex items-end">
                      <Button variant="outline" onClick={resetFilters} className="w-full">
                        Resetear
                      </Button>
                    </div>
                    <div className="flex items-end">
                      <Button onClick={exportarReporte} className="w-full flex items-center gap-2">
                        <Download className="h-4 w-4" /> Exportar CSV
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
              {/* Tarjetas KPI */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium opacity-90 flex items-center">
                      <TrendingUp className="h-4 w-4 mr-2" />
                      Ingresos Totales
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">
                      ${(reporteData.reporteFinanciero?.ingresos || 0).toLocaleString()}
                    </div>
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
                      ${(reporteData.reporteFinanciero?.gastos || 0).toLocaleString()}
                    </div>
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
                      ${(reporteData.reporteFinanciero?.utilidad || 0).toLocaleString()}
                    </div>
                  </CardContent>
                </Card>
              </div>
              {/* Gráfico de barras */}
              <Card>
                <CardHeader>
                  <CardTitle>Comparativo Mensual</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={datosFinancieros}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip formatter={(value) => [`$${value.toLocaleString()}`, 'Monto']} />
                      <Bar dataKey="monto" fill="#3b82f6" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}







