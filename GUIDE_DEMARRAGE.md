# Guide de Démarrage - Surveillance Agricole

## 🎯 Deux Modes Disponibles

### Mode Développement (RECOMMANDÉ pour démo/développement)

**Avantages:**
- ✅ Accès direct aux services (pas de problème nginx)
- ✅ Hot Module Replacement (HMR) actif
- ✅ Rechargement automatique du code
- ✅ Logs en temps réel
- ✅ Plus rapide et plus stable

**Utilisation:**
```batch
start-dev.bat
```

**Accès:**
- Frontend: http://localhost:3000
- Backend: http://localhost:8000
- Django Admin: http://localhost:8000/admin/
- API Docs: http://localhost:8000/api/docs/

---

### Mode Production (avec Nginx)

**Avantages:**
- ✅ URL propre sans port (http://localhost)
- ✅ Architecture production
- ✅ Reverse proxy nginx
- ✅ Optimisations (gzip, cache)

**Utilisation:**
```batch
start-prod.bat
```

**Accès:**
- Application complète: http://localhost

---

## 🚀 Démarrage Rapide

### 1. Première Installation

```batch
# Copier le fichier d'environnement
copy .env.example .env

# Mode développement
start-dev.bat
```

### 2. Créer un Superutilisateur

```batch
docker-compose exec backend python manage.py createsuperuser
```

Suivez les instructions et créez un compte maintenancier.

### 3. Accéder à l'Application

**Mode Dev:**
- Ouvrir http://localhost:3000
- Cliquer sur "Se Connecter"
- Utiliser les identifiants créés

**Mode Prod:**
- Ouvrir http://localhost
- Cliquer sur "Se Connecter"

---

## 👤 Rôles Utilisateurs

### Maintenancier

**Accès après connexion:**
- Dashboard avec statistiques globales
- Gestion des agents agricoles
- Rendez-vous d'installation
- Administration système

**Fonctionnalités:**
- Créer/modifier/supprimer des agents
- Planifier des installations
- Supervision globale
- Accès Django Admin

### Agent Agricole

**Accès après connexion:**
- Dashboard personnel
- Surveillance en temps réel
- Détections et alertes
- Rapports d'activité

**Fonctionnalités:**
- Visualiser les flux caméra
- Recevoir des alertes
- Générer des rapports
- Gérer son périmètre

---

## 🔧 Commandes Utiles

### Services Docker

```batch
# Voir l'état des services
docker-compose ps

# Voir les logs
docker-compose logs -f

# Voir les logs d'un service spécifique
docker-compose logs -f frontend
docker-compose logs -f backend
docker-compose logs -f nginx

# Arrêter tous les services
docker-compose down

# Rebuild complet
docker-compose down -v
docker-compose build --no-cache
docker-compose up -d
```

### Backend Django

```batch
# Shell Django
docker-compose exec backend python manage.py shell

# Créer des migrations
docker-compose exec backend python manage.py makemigrations

# Appliquer les migrations
docker-compose exec backend python manage.py migrate

# Collecter les fichiers statiques
docker-compose exec backend python manage.py collectstatic --noinput

# Créer un superutilisateur
docker-compose exec backend python manage.py createsuperuser
```

### Frontend React

```batch
# Entrer dans le conteneur frontend
docker-compose exec frontend sh

# Installer des dépendances
docker-compose exec frontend npm install <package>

# Rebuild frontend
docker-compose restart frontend
```

---

## 🐛 Dépannage

### Frontend inaccessible

**Symptôme:** "Connection refused" sur port 3000

**Solution:**
```batch
# Vérifier que le port est exposé
docker-compose ps frontend

# Redémarrer le frontend
docker-compose restart frontend

# Vérifier les logs
docker-compose logs frontend
```

### Erreur 502 Bad Gateway (mode prod)

**Symptôme:** Page d'erreur nginx

**Solutions:**

1. Vérifier que nginx utilise le bon mode:
```batch
docker-compose logs nginx | findstr "NGINX_MODE"
```

2. Forcer le rebuild nginx:
```batch
docker-compose stop nginx
docker-compose rm -f nginx
docker-compose build --no-cache nginx
docker-compose up -d nginx
```

3. Utiliser le mode dev à la place (plus stable):
```batch
start-dev.bat
```

### Backend ne démarre pas

**Symptôme:** Erreurs dans `docker-compose logs backend`

**Solutions:**

1. Vérifier la base de données:
```batch
docker-compose ps db
```

2. Recréer les migrations:
```batch
docker-compose exec backend python manage.py migrate
```

3. Rebuild backend:
```batch
docker-compose stop backend
docker-compose build --no-cache backend
docker-compose up -d backend
```

### Login ne redirige pas vers dashboard

**Symptôme:** Connexion réussie mais pas de redirection

**Solutions:**

1. Vérifier que l'utilisateur a le bon rôle:
```batch
docker-compose exec backend python manage.py shell
>>> from users.models import CustomUser
>>> user = CustomUser.objects.get(email='votre@email.com')
>>> print(user.role)
>>> user.role = 'maintenancier'  # ou 'agent_agricole'
>>> user.save()
```

2. Vider le cache du navigateur:
- Ctrl + Shift + Delete
- Cocher "Cookies" et "Cache"
- Cliquer "Effacer les données"

3. Vérifier les logs du frontend:
```batch
docker-compose logs frontend
```

---

## 📊 Architecture Technique

### Mode Développement (sans nginx)

```
┌─────────────────┐
│   Navigateur    │
└────────┬────────┘
         │
         ├──────────────────┐
         │                  │
         ▼                  ▼
┌─────────────────┐  ┌──────────────┐
│  Frontend:3000  │  │ Backend:8000 │
│  (Vite HMR)     │  │ (Django)     │
└─────────────────┘  └──────┬───────┘
                            │
                ┌───────────┼──────────┐
                ▼           ▼          ▼
           ┌────────┐  ┌──────┐  ┌────────┐
           │ Redis  │  │  DB  │  │ MinIO  │
           └────────┘  └──────┘  └────────┘
```

### Mode Production (avec nginx)

```
┌─────────────────┐
│   Navigateur    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Nginx:80      │
│  (Reverse Proxy)│
└────────┬────────┘
         │
         ├──────────────────┐
         │                  │
         ▼                  ▼
┌─────────────────┐  ┌──────────────┐
│  Frontend       │  │ Backend:8000 │
│  (Static Files) │  │ (Django)     │
└─────────────────┘  └──────┬───────┘
                            │
                ┌───────────┼──────────┐
                ▼           ▼          ▼
           ┌────────┐  ┌──────┐  ┌────────┐
           │ Redis  │  │  DB  │  │ MinIO  │
           └────────┘  └──────┘  └────────┘
```

---

## 🎓 Pour la Soutenance

### Recommandations

1. **Utiliser le mode développement** (plus stable)
   ```batch
   start-dev.bat
   ```

2. **Créer un compte maintenancier ET un compte agent** avant la démo

3. **Tester les fonctionnalités principales:**
   - ✅ Connexion maintenancier → Dashboard admin
   - ✅ Gestion agents (créer, modifier)
   - ✅ Connexion agent → Dashboard surveillance
   - ✅ Flux caméra en temps réel (si caméra disponible)
   - ✅ Détections et alertes

4. **Préparer les explications techniques:**
   - Architecture Django + React
   - YOLOv8 pour la détection
   - WebSocket pour temps réel
   - Docker Compose pour orchestration
   - RBAC (Role-Based Access Control)

### Démonstration Conseillée

1. **Page d'accueil** (http://localhost:3000)
   - Design professionnel
   - Présentation des fonctionnalités

2. **Connexion Maintenancier**
   - Dashboard admin
   - Gestion des agents
   - Rendez-vous d'installation

3. **Connexion Agent Agricole**
   - Dashboard surveillance
   - Flux caméra en temps réel
   - Détections et alertes

4. **Points techniques à souligner:**
   - Séparation des rôles (RBAC)
   - Temps réel (WebSocket)
   - IA embarquée (YOLOv8)
   - Architecture scalable (Docker)

---

## 📝 Checklist Avant Soutenance

- [ ] Services démarrés (docker-compose ps → tous "Up")
- [ ] Superutilisateur maintenancier créé
- [ ] Compte agent agricole créé
- [ ] Frontend accessible (http://localhost:3000 ou http://localhost)
- [ ] Backend accessible (http://localhost:8000/admin/)
- [ ] Connexion maintenancier testée
- [ ] Connexion agent testée
- [ ] Dashboard maintenancier fonctionnel
- [ ] Dashboard agent fonctionnel
- [ ] Logs propres (pas d'erreurs critiques)

---

## 📞 Support

En cas de problème persistant:

1. Vérifier les logs:
```batch
docker-compose logs -f
```

2. Reset complet:
```batch
docker-compose down -v
docker-compose build --no-cache
start-dev.bat
```

3. Consulter les fichiers de documentation:
- `CLAUDE.md` - Architecture technique
- `URGENCE_502.txt` - Solutions erreur 502
- `README.md` - Vue d'ensemble projet

---

**Date:** 2026-05-07  
**Version:** 2.0 - Guide Complet  
**Statut:** ✅ Production Ready
