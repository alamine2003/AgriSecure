# 🚀 Guide de Démarrage Rapide

## Prérequis

### ✅ À Installer
1. **Docker Desktop** : https://www.docker.com/products/docker-desktop
   - Version minimum : 20.10+
   - Inclut Docker Compose
   
2. **Git** (optionnel) : Pour cloner le projet
   - https://git-scm.com/downloads

### ✅ Configuration Système
- **RAM** : Minimum 8 GB (recommandé 16 GB)
- **Espace Disque** : 10 GB libres
- **OS** : Windows 10/11, macOS, Linux

---

## Démarrage en 5 Minutes

### Méthode 1 : Script Automatique (Windows)

1. **Double-cliquer** sur `start-app.bat`
2. **Choisir l'option 1** : "Démarrer en mode développement"
3. **Attendre** que tous les services démarrent (2-3 minutes)
4. **Accéder** à http://localhost

### Méthode 2 : Ligne de Commande

#### Étape 1 : Configuration Environnement

```bash
# Copier le fichier de configuration
cp .env.example .env.docker

# Éditer .env.docker et configurer les variables
# (optionnel : les valeurs par défaut fonctionnent)
```

#### Étape 2 : Démarrage

```bash
# Mode développement (avec hot-reload)
make dev

# OU mode production
make build
make up
```

#### Étape 3 : Initialisation Base de Données

```bash
# Appliquer les migrations
make migrate

# Créer un superutilisateur
make superuser
```

---

## Accès aux Services

| Service | URL | Description |
|---------|-----|-------------|
| **Application** | http://localhost | Interface principale |
| **API Swagger** | http://localhost/api/docs/ | Documentation API interactive |
| **Django Admin** | http://localhost/admin/ | Administration Django |
| **PgAdmin** | http://localhost:5050 | Gestion PostgreSQL |
| **Flower** | http://localhost:5555 | Monitoring Celery |
| **MinIO Console** | http://localhost:9001 | Stockage objets |

### Identifiants par Défaut

**Django Admin / Application :**
- Email : (à créer avec `make superuser`)
- Mot de passe : (à créer)

**PgAdmin :**
- Email : voir `.env.docker` (PGADMIN_DEFAULT_EMAIL)
- Mot de passe : voir `.env.docker` (PGADMIN_DEFAULT_PASSWORD)

**MinIO Console :**
- Access Key : voir `.env.docker` (MINIO_ROOT_USER)
- Secret Key : voir `.env.docker` (MINIO_ROOT_PASSWORD)

**Flower (Celery) :**
- Username : voir `.env.docker` (FLOWER_USER)
- Password : voir `.env.docker` (FLOWER_PASSWORD)

---

## Vérification du Démarrage

### 1. Vérifier les Conteneurs

```bash
docker-compose ps
```

**Résultat Attendu :**
```
NAME                STATUS              PORTS
backend             Up                  0.0.0.0:8000->8000/tcp
frontend            Up                  80/tcp
nginx               Up                  0.0.0.0:80->80/tcp, 0.0.0.0:443->443/tcp
postgres            Up (healthy)        0.0.0.0:5432->5432/tcp
redis               Up (healthy)        0.0.0.0:6379->6379/tcp
minio               Up (healthy)        0.0.0.0:9000-9001->9000-9001/tcp
celery_worker       Up
celery_beat         Up
```

### 2. Vérifier les Logs

```bash
# Tous les services
make logs

# Service spécifique
docker-compose logs -f backend
```

### 3. Tester l'API

```bash
# Healthcheck
curl http://localhost/api/health/

# Réponse attendue :
# {"status": "ok"}
```

---

## Commandes Utiles

### Gestion des Services

```bash
# Démarrer
make dev          # Mode développement avec hot-reload
make up           # Mode normal

# Arrêter
make down         # Arrête tous les services

# Redémarrer
docker-compose restart backend

# Reconstruire
make build        # Reconstruit toutes les images
```

### Base de Données

```bash
# Migrations
make migrate      # Créer et appliquer migrations

# Superutilisateur
make superuser    # Créer admin Django

# Shell Django
make shell        # Ouvrir shell interactif

# Réinitialiser DB (ATTENTION : perte de données)
docker-compose down -v
make up
make migrate
```

### Développement Frontend

```bash
# Accéder au conteneur frontend
docker-compose exec frontend sh

# Installer une dépendance npm
docker-compose exec frontend npm install <package>

# Rebuild frontend
docker-compose restart frontend
```

### Logs et Débogage

```bash
# Logs temps réel
make logs

# Logs des 100 dernières lignes
make logging

# Logs d'un service spécifique
docker-compose logs -f backend
docker-compose logs -f celery_worker
docker-compose logs -f redis
```

### Tests

```bash
# Tous les tests
make test

# Tests avec couverture
make coverage

# Tests d'un module spécifique
docker-compose exec backend pytest backend/camera/tests/
```

---

## Problèmes Courants

### ❌ Erreur : "Port already in use"

**Cause :** Un service utilise déjà le port 80, 5432, 6379, etc.

**Solution :**
```bash
# Arrêter les services en conflit
# Windows :
netstat -ano | findstr :80
taskkill /PID <PID> /F

# Linux/macOS :
sudo lsof -i :80
sudo kill -9 <PID>

# OU modifier les ports dans docker-compose.yml
```

### ❌ Erreur : "Cannot connect to Docker daemon"

**Cause :** Docker Desktop n'est pas démarré

**Solution :**
- Démarrer Docker Desktop
- Attendre que le statut passe à "Running"
- Réessayer

### ❌ Erreur : "Database connection refused"

**Cause :** PostgreSQL n'est pas prêt

**Solution :**
```bash
# Attendre que le healthcheck passe
docker-compose ps postgres

# Vérifier les logs
docker-compose logs postgres

# Redémarrer si nécessaire
docker-compose restart postgres
```

### ❌ Erreur : "Module not found" (Backend)

**Cause :** Dépendances Python manquantes

**Solution :**
```bash
# Reconstruire l'image backend
docker-compose build backend

# Redémarrer
docker-compose restart backend
```

### ❌ Erreur : "ENOENT" (Frontend)

**Cause :** Dépendances npm manquantes

**Solution :**
```bash
# Reconstruire l'image frontend
docker-compose build frontend

# OU installer manuellement
docker-compose exec frontend npm install
docker-compose restart frontend
```

### ❌ Erreur : "Camera not found"

**Cause :** Caméra physique non connectée ou index incorrect

**Solution :**
```bash
# Modifier l'index de la caméra dans .env.docker
VIDEO_DEVICE=/dev/video0  # Linux
# OU utiliser une vidéo de test
```

---

## Arrêt de l'Application

### Arrêt Simple (Conservation des Données)

```bash
make down
```

### Arrêt Complet (Suppression Volumes)

⚠️ **ATTENTION : Perte de toutes les données**

```bash
docker-compose down -v
```

---

## Mode Production vs Développement

### Mode Développement (Recommandé pour Tests)

**Avantages :**
- Hot-reload (modifications code en direct)
- Logs verbeux
- Debug activé
- Profiling activé

**Commande :**
```bash
make dev
```

**Configuration :** `.env.docker` avec `DJANGO_DEBUG=True`

### Mode Production

**Avantages :**
- Performance optimisée
- Sécurité renforcée
- Logs structurés
- Assets minifiés

**Commande :**
```bash
make build
make up
```

**Configuration :** `.env.docker` avec `DJANGO_DEBUG=False`

---

## Monitoring en Temps Réel

### Dashboard Grafana (Optionnel)

```bash
# Démarrer avec monitoring
docker-compose -f docker-compose.yml -f docker-compose.monitoring.yml up -d

# Accéder à Grafana
# URL : http://localhost:3000
# Username : admin
# Password : admin (à changer au premier accès)
```

### Métriques Disponibles

- **Latence API** : Temps de réponse endpoints REST
- **Latence WebSocket** : Délai diffusion frames
- **Taux Cache YOLO** : Hit rate Redis
- **CPU/RAM** : Utilisation par conteneur
- **Détections** : Nombre par heure/jour

---

## Workflow de Développement

### 1. Démarrage Journalier

```bash
# Démarrer l'application
make dev

# Vérifier que tout fonctionne
make logs

# Ouvrir l'application dans le navigateur
# http://localhost
```

### 2. Modification du Code

**Backend (Django) :**
- Modifier le code dans `backend/`
- Sauvegarder → Hot-reload automatique
- Vérifier logs : `docker-compose logs -f backend`

**Frontend (React) :**
- Modifier le code dans `frontend/src/`
- Sauvegarder → Hot-reload automatique (Vite)
- Vérifier dans le navigateur

### 3. Tests

```bash
# Avant chaque commit
make test

# Vérifier couverture
make coverage
```

### 4. Arrêt

```bash
# Fin de journée
make down
```

---

## Première Utilisation : Scénario Complet

### 1. Installation et Démarrage

```bash
# 1. Copier configuration
cp .env.example .env.docker

# 2. Démarrer en mode dev
make dev

# Attendre 2-3 minutes que tous les services démarrent
```

### 2. Initialisation

```bash
# 3. Créer superutilisateur maintenancier
make superuser
# Email : admin@example.com
# NIN : 1234567890
# Nom : Admin
# Prénom : System
# Password : (choisir un mot de passe fort)
```

### 3. Connexion et Test

```bash
# 4. Ouvrir navigateur
# http://localhost

# 5. Se connecter avec le superutilisateur
# Email : admin@example.com
# Password : (mot de passe choisi)

# 6. Créer un agent agricole
# Dashboard Maintenancier → Gestion Agents → Créer
# Email : agent@example.com
# NIN : 9876543210
# Nom/Prénom : (au choix)
```

### 4. Test Surveillance

```bash
# 7. Se déconnecter et se reconnecter comme agent
# Email : agent@example.com
# Password : 9876543210 (NIN)

# 8. Changer mot de passe obligatoire
# Nouveau password : (choisir)

# 9. Accéder Dashboard Agent → Surveillance
# Cliquer sur une caméra pour ouvrir le flux WebSocket
```

---

## Support

### Documentation
- `README.md` : Vue d'ensemble du projet
- `CLAUDE.md` : Architecture technique
- `SPECIFICATIONS_FONCTIONNELLES.md` : Règles de gestion
- `REFACTORING_GUIDE.md` : Principes Clean Code

### Contact
- Issues GitHub : [Créer un ticket]
- Email : support@projet.com

---

## Checklist de Vérification

Avant de commencer le développement, vérifier que :

- [ ] Docker Desktop est démarré et fonctionne
- [ ] `docker-compose ps` affiche tous les services "Up"
- [ ] http://localhost affiche l'interface de connexion
- [ ] http://localhost/api/docs/ affiche Swagger
- [ ] Superutilisateur créé avec `make superuser`
- [ ] Connexion réussie au dashboard
- [ ] Logs sans erreurs critiques (`make logs`)

**Si tout est ✅, vous êtes prêt à développer !**

---

**Version :** 1.0  
**Date :** 2026-05-07  
**Auteur :** Équipe Projet Alamine Bouba
