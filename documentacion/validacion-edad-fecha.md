# Validación de Edad y Fecha de Nacimiento

## Descripción
Se ha implementado un sistema completo de validación de edad mínima (18 años) y mejorado la entrada de fecha de nacimiento en el módulo de clientes.

## Características

### 1. Validación de Edad Mínima
- **Requisito**: Usuarios deben ser mayores de 18 años
- **Validación en tiempo real**: Feedback instantáneo
- **Validación backend**: Seguridad adicional en el servidor

### 2. Múltiples Formas de Ingreso de Fecha
- **Input nativo de fecha**: Selector estándar del navegador
- **Selector alternativo**: Día, mes y año por separado
- **Límites automáticos**: Solo fechas válidas (18-100 años)

### 3. Feedback Visual
- ✅ Verde: Fecha válida con edad calculada
- ⚠️ Rojo: Fecha inválida (menor de 18 años o muy antigua)
- 📅 Formato legible: "15 de Enero de 1990"

## Funciones Implementadas

### `calcularEdad(fechaNacimiento: string): number`
Calcula la edad exacta a partir de una fecha de nacimiento.

### `validarMayorEdad(fechaNacimiento: string): boolean`
Valida que una persona sea mayor de 18 años.

### `obtenerFechaMinima(): string`
Obtiene la fecha mínima permitida (18 años atrás desde hoy).

### `obtenerFechaMaxima(): string`
Obtiene la fecha máxima permitida (100 años atrás desde hoy).

### `formatearFecha(fecha: string): string`
Formatea una fecha para mostrar en formato legible en español.

## Validaciones Implementadas

### Frontend (React)
1. **Validación en tiempo real** mientras el usuario selecciona fecha
2. **Límites automáticos** en el input de fecha
3. **Cálculo de edad** instantáneo
4. **Feedback visual** con colores y mensajes

### Backend (API)
1. **Validación en POST** (crear cliente)
2. **Validación en PUT** (actualizar cliente)
3. **Mensajes de error** específicos

## Rango de Fechas Permitidas
- **Fecha mínima**: 18 años atrás desde hoy
- **Fecha máxima**: 100 años atrás desde hoy
- **Ejemplo**: Si hoy es 2024, se permiten fechas entre 1924 y 2006

## Selector de Fecha Alternativo
Proporciona una forma más intuitiva de seleccionar fechas:

### Día
- Rango: 1-31
- Selección numérica directa

### Mes
- Nombres en español: Enero, Febrero, Marzo, etc.
- Selección por nombre del mes

### Año
- Rango: Desde 18 años atrás hasta 100 años atrás
- Orden descendente (más reciente primero)

## Ejemplos de Uso

### Fechas Válidas
- `1990-01-15` ✅ (34 años)
- `1985-06-20` ✅ (39 años)
- `1970-12-31` ✅ (54 años)

### Fechas Inválidas
- `2010-05-10` ❌ (menor de 18 años)
- `1920-03-15` ❌ (más de 100 años)
- `2025-01-01` ❌ (fecha futura)

## Archivos Modificados
- `lib/utils.ts` - Funciones de validación de edad y fecha
- `app/clientes/page.tsx` - Validación en tiempo real y selector alternativo
- `app/api/clientes/route.ts` - Validación en el backend

## Beneficios
1. **Experiencia de Usuario**: Múltiples formas de ingresar fecha
2. **Seguridad**: Validación en frontend y backend
3. **Precisión**: Cálculo exacto de edad
4. **Flexibilidad**: Selector nativo y alternativo
5. **Cumplimiento**: Garantiza usuarios mayores de edad

## Integración con Cédula
- Ambos sistemas de validación trabajan en conjunto
- Validación de cédula ecuatoriana + edad mínima
- Feedback visual combinado para ambos campos 