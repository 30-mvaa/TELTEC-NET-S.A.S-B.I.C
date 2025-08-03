// app/clientes/page.tsx
"use client"

import React, { useState, useEffect, ChangeEvent } from "react"
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
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Plus, Edit, Trash2 } from "lucide-react"
import { validarCedulaEcuatoriana, formatearCedula, validarMayorEdad, calcularEdad, obtenerFechaMinima, obtenerFechaMaxima, formatearFecha } from "@/lib/utils"
import { Switch } from '@/components/ui/switch'

// Definir planes con precio
const planes = [
  { label: "Plan Básico 15MB", precio: 10 },
  { label: "Plan Familiar 30MB", precio: 20 },
  
]

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
  fecha_creacion: string
  fecha_actualizacion: string
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

  const [clientes, setClientes] = useState<Cliente[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterEstado, setFilterEstado] = useState<Cliente["estado"] | "todos">("todos")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Cliente | null>(null)
  const [sectores, setSectores] = useState<string[]>([]);
  const [planes, setPlanes] = useState<{ tipo_plan: string, precio_plan: number }[]>([]);
  const [cedulaError, setCedulaError] = useState<string | null>(null);
  const [cedulaValida, setCedulaValida] = useState<boolean>(false);
  const [fechaError, setFechaError] = useState<string | null>(null);
  const [edadCalculada, setEdadCalculada] = useState<number | null>(null);
  // Estado para el toggle de contrato
  const [generarContrato, setGenerarContrato] = useState(true)

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

  useEffect(() => {
    const raw = localStorage.getItem("user")
    if (!raw) {
      router.push("/")
      return
    }
    loadData()
    fetch("/api/clientes/valores-unicos")
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setSectores(data.sectores);
          setPlanes(data.planes);
        }
      });
  }, [router])

  async function loadData() {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      if (searchTerm) params.set("search", searchTerm)
      if (filterEstado !== "todos") params.set("estado", filterEstado)
      const res = await fetch(`/api/clientes?${params.toString()}`)
      const json = await res.json()
      if (res.ok && json.success && Array.isArray(json.data)) {
        setClientes(json.data)
      } else {
        throw new Error(json.message || "Error cargando clientes")
      }
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  // Validar cédula en tiempo real
  const validarCedulaEnTiempoReal = (cedula: string) => {
    if (cedula.length === 0) {
      setCedulaError(null);
      setCedulaValida(false);
      return;
    }

    if (cedula.length < 10) {
      setCedulaError("La cédula debe tener 10 dígitos");
      setCedulaValida(false);
      return;
    }

    if (!/^\d+$/.test(cedula)) {
      setCedulaError("La cédula solo debe contener números");
      setCedulaValida(false);
      return;
    }

    if (cedula.length === 10) {
      if (validarCedulaEcuatoriana(cedula)) {
        setCedulaError(null);
        setCedulaValida(true);
      } else {
        setCedulaError("Cédula ecuatoriana inválida");
        setCedulaValida(false);
      }
    } else {
      setCedulaError("La cédula debe tener exactamente 10 dígitos");
      setCedulaValida(false);
    }
  };

  // Validar fecha de nacimiento en tiempo real
  const validarFechaNacimientoEnTiempoReal = (fecha: string) => {
    if (!fecha) {
      setFechaError(null);
      setEdadCalculada(null);
      return;
    }

    const fechaSeleccionada = new Date(fecha);
    const fechaMinima = new Date(obtenerFechaMinima());
    const fechaMaxima = new Date(obtenerFechaMaxima());

    if (fechaSeleccionada > fechaMinima) {
      setFechaError("El usuario debe ser mayor de 18 años");
      setEdadCalculada(null);
      return;
    }

    if (fechaSeleccionada < fechaMaxima) {
      setFechaError("La fecha de nacimiento no puede ser anterior a 100 años");
      setEdadCalculada(null);
      return;
    }

    const edad = calcularEdad(fecha);
    setFechaError(null);
    setEdadCalculada(edad);
  };

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
    setIsDialogOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validar cédula antes de enviar
    if (!validarCedulaEcuatoriana(formData.cedula)) {
      alert("Cédula ecuatoriana inválida. Por favor, verifique el número ingresado.")
      return
    }

    // Validar edad mínima
    if (!validarMayorEdad(formData.fecha_nacimiento)) {
      alert("El usuario debe ser mayor de 18 años.")
      return
    }

    // Validar email
    if (!/\S+@\S+\.\S+/.test(formData.email)) {
      alert("Email inválido.")
      return
    }

    // Validar duplicados solo al crear nuevo cliente
    if (!editing) {
      if (clientes.some(c => c.cedula === formData.cedula)) {
        alert("Ya existe un cliente con esta cédula")
        return
      }
      if (clientes.some(c => c.email === formData.email)) {
        alert("Ya existe un cliente con este email")
        return
      }
    }

    try {
      const method = editing ? "PUT" : "POST"
      const url = editing ? `/api/clientes/${editing.id}` : "/api/clientes"
      const body = editing ? { ...formData, id: editing.id } : formData

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      const json = await res.json()
      if (res.ok && json.success) {
        setIsDialogOpen(false)
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
        loadData()
        if (generarContrato && !editing) {
          console.log('🔄 Generando contrato PDF...')
          console.log('📋 Datos del cliente:', json.data)
          
          // Lógica para generar y descargar el contrato PDF
          const contratoRes = await fetch(`/api/clientes/contrato`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(json.data),
          })
          
          console.log('📊 Respuesta del servidor:', contratoRes.status, contratoRes.statusText)
          
          if (contratoRes.ok) {
            console.log('✅ Contrato generado exitosamente')
            const blob = await contratoRes.blob()
            console.log('📄 Blob creado:', blob.size, 'bytes')
            
            const url = window.URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `Contrato_${json.data.nombres}_${json.data.apellidos}.pdf`
            document.body.appendChild(a)
            a.click()
            a.remove()
            window.URL.revokeObjectURL(url)
            console.log('📥 Descarga iniciada')
          } else {
            console.error('❌ Error generando contrato:', contratoRes.status, contratoRes.statusText)
            const errorText = await contratoRes.text()
            console.error('📄 Error details:', errorText)
            alert('Cliente guardado, pero no se pudo generar el contrato PDF')
          }
        } else {
          console.log('ℹ️ No se generará contrato:', { generarContrato, editing })
        }
      } else {
        alert(json.message || "Error al guardar cliente")
      }
    } catch (e) {
      alert("Error de conexión")
    }
  }

  const handleEdit = (c: Cliente) => {
    setEditing(c)
    setFormData({
      cedula: c.cedula,
      nombres: c.nombres,
      apellidos: c.apellidos,
      tipo_plan: c.tipo_plan,
      precio_plan: c.precio_plan,
      fecha_nacimiento: c.fecha_nacimiento.split("T")[0],
      direccion: c.direccion,
      sector: c.sector,
      email: c.email,
      telefono: c.telefono,
      telegram_chat_id: c.telegram_chat_id || "",
      estado: c.estado,
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (id: number) => {
    if (!confirm("¿Eliminar cliente?")) return
    try {
      const res = await fetch("/api/clientes", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      })
      const json = await res.json()
      if (res.ok && json.success) loadData()
      else alert(json.message)
    } catch {
      alert("Error al eliminar")
    }
  }

  if (loading) return <div className="p-6 text-center">Cargando clientes...</div>
  if (error) return <div className="p-6 text-red-600">Error: {error}</div>

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
              <span>Volver</span>
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Gestión de Clientes</h1>
              <p className="text-slate-600">Administra los clientes de TelTec</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              onClick={openNew}
              className="bg-blue-600 hover:bg-blue-700 text-white flex items-center space-x-2"
            >
              <Plus className="h-4 w-4" />
              <span>Nuevo Cliente</span>
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="flex space-x-4 overflow-x-auto mb-6">
          {[
            "Total Clientes",
            "Activos",
            "Suspendidos",
            "Inactivos",
          ].map((title, i) => (
            <Card key={i} className="flex-1 min-w-[12rem]">
              <CardHeader>
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {i === 0
                    ? clientes.length
                    : i === 1
                    ? clientes.filter(c => c.estado === "activo").length
                    : i === 2
                    ? clientes.filter(c => c.estado === "suspendido").length
                    : clientes.filter(c => c.estado === "inactivo").length}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Buscador */}
        <div className="flex items-center mb-8 max-w-md space-x-2">
          <div className="relative flex-1">
            <Input
              placeholder="Buscar..."
              value={searchTerm}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                setSearchTerm(e.target.value)
              }
              onKeyDown={e => e.key === "Enter" && loadData()}
              className="w-full pr-10"
            />
          </div>
          <Button onClick={loadData}>Buscar</Button>
        </div>

        {/* Tabla */}
        <div className="overflow-x-auto bg-white rounded-xl shadow-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Precio</TableHead>
                <TableHead>Contacto</TableHead>
                <TableHead>Telegram</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clientes.map(c => (
                <TableRow key={c.id}>
                  <TableCell>
                    {c.nombres} {c.apellidos}
                  </TableCell>
                  <TableCell>{c.tipo_plan}</TableCell>
                  <TableCell>${c.precio_plan}</TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div>{c.email}</div>
                      <div className="text-gray-500 text-xs">
                        {formatearFecha(c.fecha_nacimiento)} ({calcularEdad(c.fecha_nacimiento)} años)
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {c.telegram_chat_id ? (
                        <div className="flex items-center space-x-1">
                          <span className="text-green-600">✓</span>
                          <span className="text-xs text-gray-600">Configurado</span>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-1">
                          <span className="text-gray-400">-</span>
                          <span className="text-xs text-gray-500">No configurado</span>
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={
                        c.estado === "activo"
                          ? "bg-green-100 text-green-800"
                          : c.estado === "suspendido"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-red-100 text-red-800"
                      }
                    >
                      {c.estado.charAt(0).toUpperCase() + c.estado.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell className="flex space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(c)}
                    >
                      <Edit />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(c.id)}
                    >
                      <Trash2 />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Modal de Nuevo/Editar */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild style={{ display: "none" }} />
          <DialogContent className="max-w-md w-full max-h-[85vh] overflow-auto">
            <DialogHeader>
              <DialogTitle>
                {editing ? "Editar Cliente" : "Nuevo Cliente"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="cedula">Cédula</Label>
                <Input
                  id="cedula"
                  value={formData.cedula}
                  onChange={e => {
                    const value = e.target.value;
                    if (/^\d*$/.test(value) && value.length <= 10) {
                      setFormData({ ...formData, cedula: value });
                      validarCedulaEnTiempoReal(value);
                    }
                  }}
                  maxLength={10}
                  required
                  disabled={!!editing}
                  className={`${cedulaError ? 'border-red-500 focus:border-red-500' : cedulaValida ? 'border-green-500 focus:border-green-500' : ''}`}
                />
                {cedulaError && (
                  <div className="text-red-600 text-sm mt-1 flex items-center">
                    <span className="mr-1">⚠️</span>
                    {cedulaError}
                  </div>
                )}
                {cedulaValida && (
                  <div className="text-green-600 text-sm mt-1 flex items-center">
                    <span className="mr-1">✅</span>
                    Cédula válida: {formatearCedula(formData.cedula)}
                  </div>
                )}
              </div>
              <div>
                <Label htmlFor="nombres">Nombres</Label>
                <Input
                  id="nombres"
                  value={formData.nombres}
                  onChange={e => {
                    const value = e.target.value;
                    if (/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]*$/.test(value)) {
                      setFormData({ ...formData, nombres: value });
                    }
                  }}
                  required
                />
              </div>

              <div>
                <Label htmlFor="apellidos">Apellidos</Label>
                <Input
                  id="apellidos"
                  value={formData.apellidos}
                  onChange={e => {
                    const value = e.target.value;
                    if (/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]*$/.test(value)) {
                      setFormData({ ...formData, apellidos: value });
                    }
                  }}
                  required
                />
              </div>

              <div>
                <Label htmlFor="tipo_plan">Plan</Label>
                <Select
                  value={formData.tipo_plan}
                  onValueChange={v => {
                    const plan = planes.find(p => p.tipo_plan === v)
                    setFormData({
                      ...formData,
                      tipo_plan: v,
                      precio_plan: plan?.precio_plan || 0,
                    })
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione plan" />
                  </SelectTrigger>
                  <SelectContent>
                    {planes
                      .filter(plan => plan.tipo_plan && plan.tipo_plan.trim() !== "")
                      .map(plan => (
                        <SelectItem key={plan.tipo_plan} value={plan.tipo_plan}>
                          {`${plan.tipo_plan} – $${plan.precio_plan}`}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="fecha_nacimiento">Fecha de Nacimiento</Label>
                <Input
                  id="fecha_nacimiento"
                  type="date"
                  value={formData.fecha_nacimiento}
                  onChange={e => {
                    const value = e.target.value;
                    setFormData({ ...formData, fecha_nacimiento: value });
                    validarFechaNacimientoEnTiempoReal(value);
                  }}
                  min={obtenerFechaMaxima()}
                  max={obtenerFechaMinima()}
                  required
                  className={`${fechaError ? 'border-red-500 focus:border-red-500' : ''}`}
                />
                {fechaError && (
                  <div className="text-red-600 text-sm mt-1 flex items-center">
                    <span className="mr-1">⚠️</span>
                    {fechaError}
                  </div>
                )}
                {edadCalculada !== null && (
                  <div className="text-green-600 text-sm mt-1 flex items-center">
                    <span className="mr-1">✅</span>
                    Edad: {edadCalculada} años
                  </div>
                )}
                
                
              </div>
              <div>
                <Label htmlFor="direccion">Dirección</Label>
                <Input
                  id="direccion"
                  value={formData.direccion}
                  onChange={e =>
                    setFormData({ ...formData, direccion: e.target.value })
                  }
                />
              </div>
              <div>
                <Label htmlFor="sector">Sector</Label>
                <Select
                  value={formData.sector}
                  onValueChange={v => setFormData({ ...formData, sector: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione sector" />
                  </SelectTrigger>
                  <SelectContent>
                    {sectores
                      .filter(sector => sector && sector.trim() !== "")
                      .map(sector => (
                        <SelectItem key={sector} value={sector}>{sector}</SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={e =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  required
                  disabled={!!editing}
                />
              </div>

              <div>
                <Label htmlFor="telefono">Teléfono</Label>
                <Input
                  id="telefono"
                  value={formData.telefono}
                  onChange={e => {
                    const value = e.target.value;
                    if (/^\d*$/.test(value)) {
                      setFormData({ ...formData, telefono: value });
                    }
                  }}
                  maxLength={10} // Opcional: para limitar a 10 dígitos
                  required
                />
              </div>

              <div>
                <Label htmlFor="telegram_chat_id">
                  Chat ID de Telegram 
                  <span className="text-gray-500 text-xs ml-1">(Opcional)</span>
                </Label>
                <Input
                  id="telegram_chat_id"
                  value={formData.telegram_chat_id}
                  onChange={e => {
                    const value = e.target.value;
                    // Permitir solo números y caracteres válidos para chat_id
                    if (/^[0-9-]*$/.test(value)) {
                      setFormData({ ...formData, telegram_chat_id: value });
                    }
                  }}
                  placeholder="Ej: 123456789 o -1001234567890"
                  className="text-sm"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Para recibir notificaciones por Telegram. Dejar vacío si no desea notificaciones.
                </p>
              </div>

              <div>
                <Label htmlFor="estado">Estado</Label>
                <Select
                  value={formData.estado}
                  onValueChange={v =>
                    setFormData({ ...formData, estado: v as Cliente["estado"] })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="activo">Activo</SelectItem>
                    <SelectItem value="suspendido">Suspendido</SelectItem>
                    <SelectItem value="inactivo">Inactivo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <Switch id="generar-contrato" checked={generarContrato} onCheckedChange={setGenerarContrato} />
                <Label htmlFor="generar-contrato">Generar contrato automáticamente</Label>
              </div>
              <DialogFooter className="flex justify-end space-x-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit">{editing ? "Actualizar" : "Guardar"}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
