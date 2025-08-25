#!/bin/bash

echo "🚀 Iniciando servidores de TelTec Net..."

# Manejar Ctrl+C
trap "echo '🛑 Deteniendo servidores...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit 0" SIGINT SIGTERM

# Función para verificar si un puerto está en uso
check_port() {
    lsof -ti:$1 > /dev/null 2>&1
}

# Función para matar procesos en un puerto
kill_port() {
    if check_port $1; then
        echo "⚠️  Puerto $1 ocupado. Matando proceso..."
        lsof -ti:$1 | xargs kill -9
        sleep 2
    fi
}

# Verificar y liberar puertos si es necesario
kill_port 8000
kill_port 3000

# Iniciar Django backend
echo "📡 Iniciando Django backend (puerto 8000)..."
cd django_backend
source venv/bin/activate
python manage.py runserver 0.0.0.0:8000 >> ../backend.log 2>&1 &
BACKEND_PID=$!
cd ..

# Esperar un momento para que Django se inicie
sleep 3

# Verificar que Django esté funcionando
if curl -s http://localhost:8000 > /dev/null 2>&1; then
    echo "✅ Django backend iniciado correctamente"
else
    echo "❌ Error iniciando Django backend"
    exit 1
fi

# Iniciar Next.js frontend
echo "🌐 Iniciando Next.js frontend (puerto 3000)..."
npm run dev >> frontend.log 2>&1 &
FRONTEND_PID=$!

# Esperar un momento para que Next.js se inicie
sleep 5

# Verificar que Next.js esté funcionando
if curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo "✅ Next.js frontend iniciado correctamente"
else
    echo "❌ Error iniciando Next.js frontend"
    exit 1
fi

echo ""
echo "🎉 ¡Servidores iniciados exitosamente!"
echo ""
echo "📱 URLs disponibles:"
echo "   Frontend: http://localhost:3000"
echo "   Backend:  http://localhost:8000"
echo "   Admin:    http://localhost:8000/admin"
echo ""
echo "📋 Logs disponibles:"
echo "   Backend:  tail -f backend.log"
echo "   Frontend: tail -f frontend.log"
echo ""

# Mantener el script ejecutándose
wait
