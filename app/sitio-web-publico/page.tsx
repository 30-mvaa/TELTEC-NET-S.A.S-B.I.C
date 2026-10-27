"use client"

import React, { useState, useMemo } from "react"
import dynamic from "next/dynamic"
import Script from "next/script"
import { useSitioWebData } from "./hooks/useSitioWebData"

// Carga de componentes
const Header = dynamic(() => import("./components/Header"), { ssr: false })
const Hero = dynamic(() => import("./components/Hero"), { ssr: false })
const StatsAndFeatures = dynamic(() => import("./components/StatsAndFeatures"), { ssr: false })
const Garantia = dynamic(() => import("./components/Garantia"), { ssr: false })
const Servicios = dynamic(() => import("./components/Servicios"), { ssr: false })
const Planes = dynamic(() => import("./components/Planes"), { ssr: false })
const Testimonios = dynamic(() => import("./components/Testimonios"), { ssr: false })
const Cobertura = dynamic(() => import("./components/Cobertura"), { ssr: false })
const FAQ = dynamic(() => import("./components/FAQ"), { ssr: false })
const Contacto = dynamic(() => import("./components/Contacto"), { ssr: false })
const Footer = dynamic(() => import("./components/Footer"), { ssr: false })
const Modals = dynamic(() => import("./components/Modals"), { ssr: false })
const WhatsAppButton = dynamic(() => import("./components/WhatsAppButton"), { ssr: false })
const Chatbot = dynamic(() => import("./components/Chatbot"), { ssr: false })

function SkipLink() {
  return (
    <a
      href="#contenido"
      className="sr-only fixed left-4 top-4 z-[100] rounded-lg bg-teltec-blue px-4 py-2 text-sm text-white shadow-lg outline-none focus:not-sr-only focus:ring-2 focus:ring-cyan-400"
    >
      Saltar al contenido principal
    </a>
  )
}

export default function SitioWebPublicoPage() {
  const { data: sitioWeb, loading, error } = useSitioWebData()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null)
  const [selectedService, setSelectedService] = useState<string | null>(null)

  const servicios = sitioWeb.servicios
  const planes = sitioWeb.planes
  const sectores = sitioWeb.sectores
  const testimonios = sitioWeb.testimonios
  const faqs = sitioWeb.faqs
  const contactos = sitioWeb.contactos
  const redesSociales = sitioWeb.redesSociales
  const empresa = sitioWeb.empresa
  const informacion = sitioWeb.informacion

  const whatsappPhone = useMemo(() => {
    return empresa.whatsappInternacional || "593984517703"
  }, [empresa])

  return (
    <div
      className="min-h-screen bg-[#020617] text-white flex flex-col overflow-x-hidden selection:bg-cyan-500 selection:text-slate-950"
      role="document"
    >
      <SkipLink />

      {/* Metadatos estructurados Schema.org para Telecomunicaciones e ISP */}
      <Script id="org-schema" type="application/ld+json" strategy="afterInteractive">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "InternetServiceProvider",
          name: "TelTec Net",
          alternateName: "TelTec Net - Internet de Alta Velocidad",
          url: "https://www.teltecnet.ec",
          logo: "https://www.teltecnet.ec/images/logo.png",
          description: empresa.descripcion,
          telephone: empresa.telefono,
          address: {
            "@type": "PostalAddress",
            streetAddress: "Av. 24 de Mayo 123",
            addressLocality: "Azogues",
            addressRegion: "Cañar",
            addressCountry: "EC"
          },
          geo: {
            "@type": "GeoCoordinates",
            latitude: -2.74,
            longitude: -78.84
          },
          openingHoursSpecification: [
            {
              "@type": "OpeningHoursSpecification",
              dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
              opens: "08:00",
              closes: "18:00"
            },
            {
              "@type": "OpeningHoursSpecification",
              dayOfWeek: ["Saturday"],
              opens: "08:00",
              closes: "14:00"
            }
          ]
        })}
      </Script>

      {/* Header oficial con navegación fluida y menú accesible */}
      <Header
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
      />

      <main id="contenido" className="isolate">
        {/* 1. Hero con zoom continuo estilo ventana macOS */}
        <Hero
          informacion={informacion}
          empresa={empresa}
          isVisible={true}
        />

        {/* 2. ¿Por qué elegir TelTec Net? */}
        <StatsAndFeatures
          isVisible={true}
          features={sitioWeb.features}
        />

        {/* 3. Nuestra Garantía de Servicio */}
        <Garantia />

        {/* 4. Nuestros Servicios */}
        <Servicios
          servicios={servicios}
          onServiceClick={setSelectedService}
        />

        {/* 5. Planes de Internet reconciliados */}
        <Planes
          planes={planes}
        />

        {/* 6. Testimonios reales de clientes */}
        <Testimonios
          testimonios={testimonios}
        />

        {/* 7. Zonas de Cobertura con búsqueda y mapa esquemático */}
        <Cobertura
          sectores={sectores}
          onProductClick={setSelectedProduct}
        />

        {/* 8. Preguntas Frecuentes en acordeón accesible */}
        <FAQ
          faqs={faqs}
        />

        {/* 9. Contacto con datos oficiales y formulario directo a WhatsApp */}
        <Contacto
          contactos={contactos}
          redesSociales={redesSociales}
        />
      </main>

      {/* 10. Footer completo con datos corporativos y modales de términos/privacidad */}
      <Footer
        empresa={empresa}
        contactos={contactos}
        redesSociales={redesSociales}
      />

      {/* Botón flotante oficial de WhatsApp */}
      <WhatsAppButton phone={whatsappPhone} />

      {/* Chatbot asistido */}
      <Chatbot />

      {/* Modales para detalles de servicios y productos */}
      <Modals
        selectedProduct={selectedProduct}
        selectedService={selectedService}
        onCloseProduct={() => setSelectedProduct(null)}
        onCloseService={() => setSelectedService(null)}
      />
    </div>
  )
}
