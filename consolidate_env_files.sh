#!/bin/bash

echo "=== CONSOLIDACIÓN DE ARCHIVOS .ENV ==="
echo ""

# Crear un archivo .env consolidado para el proyecto principal
cat > .env << 'EOF'
# Configuración de base de datos
DATABASE_URL=postgresql://teltec_user:12345678@localhost:5432/teltec_db
DATABASE_NAME=teltec_db
DATABASE_USER=teltec_user
DATABASE_PASSWORD=12345678
DATABASE_HOST=localhost
DATABASE_PORT=5432

# Configuración de NextAuth
NEXTAUTH_SECRET=tu_secreto_aqui_cambialo_por_algo_seguro
NEXTAUTH_URL=http://localhost:3000

# Configuración de email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=vangamarca4@gmail.com
SMTP_PASS=hcksmimksarshlkl
SMTP_FROM=web teltec <vangamarca4@gmail.com>

# Configuración de Telegram
TELEGRAM_BOT_TOKEN=8288608865:AAGRieiqjt73SXphtjLzg7kiK-YjqgM4udk

# Configuración de entorno
NODE_ENV=development
EOF

# Crear un archivo .env específico para Django
cat > django_backend/.env << 'EOF'
# Configuración de base de datos para Django
DATABASE_NAME=teltec_db
DATABASE_USER=teltec_user
DATABASE_PASSWORD=12345678
DATABASE_HOST=localhost
DATABASE_PORT=5432

# Configuración de email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=vangamarca4@gmail.com
SMTP_PASS=hcksmimksarshlkl
SMTP_FROM=web teltec <vangamarca4@gmail.com>

# Configuración de Telegram
TELEGRAM_BOT_TOKEN=8288608865:AAGRieiqjt73SXphtjLzg7kiK-YjqgM4udk

# Configuración de Django
SECRET_KEY=django-insecure-your-secret-key-here
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1,0.0.0.0
EOF

# Limpiar el archivo app/.env
cat > app/.env << 'EOF'
# Configuración de Next.js
NODE_ENV=development
NEXTAUTH_SECRET=tu_secreto_aqui_cambialo_por_algo_seguro
NEXTAUTH_URL=http://localhost:3000
DATABASE_URL=postgresql://teltec_user:12345678@localhost:5432/teltec_db
EOF

echo "✅ Archivos .env consolidados y limpiados"
echo ""
echo "📁 Archivos creados:"
echo "  - .env (configuración principal)"
echo "  - django_backend/.env (configuración específica de Django)"
echo "  - app/.env (configuración específica de Next.js)"
echo ""
echo "⚠️  Nota: El archivo .env.local se mantiene para configuraciones locales específicas" 