from django.urls import path, include
from django.http import JsonResponse
from django.db import connections
import os
import redis

def health_check(request):
    services = {}
    ok = True

    try:
        with connections["default"].cursor() as cursor:
            cursor.execute("SELECT 1;")
        services["database"] = "up"
    except Exception:
        services["database"] = "down"
        ok = False

    try:
        r = redis.Redis(
            host=os.getenv("REDIS_HOST", "redis"),
            port=int(os.getenv("REDIS_PORT", "6379")),
            password=os.getenv("REDIS_PASSWORD") or None,
            socket_connect_timeout=1,
            socket_timeout=1,
        )
        r.ping()
        services["redis"] = "up"
    except Exception:
        services["redis"] = "down"
        ok = False

    try:
        from core.celery import app as celery_app
        i = celery_app.control.inspect(timeout=1.0)
        ping_result = i.ping()
        services["celery"] = "up" if ping_result else "down"
        if not ping_result:
            ok = False
    except Exception:
        services["celery"] = "unknown"

    return JsonResponse({"status": "ok" if ok else "degraded", "services": services}, status=200 if ok else 503)

urlpatterns = [
    path('', include('users.urls')),
    path('surveillance/', include('surveillance.urls')),
    path('notifications/', include('notifications.urls')),
    path('reports/', include('reports.urls')),
    path('health/', health_check, name='health'),
]
