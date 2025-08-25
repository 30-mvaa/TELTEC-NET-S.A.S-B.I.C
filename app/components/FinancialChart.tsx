'use client'

import React from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  PointElement,
  LineElement,
  Filler,
} from 'chart.js'
import { Bar, Line } from 'react-chartjs-2'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  PointElement,
  LineElement,
  Filler
)

interface FinancialChartProps {
  data: {
    datos_mensuales: Array<{
      mes: number
      nombre_mes: string
      nombre_mes_corto: string
      total_recaudado: number
      total_pagos: number
      es_mayor_recaudacion: boolean
      es_menor_recaudacion: boolean
    }>
    estadisticas: {
      total_anual: number
      total_pagos_anual: number
      promedio_mensual: number
    }
    anio: number
  }
  chartType?: 'bar' | 'line'
}

export function FinancialChart({ data, chartType = 'bar' }: FinancialChartProps) {
  const chartData = {
    labels: data.datos_mensuales.map(item => item.nombre_mes_corto),
    datasets: [
      {
        label: 'Recaudación Mensual ($)',
        data: data.datos_mensuales.map(item => item.total_recaudado),
        backgroundColor: data.datos_mensuales.map(item => {
          if (item.es_mayor_recaudacion) return 'rgba(34, 197, 94, 0.8)' // Verde para mayor
          if (item.es_menor_recaudacion) return 'rgba(239, 68, 68, 0.8)' // Rojo para menor
          return 'rgba(59, 130, 246, 0.8)' // Azul para normal
        }),
        borderColor: data.datos_mensuales.map(item => {
          if (item.es_mayor_recaudacion) return 'rgba(34, 197, 94, 1)'
          if (item.es_menor_recaudacion) return 'rgba(239, 68, 68, 1)'
          return 'rgba(59, 130, 246, 1)'
        }),
        borderWidth: 2,
        borderRadius: 6,
        borderSkipped: false,
      },
      {
        label: 'Promedio Mensual',
        data: Array(12).fill(data.estadisticas.promedio_mensual),
        type: 'line' as const,
        borderColor: 'rgba(156, 163, 175, 0.6)',
        backgroundColor: 'rgba(156, 163, 175, 0.1)',
        borderWidth: 2,
        borderDash: [5, 5],
        pointRadius: 0,
        fill: false,
      }
    ]
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false, // Ocultamos la leyenda del gráfico ya que tenemos una personalizada
      },
      title: {
        display: true,
        text: `Recaudación Anual ${data.anio}`,
        font: {
          size: 14,
          weight: 'bold' as const,
        },
        padding: {
          top: 5,
          bottom: 10
        }
      },
              tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.9)',
          titleColor: 'white',
          bodyColor: 'white',
          borderColor: 'rgba(255, 255, 255, 0.2)',
          borderWidth: 1,
          cornerRadius: 6,
          displayColors: false,
          callbacks: {
            label: function(context: any) {
              const value = context.parsed.y
              const monthIndex = context.dataIndex
              const monthData = data.datos_mensuales[monthIndex]
              
              if (context.datasetIndex === 0) {
                return [
                  `${monthData.nombre_mes_corto}: $${value.toLocaleString()}`,
                  `${monthData.total_pagos} pagos`
                ]
              }
              return `Promedio: $${value.toLocaleString()}`
            }
          }
        }
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          font: {
            size: 10,
            weight: 'bold' as const,
          },
          color: '#374151',
          maxRotation: 0
        }
      },
      y: {
        beginAtZero: true,
        grid: {
          display: true,
          color: 'rgba(0, 0, 0, 0.05)',
        },
        ticks: {
          callback: function(value: any) {
            return '$' + (value / 1000).toFixed(0) + 'k'
          },
          font: {
            size: 9,
            weight: 'bold' as const,
          },
          color: '#374151',
          maxTicksLimit: 6
        }
      }
    },
    interaction: {
      intersect: false,
      mode: 'index' as const,
    },
    elements: {
      bar: {
        borderRadius: 4,
        borderSkipped: false,
      },
      point: {
        radius: 3,
        hoverRadius: 5,
      }
    }
  }

  const lineData = {
    labels: data.datos_mensuales.map(item => item.nombre_mes_corto),
    datasets: [
      {
        label: 'Recaudación Mensual ($)',
        data: data.datos_mensuales.map(item => item.total_recaudado),
        borderColor: 'rgba(59, 130, 246, 1)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderWidth: 3,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: data.datos_mensuales.map(item => {
          if (item.es_mayor_recaudacion) return 'rgba(34, 197, 94, 1)'
          if (item.es_menor_recaudacion) return 'rgba(239, 68, 68, 1)'
          return 'rgba(59, 130, 246, 1)'
        }),
        pointBorderColor: 'white',
        pointBorderWidth: 2,
        pointRadius: 6,
        pointHoverRadius: 8,
      },
      {
        label: 'Promedio Mensual',
        data: Array(12).fill(data.estadisticas.promedio_mensual),
        borderColor: 'rgba(156, 163, 175, 0.8)',
        backgroundColor: 'rgba(156, 163, 175, 0.1)',
        borderWidth: 2,
        borderDash: [5, 5],
        fill: false,
        pointRadius: 0,
        tension: 0,
      }
    ]
  }

  return (
    <div className="w-full bg-white rounded-lg shadow-lg p-3 sm:p-4">
      <div className="h-48 sm:h-56 md:h-64 mb-3 sm:mb-4 relative">
        {chartType === 'bar' ? (
          <Bar data={chartData} options={options} />
        ) : (
          <Line data={lineData} options={options} />
        )}
      </div>
      
      {/* Leyenda compacta */}
      <div className="flex flex-wrap justify-center gap-2 sm:gap-3 p-2 sm:p-3 bg-gray-50 rounded-lg">
        <div className="flex items-center gap-1 sm:gap-2">
          <div className="w-2 h-2 sm:w-3 sm:h-3 bg-blue-500 rounded"></div>
          <span className="text-xs font-medium text-gray-700">Normal</span>
        </div>
        <div className="flex items-center gap-1 sm:gap-2">
          <div className="w-2 h-2 sm:w-3 sm:h-3 bg-green-500 rounded"></div>
          <span className="text-xs font-medium text-gray-700">Mayor</span>
        </div>
        <div className="flex items-center gap-1 sm:gap-2">
          <div className="w-2 h-2 sm:w-3 sm:h-3 bg-red-500 rounded"></div>
          <span className="text-xs font-medium text-gray-700">Menor</span>
        </div>
        <div className="flex items-center gap-1 sm:gap-2">
          <div className="w-2 h-2 sm:w-3 sm:h-3 border border-gray-400 border-dashed"></div>
          <span className="text-xs font-medium text-gray-700">Promedio</span>
        </div>
      </div>
    </div>
  )
} 