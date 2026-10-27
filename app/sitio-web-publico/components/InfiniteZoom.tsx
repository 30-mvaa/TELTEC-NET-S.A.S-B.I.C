"use client"

import React, { useState, useEffect, useRef, useCallback } from "react"
import { Play, Pause, Sparkles, Wifi, Shield, Lock } from "lucide-react"

interface InfiniteZoomProps {
  className?: string
}

export default function InfiniteZoom({ className = "" }: InfiniteZoomProps) {
  const [isPaused, setIsPaused] = useState(false)
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)
  const [zoomProgress, setZoomProgress] = useState(0)
  const animationFrameRef = useRef<number | null>(null)
  const lastTimeRef = useRef<number | null>(null)

  // Cantidad acotada de capas (pool fijo de 5 capas recicladas para rendimiento óptimo)
  const LAYER_COUNT = 5
  // Duración de un ciclo de zoom completo en milisegundos
  const CYCLE_DURATION_MS = 6000

  // Detectar preferencia del usuario por movimiento reducido
  useEffect(() => {
    if (typeof window === "undefined") return

    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)")
    setPrefersReducedMotion(mediaQuery.matches)
    if (mediaQuery.matches) {
      setIsPaused(true)
    }

    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches)
      if (e.matches) setIsPaused(true)
    }

    mediaQuery.addEventListener("change", handleChange)
    return () => mediaQuery.removeEventListener("change", handleChange)
  }, [])

  // Bucle de animación continuo usando requestAnimationFrame
  const animate = useCallback(
    (timestamp: number) => {
      if (lastTimeRef.current === null) {
        lastTimeRef.current = timestamp
      }

      const delta = timestamp - lastTimeRef.current
      lastTimeRef.current = timestamp

      if (!isPaused && !prefersReducedMotion) {
        setZoomProgress((prev) => {
          const next = prev + delta / CYCLE_DURATION_MS
          return next % 1.0
        })
      }

      animationFrameRef.current = requestAnimationFrame(animate)
    },
    [isPaused, prefersReducedMotion]
  )

  useEffect(() => {
    animationFrameRef.current = requestAnimationFrame(animate)
    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [animate])

  // Cálculo matemático para un bucle continuo de alejamiento (Zoom-Out)
  const layers = Array.from({ length: LAYER_COUNT }).map((_, i) => {
    const exponent = zoomProgress - i
    const scale = Math.pow(2, exponent)

    let opacity = 1
    if (scale > 1.0) {
      opacity = Math.max(0, 1 - (scale - 1) * 1.5)
    } else if (scale < 0.1) {
      opacity = Math.max(0, (scale - 0.03) / 0.07)
    }

    return {
      index: i,
      scale: Number(scale.toFixed(4)),
      opacity: Number(opacity.toFixed(3)),
      zIndex: LAYER_COUNT - i
    }
  })

  return (
    <div
      className={`relative w-full max-w-[560px] mx-auto rounded-2xl lg:rounded-3xl border border-white/15 bg-slate-950/80 shadow-[0_20px_50px_rgba(0,0,0,0.8),0_0_40px_rgba(0,96,181,0.25)] backdrop-blur-xl overflow-hidden transition-all duration-300 ${className}`}
      style={{ isolation: "isolate" }}
    >
      {/* ========================================================
          BARRA DE VENTANA ESTILO macOS (Ventana de navegador)
          ======================================================== */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-900/90 border-b border-white/10 select-none">
        {/* Botones de control de ventana de macOS */}
        <div className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full bg-[#FF5F56] border border-[#E0443E]/50 shadow-sm"
            title="Cerrar (demostración)"
          />
          <div
            className="w-3 h-3 rounded-full bg-[#FFBD2E] border border-[#DEA123]/50 shadow-sm"
            title="Minimizar (demostración)"
          />
          <div
            className="w-3 h-3 rounded-full bg-[#27C93F] border border-[#1AAB29]/50 shadow-sm"
            title="Maximizar (demostración)"
          />
          <span className="hidden sm:inline-block ml-3 text-xs font-semibold text-slate-300 truncate max-w-[170px]">
            TelTec Net — Cañar
          </span>
        </div>

        {/* Barra de dirección URL */}
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-950/60 border border-white/10 text-[11px] text-slate-400 font-mono">
          <Lock className="w-3 h-3 text-emerald-400" />
          <span className="text-white/90">teltecnet.ec</span>
          <span className="text-slate-500">/fibra-canar</span>
        </div>

        {/* Controles de accesibilidad: Pausar / Reanudar */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsPaused((prev) => !prev)}
            aria-label={isPaused ? "Reanudar efecto de zoom continuo" : "Pausar efecto de zoom continuo"}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-medium border border-white/10 transition-colors focus:outline-none focus:ring-2 focus:ring-teltec-blue"
            title={isPaused ? "Reanudar animación" : "Pausar animación"}
          >
            {isPaused ? (
              <>
                <Play className="w-3 h-3 fill-current text-emerald-400" />
                <span className="text-[10px] hidden sm:inline">Reanudar</span>
              </>
            ) : (
              <>
                <Pause className="w-3 h-3 fill-current text-amber-300" />
                <span className="text-[10px] hidden sm:inline">Pausar</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* ========================================================
          LIENZO DE ZOOM CONTINUO CON PERSPECTIVA Y CAPAS ANIDADAS
          ======================================================== */}
      <div
        className="relative w-full aspect-[4/3] sm:aspect-[16/10] bg-[#020617] overflow-hidden flex items-center justify-center"
        style={{
          perspective: "1000px",
          transformStyle: "preserve-3d"
        }}
      >
        {/* Resplandor óptico central de fibra */}
        <div className="absolute inset-0 bg-radial-gradient from-teltec-blue/20 via-transparent to-transparent pointer-events-none" />
        <div className="absolute w-48 h-48 rounded-full bg-cyan-500/15 blur-3xl pointer-events-none" />

        {/* Capas recursivas sincronizadas matemáticamente */}
        {layers.map((layer) => (
          <div
            key={layer.index}
            aria-hidden="true"
            className="absolute inset-0 flex items-center justify-center pointer-events-none select-none transition-transform will-change-transform"
            style={{
              transform: `scale(${layer.scale}) translateZ(0)`,
              opacity: layer.opacity,
              zIndex: layer.zIndex
            }}
          >
            {/* Marco de pantalla nested preview proporcionado que llena el marco */}
            <div className="w-[94%] h-[90%] rounded-xl sm:rounded-2xl border border-cyan-400/30 bg-gradient-to-b from-slate-900/90 via-slate-950/95 to-[#020617] p-4 sm:p-5 shadow-[0_10px_35px_rgba(0,0,0,0.9),inset_0_1px_1px_rgba(255,255,255,0.15)] flex flex-col justify-between overflow-hidden relative">
              {/* Reflejo de cristal en el borde superior */}
              <div className="absolute -top-10 left-0 right-0 h-16 bg-gradient-to-b from-white/10 to-transparent rotate-3 pointer-events-none" />

              {/* Encabezado del mini sitio */}
              <div className="flex items-center justify-between border-b border-white/10 pb-2">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-teltec-blue to-cyan-400 flex items-center justify-center shadow-md shadow-teltec-blue/40">
                    <Wifi className="w-3.5 h-3.5 text-white" />
                  </div>
                  <span className="font-black text-sm tracking-tight text-white">
                    TelTec <span className="text-cyan-400">Net</span>
                  </span>
                </div>
                <div className="flex items-center gap-1 text-[9px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono border border-emerald-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  ONLINE • 99.9%
                </div>
              </div>

              {/* Contenido representativo de la pantalla */}
              <div className="my-auto space-y-2.5 py-1">
                <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-[9px] font-bold text-cyan-300 uppercase tracking-widest">
                  <Sparkles className="w-2.5 h-2.5" />
                  Fibra Óptica de Nueva Generación
                </div>

                <h4 className="text-lg sm:text-2xl font-black text-white leading-tight tracking-tight">
                  Conectando <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-teltec-blue-light">Cañar</span>
                </h4>

                <p className="text-[11px] sm:text-xs text-slate-300 line-clamp-2 max-w-sm">
                  Internet de alta velocidad sin caídas ni letras pequeñas en comunidades rurales y centros urbanos.
                </p>

                {/* Mini tarjetas de métricas */}
                <div className="grid grid-cols-3 gap-2 pt-1">
                  <div className="p-2 rounded-lg bg-white/5 border border-white/10 text-center">
                    <div className="text-[10px] text-slate-400 font-medium">Uptime</div>
                    <div className="text-xs font-bold text-emerald-400">99.9%</div>
                  </div>
                  <div className="p-2 rounded-lg bg-white/5 border border-white/10 text-center">
                    <div className="text-[10px] text-slate-400 font-medium">Clientes</div>
                    <div className="text-xs font-bold text-cyan-400">100+</div>
                  </div>
                  <div className="p-2 rounded-lg bg-white/5 border border-white/10 text-center">
                    <div className="text-[10px] text-slate-400 font-medium">Soporte</div>
                    <div className="text-xs font-bold text-white">24/7 Local</div>
                  </div>
                </div>
              </div>

              {/* Pie del mini sitio */}
              <div className="flex items-center justify-between text-[10px] text-slate-400 pt-2 border-t border-white/5">
                <span className="flex items-center gap-1">
                  <Shield className="w-3 h-3 text-cyan-400" /> Cobertura Provincial
                </span>
                <span className="font-semibold text-cyan-300">Instalación 24-48h</span>
              </div>
            </div>
          </div>
        ))}

        {/* Indicador de estado de la animación flotante accesible */}
        <div className="absolute bottom-3 left-4 z-20 flex items-center gap-2 pointer-events-none">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-950/80 backdrop-blur-md border border-white/10 text-[10px] text-slate-300">
            <span
              className={`w-2 h-2 rounded-full ${
                isPaused ? "bg-amber-400" : "bg-emerald-400 animate-ping"
              }`}
            />
            <span className="font-mono">
              {isPaused ? "Zoom Pausado" : "Efecto Zoom Infinito Activo"}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
