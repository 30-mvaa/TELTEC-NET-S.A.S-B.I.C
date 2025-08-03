import { NextRequest, NextResponse } from 'next/server'
import PDFDocument from 'pdfkit'
import fs from 'fs'
import path from 'path'

export async function POST(req: NextRequest) {
  try {
    console.log('🔄 API de contrato llamada');
    const data = await req.json()
    console.log('📋 Datos recibidos:', data);
    
    // Datos del cliente
    const {
      nombres,
      apellidos,
      cedula,
      direccion,
      tipo_plan,
      precio_plan,
      sector,
      fecha_nacimiento,
      email,
      telefono,
      velocidad_descarga = '',
      velocidad_subida = '',
      tipo_conexion = '',
      ip = '',
      valor_instalacion = '',
      canton = '',
      ciudad = '',
      dia_firma = '',
      mes_firma = '',
      anio_firma = '',
    } = data

    // Datos de la empresa (puedes personalizar)
    const empresa = {
      nombre: 'TELTEC NET S.A.',
      ruc: '0999999999',
      direccion: 'Av. Principal y Calle Secundaria, Ciudad',
      representante: 'Juan Pérez',
      ci_representante: '0102030405',
      cargo: 'Gerente General',
    }

    // Crear PDF
    const doc = new PDFDocument({ margin: 40 })
    const fontPath = path.join(process.cwd(), 'public', 'fonts', 'Roboto-Regular.ttf');
    doc.registerFont('roboto', fontPath);
    doc.font('roboto');
    const buffers: Buffer[] = []
    doc.on('data', buffers.push.bind(buffers))
    doc.on('end', () => {})

    // Insertar logo centrado si existe, si no, continuar sin error
    try {
      const logoPath = path.join(process.cwd(), 'public', 'images', 'ttnet-logo.png')
      if (fs.existsSync(logoPath)) {
        doc.image(logoPath, doc.page.width / 2 - 60, undefined, { width: 120, align: 'center' })
        doc.moveDown(1)
      } else {
        console.warn('Logo no encontrado en public/images/ttnet-logo.png. El contrato se generará sin logo.')
      }
    } catch (e) {
      console.warn('No se pudo insertar el logo en el contrato PDF:', e)
    }

    doc.font('roboto').fontSize(14).text('CONTRATO DE PRESTACIÓN DE SERVICIO DE INTERNET.', { align: 'center', underline: true })
    doc.moveDown(0.5)
    doc.font('roboto').fontSize(12).text('ENTRE LA EMPRESA TELTEC NET Y EL CLIENTE', { align: 'center' })
    doc.moveDown(1)

    doc.font('roboto').fontSize(11).text(
      `Comparecen a la celebración del presente contrato: por una parte, la empresa ${empresa.nombre}, legalmente constituida conforme a las leyes ecuatorianas, con RUC No. ${empresa.ruc}, domiciliada en ${empresa.direccion}, representada por su Gerente General ${empresa.representante}, a quien en adelante se le denominará LA EMPRESA; y por otra parte, el/la señor(a) ${nombres} ${apellidos}, portador(a) de la cédula de identidad No. ${cedula}, domiciliado(a) en ${direccion}, a quien en adelante se le denominará EL CLIENTE.\n\nAmbas partes, libres y voluntariamente, acuerdan celebrar el presente contrato de Prestación de Servicio de Internet al tenor de las siguientes cláusulas:`
    )
    doc.moveDown(1)

    // Títulos de cláusulas en negrita simulada (mayúsculas)
    doc.font('roboto').fontSize(11).text('CLÁUSULA PRIMERA: OBJETO DEL CONTRATO')
    doc.font('roboto').fontSize(11).text('LA EMPRESA se compromete a prestar a EL CLIENTE el servicio de acceso a Internet, bajo las condiciones técnicas, económicas y legales establecidas en este contrato y en los anexos correspondientes.')
    doc.moveDown(0.5)

    doc.font('roboto').fontSize(11).text('CLÁUSULA SEGUNDA: PLAZO')
    doc.font('roboto').fontSize(11).text('El presente contrato tendrá una duración de un (1) año, contado a partir de la fecha de firma del mismo, y podrá ser renovado por acuerdo de ambas partes mediante anexo escrito.')
    doc.moveDown(0.5)

    doc.font('roboto').fontSize(11).text('CLÁUSULA TERCERA: CARACTERÍSTICAS DEL SERVICIO')
    doc.font('roboto').fontSize(11).text(`\n§  Velocidad de descarga: ${velocidad_descarga || '[___]'} Mbps\n§  Velocidad de subida: ${velocidad_subida || '[___]'} Mbps\n§  Tipo de conexión: ${tipo_conexion || '[Fibra óptica / Inalámbrica / Otro]'}\n§  IP: ${ip || '[Dinámica / Estática]'}\n§  Soporte técnico: 24/7\n§  Instalación: gratuita / valor de $${valor_instalacion || '[___]'}`)
    doc.moveDown(0.5)

    doc.font('roboto').fontSize(11).text('CLÁUSULA CUARTA: VALOR Y FORMA DE PAGO')
    doc.font('roboto').fontSize(11).text(`EL CLIENTE se obliga a pagar a LA EMPRESA la suma mensual de $${precio_plan || '_____'} (Dólares de los Estados Unidos de América), que deberá ser cancelada hasta el 5 de cada mes mediante depósito, transferencia o pago en línea. El retraso en el pago generará una mora del 2% mensual sobre el saldo adeudado.`)
    doc.moveDown(0.5)

    doc.font('roboto').fontSize(11).text('CLÁUSULA QUINTA: OBLIGACIONES DE LAS PARTES')
    doc.font('roboto').fontSize(11).text(`\nEMPRESA:\n§  Garantizar la prestación continua del servicio con una disponibilidad mínima del 98%.\n§  Brindar soporte técnico oportuno ante fallas o interrupciones.\n§  Informar con al menos 24 horas de anticipación sobre mantenimientos programados.\n\nCLIENTE:\n§  Usar el servicio conforme a la ley y sin afectar redes de terceros.\n§  Permitir el acceso técnico a su domicilio si se requiere para instalación o mantenimiento.\n§  Cumplir con la fecha de pago mensual estipulada.\n§  En caso de acumular una deuda superior a dos (2) meses consecutivos, LA EMPRESA retirará los equipos instalados en el domicilio del CLIENTE sin necesidad de resolución judicial, debiendo EL CLIENTE permitir el acceso para dicho retiro.\n§  Si los equipos instalados se queman, dañan o dejan de funcionar debido a causas imputables al entorno o manejo del CLIENTE (como subidas de tensión, cortocircuitos, mala manipulación, etc.), EL CLIENTE deberá cancelar únicamente el valor del equipo a reponer, exonerándose del pago por nueva instalación.\n§  Pagar puntualmente las facturas generadas por el servicio contratado.`)
    doc.moveDown(0.5)

    doc.font('roboto').fontSize(11).text('CLÁUSULA SEXTA: SUSPENSIÓN Y TERMINACIÓN')
    doc.font('roboto').fontSize(11).text(`LA EMPRESA podrá suspender el servicio en caso de:\n§  Falta de pago por más de 15 días.\n§  Uso indebido de la red.\n§  Incumplimiento contractual por parte de EL CLIENTE.\n\nEl contrato podrá darse por terminado de mutuo acuerdo o por incumplimiento grave de alguna de las partes.`)
    doc.moveDown(0.5)

    doc.font('roboto').fontSize(11).text('CLÁUSULA SÉPTIMA: RESPONSABILIDAD')
    doc.font('roboto').fontSize(11).text('LA EMPRESA no será responsable por interrupciones ocasionadas por fuerza mayor, fallos eléctricos o causas externas ajenas a su control.')
    doc.moveDown(0.5)

    doc.font('roboto').fontSize(11).text('CLÁUSULA OCTAVA: JURISDICCIÓN Y COMPETENCIA')
    doc.font('roboto').fontSize(11).text(`Para cualquier controversia derivada del presente contrato, las partes se someten a la jurisdicción de los jueces del cantón ${canton || '______________'}, renunciando expresamente a cualquier otro fuero que pudiera corresponderles.`)
    doc.moveDown(0.5)

    doc.font('roboto').fontSize(11).text('CLÁUSULA NOVENA: ACEPTACIÓN')
    doc.font('roboto').fontSize(11).text(`Leído que fue el presente contrato, y encontrándolo conforme, lo firman por duplicado en ${ciudad || '______'}, a los ${dia_firma || '______'} días del mes de ${mes_firma || '______'} del año ${anio_firma || '_________'}.`)
    doc.moveDown(1)

    // Firmas
    doc.font('roboto').fontSize(11).text('POR LA EMPRESA TELTEC NET', { continued: false })
    doc.font('roboto').fontSize(11).text(`Nombre: ${empresa.representante}`)
    doc.font('roboto').fontSize(11).text(`C.I.: ${empresa.ci_representante}`)
    doc.font('roboto').fontSize(11).text(`Cargo: ${empresa.cargo}`)
    doc.font('roboto').fontSize(11).text('Firma: ________________________')
    doc.moveDown(1)
    doc.font('roboto').fontSize(11).text('POR EL CLIENTE', { continued: false })
    doc.font('roboto').fontSize(11).text(`Nombre: ${nombres} ${apellidos}`)
    doc.font('roboto').fontSize(11).text(`C.I.: ${cedula}`)
    doc.font('roboto').fontSize(11).text(`Dirección: ${direccion}`)
    doc.font('roboto').fontSize(11).text('Firma: ________________________')
    doc.end()

    const pdfBuffer = await new Promise<Buffer>((resolve) => {
      doc.on('end', () => {
        console.log('✅ PDF generado exitosamente');
        resolve(Buffer.concat(buffers))
      })
    })

    console.log('📄 Tamaño del PDF:', pdfBuffer.length, 'bytes');
    console.log('📁 Nombre del archivo:', `Contrato_${nombres}_${apellidos}.pdf`);

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename=Contrato_${nombres}_${apellidos}.pdf`,
      },
    })
  } catch (e) {
    console.error('❌ Error generando contrato PDF:', e)
    console.error('📄 Stack trace:', (e as Error).stack)
    return new NextResponse(
      JSON.stringify({ success: false, message: 'Error generando contrato PDF', error: String(e) }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
} 