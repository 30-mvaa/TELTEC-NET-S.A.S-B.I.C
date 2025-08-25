from django.urls import path
from . import views

urlpatterns = [
    # Autenticación
    path('api/auth/login/', views.login, name='login'),
    path('api/auth/user-info/', views.get_user_info, name='user_info'),
    path('api/auth/forgot/', views.forgot_password, name='forgot_password'),
    path('api/auth/reset/', views.reset_password, name='reset_password'),
    path('api/auth/reset-password/', views.verify_reset_token, name='verify_reset_token'),
    
    # Gestión de usuarios
    path('api/usuarios/', views.list_usuarios, name='list_usuarios'),
    path('api/usuarios/create/', views.create_usuario, name='create_usuario'),
    path('api/usuarios/update/', views.update_usuario, name='update_usuario'),
    path('api/usuarios/<int:user_id>/delete/', views.delete_usuario, name='delete_usuario'),
] 