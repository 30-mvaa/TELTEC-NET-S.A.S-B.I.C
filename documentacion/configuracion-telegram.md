# Configuración de Telegram Bot para Notificaciones

> **Nota**: Este sistema utiliza exclusivamente Telegram para el envío de notificaciones. WhatsApp ha sido eliminado del sistema.

## Requisitos Previos

1. Tener una cuenta de Telegram
2. Acceso a @BotFather en Telegram

## Pasos para Configurar

### 1. Crear un Bot de Telegram

1. Abre Telegram y busca `@BotFather`
2. Envía el comando `/newbot`
3. Sigue las instrucciones:
   - Proporciona un nombre para tu bot (ej: "TelTec Notificaciones")
   - Proporciona un username único que termine en "bot" (ej: "teltec_notificaciones_bot")
4. BotFather te dará un **Token** - guárdalo de forma segura

### 2. Obtener Chat ID de los Clientes

Para enviar mensajes a un cliente, necesitas su Chat ID:

#### Opción A: Cliente inicia conversación con el bot
1. El cliente busca tu bot por username
2. Hace clic en "Start" o envía `/start`
3. El bot puede obtener el chat_id automáticamente

#### Opción B: Usar @userinfobot
1. El cliente envía cualquier mensaje a @userinfobot
2. El bot responde con información incluyendo el Chat ID

#### Opción C: Usar la API de Telegram
```bash
curl "https://api.telegram.org/bot<TU_TOKEN>/getUpdates"
```

### 3. Configurar Variables de Entorno

Agrega estas variables a tu archivo `.env`:

```env
# Telegram Bot Configuration
TELEGRAM_BOT_TOKEN=tu_token_aqui
```

### 4. Agregar Chat ID a la Base de Datos

Ejecuta el script SQL para agregar el campo:

```bash
psql -d teltec -f scripts/add_telegram_chat_id.sql
```

### 5. Actualizar Chat IDs de Clientes

Para cada cliente que quiera recibir notificaciones por Telegram:

```sql
UPDATE clientes 
SET telegram_chat_id = '123456789' 
WHERE id = 1;
```

## Uso en el Sistema

### Crear Notificación Manual
1. Ve a "Notificaciones" → "Nueva Notificación"
2. Selecciona el cliente
3. Elige "Telegram" como canal (por defecto)
4. Escribe el mensaje
5. Crea la notificación

### Notificaciones Automáticas
El sistema automáticamente:
- Detecta clientes con `telegram_chat_id` configurado
- Crea notificaciones para pagos próximos/vencidos (solo por Telegram)
- Envía mensajes por Telegram cuando se procesan

### Envío Masivo
1. Ve a "Envío Masivo"
2. Selecciona el tipo de notificación
3. El sistema enviará a todos los clientes con chat_id configurado por Telegram

## Formato de Mensajes

Telegram soporta formato HTML básico:

```html
<b>Texto en negrita</b>
<i>Texto en cursiva</i>
<code>Código</code>
```

## Variables Disponibles

En los mensajes puedes usar variables:
- `{{nombre}}` - Nombre del cliente
- `{{apellido}}` - Apellido del cliente
- `{{plan}}` - Tipo de plan
- `{{precio}}` - Precio del plan
- `{{dias_vencido}}` - Días vencidos

## Solución de Problemas

### Error: "Cliente no tiene chat_id de Telegram configurado"
- Verifica que el cliente tenga un `telegram_chat_id` válido en la base de datos
- Asegúrate de que el cliente haya iniciado conversación con el bot

### Error: "Token de Telegram Bot no configurado"
- Verifica que `TELEGRAM_BOT_TOKEN` esté en el archivo `.env`
- Reinicia el servidor después de agregar la variable

### Error: "Forbidden: bot was blocked by the user"
- El cliente bloqueó el bot
- Pídele que desbloquee el bot o use otro canal

### Error: "Chat not found"
- El chat_id es incorrecto
- Verifica que el cliente haya iniciado conversación con el bot

## Seguridad

- Nunca compartas el token del bot
- Usa variables de entorno para configurar el token
- Considera implementar autenticación para agregar chat_ids
- Revisa regularmente los logs de envío

## Monitoreo

El sistema registra:
- Mensajes enviados exitosamente
- Errores de envío
- Intentos fallidos
- Estadísticas por canal

Revisa los logs para monitorear el funcionamiento del bot. 