"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { ArrowLeft, Settings, MessageSquare, Save, Mail, Database, Shield } from "lucide-react"

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
  })
  const router = useRouter()

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
  }, [router])

  const handleSave = (seccion: string) => {
    alert(`Configuración de ${seccion} guardada exitosamente`)
  }

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
                        className="mt-2 border-slate-200 focus:border-indigo-500"
                      />
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
                        className="mt-2 border-slate-200 focus:border-indigo-500"
                      />
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
                      className="mt-2 border-slate-200 focus:border-indigo-500"
                    />
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
                        className="mt-2 border-slate-200 focus:border-indigo-500"
                      />
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
                        className="mt-2 border-slate-200 focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  <Button
                    onClick={() => handleSave("empresa")}
                    className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Guardar Configuración
                  </Button>
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
                      className="mt-2 border-slate-200 focus:border-green-500"
                    />
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
                      className="mt-2 border-slate-200 focus:border-green-500"
                    />
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
                      className="mt-2 border-slate-200 focus:border-green-500"
                    />
                  </div>

                  <Button
                    onClick={() => handleSave("whatsapp")}
                    className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Guardar Configuración
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
                        className="mt-2 border-slate-200 focus:border-blue-500"
                      />
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
                        className="mt-2 border-slate-200 focus:border-blue-500"
                      />
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
                      className="mt-2 border-slate-200 focus:border-blue-500"
                    />
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
                      className="mt-2 border-slate-200 focus:border-blue-500"
                    />
                  </div>

                  <Button
                    onClick={() => handleSave("email")}
                    className="bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Guardar Configuración
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
                        className="mt-2 border-slate-200 focus:border-purple-500"
                      />
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
                        className="mt-2 border-slate-200 focus:border-purple-500"
                      />
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
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Guardar Configuración
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
                        className="mt-2 border-slate-200 focus:border-cyan-500"
                      />
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
                        className="mt-2 border-slate-200 focus:border-cyan-500"
                      />
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
                        className="mt-2 border-slate-200 focus:border-cyan-500"
                      />
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
                        className="mt-2 border-slate-200 focus:border-cyan-500"
                      />
                    </div>
                  </div>

                  <Button
                    onClick={() => handleSave("database")}
                    className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Guardar Configuración
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
