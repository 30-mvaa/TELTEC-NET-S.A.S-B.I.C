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
    estado: "activo",
  })

  useEffect(() => {
    const raw = localStorage.getItem("user")
    if (!raw) {
      router.push("/")
      return
    }
    loadData()
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
      estado: "activo",
    })
    setIsDialogOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!/^[0-9]{10}$/.test(formData.cedula)) {
      alert("Cédula inválida: debe contener 10 dígitos numéricos.")
      return
    }
    if (!/\S+@\S+\.\S+/.test(formData.email)) {
      alert("Email inválido.")
      return
    }
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
      const body = editing ? { id: editing.id, ...formData } : formData
      const res = await fetch("/api/clientes", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      const json = await res.json()
      if (res.ok && json.success) {
        setIsDialogOpen(false)
        loadData()
      } else {
        alert(json.message)
      }
    } catch {
      alert("Error al guardar cliente")
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
            <Button variant="outline" onClick={() => router.push("/dashboard")}>
              <ArrowLeft /> Volver
            </Button>
            <h1 className="text-4xl font-bold">👥 Gestión de Clientes</h1>
          </div>
          <Button
            onClick={openNew}
            className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Plus />
            <span>Nuevo Cliente</span>
          </Button>
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
                  <TableCell>{c.email}</TableCell>
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
                    if (/^\d*$/.test(value)) {
                      setFormData({ ...formData, cedula: value });
                    }
                  }}
                  maxLength={10} // Opcional: máximo 10 dígitos
                  required
                  disabled={!!editing}
                />
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
                    const plan = planes.find(p => p.label === v)
                    setFormData({
                      ...formData,
                      tipo_plan: v,
                      precio_plan: plan?.precio || 0,
                    })
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione plan" />
                  </SelectTrigger>
                  <SelectContent>
                    {planes.map(p => (
                      <SelectItem key={p.label} value={p.label}>
                        {`${p.label} – $${p.precio}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="fecha_nacimiento">Nacimiento</Label>
                <Input
                  id="fecha_nacimiento"
                  type="date"
                  value={formData.fecha_nacimiento}
                  onChange={e =>
                    setFormData({ ...formData, fecha_nacimiento: e.target.value })
                  }
                  required
                />
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
                    <SelectItem value="Atu la virgen">Atu la virgen</SelectItem>
                    <SelectItem value="Cagunapamba">Cagunapamba</SelectItem>
                    <SelectItem value="Cañar centro">Cañar centro</SelectItem>
                    <SelectItem value="churu huayco">churu huayco</SelectItem>
                    <SelectItem value="Cullca loma">Cullca loma</SelectItem>
                     <SelectItem value="Cullca loma">Ingapirca</SelectItem>
                    <SelectItem value="Galuay">Galuay</SelectItem>
                    <SelectItem value="Honorato">Honorato</SelectItem>
                    <SelectItem value="Mulupata">Mulupata</SelectItem>
                    <SelectItem value="San jose">San jose</SelectItem>
                    <SelectItem value="Sisid anejo">Sisid anejo</SelectItem>
                    <SelectItem value="Sisid Centro">Sisid Centro</SelectItem>
                    <SelectItem value="Tambo">Tambo</SelectItem>
                    <SelectItem value="Tambo - Laguna">Tambo - Laguna</SelectItem>
                    <SelectItem value="Tranca">Tranca</SelectItem>
                    <SelectItem value="Vende leche">Vende leche</SelectItem>

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
