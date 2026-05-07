# ⚡ Guide Rapide - Monitoring

## 🚀 Démarrage en 30 Secondes

### 1. Intégrer les commandes monitoring

```bash
integrate-monitoring.bat
```

### 2. Installer et démarrer

```bash
make setup-monitoring
```

### 3. Ouvrir Grafana

```bash
make open-grafana
```

**Login:** admin / admin123

---

## 📋 Commandes Essentielles

```bash
make start-monitoring      # Démarrer
make stop-monitoring       # Arrêter
make logs-monitoring       # Voir les logs
make monitoring-dashboard  # Afficher les liens
```

---

## 🌐 Accès Rapide

- **Grafana:** http://localhost:3001 (admin / admin123)
- **Prometheus:** http://localhost:9090
- **cAdvisor:** http://localhost:8081

---

## 🎯 Pour la Démo

```bash
# 1. Démarrer monitoring
make setup-monitoring

# 2. Démarrer l'application
make start-dev

# 3. Ouvrir Grafana
make open-grafana

# 4. Naviguer dans l'app pour générer des métriques
make open-frontend

# 5. Dans Grafana:
#    - Explore → Prometheus → Voir métriques
#    - Explore → Loki → Voir logs
```

---

## 📊 Métriques à Montrer

### Dans Prometheus (http://localhost:9090)

**Requêtes exemple:**

```promql
# CPU containers
rate(container_cpu_usage_seconds_total[1m]) * 100

# Mémoire containers
container_memory_usage_bytes / 1024 / 1024

# Requêtes par seconde
rate(container_network_receive_bytes_total[1m])
```

### Dans Grafana Explore (Loki)

**Requêtes logs:**

```logql
# Tous les logs backend
{container="backend"}

# Erreurs uniquement
{container="backend"} |= "ERROR"

# Logs frontend
{container="frontend"}
```

---

## 💡 Points pour la Soutenance

**Montrer:**
1. ✅ Grafana interface moderne
2. ✅ Métriques temps réel
3. ✅ Logs centralisés
4. ✅ Monitoring par container

**Expliquer:**
- Stack monitoring complète (Prometheus + Grafana + Loki)
- Observabilité: métriques + logs
- Temps réel
- Alertes configurées

---

## 📖 Documentation Complète

Pour plus de détails: [MONITORING.md](MONITORING.md)

---

**Date:** 2026-05-07  
**Version:** 1.0 - Quick Start
