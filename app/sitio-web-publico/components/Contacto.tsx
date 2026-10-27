"use client"

import { useState } from "react"
import { Phone, Mail, MessageCircle, MapPin, Clock, Send, Sparkles, CheckCircle2 } from "lucide-react"

interface ContactoProps {
  contactos?: any[]
  redesSociales?: Record<string, string>
}

export default function Contacto({ contactos, redesSociales = {} }: ContactoProps) {
  const [formSubmitted, setFormSubmitted] = useState(false)
  const [nombre, setNombre] = useState("")
  const [telefono, setTelefono] = useState("")
  const [sector, setSector] = useState("")
  const [mensaje, setMensaje] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    let text = `Hola TelTec Net, me contacto a través del sitio web:\n- Nombre: ${nombre || "Interesado"}\n- Teléfono: ${telefono || "No especificado"}\n- Sector: ${sector || "Cañar"}`
    if (mensaje) text += `\n- Mensaje: ${mensaje}`

    const encoded = encodeURIComponent(text)
    const url = `https://wa.me/593984517703?text=${encoded}`
    window.open(url, "_blank", "noopener,noreferrer")
    setFormSubmitted(true)
  }

  return (
    <section id="contacto" className="relative py-12 sm:py-16 bg-[#020617] border-t border-white/5 overflow-hidden">
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-[450px] h-[450px] bg-teltec-blue/10 rounded-full blur-[130px]" />
      </div>

      <div className="relative max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 backdrop-blur-md mb-3">
            <Sparkles className="w-3 h-3 text-cyan-300" />
            <span className="text-[11px] font-bold text-cyan-300 uppercase tracking-widest">
              Atención Inmediata
            </span>
          </div>

          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight mb-2">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-teltec-blue-light">Contáctanos</span>
          </h2>

          <p className="text-slate-400 text-xs sm:text-sm max-w-lg mx-auto">
            Estamos aquí para ayudarte.
          </p>
        </div>

        <div className="grid lg:grid-cols-12 gap-6 items-start">
          {/* INFORMACIÓN DE CONTACTO SUMINISTRADA */}
          <div className="lg:col-span-5 space-y-3.5">
            {/* Teléfono Principal */}
            <a
              href="tel:0984517703"
              className="flex items-center gap-3 p-3.5 rounded-xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.05] hover:border-cyan-400/40 transition-all shadow-sm group"
            >
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-teltec-blue to-cyan-500 flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform flex-shrink-0">
                <Phone className="w-4 h-4 text-white" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Teléfono Principal</p>
                <p className="text-base font-bold text-white group-hover:text-cyan-300 transition-colors">
                  098 451 7703
                </p>
                <p className="text-[10px] text-slate-400">Llamada directa de atención</p>
              </div>
            </a>

            {/* WhatsApp Oficial */}
            <a
              href="https://wa.me/593984517703"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-3.5 rounded-xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.05] hover:border-emerald-400/40 transition-all shadow-sm group"
            >
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform flex-shrink-0">
                <MessageCircle className="w-4 h-4 text-white" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">WhatsApp Oficial</p>
                <p className="text-base font-bold text-white group-hover:text-emerald-300 transition-colors">
                  098 451 7703
                </p>
                <p className="text-[10px] text-emerald-400">Atención técnica y cotizaciones 24/7</p>
              </div>
            </a>

            {/* Email */}
            <a
              href="mailto:info@teltecnet.com"
              className="flex items-center gap-3 p-3.5 rounded-xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.05] hover:border-cyan-400/40 transition-all shadow-sm group"
            >
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform flex-shrink-0">
                <Mail className="w-4 h-4 text-white" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Correo Electrónico</p>
                <p className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors truncate">
                  info@teltecnet.com
                </p>
                <p className="text-[10px] text-slate-400">Consultas corporativas y facturación</p>
              </div>
            </a>

            {/* Dirección */}
            <div className="flex items-start gap-3 p-3.5 rounded-xl border border-white/10 bg-white/[0.03] shadow-sm">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center flex-shrink-0 mt-0.5">
                <MapPin className="w-4 h-4 text-cyan-300" />
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Oficina Principal</p>
                <p className="text-xs font-bold text-white mt-0.5">
                  Av. 24 de Mayo 123, Centro de Azogues, Cañar
                </p>
              </div>
            </div>

            {/* Horarios de Atención */}
            <div className="flex items-start gap-3 p-3.5 rounded-xl border border-white/10 bg-white/[0.03] shadow-sm">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-600/80 to-orange-700/80 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Clock className="w-4 h-4 text-amber-200" />
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Horario de Atención</p>
                <p className="text-xs font-semibold text-white mt-0.5">
                  Lunes a Viernes: 8:00 AM - 6:00 PM
                </p>
                <p className="text-xs font-semibold text-white">
                  Sábados: 8:00 AM - 2:00 PM
                </p>
              </div>
            </div>
          </div>

          {/* FORMULARIO DE MENSAJE RÁPIDO */}
          <div className="lg:col-span-7">
            <div className="p-5 sm:p-7 rounded-2xl bg-slate-900/90 border border-white/15 shadow-xl backdrop-blur-xl">
              <div className="mb-4">
                <h3 className="text-lg sm:text-xl font-black text-white">
                  Envíanos tu consulta
                </h3>
                <p className="text-slate-400 text-xs mt-0.5">
                  Déjanos tus datos y te responderemos en minutos por WhatsApp o llamada.
                </p>
              </div>

              {formSubmitted ? (
                <div className="p-6 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-center space-y-2">
                  <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
                  <h4 className="text-base font-bold text-white">¡Mensaje enviado con éxito!</h4>
                  <p className="text-xs text-slate-300">
                    Se ha abierto una conversación en WhatsApp con nuestro equipo técnico en Cañar.
                  </p>
                  <button
                    onClick={() => setFormSubmitted(false)}
                    className="mt-3 px-4 py-1.5 rounded-lg bg-white/10 text-white text-xs font-semibold hover:bg-white/20 transition-colors"
                  >
                    Enviar otro mensaje
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-3">
                  <div className="grid sm:grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="contacto-nombre" className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                        Tu Nombre
                      </label>
                      <input
                        id="contacto-nombre"
                        type="text"
                        required
                        placeholder="Ej: Juan Pérez"
                        value={nombre}
                        onChange={(e) => setNombre(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-slate-950/80 border border-white/10 text-white placeholder-slate-500 focus:ring-1 focus:ring-cyan-400 outline-none text-xs"
                      />
                    </div>

                    <div>
                      <label htmlFor="contacto-telefono" className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                        Teléfono / WhatsApp
                      </label>
                      <input
                        id="contacto-telefono"
                        type="tel"
                        required
                        placeholder="Ej: 0984517703"
                        value={telefono}
                        onChange={(e) => setTelefono(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-slate-950/80 border border-white/10 text-white placeholder-slate-500 focus:ring-1 focus:ring-cyan-400 outline-none text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="contacto-sector" className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                      Sector / Comunidad en Cañar
                    </label>
                    <input
                      id="contacto-sector"
                      type="text"
                      placeholder="Ej: Sisid, Tambo, Ingapirca, etc."
                      value={sector}
                      onChange={(e) => setSector(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-slate-950/80 border border-white/10 text-white placeholder-slate-500 focus:ring-1 focus:ring-cyan-400 outline-none text-xs"
                    />
                  </div>

                  <div>
                    <label htmlFor="contacto-mensaje" className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                      ¿Qué plan o servicio te interesa?
                    </label>
                    <textarea
                      id="contacto-mensaje"
                      rows={3}
                      placeholder="Me interesa el Plan Familiar o consultar disponibilidad..."
                      value={mensaje}
                      onChange={(e) => setMensaje(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-slate-950/80 border border-white/10 text-white placeholder-slate-500 focus:ring-1 focus:ring-cyan-400 outline-none text-xs resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-teltec-blue to-cyan-500 hover:from-teltec-blue-light hover:to-cyan-400 text-white font-bold text-xs shadow-md shadow-teltec-blue/30 transition-all flex items-center justify-center gap-1.5 active:scale-[0.99]"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Iniciar consulta por WhatsApp</span>
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
