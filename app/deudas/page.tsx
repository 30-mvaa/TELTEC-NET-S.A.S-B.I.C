// app/deudas/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  ArrowLeft,
  Search,
  AlertTriangle,
  Clock,
  CheckCircle,
  DollarSign,
  RefreshCw,
  Settings,
  FileText,
  Calendar,
  TrendingUp,
  TrendingDown,
} from "lucide-react";

interface ClienteDeuda {
  id: number;
  cedula: string;
  nombres: string;
  apellidos: string;
  tipo_plan: string;
  precio_plan: number;
  estado: string;
  fecha_ultimo_pago: string | null;
  meses_pendientes: number;
  monto_total_deuda: number;
  fecha_vencimiento_pago: string | null;
  estado_pago: 'al_dia' | 'proximo_vencimiento' | 'vencido' | 'corte_pendiente';
}

interface EstadisticasDeudas {
  total_clientes: number;
  clientes_al_dia: number;
  clientes_vencidos: number;
  clientes_corte_pendiente: number;
  total_deuda: number;
  promedio_deuda: number;
}

export default function DeudasPage() {
  const router = useRouter();

  // Estados
  const [clientes, setClientes] = useState<ClienteDeuda[]>([]);
  const [estadisticas, setEstadisticas] = useState<EstadisticasDeudas | null>(null);
  const [filtered, setFiltered] = useState<ClienteDeuda[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterEstado, setFilterEstado] = useState<string>("todos");
  const [loading, setLoading] = useState(false);
  const [selectedCliente, setSelectedCliente] = useState<ClienteDeuda | null>(null);
  const [showDetalles, setShowDetalles] = useState(false);
  const [cuotas, setCuotas] = useState<any[]>([]);
  const [historial, setHistorial] = useState<any[]>([]);

  // Carga inicial
  useEffect(() => {
    if (!localStorage.getItem("user")) {
      router.push("/");
      return;
    }
    loadData();
  }, [router]);

  // Filtrar clientes
  useEffect(() => {
    let tmp = clientes.slice();
    if (searchTerm) {
      const t = searchTerm.toLowerCase();
      tmp = tmp.filter(
        (c) =>
          c.nombres.toLowerCase().includes(t) ||
          c.apellidos.toLowerCase().includes(t) ||
          c.cedula.includes(searchTerm)
      );
    }
    if (filterEstado !== "todos") {
      tmp = tmp.filter((c) => c.estado_pago === filterEstado);
    }
    setFiltered(tmp);
  }, [clientes, searchTerm, filterEstado]);

  // Cargar datos
  async function loadData() {
    setLoading(true);
    try {
      const [clientesRes, statsRes] = await Promise.all([
        fetch("/api/deudas"),
        fetch("/api/deudas?action=estadisticas"),
      ]);

      const clientesData = await clientesRes.json();
      const statsData = await statsRes.json();

      if (clientesData.success) setClientes(clientesData.data);
      if (statsData.success) setEstadisticas(statsData.data);
    } catch (error) {
      console.error("Error cargando datos:", error);
    } finally {
      setLoading(false);
    }
  }

  // Actualizar sistema de deudas
  async function actualizarSistema() {
    setLoading(true);
    try {
      const res = await fetch("/api/deudas?action=actualizar-sistema", {
        method: "POST",
      });
      const data = await res.json();
      if (data.success) {
        alert("Sistema de deudas actualizado exitosamente");
        loadData();
      } else {
        alert("Error actualizando sistema: " + data.message);
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Error actualizando sistema");
    } finally {
      setLoading(false);
    }
  }

  // Ver detalles del cliente
  async function verDetalles(cliente: ClienteDeuda) {
    setSelectedCliente(cliente);
    setShowDetalles(true);

    try {
      const [cuotasRes, historialRes] = await Promise.all([
        fetch(`/api/deudas?action=cuotas&clienteId=${cliente.id}`),
        fetch(`/api/deudas?action=historial&clienteId=${cliente.id}`),
      ]);

      const cuotasData = await cuotasRes.json();
      const historialData = await historialRes.json();

      if (cuotasData.success) setCuotas(cuotasData.data);
      if (historialData.success) setHistorial(historialData.data);
    } catch (error) {
      console.error("Error cargando detalles:", error);
    }
  }

  // Badge de estado de pago
  function getEstadoBadge(estado: string) {
    const configs = {
      al_dia: { color: "bg-green-100 text-green-800", icon: CheckCircle, label: "Al día" },
      proximo_vencimiento: { color: "bg-yellow-100 text-yellow-800", icon: Clock, label: "Próximo vencimiento" },
      vencido: { color: "bg-red-100 text-red-800", icon: AlertTriangle, label: "Vencido" },
      corte_pendiente: { color: "bg-red-200 text-red-900", icon: AlertTriangle, label: "Corte pendiente" },
    };
    const config = configs[estado as keyof typeof configs] || configs.al_dia;
    const Icon = config.icon;
    return (
      <Badge className={config.color}>
        <Icon className="h-3 w-3 mr-1" />
        {config.label}
      </Badge>
    );
  }

  if (loading && !estadisticas) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Cargando sistema de deudas...</p>
        </div>
      </div>
    );
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
                <h1 className="text-3xl font-bold text-slate-900">Gestión de Deudas</h1>
                <p className="text-slate-600">Control de pagos vencidos y deudas acumuladas</p>
              </div>
            </div>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                onClick={actualizarSistema}
                disabled={loading}
                className="flex items-center space-x-2"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                <span>Actualizar Sistema</span>
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push("/recaudacion")}
                className="flex items-center space-x-2"
              >
                <DollarSign className="h-4 w-4" />
                <span>Registrar Pago</span>
              </Button>
            </div>
          </div>

          {/* Estadísticas */}
          {estadisticas && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card className="bg-green-500 text-white">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium opacity-90 flex items-center">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Al Día
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">
                    {estadisticas.clientes_al_dia}
                  </div>
                  <p className="text-xs opacity-75 mt-1">
                    {((estadisticas.clientes_al_dia / estadisticas.total_clientes) * 100).toFixed(1)}% del total
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-red-500 text-white">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium opacity-90 flex items-center">
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    Vencidos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">
                    {estadisticas.clientes_vencidos}
                  </div>
                  <p className="text-xs opacity-75 mt-1">
                    ${estadisticas.total_deuda.toLocaleString()} en deudas
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-yellow-500 text-white">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium opacity-90 flex items-center">
                    <Clock className="h-4 w-4 mr-2" />
                    Próximos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">
                    {estadisticas.clientes_corte_pendiente}
                  </div>
                  <p className="text-xs opacity-75 mt-1">
                    Corte pendiente
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-purple-500 text-white">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium opacity-90 flex items-center">
                    <TrendingDown className="h-4 w-4 mr-2" />
                    Deuda Total
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">
                    ${estadisticas.total_deuda.toLocaleString()}
                  </div>
                  <p className="text-xs opacity-75 mt-1">
                    Promedio: ${estadisticas.promedio_deuda.toFixed(2)}
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Filtros */}
          <div className="flex flex-col md:flex-row items-center gap-4 bg-white p-4 rounded-lg shadow mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <Input
                className="pl-10"
                placeholder="Buscar por nombre o cédula..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="w-full md:w-48">
              <Select value={filterEstado} onValueChange={setFilterEstado}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Todos los estados" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos los estados</SelectItem>
                  <SelectItem value="al_dia">Al día</SelectItem>
                  <SelectItem value="proximo_vencimiento">Próximo vencimiento</SelectItem>
                  <SelectItem value="vencido">Vencido</SelectItem>
                  <SelectItem value="corte_pendiente">Corte pendiente</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Tabla de Clientes */}
          <Card className="bg-white shadow rounded-lg overflow-hidden">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Clientes con Deudas</span>
                <span className="text-sm text-gray-500">
                  {filtered.length} de {clientes.length} clientes
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Estado de Pago</TableHead>
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
                        <div className="font-medium">
                          {cliente.nombres} {cliente.apellidos}
                        </div>
                        <div className="text-sm text-gray-500">
                          CI: {cliente.cedula}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                          {cliente.tipo_plan}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {getEstadoBadge(cliente.estado_pago)}
                      </TableCell>
                      <TableCell>
                        <span className={`font-semibold ${
                          cliente.meses_pendientes > 0 ? 'text-red-600' : 'text-green-600'
                        }`}>
                          {cliente.meses_pendientes}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className={`font-semibold ${
                          cliente.monto_total_deuda > 0 ? 'text-red-600' : 'text-green-600'
                        }`}>
                          ${cliente.monto_total_deuda.toFixed(2)}
                        </span>
                      </TableCell>
                      <TableCell>
                        {cliente.fecha_ultimo_pago ? (
                          <span className="text-sm text-gray-600">
                            {new Date(cliente.fecha_ultimo_pago).toLocaleDateString()}
                          </span>
                        ) : (
                          <span className="text-sm text-gray-400">Sin pagos</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => verDetalles(cliente)}
                        >
                          <FileText className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Modal de Detalles */}
          <Dialog open={showDetalles} onOpenChange={setShowDetalles}>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  Detalles de Deudas - {selectedCliente?.nombres} {selectedCliente?.apellidos}
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
                            {cuotas.map((cuota) => (
                              <TableRow key={cuota.id}>
                                <TableCell>
                                  {cuota.mes}/{cuota.año}
                                </TableCell>
                                <TableCell>${cuota.monto.toFixed(2)}</TableCell>
                                <TableCell>
                                  {new Date(cuota.fecha_vencimiento).toLocaleDateString()}
                                </TableCell>
                                <TableCell>
                                  <Badge className={
                                    cuota.estado === 'pagado' ? 'bg-green-100 text-green-800' :
                                    cuota.estado === 'vencido' ? 'bg-red-100 text-red-800' :
                                    'bg-yellow-100 text-yellow-800'
                                  }>
                                    {cuota.estado}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  {cuota.fecha_pago ? 
                                    new Date(cuota.fecha_pago).toLocaleDateString() : 
                                    '-'
                                  }
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
                            {historial.map((pago) => (
                              <TableRow key={pago.id}>
                                <TableCell>
                                  {new Date(pago.fecha_pago).toLocaleDateString()}
                                </TableCell>
                                <TableCell>${pago.monto_pagado.toFixed(2)}</TableCell>
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
                        <CardTitle>Resumen de Deudas</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-gray-50 p-4 rounded-lg">
                            <h4 className="font-semibold text-gray-700">Estado Actual</h4>
                            <p className="text-2xl font-bold text-gray-900">
                              {getEstadoBadge(selectedCliente.estado_pago)}
                            </p>
                          </div>
                          <div className="bg-gray-50 p-4 rounded-lg">
                            <h4 className="font-semibold text-gray-700">Meses Pendientes</h4>
                            <p className="text-2xl font-bold text-red-600">
                              {selectedCliente.meses_pendientes}
                            </p>
                          </div>
                          <div className="bg-gray-50 p-4 rounded-lg">
                            <h4 className="font-semibold text-gray-700">Deuda Total</h4>
                            <p className="text-2xl font-bold text-red-600">
                              ${selectedCliente.monto_total_deuda.toFixed(2)}
                            </p>
                          </div>
                          <div className="bg-gray-50 p-4 rounded-lg">
                            <h4 className="font-semibold text-gray-700">Último Pago</h4>
                            <p className="text-lg text-gray-900">
                              {selectedCliente.fecha_ultimo_pago ? 
                                new Date(selectedCliente.fecha_ultimo_pago).toLocaleDateString() : 
                                'Sin pagos registrados'
                              }
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
} 