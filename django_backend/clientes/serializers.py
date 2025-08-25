from rest_framework import serializers
from .models import Cliente


class ClienteSerializer(serializers.ModelSerializer):
    """Serializer para el modelo Cliente"""
    nombre_completo = serializers.ReadOnlyField()
    edad = serializers.ReadOnlyField()
    tiene_telegram = serializers.ReadOnlyField()
    
    class Meta:
        model = Cliente
        fields = [
            'id', 'cedula', 'nombres', 'apellidos', 'tipo_plan', 'precio_plan',
            'fecha_nacimiento', 'direccion', 'sector', 'email', 'telefono',
            'telegram_chat_id', 'estado', 'fecha_registro', 'fecha_actualizacion',
            'nombre_completo', 'edad', 'tiene_telegram'
        ]
        read_only_fields = ['id', 'fecha_registro', 'fecha_actualizacion']
    
    def validate_cedula(self, value):
        """Validar cédula ecuatoriana y única"""
        if len(value) != 10:
            raise serializers.ValidationError("La cédula debe tener 10 dígitos")
        if not value.isdigit():
            raise serializers.ValidationError("La cédula solo debe contener números")
        
        # Verificar que no exista otra cédula igual
        if Cliente.objects.filter(cedula=value).exists():
            raise serializers.ValidationError("Ya existe un cliente con esta cédula")
        
        return value
    
    def validate_email(self, value):
        """Validar email único"""
        if Cliente.objects.filter(email=value).exists():
            raise serializers.ValidationError("Ya existe un cliente con este email")
        return value


class ClienteUpdateSerializer(serializers.ModelSerializer):
    """Serializer para actualizar clientes (permite email y cédula existentes)"""
    nombre_completo = serializers.ReadOnlyField()
    edad = serializers.ReadOnlyField()
    tiene_telegram = serializers.ReadOnlyField()
    
    class Meta:
        model = Cliente
        fields = [
            'id', 'cedula', 'nombres', 'apellidos', 'tipo_plan', 'precio_plan',
            'fecha_nacimiento', 'direccion', 'sector', 'email', 'telefono',
            'telegram_chat_id', 'estado', 'fecha_registro', 'fecha_actualizacion',
            'nombre_completo', 'edad', 'tiene_telegram'
        ]
        read_only_fields = ['id', 'fecha_registro', 'fecha_actualizacion']
    
    def validate_cedula(self, value):
        """Validar cédula ecuatoriana"""
        if len(value) != 10:
            raise serializers.ValidationError("La cédula debe tener 10 dígitos")
        if not value.isdigit():
            raise serializers.ValidationError("La cédula solo debe contener números")
        return value


class ClienteListSerializer(serializers.ModelSerializer):
    """Serializer para listar clientes (campos básicos)"""
    nombre_completo = serializers.ReadOnlyField()
    edad = serializers.ReadOnlyField()
    tiene_telegram = serializers.ReadOnlyField()
    
    class Meta:
        model = Cliente
        fields = [
            'id', 'cedula', 'nombres', 'apellidos', 'tipo_plan', 'precio_plan',
            'email', 'telefono', 'estado', 'fecha_registro', 'nombre_completo',
            'edad', 'tiene_telegram'
        ] 