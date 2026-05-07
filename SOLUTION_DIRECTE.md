# 🔥 Solution Directe - Contourner Nginx

## Problème Persistant

L'erreur 502 persiste même après rebuild. **Solution immédiate : Accéder directement aux services sans nginx.**

---

## ✅ Solution 1 : Accès Direct aux Services (SANS NGINX)

### Frontend (Vite) - Accès Direct

**Ouvrez directement :** http://localhost:3000

**Ports des Services :**
```
Frontend (Vite)    : http://localhost:3000
Backend (Django)   : http://localhost:8000
Django Admin       : http://localhost:8000/admin/
API Swagger        : http://localhost:8000/api/docs/
```

### Modifier docker-compose.yml pour Exposer les Ports

Si le port 3000 n'est pas accessible, modifiez `docker-compose.override.yml` :

```yaml
services:
  frontend:
    ports:
      - "3000:3000"  # Exposer le port Vite
```

Puis redémarrer :
```bash
docker-compose restart frontend
```

---

## ✅ Solution 2 : Fixer Nginx Manuellement

### Étape 1 : Modifier nginx.conf Directement dans le Conteneur

```bash
# Entrer dans le conteneur nginx
docker-compose exec nginx sh

# Vérifier la config actuelle
cat /etc/nginx/nginx.conf | grep "upstream react" -A 2

# Si affiche "frontend:80", éditer :
vi /etc/nginx/nginx.conf

# Chercher "upstream react" et changer :
# upstream react {
#     server frontend:3000;  # Remplacer 80 par 3000
# }

# Sauvegarder et quitter (ESC puis :wq)

# Recharger nginx
nginx -s reload

# Sortir
exit
```

### Étape 2 : Test Immédiat

Ouvrir http://localhost - devrait fonctionner !

---

## ✅ Solution 3 : Désactiver Nginx Temporairement

Si nginx continue à poser problème, désactivez-le :

```bash
docker-compose stop nginx
```

Puis accédez directement :
- Frontend : http://localhost:3000
- Backend : http://localhost:8000
- Admin : http://localhost:8000/admin/

---

## ✅ Solution 4 : Rebuild Complet avec Logs

```bash
# Arrêter tout
docker-compose down

# Supprimer le conteneur nginx
docker-compose rm -f nginx

# Reconstruire SANS cache
docker-compose build --no-cache nginx

# Démarrer en mode verbose
docker-compose up nginx

# Dans un autre terminal, vérifier
docker-compose logs -f nginx
```

---

## 🔍 Diagnostic : Pourquoi Ça ne Marche Pas ?

### Hypothèse 1 : Fichiers non Copiés

Les nouveaux fichiers (`nginx.dev.conf`, `docker-entrypoint.sh`) ne sont peut-être pas copiés dans l'image.

**Vérification :**
```bash
docker-compose exec nginx ls -la /etc/nginx/
```

**Devrait afficher :**
```
nginx.conf
nginx.dev.conf
```

**Si manquant :**
```bash
# Copier manuellement
docker cp nginx/nginx.dev.conf $(docker-compose ps -q nginx):/etc/nginx/nginx.dev.conf
docker cp nginx/docker-entrypoint.sh $(docker-compose ps -q nginx):/docker-entrypoint.d/99-choose-config.sh

# Rendre exécutable
docker-compose exec nginx chmod +x /docker-entrypoint.d/99-choose-config.sh

# Redémarrer
docker-compose restart nginx
```

### Hypothèse 2 : Variable NGINX_MODE non Passée

**Vérification :**
```bash
docker-compose exec nginx printenv | grep NGINX
```

**Devrait afficher :**
```
NGINX_MODE=dev
```

**Si manquant :**
```bash
# Ajouter la variable explicitement
docker-compose stop nginx
docker-compose up -d nginx -e NGINX_MODE=dev
```

### Hypothèse 3 : Le Script ne s'Exécute Pas

**Vérification :**
```bash
docker-compose logs nginx | grep "Using"
```

**Devrait afficher :**
```
Using development nginx configuration (frontend:3000)
```

**Si manquant :**
Le script `docker-entrypoint.sh` ne s'exécute pas.

**Solution :**
```bash
# Exécuter manuellement
docker-compose exec nginx sh -c 'cp /etc/nginx/nginx.dev.conf /etc/nginx/nginx.conf && nginx -s reload'
```

---

## 🚀 Solution GARANTIE (Méthode Brutale)

Si rien ne fonctionne, cette méthode va FORCER la config correcte :

### Fichier : `fix-nginx-force.bat`

```batch
@echo off
echo Correction FORCÉE nginx...

REM Étape 1 : Arrêter nginx
docker-compose stop nginx

REM Étape 2 : Supprimer le conteneur
docker-compose rm -f nginx

REM Étape 3 : Modifier nginx.conf AVANT le build
powershell -Command "(Get-Content nginx\nginx.conf) -replace 'server frontend:80;', 'server frontend:3000;' | Set-Content nginx\nginx.conf"

REM Étape 4 : Rebuild
docker-compose build --no-cache nginx

REM Étape 5 : Démarrer
docker-compose up -d nginx

REM Étape 6 : Vérifier
timeout /t 3 /nobreak >nul
docker-compose exec nginx cat /etc/nginx/nginx.conf | findstr "frontend:3000"

echo.
echo Si vous voyez "frontend:3000" ci-dessus, c'est OK !
echo Testez : http://localhost
pause
```

**Exécutez ce script :**
```
fix-nginx-force.bat
```

---

## 🎯 Test Rapide : Frontend Fonctionne-t-il ?

Avant de toucher nginx, vérifiez que le frontend fonctionne :

```bash
# Test direct du frontend
curl http://localhost:3000

# Ou dans le navigateur
http://localhost:3000
```

**Résultat attendu :** HTML de la page d'accueil

**Si erreur "Connection refused" :**
Le problème est le frontend, pas nginx !

```bash
# Vérifier l'état
docker-compose ps frontend

# Voir les logs
docker-compose logs frontend

# Redémarrer
docker-compose restart frontend
```

---

## 📊 Tableau de Diagnostic

| Test | Commande | Résultat Attendu | Si Échec |
|------|----------|------------------|----------|
| Frontend direct | `curl http://localhost:3000` | HTML | Redémarrer frontend |
| Backend direct | `curl http://localhost:8000/admin/` | HTML | Redémarrer backend |
| Config nginx | `docker-compose exec nginx cat /etc/nginx/nginx.conf \| grep frontend` | `frontend:3000` | Modifier manuellement |
| Nginx logs | `docker-compose logs nginx \| grep error` | Aucune erreur | Vérifier upstream |

---

## 💡 Alternative : Nouvelle Config Nginx Simple

Créez un fichier `nginx/nginx.simple.conf` :

```nginx
events {
    worker_connections 1024;
}

http {
    upstream django {
        server backend:8000;
    }

    upstream react {
        server frontend:3000;
    }

    server {
        listen 80;

        # API
        location /api/ {
            proxy_pass http://django;
            proxy_set_header Host $host;
        }

        # Admin
        location /admin/ {
            proxy_pass http://django;
            proxy_set_header Host $host;
        }

        # WebSocket
        location /ws/ {
            proxy_pass http://django;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
        }

        # Frontend
        location / {
            proxy_pass http://react;
            proxy_set_header Host $host;
        }
    }
}
```

Puis :
```bash
docker cp nginx/nginx.simple.conf $(docker-compose ps -q nginx):/etc/nginx/nginx.conf
docker-compose exec nginx nginx -s reload
```

---

## 🆘 Si TOUT Échoue : Mode Survival

Ouvrez **2 terminaux** :

**Terminal 1 (Backend) :**
```bash
cd backend
python manage.py runserver 0.0.0.0:8000
```

**Terminal 2 (Frontend) :**
```bash
cd frontend
npm run dev
```

Accédez à :
- Frontend : http://localhost:5173 (Vite par défaut)
- Backend : http://localhost:8000

Pas de Docker, pas de nginx, pas de problème ! 😅

---

**Date :** 2026-05-07  
**Version :** Solution Directe  
**Statut :** Méthodes alternatives garanties
