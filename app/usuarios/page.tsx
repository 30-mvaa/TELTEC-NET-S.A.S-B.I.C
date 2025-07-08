"use client"

import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Plus, Search, Edit, Trash2, Shield, Eye, EyeOff } from "lucide-react"

interface Usuario {
  id: number
  email: string
  nombre: string
  rol: "administrador" | "economia" | "atencion_cliente"
  activo: boolean
  fecha_creacion: string
}

type FormData = {
  email: string
  nombre: string
  rol: Usuario['rol']
  activo: boolean
  password: string
  confirmPassword: string
}

export default function UsuariosPage() {
  const router = useRouter()
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [search, setSearch] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Usuario | null>(null)
  const [form, setForm] = useState<FormData>({ email: "", nombre: "", rol: "atencion_cliente", activo: true, password: "", confirmPassword: "" })
  const [showPwd, setShowPwd] = useState(false)

  useEffect(() => {
    const raw = localStorage.getItem("user")
    if (!raw) { router.push('/'); return }
    const user = JSON.parse(raw)
    if (user.role !== 'administrador') { router.push('/dashboard'); return }
    fetchUsuarios()
  }, [router])

  const fetchUsuarios = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/usuarios')
      const json = await res.json()
      if (!res.ok || !json.success) throw new Error(json.message || 'Error cargando usuarios')
      setUsuarios(json.data)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div className="p-4">Cargando usuarios...</div>
  if (error) return <div className="p-4 text-red-600">Error: {error}</div>

  const term = search.trim().toLowerCase()
  const filtered = usuarios.filter(u =>
    u.nombre.toLowerCase().includes(term) ||
    u.email.toLowerCase().includes(term) ||
    u.rol.toLowerCase().includes(term)
  )

  const stats = [
    { title: 'Total Usuarios', value: usuarios.length, color: 'gray' },
    { title: 'Activos', value: usuarios.filter(u => u.activo).length, color: 'green' },
    { title: 'Inactivos', value: usuarios.filter(u => !u.activo).length, color: 'red' }
  ]
  const roles = [
    { title: 'Administradores', value: usuarios.filter(u => u.rol === 'administrador').length, color: 'red' },
    { title: 'Economía', value: usuarios.filter(u => u.rol === 'economia').length, color: 'blue' },
    { title: 'Atención Cliente', value: usuarios.filter(u => u.rol === 'atencion_cliente').length, color: 'green' }
  ]

  const openNew = () => {
    setEditing(null)
    setForm({ email: "", nombre: "", rol: "atencion_cliente", activo: true, password: "", confirmPassword: "" })
    setDialogOpen(true)
  }
  const openEdit = (u: Usuario) => {
    setEditing(u)
    setForm({ email: u.email, nombre: u.nombre, rol: u.rol, activo: u.activo, password: "", confirmPassword: "" })
    setDialogOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editing && (form.password !== form.confirmPassword || !form.password)) {
      alert('Contraseñas deben coincidir')
      return
    }
    if (usuarios.some(u => u.email === form.email && u.id !== editing?.id)) {
      alert('Email ya registrado')
      return
    }
    const method = editing ? 'PUT' : 'POST'
    const payload = editing
      ? { id: editing.id, nombre: form.nombre, rol: form.rol, activo: form.activo }
      : { email: form.email, nombre: form.nombre, rol: form.rol, activo: form.activo, password: form.password }
    const res = await fetch('/api/usuarios', { method, headers: { 'Content-Type':'application/json' }, body: JSON.stringify(payload) })
    const json = await res.json()
    if (res.ok && json.success) {
      setDialogOpen(false)
      fetchUsuarios()
    } else {
      alert(json.message)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('¿Eliminar este usuario?')) return
    const res = await fetch('/api/usuarios', { method:'DELETE', headers:{ 'Content-Type':'application/json'}, body: JSON.stringify({ id }) })
    const json = await res.json()
    if (res.ok && json.success) fetchUsuarios()
    else alert(json.message)
  }

  const toggleActivo = async (u: Usuario) => {
    const res = await fetch('/api/usuarios', { method:'PUT', headers:{ 'Content-Type':'application/json' }, body: JSON.stringify({ id: u.id, activo: !u.activo }) })
    const json = await res.json()
    if (res.ok && json.success) fetchUsuarios()
    else alert(json.message)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center space-x-4">
            <Button variant="outline" onClick={() => router.push('/dashboard')}><ArrowLeft /> Volver</Button>
            <h1 className="text-2xl font-bold">Gestión de Usuarios</h1>
          </div>
          <Button onClick={openNew} className="bg-blue-600 hover:bg-blue-700 text-white"><Plus /> Nuevo</Button>
        </div>

        <div className="flex space-x-4 overflow-x-auto mb-6">
          {stats.map(s => (
            <Card key={s.title} className="flex-1 bg-green-500 text-white">
              <CardHeader><CardTitle className="text-sm">{s.title}</CardTitle></CardHeader>
              <CardContent><div className="text-2xl font-bold text-white">{s.value}</div></CardContent>
            </Card>
          ))}
        </div>

        <div className="flex space-x-4 overflow-x-auto mb-8">
          {roles.map(r => (
            <Card key={r.title} className="flex-1 bg-gray-700 text-white">
              <CardHeader><CardTitle className="text-sm">{r.title}</CardTitle></CardHeader>
              <CardContent><div className="text-2xl font-bold text-white">{r.value}</div></CardContent>
              
            </Card>
          ))}
        </div>

        <div className="mb-6 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-3 text-gray-400" />
            <Input placeholder="Buscar..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Rol</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map(u => (
              <TableRow key={u.id}>
                <TableCell>{u.nombre}</TableCell>
                <TableCell>{u.email}</TableCell>
                <TableCell>
                  {u.rol === 'administrador'
                    ? <Badge className="bg-red-100 text-red-800">Administrador</Badge>
                    : u.rol === 'economia'
                      ? <Badge className="bg-blue-100 text-blue-800">Economía</Badge>
                      : <Badge className="bg-green-100 text-green-800">Atención Cliente</Badge>}
                </TableCell>
                <TableCell>
                  <Badge className={u.activo ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                    {u.activo ? 'Activo' : 'Inactivo'}
                  </Badge>
                </TableCell>
                <TableCell className="flex space-x-2">
                  <Button size="sm" variant="outline" onClick={() => openEdit(u)}><Edit /></Button>
                  <Button size="sm" variant="outline" onClick={() => toggleActivo(u)}>
                    {u.activo ? 'Desactivar' : 'Activar'}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleDelete(u.id)}><Trash2 /></Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle><Shield className="inline mr-2" /> {editing ? 'Editar Usuario' : 'Nuevo Usuario'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 p-4">
              {!editing && (
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
                </div>
              )}
              <div>
                <Label htmlFor="nombre">Nombre Completo</Label>
                <Input id="nombre" value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} required />
              </div>
              <div>
                <Label htmlFor="rol">Rol</Label>
                <Select value={form.rol} onValueChange={v => setForm({ ...form, rol: v as Usuario['rol'] })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="administrador">Administrador</SelectItem>
                    <SelectItem value="economia">Economía</SelectItem>
                    <SelectItem value="atencion_cliente">Atención Cliente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {!editing && (
                <>
                  <div>
                    <Label htmlFor="password">Contraseña</Label>
                    <div className="relative">
                      <Input id="password" type={showPwd ? 'text' : 'password'} value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required />
                      <Button type="button" variant="ghost" className="absolute right-2 top-2 p-0" onClick={() => setShowPwd(s => !s)}>
                        {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="confirmPassword">Confirmar Contraseña</Label>
                    <Input id="confirmPassword" type="password" value={form.confirmPassword} onChange={e => setForm({ ...form, confirmPassword: e.target.value })} required />
                  </div>
                </>
              )}
              <div className="flex items-center space-x-2">
                <input id="activo" type="checkbox" checked={form.activo} onChange={e => setForm({ ...form, activo: e.target.checked })} className="rounded" />
                <Label htmlFor="activo">Usuario Activo</Label>
              </div>
              <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
                <Button type="submit">{editing ? 'Actualizar' : 'Crear'}</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
