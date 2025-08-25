from django.core.cache import cache
from django.conf import settings
from datetime import datetime, date
import hashlib
import json

def get_cache_key(prefix, **kwargs):
    """Genera una clave única para el caché basada en parámetros"""
    # Crear un diccionario ordenado de parámetros
    params = sorted(kwargs.items())
    param_string = json.dumps(params, sort_keys=True)
    
    # Generar hash para evitar claves muy largas
    hash_obj = hashlib.md5(param_string.encode())
    hash_hex = hash_obj.hexdigest()[:8]
    
    return f"{prefix}_{hash_hex}"

def get_cached_stats(cache_key, timeout=None):
    """Obtiene estadísticas del caché"""
    if timeout is None:
        timeout = settings.CACHE_TIMEOUTS.get('stats_daily', 300)
    
    return cache.get(cache_key, None)

def set_cached_stats(cache_key, data, timeout=None):
    """Guarda estadísticas en el caché"""
    if timeout is None:
        timeout = settings.CACHE_TIMEOUTS.get('stats_daily', 300)
    
    cache.set(cache_key, data, timeout)

def invalidate_cache_pattern(pattern):
    """Invalida todas las claves de caché que coincidan con un patrón"""
    # Para caché local, simplemente limpiar todo
    # En producción se podría usar Redis con patrones
    cache.clear()

def invalidate_pagos_cache():
    """Invalida caché relacionado con pagos"""
    invalidate_cache_pattern('pagos_*')

def invalidate_deudas_cache():
    """Invalida caché relacionado con deudas"""
    invalidate_cache_pattern('deudas_*')

def invalidate_stats_cache():
    """Invalida caché de estadísticas"""
    invalidate_cache_pattern('stats_*')

def get_stats_cache_key(stats_type, **params):
    """Genera clave de caché para estadísticas específicas"""
    today = date.today().isoformat()
    return get_cache_key(f"stats_{stats_type}_{today}", **params)

def get_pagos_stats_cache_key(**params):
    """Genera clave de caché para estadísticas de pagos"""
    return get_stats_cache_key('pagos', **params)

def get_deudas_stats_cache_key(**params):
    """Genera clave de caché para estadísticas de deudas"""
    return get_stats_cache_key('deudas', **params)

def cache_decorator(timeout=None, key_prefix=''):
    """Decorador para cachear funciones"""
    def decorator(func):
        def wrapper(*args, **kwargs):
            # Generar clave de caché
            cache_key = get_cache_key(f"{key_prefix}_{func.__name__}", 
                                    args=args, kwargs=kwargs)
            
            # Intentar obtener del caché
            cached_result = get_cached_stats(cache_key, timeout)
            if cached_result is not None:
                return cached_result
            
            # Si no está en caché, ejecutar función
            result = func(*args, **kwargs)
            
            # Guardar en caché
            set_cached_stats(cache_key, result, timeout)
            
            return result
        return wrapper
    return decorator
