"use client"

import { useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { Wifi, Mail, Phone, MapPin, Clock, MessageCircle, X, FileText, ArrowUp } from "lucide-react"
import { getWhatsAppLink } from "../lib/whatsapp"

interface FooterProps {
  empresa?: any
  contactos?: any[]
  redesSociales?: Record<string, string>
}

const navLinks = [
  { href: "#inicio", label: "Inicio" },
  { href: "#servicios", label: "Servicios" },
  { href: "#planes", label: "Planes" },
  { href: "#cobertura", label: "Cobertura" },
  { href: "#faq", label: "Preguntas frecuentes" },
  { href: "#contacto", label: "Contacto" }
]

export default function Footer({ empresa, contactos = [], redesSociales = {} }: FooterProps) {
  const [legalModal, setLegalModal] = useState<"terminos" | "privacidad" | null>(null)
  const currentYear = 2026

  const scrollToTop = () => {
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" })
    }
  }

  return (
    <>
      <footer className="relative bg-slate-950 border-t border-white/10 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900/40 via-slate-950 to-slate-950 pointer-events-none" />

        <div className="relative max-w-[1300px] mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
          {/* ========================================================
              FILA 1 HORIZONTAL: IDENTIDAD, ENLACES Y CTA WHATSAPP
              ======================================================== */}
          <div className="flex flex-col lg:flex-row items-center justify-between gap-4 pb-6 border-b border-white/10">
            <div className="flex items-center gap-3">
              <a href="#inicio" className="flex items-center gap-2.5 group">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teltec-blue to-cyan-500 flex items-center justify-center shadow-md shadow-teltec-blue/30 group-hover:scale-105 transition-transform flex-shrink-0">
                  <Wifi className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="font-black text-lg text-white tracking-tight flex items-center gap-1">
                    TelTec <span className="text-cyan-400">Net</span>
                  </p>
                  <p className="text-[10px] text-slate-400">Internet & Tecnología • Cañar, Ecuador</p>
                </div>
              </a>
            </div>

            <nav className="flex flex-wrap items-center justify-center gap-1">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="px-3 py-1 rounded-full text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/5 border border-transparent hover:border-white/10 transition-all"
                >
                  {link.label}
                </a>
              ))}
            </nav>

            <div className="flex items-center gap-2">
              <a
                href={getWhatsAppLink()}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-all hover:scale-105"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>WhatsApp Soporte</span>
              </a>

              <button
                onClick={scrollToTop}
                aria-label="Volver arriba"
                title="Volver arriba"
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 transition-colors"
              >
                <ArrowUp className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* ========================================================
              FILA 2 HORIZONTAL: DATOS DE CONTACTO EN BARRAS COMPACTAS
              ======================================================== */}
          <div className="py-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 border-b border-white/10">
            {/* Teléfono */}
            <a
              href="tel:0984517703"
              className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/5 hover:border-cyan-400/30 hover:bg-white/[0.05] transition-all group"
            >
              <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 flex-shrink-0">
                <Phone className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0">
                <p className="text-[9px] font-mono uppercase tracking-wider text-slate-400">Teléfono Principal</p>
                <p className="text-xs font-bold text-white group-hover:text-cyan-300 transition-colors truncate">
                  098 451 7703
                </p>
              </div>
            </a>

            {/* Correo */}
            <a
              href="mailto:info@teltecnet.com"
              className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/5 hover:border-cyan-400/30 hover:bg-white/[0.05] transition-all group"
            >
              <div className="p-2 rounded-lg bg-blue-500/10 text-blue-300 border border-blue-500/20 flex-shrink-0">
                <Mail className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0">
                <p className="text-[9px] font-mono uppercase tracking-wider text-slate-400">Correo Electrónico</p>
                <p className="text-xs font-bold text-white group-hover:text-cyan-300 transition-colors truncate">
                  info@teltecnet.com
                </p>
              </div>
            </a>

            {/* Dirección */}
            <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/5">
              <div className="p-2 rounded-lg bg-slate-500/10 text-cyan-300 border border-slate-500/20 flex-shrink-0">
                <MapPin className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0">
                <p className="text-[9px] font-mono uppercase tracking-wider text-slate-400">Oficina Matriz</p>
                <p className="text-xs font-semibold text-white truncate" title="Av. 24 de Mayo 123, Centro de Azogues, Cañar">
                  Av. 24 de Mayo 123, Azogues
                </p>
              </div>
            </div>

            {/* Horarios */}
            <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/5">
              <div className="p-2 rounded-lg bg-amber-500/10 text-amber-300 border border-amber-500/20 flex-shrink-0">
                <Clock className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0">
                <p className="text-[9px] font-mono uppercase tracking-wider text-slate-400">Horario</p>
                <p className="text-xs font-semibold text-white truncate">
                  Lun-Vie: 8am-6pm | Sáb: 8am-2pm
                </p>
              </div>
            </div>
          </div>

          {/* ========================================================
              FILA 3 HORIZONTAL: COPYRIGHT Y LEGAL
              ======================================================== */}
          <div className="pt-6 flex flex-col md:flex-row items-center justify-between gap-3 text-[11px] text-slate-400">
            <div className="flex flex-wrap items-center gap-1.5 text-center md:text-left">
              <span>© {currentYear} TelTec Net. Todos los derechos reservados.</span>
              <span className="hidden sm:inline text-slate-600">•</span>
              <span>Cañar, Ecuador.</span>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-4">
              <div className="flex items-center gap-2 text-[10px] text-slate-500">
                <span>Facebook</span>
                <span>•</span>
                <span>Instagram</span>
                <span>•</span>
                <span>TikTok</span>
              </div>

              <div className="h-3 w-px bg-white/10 hidden sm:block" />

              <button
                onClick={() => setLegalModal("terminos")}
                className="hover:text-cyan-300 transition-colors underline-offset-4 hover:underline"
              >
                Términos
              </button>
              <button
                onClick={() => setLegalModal("privacidad")}
                className="hover:text-cyan-300 transition-colors underline-offset-4 hover:underline"
              >
                Privacidad
              </button>
            </div>
          </div>
        </div>
      </footer>

      {/* MODAL ACCESIBLE DE TÉRMINOS Y PRIVACIDAD */}
      <AnimatePresence>
        {legalModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-lg max-h-[80vh] overflow-y-auto rounded-2xl bg-slate-900 border border-white/20 p-6 text-white shadow-2xl"
            >
              <button
                onClick={() => setLegalModal(null)}
                className="absolute top-4 right-4 p-1.5 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                aria-label="Cerrar ventana"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-2.5 mb-3">
                <div className="p-2 rounded-lg bg-cyan-500/20 text-cyan-300">
                  <FileText className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold">
                  {legalModal === "terminos" ? "Términos del Servicio" : "Política de Privacidad"}
                </h3>
              </div>

              <div className="space-y-3 text-xs text-slate-300 leading-relaxed border-t border-white/10 pt-3">
                {legalModal === "terminos" ? (
                  <>
                    <p>
                      <strong>TelTec Net</strong> presta servicios de conectividad a internet de alta velocidad y soluciones tecnológicas en la provincia del Cañar, Ecuador.
                    </p>
                    <p>
                      <strong>Garantía de Servicio:</strong> Nos comprometemos a una instalación express en un plazo de 24 a 48 horas hábiles tras la verificación técnica de factibilidad en el sector solicitado.
                    </p>
                    <p>
                      <strong>Sin Contratos Forzosos:</strong> Creemos en la fidelización a través de la excelencia en el servicio, por lo que nuestros planes residenciales no obligan a plazos mínimos abusivos.
                    </p>
                  </>
                ) : (
                  <>
                    <p>
                      En <strong>TelTec Net</strong> nos comprometemos a resguardar la confidencialidad de la información personal de nuestros clientes y prospectos de la provincia del Cañar.
                    </p>
                    <p>
                      Los datos recolectados se utilizan exclusivamente para la coordinación de instalaciones, soporte técnico 24/7 y contacto directo solicitado por el usuario.
                    </p>
                  </>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-white/10 text-right">
                <button
                  onClick={() => setLegalModal(null)}
                  className="px-4 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs"
                >
                  Entendido
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  )
}
