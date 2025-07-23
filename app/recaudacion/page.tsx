// app/recaudacion/page.tsx
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
import { Label } from "@/components/ui/label";
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
  Plus,
  Search,
  Mail,
  Printer,
  Download,
  FileText,
  Calendar,
  DollarSign,
  FileText as ReportIcon,
  User,
  Wifi,
  CreditCard,
} from "lucide-react";

type Cliente = {
  id: number;
  cedula: string;
  nombres: string;
  apellidos: string;
  tipo_plan: string;
  precio_plan: number;
  email: string;
};

type Pago = {
  id: number;
  cliente_id: number;
  cliente_nombre: string;
  cliente_email: string;
  cliente_cedula: string;
  tipo_plan: string;
  monto: number;
  fecha_pago: string;
  metodo_pago: string;
  concepto: string;
  estado: "completado" | "pendiente" | "fallido";
  comprobante_enviado: boolean;
  numero_comprobante: string;
};

interface Stats {
  totalRecaudado: number;
  pagosHoy: number;
  recaudacionHoy: number;
  comprobantesPendientes: number;
  totalTransacciones: number;
  promedioTicket: number;
}

export default function RecaudacionPage() {
  const router = useRouter();

  // Datos
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [pagos, setPagos] = useState<Pago[]>([]);
  const [filtered, setFiltered] = useState<Pago[]>([]);

  // Filtros
  const [searchTerm, setSearchTerm] = useState("");
  const [fMetodo, setFMetodo] = useState("todos");
  const [fEstado, setFEstado] = useState("todos");

  // Modal + Form
  const [isOpen, setIsOpen] = useState(false);
  const [selCli, setSelCli] = useState<Cliente | null>(null);
  const [form, setForm] = useState({
    cliente_id: 0,
    monto: 0,
    metodo_pago: "",
    concepto: "",
  });

  // Estadísticas
  const [stats, setStats] = useState<Stats>({
    totalRecaudado: 0,
    pagosHoy: 0,
    recaudacionHoy: 0,
    comprobantesPendientes: 0,
    totalTransacciones: 0,
    promedioTicket: 0,
  });

  const [loading, setLoading] = useState(false);

  // Estado para los meses que se están pagando
  const [mesesPagados, setMesesPagados] = useState<{ mes: number, año: number }[]>([])

  // Carga inicial
  useEffect(() => {
    if (!localStorage.getItem("user")) {
      router.push("/");
      return;
    }
    loadAll();
  }, [router]);

  // Filtrar pagos
  useEffect(() => {
    let tmp = pagos.slice();
    if (searchTerm) {
      const t = searchTerm.toLowerCase();
      tmp = tmp.filter(
        (p) =>
          p.cliente_nombre.toLowerCase().includes(t) ||
          p.numero_comprobante.toLowerCase().includes(t) ||
          p.concepto.toLowerCase().includes(t)
      );
    }
    if (fMetodo !== "todos") tmp = tmp.filter((p) => p.metodo_pago === fMetodo);
    if (fEstado !== "todos") tmp = tmp.filter((p) => p.estado === fEstado);
    setFiltered(tmp);
  }, [pagos, searchTerm, fMetodo, fEstado]);

  // Carga de datos
  async function loadAll() {
    setLoading(true);
    const [cRes, pRes, eRes] = await Promise.all([
      fetch("/api/clientes"),
      fetch("/api/recaudacion"),
      fetch("/api/recaudacion?onlyStats=1"),
    ]);
    const cJson = await cRes.json();
    const pJson = await pRes.json();
    const eJson = await eRes.json();

    if (cRes.ok && cJson.success) setClientes(cJson.data);
    if (pRes.ok && pJson.success) setPagos(pJson.data);
    if (eRes.ok && eJson.success) {
      const d = eJson.data;
      setStats({
        totalRecaudado: Number(d.total_recaudado),
        pagosHoy: Number(d.pagos_mes_actual),
        recaudacionHoy: Number(d.recaudado_mes_actual),
        comprobantesPendientes: Number(d.comprobantes_pendientes ?? 0),
        totalTransacciones: Number(d.total_pagos),
        promedioTicket: Number(d.promedio_pago),
      });
    }
    setLoading(false);
  }

  // Selección cliente
  async function onSelectCli(id: string) {
    const c = clientes.find((x) => x.id === Number(id));
    if (!c) return;
    try {
      const deudaRes = await fetch(`/api/deudas?action=monto-pagar&clienteId=${c.id}`);
      const deudaData = await deudaRes.json();
      // Obtener cuotas pendientes/vencidas
      const cuotasRes = await fetch(`/api/deudas?action=cuotas&clienteId=${c.id}`);
      const cuotasData = await cuotasRes.json();
      setSelCli(c);
      let montoAPagar = Number(c.precio_plan);
      let concepto = `Pago mensual - ${c.tipo_plan}`;
      let mesesCubiertos: { mes: number, año: number }[] = [];
      if (deudaData.success && deudaData.data) {
        const { monto_base, multas, total, cuotas_vencidas } = deudaData.data;
        if (cuotas_vencidas > 0 && cuotasData.success && Array.isArray(cuotasData.data)) {
          // Filtrar cuotas vencidas o pendientes
          const cuotasPendientes = cuotasData.data.filter((q: any) => q.estado === 'vencido' || q.estado === 'pendiente');
          // Ordenar por año y mes ascendente
          cuotasPendientes.sort((a: any, b: any) => a.año !== b.año ? a.año - b.año : a.mes - b.mes);
          // Tomar los primeros N meses según cuotas_vencidas
          mesesCubiertos = cuotasPendientes.slice(0, cuotas_vencidas).map((q: any) => ({ mes: q.mes, año: q.año }));
          montoAPagar = total;
          concepto = `Pago mensual + ${cuotas_vencidas} mes(es) vencido(s) + multas - ${c.tipo_plan}`;
        }
      }
      setMesesPagados(mesesCubiertos);
      setForm({
        cliente_id: c.id,
        monto: montoAPagar,
        metodo_pago: "",
        concepto: concepto,
      });
    } catch (error) {
      console.error("Error obteniendo información de deudas:", error);
      setSelCli(c);
      setForm({
        cliente_id: c.id,
        monto: Number(c.precio_plan),
        metodo_pago: "",
        concepto: `Pago mensual - ${c.tipo_plan}`,
      });
      setMesesPagados([]);
    }
  }

  // Guardar pago
  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selCli) {
      alert("Seleccione un cliente");
      return;
    }
    setLoading(true);
    const res = await fetch("/api/recaudacion", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const j = await res.json();
    if (res.ok && j.success) {
      await loadAll();
      setIsOpen(false);
      setSelCli(null);
      setForm({ cliente_id: 0, monto: 0, metodo_pago: "", concepto: "" });
      alert(j.message + "\nEl comprobante será enviado automáticamente al correo del cliente.");
    } else {
      alert(j.message);
    }
    setLoading(false);
  }

  // Enviar comprobante
  async function onSend(p: Pago) {
    const res = await fetch("/api/recaudacion", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: p.id }),
    });
    if (res.ok) {
      await loadAll();
      alert("Comprobante enviado");
    }
  }

  // Badge de estado
  function badge(e: string) {
    if (e === "completado")
      return <Badge className="bg-green-100 text-green-800">Completado</Badge>;
    if (e === "pendiente")
      return <Badge className="bg-yellow-100 text-yellow-800">Pendiente</Badge>;
    return <Badge className="bg-red-100 text-red-800">Fallido</Badge>;
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
            <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">
              Sistema de Recaudación
            </h1>
            <p className="text-slate-600 text-lg">
              Gestión inteligente de pagos y comprobantes
            </p>
          </div>
        </div>
        <div className="flex gap-2 items-center mt-2">
          <Button
            onClick={() => setIsOpen(true)}
            className="bg-green-500 text-white flex items-center"
          >
            <Plus className="mr-1" /> Registrar Pago
          </Button>
        </div>
      </div>

      

      {/* Estadísticas en una única fila */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <Card className="bg-green-500 text-white flex items-center px-6 py-4">
          <DollarSign className="h-6 w-6 mr-3" />
          <div>
            <div className="text-2xl font-bold">${stats.totalRecaudado.toLocaleString()}</div>
            <div className="text-sm">Total Recaudado</div>
          </div>
        </Card>
        <Card className="bg-gray-500 text-white flex items-center px-6 py-4">
          <Calendar className="h-6 w-6 mr-3" />
          <div>
            <div className="text-2xl font-bold">{stats.pagosHoy}</div>
            <div className="text-sm">Pagos del Día</div>
          </div>
        </Card>
        <Card className="bg-yellow-500 text-white flex items-center px-6 py-4">
          <Mail className="h-6 w-6 mr-3" />
          <div>
            <div className="text-2xl font-bold">{stats.comprobantesPendientes}</div>
            <div className="text-sm">Pendientes</div>
          </div>
        </Card>
        <Card className="bg-purple-500 text-white flex items-center px-6 py-4">
          <FileText className="h-6 w-6 mr-3" />
          <div>
            <div className="text-2xl font-bold">{stats.totalTransacciones}</div>
            <div className="text-sm">Transacciones</div>
          </div>
        </Card>
      </div>

      {/* Filtros */}
      <div className="flex flex-col md:flex-row items-center gap-4 bg-white p-4 rounded-lg shadow mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <Input
            className="pl-10"
            placeholder="Buscar por cliente, concepto o comprobante..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="w-full md:w-48">
          <Select value={fMetodo} onValueChange={setFMetodo}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Todos los métodos" />
            </SelectTrigger>
            <SelectContent>
              {["todos", "Efectivo", "Transferencia", "Tarjeta", "Cheque"].map((m) => (
                <SelectItem key={m} value={m}>
                  {m}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="w-full md:w-48">
          <Select value={fEstado} onValueChange={setFEstado}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Todos los estados" />
            </SelectTrigger>
            <SelectContent>
              {["todos", "completado", "pendiente", "fallido"].map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="pagos" className="space-y-6">
        <TabsList>
          <TabsTrigger value="pagos">Registro de Pagos</TabsTrigger>
          <TabsTrigger value="reportes">Reportes</TabsTrigger>
        </TabsList>

        {/* Registro de Pagos */}
        <TabsContent value="pagos" className="space-y-4">
          <Table className="bg-white shadow rounded-lg overflow-hidden">
            <TableHeader>
              <TableRow>
                <TableHead>
                  Comprobante
                </TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Método</TableHead>
                <TableHead>Monto</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="text-blue-600 font-medium">
                    {p.numero_comprobante}
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{p.cliente_nombre}</div>
                    <div className="text-sm text-gray-500">CI: {p.cliente_cedula}</div>
                  </TableCell>
                  <TableCell>
                    <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                      {p.tipo_plan}
                    </Badge>
                  </TableCell>
                  <TableCell>{p.fecha_pago}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="border-slate-300">
                      {p.metodo_pago}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-green-600 font-semibold">
                    ${p.monto.toFixed(2)}
                  </TableCell>
                  <TableCell>{badge(p.estado)}</TableCell>
                  <TableCell className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        window.open(`/api/recaudacion/print/${p.id}`, "_blank")
                      }
                    >
                      <Printer className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={p.comprobante_enviado}
                      onClick={() => onSend(p)}
                    >
                      <Mail className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TabsContent>

        {/* Reportes */}
        <TabsContent value="reportes">
          <Card className="bg-white shadow rounded-lg">
            <CardHeader>
              <CardTitle>Recaudación por Método</CardTitle>
            </CardHeader>
            <CardContent>
              {["Efectivo", "Transferencia"].map((m) => {
                const arr = pagos.filter(
                  (x) => x.metodo_pago === m && x.estado === "completado"
                );
                const total = arr.reduce((sum, x) => sum + x.monto, 0);
                const pct =
                  stats.totalRecaudado > 0
                    ? (total / stats.totalRecaudado) * 100
                    : 0;
                return (
                  <div key={m} className="mb-4">
                    <div className="flex justify-between">
                      <span className="font-medium">{m}</span>
                      <span className="font-semibold text-green-600">
                        ${total.toLocaleString()}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-500 h-2 rounded-full"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <p className="text-sm text-gray-600">
                      {arr.length} transacciones ({pct.toFixed(1)}%)
                    </p>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modal Registrar Pago */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger hidden />
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Registrar Pago</DialogTitle>
          </DialogHeader>
          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <Label>Cliente</Label>
              <Select value={String(form.cliente_id)} onValueChange={onSelectCli}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Seleccione cliente" />
                </SelectTrigger>
                <SelectContent>
                  {clientes
                    .filter(c => c.id && c.nombres && c.apellidos)
                    .map((c) => (
                      <SelectItem key={c.id} value={String(c.id)}>
                        <div className="flex items-center gap-2">
                          <User className="text-blue-500" />
                          {c.nombres} {c.apellidos}
                        </div>
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            {selCli && (
              <Card className="bg-blue-50 border-blue-200">
                <CardContent>
                  <div className="flex items-center gap-2 mb-2">
                    <Wifi className="text-blue-500" /> Plan:{" "}
                    <strong>{selCli.tipo_plan}</strong>
                  </div>
                  <div className="flex items-center gap-2">
                    <CreditCard className="text-green-500" /> Monto:{" "}
                    <strong>${Number(selCli.precio_plan).toFixed(2)}</strong>
                  </div>
                </CardContent>
              </Card>
            )}

            <div>
              <Label>Monto</Label>
              <Input value={form.monto} disabled className="bg-gray-100" />
            </div>

            <div>
              <Label>Método</Label>
              <Select
                value={form.metodo_pago}
                onValueChange={(v) => setForm({ ...form, metodo_pago: v })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Seleccione método" />
                </SelectTrigger>
                <SelectContent>
                  {["Efectivo", "Transferencia"].map((m) => (
                    <SelectItem key={m} value={m}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Concepto</Label>
              <Input
                value={form.concepto}
                onChange={(e) => setForm({ ...form, concepto: e.target.value })}
                placeholder="Descripción del pago"
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={!selCli || loading}>
                {loading ? "Guardando…" : "Guardar"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
      {mesesPagados.length > 0 && (
        <div className="mt-2 text-blue-700 text-sm font-semibold">
          Pagando: {mesesPagados.map(({ mes, año }) => `${getMonthName(mes)} ${año}`).join(', ')}
        </div>
      )}
    </div>
  );
}

function getMonthName(mes: number) {
  const meses = ["", "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
  return meses[mes] || "";
}
