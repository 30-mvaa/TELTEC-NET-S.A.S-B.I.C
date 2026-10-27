let _whatsappPhone = '593984517703'

export function getWhatsappPhone(): string {
  return _whatsappPhone
}

export function setWhatsappPhone(phone: string): void {
  const cleaned = phone.replace(/[^0-9]/g, '').replace(/^0+/, '')
  if (cleaned) {
    _whatsappPhone = cleaned.startsWith('593') ? cleaned : `593${cleaned}`
  }
}

/**
 * Genera el enlace oficial a WhatsApp con formato internacional limpio (+593 para Ecuador)
 */
export function getWhatsAppLink(planName?: string, planPrice?: string | number, phone?: string): string {
  const effectivePhone = phone || _whatsappPhone
  let message = 'Hola TelTec Net, deseo información sobre el servicio de internet de alta velocidad.'
  if (planName) {
    const priceStr = planPrice ? ` ($${typeof planPrice === 'number' ? planPrice.toFixed(2) : planPrice}/mes)` : ''
    message = `Hola TelTec Net, deseo contratar el servicio de internet.\n\nMe interesa el: ${planName}${priceStr}.\n¿Podrían indicarme los requisitos y disponibilidad en mi sector?`
  }
  const encodedMessage = encodeURIComponent(message)
  return `https://wa.me/${effectivePhone}?text=${encodedMessage}`
}

/**
 * Enlace para consulta de cobertura en un sector específico
 */
export function getCoverageWhatsAppLink(sectorName?: string, phone?: string): string {
  const effectivePhone = phone || _whatsappPhone
  let message = 'Hola TelTec Net, deseo consultar disponibilidad y cobertura de fibra óptica en mi sector.'
  if (sectorName) {
    message = `Hola TelTec Net, deseo consultar si tienen cobertura de internet en el sector: ${sectorName}, provincia de Cañar.`
  }
  const encodedMessage = encodeURIComponent(message)
  return `https://wa.me/${effectivePhone}?text=${encodedMessage}`
}

/**
 * Enlace para consulta de servicios complementarios (domótica, cámaras, alarmas, etc.)
 */
export function getServiceWhatsAppLink(serviceName: string, phone?: string): string {
  const effectivePhone = phone || _whatsappPhone
  const message = `Hola TelTec Net, me gustaría recibir más información y una cotización sobre el servicio de: ${serviceName}.`
  const encodedMessage = encodeURIComponent(message)
  return `https://wa.me/${effectivePhone}?text=${encodedMessage}`
}

export function openWhatsApp(planName?: string, planPrice?: string): void {
  const url = getWhatsAppLink(planName, planPrice)
  if (typeof window !== 'undefined') {
    window.open(url, '_blank', 'noopener,noreferrer')
  }
}
