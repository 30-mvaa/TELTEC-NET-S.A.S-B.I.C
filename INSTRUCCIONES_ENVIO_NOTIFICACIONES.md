# 🚀 Instrucciones para Probar el Envío de Notificaciones

## 📋 Estado Actual del Sistema

✅ **Sistema funcionando correctamente:**
- Backend Django operativo
- Token de Telegram configurado: `8288608865:AAGRieiqjt73SXphtjLzg7kiK-YjqgM4udk`
- Bot de Telegram: **@teltecnoti_bot** (Teltec Notificador)
- API endpoints funcionando
- Notificaciones fallidas limpiadas (82 eliminadas)

## 🔧 Problema Identificado

El sistema no envía notificaciones porque:
- Los clientes no tienen `chat_id` real configurado
- Los chat_ids configurados son falsos (`123456789`, etc.)
- Telegram rechaza los envíos con "chat not found"

## 🎯 Solución: Probar con Chat ID Real

### Paso 1: Obtener un Chat ID Real

**Opción A: Usar tu propio Telegram**
1. Busca el bot en Telegram: **@teltecnoti_bot**
2. Envía `/start` al bot
3. Envía cualquier mensaje (ej: "Hola")
4. Ejecuta este comando para obtener tu chat_id:

```bash
curl -X GET "http://localhost:8000/api/notificaciones/telegram/updates/" \
     -H "Content-Type: application/json"
```

**Opción B: Usar un chat_id de prueba**
Si no tienes Telegram, puedes usar un chat_id de prueba (pero no funcionará realmente).

### Paso 2: Configurar Cliente con Chat ID Real

Una vez que tengas un chat_id real, configúralo en un cliente:

```bash
curl -X POST "http://localhost:8000/api/notificaciones/actualizar-chat-id/" \
     -H "Content-Type: application/json" \
     -d '{"cliente_id": 83, "chat_id": "TU_CHAT_ID_REAL"}'
```

### Paso 3: Probar Envío Directo

Enviar notificación de prueba directamente:

```bash
curl -X POST "http://localhost:8000/api/notificaciones/telegram/enviar-prueba/" \
     -H "Content-Type: application/json" \
     -d '{"chat_id": "TU_CHAT_ID_REAL", "mensaje": "🔔 ¡Hola! Esta es una prueba del sistema de notificaciones TelTec"}'
```

### Paso 4: Probar Sistema Completo

1. **Crear notificación:**
```bash
curl -X POST "http://localhost:8000/api/notificaciones/create/" \
     -H "Content-Type: application/json" \
     -d '{"cliente_id": 83, "tipo": "pago_proximo", "mensaje": "🔔 Recordatorio: Tu pago vence pronto. ¡Gracias por confiar en TelTec!", "canal": "telegram"}'
```

2. **Procesar notificaciones:**
```bash
curl -X POST "http://localhost:8000/api/notificaciones/procesar/" \
     -H "Content-Type: application/json"
```

## 📱 Cómo Registrarse en el Bot

### Para Clientes Reales:

1. **Buscar el bot**: En Telegram, buscar `@teltecnoti_bot`
2. **Iniciar conversación**: Enviar `/start`
3. **Proporcionar cédula**: Enviar número de cédula (10 dígitos)
4. **Confirmación**: Recibir mensaje de confirmación
5. **Notificaciones**: Comenzar a recibir notificaciones automáticas

### Comandos Disponibles:
- `/start` - Iniciar registro
- `/help` - Mostrar ayuda
- `/status` - Ver estado del servicio
- `/contact` - Información de contacto

## 🔍 Verificar Estado del Sistema

### Estadísticas Generales:
```bash
curl -X GET "http://localhost:8000/api/notificaciones/estadisticas/" \
     -H "Content-Type: application/json"
```

### Estadísticas de Telegram:
```bash
curl -X GET "http://localhost:8000/api/notificaciones/telegram/estadisticas/" \
     -H "Content-Type: application/json"
```

### Verificar Cliente:
```bash
curl -X GET "http://localhost:8000/api/clientes/" \
     -H "Content-Type: application/json" | jq '.data[] | select(.id == 83)'
```

## 🎯 Resultado Esperado

Cuando configures un chat_id real:

✅ **Notificación enviada exitosamente**
- Mensaje recibido en Telegram
- Estado cambiado a "enviado"
- Estadísticas actualizadas
- Sistema completamente funcional

## 🚨 Notas Importantes

1. **Chat ID debe ser real**: Los chat_ids falsos no funcionan
2. **Bot debe estar activo**: El bot @teltecnoti_bot debe estar funcionando
3. **Token válido**: El token de Telegram está configurado correctamente
4. **Sistema operativo**: Todos los endpoints funcionan correctamente

## 🔧 Para Producción

1. **Configurar HTTPS** para el webhook
2. **Promocionar el bot** entre los clientes
3. **Configurar tareas programadas** para automatización
4. **Monitorear** el sistema en producción

---

**¡El sistema está listo! Solo necesita un chat_id real para funcionar completamente.** 🚀
