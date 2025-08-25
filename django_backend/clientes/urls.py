from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ClienteViewSet, actualizar_valor, eliminar_valor, test_clientes

router = DefaultRouter()
router.register(r'clientes', ClienteViewSet)

urlpatterns = [
    path('api/', include(router.urls)),
    # URLs personalizadas para gestión de valores únicos
    path('api/clientes/actualizar-valor/', actualizar_valor, name='actualizar_valor'),
    path('api/clientes/eliminar-valor/', eliminar_valor, name='eliminar_valor'),
    path('api/test-clientes/', test_clientes, name='test_clientes'),
] 