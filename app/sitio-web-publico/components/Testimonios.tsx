"use client"

import React from "react"
import { motion } from "framer-motion"
import { Star, Quote, MessageSquare } from "lucide-react"
import { TestimonioItem, TESTIMONIOS_DATA } from "../lib/defaultData"

interface TestimoniosProps {
  testimonios?: TestimonioItem[]
}

export default function Testimonios({ testimonios }: TestimoniosProps) {
  const displayTestimonials = testimonios && testimonios.length > 0 ? testimonios : TESTIMONIOS_DATA

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase()
  }

  return (
    <section className="relative py-12 sm:py-16 bg-slate-950 border-t border-white/5 overflow-hidden">
      <div className="absolute top-1/2 left-1/3 -translate-y-1/2 w-[400px] h-[200px] bg-teltec-blue/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 backdrop-blur-md mb-3">
            <MessageSquare className="w-3 h-3 text-cyan-300" />
            <span className="text-[11px] font-bold text-cyan-300 uppercase tracking-widest">
              Experiencias Reales
            </span>
          </div>

          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight mb-2">
            Lo que dicen <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-teltec-blue-light">nuestros clientes</span>
          </h2>

          <p className="text-slate-400 text-xs sm:text-sm max-w-xl mx-auto">
            Cientos de hogares y negocios en Cañar ya disfrutan de la verdadera velocidad.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {displayTestimonials.map((t, idx) => (
            <motion.div
              key={t.id || idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: idx * 0.08 }}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              className="p-4 sm:p-5 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-cyan-400/40 hover:bg-white/[0.05] transition-all flex flex-col justify-between shadow-md shadow-black/30"
            >
              <div>
                <Quote className="w-5 h-5 text-cyan-400/30 mb-2" />

                <div className="flex gap-1 mb-3" aria-label={`Calificación: ${t.calificacion} de 5 estrellas`}>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`h-3.5 w-3.5 ${
                        i < t.calificacion
                          ? "text-amber-400 fill-amber-400"
                          : "text-slate-700"
                      }`}
                    />
                  ))}
                </div>

                <p className="text-slate-300 text-xs leading-relaxed italic mb-4">
                  &ldquo;{t.comentario}&rdquo;
                </p>
              </div>

              <div className="flex items-center gap-2.5 pt-3 border-t border-white/5">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teltec-blue to-cyan-500 flex items-center justify-center font-bold text-[11px] text-white shadow-sm flex-shrink-0">
                  {getInitials(t.nombre)}
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="font-bold text-white text-xs truncate">{t.nombre}</span>
                  <span className="text-[10px] text-slate-400 truncate">{t.rol}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
