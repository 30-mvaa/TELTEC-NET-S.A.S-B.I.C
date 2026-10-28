import os
import django

# Configuración de Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'teltec_backend.settings')
django.setup()

from django.db import connection
from notificaciones.services.telegram_service import get_telegram_service
from notificaciones.models import Notificacion, ColaEnvio
from django.utils import timezone

def test_send():
    phone = '0998662662'
    # Usamos un chat_id de prueba. 
    # NOTA: Para que llegue, el dueño del número debe haber iniciado el bot.
    test_chat_id = '123456789' 
    
    print(f"🔍 Buscando cliente con teléfono {phone}...")
    
    with connection.cursor() as cursor:
        cursor.execute("SELECT id, nombres FROM clientes WHERE telefono = %s LIMIT 1", [phone])
        row = cursor.fetchone()
        
        if not row:
            print("❌ Cliente no encontrado con ese número.")
            return
        
        cliente_id, nombre = row
        print(f"✅ Cliente encontrado: {nombre} (ID: {cliente_id})")
        
        # 1. Forzar vinculación a Telegram para la prueba
        cursor.execute("UPDATE clientes SET telegram_chat_id = %s WHERE id = %s", [test_chat_id, cliente_id])
        print(f"🔗 Vinculando cliente al Chat ID: {test_chat_id}")

    # 2. Crear notificación rediseñada
    tg_service = get_telegram_service()
    datos = {'deuda': '440.667', 'dias_atraso': '5', 'plan': 'Plan Hogar'}
    
    # Generamos el texto usando la nueva plantilla rediseñada
    mensaje = tg_service._formato_pago_vencido(nombre, datos)
    
    # Guardamos en la DB
    notif = Notificacion.objects.create(
        cliente_id=cliente_id,
        tipo='pago_vencido',
        mensaje=mensaje,
        canal='telegram',
        estado='pendiente'
    )
    
    # Encolamos
    ColaEnvio.objects.create(
        notificacion=notif,
        cliente_id=cliente_id,
        canal_primario='telegram',
        canal_fallback='email',
        estado='pendiente',
        proximo_reintento=timezone.now()
    )
    
    print(f"📝 Notificación creada y encolada (ID: {notif.id})")
    
    # 3. Intentar envío inmediato para validar el rediseño
    print("🚀 Intentando envío inmediato del mensaje rico...")
    ok, resp, err = tg_service.send_message(
        chat_id=test_chat_id,
        text=mensaje,
        reply_markup=tg_service.create_inline_keyboard([
            ("💳 Reportar Pago", "https://wa.me/593998662662"),
            ("📄 Ver mi Estado", "https://teltec.net/mi-cuenta")
        ])
    )
    
    if ok:
        print("🎉 ¡ÉXITO! El mensaje rico fue enviado a la API de Telegram.")
    else:
        print(f"❌ Error de API: {err}")
        print("Sugerencia: Asegúrate de que el bot tenga el token correcto y que el chat_id sea válido.")

if __name__ == "__main__":
    test_send()
