#!/bin/bash
echo "🔄 Moviendo archivo de estadísticas..."

# Verificar si existe el archivo de estadísticas en la ubicación antigua
if [ -f "app/clientes/estadisticas/route.ts" ]; then
    echo "📁 Creando carpeta estadísticas en API..."
    mkdir -p app/api/clientes/estadisticas
    
    echo "📦 Moviendo archivo de estadísticas..."
    mv app/clientes/estadisticas/route.ts app/api/clientes/estadisticas/
    
    echo "🗑️ Eliminando carpeta vacía..."
    rm -rf app/clientes/estadisticas
    
    echo "✅ Archivo movido exitosamente"
else
    echo "ℹ️ El archivo de estadísticas ya fue movido o no existe"
fi

echo "📊 Estructura final de API:"
tree app/api
