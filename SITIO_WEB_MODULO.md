# 🌐 Módulo Sitio Web - TelTec Net

## 📋 Descripción

El módulo **Sitio Web** permite administrar toda la información del sitio web corporativo de TelTec Net. Proporciona un panel de administración completo para gestionar la información de la empresa, servicios, redes sociales y configuración del sitio.

## 🚀 Características

### ✨ Funcionalidades Principales

- **📝 Información del Sitio**: Gestión del título, subtítulo, descripción y lema
- **🏢 Información de Empresa**: Datos de contacto, dirección, teléfono, email, RUC
- **📦 Gestión de Servicios**: Agregar, editar, eliminar y activar/desactivar servicios
- **🌐 Redes Sociales**: Configuración de enlaces a redes sociales
- **⚙️ Configuración**: Opciones de visualización y modo mantenimiento

### 🎯 Secciones del Panel

1. **Información General**
   - Título del sitio web
   - Subtítulo descriptivo
   - Descripción detallada
   - Lema o slogan

2. **Empresa**
   - Nombre de la empresa
   - Dirección completa
   - Teléfono de contacto
   - Email corporativo
   - Número de RUC
   - Horario de atención

3. **Servicios**
   - Lista de servicios ofrecidos
   - Descripción detallada
   - Estado activo/inactivo
   - Orden de visualización

4. **Redes Sociales**
   - Facebook
   - Instagram
   - Twitter
   - LinkedIn
   - YouTube
   - TikTok

5. **Configuración**
   - Mostrar precios
   - Mostrar información de contacto
   - Mostrar testimonios
   - Modo mantenimiento

## 🛠️ Instalación y Configuración

### 📦 Backend (Django)

1. **Crear la aplicación**:
   ```bash
   cd django_backend
   python manage.py startapp sitio_web
   ```

2. **Agregar a INSTALLED_APPS**:
   ```python
   # settings.py
   INSTALLED_APPS = [
       # ... otras apps
       'sitio_web',
   ]
   ```

3. **Configurar URLs**:
   ```python
   # urls.py
   urlpatterns = [
       # ... otras urls
       path('', include('sitio_web.urls')),
   ]
   ```

4. **Crear y aplicar migraciones**:
   ```bash
   python manage.py makemigrations sitio_web
   python manage.py migrate
   ```

5. **Inicializar datos**:
   ```bash
   python scripts/inicializar_sitio_web.py
   ```

### 🎨 Frontend (Next.js)

1. **Crear el módulo**:
   ```bash
   mkdir app/sitio-web
   ```

2. **Crear la página principal**:
   ```bash
   touch app/sitio-web/page.tsx
   ```

3. **Configurar endpoints en API**:
   ```javascript
   // lib/config/api.js
   SITIO_WEB_CONFIGURACION: `${API_BASE_URL}/api/sitio-web/configuracion/`,
   SITIO_WEB_PUBLICO: `${API_BASE_URL}/api/sitio-web/publico/`,
   ```

## 📊 Modelos de Base de Datos

### 🗃️ InformacionSitio
```python
class InformacionSitio(models.Model):
    titulo = models.CharField(max_length=200)
    subtitulo = models.CharField(max_length=300)
    descripcion = models.TextField()
    lema = models.CharField(max_length=200)
    fecha_actualizacion = models.DateTimeField(auto_now=True)
```

### 🏢 Empresa
```python
class Empresa(models.Model):
    nombre = models.CharField(max_length=200)
    direccion = models.CharField(max_length=300)
    telefono = models.CharField(max_length=20)
    email = models.EmailField()
    ruc = models.CharField(max_length=20)
    horario = models.CharField(max_length=200)
    fecha_actualizacion = models.DateTimeField(auto_now=True)
```

### 📦 Servicio
```python
class Servicio(models.Model):
    nombre = models.CharField(max_length=200)
    descripcion = models.TextField()
    activo = models.BooleanField(default=True)
    orden = models.IntegerField(default=0)
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    fecha_actualizacion = models.DateTimeField(auto_now=True)
```

### 🌐 RedSocial
```python
class RedSocial(models.Model):
    REDES_CHOICES = [
        ('facebook', 'Facebook'),
        ('instagram', 'Instagram'),
        ('twitter', 'Twitter'),
        ('linkedin', 'LinkedIn'),
        ('youtube', 'YouTube'),
        ('tiktok', 'TikTok'),
    ]
    
    tipo = models.CharField(max_length=20, choices=REDES_CHOICES)
    url = models.URLField()
    activo = models.BooleanField(default=True)
    fecha_actualizacion = models.DateTimeField(auto_now=True)
```

### ⚙️ ConfiguracionSitio
```python
class ConfiguracionSitio(models.Model):
    mostrar_precios = models.BooleanField(default=True)
    mostrar_contacto = models.BooleanField(default=True)
    mostrar_testimonios = models.BooleanField(default=True)
    modo_mantenimiento = models.BooleanField(default=False)
    mensaje_mantenimiento = models.TextField(blank=True)
    fecha_actualizacion = models.DateTimeField(auto_now=True)
```

## 🔌 API Endpoints

### 📡 Configuración (Admin)
- **GET** `/api/sitio-web/configuracion/` - Obtener configuración completa
- **PUT** `/api/sitio-web/configuracion/` - Actualizar configuración

### 🌍 Información Pública
- **GET** `/api/sitio-web/publico/` - Obtener información pública del sitio

## 🎨 Interfaz de Usuario

### 🖥️ Panel de Administración

El panel incluye:

- **Header moderno** con navegación y botones de acción
- **Tabs organizados** por secciones funcionales
- **Formularios intuitivos** con validación en tiempo real
- **Gestión de servicios** con CRUD completo
- **Configuración de redes sociales** con validación de URLs
- **Opciones de configuración** con switches interactivos

### 🎯 Características de UX

- **Diseño responsivo** para todos los dispositivos
- **Validación en tiempo real** de formularios
- **Mensajes de estado** informativos
- **Confirmaciones** para acciones importantes
- **Carga progresiva** de datos
- **Sincronización automática** de cambios

## 🔐 Seguridad y Permisos

### 👤 Control de Acceso
- Solo usuarios **administradores** pueden acceder al panel
- Verificación de autenticación en cada request
- Headers de autorización requeridos

### 🛡️ Validación de Datos
- Validación de campos obligatorios
- Verificación de formatos (email, URLs)
- Sanitización de entrada de datos
- Transacciones atómicas para operaciones críticas

## 📱 Uso del Módulo

### 🚀 Acceso al Panel

1. **Iniciar sesión** como administrador
2. **Navegar** a `/sitio-web`
3. **Seleccionar** la sección a editar
4. **Realizar cambios** en los formularios
5. **Guardar** los cambios

### 📝 Edición de Información

1. **Información General**:
   - Editar título, subtítulo, descripción
   - Actualizar lema de la empresa

2. **Empresa**:
   - Modificar datos de contacto
   - Actualizar dirección y horarios
   - Cambiar información fiscal

3. **Servicios**:
   - Agregar nuevos servicios
   - Editar descripciones existentes
   - Activar/desactivar servicios
   - Reordenar lista de servicios

4. **Redes Sociales**:
   - Configurar URLs de redes sociales
   - Activar/desactivar redes
   - Validar enlaces

5. **Configuración**:
   - Controlar visibilidad de elementos
   - Activar modo mantenimiento
   - Configurar opciones de visualización

## 🔧 Mantenimiento

### 📊 Monitoreo
- Logs de cambios en configuración
- Registro de fechas de actualización
- Historial de modificaciones

### 🛠️ Resolución de Problemas

**Error: "Acceso denegado"**
- Verificar que el usuario sea administrador
- Comprobar autenticación activa

**Error: "Datos no se guardan"**
- Verificar conexión con la base de datos
- Comprobar permisos de escritura
- Revisar logs de errores

**Error: "API no responde"**
- Verificar que el servidor Django esté ejecutándose
- Comprobar configuración de CORS
- Revisar logs del servidor

## 📈 Futuras Mejoras

### 🚀 Funcionalidades Planificadas

- **📸 Gestión de imágenes** para el sitio web
- **📝 Editor WYSIWYG** para descripciones
- **📊 Analytics** de visitas al sitio
- **📧 Newsletter** integrado
- **💬 Chat en vivo** para soporte
- **📱 App móvil** para administración

### 🔄 Optimizaciones

- **⚡ Caché** para datos estáticos
- **🖼️ Optimización** de imágenes
- **📱 PWA** (Progressive Web App)
- **🔍 SEO** automático
- **🌍 Internacionalización** (i18n)

## 📞 Soporte

Para soporte técnico o consultas sobre el módulo Sitio Web:

- **Email**: soporte@teltecnet.com
- **Teléfono**: 0999859689
- **Horario**: Lunes a Viernes 8:00 AM - 6:00 PM

---

**Desarrollado por TelTec Net** 🚀
*Conectando tu mundo digital*
