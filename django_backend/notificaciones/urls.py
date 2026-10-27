from django.urls import path
from . import views

urlpatterns = [
    path('api/notificaciones/', views.list_notificaciones, name='list_notificaciones'),
    path('api/notificaciones/clientes/', views.notificaciones_clientes, name='notificaciones_clientes'),
    path('api/notificaciones/estado-pagos/', views.estado_pagos_clientes, name='estado_pagos_clientes'),
    path('api/notificaciones/estadisticas/', views.notificaciones_estadisticas, name='notificaciones_estadisticas'),
    path('api/notificaciones/create/', views.create_notificacion, name='create_notificacion'),
    path('api/notificaciones/procesar/', views.procesar_notificaciones, name='procesar_notificaciones'),
    path('api/notificaciones/masiva/', views.notificacion_masiva, name='notificacion_masiva'),
    path('api/notificaciones/<int:notificacion_id>/mark-enviado/', views.mark_enviado, name='mark_enviado'),
    path('api/notificaciones/generar-automaticas/', views.generar_notificaciones_automaticas, name='generar_notificaciones_automaticas'),

    # Rutas para Telegram
    # Nota: La vista telegram_status no existe en views.py, se comenta para permitir que el servidor inicie.
    # path('api/notificaciones/telegram/status/', views.telegram_status, name='telegram_status'),
    path('api/notificaciones/telegram/webhook/', views.telegram_webhook, name='telegram_webhook'),
    path('api/notificaciones/telegram/configurar-webhook/', views.configurar_webhook_telegram, name='telegram_configurar_webhook'),
    path('api/notificaciones/telegram/updates/', views.obtener_updates_telegram, name='telegram_updates'),
    path('api/notificaciones/telegram/vincular/', views.actualizar_chat_id_cliente, name='telegram_vincular'),

    # Rutas para WhatsApp
    path('api/notificaciones/whatsapp/status/', views.whatsapp_status, name='whatsapp_status'),
    path('api/notificaciones/whatsapp/send/', views.send_whatsapp_message, name='whatsapp_send'),
    path('api/notificaciones/whatsapp/test/', views.test_whatsapp_message, name='whatsapp_test'),
    path('api/notificaciones/<int:notificacion_id>/url-whatsapp/', views.obtener_url_whatsapp_notificacion, name='whatsapp_url_individual'),
    path('api/notificaciones/whatsapp/urls-pendientes/', views.obtener_urls_whatsapp_pendientes, name='whatsapp_urls_pendientes'),

    # Ruta para limpiar notificaciones
    path('api/notificaciones/limpiar/', views.limpiar_notificaciones, name='limpiar_notificaciones'),
    path('api/notificaciones/<int:notificacion_id>/enviar/', views.send_telegram, name='enviar_notificacion_individual'),
]
