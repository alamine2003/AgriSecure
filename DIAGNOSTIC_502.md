# 🔍 Diagnostic Erreur 502 - Cause Identifiée

## ✅ Problème Identifié

D'après vos logs, le problème est **clair** :

```
nginx-1  | 2026/05/07 14:37:35 [error] 30#30: *16 connect() failed (111: Connection refused) 
while connecting to upstream, client: 172.18.0.1, server: localhost, 
request: "GET / HTTP/1.1", upstream: "http://172.18.0.5:80/", host: "localhost"
```

**Explication :**
- ✅ **Backend fonctionne** : Daphne écoute sur port 8000
- ✅ **Frontend fonctionne** : Vite écoute sur port **3000** (mode dev)
- ❌ **Nginx cherche le port 80** : `upstream: "http://172.18.0.5:80/"`

**Cause Racine :**
En mode développement, le frontend utilise **Vite sur le port 3000**, mais nginx est configuré pour chercher le frontend sur le **port 80** (mode production).

---

## 🔧 Solution Appliquée

### Fichiers Modifiés :

1. **`nginx/nginx.conf`** : Port upstream changé de 80 → 3000
2. **`nginx/nginx.dev.conf`** (NOUVEAU) : Config spéciale dev avec support HMR
3. **`nginx/Dockerfile`** : Support multi-config (dev/prod)
4. **`nginx/docker-entrypoint.sh`** (NOUVEAU) : Script de sélection auto
5. **`docker-compose.override.yml`** : Variable `NGINX_MODE=dev`

---

## 🚀 Pour Appliquer la Correction

### **Option 1 : Script Rapide** ⭐ (30 secondes)

Double-cliquez sur :
```
fix-502-quick.bat
```

Ce script va :
1. Arrêter nginx
2. Reconstruire nginx avec la nouvelle config
3. Redémarrer nginx
4. Vérifier l'état

### **Option 2 : Commandes Manuelles**

```bash
# Arrêter nginx
docker-compose stop nginx

# Reconstruire nginx
docker-compose build nginx

# Redémarrer nginx
docker-compose up -d nginx

# Vérifier
docker-compose ps nginx
docker-compose logs nginx
```

---

## ✅ Validation de la Correction

### Test 1 : Vérifier les Logs Nginx

```bash
docker-compose logs nginx --tail=10
```

**Résultat Attendu :**
```
nginx-1  | Using development nginx configuration (frontend:3000)
nginx-1  | Nginx upstream configuration:
nginx-1  |     upstream react {
nginx-1  |         server frontend:3000;
```

✅ Si vous voyez **"frontend:3000"** → C'est bon !
❌ Si vous voyez **"frontend:80"** → Relancer le rebuild

### Test 2 : Ouvrir l'Application

Ouvrez votre navigateur sur :

**✅ http://localhost**

**Résultat Attendu :**
- Page d'accueil moderne avec design vert
- Hero section "Protégez Vos Exploitations"
- 6 cartes de fonctionnalités
- Footer professionnel

**❌ Si erreur 502 :**
```bash
# Vérifier que frontend tourne bien
docker-compose ps frontend

# Devrait afficher : Up
```

### Test 3 : API et Admin

**✅ http://localhost/admin/**

**Résultat Attendu :**
- Page de login Django Admin (déjà fonctionne d'après vos logs)

**✅ http://localhost/api/docs/**

**Résultat Attendu :**
- Page Swagger UI

---

## 📊 Comparaison Avant/Après

### AVANT (Erreur 502)

```nginx
upstream react {
    server frontend:80;  # ❌ Port production
}
```

**Logs :**
```
connect() failed (111: Connection refused) while connecting to upstream
upstream: "http://172.18.0.5:80/"
```

### APRÈS (Correction)

```nginx
upstream react {
    server frontend:3000;  # ✅ Port développement (Vite)
}
```

**Logs Attendus :**
```
HTTP/1.1 200 OK (page d'accueil chargée)
```

---

## 🔍 Diagnostic Complet (Si Problème Persiste)

### Vérification 1 : État des Conteneurs

```bash
docker-compose ps
```

**Tous doivent être "Up" :**
- ✅ backend : Up
- ✅ frontend : Up
- ✅ nginx : Up
- ✅ postgres : Up (healthy)
- ✅ redis : Up (healthy)

### Vérification 2 : Port Frontend

```bash
docker-compose logs frontend | grep "Local:"
```

**Résultat Attendu :**
```
➜  Local:   http://localhost:3000/
➜  Network: http://172.18.0.5:3000/
```

✅ Si port 3000 → OK
❌ Si port différent → Problème config Vite

### Vérification 3 : Connexion Nginx → Frontend

```bash
# Entrer dans le conteneur nginx
docker-compose exec nginx sh

# Tester la connexion au frontend
wget -O- http://frontend:3000/

# Résultat attendu : HTML de la page d'accueil
```

✅ Si HTML retourné → Connexion OK
❌ Si erreur → Problème réseau Docker

### Vérification 4 : Configuration Nginx Active

```bash
docker-compose exec nginx cat /etc/nginx/nginx.conf | grep "upstream react" -A 2
```

**Résultat Attendu :**
```nginx
upstream react {
    server frontend:3000;  # Port Vite en dev
}
```

---

## 🐛 Problèmes Courants et Solutions

### Problème 1 : Nginx ne Reconstruit Pas

**Symptôme :** Toujours erreur 502 après rebuild

**Solution :**
```bash
# Forcer reconstruction sans cache
docker-compose build --no-cache nginx

# Supprimer l'ancien conteneur
docker-compose rm -f nginx

# Recréer
docker-compose up -d nginx
```

### Problème 2 : Frontend ne Démarre Pas

**Symptôme :** `docker-compose ps frontend` → Exit

**Solution :**
```bash
# Voir les logs
docker-compose logs frontend

# Problème courant : node_modules manquants
docker-compose exec frontend npm install

# Redémarrer
docker-compose restart frontend
```

### Problème 3 : Port 3000 Déjà Utilisé

**Symptôme :** Frontend ne peut pas écouter sur 3000

**Solution :**
```bash
# Windows : Trouver le processus
netstat -ano | findstr :3000

# Tuer le processus (remplacer PID)
taskkill /PID <PID> /F

# Redémarrer frontend
docker-compose restart frontend
```

### Problème 4 : Script docker-entrypoint.sh non Exécutable

**Symptôme :** Nginx ne démarre pas, erreur permission

**Solution :**
```bash
# Rendre le script exécutable
chmod +x nginx/docker-entrypoint.sh

# Rebuild
docker-compose build nginx
docker-compose up -d nginx
```

---

## 📝 Checklist de Validation Finale

Après avoir exécuté `fix-502-quick.bat`, vérifiez :

- [ ] `docker-compose ps` → Tous "Up"
- [ ] `docker-compose logs nginx` → "Using development nginx configuration"
- [ ] `docker-compose logs nginx` → "server frontend:3000"
- [ ] http://localhost → Page d'accueil s'affiche ✅
- [ ] http://localhost/login → Formulaire connexion ✅
- [ ] http://localhost/admin/ → Django admin ✅
- [ ] http://localhost/api/docs/ → Swagger UI ✅
- [ ] Aucune erreur 502 ✅

---

## 🎓 Explication Technique

### Mode Développement vs Production

**Mode Développement (Vite) :**
- Frontend : `npm run dev` → Port 3000
- Hot Module Replacement (HMR) actif
- Build non nécessaire
- Rechargement automatique du code

**Mode Production (Nginx) :**
- Frontend : Build statique → Port 80
- Fichiers optimisés et minifiés
- Pas de HMR
- Performance maximale

### Configuration Nginx Adaptative

```bash
# docker-entrypoint.sh détecte l'environnement
if [ "$NGINX_MODE" = "dev" ]; then
    # Utilise nginx.dev.conf (port 3000)
    cp /etc/nginx/nginx.dev.conf /etc/nginx/nginx.conf
else
    # Utilise nginx.conf (port 80)
    # Déjà en place
fi
```

### Support HMR dans nginx.dev.conf

```nginx
# Support Vite HMR (Hot Module Replacement)
proxy_set_header Upgrade $http_upgrade;
proxy_set_header Connection "upgrade";

# Désactiver buffering pour HMR
proxy_buffering off;
```

Sans ces headers, Vite HMR ne fonctionnerait pas à travers nginx.

---

## 🆘 Si Tout Échoue

### Reset Complet (Dernière Option)

```bash
# ATTENTION : Supprime TOUTES les données !
docker-compose down -v

# Reconstruire tout
docker-compose build --no-cache

# Redémarrer
docker-compose up -d

# Attendre 2-3 minutes
timeout /t 180 /nobreak

# Vérifier
docker-compose ps
```

---

## 📞 Support

**Fichiers de Référence :**
- `RESOLUTION_502.md` → Guide complet original
- `DIAGNOSTIC_502.md` → Ce fichier (cause identifiée)
- `fix-502-quick.bat` → Script correction rapide
- `CHANGEMENTS_APPLIQUES.md` → Résumé des modifications

**Logs Utiles :**
```bash
docker-compose logs nginx --tail=50
docker-compose logs frontend --tail=50
docker-compose logs backend --tail=50
```

---

**Date :** 2026-05-07  
**Version :** 1.1 (Correction port frontend)  
**Auteur :** Équipe Projet Alamine Bouba  
**Statut :** ✅ **Solution identifiée et appliquée**

---

## 🚀 Action Immédiate

**➡️ EXÉCUTEZ MAINTENANT :**

```
fix-502-quick.bat
```

**Puis ouvrez :** http://localhost

**Vous devriez voir :** La magnifique page d'accueil ! 🎉

Si ça fonctionne, vous pourrez ensuite tester :
- Connexion sur `/login`
- Dashboard sur `/dashboard` (après connexion)
- API Swagger sur `/api/docs/`
