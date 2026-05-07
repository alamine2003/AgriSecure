# 🔍 Système de Monitoring - Grafana + Prometheus + Loki

## 📋 Vue d'Ensemble

Stack de monitoring complète pour surveiller l'application en temps réel:

- **Prometheus** - Collecte et stockage des métriques
- **Grafana** - Visualisation et dashboards
- **Loki** - Agrégation et recherche de logs
- **Promtail** - Collecte des logs Docker
- **cAdvisor** - Métriques des containers
- **Node Exporter** - Métriques système

---

## 🚀 Démarrage Rapide

### Installation Complète

```bash
make setup-monitoring
```

Cette commande va:
1. ✅ Créer le réseau Docker
2. ✅ Builder les images
3. ✅ Démarrer tous les services
4. ✅ Afficher les liens d'accès

---

### Démarrage Simple

```bash
make start-monitoring
```

### Arrêt

```bash
make stop-monitoring
```

### Redémarrage

```bash
make restart-monitoring
```

---

## 🌐 Accès aux Services

### Grafana (Dashboards)

**URL:** http://localhost:3001  
**Login:** admin  
**Password:** admin123

**Fonctionnalités:**
- Dashboards personnalisés
- Exploration des métriques Prometheus
- Visualisation des logs Loki
- Alertes configurables

---

### Prometheus (Métriques)

**URL:** http://localhost:9090

**Métriques disponibles:**
- Requêtes HTTP Django (latence, erreurs)
- Base de données (connexions, requêtes)
- Redis (hits, misses, mémoire)
- Nginx (requêtes, status codes)
- Système (CPU, RAM, disque)
- Containers Docker (utilisation ressources)

---

### Loki (Logs)

**URL:** http://localhost:3100  
**Interface:** http://localhost:3001/explore (via Grafana)

**Logs collectés:**
- Tous les containers Docker
- Backend Django
- Frontend Vite
- Nginx
- Celery workers
- Base de données

---

### cAdvisor (Containers)

**URL:** http://localhost:8081

**Informations:**
- CPU par container
- Mémoire par container
- Réseau par container
- I/O disque par container

---

## 📊 Commandes Make

### Gestion Services

```bash
make start-monitoring      # Démarrer
make stop-monitoring       # Arrêter
make restart-monitoring    # Redémarrer
make status-monitoring     # État des services
```

### Logs

```bash
make logs-monitoring       # Tous les logs
make logs-grafana          # Logs Grafana
make logs-prometheus       # Logs Prometheus
make logs-loki             # Logs Loki
```

### Accès Rapide

```bash
make open-grafana          # Ouvrir Grafana
make open-prometheus       # Ouvrir Prometheus
make open-loki             # Ouvrir Loki (Explore)
make monitoring-dashboard  # Afficher tous les liens
```

### Maintenance

```bash
make clean-monitoring      # Nettoyer les données
make setup-monitoring      # Réinstaller
```

---

## 🎯 Cas d'Usage

### 1. Surveiller les Performances Backend

**Dans Grafana:**
1. Ouvrir http://localhost:3001
2. Login: admin / admin123
3. Aller dans Explore (icône boussole)
4. Sélectionner source: Prometheus
5. Requête exemple:

```promql
# Temps de réponse p95
histogram_quantile(0.95, 
  rate(django_http_requests_latency_seconds_bucket[5m])
)

# Taux d'erreur
rate(django_http_responses_total_by_status{status=~"5.."}[5m])

# Requêtes par seconde
rate(django_http_requests_total[1m])
```

---

### 2. Analyser les Logs en Temps Réel

**Dans Grafana Explore:**
1. Ouvrir http://localhost:3001/explore
2. Sélectionner source: Loki
3. Requêtes exemple:

```logql
# Tous les logs backend
{container="backend"}

# Erreurs uniquement
{container="backend"} |= "ERROR"

# Logs d'une vue Django spécifique
{container="backend"} |= "surveillance/cameras"

# Filtrer par niveau
{container="backend"} | json | level="ERROR"
```

---

### 3. Surveiller l'Utilisation Ressources

**Requêtes Prometheus:**

```promql
# CPU par container
rate(container_cpu_usage_seconds_total{name=~"backend|frontend"}[1m]) * 100

# Mémoire par container
container_memory_usage_bytes{name=~"backend|frontend"} / 1024 / 1024

# Requêtes base de données
rate(pg_stat_database_xact_commit[5m])
```

---

### 4. Détecter les Problèmes

**Alertes configurées:**

1. **Backend Down** - Backend inaccessible > 1 min
2. **High Response Time** - P95 > 1s pendant 5 min
3. **High Error Rate** - > 5% erreurs 5xx
4. **Database Issues** - > 10 erreurs DB en 5 min
5. **High CPU** - > 80% pendant 5 min
6. **High Memory** - > 1GB pendant 5 min

**Voir les alertes:**
http://localhost:9090/alerts

---

## 📈 Dashboards Recommandés

### Dashboard Backend

**Panels à créer:**
1. Requêtes/seconde par endpoint
2. Latence P50, P90, P95, P99
3. Taux d'erreur (4xx, 5xx)
4. Connexions DB actives
5. Cache Redis (hits/misses)
6. Workers Celery actifs

### Dashboard Système

**Panels à créer:**
1. CPU total système
2. Mémoire RAM utilisée
3. Disque utilisé
4. Réseau (in/out)
5. CPU par container
6. Mémoire par container

### Dashboard Logs

**Panels à créer:**
1. Logs en temps réel (streaming)
2. Erreurs par service
3. Top 10 erreurs
4. Distribution niveau logs (INFO/WARNING/ERROR)

---

## 🛠️ Configuration Avancée

### Ajouter Django Prometheus Metrics

**1. Installer le package:**

Déjà inclus dans `requirements.monitoring.txt`

**2. Modifier `settings.py`:**

```python
INSTALLED_APPS = [
    'django_prometheus',  # En premier
    ...
]

MIDDLEWARE = [
    'django_prometheus.middleware.PrometheusBeforeMiddleware',  # En premier
    ...
    'django_prometheus.middleware.PrometheusAfterMiddleware',   # En dernier
]

# Database avec monitoring
DATABASES = {
    'default': {
        'ENGINE': 'django_prometheus.db.backends.postgresql',
        ...
    }
}
```

**3. Ajouter l'endpoint metrics:**

```python
# urls.py
urlpatterns = [
    path('metrics/', include('django_prometheus.urls')),
    ...
]
```

**4. Rebuild backend:**

```bash
make restart-backend
```

**5. Tester:**

```bash
curl http://localhost:8000/metrics
```

---

### Personnaliser les Dashboards Grafana

**1. Créer un dashboard:**
- Ouvrir Grafana
- + (menu gauche) → Create Dashboard
- Add Panel

**2. Ajouter une requête Prometheus:**
- Data source: Prometheus
- Metric browser: choisir une métrique
- Run queries

**3. Configurer la visualisation:**
- Panel options (à droite)
- Choisir type: Graph, Stat, Gauge, etc.

**4. Sauvegarder:**
- Save dashboard (icône disquette en haut)

---

### Configurer les Alertes

**1. Dans Prometheus (alerts/backend_alerts.yml):**

```yaml
- alert: MonAlerte
  expr: ma_requete > seuil
  for: 5m
  labels:
    severity: warning
  annotations:
    summary: "Titre alerte"
    description: "Description détaillée"
```

**2. Recharger Prometheus:**

```bash
make restart-monitoring
```

**3. Dans Grafana:**
- Alerting → Alert rules
- New alert rule
- Définir condition
- Configurer notification

---

## 📊 Métriques Clés à Surveiller

### Performance

- ✅ **Latence P95** < 500ms
- ✅ **Latence P99** < 1s
- ✅ **Taux erreur** < 1%
- ✅ **Disponibilité** > 99.9%

### Ressources

- ✅ **CPU** < 70%
- ✅ **Mémoire** < 80%
- ✅ **Disque** < 80%
- ✅ **Connexions DB** < 80%

### Application

- ✅ **Requêtes/sec** (baseline à établir)
- ✅ **Cache hit rate** > 80%
- ✅ **Workers Celery actifs** ≥ 1
- ✅ **Détections IA/min** (baseline)

---

## 🎓 Pour la Soutenance

### Démarrer le Monitoring

```bash
# Avant la démo
make setup-monitoring
make monitoring-dashboard
```

### Montrer en Démo

1. **Dashboard Grafana temps réel:**
   - Métriques en direct
   - Graphiques interactifs
   - Design professionnel

2. **Logs en streaming:**
   - Explore Loki
   - Filtrage en temps réel
   - Corrélation métriques/logs

3. **Alertes configurées:**
   - Liste des alertes
   - Seuils définis
   - Notifications

### Points Techniques à Mentionner

**Stack monitoring:**
- Prometheus (standard industrie)
- Grafana (visualisation)
- Loki (logs centralisés)
- Exporters (métriques système)

**Métriques collectées:**
- Performance application (latence, throughput)
- Santé infrastructure (CPU, RAM, disque)
- Logs structurés et recherchables
- Alertes proactives

**Bonnes pratiques:**
- Monitoring temps réel
- Observabilité complète (metrics + logs)
- Alertes sur seuils
- Rétention 30 jours

---

## 🔍 Troubleshooting

### Grafana inaccessible

```bash
make status-monitoring
make logs-grafana
make restart-monitoring
```

### Prometheus ne collecte pas

```bash
# Vérifier config
docker-compose -f docker-compose.monitoring.yml exec prometheus cat /etc/prometheus/prometheus.yml

# Recharger config
docker-compose -f docker-compose.monitoring.yml kill -HUP prometheus
```

### Loki ne reçoit pas les logs

```bash
make logs-promtail
make restart-monitoring
```

### Métriques Django manquantes

```bash
# Vérifier endpoint metrics
curl http://localhost:8000/metrics

# Si erreur 404, installer django-prometheus
make restart-backend
```

---

## 📚 Ressources

### Documentation Officielle

- Prometheus: https://prometheus.io/docs/
- Grafana: https://grafana.com/docs/
- Loki: https://grafana.com/docs/loki/
- django-prometheus: https://github.com/korfuri/django-prometheus

### Dashboards Pré-configurés

- Grafana Dashboards: https://grafana.com/grafana/dashboards/
- Django: Dashboard ID 9528
- PostgreSQL: Dashboard ID 9628
- Redis: Dashboard ID 11835
- Docker: Dashboard ID 893

### Commandes Utiles

```bash
make help                  # Toutes les commandes
make monitoring-dashboard  # Liens monitoring
make status-monitoring     # État services
make logs-monitoring       # Logs temps réel
```

---

## ✅ Checklist Monitoring

Avant la démo:

- [ ] `make setup-monitoring` exécuté
- [ ] Grafana accessible (http://localhost:3001)
- [ ] Login Grafana fonctionne (admin/admin123)
- [ ] Prometheus collecte métriques
- [ ] Loki reçoit les logs
- [ ] Dashboard créé avec panels
- [ ] Alertes configurées

Pendant la démo:

- [ ] Montrer Grafana en temps réel
- [ ] Afficher métriques backend
- [ ] Filtrer logs par service
- [ ] Expliquer alertes configurées
- [ ] Mentionner bonnes pratiques

---

**Date:** 2026-05-07  
**Version:** 1.0 - Monitoring Complet  
**Statut:** ✅ PRÊT À L'EMPLOI
