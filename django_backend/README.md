# TelTec Backend - Django

## 🚀 **Configuración del Backend Django**

### **Estructura del Proyecto**
```
django_backend/
├── teltec_backend/          # Configuración principal
├── clientes/               # App de clientes
├── usuarios/               # App de usuarios
├── pagos/                  # App de pagos y gastos
├── notificaciones/         # App de notificaciones
├── venv/                   # Entorno virtual
└── requirements.txt        # Dependencias
```

### **Instalación y Configuración**

1. **Activar entorno virtual:**
```bash
source venv/bin/activate
```

2. **Instalar dependencias:**
```bash
pip install -r requirements.txt
```

3. **Configurar base de datos:**
```bash
python manage.py migrate
```

4. **Crear superusuario:**
```bash
python manage.py createsuperuser
```

5. **Ejecutar servidor:**
```bash
python manage.py runserver
```

### **APIs Disponibles**

#### **Clientes**
- `GET /api/clientes/` - Listar clientes
- `POST /api/clientes/` - Crear cliente
- `GET /api/clientes/{id}/` - Obtener cliente
- `PUT /api/clientes/{id}/` - Actualizar cliente
- `DELETE /api/clientes/{id}/` - Eliminar cliente
- `GET /api/clientes/valores_unicos/` - Valores únicos para filtros
- `GET /api/clientes/{id}/estadisticas/` - Estadísticas del cliente
- `GET /api/clientes/estadisticas_generales/` - Estadísticas generales

### **Configuración de Variables de Entorno**

Crear archivo `.env` en la raíz del proyecto:

```env
# Django
SECRET_KEY=your-secret-key-here
DEBUG=True

# Database
DB_NAME=teltec_db
DB_USER=teltec_user
DB_PASSWORD=12345678
DB_HOST=localhost
DB_PORT=5432

# Telegram
TELEGRAM_BOT_TOKEN=your-telegram-bot-token

# Email
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password

# Redis (para Celery)
REDIS_URL=redis://localhost:6379/0
```

### **Modelos Implementados**

#### **Usuario**
- Email como campo principal de autenticación
- Roles: administrador, economia, atencion_cliente
- Campos: nombre, rol, activo, fechas

#### **Cliente**
- Cédula ecuatoriana única
- Información personal completa
- Campo telegram_chat_id opcional
- Estados: activo, inactivo, suspendido

#### **Pago**
- Relación con cliente
- Métodos de pago
- Estados: completado, pendiente, fallido

#### **Gasto**
- Categorías de gastos
- Relación con usuario
- Comprobantes

#### **Notificación**
- Tipos de notificación
- Canales: telegram, email, sms
- Estados: pendiente, enviado, fallido

### **Características Implementadas**

✅ **Django REST Framework** - APIs RESTful
✅ **Autenticación personalizada** - Email como username
✅ **Validaciones** - Cédula ecuatoriana, emails únicos
✅ **Filtros y búsqueda** - Por nombre, cédula, email, etc.
✅ **Estadísticas** - Generales y por cliente
✅ **CORS** - Configurado para React
✅ **Serializers** - Para todas las operaciones CRUD

### **Próximos Pasos**

1. **Implementar autenticación JWT**
2. **Configurar Celery para tareas asíncronas**
3. **Integrar Telegram Bot**
4. **Generación de PDFs con ReportLab**
5. **Sistema de notificaciones**
6. **Testing con pytest**

### **Conectividad con Frontend React**

El backend está configurado para aceptar peticiones desde:
- `http://localhost:3000` (React dev server)
- `http://127.0.0.1:3000`

### **Admin Panel**

Acceder a `http://localhost:8000/admin/` para gestionar:
- Usuarios
- Clientes
- Pagos
- Gastos
- Notificaciones
- Configuraciones 