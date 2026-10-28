# 🚀 Guía de Despliegue a Producción

## 📋 Arquitectura Actual

- **Backend (Django):** Desplegado en Replit
  - URL: `https://teltec-backend-5cfc.onbelmo.uk`
  - Base de datos: Neon PostgreSQL
- **Frontend (Next.js):** Se desplegará en Vercel
  - URL esperada: `https://web-teltec-u5kr.vercel.app`

---

## 🔧 Paso 1: Configurar Backend en Replit

### 1.1 Variables de Entorno en Replit

En tu proyecto de Replit, configura estas variables de entorno:

```env
# Database (Neon PostgreSQL)
DATABASE_URL=tu-url-de-neon-postgresql

# Django Security
DJANGO_SECRET_KEY=tu-clave-segura-generada-con-secrets-token-urlsafe
DEBUG=False
DJANGO_ENV=production
ALLOWED_HOSTS=teltec-backend-5cfc.onbelmo.uk,web-teltec-u5kr.vercel.app

# CORS
CORS_ALLOWED_ORIGINS=https://web-teltec-u5kr.vercel.app,http://localhost:3000
CORS_ALLOW_ALL_ORIGINS=False

# Frontend URL
FRONTEND_URL=https://web-teltec-u5kr.vercel.app

# Email (SMTP) - Usar SendGrid o Mailgun recomendado
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=SG.tu-api-key
SMTP_FROM=TelTec Net <vangamarca4@gmail.com>

# Telegram (opcional)
TELEGRAM_BOT_TOKEN=tu-token-bot
```

### 1.2 Generar SECRET_KEY Seguro

Ejecuta esto en tu terminal local:
```bash
python -c "import secrets; print(secrets.token_urlsafe(50))"
```
Copia el resultado y úsalo como `DJANGO_SECRET_KEY`.

### 1.3 Ejecutar Migraciones en Replit

En la consola de Replit:
```bash
cd django_backend
source venv/bin/activate
python manage.py migrate
```

### 1.4 Verificar que el servidor esté corriendo

En Replit, asegúrate de que el servidor Django esté corriendo en el puerto 8000.

---

## 🌐 Paso 2: Desplegar Frontend en Vercel

### 2.1 Preparar el Repositorio

Asegúrate de que tu código esté en GitHub:
```bash
git add .
git commit -m "Preparado para despliegue a producción"
git push origin main
```

### 2.2 Desplegar en Vercel

1. Ve a [vercel.com](https://vercel.com)
2. Clic en "Add New Project"
3. Importa tu repositorio de GitHub
4. Configura el proyecto:
   - **Framework Preset:** Next.js
   - **Root Directory:** `./` (raíz del proyecto)
   - **Build Command:** `npm run build`
   - **Output Directory:** `.next`
   - **Install Command:** `npm install`

### 2.3 Configurar Variables de Entorno en Vercel

En Vercel, agrega estas variables de entorno:

```env
NEXT_PUBLIC_API_URL=https://teltec-backend-5cfc.onbelmo.uk
```

Opcional (si usas Supabase):
```env
NEXT_PUBLIC_SUPABASE_URL=tu-url-supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
```

### 2.4 Desplegar

Clic en "Deploy" y espera a que termine el despliegue.

---

## ✅ Paso 3: Verificación

### 3.1 Verificar Backend

```bash
curl https://teltec-backend-5cfc.onbelmo.uk/api/auth/login/ \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"email":"vangamarca4@gmail.com","password":"marco123"}'
```

Deberías recibir una respuesta JSON con `success: true`.

### 3.2 Verificar Frontend

Visita `https://web-teltec-u5kr.vercel.app` y:
1. Intenta iniciar sesión
2. Verifica que puedas ver el dashboard
3. Intenta cargar clientes o pagos

### 3.3 Verificar CORS

Abre las DevTools del navegador (F12) y ve a la pestaña Console. Intenta hacer una acción en la app. No deberías ver errores de CORS.

---

## 🔐 Configuración de Seguridad

### Backend Django (Replit)

Ya está configurado en `django_backend/teltec_backend/settings.py`:
- ✅ `DEBUG=False` en producción
- ✅ `ALLOWED_HOSTS` configurado
- ✅ `SECRET_KEY` generado dinámicamente
- ✅ CORS configurado con dominios específicos
- ✅ Whitenoise para archivos estáticos

### Frontend Next.js (Vercel)

Ya está configurado en `next.config.mjs`:
- ✅ Rewrites para API calls
- ✅ Headers CORS
- ✅ Images unoptimized (para evitar problemas)

---

## 📧 Configuración de Email (Recomendación)

### Usar SendGrid (Gratis hasta 100 emails/día)

1. Regístrate en [SendGrid](https://sendgrid.com)
2. Ve a Settings → API Keys → Create API Key
3. Crea una API Key con permisos "Mail Send"
4. Copia la API Key (empieza con `SG.`)

En Replit, configura:
```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=SG.tu-api-key-completa
SMTP_FROM=TelTec Net <vangamarca4@gmail.com>
```

### O usar Mailgun (Gratis hasta 5,000 emails/mes)

1. Regístrate en [Mailgun](https://mailgun.com)
2. Ve a Domains → Sending → SMTP credentials
3. Copia las credenciales

En Replit, configura:
```env
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_USER=postmaster@tu-dominio.mailgun.org
SMTP_PASS=tu-contraseña
SMTP_FROM=TelTec Net <vangamarca4@gmail.com>
```

---

## 🔄 Actualizaciones Futuras

### Para actualizar el backend:
```bash
# En Replit
git pull origin main
cd django_backend
source venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
# El servidor se reiniciará automáticamente
```

### Para actualizar el frontend:
1. Haz push a GitHub
2. Vercel detectará el cambio y desplegará automáticamente

---

## 🐛 Solución de Problemas Comunes

### Error: "No autorizado" al hacer login
- Verifica que `DJANGO_SECRET_KEY` esté configurado en Replit
- Verifica que `ALLOWED_HOSTS` incluya el dominio de Vercel

### Error: "CORS policy"
- Verifica que `CORS_ALLOWED_ORIGINS` en Replit incluya la URL de Vercel
- Verifica que `CORS_ALLOW_ALL_ORIGINS=False`

### Error: "Connection refused"
- Verifica que el servidor Django esté corriendo en Replit
- Verifica que el puerto sea 8000

### Error: "Database connection failed"
- Verifica que `DATABASE_URL` esté configurado correctamente en Replit
- Verifica que la base de datos Neon esté activa

---

## 📊 Monitoreo

### Backend (Replit)
- Replit tiene logs en tiempo real
- Verifica la consola de Replit para errores

### Frontend (Vercel)
- Vercel tiene logs en la pestaña "Deployments"
- Verifica "Build Logs" y "Function Logs"

---

## 🎯 Checklist de Despliegue

- [ ] Generar `DJANGO_SECRET_KEY` seguro
- [ ] Configurar variables de entorno en Replit
- [ ] Ejecutar migraciones en Replit
- [ ] Verificar que el servidor Django esté corriendo
- [ ] Configurar variables de entorno en Vercel
- [ ] Desplegar frontend en Vercel
- [ ] Verificar login en producción
- [ ] Verificar carga de datos (clientes, pagos)
- [ ] Verificar envío de emails (con SendGrid/Mailgun)
- [ ] Verificar CORS entre frontend y backend

---

## 📞 Soporte

Si tienes problemas:
1. Verifica los logs de Replit (backend)
2. Verifica los logs de Vercel (frontend)
3. Verifica las variables de entorno en ambos
4. Verifica que la base de datos Neon esté accesible

**¡Buena suerte con el despliegue! 🚀**
