# Validación de Cédula Ecuatoriana

## Descripción
Se ha implementado un sistema completo de validación de cédula ecuatoriana en el módulo de clientes.

## Características

### 1. Validación en Tiempo Real
- **Frontend**: Validación instantánea mientras el usuario escribe
- **Feedback Visual**: 
  - ✅ Verde: Cédula válida
  - ⚠️ Rojo: Cédula inválida o incompleta
  - Formato automático: `123456789-0`

### 2. Validación Backend
- **API**: Validación en el servidor para mayor seguridad
- **Métodos**: POST (crear) y PUT (actualizar)

### 3. Algoritmo de Validación
La validación sigue el algoritmo oficial ecuatoriano:

1. **Verificación de formato**: 10 dígitos numéricos
2. **Verificación de secuencia**: No permite números repetidos (1111111111)
3. **Verificación del tercer dígito**: Debe ser 0-6
4. **Cálculo del dígito verificador**:
   - Coeficientes: [2,1,2,1,2,1,2,1,2]
   - Multiplicación y suma
   - Cálculo del dígito verificador esperado
   - Comparación con el dígito real

## Funciones Implementadas

### `validarCedulaEcuatoriana(cedula: string): boolean`
Valida una cédula ecuatoriana según el algoritmo oficial.

### `formatearCedula(cedula: string): string`
Formatea una cédula con guión (ej: 123456789-0).

## Ejemplos de Cédulas Válidas
- `1723456789`
- `1001234567`
- `0601234567`

## Ejemplos de Cédulas Inválidas
- `1234567890` (dígito verificador incorrecto)
- `1111111111` (secuencia repetida)
- `123456789` (menos de 10 dígitos)
- `12345678901` (más de 10 dígitos)

## Uso en el Sistema

### Frontend (React)
```typescript
import { validarCedulaEcuatoriana, formatearCedula } from "@/lib/utils";

// Validación en tiempo real
const validarCedulaEnTiempoReal = (cedula: string) => {
  if (validarCedulaEcuatoriana(cedula)) {
    console.log("Cédula válida:", formatearCedula(cedula));
  }
};
```

### Backend (API)
```typescript
import { validarCedulaEcuatoriana } from "@/lib/utils";

// En el endpoint
if (!validarCedulaEcuatoriana(body.cedula)) {
  return NextResponse.json(
    { success: false, message: "Cédula ecuatoriana inválida" },
    { status: 400 }
  );
}
```

## Archivos Modificados
- `lib/utils.ts` - Funciones de validación
- `app/clientes/page.tsx` - Validación en tiempo real en el formulario
- `app/api/clientes/route.ts` - Validación en el backend

## Beneficios
1. **Experiencia de Usuario**: Feedback inmediato
2. **Seguridad**: Validación en frontend y backend
3. **Precisión**: Algoritmo oficial ecuatoriano
4. **Formato**: Presentación consistente con guión 