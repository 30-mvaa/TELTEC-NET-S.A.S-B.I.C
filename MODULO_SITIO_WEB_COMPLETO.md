# Módulo de Sitio Web - Sistema Completo

## 🎯 **Descripción General**

El módulo de sitio web es un sistema completo de gestión de contenido que permite administrar todos los aspectos del sitio web público de TelTec Net desde el panel administrativo.

## 🏗️ **Arquitectura del Sistema**

### **Frontend (React/Next.js)**
- **Ubicación**: `app/sitio-web/page.tsx`
- **Tecnologías**: React, TypeScript, Tailwind CSS, Shadcn/ui
- **Funcionalidades**: Interfaz de administración completa

### **Backend (Django)**
- **Ubicación**: `django_backend/sitio_web/`
- **Tecnologías**: Django, Django REST Framework, PostgreSQL
- **Funcionalidades**: API REST completa, modelos de datos

### **Sitio Web Público**
- **Ubicación**: `app/sitio-web-publico/page.tsx`
- **Funcionalidades**: Sitio web público que consume los datos del backend

## 📊 **Modelos de Datos**

### **1. InformacionSitio**
```python
- titulo: Título principal del sitio
- subtitulo: Subtítulo descriptivo
- descripcion: Descripción completa de la empresa
- lema: Lema o slogan de la empresa
```

### **2. Empresa**
```python
- nombre: Nombre de la empresa
- direccion: Dirección física
- telefono: Número de teléfono
- email: Correo electrónico
- ruc: Número de RUC
- horario: Horarios de atención
```

### **3. Servicio**
```python
- nombre: Nombre del servicio
- descripcion: Descripción detallada
- icono: Icono representativo
- imagen: URL de imagen
- activo: Estado activo/inactivo
- orden: Orden de visualización
```

### **4. Plan**
```python
- nombre: Nombre del plan
- velocidad: Velocidad de internet
- precio: Precio mensual
- descripcion: Descripción del plan
- caracteristicas: Lista de características
- popular: Marca como plan popular
- activo: Estado activo/inactivo
- orden: Orden de visualización
```

### **5. Cobertura**
```python
- zona: Nombre de la zona
- descripcion: Descripción de la cobertura
- coordenadas: Coordenadas GPS (lat, lng)
- activo: Estado activo/inactivo
- orden: Orden de visualización
```

### **6. Contacto**
```python
- tipo: Tipo de contacto (teléfono, email, whatsapp, etc.)
- titulo: Título del contacto
- valor: Valor del contacto
- icono: Icono representativo
- url: URL de enlace
- activo: Estado activo/inactivo
- orden: Orden de visualización
```

### **7. Carrusel**
```python
- titulo: Título de la imagen
- descripcion: Descripción de la imagen
- imagen: URL de la imagen
- video: URL del video (opcional)
- enlace: Enlace de destino
- activo: Estado activo/inactivo
- orden: Orden de visualización
```

### **8. Header**
```python
- logo_url: URL del logo
- logo_alt: Texto alternativo del logo
- mostrar_menu: Mostrar/ocultar menú
- color_fondo: Color de fondo
- color_texto: Color del texto
```

### **9. Footer**
```python
- texto_copyright: Texto de copyright
- mostrar_redes_sociales: Mostrar/ocultar redes sociales
- mostrar_contacto: Mostrar/ocultar contacto
- color_fondo: Color de fondo
- color_texto: Color del texto
```

### **10. RedSocial**
```python
- nombre: Nombre de la red social
- tipo: Tipo de red social
- url: URL de la red social
- icono: Icono representativo
- activo: Estado activo/inactivo
```

### **11. ConfiguracionSitio**
```python
- mostrar_precios: Mostrar/ocultar precios
- mostrar_contacto: Mostrar/ocultar contacto
- mostrar_testimonios: Mostrar/ocultar testimonios
- modo_mantenimiento: Activar modo mantenimiento
- mensaje_mantenimiento: Mensaje de mantenimiento
```

## 🎨 **Interfaz de Usuario**

### **Pestañas del Módulo**

#### **1. General**
- **Información del Sitio**: Título, subtítulo, descripción, lema
- **Información de Empresa**: Datos completos de la empresa
- **Header y Footer**: Configuración de logo, colores, menús

#### **2. Servicios**
- **Gestión CRUD**: Crear, editar, eliminar servicios
- **Campos**: Nombre, descripción, icono, imagen, estado
- **Funcionalidades**: Agregar múltiples servicios, ordenar

#### **3. Planes**
- **Gestión CRUD**: Crear, editar, eliminar planes
- **Campos**: Nombre, velocidad, precio, descripción, características
- **Funcionalidades**: Marcar como popular, ordenar

#### **4. Cobertura**
- **Gestión CRUD**: Crear, editar, eliminar zonas de cobertura
- **Campos**: Zona, descripción, coordenadas GPS
- **Funcionalidades**: Mapeo de zonas, ordenar

#### **5. Contacto**
- **Gestión CRUD**: Crear, editar, eliminar contactos
- **Tipos**: Teléfono, email, WhatsApp, dirección, horario
- **Campos**: Título, valor, icono, URL, estado

#### **6. Carrusel**
- **Gestión CRUD**: Crear, editar, eliminar imágenes del carrusel
- **Campos**: Título, descripción, imagen, video, enlace
- **Funcionalidades**: Soporte para imágenes y videos

## 🔧 **API Endpoints**

### **Configuración del Sitio Web**
```
GET /api/sitio-web/configuracion/
PUT /api/sitio-web/configuracion/
```

### **Sitio Web Público**
```
GET /api/sitio-web/publico/
```

## 📱 **Funcionalidades Implementadas**

### **✅ Completamente Funcional**
- ✅ **Gestión de Información General**
- ✅ **Gestión de Empresa**
- ✅ **CRUD de Servicios**
- ✅ **CRUD de Planes**
- ✅ **CRUD de Coberturas**
- ✅ **CRUD de Contactos**
- ✅ **CRUD de Carrusel**
- ✅ **Configuración de Header/Footer**
- ✅ **Gestión de Redes Sociales**
- ✅ **Configuración del Sitio**

### **🔄 Funcionalidades de Guardado**
- ✅ **Guardado Individual**: Cada pestaña tiene su propio botón de guardado
- ✅ **Validación**: Validación de campos requeridos
- ✅ **Feedback**: Mensajes de éxito/error
- ✅ **Estado de Carga**: Indicadores de carga durante el guardado

### **🎯 Características Avanzadas**
- ✅ **Ordenamiento**: Todos los elementos tienen orden configurable
- ✅ **Estados Activo/Inactivo**: Control de visibilidad
- ✅ **Iconos Dinámicos**: Soporte para iconos personalizados
- ✅ **URLs Dinámicas**: Enlaces configurables
- ✅ **Coordenadas GPS**: Para mapas de cobertura
- ✅ **Soporte Multimedia**: Imágenes y videos en carrusel

## 🗄️ **Base de Datos**

### **Scripts de Población**
- **Ubicación**: `django_backend/scripts/poblar_datos_sitio_web.py`
- **Funcionalidad**: Poblar datos iniciales del sitio web
- **Datos Incluidos**:
  - Información del sitio
  - Datos de empresa
  - 4 servicios predefinidos
  - 3 planes de internet
  - 3 zonas de cobertura
  - 5 contactos
  - 3 imágenes de carrusel
  - Configuración de header/footer
  - 3 redes sociales

### **Migraciones**
- **Migración 0001**: Modelos iniciales
- **Migración 0002**: Limpieza de datos
- **Migración 0004**: Nuevos modelos (Plan, Cobertura, Contacto, Carrusel, Header, Footer)
- **Migración 0005**: Campos adicionales para Servicio

## 🚀 **Cómo Usar**

### **1. Acceso al Módulo**
```
URL: http://localhost:3000/sitio-web
Rol Requerido: Administrador
```

### **2. Navegación**
- **Pestañas**: Usar las pestañas para navegar entre secciones
- **Guardado**: Cada pestaña tiene su propio botón de guardado
- **Recarga**: Botón "Recargar" para actualizar datos

### **3. Gestión de Contenido**
- **Agregar**: Botón "Agregar" en cada sección
- **Editar**: Modificar campos directamente
- **Eliminar**: Botón de eliminar con confirmación
- **Ordenar**: Campo "orden" para controlar la posición

### **4. Configuración**
- **Activo/Inactivo**: Switches para controlar visibilidad
- **Colores**: Selectores de color para header/footer
- **URLs**: Campos para enlaces externos

## 🔍 **Verificación**

### **Verificar Funcionamiento**
1. **Acceder al módulo**: `http://localhost:3000/sitio-web`
2. **Verificar carga**: Los datos deben cargarse automáticamente
3. **Editar contenido**: Modificar cualquier campo
4. **Guardar cambios**: Hacer clic en "Guardar"
5. **Verificar mensaje**: Confirmar mensaje de éxito

### **Verificar Sitio Público**
1. **Acceder al sitio**: `http://localhost:3000/sitio-web-publico`
2. **Verificar datos**: Los cambios deben reflejarse
3. **Verificar carrusel**: Imágenes deben mostrarse
4. **Verificar contacto**: Información de contacto actualizada

## 📊 **Estado Actual**

### **✅ Completamente Implementado**
- ✅ **Backend**: Modelos, vistas, URLs, migraciones
- ✅ **Frontend**: Interfaz completa con todas las pestañas
- ✅ **API**: Endpoints funcionando correctamente
- ✅ **Base de Datos**: Datos poblados y funcionando
- ✅ **Validación**: Validación de campos y errores
- ✅ **UX/UI**: Interfaz intuitiva y responsive

### **🎯 Próximas Mejoras**
- **Subida de Archivos**: Sistema de subida de imágenes
- **Editor WYSIWYG**: Editor rico para descripciones
- **Vista Previa**: Vista previa en tiempo real
- **Historial**: Historial de cambios
- **Backup**: Sistema de respaldo automático

## 🔧 **Solución de Problemas**

### **Error: "Error al guardar los datos"**
1. **Verificar servidor**: Django debe estar ejecutándose
2. **Verificar conexión**: Base de datos PostgreSQL activa
3. **Verificar permisos**: Usuario debe ser administrador
4. **Verificar logs**: Revisar logs del servidor Django

### **Error: "No se pudieron cargar los datos"**
1. **Verificar API**: Endpoint `/sitio-web/configuracion/` accesible
2. **Verificar datos**: Ejecutar script de población
3. **Verificar migraciones**: Aplicar todas las migraciones

### **Error: "Campo requerido"**
1. **Completar campos**: Llenar todos los campos obligatorios
2. **Validar formato**: Verificar formato de URLs y emails
3. **Guardar individualmente**: Usar botón de guardado específico

## 📈 **Métricas de Éxito**

### **Funcionalidad**
- ✅ **100% de pestañas implementadas**
- ✅ **100% de CRUD operaciones funcionando**
- ✅ **100% de validaciones implementadas**
- ✅ **100% de endpoints respondiendo**

### **Datos**
- ✅ **11 modelos implementados**
- ✅ **Datos iniciales poblados**
- ✅ **Migraciones aplicadas**
- ✅ **Estructura de BD optimizada**

### **Usuario**
- ✅ **Interfaz intuitiva**
- ✅ **Feedback inmediato**
- ✅ **Navegación clara**
- ✅ **Responsive design**

¡El módulo de sitio web está completamente funcional y listo para producción!

