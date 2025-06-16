"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  ArrowLeft,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Users,
  DollarSign,
  Calendar,
  Download,
  FileText,
  PieChart,
} from "lucide-react"

export default function ReportesPage() {
  const [selectedPeriod, setSelectedPeriod] = useState("mes")
  const router = useRouter()

  useEffect(() => {
    const userData = localStorage.getItem("user")
    if (!userData) {
      router.push("/")
      return
    }
  }, [router])

  const reporteFinanciero = {
    ingresos: 45231,
    gastos: 8500,
    utilidad: 36731,
    crecimiento: 8.5,
  }

  const reporteClientes = {
    total: 1234,
    activos: 1180,
    nuevos: 45,
    bajas: 12,
  }

  const ventasPorPlan = [
    { plan: "Básico 10MB", clientes: 450, ingresos: 11250 },
    { plan: "Estándar 25MB", clientes: 380, ingresos: 13300 },
    { plan: "Premium 50MB", clientes: 280, ingresos: 12600 },
    { plan: "Ultra 100MB", clientes: 70, ingresos: 4550 },
  ]

  const gastosPorCategoria = [
    { categoria: "Proveedores", monto: 4500, porcentaje: 52.9 },
    { categoria: "Servicios", monto: 1800, porcentaje: 21.2 },
    { categoria: "Mantenimiento", monto: 1200, porcentaje: 14.1 },
    { categoria: "Transporte", monto: 600, porcentaje: 7.1 },
    { categoria: "Oficina", monto: 400, porcentaje: 4.7 },
  ]

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
                <h1 className="text-3xl font-bold text-slate-900">Reportes y Análisis</h1>
                <p className="text-slate-600">Dashboard ejecutivo y reportes detallados</p>
              </div>
            </div>

            <div className="flex space-x-2">
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="semana">Esta semana</SelectItem>
                  <SelectItem value="mes">Este mes</SelectItem>
                  <SelectItem value="trimestre">Este trimestre</SelectItem>
                  <SelectItem value="año">Este año</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" className="flex items-center space-x-2">
                <Download className="h-4 w-4" />
                <span>Exportar</span>
              </Button>
            </div>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium opacity-90 flex items-center">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Ingresos Totales
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">${reporteFinanciero.ingresos.toLocaleString()}</div>
                <p className="text-xs opacity-90">
                  <span className="text-green-200">↗ +{reporteFinanciero.crecimiento}%</span> vs mes anterior
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
                <div className="text-3xl font-bold">${reporteFinanciero.gastos.toLocaleString()}</div>
                <p className="text-xs opacity-90">
                  {((reporteFinanciero.gastos / reporteFinanciero.ingresos) * 100).toFixed(1)}% de los ingresos
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
                <div className="text-3xl font-bold">${reporteFinanciero.utilidad.toLocaleString()}</div>
                <p className="text-xs opacity-90">
                  {((reporteFinanciero.utilidad / reporteFinanciero.ingresos) * 100).toFixed(1)}% margen
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
                <div className="text-3xl font-bold">{reporteClientes.activos.toLocaleString()}</div>
                <p className="text-xs opacity-90">
                  {((reporteClientes.activos / reporteClientes.total) * 100).toFixed(1)}% del total
                </p>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="financiero" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="financiero">Reporte Financiero</TabsTrigger>
              <TabsTrigger value="clientes">Análisis de Clientes</TabsTrigger>
              <TabsTrigger value="ventas">Ventas por Plan</TabsTrigger>
              <TabsTrigger value="gastos">Análisis de Gastos</TabsTrigger>
            </TabsList>

            <TabsContent value="financiero" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <BarChart3 className="h-5 w-5" />
                      <span>Resumen Financiero</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between items-center p-4 bg-green-50 rounded-lg">
                      <div>
                        <div className="font-semibold text-green-800">Ingresos</div>
                        <div className="text-sm text-green-600">Recaudación total</div>
                      </div>
                      <div className="text-2xl font-bold text-green-800">
                        ${reporteFinanciero.ingresos.toLocaleString()}
                      </div>
                    </div>

                    <div className="flex justify-between items-center p-4 bg-red-50 rounded-lg">
                      <div>
                        <div className="font-semibold text-red-800">Gastos</div>
                        <div className="text-sm text-red-600">Gastos operativos</div>
                      </div>
                      <div className="text-2xl font-bold text-red-800">
                        ${reporteFinanciero.gastos.toLocaleString()}
                      </div>
                    </div>

                    <div className="flex justify-between items-center p-4 bg-blue-50 rounded-lg">
                      <div>
                        <div className="font-semibold text-blue-800">Utilidad</div>
                        <div className="text-sm text-blue-600">Ganancia neta</div>
                      </div>
                      <div className="text-2xl font-bold text-blue-800">
                        ${reporteFinanciero.utilidad.toLocaleString()}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <TrendingUp className="h-5 w-5" />
                      <span>Indicadores de Rendimiento</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm font-medium">Margen de Utilidad</span>
                        <span className="text-sm font-bold">
                          {((reporteFinanciero.utilidad / reporteFinanciero.ingresos) * 100).toFixed(1)}%
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{
                            width: `${(reporteFinanciero.utilidad / reporteFinanciero.ingresos) * 100}%`,
                          }}
                        ></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm font-medium">Ratio de Gastos</span>
                        <span className="text-sm font-bold">
                          {((reporteFinanciero.gastos / reporteFinanciero.ingresos) * 100).toFixed(1)}%
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2">
                        <div
                          className="bg-red-600 h-2 rounded-full"
                          style={{
                            width: `${(reporteFinanciero.gastos / reporteFinanciero.ingresos) * 100}%`,
                          }}
                        ></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm font-medium">Crecimiento Mensual</span>
                        <span className="text-sm font-bold text-green-600">+{reporteFinanciero.crecimiento}%</span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2">
                        <div className="bg-green-600 h-2 rounded-full" style={{ width: "85%" }}></div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="clientes" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Users className="h-5 w-5" />
                      <span>Estadísticas de Clientes</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">{reporteClientes.total}</div>
                        <div className="text-sm text-blue-800">Total Clientes</div>
                      </div>
                      <div className="text-center p-4 bg-green-50 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">{reporteClientes.activos}</div>
                        <div className="text-sm text-green-800">Clientes Activos</div>
                      </div>
                      <div className="text-center p-4 bg-purple-50 rounded-lg">
                        <div className="text-2xl font-bold text-purple-600">{reporteClientes.nuevos}</div>
                        <div className="text-sm text-purple-800">Nuevos este mes</div>
                      </div>
                      <div className="text-center p-4 bg-red-50 rounded-lg">
                        <div className="text-2xl font-bold text-red-600">{reporteClientes.bajas}</div>
                        <div className="text-sm text-red-800">Bajas este mes</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Calendar className="h-5 w-5" />
                      <span>Tendencias</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm font-medium">Tasa de Retención</span>
                        <span className="text-sm font-bold text-green-600">95.2%</span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2">
                        <div className="bg-green-600 h-2 rounded-full" style={{ width: "95.2%" }}></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm font-medium">Crecimiento de Clientes</span>
                        <span className="text-sm font-bold text-blue-600">+2.8%</span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2">
                        <div className="bg-blue-600 h-2 rounded-full" style={{ width: "28%" }}></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm font-medium">Satisfacción</span>
                        <span className="text-sm font-bold text-purple-600">4.6/5</span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2">
                        <div className="bg-purple-600 h-2 rounded-full" style={{ width: "92%" }}></div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="ventas" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <PieChart className="h-5 w-5" />
                    <span>Ventas por Plan de Internet</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {ventasPorPlan.map((plan, index) => {
                      const totalClientes = ventasPorPlan.reduce((sum, p) => sum + p.clientes, 0)
                      const porcentaje = (plan.clientes / totalClientes) * 100

                      return (
                        <div key={plan.plan} className="space-y-2">
                          <div className="flex justify-between items-center">
                            <div>
                              <div className="font-medium">{plan.plan}</div>
                              <div className="text-sm text-slate-600">
                                {plan.clientes} clientes • ${plan.ingresos.toLocaleString()} ingresos
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-bold">{porcentaje.toFixed(1)}%</div>
                              <div className="text-sm text-slate-600">
                                ${(plan.ingresos / plan.clientes).toFixed(0)}/mes
                              </div>
                            </div>
                          </div>
                          <div className="w-full bg-slate-200 rounded-full h-3">
                            <div
                              className={`h-3 rounded-full ${
                                index === 0
                                  ? "bg-blue-600"
                                  : index === 1
                                    ? "bg-green-600"
                                    : index === 2
                                      ? "bg-purple-600"
                                      : "bg-orange-600"
                              }`}
                              style={{ width: `${porcentaje}%` }}
                            ></div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="gastos" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <FileText className="h-5 w-5" />
                    <span>Análisis de Gastos por Categoría</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {gastosPorCategoria.map((categoria, index) => (
                      <div key={categoria.categoria} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <div className="font-medium">{categoria.categoria}</div>
                          <div className="text-right">
                            <div className="font-bold">${categoria.monto.toLocaleString()}</div>
                            <div className="text-sm text-slate-600">{categoria.porcentaje}%</div>
                          </div>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              index === 0
                                ? "bg-red-600"
                                : index === 1
                                  ? "bg-orange-600"
                                  : index === 2
                                    ? "bg-yellow-600"
                                    : index === 3
                                      ? "bg-green-600"
                                      : "bg-blue-600"
                            }`}
                            style={{ width: `${categoria.porcentaje}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
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
