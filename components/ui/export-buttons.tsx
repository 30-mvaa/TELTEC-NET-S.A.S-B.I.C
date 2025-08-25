import React from 'react';
import { Button } from '@/components/ui/button';
import { Download, FileSpreadsheet, FileText } from 'lucide-react';
import { API_ENDPOINTS } from '@/lib/config/api';

interface ExportButtonsProps {
  tipo: 'pagos' | 'deudas';
  filtros?: {
    fecha_inicio?: string;
    fecha_fin?: string;
    metodo_pago?: string;
  };
  className?: string;
}

export function ExportButtons({ tipo, filtros = {}, className = '' }: ExportButtonsProps) {
  const generarURL = (formato: 'excel' | 'pdf') => {
    const baseURL = tipo === 'pagos' 
      ? (formato === 'excel' ? API_ENDPOINTS.REPORTE_PAGOS_EXCEL : API_ENDPOINTS.REPORTE_PAGOS_PDF)
      : API_ENDPOINTS.REPORTE_DEUDAS_EXCEL;
    
    const params = new URLSearchParams();
    
    if (filtros.fecha_inicio) {
      params.append('fecha_inicio', filtros.fecha_inicio);
    }
    if (filtros.fecha_fin) {
      params.append('fecha_fin', filtros.fecha_fin);
    }
    if (filtros.metodo_pago) {
      params.append('metodo_pago', filtros.metodo_pago);
    }
    
    const queryString = params.toString();
    return queryString ? `${baseURL}?${queryString}` : baseURL;
  };

  const descargarReporte = async (formato: 'excel' | 'pdf') => {
    try {
      const url = generarURL(formato);
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error('Error al generar el reporte');
      }
      
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      
      const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
      const extension = formato === 'excel' ? 'xlsx' : 'pdf';
      link.download = `reporte_${tipo}_${timestamp}.${extension}`;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error('Error al descargar reporte:', error);
      alert('Error al generar el reporte. Por favor, intente nuevamente.');
    }
  };

  return (
    <div className={`flex gap-2 ${className}`}>
      <Button
        variant="outline"
        size="sm"
        onClick={() => descargarReporte('excel')}
        className="flex items-center gap-2"
      >
        <FileSpreadsheet className="h-4 w-4" />
        Exportar Excel
      </Button>
      
      {tipo === 'pagos' && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => descargarReporte('pdf')}
          className="flex items-center gap-2"
        >
          <FileText className="h-4 w-4" />
          Exportar PDF
        </Button>
      )}
    </div>
  );
}
