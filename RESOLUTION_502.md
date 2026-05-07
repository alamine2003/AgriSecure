# 🔧 Résolution de l'Erreur 502 Bad Gateway

## Causes Courantes de l'Erreur 502

L'erreur 502 Bad Gateway signifie que **nginx ne peut pas communiquer avec le backend Django** ou le **frontend React**.

### Causes Possibles :
1. ✅ **Backend Django n'est pas démarré** ou crashé
2. ✅ **Configuration nginx incorrecte** (ports, upstream)
3. ✅ **Timeouts trop courts** (requêtes longues)
4. ✅ **Problème de réseau Docker** entre conteneurs
5. ✅ **Variables d'environnement incorrectes** (.env.docker)

---

## ✅ Corrections Appliquées

### 1. Configuration Nginx Améliorée

**Fichier : `nginx/nginx.conf`**

**Changements :**
- ✅ **Timeouts augmentés** : 600 secondes (au lieu de 60s par défaut)
- ✅ **Buffering désactivé** : Pour les flux temps réel
- ✅ **Routing API corrigé** : `/api/` au lieu de `/api/v1/` uniquement
- ✅ **Health check ajouté** : `/health` pour vérifier nginx
- ✅ **Gestion erreurs améliorée** : Fallback pour React Router

```nginx
# Timeouts augmentés
proxy_connect_timeout 600;
proxy_send_timeout 600;
proxy_read_timeout 600;

# API routing (toutes les routes /api/)
location /api/ {
    proxy_pass http://django;
    proxy_buffering off;
    proxy_request_buffering off;
    ...
}
```

### 2. Docker Compose Corrigé

**Fichier : `docker-compose.yml`**

**Changements :**
- ✅ **env_file corrigé** : `.env.docker` au lieu de `.env` pour celery-worker
- ✅ **restart policy ajoutée** : `restart: on-failure` pour celery
- ✅ **Healthchecks présents** : postgres, redis, minio

---

## 🚀 Solution Rapide (Automatique)

### Option 1 : Script Automatique

Double-cliquez sur :
```
fix-502-and-restart.bat
```

Ce script va :
1. Arrêter tous les services
2. Reconstruire les images (backend, frontend, nginx)
3. Redémarrer tous les services
4. Afficher les logs

### Option 2 : Commandes Manuelles

```bash
# 1. Arrêter tous les services
docker-compose down

# 2. Reconstruire les images
docker-compose build --no-cache

# 3. Redémarrer
docker-compose up -d

# 4. Vérifier l'état
docker-compose ps

# 5. Voir les logs
docker-compose logs -f
```

---

## 🔍 Diagnostic Étape par Étape

### Étape 1 : Vérifier l'État des Conteneurs

```bash
docker-compose ps
```

**Résultat Attendu :**
```
NAME                STATUS
backend             Up (healthy)
frontend            Up
nginx               Up
postgres            Up (healthy)
redis               Up (healthy)
```

**Si un service est "Down" ou "Exited" :**
```bash
# Voir les logs du service en erreur
docker-compose logs backend
docker-compose logs frontend
docker-compose logs nginx
```

### Étape 2 : Vérifier que le Backend Répond

```bash
# Test direct du backend (sans nginx)
curl http://localhost:8000/api/docs/

# OU depuis PowerShell
Invoke-WebRequest -Uri http://localhost:8000/api/docs/
```

**Si erreur "Connection refused" :**
- Le backend n'est pas démarré ou crashé
- Vérifier les logs : `docker-compose logs backend`

### Étape 3 : Vérifier que Nginx Fonctionne

```bash
# Test health check nginx
curl http://localhost/health

# Résultat attendu : "OK"
```

**Si erreur :**
```bash
# Entrer dans le conteneur nginx
docker-compose exec nginx sh

# Tester la connexion au backend depuis nginx
wget -O- http://backend:8000/api/docs/

# Si erreur : problème de réseau Docker
```

### Étape 4 : Vérifier les Logs Backend

```bash
docker-compose logs backend --tail=100
```

**Erreurs Courantes :**

#### Erreur : "ModuleNotFoundError"
```bash
# Reconstruire l'image backend
docker-compose build backend
docker-compose up -d backend
```

#### Erreur : "Connection to database refused"
```bash
# Vérifier postgres
docker-compose ps postgres

# Redémarrer postgres si nécessaire
docker-compose restart postgres

# Attendre que postgres soit "healthy"
docker-compose ps postgres
```

#### Erreur : "ASGI application failed to start"
```bash
# Vérifier les migrations
docker-compose exec backend python manage.py showmigrations

# Appliquer les migrations
docker-compose exec backend python manage.py migrate
```

### Étape 5 : Vérifier les Variables d'Environnement

```bash
# Vérifier que .env.docker existe
ls .env.docker

# Afficher les variables
docker-compose exec backend printenv | grep DJANGO
```

**Variables Critiques :**
- `DJANGO_SETTINGS_MODULE` : doit être `core.settings.prod` ou `core.settings.dev`
- `POSTGRES_HOST` : doit être `postgres` (nom du service Docker)
- `REDIS_HOST` : doit être `redis`

---

## 🔧 Solutions par Type d'Erreur

### Erreur 502 lors de l'Accès à `/api/`

**Cause :** Backend Django n'est pas accessible

**Solution :**
```bash
# 1. Vérifier que le backend est UP
docker-compose ps backend

# 2. Tester le backend directement
curl http://localhost:8000/api/docs/

# 3. Si erreur, reconstruire
docker-compose build backend
docker-compose up -d backend

# 4. Vérifier les logs
docker-compose logs backend
```

### Erreur 502 lors de l'Accès à `/`

**Cause :** Frontend React n'est pas accessible

**Solution :**
```bash
# 1. Vérifier que le frontend est UP
docker-compose ps frontend

# 2. Reconstruire si nécessaire
docker-compose build frontend
docker-compose up -d frontend

# 3. Vérifier les logs
docker-compose logs frontend
```

### Erreur 502 lors de l'Accès à `/ws/`

**Cause :** WebSocket backend non accessible

**Solution :**
```bash
# 1. Vérifier que Daphne (ASGI) est démarré
docker-compose logs backend | grep -i daphne

# 2. Vérifier la commande de démarrage
docker-compose exec backend ps aux | grep daphne

# Résultat attendu : daphne -b 0.0.0.0 -p 8000 core.asgi:application
```

### Erreur 502 Intermittente

**Cause :** Timeouts trop courts ou ressources insuffisantes

**Solution :**
```bash
# 1. Augmenter les ressources Docker Desktop
# Settings → Resources → Memory : 8 GB minimum

# 2. Vérifier la charge CPU/RAM
docker stats

# 3. Si un conteneur utilise 100% CPU, redémarrer
docker-compose restart <service>
```

---

## 🧪 Tests de Validation

### Test 1 : Page d'Accueil

```bash
curl -I http://localhost/

# Résultat attendu : HTTP/1.1 200 OK
```

### Test 2 : API Swagger

```bash
curl -I http://localhost/api/docs/

# Résultat attendu : HTTP/1.1 200 OK
```

### Test 3 : Django Admin

```bash
curl -I http://localhost/admin/

# Résultat attendu : HTTP/1.1 302 Found (redirection login)
```

### Test 4 : Health Check

```bash
curl http://localhost/health

# Résultat attendu : OK
```

---

## 📊 Monitoring en Temps Réel

### Logs en Continu

```bash
# Tous les services
docker-compose logs -f

# Backend uniquement
docker-compose logs -f backend

# Nginx uniquement
docker-compose logs -f nginx

# Avec filtrage
docker-compose logs -f | grep -i error
```

### Statistiques des Conteneurs

```bash
# CPU, RAM, Network
docker stats

# Arrêter avec Ctrl+C
```

---

## 🆘 Si Rien ne Fonctionne

### Reset Complet (ATTENTION : Perte de Données)

```bash
# 1. Arrêter et supprimer TOUT
docker-compose down -v

# 2. Supprimer les images
docker-compose rm -f
docker rmi $(docker images -q)

# 3. Nettoyer Docker
docker system prune -a --volumes

# 4. Reconstruire depuis zéro
docker-compose build --no-cache

# 5. Redémarrer
docker-compose up -d

# 6. Recréer superuser
docker-compose exec backend python manage.py createsuperuser
```

---

## 📋 Checklist de Résolution

Cochez au fur et à mesure :

- [ ] `docker-compose ps` → Tous les services "Up"
- [ ] `curl http://localhost:8000/api/docs/` → Backend répond
- [ ] `curl http://localhost/health` → Nginx répond
- [ ] `docker-compose logs backend` → Pas d'erreurs
- [ ] `docker-compose logs nginx` → Pas d'erreurs
- [ ] `.env.docker` existe et est correctement configuré
- [ ] `http://localhost` → Page d'accueil affichée ✅
- [ ] `http://localhost/api/docs/` → Swagger affiché ✅
- [ ] `http://localhost/admin/` → Page login Django ✅

---

## 🎯 Améliorations Frontend Incluses

### 1. Page d'Accueil (Landing Page)

**Fichier créé : `frontend/src/pages/Home.jsx`**

**Fonctionnalités :**
- ✅ Design moderne avec gradients et animations
- ✅ Présentation des fonctionnalités (6 cartes)
- ✅ Statistiques de performance (latence, disponibilité)
- ✅ Section rôles (Agent vs Maintenancier)
- ✅ Footer professionnel
- ✅ Responsive (mobile-friendly)

### 2. Dashboard Amélioré

**Fichier créé : `frontend/src/pages/DashboardImproved.jsx`**

**Fonctionnalités :**
- ✅ **4 cartes statistiques** : Détections, Alertes, Caméras, Statut
- ✅ **Accès rapides maintenancier** : Gestion agents, Rendez-vous, Admin
- ✅ **Flux caméras amélioré** : Design moderne avec icônes
- ✅ **Activité récente** : Scroll infini, 20 dernières détections
- ✅ **Résumé des alertes** : Compteurs HIGH/MEDIUM/LOW
- ✅ **Animations** : Transitions, hover effects
- ✅ **Responsive** : Grille adaptive mobile/desktop

### 3. Routes Mises à Jour

**Fichier modifié : `frontend/src/App.jsx`**

**Changements :**
- ✅ Route `/` → Page d'accueil (Home)
- ✅ Route `/dashboard` → Dashboard authentifié
- ✅ Route `/login` → Connexion
- ✅ Toutes les routes protégées → Layout avec sidebar

---

## 🚀 Déploiement des Changements

### Pour Appliquer les Changements

```bash
# 1. Reconstruire frontend (contient le nouveau Dashboard)
docker-compose build frontend

# 2. Reconstruire nginx (nouvelle config)
docker-compose build nginx

# 3. Reconstruire backend (au cas où)
docker-compose build backend

# 4. Redémarrer tous les services
docker-compose down
docker-compose up -d

# 5. Vérifier
curl http://localhost/
# Devrait afficher la nouvelle page d'accueil
```

### Ou Utiliser le Script

```bash
fix-502-and-restart.bat
```

---

## 📞 Support

Si l'erreur persiste après toutes ces étapes :

1. **Capturer les logs complets** :
   ```bash
   docker-compose logs > logs_complets.txt
   ```

2. **Vérifier la version Docker** :
   ```bash
   docker --version
   docker-compose --version
   ```

3. **Redémarrer Docker Desktop**

4. **Vérifier les ports disponibles** :
   ```bash
   netstat -ano | findstr :80
   netstat -ano | findstr :8000
   ```

---

**Date de Création :** 2026-05-07  
**Version :** 1.0  
**Auteur :** Équipe Projet Alamine Bouba  
**Statut :** ✅ Corrections appliquées, prêt à tester
