# 🔐 Sistema de Login y Permisos - TelTec

## 📋 **Resumen del Sistema de Autenticación**

El sistema utiliza un **middleware personalizado** basado en email para la autenticación, con roles específicos que determinan el acceso a los módulos.

---

## 🚀 **Proceso de Login**

### **1. Página de Login**
- **URL:** `/login-simple`
- **Método:** POST a `/api/auth/login/`
- **Credenciales:** Email y contraseña
- **Almacenamiento:** LocalStorage con email del usuario

### **2. Autenticación**
```javascript
// Ejemplo de login
const response = await fetch('/api/auth/login/', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password })
})
```

### **3. Middleware de Autenticación**
- **Archivo:** `django_backend/teltec_backend/middleware.py`
- **Función:** `SimpleAuthMiddleware`
- **Método:** Verifica email en header `X-User-Email`
- **Base de datos:** Tabla `usuarios` en PostgreSQL

---

## 👥 **Roles de Usuario**

### **1. Administrador** (`administrador`)
**Acceso completo a todos los módulos:**

✅ **Módulos disponibles:**
- 👥 **Clientes** - Gestión completa de clientes
- 📊 **Reportes** - Reportes y estadísticas
- 👤 **Usuarios** - Gestión de usuarios del sistema
- 💰 **Recaudación** - Registro de pagos y comprobantes
- ⚠️ **Gestión de Deudas** - Control de pagos vencidos
- 🧾 **Gastos** - Control de gastos empresariales
- 💬 **Notificaciones** - WhatsApp y alertas automáticas
- ⚙️ **Configuración** - Configuración del sistema
- 🌐 **Sitio Web** - Gestión del sitio web público

### **2. Economía** (`economia`)
**Acceso a módulos financieros y operativos:**

✅ **Módulos disponibles:**
- 👥 **Clientes** - Gestión completa de clientes
- 📊 **Reportes** - Reportes y estadísticas
- 💰 **Recaudación** - Registro de pagos y comprobantes
- ⚠️ **Gestión de Deudas** - Control de pagos vencidos
- 💬 **Notificaciones** - WhatsApp y alertas automáticas

❌ **Módulos restringidos:**
- 👤 **Usuarios** - Solo administradores
- 🧾 **Gastos** - Solo administradores
- ⚙️ **Configuración** - Solo administradores
- 🌐 **Sitio Web** - Solo administradores

### **3. Atención al Cliente** (`atencion_cliente`)
**Acceso a módulos de atención y comunicación:**

✅ **Módulos disponibles:**
- 👥 **Clientes** - Gestión completa de clientes
- 📊 **Reportes** - Reportes y estadísticas
- 💰 **Recaudación** - Registro de pagos y comprobantes
- ⚠️ **Gestión de Deudas** - Control de pagos vencidos
- 💬 **Notificaciones** - Comunicación con clientes

❌ **Módulos restringidos:**
- 👤 **Usuarios** - Solo administradores
- 🧾 **Gastos** - Solo administradores
- ⚙️ **Configuración** - Solo administradores
- 🌐 **Sitio Web** - Solo administradores

---

## 🔒 **Sistema de Seguridad**

### **1. Middleware de Autenticación**
```python
# Rutas públicas (sin autenticación)
public_paths = [
    '/api/auth/login/',
    '/api/auth/forgot/',
    '/api/auth/reset/',
    '/api/configuracion/',
    '/api/clientes/',
    '/api/pagos/',
    '/api/deudas/',
    '/api/notificaciones/',
    '/api/reportes/',
    '/api/gastos/',
    '/admin/',
    '/',
]
```

### **2. Verificación de Usuario**
- ✅ Usuario debe existir en tabla `usuarios`
- ✅ Campo `activo` debe ser `true`
- ✅ Email debe estar en header `X-User-Email`
- ✅ Rol determina acceso a módulos

### **3. Protección de Rutas**
- **Frontend:** Verificación en `getModulesByRole()`
- **Backend:** Middleware verifica autenticación
- **API:** Header `X-User-Email` requerido

---

## 📊 **Estructura de Base de Datos**

### **Tabla: usuarios**
```sql
CREATE TABLE usuarios (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    rol VARCHAR(20) DEFAULT 'atencion_cliente',
    activo BOOLEAN DEFAULT true,
    password_hash VARCHAR(255) NOT NULL,
    reset_token VARCHAR(100),
    reset_token_expires TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### **Roles disponibles:**
- `administrador` - Acceso completo
- `economia` - Acceso financiero
- `atencion_cliente` - Acceso básico

---

## 🔧 **Configuración del Sistema**

### **1. Variables de Entorno**
```bash
# .env.local
DATABASE_URL=postgresql://teltec_user:12345678@localhost:5432/teltec_db
TELEGRAM_BOT_TOKEN=8288608865:AAGRieiqjt73SXphtjLzg7kiK-YjqgM4udk
```

### **2. Configuración de Login**
- **Intentos máximos:** Configurable en base de datos
- **Tiempo de bloqueo:** Configurable en base de datos
- **Sesión:** Persistente en LocalStorage

---

## 🚨 **Características de Seguridad**

### **1. Protección contra Brute Force**
- ✅ Límite de intentos de login
- ✅ Bloqueo temporal de cuenta
- ✅ Configuración dinámica de límites

### **2. Gestión de Sesiones**
- ✅ Token de autenticación en LocalStorage
- ✅ Verificación de sesión activa
- ✅ Logout automático en expiración

### **3. Recuperación de Contraseña**
- ✅ Sistema de reset por email
- ✅ Tokens temporales
- ✅ Expiración automática

---

## 📱 **Flujo de Usuario**

### **1. Login**
```
Usuario → /login-simple → Autenticación → Dashboard
```

### **2. Navegación**
```
Dashboard → Módulos según rol → Verificación middleware → Acceso
```

### **3. Logout**
```
Usuario → Logout → Limpieza LocalStorage → /login-simple
```

---

## 🔍 **Verificación de Permisos**

### **Frontend (React)**
```javascript
const getModulesByRole = (rol) => {
  switch (rol) {
    case "administrador":
      return [/* todos los módulos */]
    case "economia":
      return [/* módulos financieros */]
    case "atencion_cliente":
      return [/* módulos básicos */]
    default:
      return [/* módulos mínimos */]
  }
}
```

### **Backend (Django)**
```python
# Middleware verifica en cada request
cursor.execute("""
    SELECT id, email, nombre, rol, activo 
    FROM usuarios 
    WHERE email = %s AND activo = true
""", [email])
```

---

## 📞 **Soporte y Mantenimiento**

### **Crear Nuevo Usuario**
```sql
INSERT INTO usuarios (email, nombre, rol, password_hash, activo)
VALUES ('usuario@teltec.com', 'Nombre Usuario', 'atencion_cliente', 
        'hash_bcrypt_password', true);
```

### **Cambiar Rol de Usuario**
```sql
UPDATE usuarios 
SET rol = 'administrador' 
WHERE email = 'usuario@teltec.com';
```

### **Desactivar Usuario**
```sql
UPDATE usuarios 
SET activo = false 
WHERE email = 'usuario@teltec.com';
```

---

## 🎯 **Resumen de Accesos por Rol**

| Módulo | Administrador | Economía | Atención Cliente |
|--------|---------------|----------|------------------|
| 👥 Clientes | ✅ | ✅ | ✅ |
| 📊 Reportes | ✅ | ✅ | ✅ |
| 👤 Usuarios | ✅ | ❌ | ❌ |
| 💰 Recaudación | ✅ | ✅ | ✅ |
| ⚠️ Gestión de Deudas | ✅ | ✅ | ✅ |
| 🧾 Gastos | ✅ | ❌ | ❌ |
| 💬 Notificaciones | ✅ | ✅ | ✅ |
| ⚙️ Configuración | ✅ | ❌ | ❌ |
| 🌐 Sitio Web | ✅ | ❌ | ❌ |

**¡El sistema está configurado para máxima seguridad y control de acceso!** 🔐
