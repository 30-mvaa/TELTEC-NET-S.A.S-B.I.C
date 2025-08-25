from django.urls import path
from . import views

urlpatterns = [
    path('api/reportes/', views.reporte_general, name='reporte_general'),
    path('api/reportes/clientes/', views.reporte_clientes, name='reporte_clientes'),
    path('api/reportes/pagos/', views.reporte_pagos, name='reporte_pagos'),
    path('api/reportes/gastos/', views.reporte_gastos, name='reporte_gastos'),
    path('api/reportes/anual-clientes/', views.reporte_anual_clientes, name='reporte_anual_clientes'),
    path('api/reportes/sectores/', views.obtener_sectores, name='obtener_sectores'),
    path('api/reportes/utilidades-anuales/', views.utilidades_anuales, name='utilidades_anuales'),
    path('api/reportes/grafico-anual-recaudacion/', views.reporte_grafico_anual_recaudacion, name='reporte_grafico_anual_recaudacion'),
    path('api/reportes/descargar-grafico-pdf/', views.descargar_reporte_grafico_pdf, name='descargar_reporte_grafico_pdf'),
    path('api/reportes/debug-pagos/', views.debug_pagos_reales, name='debug_pagos_reales'),
    path('api/reportes/debug-gastos/', views.debug_gastos_reales, name='debug_gastos_reales'),
] 