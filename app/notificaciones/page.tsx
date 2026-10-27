"use client"

import { useCallback } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Bell, RefreshCw } from "lucide-react"
import { useNotificaciones } from "./hooks/useNotificaciones"
import { StatsCards, NotificationList, ClientList, NotificationDialogs } from "./components"
import { useToast } from "@/app/components/shared/Toast"

function NotificacionesContent() {
  const router = useRouter()
  const { toast } = useToast()
  const {
    notificaciones,
    clientes,
    estadisticas,
    loading,
    error,
    apiStatus,
    telegramStatus,
    pagination,
    filters,
    setPage,
    setPageSize,
    setSearchTerm,
    setFilterTipo,
    setFilterEstado,
    cargarDatos,
    crearNotificacion,
    enviarMasiva,
    generarAutomaticas,
    previsualizarAutomaticas,
    limpiarNotificaciones,
    crearNotificacionCliente,
    copyToClipboard,
    sendWhatsApp,
    sendTelegram,
    actualizarChatId,
  } = useNotificaciones()

  const handleCopyMessage = useCallback(
    async (notif: { mensaje: string }) => {
      const success = await copyToClipboard(notif.mensaje)
      if (success) {
        toast("Mensaje copiado al portapapeles", "success")
      } else {
        toast("No se pudo copiar al portapapeles", "error")
      }
    },
    [copyToClipboard, toast]
  )

  const handleGenerarAutomaticas = useCallback(async () => {
    const preview = await previsualizarAutomaticas()
    if (!preview.success || !preview.data) {
      toast(preview.message || "No se pudo calcular los avisos", "error")
      return
    }
    const r = preview.data
    if (r.total === 0) {
      toast("Hoy no corresponde ningún aviso (3 días antes del pago / 2 días de vencido)", "success")
      return
    }
    const etiquetas: Record<string, string> = {
      pago_proximo: "Pago próximo (3 días antes)",
      pago_vencido: "Pago vencido (2+ días)",
      corte_servicio: "Aviso de corte (3+ meses)",
    }
    const porTelegram = r.detalle.filter((d) => d.canal === "telegram").length
    const resumenTipos = Object.entries(r.por_tipo)
      .map(([tipo, n]) => `• ${etiquetas[tipo] || tipo}: ${n}`)
      .join("\n")
    const lista = r.detalle
      .slice(0, 10)
      .map((d) => `- ${d.cliente} (${d.canal}${d.meses_adeudados ? `, ${d.meses_adeudados} meses` : ""})`)
      .join("\n")
    const ok = window.confirm(
      `Hoy corresponden ${r.total} avisos:\n${resumenTipos}\n\n${lista}${r.total > 10 ? "\n..." : ""}\n\n` +
        `${porTelegram} se enviarán YA por Telegram; ${r.total - porTelegram} quedarán pendientes para WhatsApp.\n\n¿Continuar?`
    )
    if (!ok) return

    const result = await generarAutomaticas()
    if (result.success) {
      toast(result.message || "Notificaciones generadas exitosamente", "success")
    } else {
      toast(result.message || "Error al generar notificaciones", "error")
    }
  }, [generarAutomaticas, previsualizarAutomaticas, toast])

  if (loading && !estadisticas) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <h2 className="text-lg font-medium text-gray-900">Cargando sistema de notificaciones</h2>
          <p className="text-gray-600">Obteniendo datos...</p>
          <div className="mt-4 text-sm text-gray-500">
            <p>Verificando servidor Django...</p>
            <p>Estado: {apiStatus === "online" ? "Conectado" : "Conectando..."}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                onClick={() => router.push("/dashboard")}
                className="text-gray-600 hover:text-gray-900"
              >
                Volver
              </Button>
              <div className="h-6 w-px bg-gray-300"></div>
              <div>
                <h1 className="text-2xl font-semibold text-gray-900">Notificaciones</h1>
                <p className="text-sm text-gray-600">
                  Gestiona y envía notificaciones a tus clientes
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              {telegramStatus?.bot_link && (
                <a
                  href={telegramStatus.bot_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={telegramStatus?.mensaje || "Bot de Telegram para notificaciones"}
                  className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm border ${
                    telegramStatus?.conectado
                      ? "bg-sky-50 text-sky-700 border-sky-200"
                      : "bg-gray-50 text-gray-600 border-gray-200"
                  }`}
                >
                  <div
                    className={`w-2 h-2 rounded-full ${telegramStatus?.conectado ? "bg-sky-500" : "bg-gray-400"}`}
                  ></div>
                  <span>
                    {telegramStatus?.conectado
                      ? `Telegram @${telegramStatus.bot_username} · ${telegramStatus.clientes_vinculados} vinculados · ${
                          telegramStatus.auto_activo ? `Auto ${telegramStatus.auto_hora}:00` : "Auto desactivado"
                        }`
                      : telegramStatus?.configurado === false
                        ? "Telegram sin configurar"
                        : "Telegram desconectado"}
                  </span>
                </a>
              )}
                <div
                  className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm ${
                    apiStatus === "online"
                      ? "bg-green-50 text-green-700 border border-green-200"
                      : "bg-red-50 text-red-700 border border-red-200"
                  }`}
                >
                  <div
                    className={`w-2 h-2 rounded-full ${apiStatus === "online" ? "bg-green-500" : "bg-red-500"}`}
                  ></div>
                  <span>{apiStatus === "online" ? "Conectado" : "Desconectado"}</span>
                </div>

            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center justify-between">
              <p className="text-red-800 text-sm">{error}</p>
              <Button
                variant="outline"
                size="sm"
                onClick={cargarDatos}
                className="text-red-600 border-red-200 hover:bg-red-100"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Reintentar
              </Button>
            </div>
          </div>
        )}

        <StatsCards estadisticas={estadisticas} />

        <div className="flex flex-wrap justify-center gap-4 mb-8">
          <Button variant="outline" onClick={cargarDatos} disabled={loading} className="text-sm">
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Actualizar
          </Button>

          <Button
            variant="outline"
            onClick={handleGenerarAutomaticas}
            disabled={loading}
            className="text-sm text-purple-600 border-purple-200 hover:bg-purple-50"
          >
            <Bell className="h-4 w-4 mr-2" />
            {loading ? "Generando..." : "Notificaciones Automáticas"}
          </Button>

          <NotificationDialogs
            clientes={clientes}
            loading={loading}
            onCrearNotificacion={crearNotificacion}
            onEnviarMasiva={enviarMasiva}
            onLimpiarNotificaciones={limpiarNotificaciones}
            onToast={toast}
          />
        </div>

        <NotificationList
          notificaciones={notificaciones}
          searchTerm={filters.searchTerm}
          filterTipo={filters.tipo}
          filterEstado={filters.estado}
          page={pagination.page}
          pageSize={pagination.pageSize}
          totalPages={pagination.totalPages}
          totalItems={pagination.totalItems}
          loading={loading}
          onSearchChange={setSearchTerm}
          onFilterTipoChange={setFilterTipo}
          onFilterEstadoChange={setFilterEstado}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          onCopyMessage={handleCopyMessage}
          onSendWhatsApp={async (notif) => {
            const result = await sendWhatsApp(notif)
            if (result.success) {
              toast("WhatsApp abierto - Marca como enviado cuando completes el envío", "success")
            } else {
              toast(result.message || "Error al abrir WhatsApp", "error")
            }
          }}
          onSendTelegram={async (notif) => {
            const result = await sendTelegram(notif)
            toast(result.message || (result.success ? "Enviado por Telegram" : "Error al enviar"), result.success ? "success" : "error")
          }}
        />

        <ClientList
          clientes={clientes}
          loading={loading}
          onReload={cargarDatos}
          onCrearNotificacion={async (cliente) => {
            const result = await crearNotificacionCliente(cliente)
            if (result.success) {
              toast("Notificación creada exitosamente", "success")
            } else {
              toast(result.message || "Error al crear notificación", "error")
            }
            return result
          }}
          onActualizarChatId={async (clienteId, chatId) => {
            const result = await actualizarChatId(clienteId, chatId)
            if (result.success) {
              toast(result.message || "Chat ID actualizado exitosamente", "success")
            } else {
              toast(result.message || "Error al actualizar Chat ID", "error")
            }
            return result
          }}
        />
      </div>
    </div>
  )
}

export default function NotificacionesPage() {
  return <NotificacionesContent />
}
