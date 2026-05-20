"""
AgriWatch custom Prometheus metrics.
Imported once at startup via AppConfig.ready(); all metrics are singletons.
"""
from prometheus_client import Counter, Gauge, Histogram

# ── Caméras ───────────────────────────────────────────────────
cameras_total = Gauge(
    'agriwatch_cameras_total',
    'Nombre de caméras par statut',
    ['status'],
)

# ── Détections IA ─────────────────────────────────────────────
detections_total = Counter(
    'agriwatch_detections_total',
    'Nombre total de détections enregistrées',
    ['danger_level', 'species'],
)

yolo_inference_seconds = Histogram(
    'agriwatch_yolo_inference_seconds',
    'Durée des inférences YOLOv8 en secondes',
    buckets=[0.05, 0.1, 0.25, 0.5, 0.75, 1.0, 1.5, 2.0, 5.0],
)

# ── Cache frames ──────────────────────────────────────────────
frame_cache_hits_total = Counter(
    'agriwatch_frame_cache_hits_total',
    'Hits du cache Redis pour les frames YOLO',
)

frame_cache_misses_total = Counter(
    'agriwatch_frame_cache_misses_total',
    'Misses du cache Redis pour les frames YOLO',
)

# ── WebSocket ─────────────────────────────────────────────────
websocket_connections_active = Gauge(
    'agriwatch_websocket_connections_active',
    'Nombre de connexions WebSocket de surveillance actives',
)

# ── Métiers ───────────────────────────────────────────────────
active_agents_total = Gauge(
    'agriwatch_active_agents_total',
    'Nombre d\'agents agricoles actifs dans le système',
)

pending_registrations_total = Gauge(
    'agriwatch_pending_registrations_total',
    'Nombre de demandes d\'inscription agents en attente de validation',
)

alerts_sent_total = Counter(
    'agriwatch_alerts_sent_total',
    'Nombre total d\'alertes envoyées',
    ['channel'],  # websocket | email | sms | in_app
)
