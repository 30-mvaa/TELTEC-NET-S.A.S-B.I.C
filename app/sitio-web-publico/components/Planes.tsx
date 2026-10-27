"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Check, Star, MessageCircle, Sparkles, HelpCircle, Gamepad2, Building2 } from "lucide-react"
import { getWhatsAppLink } from "../lib/whatsapp"
import { PlanItem, PLANES_DATA } from "../lib/defaultData"

interface PlanesProps {
  planes?: PlanItem[]
}

const CATEGORIES = [
  { id: "todos", label: "Todos los planes" },
  { id: "hogar", label: "Hogar" },
  { id: "gaming", label: "Gaming" },
  { id: "empresa", label: "Empresa" }
]

export default function Planes({ planes }: PlanesProps) {
  const [activeFilter, setActiveFilter] = useState<string>("todos")

  // Los 4 planes confirmados en base de datos
  const sourcePlans = planes && planes.length > 0 ? planes : PLANES_DATA

  // Filtrado reactivo por categoría
  const filteredPlans = sourcePlans.filter((plan) => {
    if (activeFilter === "todos" || activeFilter === "hogar") return true
    if (activeFilter === "gaming") {
      return plan.nombre.toLowerCase().includes("familiar")
    }
    return false
  })

  return (
    <section id="planes" className="relative py-12 sm:py-16 bg-[#020617] border-t border-white/5 overflow-hidden">
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute top-1/4 right-0 w-[400px] h-[400px] bg-teltec-blue/15 rounded-full blur-[130px]" />
        <div className="absolute bottom-10 left-0 w-[400px] h-[400px] bg-cyan-500/10 rounded-full blur-[130px]" />
      </div>

      <div className="relative max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 backdrop-blur-md mb-3">
            <Sparkles className="w-3 h-3 text-cyan-300" />
            <span className="text-[11px] font-bold text-cyan-300 uppercase tracking-widest">
              Tarifas Claras y Transparentes
            </span>
          </div>

          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight mb-2">
            Elige la <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-teltec-blue-light to-emerald-400">Potencia Ideal</span>
          </h2>

          <p className="text-slate-400 text-xs sm:text-sm max-w-xl mx-auto">
            Diseñamos soluciones a medida para cada tipo de usuario. Sin letras pequeñas, solo la mejor velocidad de Cañar.
          </p>

          {/* Filtros de categoría compactos */}
          <div className="flex flex-wrap items-center justify-center gap-1.5 mt-6">
            {CATEGORIES.map((cat) => {
              const isSelected = activeFilter === cat.id
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveFilter(cat.id)}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all duration-200 ${
                    isSelected
                      ? "bg-gradient-to-r from-teltec-blue to-cyan-500 text-white shadow-md shadow-teltec-blue/30 scale-105"
                      : "bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10"
                  }`}
                >
                  {cat.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Cuadrícula de planes */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 items-stretch">
          <AnimatePresence mode="popLayout">
            {filteredPlans.map((plan, idx) => {
              const isDestacado = plan.destacado
              const formattedPrice = plan.precio.toFixed(0)
              const waLink = getWhatsAppLink(plan.nombre, plan.precio)

              return (
                <motion.div
                  key={plan.id}
                  layout
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ duration: 0.3, delay: idx * 0.05 }}
                  className={`relative rounded-2xl p-5 flex flex-col justify-between transition-all duration-300 ${
                    isDestacado
                      ? "bg-gradient-to-b from-slate-900 via-slate-950 to-[#020617] border-2 border-cyan-400 shadow-[0_0_25px_rgba(0,195,255,0.2)] md:-translate-y-1.5"
                      : "bg-white/[0.03] border border-white/10 hover:border-white/20 shadow-md shadow-black/30"
                  }`}
                >
                  {/* Badge de Plan Destacado */}
                  {isDestacado && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-gradient-to-r from-cyan-400 to-teltec-blue text-slate-950 text-[10px] font-black uppercase tracking-wider shadow-md flex items-center gap-1 whitespace-nowrap">
                      <Star className="w-2.5 h-2.5 fill-slate-950" />
                      <span>{plan.popularBadge || "Más Popular"}</span>
                    </div>
                  )}

                  <div>
                    {/* Encabezado del plan */}
                    <div className="mb-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-mono uppercase tracking-wider text-cyan-400 font-semibold px-2 py-0.5 rounded-full bg-cyan-400/10 border border-cyan-400/20">
                          {plan.nombre.toLowerCase().includes("familiar")
                            ? "Familiar / Gaming"
                            : plan.nombre.toLowerCase().includes("tercera")
                            ? "Especial"
                            : "Residencial"}
                        </span>
                        <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded-full border border-emerald-500/20">
                          Activo
                        </span>
                      </div>

                      <h3 className="text-base sm:text-lg font-black text-white mt-2">
                        {plan.nombre}
                      </h3>
                      <p className="text-[11px] text-slate-400 mt-0.5 min-h-[30px] leading-snug">
                        {plan.descripcion}
                      </p>
                    </div>

                    {/* Precio mensual */}
                    <div className="my-3 pb-3 border-b border-white/10">
                      <div className="flex items-baseline gap-1">
                        <span className="text-xl font-bold text-cyan-300">$</span>
                        <span className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                          {formattedPrice}
                        </span>
                        <span className="text-slate-400 text-xs font-medium">
                          /{plan.precioPeriodo || "mes"}
                        </span>
                      </div>

                      <div className="mt-1.5 flex items-center gap-1.5 text-[11px] text-cyan-300 font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                        <span>{plan.velocidadPlaceholder}</span>
                      </div>
                    </div>

                    {/* Características incluidas */}
                    <div className="space-y-1.5 mb-5">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Incluido:
                      </p>
                      {plan.caracteristicas.map((caract, i) => (
                        <div key={i} className="flex items-start gap-1.5 text-xs text-slate-300">
                          <div className="p-0.5 rounded-full bg-emerald-500/20 text-emerald-400 mt-0.5 flex-shrink-0">
                            <Check className="w-2.5 h-2.5" />
                          </div>
                          <span className="text-[11px]">{caract}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Botón de contratación */}
                  <div>
                    <a
                      href={waLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`w-full inline-flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl font-bold text-xs transition-all duration-300 active:scale-[0.98] ${
                        isDestacado
                          ? "bg-gradient-to-r from-cyan-400 via-teltec-blue to-teltec-blue-dark text-white hover:brightness-110 shadow-md shadow-cyan-500/25"
                          : "bg-white/10 hover:bg-white/15 text-white border border-white/15"
                      }`}
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>Contratar ahora</span>
                    </a>

                    <p className="text-[9px] text-center text-slate-500 mt-1.5">
                      Instalación de 24 a 48h hábiles en Cañar
                    </p>
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>

          {/* Tarjeta Gaming */}
          {activeFilter === "gaming" && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-5 rounded-2xl bg-slate-900/80 border border-cyan-400/30 flex flex-col justify-between"
            >
              <div>
                <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-300 flex items-center justify-center mb-3">
                  <Gamepad2 className="w-5 h-5" />
                </div>
                <h3 className="text-base font-black text-white">¿Buscas optimización Gaming Pro?</h3>
                <p className="text-[11px] text-slate-300 mt-1.5 leading-relaxed">
                  El <strong>Plan familiar ($20)</strong> cuenta con el ancho de banda y estabilidad ideales para juegos en línea con bajo ping. Si requieres configuración de router doble banda, te asesoramos sin costo adicional.
                </p>
              </div>
              <a
                href={getWhatsAppLink("Consulta Gaming Especializada")}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 w-full inline-flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs border border-white/15"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>Hablar con soporte</span>
              </a>
            </motion.div>
          )}

          {/* Tarjeta Empresa */}
          {activeFilter === "empresa" && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="lg:col-span-4 p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-950 to-slate-900 border border-cyan-400/30 flex flex-col sm:flex-row items-center justify-between gap-4"
            >
              <div className="flex items-start gap-3.5">
                <div className="w-11 h-11 rounded-xl bg-cyan-500/20 text-cyan-300 flex items-center justify-center flex-shrink-0">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white">Planes a Medida para Empresas y Negocios</h3>
                  <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
                    Diseñamos soluciones corporativas para locales, cooperativas y centros productivos en Cañar: enlaces dedicados, facturación empresarial y soporte prioritario 24/7.
                  </p>
                </div>
              </div>
              <a
                href={getWhatsAppLink("Cotización Plan Empresarial")}
                target="_blank"
                rel="noopener noreferrer"
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-teltec-blue to-cyan-500 text-white font-bold text-xs whitespace-nowrap shadow-md hover:scale-105 transition-all"
              >
                Solicitar cotización
              </a>
            </motion.div>
          )}
        </div>

        {/* Nota de transparencia compacta */}
        <div className="mt-8 p-3 rounded-xl bg-white/[0.02] border border-white/10 max-w-2xl mx-auto flex items-center gap-2.5 text-[11px] text-slate-400">
          <HelpCircle className="w-4 h-4 text-cyan-400 flex-shrink-0" />
          <div>
            <span className="font-semibold text-slate-300">Servicio transparente: </span>
            Instalación en 24 a 48 horas hábiles, soporte técnico local y libertad sin contratos forzosos.
          </div>
        </div>
      </div>
    </section>
  )
}
