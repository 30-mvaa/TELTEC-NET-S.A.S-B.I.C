from django.urls import path
from . import views

urlpatterns = [
    path('api/notificaciones/', views.list_notificaciones, name='list_notificaciones'),
    path('api/notificaciones/clientes/', views.notificaciones_clientes, name='notificaciones_clientes'),
    path('api/notificaciones/estado-pagos/', views.estado_pagos_clientes, name='estado_pagos_clientes'),
    path('api/notificaciones/estadisticas/', views.notificaciones_estadisticas, name='notificaciones_estadisticas'),
    path('api/notificaciones/create/', views.create_notificacion, name='create_notificacion'),
    path('api/notificaciones/send-telegram/', views.send_telegram, name='send_telegram'),
    path('api/notificaciones/procesar/', views.procesar_notificaciones, name='procesar_notificaciones'),
    path('api/notificaciones/masiva/', views.notificacion_masiva, name='notificacion_masiva'),
    path('api/notificaciones/<int:notificacion_id>/mark-enviado/', views.mark_enviado, name='mark_enviado'),
    path('api/notificaciones/generar-automaticas/', views.generar_notificaciones_automaticas, name='generar_notificaciones_automaticas'),
    path('api/notificaciones/llamada/', views.hacer_llamada_automatizada, name='hacer_llamada_automatizada'),
    path('api/notificaciones/con-llamada/', views.notificacion_con_llamada, name='notificacion_con_llamada'),
    
    # Nuevas rutas para Telegram
    path('api/notificaciones/telegram/status/', views.telegram_status, name='telegram_status'),
    path('api/notificaciones/telegram/test/', views.test_telegram_message, name='test_telegram_message'),
    path('api/notificaciones/telegram/estadisticas/', views.telegram_estadisticas, name='telegram_estadisticas'),
    
    # Ruta para limpiar notificaciones
    path('api/notificaciones/limpiar/', views.limpiar_notificaciones, name='limpiar_notificaciones'),
    
    # Ruta para actualizar chat_id de cliente
    path('api/notificaciones/actualizar-chat-id/', views.actualizar_chat_id_cliente, name='actualizar_chat_id_cliente'),
    
    # Webhook para Telegram
    path('api/notificaciones/telegram/webhook/', views.telegram_webhook, name='telegram_webhook'),
    path('api/notificaciones/telegram/configurar-webhook/', views.configurar_webhook_telegram, name='configurar_webhook_telegram'),
    path('api/notificaciones/telegram/updates/', views.obtener_updates_telegram, name='obtener_updates_telegram'),
    path('api/notificaciones/telegram/enviar-prueba/', views.enviar_notificacion_prueba, name='enviar_notificacion_prueba'),
    path('api/notificaciones/<int:notificacion_id>/enviar/', views.enviar_notificacion_individual, name='enviar_notificacion_individual'),
] 