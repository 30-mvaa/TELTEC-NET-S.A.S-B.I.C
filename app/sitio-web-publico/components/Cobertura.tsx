"use client"

import React, { useState, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Search, MapPin, CheckCircle2, Radio, MessageCircle, X } from "lucide-react"
import { getCoverageWhatsAppLink } from "../lib/whatsapp"
import { SectorItem, SECTORES_DATA } from "../lib/defaultData"

interface CoberturaProps {
  sectores?: SectorItem[]
  onProductClick?: (product: string) => void
}

type TabType = "todos" | "rural" | "urbano" | "comercial"

export default function Cobertura({ sectores }: CoberturaProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [activeTab, setActiveTab] = useState<TabType>("todos")

  const sourceSectores = sectores && sectores.length > 0 ? sectores : SECTORES_DATA

  const filteredSectores = useMemo(() => {
    return sourceSectores.filter((sector) => {
      const matchesSearch = sector.nombre.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesTab = activeTab === "todos" ? true : sector.categoria === activeTab
      return matchesSearch && matchesTab
    })
  }, [sourceSectores, searchTerm, activeTab])

  return (
    <section id="cobertura" className="relative py-12 sm:py-16 bg-[#020617] border-t border-white/5 overflow-hidden">
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute bottom-10 right-1/4 w-[450px] h-[450px] bg-teltec-blue/10 rounded-full blur-[130px]" />
      </div>

      <div className="relative max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 backdrop-blur-md mb-3">
            <Radio className="w-3 h-3 text-cyan-300 animate-pulse" />
            <span className="text-[11px] font-bold text-cyan-300 uppercase tracking-widest">
              Red Provincial Cañar
            </span>
          </div>

          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight mb-2">
            Zonas de <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-teltec-blue-light">Cobertura</span>
          </h2>

          <p className="text-slate-400 text-xs sm:text-sm max-w-xl mx-auto">
            Priorizamos zonas donde otros no llegan. Infraestructura para comunidades rurales y urbanas en toda la provincia del Cañar.
          </p>

          {/* Filtros de Tipos de Cobertura compactos */}
          <div className="flex flex-wrap items-center justify-center gap-1.5 mt-5">
            <button
              onClick={() => setActiveTab("todos")}
              className={`px-3 py-1 rounded-full text-[11px] font-bold transition-all ${
                activeTab === "todos"
                  ? "bg-cyan-500 text-slate-950 shadow-sm font-black"
                  : "bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10"
              }`}
            >
              Todos ({sourceSectores.length})
            </button>
            <button
              onClick={() => setActiveTab("rural")}
              className={`px-3 py-1 rounded-full text-[11px] font-bold transition-all ${
                activeTab === "rural"
                  ? "bg-cyan-500 text-slate-950 shadow-sm font-black"
                  : "bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10"
              }`}
            >
              Comunidades rurales
            </button>
            <button
              onClick={() => setActiveTab("urbano")}
              className={`px-3 py-1 rounded-full text-[11px] font-bold transition-all ${
                activeTab === "urbano"
                  ? "bg-cyan-500 text-slate-950 shadow-sm font-black"
                  : "bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10"
              }`}
            >
              Centros poblados
            </button>
            <button
              onClick={() => setActiveTab("comercial")}
              className={`px-3 py-1 rounded-full text-[11px] font-bold transition-all ${
                activeTab === "comercial"
                  ? "bg-cyan-500 text-slate-950 shadow-sm font-black"
                  : "bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10"
              }`}
            >
              Negocios y locales
            </button>
          </div>
        </div>

        {/* Buscador compacto */}
        <div className="flex flex-col items-center gap-2 mb-8">
          <div className="relative w-full max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-slate-400" />
            </div>
            <input
              type="text"
              placeholder="Busca tu sector (ej: Sisid, Tambo, Ingapirca)..."
              className="block w-full pl-9 pr-8 py-2.5 rounded-xl border border-white/15 bg-slate-900/90 text-white placeholder-slate-400 focus:ring-2 focus:ring-cyan-400 outline-none transition-all text-xs shadow-md"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-white"
                aria-label="Limpiar búsqueda"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <p className="text-[11px] text-slate-400 font-mono">
            {filteredSectores.length} zonas disponibles para conexión en Cañar
          </p>
        </div>

        {/* Cuadrícula de sectores compacta */}
        <div className="grid gap-2.5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          <AnimatePresence mode="popLayout">
            {filteredSectores.map((sector) => {
              const waLink = getCoverageWhatsAppLink(sector.nombre)

              return (
                <motion.div
                  key={sector.id || sector.nombre}
                  layout
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ duration: 0.2 }}
                  className="p-3 rounded-xl border border-white/10 bg-white/[0.03] hover:border-cyan-400/50 hover:bg-white/[0.05] transition-all flex flex-col justify-between shadow-sm group"
                >
                  <div>
                    <div className="flex items-start justify-between gap-1.5 mb-1.5">
                      <div className="flex items-center gap-1.5">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 flex-shrink-0" />
                        <span className="text-xs font-bold text-white group-hover:text-cyan-300 transition-colors">
                          {sector.nombre}
                        </span>
                      </div>

                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-white/5 text-slate-400 border border-white/5">
                        {sector.categoria === "urbano" ? "Urbano" : sector.categoria === "comercial" ? "Comercial" : "Rural"}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-400 line-clamp-1">
                      {sector.descripcion}
                    </p>
                  </div>

                  <div className="mt-2 pt-2 border-t border-white/5 flex items-center justify-between">
                    <span className="text-[10px] text-emerald-400 font-medium flex items-center gap-1">
                      <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" />
                      Disponible
                    </span>
                    <a
                      href={waLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] font-bold text-cyan-300 hover:text-white transition-colors inline-flex items-center gap-0.5"
                    >
                      <span>Consultar</span>
                      <MapPin className="w-2.5 h-2.5" />
                    </a>
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>

        {/* Tarjeta inferior compacta */}
        <div className="mt-10 p-5 rounded-2xl bg-gradient-to-r from-slate-900/90 via-slate-950 to-slate-900/90 border border-white/10 shadow-xl relative overflow-hidden">
          <div className="grid lg:grid-cols-12 gap-5 items-center">
            <div className="lg:col-span-8 space-y-1.5">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-cyan-400/10 border border-cyan-400/20 text-cyan-300 text-[10px] font-mono">
                <span>Topología de Red • Provincia del Cañar</span>
              </div>
              <h3 className="text-lg font-black text-white">
                Infraestructura de Fibra Óptica y Enlaces Troncales
              </h3>
              <p className="text-slate-300 text-xs leading-relaxed max-w-xl">
                Nuestra arquitectura de fibra conecta los 20 sectores y comunidades confirmados de Cañar. Si tu punto exacto requiere validación técnica, escríbenos para coordinar una inspección de campo.
              </p>
            </div>

            <div className="lg:col-span-4 flex justify-center lg:justify-end">
              <a
                href={getCoverageWhatsAppLink()}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-teltec-blue to-cyan-500 hover:from-teltec-blue-light hover:to-cyan-400 text-white font-bold text-xs shadow-md shadow-teltec-blue/30 transition-all hover:scale-105"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>Consultar disponibilidad</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
