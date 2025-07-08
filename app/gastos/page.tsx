"use client"

import React, { useState, useEffect, ChangeEvent } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import {
  ArrowLeft,
  Plus,
  Search,
  Edit,
  Trash2,
  Receipt,
  TrendingDown,
  Calendar,
  Building,
  Truck,
  Wrench,
  FileText,
  Download,
} from "lucide-react"

interface Gasto {
  id: number
  descripcion: string
  categoria: string
  monto: number
  fecha_gasto: string
  proveedor: string
  metodo_pago: string
  comprobante_url?: string
  usuario_id: number
  usuario_nombre: string
  fecha_creacion: string
}

export default function GastosPage() {
  const router = useRouter()
  const [gastos, setGastos] = useState<Gasto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [searchTerm, setSearchTerm] = useState("")
  const [filterCategoria, setFilterCategoria] = useState("todos")
  const [filterMetodo, setFilterMetodo] = useState("todos")

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingGasto, setEditingGasto] = useState<Gasto | null>(null)
  const [formData, setFormData] = useState({
    descripcion: "",
    categoria: "",
    monto: "",
    fecha_gasto: new Date().toISOString().slice(0, 10), // Formato YYYY-MM-DD
    proveedor: "",
    metodo_pago: "",
    comprobante_url: "",
  })

  const [currentUser, setCurrentUser] = useState<any>(null)

  const categorias = [
    { nombre: "Proveedores", icono: Building },
    { nombre: "Transporte", icono: Truck },
    { nombre: "Mantenimiento", icono: Wrench },
    { nombre: "Oficina", icono: FileText },
    { nombre: "Servicios", icono: Receipt },
    { nombre: "Otros", icono: Receipt },
  ]

  // Carga desde API con filtros
  const loadGastos = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (searchTerm) params.set("search", searchTerm); // Búsqueda por término
        if (filterCategoria !== "todos") params.set("categoria", filterCategoria); // Filtro por categoría
        if (filterMetodo !== "todos") params.set("metodo_pago", filterMetodo); // Filtro por método de pago

        const res = await fetch(`/api/gastos?${params.toString()}`);
        const json = await res.json();
        if (res.ok && json.success && Array.isArray(json.data)) {
          const parsed: Gasto[] = json.data.map((g: any) => ({
            ...g,
            monto: typeof g.monto === 'string' ? parseFloat(g.monto) : g.monto,
          }));
          setGastos(parsed);
          setError(null);
        } else {
          setError(json.message || "Error cargando gastos");
        }
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }

    

  useEffect(() => {
    const raw = localStorage.getItem("user")
    if (!raw) return router.push("/")
    const usr = JSON.parse(raw)
    setCurrentUser(usr)
    if (usr.role !== "administrador" && usr.role !== "economia") {
      return router.push("/dashboard")
    }
    loadGastos()
  }, [filterCategoria, filterMetodo])

  // Crear / actualizar gasto
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const payload: any = {
      ...formData,
      monto: parseFloat(formData.monto),
      usuario_id: currentUser.id,
    }
    let method = "POST"
    if (editingGasto) {
      method = "PUT"
      payload.id = editingGasto.id
    }
    const res = await fetch("/api/gastos", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
    const json = await res.json()
    if (res.ok && json.success) {
      setIsDialogOpen(false)
      setEditingGasto(null)
      setFormData({ descripcion:"",categoria:"",monto:"",fecha_gasto:"",proveedor:"",metodo_pago:"",comprobante_url:"" })
      loadGastos()
    } else alert(json.message)
  }

  // Preparar edición
  const openEdit = (g: Gasto) => {
    setEditingGasto(g)
    setFormData({
      descripcion: g.descripcion,
      categoria: g.categoria,
      monto: g.monto.toString(),
      fecha_gasto: g.fecha_gasto.slice(0,10),
      proveedor: g.proveedor,
      metodo_pago: g.metodo_pago,
      comprobante_url: g.comprobante_url || "",
    })
    setIsDialogOpen(true)
  }

  // Eliminar gasto
  const handleDelete = async (id: number) => {
    if (!confirm("¿Eliminar este gasto?")) return
    const res = await fetch("/api/gastos", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    })
    const json = await res.json()
    if (res.ok && json.success) loadGastos()
    else alert(json.message)
  }

  


  // Exportar CSV
  const exportarReporte = () => {
    const csv = [
      "Fecha,Categoría,Descripción,Proveedor,Método,Monto,Usuario",
      ...gastos.map(g =>
        `${g.fecha_gasto},${g.categoria},"${g.descripcion}","${g.proveedor}",${g.metodo_pago},${g.monto.toFixed(2)},"${g.usuario_nombre}"`
      ),
    ].join("\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `gastos_${new Date().toISOString().split("T")[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (loading) return <div className="p-6 text-center">Cargando gastos…</div>
  if (error) return <div className="p-6 text-red-600">Error: {error}</div>

  // Filtrado local adicional
  const term = searchTerm.trim().toLowerCase()
  const filtered = gastos.filter(g =>
    g.descripcion.toLowerCase().includes(term) ||
    g.proveedor.toLowerCase().includes(term)
  )

  const total = gastos.reduce((s, g) => s + g.monto, 0)
  const mes = new Date().toISOString().slice(0,7)
  const totalMes = gastos.filter(g=>g.fecha_gasto.startsWith(mes)).reduce((s,g)=>s+g.monto,0)

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button variant="outline" onClick={()=>router.push("/dashboard")}> <ArrowLeft/> Volver </Button>
          <h1 className="text-2xl font-bold">Control de Gastos</h1>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={exportarReporte}> <Download/> Exportar </Button>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild><Button className="bg-red-600 text-white"><Plus/> {editingGasto?"Editar Gasto":"Nuevo Gasto"}</Button></DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader><DialogTitle>{editingGasto?"Editar Gasto":"Nuevo Gasto"}</DialogTitle></DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div><Label htmlFor="descripcion">Descripción</Label><Input id="descripcion" required value={formData.descripcion} onChange={e=>setFormData({...formData,descripcion:e.target.value})}/></div>
                  <div><Label htmlFor="categoria">Categoría</Label><Select value={formData.categoria} onValueChange={v=>setFormData({...formData,categoria:v})}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent>{categorias.map(c=><SelectItem key={c.nombre} value={c.nombre}>{c.nombre}</SelectItem>)}</SelectContent></Select></div>
                  <div><Label htmlFor="monto">Monto</Label><Input id="monto" type="number" step="0.01" required value={formData.monto} onChange={e=>setFormData({...formData,monto:e.target.value})}/></div>
                  <div><Label htmlFor="fecha_gasto">Fecha del Gasto</Label> <Input id="fecha_gasto" type="date" required value={formData.fecha_gasto} disabled onChange={e => setFormData({ ...formData, fecha_gasto: e.target.value })} /></div>
                  <div><Label htmlFor="proveedor">Lugar</Label><Input id="proveedor" required value={formData.proveedor} onChange={e=>setFormData({...formData,proveedor:e.target.value})}/></div>
                  <div><Label htmlFor="metodo_pago">Método de Pago</Label><Select value={formData.metodo_pago} onValueChange={v=>setFormData({...formData,metodo_pago:v})}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent>{['Efectivo','Transferencia','Tarjeta','Cheque'].map(m=><SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent></Select></div>
                  <div><Label htmlFor="comprobante_url">URL del Comprobante</Label><Input id="comprobante_url" type="url" value={formData.comprobante_url} onChange={e=>setFormData({...formData,comprobante_url:e.target.value})}/></div>
                  <div className="flex justify-end space-x-2"><Button variant="outline" type="button" onClick={()=>{setIsDialogOpen(false);setEditingGasto(null)}}>Cancelar</Button><Button type="submit">Guardar</Button></div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-red-500 text-white"><CardHeader><CardTitle className="flex items-center"><TrendingDown className="mr-2"/>Total Gastos</CardTitle></CardHeader><CardContent>${total.toLocaleString(undefined,{minimumFractionDigits:2})}</CardContent></Card>
          <Card className="bg-orange-500 text-white"><CardHeader><CardTitle className="flex items-center"><Calendar className="mr-2"/>Gastos del Mes</CardTitle></CardHeader><CardContent>${totalMes.toLocaleString(undefined,{minimumFractionDigits:2})}</CardContent></Card>
          <Card className="bg-purple-500 text-white"><CardHeader><CardTitle className="flex items-center"><Receipt className="mr-2"/>Total Registros</CardTitle></CardHeader><CardContent>{gastos.length}</CardContent></Card>
          <Card className="bg-gray-500 text-white"><CardHeader><CardTitle className="flex items-center"><FileText className="mr-2"/>Promedio por Gasto</CardTitle></CardHeader><CardContent>${(gastos.length? (total/gastos.length):0).toFixed(2)}</CardContent></Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="gastos" className="space-y-6">
          <TabsList className="grid grid-cols-3">
            <TabsTrigger value="gastos">Registro de Gastos</TabsTrigger>
            <TabsTrigger value="categorias">Por Categorías</TabsTrigger>
            <TabsTrigger value="reportes">Reportes</TabsTrigger>
          </TabsList>

          <TabsContent value="gastos" className="space-y-4">
            {/* Search & Filters */}
            <Card>
              <CardContent className="flex flex-col md:flex-row gap-4 items-center">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 text-gray-400" />
                  <Input
                    placeholder="Buscar por descripción o proveedor..."
                    className="pl-10"
                    value={searchTerm}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => {
                      setSearchTerm(e.target.value); // Actualiza el estado de la búsqueda
                      loadGastos(); // Ejecuta la búsqueda automáticamente al escribir
                    }}
                    onKeyDown={e => e.key === 'Enter' && loadGastos()} // Permite buscar con Enter
                  />
                </div>
                <Button onClick={loadGastos}>Buscar</Button> {/* Botón de búsqueda manual */}
                {/* Filtro por Categoría */}
                <Select
                  value={filterCategoria}
                  onValueChange={v => {
                    setFilterCategoria(v);
                    loadGastos(); // Cargar los gastos cuando se cambia el filtro de categoría
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todas las categorías" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todas las categorías</SelectItem>
                    {categorias.map(c => (
                      <SelectItem key={c.nombre} value={c.nombre}>
                        {c.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {/* Filtro por Método de Pago */}
                <Select
                  value={filterMetodo}
                  onValueChange={v => {
                    setFilterMetodo(v);
                    loadGastos(); // Cargar los gastos cuando se cambia el filtro de método de pago
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todos los métodos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos los métodos</SelectItem>
                    {['Efectivo', 'Transferencia', 'Tarjeta', 'Cheque'].map(m => (
                      <SelectItem key={m} value={m}>
                        {m}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>


            {/* Tabla Gastos */}
            <Card><CardHeader><CardTitle>Registro de Gastos ({filtered.length})</CardTitle></CardHeader><CardContent>
              <Table><TableHeader><TableRow><TableHead>Fecha</TableHead><TableHead>Descripción</TableHead><TableHead>Categoría</TableHead><TableHead>Lugar</TableHead><TableHead>Método</TableHead><TableHead>Monto</TableHead><TableHead>Usuario</TableHead><TableHead>Acciones</TableHead></TableRow></TableHeader>
                <TableBody>{filtered.map(g=><TableRow key={g.id}><TableCell>{g.fecha_gasto}</TableCell>
                <TableCell className="max-w-xs truncate">{g.descripcion}</TableCell>
                <TableCell><Badge variant="outline">{g.categoria}</Badge></TableCell>
                <TableCell>{g.proveedor}</TableCell><TableCell><Badge variant="secondary">{g.metodo_pago}</Badge></TableCell>
                <TableCell className="text-red-600 font-semibold">${g.monto.toFixed(2)}</TableCell>
                <TableCell>{g.usuario_nombre}</TableCell>
                <TableCell className="flex space-x-2"><Button size="sm" variant="outline" onClick={()=>openEdit(g)}><Edit/>
                 </Button>
                 
                <Button size="sm" variant="outline" onClick={()=>handleDelete(g.id)} className="text-red-600"><Trash2/>
                </Button>   
                
              </TableCell>
              </TableRow>)}
              </TableBody>
              </Table>
            </CardContent></Card>
          </TabsContent>

          <TabsContent value="categorias" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {categorias.map(c=>{
                const byCat = gastos.filter(g=>g.categoria===c.nombre)
                const sumCat = byCat.reduce((s,g)=>s+g.monto,0)
                const pct = total? (sumCat/total)*100:0
                return <Card key={c.nombre} className="hover:shadow-lg"><CardHeader><CardTitle className="flex items-center"><c.icono className="mr-2"/>{c.nombre}</CardTitle></CardHeader><CardContent>
                  <div className="font-bold text-xl">${sumCat.toFixed(2)}</div>
                  <div className="text-sm">{byCat.length} registros</div>
                  <div className="w-full bg-gray-200 h-2 rounded-full mt-2"><div className="h-2 bg-blue-600 rounded-full" style={{width:`${pct}%`}}/></div>
                  <div className="text-sm">{pct.toFixed(1)}%</div>
                </CardContent></Card>
              })}
            </div>
          </TabsContent>

          <TabsContent value="reportes" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card><CardHeader><CardTitle>Gastos por Método</CardTitle></CardHeader><CardContent>
                {['Efectivo','Transferencia'].map(m=>{
                  const byM = gastos.filter(g=>g.metodo_pago===m)
                  const sumM = byM.reduce((s,g)=>s+g.monto,0)
                  const pct = total? (sumM/total)*100:0
                  return <div key={m} className="space-y-1"><div className="flex justify-between"><span>{m}</span><span>${sumM.toFixed(2)}</span></div><div className="w-full bg-gray-200 h-2 rounded-full"><div className="h-2 bg-red-600 rounded-full" style={{width:`${pct}%`}}/></div><div className="text-sm">{byM.length} ({pct.toFixed(1)}%)</div></div>
                })}
              </CardContent></Card>

              <Card><CardHeader><CardTitle>Resumen Financiero</CardTitle></CardHeader><CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between"><span>Total Gastos</span><span>${total.toFixed(2)}</span></div>
                  <div className="flex justify-between"><span>Gastos Mes</span><span>${totalMes.toFixed(2)}</span></div>
                  <div className="flex justify-between"><span>Promedio</span><span>${(total/gastos.length).toFixed(2)}</span></div>
                </div>
              </CardContent></Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
