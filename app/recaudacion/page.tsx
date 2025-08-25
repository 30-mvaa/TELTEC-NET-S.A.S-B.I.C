"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Pagination } from "@/components/ui/pagination";
import { ExportButtons } from "@/components/ui/export-buttons";
import { MonthSelector } from "@/components/ui/month-selector";
import { 
  RefreshCw, 
  BarChart3, 
  PieChart, 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  X, 
  Receipt,
  Download,
  Mail,
  DollarSign,
  Calendar,
  CreditCard,
  FileText,
  ArrowLeft,
  Search,
  Filter,
  Plus,
  Trash2,
  Loader2
} from "lucide-react";
import { useRouter } from 'next/navigation';

interface Cliente {
  id: number;
  cedula: string;
  nombres: string;
  apellidos: string;
  email: string;
  telefono: string;
  tipo_plan: string;
  precio_plan: number;
  estado?: string;
}

interface Pago {
  id: number;
  cliente_id: number;
  monto: number;
  fecha_pago: string;
  metodo_pago: string;
  concepto: string;
  estado: string;
  comprobante_enviado: boolean;
  numero_comprobante: string;
  fecha_creacion: string;
  cliente_nombre?: string;
}

interface Stats {
  totalRecaudado: number;
  pagosHoy: number;
  recaudacionHoy: number;
  comprobantesPendientes: number;
  totalTransacciones: number;
  promedioTicket: number;
  pagosMesActual: number;
  recaudacionMesActual: number;
  clientesConDeuda: number;
  totalDeudaPendiente: number;
}

interface MesDisponible {
  año: number;
  mes: number;
  nombre_mes: string;
  ya_pagado: boolean;
  monto: number;
  fecha_limite: string;
}

export default function RecaudacionPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [selectedPago, setSelectedPago] = useState<Pago | null>(null);
  const [sendingEmail, setSendingEmail] = useState<number | null>(null);
  const [downloading, setDownloading] = useState<number | null>(null);
  
  // Estados principales
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [pagos, setPagos] = useState<Pago[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalRecaudado: 0,
    pagosHoy: 0,
    recaudacionHoy: 0,
    comprobantesPendientes: 0,
    totalTransacciones: 0,
    promedioTicket: 0,
    pagosMesActual: 0,
    recaudacionMesActual: 0,
    clientesConDeuda: 0,
    totalDeudaPendiente: 0
  });
  
  // Estados del formulario
  const [selCli, setSelCli] = useState("");
  const [metodo_pago, setMetodoPago] = useState("");
  const [monto, setMonto] = useState("");
  const [concepto, setConcepto] = useState("");
  const [meses_pagar, setMesesPagar] = useState(1);
  
  // Estados de búsqueda y filtros
  const [searchTerm, setSearchTerm] = useState("");
  const [filterMetodo, setFilterMetodo] = useState("todos");
  const [filterEstado, setFilterEstado] = useState("todos");
  
  // Estados para búsqueda de clientes
  const [clienteSearchTerm, setClienteSearchTerm] = useState("");
  const [showClienteSearch, setShowClienteSearch] = useState(false);

  // Estados para paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [pagination, setPagination] = useState({
    page: 1,
    page_size: 50,
    total_count: 0,
    total_pages: 1,
    has_next: false,
    has_previous: false,
    next_page: null,
    previous_page: null
  });

  // Estados para filtros de exportación
  const [filtrosExportacion, setFiltrosExportacion] = useState({
    fecha_inicio: '',
    fecha_fin: '',
    metodo_pago: ''
  });

  // Estados para el sistema flexible de pagos
  const [mesesSeleccionados, setMesesSeleccionados] = useState<MesDisponible[]>([]);
  const [montoTotalSeleccionado, setMontoTotalSeleccionado] = useState(0);
  const [modoFlexible, setModoFlexible] = useState(false);

  // Cargar todos los datos
  const loadAll = async (page = 1, size = 50) => {
    setError("");
    setLoading(true);
    try {
      console.log('Iniciando carga de datos...');
      
      // Cargar clientes
      const clientesResponse = await fetch('http://localhost:8000/api/clientes/');
      if (!clientesResponse.ok) {
        throw new Error(`Error HTTP: ${clientesResponse.status}`);
      }
      const clientesData = await clientesResponse.json();
      console.log('Clientes cargados:', clientesData);
      
      let clientesActivos: Cliente[] = [];
      
      if (clientesData.success && clientesData.data && Array.isArray(clientesData.data)) {
        clientesActivos = clientesData.data.filter((c: Cliente) => c.estado === 'activo');
        setClientes(clientesActivos);
        console.log('Clientes activos:', clientesActivos.length);
      } else {
        console.warn('No se pudieron cargar los clientes o formato incorrecto');
        setClientes([]);
      }
      
      // Cargar pagos con paginación
      const pagosParams = new URLSearchParams({
        page: page.toString(),
        page_size: size.toString()
      });
      
      // Agregar filtros si están presentes
      if (searchTerm) {
        pagosParams.append('search', searchTerm);
      }
      if (filterMetodo && filterMetodo !== 'todos') {
        pagosParams.append('metodo_pago', filterMetodo);
      }
      if (filterEstado && filterEstado !== 'todos') {
        pagosParams.append('estado', filterEstado);
      }
      
      const pagosResponse = await fetch(`http://localhost:8000/api/pagos/?${pagosParams.toString()}`);
      if (!pagosResponse.ok) {
        throw new Error(`Error HTTP: ${pagosResponse.status}`);
      }
      const pagosData = await pagosResponse.json();
      console.log('Pagos cargados:', pagosData);
      
      if (pagosData.success && pagosData.data && Array.isArray(pagosData.data)) {
        const pagosConNombres = pagosData.data.map((pago: Pago) => {
          const cliente = clientesActivos.find((c: Cliente) => c.id === pago.cliente_id);
          return {
            ...pago,
            cliente_nombre: cliente ? `${cliente.nombres} ${cliente.apellidos}` : 'Cliente no encontrado'
          };
        });
        
        setPagos(pagosConNombres);
        console.log('Pagos con nombres:', pagosConNombres.length);
        
        // Actualizar información de paginación
        if (pagosData.pagination) {
          setPagination(pagosData.pagination);
          setCurrentPage(pagosData.pagination.page);
          setPageSize(pagosData.pagination.page_size);
        }
        
        // Calcular estadísticas básicas (usando todos los pagos, no solo la página actual)
        await calcularEstadisticasCompletas();
        
      } else {
        console.warn('No se pudieron cargar los pagos o formato incorrecto');
        setPagos([]);
        setStats(prev => ({
          ...prev,
          totalRecaudado: 0,
          totalTransacciones: 0,
          promedioTicket: 0,
          pagosHoy: 0,
          recaudacionHoy: 0,
          comprobantesPendientes: 0,
          pagosMesActual: 0,
          recaudacionMesActual: 0,
          clientesConDeuda: 0,
          totalDeudaPendiente: 0
        }));
      }
      
    } catch (error) {
      console.error('Error cargando datos:', error);
      setError(error instanceof Error ? error.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  // Función para calcular estadísticas completas
  const calcularEstadisticasCompletas = async () => {
    try {
      // Usar el nuevo endpoint de estadísticas
      const statsResponse = await fetch('http://localhost:8000/api/pagos/stats/');
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        
        if (statsData.success && statsData.data) {
          const data = statsData.data;
          
          setStats(prev => ({
            ...prev,
            totalRecaudado: data.total_recaudado || 0,
            totalTransacciones: data.total_pagos || 0,
            promedioTicket: data.promedio_ticket || 0,
            pagosHoy: data.pagos_hoy || 0,
            recaudacionHoy: data.recaudacion_hoy || 0,
            comprobantesPendientes: data.comprobantes_pendientes || 0,
            pagosMesActual: data.pagos_mes_actual || 0,
            recaudacionMesActual: data.recaudacion_mes_actual || 0,
            clientesConDeuda: 0, // Por ahora 0, se puede calcular después
            totalDeudaPendiente: 0 // Por ahora 0, se puede calcular después
          }));
        }
      }
    } catch (error) {
      console.error('Error calculando estadísticas:', error);
    }
  };

  // Función para manejar cambio de página
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    loadAll(page, pageSize);
  };

  // Función para manejar cambio de tamaño de página
  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1);
    loadAll(1, size);
  };

  // Función para manejar búsqueda
  const handleSearch = () => {
    setCurrentPage(1);
    loadAll(1, pageSize);
  };

  // Función para limpiar filtros
  const limpiarFiltros = () => {
    setSearchTerm("");
    setFilterMetodo("todos");
    setFilterEstado("todos");
    setCurrentPage(1);
    loadAll(1, pageSize);
  };

  // Función para actualizar filtros de exportación
  const actualizarFiltrosExportacion = () => {
    setFiltrosExportacion({
      fecha_inicio: '',
      fecha_fin: '',
      metodo_pago: filterMetodo !== 'todos' ? filterMetodo : ''
    });
  };

  // Funciones básicas
  const handleGoBack = () => {
    router.push("/dashboard");
  };

  const handleRefresh = () => {
    setSearchTerm("");
    setFilterMetodo("todos");
    setFilterEstado("todos");
    setCurrentPage(1);
    loadAll(1, pageSize);
  };

  // Función para registrar nuevo pago
  const handleRegistrarPago = async () => {
    if (!selCli || !metodo_pago || !monto || !concepto) {
      setError("Todos los campos son obligatorios");
      return;
    }

    try {
      let pagoData: any;

      if (modoFlexible && mesesSeleccionados.length > 0) {
        // Modo flexible con meses específicos
        pagoData = {
          cliente_id: parseInt(selCli),
          monto: parseFloat(monto),
          metodo_pago: metodo_pago,
          concepto: concepto,
          meses_seleccionados: mesesSeleccionados.map(mes => ({
            año: mes.año,
            mes: mes.mes,
            nombre_mes: mes.nombre_mes
          })),
          fecha_pago: new Date().toISOString().split('T')[0]
        };
      } else {
        // Modo tradicional
        pagoData = {
          cliente_id: parseInt(selCli),
          monto: parseFloat(monto),
          fecha_pago: new Date().toISOString().split('T')[0],
          metodo_pago: metodo_pago,
          concepto: concepto,
          estado: "completado",
          meses: meses_pagar
        };
      }

      const endpoint = modoFlexible ? '/api/pagos/flexible/' : '/api/pagos/create/';
      const response = await fetch(`http://localhost:8000${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(pagoData)
      });

      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        setSuccess(result.message || "Pago registrado exitosamente");
        // Limpiar formulario
        setSelCli("");
        setMetodoPago("");
        setMonto("");
        setConcepto("");
        setMesesSeleccionados([]);
        setMontoTotalSeleccionado(0);
        // Recargar datos
        loadAll(1, pageSize);
      } else {
        setError(result.message || "Error al registrar el pago");
      }
    } catch (error) {
      console.error('Error al registrar pago:', error);
      setError("Error al registrar el pago: " + (error instanceof Error ? error.message : 'Error desconocido'));
    }
  };

  const handleMesesSeleccionados = (meses: MesDisponible[]) => {
    setMesesSeleccionados(meses);
  };

  const handleMontoTotalChange = (monto: number) => {
    setMontoTotalSeleccionado(monto);
    setMonto(monto.toString());
  };

  // Función para calcular monto automáticamente
  const calcularMontoAutomatico = () => {
    if (selCli && meses_pagar > 0) {
      const clienteSeleccionado = clientes.find(c => c.id.toString() === selCli);
      if (clienteSeleccionado) {
        const montoCalculado = clienteSeleccionado.precio_plan * meses_pagar;
        setMonto(montoCalculado.toString());
        
        // Actualizar concepto automáticamente
        const conceptoCalculado = `Pago ${meses_pagar === 1 ? 'mensual' : `${meses_pagar} meses`} - ${clienteSeleccionado.tipo_plan}`;
        setConcepto(conceptoCalculado);
      }
    }
  };

  // Función para limpiar formulario
  const handleLimpiarFormulario = () => {
    setSelCli("");
    setMetodoPago("");
    setMonto("");
    setConcepto("");
    setMesesPagar(1);
    setError("");
    setClienteSearchTerm("");
    setShowClienteSearch(false);
  };

  // Función para seleccionar cliente desde la búsqueda
  const handleSelectCliente = (clienteId: string) => {
    setSelCli(clienteId);
    setShowClienteSearch(false);
    setClienteSearchTerm("");
  };

  // Función para abrir búsqueda de clientes
  const handleOpenClienteSearch = () => {
    setShowClienteSearch(true);
    setClienteSearchTerm("");
  };

  // Función para cerrar búsqueda de clientes
  const handleCloseClienteSearch = () => {
    setShowClienteSearch(false);
    setClienteSearchTerm("");
  };

  // Función para manejar clic fuera del área de búsqueda
  const handleClickOutside = (e: React.MouseEvent) => {
    if (showClienteSearch && !(e.target as Element).closest('.cliente-search-container')) {
      handleCloseClienteSearch();
    }
  };

  // Función para descargar comprobante
  const handleDescargarComprobante = async (pagoId: number) => {
    setDownloading(pagoId);
    try {
      const response = await fetch(`http://localhost:8000/api/pagos/${pagoId}/descargar/`);
      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }
      
      // Crear blob y descargar
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `comprobante_${pagoId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      setSuccess("Comprobante descargado exitosamente");
    } catch (error) {
      console.error('Error al descargar comprobante:', error);
      setError("Error al descargar el comprobante");
    } finally {
      setDownloading(null);
    }
  };

  // Función para enviar comprobante por email
  const handleEnviarComprobante = async (pagoId: number) => {
    setSendingEmail(pagoId);
    try {
      const response = await fetch(`http://localhost:8000/api/pagos/${pagoId}/enviar-email/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.success) {
        setSuccess("Comprobante enviado por email exitosamente");
      } else {
        setError(result.message || "Error al enviar el comprobante");
      }
    } catch (error) {
      console.error('Error al enviar comprobante:', error);
      setError("Error al enviar el comprobante por email");
    } finally {
      setSendingEmail(null);
    }
  };

  // Filtrar clientes para búsqueda
  const filteredClientes = clientes.filter(cliente => {
    if (!clienteSearchTerm) return true;
    
    const searchLower = clienteSearchTerm.toLowerCase();
    return (
      cliente.nombres.toLowerCase().includes(searchLower) ||
      cliente.apellidos.toLowerCase().includes(searchLower) ||
      cliente.cedula.includes(searchLower) ||
      cliente.email.toLowerCase().includes(searchLower) ||
      cliente.telefono.includes(searchLower)
    );
  });

  // Filtrar pagos
  const filteredPagos = pagos.filter(pago => {
    const matchesSearch = searchTerm === "" || 
      (pago.cliente_nombre && pago.cliente_nombre.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (pago.numero_comprobante && pago.numero_comprobante.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (pago.concepto && pago.concepto.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesMetodo = filterMetodo === "todos" || filterMetodo === "" || pago.metodo_pago === filterMetodo;
    const matchesEstado = filterEstado === "todos" || filterEstado === "" || pago.estado === filterEstado;
    
    return matchesSearch && matchesMetodo && matchesEstado;
  });

  useEffect(() => {
    const initializeData = async () => {
      try {
        await loadAll(1, pageSize);
      } catch (error) {
        console.error('Error en useEffect:', error);
        setError("Error al inicializar los datos");
        setLoading(false);
      }
    };
    
    initializeData();
  }, []);

  // Calcular monto automáticamente cuando cambie el cliente o los meses
  useEffect(() => {
    calcularMontoAutomatico();
  }, [selCli, meses_pagar]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <h2 className="text-xl font-semibold text-gray-700">Cargando sistema de recaudación...</h2>
        </div>
      </div>
    );
  }

  if (error && !clientes.length && !pagos.length) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-red-600" />
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Error al cargar datos</h2>
          <p className="text-gray-500 mb-4">{error}</p>
          <Button onClick={() => loadAll(1, pageSize)} variant="outline">
            Reintentar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6" onClick={handleClickOutside}>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" onClick={handleGoBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Sistema de Recaudación</h1>
            <p className="text-gray-600">Gestión de pagos y comprobantes</p>
          </div>
        </div>
        <Button onClick={handleRefresh} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          Actualizar
        </Button>
      </div>

      {/* Mensajes */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center">
            <AlertTriangle className="w-5 h-5 text-red-600 mr-2" />
            <span className="text-red-800">{error}</span>
            <Button variant="ghost" size="sm" onClick={() => setError("")} className="ml-auto">
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center">
            <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
            <span className="text-green-800">{success}</span>
            <Button variant="ghost" size="sm" onClick={() => setSuccess("")} className="ml-auto">
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Tarjetas de Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center text-white">
              <DollarSign className="w-5 h-5 mr-2" />
              Total Recaudado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.totalRecaudado.toLocaleString()}</div>
            <p className="text-blue-100 text-sm">Recaudación total</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center text-white">
              <Calendar className="w-5 h-5 mr-2" />
              Pagos Hoy
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pagosHoy}</div>
            <p className="text-green-100 text-sm">${stats.recaudacionHoy.toLocaleString()} recaudado</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center text-white">
              <BarChart3 className="w-5 h-5 mr-2" />
              Mes Actual
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pagosMesActual}</div>
            <p className="text-purple-100 text-sm">${stats.recaudacionMesActual.toLocaleString()} recaudado</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center text-white">
              <AlertTriangle className="w-5 h-5 mr-2" />
              Deuda Pendiente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.clientesConDeuda}</div>
            <p className="text-orange-100 text-sm">${stats.totalDeudaPendiente.toLocaleString()} por cobrar</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs principales */}
      <Tabs defaultValue="registrar" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="registrar" className="flex items-center">
            <Plus className="w-4 h-4 mr-2" />
            Registrar Pago
          </TabsTrigger>
          <TabsTrigger value="historial" className="flex items-center">
            <FileText className="w-4 h-4 mr-2" />
            Historial de Pagos
          </TabsTrigger>
          <TabsTrigger value="estadisticas" className="flex items-center">
            <PieChart className="w-4 h-4 mr-2" />
            Estadísticas
          </TabsTrigger>
        </TabsList>

        {/* Tab: Registrar Pago */}
        <TabsContent value="registrar">
          <Card>
            <CardHeader>
              <CardTitle>Registrar Nuevo Pago</CardTitle>
              <CardDescription>Complete los datos para registrar un nuevo pago</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Cliente con búsqueda */}
                <div className="space-y-2">
                  <Label htmlFor="cliente">Cliente *</Label>
                  <div className="relative">
                    {!showClienteSearch ? (
                      <div className="flex gap-2">
                        <Select value={selCli} onValueChange={setSelCli}>
                          <SelectTrigger className="flex-1">
                            <SelectValue placeholder="Seleccionar cliente" />
                          </SelectTrigger>
                          <SelectContent>
                            {clientes.map((cliente) => (
                              <SelectItem key={cliente.id} value={cliente.id.toString()}>
                                {cliente.nombres} {cliente.apellidos} - {cliente.cedula}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button 
                          type="button" 
                          variant={selCli ? "default" : "outline"}
                          size="icon"
                          onClick={handleOpenClienteSearch}
                          title="Buscar cliente"
                          className={selCli ? "bg-green-600 hover:bg-green-700" : ""}
                        >
                          <Search className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-2 cliente-search-container">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <Input
                            placeholder="Buscar por nombre, cédula, email o teléfono..."
                            value={clienteSearchTerm}
                            onChange={(e) => setClienteSearchTerm(e.target.value)}
                            className="pl-10 pr-10"
                            autoFocus
                          />
                          <Button 
                            type="button" 
                            variant="ghost" 
                            size="icon"
                            className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                            onClick={handleCloseClienteSearch}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                        
                        {/* Lista de clientes filtrados */}
                        {clienteSearchTerm ? (
                          <div className="max-h-60 overflow-y-auto border rounded-md bg-white">
                            <div className="p-2 bg-gray-50 border-b text-xs text-gray-600">
                              {filteredClientes.length} cliente{filteredClientes.length !== 1 ? 's' : ''} encontrado{filteredClientes.length !== 1 ? 's' : ''}
                            </div>
                            {filteredClientes.length > 0 ? (
                              filteredClientes.map((cliente) => (
                                <div
                                  key={cliente.id}
                                  className="p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                                  onClick={() => handleSelectCliente(cliente.id.toString())}
                                >
                                  <div className="font-medium text-gray-900">
                                    {cliente.nombres} {cliente.apellidos}
                                  </div>
                                  <div className="text-sm text-gray-600">
                                    Cédula: {cliente.cedula} | Plan: {cliente.tipo_plan}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    {cliente.email} | {cliente.telefono}
                                  </div>
                                </div>
                              ))
                            ) : (
                              <div className="p-3 text-center text-gray-500">
                                No se encontraron clientes
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="p-3 text-center text-gray-500 border rounded-md bg-gray-50">
                            <Search className="w-4 h-4 mx-auto mb-2" />
                            <div className="text-sm">Escriba para buscar clientes</div>
                            <div className="text-xs text-gray-400">Nombre, cédula, email o teléfono</div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Método de Pago */}
                <div className="space-y-2">
                  <Label htmlFor="metodo">Método de Pago *</Label>
                  <Select value={metodo_pago} onValueChange={setMetodoPago}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar método" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="efectivo">Efectivo</SelectItem>
                      <SelectItem value="transferencia">Transferencia</SelectItem>
                      <SelectItem value="tarjeta">Tarjeta</SelectItem>
                      <SelectItem value="cheque">Cheque</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Meses a Pagar */}
                <div className="space-y-2">
                  <Label htmlFor="meses">Meses a Pagar *</Label>
                  <Select value={meses_pagar.toString()} onValueChange={(value) => setMesesPagar(parseInt(value))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar meses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 mes</SelectItem>
                      <SelectItem value="2">2 meses</SelectItem>
                      <SelectItem value="3">3 meses</SelectItem>
                      <SelectItem value="6">6 meses</SelectItem>
                      <SelectItem value="12">12 meses</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Monto */}
                <div className="space-y-2">
                  <Label htmlFor="monto">Monto *</Label>
                  <Input
                    id="monto"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={monto}
                    onChange={(e) => setMonto(e.target.value)}
                    readOnly={selCli !== ""} // Solo lectura si hay cliente seleccionado
                  />
                </div>

                {/* Concepto */}
                <div className="space-y-2">
                  <Label htmlFor="concepto">Concepto *</Label>
                  <Input
                    id="concepto"
                    placeholder="Ej: Pago mensual - Plan Básico"
                    value={concepto}
                    onChange={(e) => setConcepto(e.target.value)}
                    readOnly={selCli !== ""} // Solo lectura si hay cliente seleccionado
                  />
                </div>
              </div>

              {/* Botones */}
              <div className="flex gap-4 mt-6">
                <Button onClick={handleRegistrarPago} className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  Registrar Pago
                </Button>
                <Button onClick={handleLimpiarFormulario} variant="outline" className="flex items-center gap-2">
                  <X className="w-4 h-4" />
                  Limpiar
                </Button>
              </div>

              {/* Selector de modo de pago */}
              <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <div className="flex items-center gap-4">
                  <Label className="font-medium">Modo de Pago:</Label>
                  <div className="flex gap-2">
                    <Button
                      variant={!modoFlexible ? "default" : "outline"}
                      size="sm"
                      onClick={() => setModoFlexible(false)}
                    >
                      Tradicional
                    </Button>
                    <Button
                      variant={modoFlexible ? "default" : "outline"}
                      size="sm"
                      onClick={() => setModoFlexible(true)}
                    >
                      Flexible (Selección de Meses)
                    </Button>
                  </div>
                </div>
              </div>

              {/* MonthSelector para modo flexible */}
              {modoFlexible && selCli && (
                <div className="mt-6">
                  <MonthSelector
                    clienteId={parseInt(selCli)}
                    onMesesSeleccionados={handleMesesSeleccionados}
                    onMontoTotalChange={handleMontoTotalChange}
                  />
                </div>
              )}

              {/* Información del cliente seleccionado */}
              {selCli && (
                <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-blue-900">Información del Cliente y Cálculo Automático</h4>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span className="text-sm text-green-700">Cliente seleccionado</span>
                    </div>
                  </div>
                  {(() => {
                    const clienteSeleccionado = clientes.find(c => c.id.toString() === selCli);
                    if (clienteSeleccionado) {
                      const precioPorMes = clienteSeleccionado.precio_plan;
                      const totalCalculado = precioPorMes * meses_pagar;
                      const ahorro = meses_pagar > 1 ? (precioPorMes * meses_pagar) - (precioPorMes * meses_pagar) : 0; // Por ahora sin descuento
                      
                      return (
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="font-medium">Nombre:</span> {clienteSeleccionado.nombres} {clienteSeleccionado.apellidos}
                            </div>
                            <div>
                              <span className="font-medium">Cédula:</span> {clienteSeleccionado.cedula}
                            </div>
                            <div>
                              <span className="font-medium">Plan:</span> {clienteSeleccionado.tipo_plan}
                            </div>
                            <div>
                              <span className="font-medium">Precio por Mes:</span> ${precioPorMes.toLocaleString()}
                            </div>
                          </div>
                          
                          <div className="border-t border-blue-200 pt-4">
                            <h5 className="font-medium text-blue-800 mb-2">Cálculo del Pago</h5>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                              <div className="bg-white p-3 rounded border">
                                <div className="font-medium text-gray-700">Meses a Pagar</div>
                                <div className="text-lg font-bold text-blue-600">{meses_pagar}</div>
                              </div>
                              <div className="bg-white p-3 rounded border">
                                <div className="font-medium text-gray-700">Precio por Mes</div>
                                <div className="text-lg font-bold text-green-600">${precioPorMes.toLocaleString()}</div>
                              </div>
                              <div className="bg-white p-3 rounded border">
                                <div className="font-medium text-gray-700">Total a Pagar</div>
                                <div className="text-lg font-bold text-purple-600">${totalCalculado.toLocaleString()}</div>
                              </div>
                            </div>
                          </div>
                          
                          {meses_pagar > 1 && (
                            <div className="bg-green-50 border border-green-200 rounded p-3">
                              <div className="flex items-center">
                                <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
                                <span className="text-green-800 text-sm">
                                  Pago por {meses_pagar} meses - Total: ${totalCalculado.toLocaleString()}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    }
                    return <p className="text-blue-700">Cliente no encontrado</p>;
                  })()}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Historial de Pagos */}
        <TabsContent value="historial">
          <Card>
            <CardHeader>
              <CardTitle>Historial de Pagos</CardTitle>
              <CardDescription>Gestión y visualización de todos los pagos registrados</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Búsqueda y Filtros */}
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Buscar por cliente, comprobante o concepto..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-10"
                  />
                </div>
                
                <Select value={filterMetodo} onValueChange={setFilterMetodo}>
                  <SelectTrigger className="w-full sm:w-48">
                    <Filter className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Método de pago" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos los métodos</SelectItem>
                    <SelectItem value="efectivo">Efectivo</SelectItem>
                    <SelectItem value="transferencia">Transferencia</SelectItem>
                    <SelectItem value="tarjeta">Tarjeta</SelectItem>
                    <SelectItem value="cheque">Cheque</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filterEstado} onValueChange={setFilterEstado}>
                  <SelectTrigger className="w-full sm:w-48">
                    <SelectValue placeholder="Estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos los estados</SelectItem>
                    <SelectItem value="completado">Completado</SelectItem>
                    <SelectItem value="pendiente">Pendiente</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Tabla de Pagos */}
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Comprobante</TableHead>
                      <TableHead>Monto</TableHead>
                      <TableHead>Método</TableHead>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPagos.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8">
                          <Receipt className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                          <p className="text-gray-500">No se encontraron pagos</p>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredPagos.map((pago) => (
                        <TableRow key={pago.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{pago.cliente_nombre || 'Cliente no encontrado'}</div>
                              <div className="text-sm text-gray-500">{pago.concepto || 'Sin concepto'}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="font-mono text-sm">{pago.numero_comprobante || 'Sin comprobante'}</div>
                          </TableCell>
                          <TableCell>
                            <div className="font-semibold">${(pago.monto || 0).toLocaleString()}</div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="capitalize">
                              {pago.metodo_pago || 'No especificado'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {pago.fecha_pago ? new Date(pago.fecha_pago).toLocaleDateString() : 'Fecha no disponible'}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={pago.comprobante_enviado ? "default" : "secondary"}>
                              {pago.comprobante_enviado ? "Enviado" : "Pendiente"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDescargarComprobante(pago.id)}
                                disabled={downloading === pago.id}
                                className="flex items-center gap-1"
                              >
                                {downloading === pago.id ? (
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                ) : (
                                  <Download className="w-3 h-3" />
                                )}
                                Imprimir
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleEnviarComprobante(pago.id)}
                                disabled={sendingEmail === pago.id}
                                className="flex items-center gap-1"
                              >
                                {sendingEmail === pago.id ? (
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                ) : (
                                  <Mail className="w-3 h-3" />
                                )}
                                Enviar
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
              
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
                  tipo="pagos"
                  filtros={filtrosExportacion}
                  className="ml-auto"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Estadísticas */}
        <TabsContent value="estadisticas">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Resumen General</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span>Total de Transacciones:</span>
                  <span className="font-semibold">{stats.totalTransacciones}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Promedio por Ticket:</span>
                  <span className="font-semibold">${stats.promedioTicket.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Comprobantes Pendientes:</span>
                  <span className="font-semibold">{stats.comprobantesPendientes}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Clientes con Deuda:</span>
                  <span className="font-semibold">{stats.clientesConDeuda}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Métodos de Pago</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {['efectivo', 'transferencia', 'tarjeta', 'cheque'].map((metodo) => {
                    const count = pagos.filter(p => p.metodo_pago === metodo).length;
                    const percentage = stats.totalTransacciones > 0 ? (count / stats.totalTransacciones) * 100 : 0;
                    
                    return (
                      <div key={metodo} className="flex items-center justify-between">
                        <div className="flex items-center">
                          <CreditCard className="w-4 h-4 mr-2" />
                          <span className="capitalize">{metodo}</span>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold">{count}</div>
                          <div className="text-sm text-gray-500">{percentage.toFixed(1)}%</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
