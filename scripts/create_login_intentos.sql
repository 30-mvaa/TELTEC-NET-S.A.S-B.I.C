CREATE TABLE IF NOT EXISTS login_intentos (
    email VARCHAR(255) PRIMARY KEY,
    intentos INTEGER NOT NULL DEFAULT 0,
    bloqueado_hasta TIMESTAMP
); 