-- Agregar columna reset_token_expires a la tabla usuarios
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS reset_token_expires TIMESTAMP NULL; 