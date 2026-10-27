"use client"

import { motion } from "framer-motion"
import { Cpu, Home, Code, Video, Bell, Lock, ArrowRight, Sparkles, MessageCircle } from "lucide-react"
import { getServiceWhatsAppLink } from "../lib/whatsapp"
import { ServicioItem, SERVICIOS_DATA } from "../lib/defaultData"

interface ServiciosProps {
  servicios?: any[]
  onServiceClick: (serviceType: string) => void
}

const iconMap = {
  cpu: Cpu,
  home: Home,
  code: Code,
  video: Video,
  bell: Bell,
  lock: Lock
}

export default function Servicios({ servicios, onServiceClick }: ServiciosProps) {
  const displayServices = SERVICIOS_DATA

  return (
    <section id="servicios" className="relative py-12 sm:py-16 bg-slate-950 border-t border-white/5 overflow-hidden">
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute top-10 left-10 w-72 h-72 bg-cyan-500/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-10 right-10 w-72 h-72 bg-teltec-blue/15 rounded-full blur-[120px]" />
      </div>

      <div className="relative max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 backdrop-blur-md mb-3">
            <Sparkles className="w-3 h-3 text-cyan-300" />
            <span className="text-[11px] font-bold text-cyan-300 uppercase tracking-widest">Tecnología Integral</span>
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight mb-2">
            Nuestros <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-teltec-blue-light">Servicios</span>
          </h2>
          <p className="text-slate-400 text-xs sm:text-sm max-w-lg mx-auto">
            Soluciones integrales para hogar y empresa.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {displayServices.map((servicio, idx) => {
            const Icon = iconMap[servicio.icono] || Cpu
            const waLink = getServiceWhatsAppLink(servicio.nombre)

            return (
              <motion.div
                key={servicio.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: idx * 0.08 }}
                whileHover={{ y: -4 }}
                className="group relative rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition-all duration-300 hover:border-cyan-400/40 hover:bg-white/[0.05] shadow-md shadow-black/30 flex flex-col justify-between"
              >
                <div>
                  <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${servicio.gradient} flex items-center justify-center mb-4 shadow-md group-hover:scale-105 transition-transform`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>

                  <h3 className="text-base sm:text-lg font-bold text-white mb-1.5 group-hover:text-cyan-300 transition-colors">
                    {servicio.nombre}
                  </h3>

                  <p className="text-slate-300 text-xs sm:text-sm leading-relaxed mb-4">
                    {servicio.descripcion}
                  </p>

                  <ul className="space-y-1.5 mb-5">
                    {servicio.features.map((feat, i) => (
                      <li key={i} className="text-xs text-slate-400 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 flex-shrink-0" />
                        <span className="truncate">{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-3 border-t border-white/5 flex items-center justify-between gap-2">
                  <button
                    onClick={() => onServiceClick(servicio.serviceType)}
                    className="inline-flex items-center gap-1 text-xs font-bold text-cyan-300 hover:text-white transition-colors"
                  >
                    <span>Más info</span>
                    <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                  </button>

                  <a
                    href={waLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 text-xs font-semibold border border-emerald-500/30 transition-colors"
                    title={`Cotizar ${servicio.nombre} por WhatsApp`}
                  >
                    <MessageCircle className="w-3 h-3" />
                    <span>Cotizar</span>
                  </a>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
