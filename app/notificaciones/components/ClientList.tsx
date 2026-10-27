"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { MessageCircle, CheckCircle, DollarSign, RefreshCw, XCircle, Send, SendHorizonal } from "lucide-react"
import type { ClienteConPago } from "../hooks/useNotificaciones"

interface ClientListProps {
  clientes: ClienteConPago[]
  loading?: boolean
  onReload: () => void
  onCrearNotificacion: (cliente: ClienteConPago) => Promise<{ success: boolean; message?: string }>
  onActualizarChatId: (clienteId: number, chatId: string) => Promise<{ success: boolean; message?: string }>
}

export function ClientList({ clientes, loading, onReload, onCrearNotificacion, onActualizarChatId }: ClientListProps) {
  const [chatIds, setChatIds] = useState<Record<number, string>>({})
  const [updatingId, setUpdatingId] = useState<number | null>(null)

  const totalRecaudado = clientes.reduce((sum, c) => sum + (c.total_pagado_anual || 0), 0)
  const totalDeuda = clientes.reduce((sum, c) => sum + (c.deuda_actual || 0), 0)
  const clientesActivos = clientes.filter((c) => c.estado === "activo" || !c.estado).length
  const clientesConDeuda = clientes.filter((c) => (c.deuda_actual || 0) > 0).length

  const handleChatIdChange = (id: number, value: string) => {
    setChatIds(prev => ({ ...prev, [id]: value }))
  }

  const handleLinkTelegram = async (cliente: ClienteConPago) => {
    const chatId = chatIds[cliente.id] || cliente.telegram_chat_id
    if (!chatId) return

    setUpdatingId(cliente.id)
    try {
      await onActualizarChatId(cliente.id, chatId)
    } finally {
      setUpdatingId(null)
    }
  }

  return (
    <div className="mt-8 bg-white rounded-lg border border-gray-200 shadow-sm">
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-sky-100 rounded-lg">
              <SendHorizonal className="h-5 w-5 text-sky-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Gestión de Vinculación Telegram</h2>
              <p className="text-sm text-gray-600 mt-0.5">Asocia el Chat ID de tus clientes para habilitar notificaciones ricas</p>
            </div>
          </div>
          <div className="text-sm font-medium text-gray-500 bg-white px-3 py-1 rounded-full border border-gray-200">
            Total: {clientes.length} clientes
          </div>
        </div>
      </div>

      <div className="px-6 py-4 border-b border-gray-200">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-xs font-medium text-green-900 uppercase tracking-wider">Activos</p>
                <p className="text-2xl font-bold text-green-600">{clientesActivos}</p>
              </div>
            </div>
          </div>

          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center space-x-2">
              <XCircle className="h-5 w-5 text-red-600" />
              <div>
                <p className="text-xs font-medium text-red-900 uppercase tracking-wider">Con Deuda</p>
                <p className="text-2xl font-bold text-red-600">{clientesConDeuda}</p>
              </div>
            </div>
          </div>

          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-xs font-medium text-blue-900 uppercase tracking-wider">Recaudado 2025</p>
                <p className="text-2xl font-bold text-blue-600">${totalRecaudado.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-5 w-5 text-orange-600" />
              <div>
                <p className="text-xs font-medium text-orange-900 uppercase tracking-wider">Deuda Total</p>
                <p className="text-2xl font-bold text-orange-600">${totalDeuda.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {clientes.length > 0 ? (
        <div className="divide-y divide-gray-200 max-h-[600px] overflow-y-auto">
          {clientes.map((cliente) => (
            <div key={cliente.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-3 mb-3">
                    <h3 className="text-sm font-bold text-gray-900 truncate">
                      {cliente.nombre}
                    </h3>
                    <div className="flex items-center space-x-2">
                      <Badge
                        variant="outline"
                        className={
                          cliente.estado === "activo" || !cliente.estado
                            ? "bg-green-50 text-green-700 border-green-200"
                            : "bg-red-50 text-red-700 border-red-200"
                        }
                      >
                        {cliente.estado === "activo" || !cliente.estado ? "Activo" : "Inactivo"}
                      </Badge>
                      <Badge
                        variant="outline"
                        className={
                          cliente.estado_pago === "al_dia"
                            ? "bg-green-50 text-green-700 border-green-200"
                            : cliente.estado_pago === "proximo_vencimiento"
                            ? "bg-yellow-50 text-yellow-700 border-yellow-200"
                            : "bg-red-50 text-red-700 border-red-200"
                        }
                      >
                        {cliente.estado_pago === "al_dia"
                          ? "Al día"
                          : cliente.estado_pago === "proximo_vencimiento"
                          ? "Próximo vencimiento"
                          : cliente.estado_pago === "vencido"
                          ? "Vencido"
                          : "Corte pendiente"}
                      </Badge>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs text-gray-600 mb-4">
                    <div className="flex flex-col">
                      <span className="font-semibold text-gray-400 uppercase text-[10px]">Plan</span>
                      <span className="text-gray-900 font-medium">
                        {cliente.tipo_plan || "Sin plan"} - ${(cliente.precio_plan || 0).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="font-semibold text-gray-400 uppercase text-[10px]">Deuda Actual</span>
                      <span className={(cliente.deuda_actual || 0) > 0 ? "text-red-600 font-bold" : "text-green-600 font-medium"}>
                        ${(cliente.deuda_actual || 0).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="font-semibold text-gray-400 uppercase text-[10px]">Recaudado 2025</span>
                      <span className="text-blue-600 font-medium">
                        ${(cliente.total_pagado_anual || 0).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="font-semibold text-gray-400 uppercase text-[10px]">Último Pago</span>
                      <span className="text-gray-900">
                        {cliente.ultimo_pago
                          ? new Date(cliente.ultimo_pago).toLocaleDateString()
                          : "Sin pagos"}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-sky-50 rounded-xl border border-sky-100">
                    <div className="flex items-center gap-2 flex-1">
                      <div className="p-1.5 bg-sky-200 rounded-md">
                        <SendHorizonal className="h-3 w-3 text-sky-700" />
                      </div>
                      <div className="flex-1 flex items-center gap-2">
                        <span className="text-xs font-bold text-sky-800 whitespace-nowrap">Telegram Chat ID:</span>
                        <Input
                          className="h-8 text-xs bg-white border-sky-200 focus:ring-sky-500"
                          placeholder="Ej: 123456789"
                          value={chatIds[cliente.id] || cliente.telegram_chat_id || ""}
                          onChange={(e) => handleChatIdChange(cliente.id, e.target.value)}
                        />
                      </div>
                      <Button
                        size="sm"
                        className="h-8 text-xs bg-sky-600 hover:bg-sky-700 text-white border-none transition-all"
                        onClick={() => handleLinkTelegram(cliente)}
                        disabled={updatingId === cliente.id}
                      >
                        {updatingId === cliente.id ? (
                          <RefreshCw className="h-3 w-3 animate-spin" />
                        ) : (
                          <>
                            <Send className="h-3 w-3 mr-1" />
                            Vincular
                          </>
                        )}
                      </Button>
                    </div>
                    <Badge
                      variant="outline"
                      className={`text-[10px] px-2 py-1 ${cliente.telegram_chat_id ? "bg-green-100 text-green-700 border-green-300" : "bg-gray-100 text-gray-500 border-gray-300"}`}
                    >
                      {cliente.telegram_chat_id ? "Vinculado ✓" : "No vinculado"}
                    </Badge>
                  </div>

                  <div className="mt-3 flex items-center justify-between text-[10px] text-gray-400">
                    <div className="flex items-center space-x-2">
                      <span>Registrado: {cliente.fecha_registro ? new Date(cliente.fecha_registro).toLocaleDateString() : "N/A"}</span>
                      <span className="opacity-30">•</span>
                      <span>Días sin pago: {cliente.dias_sin_pago}</span>
                      {cliente.telefono && (
                        <>
                          <span className="opacity-30">•</span>
                          <span>Tel: {cliente.telefono}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="ml-4 flex-shrink-0">
                  {cliente.telefono ? (
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-green-600 border-green-200 hover:bg-green-50 h-9"
                      onClick={async () => {
                        await onCrearNotificacion(cliente)
                      }}
                      disabled={loading}
                    >
                      <MessageCircle className="h-4 w-4 mr-1" />
                      <span className="text-xs">WhatsApp</span>
                    </Button>
                  ) : (
                    <span className="text-xs text-gray-400">Sin teléfono</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="px-6 py-12 text-center">
          <p className="text-gray-500 text-sm">
            {loading ? "Cargando clientes..." : "No hay clientes disponibles."}
          </p>
          {!loading && (
            <Button onClick={onReload} variant="outline" className="mt-4">
              <RefreshCw className="h-4 w-4 mr-2" />
              Recargar Clientes
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
