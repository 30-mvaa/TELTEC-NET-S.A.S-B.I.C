# 📋 Documentación TelTec Net

## 🎯 Descripción del Proyecto

**TelTec Net** es un sistema de gestión integral para empresas de telecomunicaciones que permite administrar clientes, pagos, gastos, notificaciones y generar reportes.

## 🏗️ Arquitectura del Sistema

### Frontend
- **Framework**: Next.js 15.3.4 + React 18.3.1
- **UI**: Tailwind CSS + Radix UI Components
- **Puerto**: 3002 (dinámico)
- **URL**: http://localhost:3002

### Backend
- **Framework**: Django 4.2.23 + Django REST Framework
- **Base de Datos**: PostgreSQL
- **Puerto**: 8000
- **URL**: http://localhost:8000

## 🔐 Credenciales de Acceso

```
Email: vangamarca4@gmail.com
Contraseña: marco123
Rol: administrador
```

## 🚀 Instalación y Configuración

### 1. Clonar el repositorio
```bash
git clone <repository-url>
cd web-teltec
```

### 2. Configurar Backend Django
```bash
cd django_backend
python -m venv venv
source venv/bin/activate  # En Windows: venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

### 3. Configurar Frontend React
```bash
npm install
npm run dev
```

## 📊 Módulos del Sistema

### ✅ Módulos Funcionando
- **🔐 Autenticación**: Login, recuperación de contraseña
- **👥 Gestión de Usuarios**: CRUD completo
- **👤 Gestión de Clientes**: CRUD completo con campo Telegram
- **⚙️ Configuración**: Configuración del sistema

### 🔄 Módulos Implementados
- **💰 Gestión de Pagos**: APIs básicas
- **💸 Gestión de Gastos**: APIs básicas
- **📢 Notificaciones**: APIs básicas
- **📊 Reportes**: APIs básicas

## 🔧 APIs Disponibles

### Autenticación
- `POST /api/auth/login/` - Login de usuario
- `POST /api/auth/forgot/` - Recuperación de contraseña
- `POST /api/auth/reset/` - Reset de contraseña
- `GET /api/auth/user-info/` - Información del usuario

### Usuarios
- `GET /api/usuarios/` - Listar usuarios
- `POST /api/usuarios/create/` - Crear usuario
- `PUT /api/usuarios/update/` - Actualizar usuario
- `DELETE /api/usuarios/{id}/delete/` - Eliminar usuario

### Clientes
- `GET /api/clientes/` - Listar clientes
- `POST /api/clientes/` - Crear cliente
- `PUT /api/clientes/{id}/` - Actualizar cliente
- `DELETE /api/clientes/{id}/` - Eliminar cliente
- `GET /api/clientes/valores_unicos/` - Valores únicos
- `GET /api/clientes/estadisticas_generales/` - Estadísticas

### Pagos
- `GET /api/pagos/` - Listar pagos
- `POST /api/pagos/create/` - Crear pago

### Gastos
- `GET /api/gastos/` - Listar gastos
- `POST /api/gastos/create/` - Crear gasto

### Notificaciones
- `GET /api/notificaciones/` - Listar notificaciones
- `GET /api/notificaciones/clientes/` - Notificaciones por cliente
- `GET /api/notificaciones/estadisticas/` - Estadísticas

### Reportes
- `GET /api/reportes/` - Reporte general
- `GET /api/reportes/clientes/` - Reporte de clientes

### Configuración
- `GET /api/configuracion/` - Listar configuración
- `POST /api/configuracion/` - Crear configuración

## 🛠️ Estructura del Proyecto

```
web-teltec/
├── app/                    # Frontend Next.js
│   ├── api/               # (Eliminado - solo Django backend)
│   ├── clientes/          # Módulo de clientes
│   ├── usuarios/          # Módulo de usuarios
│   ├── gastos/            # Módulo de gastos
│   ├── notificaciones/    # Módulo de notificaciones
│   ├── reportes/          # Módulo de reportes
│   └── ...
├── django_backend/        # Backend Django
│   ├── usuarios/          # App de usuarios
│   ├── clientes/          # App de clientes
│   ├── pagos/             # App de pagos
│   ├── gastos/            # App de gastos
│   ├── notificaciones/    # App de notificaciones
│   ├── configuracion/     # App de configuración
│   ├── reportes_app/      # App de reportes
│   └── teltec_backend/    # Configuración principal
├── components/            # Componentes UI
├── lib/                   # Utilidades y configuración
└── documentacion teltec/  # Documentación consolidada
```

## 🔍 Solución de Problemas

### Error de bcryptjs
- **Problema**: Módulo no encontrado en frontend
- **Solución**: Eliminado del frontend, solo se usa en Django

### Error 404 en APIs
- **Problema**: APIs no encontradas
- **Solución**: Implementadas todas las APIs faltantes

### Error de CORS
- **Problema**: Bloqueo de requests entre frontend y backend
- **Solución**: Configurado CORS para puertos 3000, 3001, 3002

## 📈 Próximos Pasos

1. **Configurar envío de emails** para recuperación de contraseña
2. **Implementar notificaciones Telegram** 
3. **Configurar Celery** para tareas asíncronas
4. **Implementar reportes PDF** con ReportLab
5. **Testing completo** de todas las funcionalidades
6. **Deployment** en producción

## 👥 Roles del Sistema

- **administrador**: Acceso completo al sistema
- **economia**: Gestión de pagos y reportes
- **atencion_cliente**: Gestión de clientes y notificaciones

## 📞 Soporte

Para soporte técnico o consultas sobre el sistema, contactar al equipo de desarrollo.

---

**TelTec Net** - Sistema de Gestión Integral v1.0 