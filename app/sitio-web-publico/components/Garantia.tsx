"use client"

import React from "react"
import { motion } from "framer-motion"
import { Clock, Headphones, FileCheck, ShieldCheck } from "lucide-react"

export default function Garantia() {
  const guarantees = [
    {
      title: "Instalación Express",
      description: "Instalamos tu servicio en un plazo de 24 a 48 horas hábiles.",
      tag: "24-48h hábiles",
      icon: Clock,
      color: "from-cyan-500/20 to-blue-500/20",
      border: "border-cyan-400/30",
      iconColor: "text-cyan-300"
    },
    {
      title: "Soporte 24/7",
      description: "Asistencia técnica constante para que nunca te quedes sin conexión.",
      tag: "Asistencia Continua",
      icon: Headphones,
      color: "from-emerald-500/20 to-teal-500/20",
      border: "border-emerald-400/30",
      iconColor: "text-emerald-300"
    },
    {
      title: "Sin Contratos Forzosos",
      description: "Creemos en la calidad de nuestro servicio, por eso no te atamos con contratos abusivos.",
      tag: "Transparencia Total",
      icon: FileCheck,
      color: "from-blue-500/20 to-indigo-500/20",
      border: "border-blue-400/30",
      iconColor: "text-blue-300"
    }
  ]

  return (
    <section className="relative py-12 sm:py-14 bg-[#020617] border-t border-white/5 overflow-hidden">
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute top-1/2 right-10 w-72 h-72 bg-teltec-blue/10 rounded-full blur-[120px]" />
      </div>

      <div className="relative max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-10"
        >
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-[11px] font-bold uppercase tracking-wider mb-3">
            <ShieldCheck className="w-3 h-3" />
            <span>Compromiso y Transparencia</span>
          </div>

          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight">
            Nuestra Garantía de <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">Servicio</span>
          </h2>
          <p className="text-slate-400 mt-2 max-w-xl mx-auto text-xs sm:text-sm">
            En TelTec Net nos comprometemos con la excelencia y la transparencia en cada conexión.
          </p>
        </motion.div>

        <div className="grid gap-5 md:grid-cols-3">
          {guarantees.map((item, idx) => {
            const Icon = item.icon
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: idx * 0.1 }}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                className="relative p-5 sm:p-6 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-white/20 transition-all shadow-md shadow-black/30 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${item.color} border ${item.border} flex items-center justify-center shadow-md`}>
                      <Icon className={`w-5 h-5 ${item.iconColor}`} />
                    </div>
                    <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-slate-300">
                      {item.tag}
                    </span>
                  </div>

                  <h3 className="text-base sm:text-lg font-bold text-white mb-2">
                    {item.title}
                  </h3>
                  <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
                    {item.description}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-white/5 flex items-center gap-1.5 text-[11px] font-medium text-slate-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span>Compromiso garantizado</span>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
