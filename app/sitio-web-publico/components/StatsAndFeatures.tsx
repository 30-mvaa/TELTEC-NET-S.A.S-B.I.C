"use client"

import { motion } from "framer-motion"
import { Headphones, Zap, Activity } from "lucide-react"
import { FeatureItem } from "../lib/defaultData"

interface StatsAndFeaturesProps {
  isVisible?: boolean
  features?: FeatureItem[]
}

const defaultFeatures: FeatureItem[] = [
  {
    id: "soporte-local",
    titulo: "Soporte local",
    descripcion: "Atención directa sin robots. Resolvemos tus dudas en minutos.",
    icono: "Headphones"
  },
  {
    id: "planes-flexibles",
    titulo: "Planes flexibles",
    descripcion: "Velocidad que se adapta a tus necesidades. Escoge la ideal para ti.",
    icono: "Zap"
  },
  {
    id: "monitoreo-247",
    titulo: "Monitoreo 24/7",
    descripcion: "Supervisamos tu conexión constantemente para garantizar estabilidad.",
    icono: "Activity"
  }
]

const iconMap = {
  Headphones: Headphones,
  Zap: Zap,
  Activity: Activity,
  Shield: Activity
}

export default function StatsAndFeatures({ isVisible = true, features = defaultFeatures }: StatsAndFeaturesProps) {
  const displayFeatures = features && features.length > 0 ? features : defaultFeatures

  return (
    <section className="relative py-12 sm:py-14 bg-slate-950 border-t border-white/5 overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[200px] bg-cyan-500/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-10"
        >
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight">
            ¿Por qué elegir <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-teltec-blue-light">TelTec Net</span>?
          </h2>
          <p className="text-slate-400 mt-2 max-w-lg mx-auto text-xs sm:text-sm">
            Más que internet, una experiencia de conexión confiable.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-5">
          {displayFeatures.map((feature, idx) => {
            const Icon = iconMap[feature.icono] || Headphones
            return (
              <motion.div
                key={feature.id || feature.titulo}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: idx * 0.1 }}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                className="group relative p-5 sm:p-6 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-cyan-400/40 hover:bg-white/[0.05] transition-all duration-300 shadow-md shadow-black/30"
              >
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-teltec-blue/25 to-cyan-500/20 border border-cyan-400/30 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform duration-300">
                  <Icon className="w-5 h-5 text-cyan-300" />
                </div>
                <h3 className="text-base sm:text-lg font-bold text-white mb-2 group-hover:text-cyan-300 transition-colors">
                  {feature.titulo}
                </h3>
                <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
                  {feature.descripcion}
                </p>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
