"use client"

import { motion } from "framer-motion"
import { ArrowRight, Wifi, Sparkles, Zap, MessageCircle } from "lucide-react"
import { getWhatsAppLink } from "../lib/whatsapp"
import AnimatedCounter from "./AnimatedCounter"
import InfiniteZoom from "./InfiniteZoom"
import { EmpresaInfo } from "../lib/defaultData"

interface HeroProps {
  informacion?: {
    titulo?: string
    subtitulo?: string
    descripcion?: string
    lema?: string
  }
  empresa?: Partial<EmpresaInfo>
  isVisible: boolean
}

export default function Hero({ informacion, empresa, isVisible }: HeroProps) {
  const eyebrowText = informacion?.subtitulo || "INTERNET DE NUEVA GENERACIÓN"
  const mainTitle = "TelTec Net — Internet de Alta Velocidad"
  const supportingLine = informacion?.lema || "Conectando tu mundo digital"
  const description =
    informacion?.descripcion ||
    "Somos una empresa líder en servicios de internet de alta velocidad, comprometida con brindar conectividad confiable y soporte técnico excepcional en toda la provincia del Cañar."

  const clientesCount = 100

  return (
    <section
      id="inicio"
      className="relative flex items-center justify-center overflow-hidden bg-[#020617] pt-20 pb-12 lg:pt-24 lg:pb-16"
    >
      {/* Luces de fondo y efectos ópticos de fibra */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-teltec-blue/20 rounded-full blur-[140px]" />
        <div className="absolute top-1/2 -right-32 w-96 h-96 bg-cyan-500/15 rounded-full blur-[140px]" />
        <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-teltec-green/10 rounded-full blur-[120px]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,#020617_90%)]" />
      </div>

      <div className="relative max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="grid lg:grid-cols-12 gap-8 lg:gap-10 items-center">
          {/* COLUMNA IZQUIERDA: Mensajes principales de marca y CTAs */}
          <div className="lg:col-span-6 flex flex-col space-y-4 text-left">
            {/* Eyebrow suministrado */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={isVisible ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 backdrop-blur-md w-fit"
            >
              <div className="p-0.5 rounded-full bg-cyan-500 animate-pulse">
                <Sparkles className="w-2.5 h-2.5 text-slate-950" />
              </div>
              <span className="text-[11px] font-extrabold text-cyan-300 uppercase tracking-widest">
                {eyebrowText}
              </span>
            </motion.div>

            {/* Título Principal y Línea de Apoyo */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={isVisible ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="space-y-1.5"
            >
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white leading-tight">
                {mainTitle}
              </h1>
              <p className="text-lg sm:text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-teltec-blue-light to-emerald-400">
                {supportingLine}
              </p>
            </motion.div>

            {/* Descripción institucional exacta */}
            <motion.p
              initial={{ opacity: 0, y: 15 }}
              animate={isVisible ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-sm sm:text-base text-slate-300 leading-relaxed font-normal max-w-xl"
            >
              {description}
            </motion.p>

            {/* Botones de acción principales (CTAs) */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={isVisible ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-wrap items-center gap-3 pt-1"
            >
              <a
                href="#planes"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-teltec-blue to-cyan-600 hover:from-teltec-blue-light hover:to-cyan-500 text-white font-bold text-sm transition-all duration-300 shadow-md shadow-teltec-blue/30 hover:scale-[1.02] active:scale-[0.98]"
              >
                <span>Ver planes</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </a>

              <a
                href={getWhatsAppLink()}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-white font-bold text-sm border border-white/15 backdrop-blur-md transition-all duration-300 hover:border-cyan-400/50 hover:scale-[1.02] active:scale-[0.98]"
              >
                <MessageCircle className="w-4 h-4 text-emerald-400" />
                <span>Hablar con un asesor</span>
              </a>
            </motion.div>

            {/* Métricas destacadas suministradas */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={isVisible ? { opacity: 1 } : {}}
              transition={{ duration: 0.7, delay: 0.4 }}
              className="grid grid-cols-2 gap-4 pt-4 border-t border-white/10 max-w-sm"
            >
              <div className="flex items-center gap-3 p-2.5 rounded-xl bg-white/[0.03] border border-white/10">
                <div className="p-2 rounded-lg bg-cyan-500/15 border border-cyan-500/30 text-cyan-300">
                  <Wifi className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xl font-black text-white">
                    <AnimatedCounter end={clientesCount} suffix="+" label="" />
                  </div>
                  <p className="text-[11px] font-medium text-slate-400">Clientes</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-2.5 rounded-xl bg-white/[0.03] border border-white/10">
                <div className="p-2 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300">
                  <Zap className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xl font-black text-white">
                    <AnimatedCounter end={99} suffix=".9%" label="" />
                  </div>
                  <p className="text-[11px] font-medium text-slate-400">Uptime</p>
                </div>
              </div>
            </motion.div>
          </div>

          {/* COLUMNA DERECHA: Ventana macOS Infinite Zoom en su escala completa original */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={isVisible ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="lg:col-span-6 flex justify-center items-center w-full"
          >
            <div className="w-full max-w-[560px]">
              <InfiniteZoom />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
