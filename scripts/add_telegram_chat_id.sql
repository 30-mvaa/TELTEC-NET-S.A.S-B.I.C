-- Script para agregar campo telegram_chat_id a la tabla clientes
-- Ejecutar: psql -d teltec -f scripts/add_telegram_chat_id.sql

-- Agregar columna telegram_chat_id si no existe
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS telegram_chat_id VARCHAR(50);

-- Agregar comentario a la columna
COMMENT ON COLUMN clientes.telegram_chat_id IS 'Chat ID de Telegram del cliente para envío de notificaciones';

-- Verificar que la columna se agregó correctamente
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'clientes' AND column_name = 'telegram_chat_id'; 