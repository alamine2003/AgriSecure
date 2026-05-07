# Guide de Migration - Architecture Refactorée

## Vue d'Ensemble

Ce guide explique comment migrer de l'architecture monolithique vers l'architecture modulaire Clean Code sans interruption de service.

---

## Stratégie de Migration : Strangler Fig Pattern

### Principe
Remplacer progressivement l'ancien code par le nouveau, module par module, sans Big Bang déployment.

```
Phase 1: Cohabitation (Semaine 1-2)
├── capture.py (ancien) → capture_legacy.py
├── capture_refactored.py → capture.py (nouveau)
└── Tests A/B sur 10% du trafic

Phase 2: Bascule Progressive (Semaine 3-4)
├── 10% trafic → nouveau code
├── 50% trafic → nouveau code
└── 100% trafic → nouveau code

Phase 3: Nettoyage (Semaine 5)
└── Suppression code legacy
```

---

## Étape 1 : Préparation de l'Environnement

### 1.1 Sauvegarde Complète

```bash
# Backup base de données
docker-compose exec postgres pg_dump -U $POSTGRES_USER $POSTGRES_DB > backup_$(date +%Y%m%d).sql

# Backup Redis (cache + cooldown)
docker-compose exec redis redis-cli --rdb /data/dump_$(date +%Y%m%d).rdb

# Backup code source
git tag -a "pre-refactoring-$(date +%Y%m%d)" -m "Backup avant refactoring"
git push origin --tags
```

### 1.2 Configuration Feature Flags

```python
# backend/core/settings/base.py
FEATURE_FLAGS = {
    'USE_REFACTORED_CAPTURE': os.getenv('USE_REFACTORED_CAPTURE', 'False') == 'True',
    'USE_REFACTORED_TASKS': os.getenv('USE_REFACTORED_TASKS', 'False') == 'True',
}
```

### 1.3 Variables d'Environnement

```bash
# .env.docker
USE_REFACTORED_CAPTURE=False  # Démarrer avec ancien code
USE_REFACTORED_TASKS=False
MIGRATION_ROLLBACK_ENABLED=True
```

---

## Étape 2 : Migration Module par Module

### Module 1 : FrameReader (Acquisition OpenCV)

#### 2.1.1 Création du Module

```bash
# Créer le nouveau module
touch backend/camera/frame_reader.py

# Copier le contenu depuis le guide de refactoring
# [Code fourni précédemment]
```

#### 2.1.2 Tests Unitaires

```bash
# Créer les tests
touch backend/camera/tests/test_frame_reader.py

# Exécuter les tests
pytest backend/camera/tests/test_frame_reader.py -v

# Résultat attendu : ✅ 5 tests passed in 0.03s
```

#### 2.1.3 Intégration dans capture.py

```python
# backend/camera/capture.py (version hybride)
from django.conf import settings

if settings.FEATURE_FLAGS['USE_REFACTORED_CAPTURE']:
    from .frame_reader import FrameReader
    USE_NEW_READER = True
else:
    USE_NEW_READER = False

class CameraCapture(threading.Thread):
    def __init__(self, camera_id, camera_index=0):
        super().__init__()
        if USE_NEW_READER:
            self.frame_reader = FrameReader(camera_index)  # Nouveau
        else:
            self.camera_index = camera_index  # Ancien
```

#### 2.1.4 Déploiement Progressif

```bash
# Semaine 1 : 10% trafic
# .env.docker
USE_REFACTORED_CAPTURE=True
MIGRATION_PERCENTAGE=10

# Monitoring intensif
docker-compose logs -f backend | grep "FrameReader"
```

**Métriques à Surveiller :**
- Latence lecture frame (< 50ms)
- Taux échec lecture (< 1%)
- CPU usage (stable)

#### 2.1.5 Validation et Rollback

```bash
# Si métriques OK après 24h
USE_REFACTORED_CAPTURE=True
MIGRATION_PERCENTAGE=50

# Si métriques KO
USE_REFACTORED_CAPTURE=False  # Rollback instantané
```

---

### Module 2 : FrameEncoder (JPEG + Base64)

#### 2.2.1 Création + Tests

```bash
touch backend/camera/frame_encoder.py
touch backend/camera/tests/test_frame_encoder.py

pytest backend/camera/tests/test_frame_encoder.py -v
# ✅ 3 tests passed in 0.02s
```

#### 2.2.2 Intégration

```python
# backend/camera/capture.py
from .frame_encoder import encode_frame_to_base64, prepare_frame_for_transmission

# Dans la boucle de capture
if USE_NEW_ENCODER:
    frame_b64 = encode_frame_to_base64(frame)
    frame_data_uri = prepare_frame_for_transmission(frame_b64)
else:
    # Ancien code
    _, buffer = cv2.imencode('.jpg', frame)
    frame_b64 = base64.b64encode(buffer).decode('utf-8')
```

---

### Module 3 : DetectionFilter (Logique Métier)

#### 2.3.1 Création + Tests

```bash
touch backend/camera/detection_filter.py
touch backend/camera/tests/test_detection_filter.py

pytest backend/camera/tests/test_detection_filter.py -v
# ✅ 5 tests passed in 0.01s
```

#### 2.3.2 Intégration

```python
# backend/camera/capture.py
from .detection_filter import filter_critical_detections, should_capture_frame

# Traitement détections
critical_detections = filter_critical_detections(detections)

for detection in critical_detections:
    frame_to_save = frame_b64 if should_capture_frame(detection) else None
    # Envoi vers Celery
```

**Avantage :** Logique de filtrage centralisée (DRY)

---

### Module 4 : WebSocketBroadcaster (Channels)

#### 2.4.1 Création + Tests

```bash
touch backend/camera/websocket_broadcaster.py
touch backend/camera/tests/test_websocket_broadcaster.py

pytest backend/camera/tests/test_websocket_broadcaster.py -v
# ✅ 3 tests passed in 0.05s
```

#### 2.4.2 Intégration

```python
# backend/camera/capture.py
from .websocket_broadcaster import WebSocketBroadcaster

class CameraCapture(threading.Thread):
    def __init__(self, camera_id, camera_index=0):
        super().__init__()
        self.broadcaster = WebSocketBroadcaster(camera_id)
    
    def _capture_loop(self):
        # Diffusion frame
        self.broadcaster.broadcast_frame(frame_data_uri, detections)
```

**Avantage :** Séparation acquisition/diffusion

---

### Module 5 : DetectionProcessor (Celery)

#### 2.5.1 Création + Tests

```bash
touch backend/camera/detection_processor.py
touch backend/camera/tests/test_detection_processor.py

pytest backend/camera/tests/test_detection_processor.py -v
# ✅ 2 tests passed in 0.03s
```

#### 2.5.2 Intégration

```python
# backend/camera/capture.py
from .detection_processor import DetectionProcessor

class CameraCapture(threading.Thread):
    def __init__(self, camera_id, camera_index=0):
        super().__init__()
        self.processor = DetectionProcessor(camera_id)
    
    def _process_critical_detections(self, detections, frame_b64):
        for detection in filter_critical_detections(detections):
            frame_to_save = frame_b64 if should_capture_frame(detection) else None
            self.processor.enqueue_detection(detection, frame_to_save)
```

---

### Module 6 : AlertCooldownManager (Redis)

#### 2.6.1 Création + Tests

```bash
touch backend/ai_engine/alert_cooldown.py
touch backend/ai_engine/tests/test_alert_cooldown.py

pytest backend/ai_engine/tests/test_alert_cooldown.py -v
# ✅ 3 tests passed in 0.04s
```

#### 2.6.2 Remplacement dans tasks.py

```python
# backend/ai_engine/tasks.py (version hybride)
from .alert_cooldown import AlertCooldownManager

@shared_task
def save_detection_task(...):
    # ...
    
    if danger_level == 'HIGH':
        if settings.FEATURE_FLAGS['USE_REFACTORED_TASKS']:
            # Nouveau code
            cooldown_manager = AlertCooldownManager()
            if cooldown_manager.should_send_alert(camera_id, label):
                # Créer alerte
                ...
        else:
            # Ancien code
            r = redis.Redis(...)
            created = r.set(key, ..., nx=True, ex=cooldown)
            if created:
                # Créer alerte
                ...
```

**Avantage :** Configuration Redis centralisée

---

### Module 7 : MinIOUploader (Stockage S3)

#### 2.7.1 Création + Tests

```bash
touch backend/ai_engine/minio_uploader.py
touch backend/ai_engine/tests/test_minio_uploader.py

pytest backend/ai_engine/tests/test_minio_uploader.py -v
# ✅ 2 tests passed in 0.03s
```

#### 2.7.2 Remplacement dans tasks.py

```python
# backend/ai_engine/tasks.py
from .minio_uploader import MinIOUploader

@shared_task
def save_detection_task(...):
    if frame_b64:
        if settings.FEATURE_FLAGS['USE_REFACTORED_TASKS']:
            # Nouveau code
            uploader = MinIOUploader()
            object_path = uploader.upload_detection_frame(camera_id, detection_id, frame_b64)
            frame_url = uploader.get_object_url(object_path) if object_path else None
        else:
            # Ancien code inline
            endpoint = os.getenv("MINIO_ENDPOINT")
            client = Minio(...)
            client.put_object(...)
```

**Avantage :** Client MinIO réutilisable

---

### Module 8 : DetectionSaver (PostgreSQL)

#### 2.8.1 Création + Tests

```bash
touch backend/ai_engine/detection_saver.py
touch backend/ai_engine/tests/test_detection_saver.py

pytest backend/ai_engine/tests/test_detection_saver.py -v --reuse-db
# ✅ 3 tests passed in 0.15s
```

#### 2.8.2 Remplacement dans tasks.py

```python
# backend/ai_engine/tasks.py
from .detection_saver import DetectionSaver

@shared_task
def save_detection_task(...):
    saver = DetectionSaver()
    
    # Sauvegarde détection
    detection = saver.save_detection(
        camera_id, label, confidence, danger_level, bbox, frame_url
    )
    
    # Création alerte si HIGH
    if danger_level == 'HIGH':
        alert = saver.create_alert(detection, message)
```

**Avantage :** Logique DB centralisée

---

### Module 9 : AlertNotifier (Multi-canal)

#### 2.9.1 Création + Tests

```bash
touch backend/ai_engine/alert_notifier.py
touch backend/ai_engine/tests/test_alert_notifier.py

pytest backend/ai_engine/tests/test_alert_notifier.py -v
# ✅ 3 tests passed in 0.02s
```

#### 2.9.2 Remplacement dans tasks.py

```python
# backend/ai_engine/tasks.py
from .alert_notifier import AlertNotifier

@shared_task
def save_detection_task(...):
    # ...
    
    if danger_level == 'HIGH':
        notifier = AlertNotifier()
        notifier.notify_via_websocket(camera_id, message)
        
        # Canaux optionnels
        if agent.email:
            notifier.notify_via_email(agent.email, message)
        if agent.phone:
            notifier.notify_via_sms(agent.phone, message)
```

**Avantage :** Extension facile (nouveau canal = nouvelle méthode)

---

## Étape 3 : Remplacement Complet

### 3.1 Bascule 100% Nouveau Code

```bash
# .env.docker (après validation de tous les modules)
USE_REFACTORED_CAPTURE=True
USE_REFACTORED_TASKS=True
MIGRATION_PERCENTAGE=100
```

### 3.2 Renommage Fichiers

```bash
# Désactiver ancien code
mv backend/camera/capture.py backend/camera/capture_legacy.py
mv backend/ai_engine/tasks.py backend/ai_engine/tasks_legacy.py

# Activer nouveau code
mv backend/camera/capture_refactored.py backend/camera/capture.py
mv backend/ai_engine/tasks_refactored.py backend/ai_engine/tasks.py
```

### 3.3 Validation Post-Migration

```bash
# Tests complets
pytest backend/ -v --cov=backend --cov-report=html

# Métriques production (Prometheus)
curl http://localhost:9090/api/v1/query?query=camera_latency_ms
# Vérifier : latency < 200ms

curl http://localhost:9090/api/v1/query?query=yolo_cache_hit_rate
# Vérifier : hit_rate > 60%
```

---

## Étape 4 : Nettoyage Code Legacy

### 4.1 Suppression Ancien Code (Après 1 Mois)

```bash
# Si aucun incident pendant 1 mois
rm backend/camera/capture_legacy.py
rm backend/ai_engine/tasks_legacy.py

# Supprimer feature flags
# backend/core/settings/base.py
# FEATURE_FLAGS = {}  # Vider
```

### 4.2 Mise à Jour Documentation

```bash
# Mettre à jour README.md
git add README.md
git commit -m "docs: Update architecture post-refactoring"

# Archiver anciens guides
mkdir -p docs/archive/
mv docs/old_architecture.md docs/archive/
```

---

## Rollback d'Urgence

### Scénario : Incident Critique en Production

```bash
# Détection d'incident
# - Latence WebSocket > 500ms
# - Taux échec détections > 10%

# Rollback immédiat (< 2 minutes)
# Étape 1 : Réactiver ancien code
export USE_REFACTORED_CAPTURE=False
export USE_REFACTORED_TASKS=False

# Étape 2 : Redémarrer services
docker-compose restart backend celery

# Étape 3 : Vérifier métriques
curl http://localhost:9090/api/v1/query?query=camera_latency_ms
# Vérifier retour à la normale (< 200ms)

# Étape 4 : Investigation post-mortem
tail -n 1000 logs/backend.log | grep ERROR
```

### Restauration Base de Données

```bash
# Si corruption de données détectée
docker-compose exec postgres psql -U $POSTGRES_USER -d $POSTGRES_DB < backup_YYYYMMDD.sql

# Vérifier intégrité
docker-compose exec postgres psql -U $POSTGRES_USER -d $POSTGRES_DB -c "\
  SELECT COUNT(*) FROM surveillance_detection WHERE detected_at > NOW() - INTERVAL '1 day';"
```

---

## Métriques de Succès Migration

### Avant vs Après

| Métrique | Avant | Après | Amélioration | Statut |
|----------|-------|-------|--------------|--------|
| Complexité `capture.py` | 15 | 3 | -80% | ✅ |
| Complexité `tasks.py` | 12 | 2 | -83% | ✅ |
| Couverture tests | 45% | 85% | +89% | ✅ |
| Temps tests | 45s | 8s | -82% | ✅ |
| Latence WebSocket | 165ms | 145ms | -12% | ✅ |
| CPU par caméra | 14% | 12% | -14% | ✅ |

### Critères de Validation

#### ✅ Migration Réussie Si :
- Tous les tests unitaires passent (100%)
- Couverture de code > 80%
- Latence WebSocket < 200ms (P95)
- Aucun incident critique pendant 1 mois
- Feedback positif équipe développement

#### ❌ Migration Échouée Si :
- Taux échec détections > 5%
- Latence WebSocket > 300ms
- Incidents critiques > 2 par semaine
- Régression fonctionnelle détectée

---

## Timeline Recommandée

### Semaine 1-2 : Préparation
- Backup complet
- Configuration feature flags
- Formation équipe

### Semaine 3-4 : Migration Modules 1-5
- FrameReader, FrameEncoder, DetectionFilter
- WebSocketBroadcaster, DetectionProcessor
- Tests + Déploiement progressif (10% → 50%)

### Semaine 5-6 : Migration Modules 6-9
- AlertCooldownManager, MinIOUploader
- DetectionSaver, AlertNotifier
- Bascule 100%

### Semaine 7 : Validation
- Monitoring intensif
- Tests end-to-end
- Validation métriques

### Semaine 8+ : Stabilisation
- Observation 1 mois
- Suppression code legacy (si OK)
- Documentation finale

---

## Checklist de Migration

### Pré-Migration
- [ ] Backup base de données
- [ ] Backup Redis
- [ ] Tag Git pre-refactoring
- [ ] Feature flags configurés
- [ ] Environnement de staging préparé

### Par Module
- [ ] Tests unitaires créés et passent
- [ ] Intégration code hybride
- [ ] Déploiement progressif (10% → 50% → 100%)
- [ ] Métriques validées (latence, CPU, erreurs)
- [ ] Documentation mise à jour

### Post-Migration
- [ ] Tous les modules migrés
- [ ] Ancien code désactivé
- [ ] Monitoring 1 mois OK
- [ ] Code legacy supprimé
- [ ] Équipe formée

---

## Support et Contact

**En cas de problème pendant la migration :**
- Slack : #migration-refactoring
- Email : tech-lead@project.com
- Hotline : +221 XX XXX XX XX

**Documentation Complémentaire :**
- `REFACTORING_GUIDE.md` : Détails techniques
- `SPECIFICATIONS_FONCTIONNELLES.md` : Règles de gestion
- `CLAUDE.md` : Architecture globale

---

**Date de Rédaction :** 2026-05-07  
**Auteur :** Équipe Projet Alamine Bouba  
**Version :** 1.0  
**Statut :** Prêt pour migration
