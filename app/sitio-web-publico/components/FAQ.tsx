"use client"

import React, { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronDown, HelpCircle, MessageCircle } from "lucide-react"
import { getWhatsAppLink } from "../lib/whatsapp"
import { FAQItem, FAQ_DATA } from "../lib/defaultData"

interface FAQProps {
  faqs?: FAQItem[]
}

export default function FAQ({ faqs }: FAQProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(0)
  const displayFaqs = faqs && faqs.length > 0 ? faqs : FAQ_DATA

  const toggleAccordion = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx)
  }

  return (
    <section id="faq" className="relative py-12 sm:py-16 bg-slate-950 border-t border-white/5 overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[450px] h-[200px] bg-cyan-500/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 backdrop-blur-md mb-3">
            <HelpCircle className="w-3 h-3 text-cyan-300" />
            <span className="text-[11px] font-bold text-cyan-300 uppercase tracking-widest">
              Respuestas Claras
            </span>
          </div>

          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight mb-2">
            Preguntas <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-teltec-blue-light">Frecuentes</span>
          </h2>

          <p className="text-slate-400 text-xs sm:text-sm">
            Todo lo que necesitas saber sobre nuestro servicio de internet.
          </p>
        </div>

        <div className="space-y-3">
          {displayFaqs.map((faq, idx) => {
            const isOpen = openIndex === idx
            const panelId = `faq-panel-${idx}`
            const buttonId = `faq-btn-${idx}`

            return (
              <div
                key={faq.id || idx}
                className="rounded-xl border border-white/10 bg-white/[0.03] overflow-hidden transition-all duration-200 hover:border-cyan-400/30"
              >
                <button
                  id={buttonId}
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                  onClick={() => toggleAccordion(idx)}
                  className="flex w-full items-center justify-between px-4 py-3 sm:px-5 sm:py-3.5 text-left transition-colors focus:outline-none focus:bg-white/[0.05]"
                >
                  <span className="font-bold text-white text-xs sm:text-sm pr-3">
                    {faq.pregunta}
                  </span>
                  <div className={`p-1 rounded-full bg-white/5 border border-white/10 text-cyan-300 transition-transform duration-200 flex-shrink-0 ${isOpen ? "rotate-180 bg-cyan-500/20" : ""}`}>
                    <ChevronDown className="h-3.5 w-3.5" />
                  </div>
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      id={panelId}
                      role="region"
                      aria-labelledby={buttonId}
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2, ease: "easeInOut" }}
                    >
                      <div className="px-4 pb-4 pt-1 sm:px-5 sm:pb-4 text-slate-300 text-xs leading-relaxed border-t border-white/5">
                        {faq.respuesta}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )
          })}
        </div>

        {/* CTA adicional */}
        <div className="mt-8 text-center">
          <p className="text-[11px] text-slate-400 mb-2">
            ¿Tienes alguna otra duda o consulta técnica sobre tu sector?
          </p>
          <a
            href={getWhatsAppLink()}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-cyan-300 hover:text-white transition-colors"
          >
            <MessageCircle className="w-3 h-3" />
            <span>Hablar directamente con un asesor por WhatsApp</span>
          </a>
        </div>
      </div>
    </section>
  )
}
