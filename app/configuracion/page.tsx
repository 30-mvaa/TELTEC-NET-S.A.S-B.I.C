"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { ArrowLeft, Settings, MessageSquare, Save, Mail, Database, Shield, Smartphone } from "lucide-react"

// Spinner simple
const Spinner = () => (
  <svg className="animate-spin mr-2 h-4 w-4 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
  </svg>
)

export default function ConfiguracionPage() {
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [config, setConfig] = useState({
    empresa: {
      nombre: "TelTec Net",
      direccion: "Av. Principal 123, Centro",
      telefono: "0999859689",
      email: "vangamarca4@gmail.com",
      ruc: "1234567890001",
    },
    whatsapp: {
      numero: "0999859689",
      api_token: "",
      webhook_url: "https://api.teltec.com/webhook",
    },
    email: {
      smtp_server: "smtp.gmail.com",
      smtp_port: "587",
      email_usuario: "vangamarca4@gmail.com",
      email_password: "",
    },
    sistema: {
      dias_aviso_pago: "5",
      dias_corte_servicio: "5",
      backup_automatico: true,
      notificaciones_activas: true,
    },
    database: {
      host: "localhost",
      puerto: "5432",
      nombre_db: "teltec_db",
      usuario: "postgres",
    },
    controlLogin: {
      intentos_maximos: "3",
      minutos_congelacion: "5",
    },
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [errors, setErrors] = useState<any>({})
  const router = useRouter()
  const [lastFetchedConfig, setLastFetchedConfig] = useState<any>(null)
  const [isDirty, setIsDirty] = useState(false)

  // Detectar cambios locales para evitar sobrescribir mientras se edita
  useEffect(() => {
    if (!lastFetchedConfig) return
    setIsDirty(JSON.stringify(config) !== JSON.stringify(lastFetchedConfig))
  }, [config, lastFetchedConfig])

  // Hacer que el mensaje desaparezca automáticamente
  useEffect(() => {
    if (message) {
      const timeout = setTimeout(() => setMessage(null), 3000)
      return () => clearTimeout(timeout)
    }
  }, [message])

  // Mapear claves de la base de datos a estructura local
  const mapConfigFromDB = (items: any[]) => {
    const mapped = { ...config }
    for (const item of items) {
      switch (item.clave) {
        case "empresa_nombre": mapped.empresa.nombre = item.valor; break;
        case "empresa_direccion": mapped.empresa.direccion = item.valor; break;
        case "empresa_telefono": mapped.empresa.telefono = item.valor; break;
        case "empresa_email": mapped.empresa.email = item.valor; break;
        case "empresa_ruc": mapped.empresa.ruc = item.valor; break;
        case "whatsapp_numero": mapped.whatsapp.numero = item.valor; break;
        case "whatsapp_api_token": mapped.whatsapp.api_token = item.valor; break;
        case "whatsapp_webhook_url": mapped.whatsapp.webhook_url = item.valor; break;
        case "email_smtp_server": mapped.email.smtp_server = item.valor; break;
        case "email_smtp_port": mapped.email.smtp_port = item.valor; break;
        case "email_usuario": mapped.email.email_usuario = item.valor; break;
        case "email_password": mapped.email.email_password = item.valor; break;
        case "sistema_dias_aviso_pago": mapped.sistema.dias_aviso_pago = item.valor; break;
        case "sistema_dias_corte_servicio": mapped.sistema.dias_corte_servicio = item.valor; break;
        case "sistema_backup_automatico": mapped.sistema.backup_automatico = item.valor === "true"; break;
        case "sistema_notificaciones_activas": mapped.sistema.notificaciones_activas = item.valor === "true"; break;
        case "db_host": mapped.database.host = item.valor; break;
        case "db_puerto": mapped.database.puerto = item.valor; break;
        case "db_nombre": mapped.database.nombre_db = item.valor; break;
        case "db_usuario": mapped.database.usuario = item.valor; break;
        case "login_intentos_maximos": mapped.controlLogin.intentos_maximos = item.valor; break;
        case "login_minutos_congelacion": mapped.controlLogin.minutos_congelacion = item.valor; break;
        default: break;
      }
    }
    return mapped
  }

  // Mapear estructura local a array para la API
  const mapConfigToDB = () => {
    return [
      { clave: "empresa_nombre", valor: config.empresa.nombre },
      { clave: "empresa_direccion", valor: config.empresa.direccion },
      { clave: "empresa_telefono", valor: config.empresa.telefono },
      { clave: "empresa_email", valor: config.empresa.email },
      { clave: "empresa_ruc", valor: config.empresa.ruc },
      { clave: "whatsapp_numero", valor: config.whatsapp.numero },
      { clave: "whatsapp_api_token", valor: config.whatsapp.api_token },
      { clave: "whatsapp_webhook_url", valor: config.whatsapp.webhook_url },
      { clave: "email_smtp_server", valor: config.email.smtp_server },
      { clave: "email_smtp_port", valor: config.email.smtp_port },
      { clave: "email_usuario", valor: config.email.email_usuario },
      { clave: "email_password", valor: config.email.email_password },
      { clave: "sistema_dias_aviso_pago", valor: config.sistema.dias_aviso_pago },
      { clave: "sistema_dias_corte_servicio", valor: config.sistema.dias_corte_servicio },
      { clave: "sistema_backup_automatico", valor: String(config.sistema.backup_automatico) },
      { clave: "sistema_notificaciones_activas", valor: String(config.sistema.notificaciones_activas) },
      { clave: "db_host", valor: config.database.host },
      { clave: "db_puerto", valor: config.database.puerto },
      { clave: "db_nombre", valor: config.database.nombre_db },
      { clave: "db_usuario", valor: config.database.usuario },
      { clave: "login_intentos_maximos", valor: config.controlLogin.intentos_maximos },
      { clave: "login_minutos_congelacion", valor: config.controlLogin.minutos_congelacion },
    ]
  }

  // Validar campos antes de guardar
  const validateFields = (seccion: string) => {
    const newErrors: any = {}
    if (seccion === "empresa") {
      if (!config.empresa.nombre.trim()) newErrors["empresa_nombre"] = "El nombre es requerido"
      if (!config.empresa.ruc.trim()) newErrors["empresa_ruc"] = "El RUC es requerido"
      if (!config.empresa.direccion.trim()) newErrors["empresa_direccion"] = "La dirección es requerida"
      if (!config.empresa.telefono.trim()) newErrors["empresa_telefono"] = "El teléfono es requerido"
      if (!config.empresa.email.trim()) newErrors["empresa_email"] = "El email es requerido"
      else if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(config.empresa.email)) newErrors["empresa_email"] = "Email inválido"
    }
    if (seccion === "whatsapp") {
      if (!config.whatsapp.numero.trim()) newErrors["whatsapp_numero"] = "El número es requerido"
      if (!config.whatsapp.api_token.trim()) newErrors["whatsapp_api_token"] = "El token es requerido"
      if (!config.whatsapp.webhook_url.trim()) newErrors["whatsapp_webhook_url"] = "El webhook es requerido"
    }
    if (seccion === "email") {
      if (!config.email.smtp_server.trim()) newErrors["email_smtp_server"] = "Servidor SMTP requerido"
      if (!config.email.smtp_port.trim()) newErrors["email_smtp_port"] = "Puerto SMTP requerido"
      else if (isNaN(Number(config.email.smtp_port))) newErrors["email_smtp_port"] = "Puerto debe ser numérico"
      if (!config.email.email_usuario.trim()) newErrors["email_usuario"] = "Email usuario requerido"
      else if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(config.email.email_usuario)) newErrors["email_usuario"] = "Email inválido"
      if (!config.email.email_password.trim()) newErrors["email_password"] = "Contraseña requerida"
    }
    if (seccion === "sistema") {
      if (!config.sistema.dias_aviso_pago.trim()) newErrors["sistema_dias_aviso_pago"] = "Requerido"
      else if (isNaN(Number(config.sistema.dias_aviso_pago))) newErrors["sistema_dias_aviso_pago"] = "Debe ser numérico"
      if (!config.sistema.dias_corte_servicio.trim()) newErrors["sistema_dias_corte_servicio"] = "Requerido"
      else if (isNaN(Number(config.sistema.dias_corte_servicio))) newErrors["sistema_dias_corte_servicio"] = "Debe ser numérico"
    }
    if (seccion === "database") {
      if (!config.database.host.trim()) newErrors["db_host"] = "Host requerido"
      if (!config.database.puerto.trim()) newErrors["db_puerto"] = "Puerto requerido"
      else if (isNaN(Number(config.database.puerto))) newErrors["db_puerto"] = "Puerto debe ser numérico"
      if (!config.database.nombre_db.trim()) newErrors["db_nombre"] = "Nombre requerido"
      if (!config.database.usuario.trim()) newErrors["db_usuario"] = "Usuario requerido"
    }
    if (seccion === "controlLogin") {
      if (!config.controlLogin.intentos_maximos.trim()) newErrors["login_intentos_maximos"] = "Requerido"
      else if (isNaN(Number(config.controlLogin.intentos_maximos))) newErrors["login_intentos_maximos"] = "Debe ser numérico"
      if (!config.controlLogin.minutos_congelacion.trim()) newErrors["login_minutos_congelacion"] = "Requerido"
      else if (isNaN(Number(config.controlLogin.minutos_congelacion))) newErrors["login_minutos_congelacion"] = "Debe ser numérico"
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Cargar configuración real al inicio y sincronizar cada 30s
  useEffect(() => {
    const userData = localStorage.getItem("user")
    if (!userData) {
      router.push("/")
      return
    }
    const user = JSON.parse(userData)
    setCurrentUser(user)
    if (user.role !== "administrador") {
      router.push("/dashboard")
      return
    }
    // Función para cargar config
    const fetchConfig = () => {
      fetch("/api/configuracion")
        .then(res => res.json())
        .then(data => {
          if (data.success && Array.isArray(data.data)) {
            if (!isDirty) {
              setConfig(mapConfigFromDB(data.data))
              setLastFetchedConfig(mapConfigFromDB(data.data))
            }
          }
        })
        .finally(() => setLoading(false))
    }
    fetchConfig()
    // Intervalo de sincronización
    const interval = setInterval(() => {
      if (!isDirty) fetchConfig()
    }, 30000)
    return () => clearInterval(interval)
  }, [router, isDirty])

  // Al guardar, actualiza lastFetchedConfig
  const handleSave = async (seccion: string) => {
    setMessage(null)
    if (!validateFields(seccion)) {
      setMessage("Corrige los errores antes de guardar.")
      return
    }
    setSaving(true)
    try {
      const res = await fetch("/api/configuracion", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(mapConfigToDB()),
      })
      const data = await res.json()
      if (data.success) {
        setMessage(`Configuración de ${seccion} guardada exitosamente`)
        setErrors({})
        setLastFetchedConfig(config)
        setIsDirty(false)
      } else {
        setMessage(`Error al guardar configuración: ${data.message || ""}`)
      }
    } catch (err) {
      setMessage("Error de red al guardar configuración")
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="p-8 text-center">Cargando configuración...</div>
  if (!currentUser || currentUser.role !== "administrador") {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                onClick={() => router.push("/dashboard")}
                className="flex items-center space-x-2 hover:bg-indigo-50"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Volver</span>
              </Button>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-cyan-600 bg-clip-text text-transparent">
                  Configuración del Sistema
                </h1>
                <p className="text-slate-600">Administración y configuración general</p>
              </div>
            </div>
          </div>

          <Tabs defaultValue="empresa" className="space-y-6">
            <TabsList className="grid w-full grid-cols-5 bg-white/50 backdrop-blur-sm">
              <TabsTrigger value="empresa" className="data-[state=active]:bg-indigo-500 data-[state=active]:text-white">
                Empresa
              </TabsTrigger>
              <TabsTrigger value="whatsapp" className="data-[state=active]:bg-green-500 data-[state=active]:text-white">
                WhatsApp
              </TabsTrigger>
              <TabsTrigger value="email" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white">
                Email
              </TabsTrigger>
              <TabsTrigger value="sistema" className="data-[state=active]:bg-purple-500 data-[state=active]:text-white">
                Sistema
              </TabsTrigger>
              <TabsTrigger value="database" className="data-[state=active]:bg-cyan-500 data-[state=active]:text-white">
                Base de Datos
              </TabsTrigger>
            </TabsList>

            <TabsContent value="empresa" className="space-y-4">
              <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-xl">
                <CardHeader className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-t-lg">
                  <CardTitle className="flex items-center space-x-2">
                    <Settings className="h-5 w-5" />
                    <span>Información de la Empresa</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6 p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="nombre_empresa" className="text-slate-700 font-medium">
                        Nombre de la Empresa
                      </Label>
                      <Input
                        id="nombre_empresa"
                        value={config.empresa.nombre}
                        onChange={(e) =>
                          setConfig({
                            ...config,
                            empresa: { ...config.empresa, nombre: e.target.value },
                          })
                        }
                        className={`mt-2 border-slate-200 focus:border-indigo-500 ${errors['empresa_nombre'] ? 'border-red-500' : ''}`}
                      />
                      {errors['empresa_nombre'] && <div className="text-red-600 text-xs mt-1">{errors['empresa_nombre']}</div>}
                    </div>
                    <div>
                      <Label htmlFor="ruc" className="text-slate-700 font-medium">
                        RUC
                      </Label>
                      <Input
                        id="ruc"
                        value={config.empresa.ruc}
                        onChange={(e) =>
                          setConfig({
                            ...config,
                            empresa: { ...config.empresa, ruc: e.target.value },
                          })
                        }
                        className={`mt-2 border-slate-200 focus:border-indigo-500 ${errors['empresa_ruc'] ? 'border-red-500' : ''}`}
                      />
                      {errors['empresa_ruc'] && <div className="text-red-600 text-xs mt-1">{errors['empresa_ruc']}</div>}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="direccion" className="text-slate-700 font-medium">
                      Dirección
                    </Label>
                    <Input
                      id="direccion"
                      value={config.empresa.direccion}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          empresa: { ...config.empresa, direccion: e.target.value },
                        })
                      }
                      className={`mt-2 border-slate-200 focus:border-indigo-500 ${errors['empresa_direccion'] ? 'border-red-500' : ''}`}
                    />
                    {errors['empresa_direccion'] && <div className="text-red-600 text-xs mt-1">{errors['empresa_direccion']}</div>}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="telefono_empresa" className="text-slate-700 font-medium">
                        Teléfono
                      </Label>
                      <Input
                        id="telefono_empresa"
                        value={config.empresa.telefono}
                        onChange={(e) =>
                          setConfig({
                            ...config,
                            empresa: { ...config.empresa, telefono: e.target.value },
                          })
                        }
                        className={`mt-2 border-slate-200 focus:border-indigo-500 ${errors['empresa_telefono'] ? 'border-red-500' : ''}`}
                      />
                      {errors['empresa_telefono'] && <div className="text-red-600 text-xs mt-1">{errors['empresa_telefono']}</div>}
                    </div>
                    <div>
                      <Label htmlFor="email_empresa" className="text-slate-700 font-medium">
                        Email
                      </Label>
                      <Input
                        id="email_empresa"
                        type="email"
                        value={config.empresa.email}
                        onChange={(e) =>
                          setConfig({
                            ...config,
                            empresa: { ...config.empresa, email: e.target.value },
                          })
                        }
                        className={`mt-2 border-slate-200 focus:border-indigo-500 ${errors['empresa_email'] ? 'border-red-500' : ''}`}
                      />
                      {errors['empresa_email'] && <div className="text-red-600 text-xs mt-1">{errors['empresa_email']}</div>}
                    </div>
                  </div>

                  <Button
                    onClick={() => handleSave("empresa")}
                    className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white"
                    disabled={saving}
                  >
                    {saving ? (<><Spinner />Guardando...</>) : (<> <Save className="h-4 w-4 mr-2" /> Guardar Configuración</>)}
                  </Button>
                </CardContent>
              </Card>

              <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-xl mt-6">
                <CardHeader className="bg-gradient-to-r from-red-500 to-orange-600 text-white rounded-t-lg">
                  <CardTitle className="flex items-center space-x-2">
                    <Shield className="h-5 w-5" />
                    <span>Control de Login</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6 p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="login_intentos_maximos" className="text-slate-700 font-medium">Número máximo de intentos fallidos</Label>
                      <Input
                        id="login_intentos_maximos"
                        type="number"
                        min={1}
                        value={config.controlLogin.intentos_maximos}
                        onChange={e => setConfig({ ...config, controlLogin: { ...config.controlLogin, intentos_maximos: e.target.value } })}
                        className={`mt-2 border-slate-200 focus:border-red-500 ${errors['login_intentos_maximos'] ? 'border-red-500' : ''}`}
                      />
                      {errors['login_intentos_maximos'] && <div className="text-red-600 text-xs mt-1">{errors['login_intentos_maximos']}</div>}
                    </div>
                    <div>
                      <Label htmlFor="login_minutos_congelacion" className="text-slate-700 font-medium">Minutos de congelación</Label>
                      <Input
                        id="login_minutos_congelacion"
                        type="number"
                        min={1}
                        value={config.controlLogin.minutos_congelacion}
                        onChange={e => setConfig({ ...config, controlLogin: { ...config.controlLogin, minutos_congelacion: e.target.value } })}
                        className={`mt-2 border-slate-200 focus:border-red-500 ${errors['login_minutos_congelacion'] ? 'border-red-500' : ''}`}
                      />
                      {errors['login_minutos_congelacion'] && <div className="text-red-600 text-xs mt-1">{errors['login_minutos_congelacion']}</div>}
                    </div>
                  </div>
                  <Button
                    onClick={() => handleSave("controlLogin")}
                    className="bg-gradient-to-r from-red-500 to-orange-600 hover:from-red-600 hover:to-orange-700 text-white"
                    disabled={saving}
                  >
                    {saving ? (<><Spinner />Guardando...</>) : (<> <Save className="h-4 w-4 mr-2" /> Guardar Configuración</>)}
                  </Button>
                </CardContent>
              </Card>

              {/* Gestión de Planes y Sectores */}
              <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-xl mt-6">
                <CardHeader className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-t-lg">
                  <CardTitle className="flex items-center space-x-2">
                    <span>Gestión de Planes y Sectores</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6 p-6">
                  {/* Planes */}
                  <div>
                    <h3 className="font-bold text-lg mb-2">Planes</h3>
                    <PlanesSectoresManager tipo="plan" />
                  </div>
                  {/* Sectores */}
                  <div>
                    <h3 className="font-bold text-lg mb-2 mt-6">Sectores</h3>
                    <PlanesSectoresManager tipo="sector" />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="whatsapp" className="space-y-4">
              <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-xl">
                <CardHeader className="bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-t-lg">
                  <CardTitle className="flex items-center space-x-2">
                    <MessageSquare className="h-5 w-5" />
                    <span>Configuración de WhatsApp Business</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6 p-6">
                  <div>
                    <Label htmlFor="whatsapp_numero" className="text-slate-700 font-medium">
                      Número de WhatsApp Business
                    </Label>
                    <Input
                      id="whatsapp_numero"
                      value={config.whatsapp.numero}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          whatsapp: { ...config.whatsapp, numero: e.target.value },
                        })
                      }
                      placeholder="0999123456"
                      className={`mt-2 border-slate-200 focus:border-green-500 ${errors['whatsapp_numero'] ? 'border-red-500' : ''}`}
                    />
                    {errors['whatsapp_numero'] && <div className="text-red-600 text-xs mt-1">{errors['whatsapp_numero']}</div>}
                  </div>

                  <div>
                    <Label htmlFor="api_token" className="text-slate-700 font-medium">
                      API Token
                    </Label>
                    <Input
                      id="api_token"
                      type="password"
                      value={config.whatsapp.api_token}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          whatsapp: { ...config.whatsapp, api_token: e.target.value },
                        })
                      }
                      placeholder="Token de la API de WhatsApp"
                      className={`mt-2 border-slate-200 focus:border-green-500 ${errors['whatsapp_api_token'] ? 'border-red-500' : ''}`}
                    />
                    {errors['whatsapp_api_token'] && <div className="text-red-600 text-xs mt-1">{errors['whatsapp_api_token']}</div>}
                  </div>

                  <div>
                    <Label htmlFor="webhook_url" className="text-slate-700 font-medium">
                      Webhook URL
                    </Label>
                    <Input
                      id="webhook_url"
                      value={config.whatsapp.webhook_url}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          whatsapp: { ...config.whatsapp, webhook_url: e.target.value },
                        })
                      }
                      className={`mt-2 border-slate-200 focus:border-green-500 ${errors['whatsapp_webhook_url'] ? 'border-red-500' : ''}`}
                    />
                    {errors['whatsapp_webhook_url'] && <div className="text-red-600 text-xs mt-1">{errors['whatsapp_webhook_url']}</div>}
                  </div>

                  <Button
                    onClick={() => handleSave("whatsapp")}
                    className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white"
                    disabled={saving}
                  >
                    {saving ? (<><Spinner />Guardando...</>) : (<> <Save className="h-4 w-4 mr-2" /> Guardar Configuración</>)}
                  </Button>
                </CardContent>
              </Card>

              {/* Nueva configuración de WhatsApp */}
              <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-xl">
                <CardHeader className="bg-gradient-to-r from-blue-500 to-cyan-600 text-white rounded-t-lg">
                  <CardTitle className="flex items-center space-x-2">
                    <Smartphone className="h-5 w-5" />
                    <span>Configuración Avanzada de WhatsApp</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6 p-6">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h3 className="font-semibold text-blue-800 mb-2">🚀 Alternativas Gratuitas a Twilio</h3>
                    <p className="text-blue-700 text-sm mb-4">
                      Ahora puedes usar WhatsApp gratuito sin costo mensual. Configura tu número personal 
                      y envía mensajes ilimitados sin pagar por Twilio.
                    </p>
                    <div className="space-y-2 text-sm text-blue-600">
                      <div>✅ Completamente gratuito</div>
                      <div>✅ Sin límites de mensajes</div>
                      <div>✅ Usa tu número personal</div>
                      <div>✅ Configuración fácil</div>
                    </div>
                  </div>

                  <Button
                    onClick={() => router.push('/configuracion/whatsapp')}
                    className="bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white w-full"
                  >
                    <Smartphone className="h-4 w-4 mr-2" />
                    Configurar WhatsApp Gratuito
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="email" className="space-y-4">
              <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-xl">
                <CardHeader className="bg-gradient-to-r from-blue-500 to-cyan-600 text-white rounded-t-lg">
                  <CardTitle className="flex items-center space-x-2">
                    <Mail className="h-5 w-5" />
                    <span>Configuración de Email</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6 p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="smtp_server" className="text-slate-700 font-medium">
                        Servidor SMTP
                      </Label>
                      <Input
                        id="smtp_server"
                        value={config.email.smtp_server}
                        onChange={(e) =>
                          setConfig({
                            ...config,
                            email: { ...config.email, smtp_server: e.target.value },
                          })
                        }
                        className={`mt-2 border-slate-200 focus:border-blue-500 ${errors['email_smtp_server'] ? 'border-red-500' : ''}`}
                      />
                      {errors['email_smtp_server'] && <div className="text-red-600 text-xs mt-1">{errors['email_smtp_server']}</div>}
                    </div>
                    <div>
                      <Label htmlFor="smtp_port" className="text-slate-700 font-medium">
                        Puerto SMTP
                      </Label>
                      <Input
                        id="smtp_port"
                        value={config.email.smtp_port}
                        onChange={(e) =>
                          setConfig({
                            ...config,
                            email: { ...config.email, smtp_port: e.target.value },
                          })
                        }
                        className={`mt-2 border-slate-200 focus:border-blue-500 ${errors['email_smtp_port'] ? 'border-red-500' : ''}`}
                      />
                      {errors['email_smtp_port'] && <div className="text-red-600 text-xs mt-1">{errors['email_smtp_port']}</div>}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="email_usuario" className="text-slate-700 font-medium">
                      Email Usuario
                    </Label>
                    <Input
                      id="email_usuario"
                      type="email"
                      value={config.email.email_usuario}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          email: { ...config.email, email_usuario: e.target.value },
                        })
                      }
                      className={`mt-2 border-slate-200 focus:border-blue-500 ${errors['email_usuario'] ? 'border-red-500' : ''}`}
                    />
                    {errors['email_usuario'] && <div className="text-red-600 text-xs mt-1">{errors['email_usuario']}</div>}
                  </div>

                  <div>
                    <Label htmlFor="email_password" className="text-slate-700 font-medium">
                      Contraseña Email
                    </Label>
                    <Input
                      id="email_password"
                      type="password"
                      value={config.email.email_password}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          email: { ...config.email, email_password: e.target.value },
                        })
                      }
                      className={`mt-2 border-slate-200 focus:border-blue-500 ${errors['email_password'] ? 'border-red-500' : ''}`}
                    />
                    {errors['email_password'] && <div className="text-red-600 text-xs mt-1">{errors['email_password']}</div>}
                  </div>

                  <Button
                    onClick={() => handleSave("email")}
                    className="bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white"
                    disabled={saving}
                  >
                    {saving ? (<><Spinner />Guardando...</>) : (<> <Save className="h-4 w-4 mr-2" /> Guardar Configuración</>)}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="sistema" className="space-y-4">
              <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-xl">
                <CardHeader className="bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-t-lg">
                  <CardTitle className="flex items-center space-x-2">
                    <Shield className="h-5 w-5" />
                    <span>Configuración del Sistema</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6 p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="dias_aviso" className="text-slate-700 font-medium">
                        Días de Aviso de Pago
                      </Label>
                      <Input
                        id="dias_aviso"
                        type="number"
                        value={config.sistema.dias_aviso_pago}
                        onChange={(e) =>
                          setConfig({
                            ...config,
                            sistema: { ...config.sistema, dias_aviso_pago: e.target.value },
                          })
                        }
                        className={`mt-2 border-slate-200 focus:border-purple-500 ${errors['sistema_dias_aviso_pago'] ? 'border-red-500' : ''}`}
                      />
                      {errors['sistema_dias_aviso_pago'] && <div className="text-red-600 text-xs mt-1">{errors['sistema_dias_aviso_pago']}</div>}
                    </div>
                    <div>
                      <Label htmlFor="dias_corte" className="text-slate-700 font-medium">
                        Días para Corte de Servicio
                      </Label>
                      <Input
                        id="dias_corte"
                        type="number"
                        value={config.sistema.dias_corte_servicio}
                        onChange={(e) =>
                          setConfig({
                            ...config,
                            sistema: { ...config.sistema, dias_corte_servicio: e.target.value },
                          })
                        }
                        className={`mt-2 border-slate-200 focus:border-purple-500 ${errors['sistema_dias_corte_servicio'] ? 'border-red-500' : ''}`}
                      />
                      {errors['sistema_dias_corte_servicio'] && <div className="text-red-600 text-xs mt-1">{errors['sistema_dias_corte_servicio']}</div>}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="backup_auto" className="text-slate-700 font-medium">
                        Backup Automático
                      </Label>
                      <Switch
                        id="backup_auto"
                        checked={config.sistema.backup_automatico}
                        onCheckedChange={(checked) =>
                          setConfig({
                            ...config,
                            sistema: { ...config.sistema, backup_automatico: checked },
                          })
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label htmlFor="notif_activas" className="text-slate-700 font-medium">
                        Notificaciones Activas
                      </Label>
                      <Switch
                        id="notif_activas"
                        checked={config.sistema.notificaciones_activas}
                        onCheckedChange={(checked) =>
                          setConfig({
                            ...config,
                            sistema: { ...config.sistema, notificaciones_activas: checked },
                          })
                        }
                      />
                    </div>
                  </div>

                  <Button
                    onClick={() => handleSave("sistema")}
                    className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white"
                    disabled={saving}
                  >
                    {saving ? (<><Spinner />Guardando...</>) : (<> <Save className="h-4 w-4 mr-2" /> Guardar Configuración</>)}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="database" className="space-y-4">
              <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-xl">
                <CardHeader className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-t-lg">
                  <CardTitle className="flex items-center space-x-2">
                    <Database className="h-5 w-5" />
                    <span>Configuración de Base de Datos</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6 p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="db_host" className="text-slate-700 font-medium">
                        Host
                      </Label>
                      <Input
                        id="db_host"
                        value={config.database.host}
                        onChange={(e) =>
                          setConfig({
                            ...config,
                            database: { ...config.database, host: e.target.value },
                          })
                        }
                        className={`mt-2 border-slate-200 focus:border-cyan-500 ${errors['db_host'] ? 'border-red-500' : ''}`}
                      />
                      {errors['db_host'] && <div className="text-red-600 text-xs mt-1">{errors['db_host']}</div>}
                    </div>
                    <div>
                      <Label htmlFor="db_puerto" className="text-slate-700 font-medium">
                        Puerto
                      </Label>
                      <Input
                        id="db_puerto"
                        value={config.database.puerto}
                        onChange={(e) =>
                          setConfig({
                            ...config,
                            database: { ...config.database, puerto: e.target.value },
                          })
                        }
                        className={`mt-2 border-slate-200 focus:border-cyan-500 ${errors['db_puerto'] ? 'border-red-500' : ''}`}
                      />
                      {errors['db_puerto'] && <div className="text-red-600 text-xs mt-1">{errors['db_puerto']}</div>}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="db_nombre" className="text-slate-700 font-medium">
                        Nombre de la Base de Datos
                      </Label>
                      <Input
                        id="db_nombre"
                        value={config.database.nombre_db}
                        onChange={(e) =>
                          setConfig({
                            ...config,
                            database: { ...config.database, nombre_db: e.target.value },
                          })
                        }
                        className={`mt-2 border-slate-200 focus:border-cyan-500 ${errors['db_nombre'] ? 'border-red-500' : ''}`}
                      />
                      {errors['db_nombre'] && <div className="text-red-600 text-xs mt-1">{errors['db_nombre']}</div>}
                    </div>
                    <div>
                      <Label htmlFor="db_usuario" className="text-slate-700 font-medium">
                        Usuario
                      </Label>
                      <Input
                        id="db_usuario"
                        value={config.database.usuario}
                        onChange={(e) =>
                          setConfig({
                            ...config,
                            database: { ...config.database, usuario: e.target.value },
                          })
                        }
                        className={`mt-2 border-slate-200 focus:border-cyan-500 ${errors['db_usuario'] ? 'border-red-500' : ''}`}
                      />
                      {errors['db_usuario'] && <div className="text-red-600 text-xs mt-1">{errors['db_usuario']}</div>}
                    </div>
                  </div>

                  <Button
                    onClick={() => handleSave("database")}
                    className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white"
                    disabled={saving}
                  >
                    {saving ? (<><Spinner />Guardando...</>) : (<> <Save className="h-4 w-4 mr-2" /> Guardar Configuración</>)}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
      {message && (
        <div className={`my-4 text-center font-semibold ${message.startsWith("Error") ? "text-red-600" : "text-green-600"}`}>
          {message}
        </div>
      )}
    </div>
  )
}

function PlanesSectoresManager({ tipo }: { tipo: "plan" | "sector" }) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [nombre, setNombre] = useState("");
  const [precio, setPrecio] = useState("");
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [editNombre, setEditNombre] = useState("");
  const [editPrecio, setEditPrecio] = useState("");
  const [mensaje, setMensaje] = useState("");

  // Cargar valores
  useEffect(() => {
    fetch("/api/clientes/valores-unicos")
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          if (tipo === "plan") {
            setItems(data.planes.filter((plan: any) => plan.tipo_plan && plan.tipo_plan.trim() !== ""));
          } else {
            setItems(data.sectores
              .filter((nombre: string) => nombre && nombre.trim() !== "")
              .map((nombre: string) => ({ nombre })));
          }
        }
      })
      .finally(() => setLoading(false));
  }, [tipo]);

  // Agregar
  const handleAgregar = async () => {
    if (!nombre.trim() || (tipo === "plan" && !precio.trim())) return;
    // Crea un cliente dummy solo con el valor nuevo
    const body: any = {
      cedula: `DUM${Math.floor(Math.random() * 1e10)}`,
      nombres: "Valor temporal",
      apellidos: "Valor temporal",
      tipo_plan: tipo === "plan" ? nombre : "",
      precio_plan: tipo === "plan" ? precio : 0,
      fecha_nacimiento: "2000-01-01",
      direccion: "Temporal",
      sector: tipo === "sector" ? nombre : "",
      email: `dummy_${Date.now()}@dummy.com`,
      telefono: "0000000000",
      estado: "activo"
    };
    const res = await fetch("/api/clientes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (data.success) {
      setMensaje("Agregado correctamente");
      setNombre(""); setPrecio("");
      // Refrescar
      setLoading(true);
      fetch("/api/clientes/valores-unicos").then(res => res.json()).then(data => {
        if (data.success) {
          if (tipo === "plan") {
            setItems(data.planes.filter((plan: any) => plan.tipo_plan && plan.tipo_plan.trim() !== ""));
          } else {
            setItems(data.sectores
              .filter((nombre: string) => nombre && nombre.trim() !== "")
              .map((nombre: string) => ({ nombre })));
          }
        }
      }).finally(() => setLoading(false));
    } else {
      setMensaje("Error al agregar");
    }
  };

  // Editar
  const handleEditar = (idx: number) => {
    setEditIndex(idx);
    setEditNombre(items[idx].tipo_plan || items[idx].nombre);
    setEditPrecio(items[idx].precio_plan || "");
  };
  const handleGuardarEdicion = async (idx: number) => {
    const item = items[idx];
    const body: any = {
      campo: tipo === "plan" ? "tipo_plan" : "sector",
      valorAntiguo: item.tipo_plan || item.nombre,
      valorNuevo: editNombre,
    };
    if (tipo === "plan") body.precioNuevo = editPrecio;
    const res = await fetch("/api/clientes/actualizar-valor", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (data.success) {
      setMensaje("Actualizado correctamente");
      setEditIndex(null);
      // Refrescar
      setLoading(true);
      fetch("/api/clientes/valores-unicos").then(res => res.json()).then(data => {
        if (data.success) {
          if (tipo === "plan") {
            setItems(data.planes.filter((plan: any) => plan.tipo_plan && plan.tipo_plan.trim() !== ""));
          } else {
            setItems(data.sectores
              .filter((nombre: string) => nombre && nombre.trim() !== "")
              .map((nombre: string) => ({ nombre })));
          }
        }
      }).finally(() => setLoading(false));
    } else {
      setMensaje("Error al actualizar");
    }
  };

  // Eliminar
  const handleEliminar = async (idx: number) => {
    const item = items[idx];
    if (!window.confirm("¿Seguro que deseas eliminar este valor?")) return;
    const body: any = {
      campo: tipo === "plan" ? "tipo_plan" : "sector",
      valor: item.tipo_plan || item.nombre,
      reemplazo: "",
    };
    const res = await fetch("/api/clientes/eliminar-valor", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (data.success) {
      setMensaje("Eliminado correctamente");
      // Refrescar
      setLoading(true);
      fetch("/api/clientes/valores-unicos").then(res => res.json()).then(data => {
        if (data.success) {
          if (tipo === "plan") {
            setItems(data.planes.filter((plan: any) => plan.tipo_plan && plan.tipo_plan.trim() !== ""));
          } else {
            setItems(data.sectores
              .filter((nombre: string) => nombre && nombre.trim() !== "")
              .map((nombre: string) => ({ nombre })));
          }
        }
      }).finally(() => setLoading(false));
    } else {
      setMensaje("Error al eliminar");
    }
  };

  return (
    <div>
      {mensaje && <div className="text-green-600 mb-2">{mensaje}</div>}
      {loading ? <div>Cargando...</div> : (
        <>
          <ul className="mb-4">
            {items.map((item, idx) => (
              <li key={idx} className="flex items-center gap-2 mb-1">
                {editIndex === idx ? (
                  <>
                    <input value={editNombre} onChange={e => setEditNombre(e.target.value)} className="border px-1" />
                    {tipo === "plan" && (
                      <input value={editPrecio} onChange={e => setEditPrecio(e.target.value)} className="border px-1 w-20" placeholder="Precio" />
                    )}
                    <button onClick={() => handleGuardarEdicion(idx)} className="text-blue-600 ml-2">Guardar</button>
                    <button onClick={() => setEditIndex(null)} className="text-gray-500 ml-1">Cancelar</button>
                  </>
                ) : (
                  <>
                    <span>{item.tipo_plan || item.nombre}</span>
                    {tipo === "plan" && <span className="ml-2 text-sm text-gray-500">${item.precio_plan}</span>}
                    <button onClick={() => handleEditar(idx)} className="text-blue-600 ml-2">Editar</button>
                    <button onClick={() => handleEliminar(idx)} className="text-red-600 ml-1">Eliminar</button>
                  </>
                )}
              </li>
            ))}
          </ul>
          <div className="flex items-center gap-2">
            <input value={nombre} onChange={e => setNombre(e.target.value)} className="border px-1" placeholder={tipo === "plan" ? "Nuevo plan" : "Nuevo sector"} />
            {tipo === "plan" && (
              <input value={precio} onChange={e => setPrecio(e.target.value)} className="border px-1 w-20" placeholder="Precio" />
            )}
            <button onClick={handleAgregar} className="text-green-600 ml-2">Agregar</button>
          </div>
        </>
      )}
    </div>
  );
}
