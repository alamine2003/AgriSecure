# 🐳 DÉPLOIEMENT DASHBOARD UNIFIÉ AVEC DOCKER

## 🎯 Objectif

Rebuilder l'image Docker frontend pour inclure le nouveau dashboard unifié et le rendre visible dans l'application déployée.

---

## ⚡ SOLUTION RAPIDE (3 minutes)

### Option A: Rebuild Complet (Recommandé)

```bash
# Arrêter les conteneurs
docker-compose down

# Rebuilder l'image frontend (forcer sans cache)
docker-compose build --no-cache frontend

# Relancer tous les services
docker-compose up -d

# Vérifier les logs
docker-compose logs -f frontend
```

**Temps:** ~3 minutes (selon connexion internet)

---

### Option B: Rebuild + Clean (Si problèmes)

```bash
# Arrêter tout
docker-compose down

# Supprimer l'ancienne image frontend
docker rmi alamine_bouba_project_v0-frontend

# Rebuilder sans cache
docker-compose build --no-cache frontend

# Relancer
docker-compose up -d
```

**Temps:** ~3-4 minutes

---

### Option C: Rebuild TOUT (Si gros problèmes)

```bash
# Arrêter tout
docker-compose down

# Supprimer toutes les images
docker-compose down --rmi all

# Rebuilder tout
docker-compose build --no-cache

# Relancer
docker-compose up -d
```

**Temps:** ~10 minutes (toutes les images)

---

## 📋 Étapes Détaillées

### 1. Vérifier les fichiers présents

```bash
# Vérifier que les nouveaux fichiers existent
ls frontend/src/pages/AgentDashboardUnified.jsx
ls frontend/src/components/ui/dialog.jsx
ls frontend/src/components/ui/textarea.jsx
```

**Vous devriez voir:**
```
frontend/src/pages/AgentDashboardUnified.jsx
frontend/src/components/ui/dialog.jsx
frontend/src/components/ui/textarea.jsx
```

**Si manquants:** Les fichiers n'ont pas été créés correctement.

---

### 2. Vérifier package.json

```bash
cat frontend/package.json | grep -E "(leaflet|react-dialog)"
```

**Vous devriez voir:**
```json
"@radix-ui/react-dialog": "^1.1.3",
"leaflet": "^1.9.4",
"react-leaflet": "^4.2.1",
```

**Si manquants:** Éditer `frontend/package.json` et les ajouter.

---

### 3. Arrêter les conteneurs

```bash
docker-compose down
```

**Vous devriez voir:**
```
[+] Running 10/10
 ✔ Container alamine_bouba_project_v0-nginx-1          Removed
 ✔ Container alamine_bouba_project_v0-frontend-1       Removed
 ✔ Container alamine_bouba_project_v0-backend-1        Removed
 ...
```

---

### 4. Rebuilder l'image frontend

```bash
docker-compose build --no-cache frontend
```

**Vous devriez voir:**
```
[+] Building XX.Xs (X/X) FINISHED
 => [internal] load build definition from Dockerfile
 => [internal] load .dockerignore
 => [build-stage 1/5] FROM docker.io/library/node:20-slim
 => [build-stage 2/5] WORKDIR /app
 => [build-stage 3/5] COPY package*.json ./
 => [build-stage 4/5] RUN npm install
 => [build-stage 5/5] COPY . .
 => [build-stage] RUN npm run build
 => [production-stage] COPY --from=build-stage /app/dist /usr/share/nginx/html
 => exporting to image
 => => naming to docker.io/library/alamine_bouba_project_v0-frontend
```

**Points clés:**
- ✅ `COPY . .` → Copie tous les nouveaux fichiers
- ✅ `RUN npm install` → Installe nouvelles dépendances
- ✅ `RUN npm run build` → Build avec Vite
- ✅ `exporting to image` → Image créée

**Durée:** 1-3 minutes selon machine/connexion

---

### 5. Relancer les services

```bash
docker-compose up -d
```

**Vous devriez voir:**
```
[+] Running 10/10
 ✔ Network alamine_bouba_project_v0_surveillance_net    Created
 ✔ Container alamine_bouba_project_v0-postgres-1        Started
 ✔ Container alamine_bouba_project_v0-redis-1           Started
 ✔ Container alamine_bouba_project_v0-minio-1           Started
 ✔ Container alamine_bouba_project_v0-backend-1         Started
 ✔ Container alamine_bouba_project_v0-frontend-1        Started
 ✔ Container alamine_bouba_project_v0-nginx-1           Started
 ...
```

---

### 6. Vérifier que frontend démarre

```bash
docker-compose logs -f frontend
```

**Vous devriez voir:**
```
frontend-1  | /docker-entrypoint.sh: Configuration complete; ready for start up
frontend-1  | 2026/05/07 10:30:00 [notice] 1#1: start worker process 29
```

**Appuyez Ctrl+C pour sortir**

---

### 7. Vérifier les conteneurs actifs

```bash
docker-compose ps
```

**Vous devriez voir:**
```
NAME                                    STATUS
alamine_bouba_project_v0-backend-1      Up 30 seconds
alamine_bouba_project_v0-frontend-1     Up 30 seconds
alamine_bouba_project_v0-nginx-1        Up 30 seconds
alamine_bouba_project_v0-postgres-1     Up 30 seconds (healthy)
alamine_bouba_project_v0-redis-1        Up 30 seconds (healthy)
...
```

**Tous doivent être "Up" ou "Up (healthy)"**

---

### 8. Tester dans le navigateur

1. **Ouvrir:** http://localhost/login
   *(Ou http://localhost:80/login)*

2. **Login** avec compte agent agricole

3. **Vérifier redirection** vers `/agent/dashboard`

4. **Vérifier nouveau dashboard:**
   - ✅ Header compact avec 2 boutons
   - ✅ 4 stats cards colorées
   - ✅ Section "Mes Périmètres" (grid 2 colonnes)
   - ✅ Section "Alertes" (colonne droite)
   - ✅ Section "Mes Caméras" (grid 2 colonnes)
   - ✅ Section "Détections" (colonne droite)

5. **Cliquer "Nouveau Périmètre":**
   - ✅ Dialog modale s'ouvre
   - ✅ Formulaire à gauche
   - ✅ Carte interactive à droite

6. **Dessiner polygone:**
   - ✅ Cliquer plusieurs fois sur carte
   - ✅ Points apparaissent
   - ✅ Surface calculée

7. **Enregistrer:**
   - ✅ Cliquer "Terminer" puis "Enregistrer"
   - ✅ Notification succès
   - ✅ Périmètre apparaît dans liste

---

## 🔍 Vérification Build

### Inspecter l'image frontend

```bash
# Lister les fichiers dans l'image
docker run --rm alamine_bouba_project_v0-frontend ls -la /usr/share/nginx/html/assets/

# Vérifier la taille de l'image
docker images | grep frontend
```

**Vous devriez voir des fichiers .js et .css:**
```
index-ABC123.js
index-XYZ789.css
```

---

### Vérifier les dépendances dans le build

```bash
# Voir les logs du build précédent
docker-compose logs frontend | grep "npm install"
```

**Vous devriez voir:**
```
added XXX packages, and audited YYY packages in ZZs
```

---

## 🚨 Problèmes Fréquents

### 1. Erreur "npm install" pendant le build

**Symptôme:**
```
ERROR [build-stage 4/5] RUN npm install
npm ERR! code ERESOLVE
```

**Solution:**
Modifier `frontend/Dockerfile` ligne 7:
```dockerfile
# Avant:
RUN npm install

# Après:
RUN npm install --legacy-peer-deps
```

Puis rebuilder:
```bash
docker-compose build --no-cache frontend
```

---

### 2. Frontend ne démarre pas

**Symptôme:**
```bash
docker-compose ps
# frontend: Exited (1)
```

**Diagnostic:**
```bash
docker-compose logs frontend
```

**Solution selon erreur:**
- "Port 80 already in use" → Un autre service utilise le port
- "Cannot find module" → Rebuild avec `--no-cache`
- "ENOENT" → Vérifier que les fichiers existent

---

### 3. Toujours l'ancien dashboard

**Causes possibles:**

**A) Cache navigateur**
```
Ctrl + Shift + R   (Windows/Linux)
Cmd + Shift + R    (Mac)
```

**B) Image pas rebuilée**
```bash
# Vérifier date de l'image
docker images | grep frontend

# Rebuilder si ancienne
docker-compose build --no-cache frontend
docker-compose up -d
```

**C) Mauvaise route**
```
# Vérifier que vous êtes sur:
http://localhost/agent/dashboard

# Pas sur:
http://localhost/agent/dashboard-old
```

---

### 4. Carte ne charge pas dans dialog

**Symptôme:** Dialog s'ouvre mais carte blanche ou erreur

**Cause:** Leaflet pas bundlé correctement

**Solution 1 - Vérifier package.json:**
```bash
cat frontend/package.json | grep leaflet
```

Devrait contenir:
```json
"leaflet": "^1.9.4",
"react-leaflet": "^4.2.1"
```

**Solution 2 - Rebuilder:**
```bash
docker-compose build --no-cache frontend
docker-compose up -d
```

**Solution 3 - Vérifier console navigateur:**
```
F12 → Console → Chercher erreurs
```

---

### 5. Build très lent

**Cause:** Téléchargement npm packages

**Solution - Utiliser cache npm:**

Modifier `frontend/Dockerfile`:

```dockerfile
# Après la ligne 6:
COPY package*.json ./
RUN npm install

# Ajouter:
RUN npm cache clean --force
```

Ou utiliser un registry npm local (optionnel).

---

## 📊 Comparaison Avant/Après

### Fichiers dans l'image

**Avant le rebuild:**
```bash
docker run --rm alamine_bouba_project_v0-frontend ls /usr/share/nginx/html/assets/ | wc -l
# ~20 fichiers
```

**Après le rebuild:**
```bash
docker run --rm alamine_bouba_project_v0-frontend ls /usr/share/nginx/html/assets/ | wc -l
# ~25 fichiers (nouveaux composants bundlés)
```

### Taille de l'image

```bash
docker images alamine_bouba_project_v0-frontend
```

**Avant:** ~150 MB  
**Après:** ~155 MB (+5 MB pour nouvelles dépendances)

---

## ✅ Checklist Validation Docker

### Build
- [ ] `docker-compose build --no-cache frontend` réussi
- [ ] Aucune erreur npm install
- [ ] Aucune erreur npm run build
- [ ] Image créée (docker images | grep frontend)

### Déploiement
- [ ] `docker-compose up -d` réussi
- [ ] Tous conteneurs "Up" (docker-compose ps)
- [ ] Frontend logs OK (docker-compose logs frontend)
- [ ] Nginx logs OK (docker-compose logs nginx)

### Fonctionnel
- [ ] http://localhost charge
- [ ] Login fonctionne
- [ ] Redirect vers /agent/dashboard
- [ ] Nouveau dashboard visible
- [ ] 4 stats cards affichées
- [ ] Section Périmètres visible
- [ ] Bouton "Nouveau Périmètre" visible
- [ ] Dialog s'ouvre au clic
- [ ] Carte charge dans dialog
- [ ] Dessiner polygone fonctionne
- [ ] Enregistrer fonctionne

**Si TOUT coché:**  
→ ✅ **DÉPLOIEMENT DOCKER RÉUSSI!**

---

## 🎯 Script Complet (Copy-Paste)

```bash
#!/bin/bash

echo "========================================="
echo "  REBUILD FRONTEND AVEC NOUVEAU DASHBOARD"
echo "========================================="
echo ""

echo "[1/5] Arrêt des conteneurs..."
docker-compose down

echo ""
echo "[2/5] Suppression ancienne image frontend..."
docker rmi alamine_bouba_project_v0-frontend 2>/dev/null || true

echo ""
echo "[3/5] Rebuild image frontend (sans cache)..."
docker-compose build --no-cache frontend

if [ $? -ne 0 ]; then
    echo ""
    echo "ERREUR: Build failed"
    exit 1
fi

echo ""
echo "[4/5] Relance des services..."
docker-compose up -d

if [ $? -ne 0 ]; then
    echo ""
    echo "ERREUR: Démarrage failed"
    exit 1
fi

echo ""
echo "[5/5] Vérification des conteneurs..."
sleep 5
docker-compose ps

echo ""
echo "========================================="
echo "  DÉPLOIEMENT TERMINÉ"
echo "========================================="
echo ""
echo "Ouvrir dans le navigateur:"
echo "  http://localhost/login"
echo ""
echo "Login agent → Dashboard → Nouveau Périmètre"
echo ""
echo "Si problème:"
echo "  docker-compose logs frontend"
echo "  docker-compose logs nginx"
echo ""
```

**Enregistrer sous:** `rebuild-frontend.sh`

**Rendre exécutable:**
```bash
chmod +x rebuild-frontend.sh
./rebuild-frontend.sh
```

---

## 🎓 Pour la Soutenance

### Démonstration Docker

**Scénario:**
1. "Notre application est déployée avec Docker"
2. "Je montre comment déployer les changements"
3. Exécuter: `docker-compose build frontend`
4. "L'image est rebuilée avec les nouveaux composants"
5. Exécuter: `docker-compose up -d`
6. "Les services redémarrent avec la nouvelle version"
7. Ouvrir navigateur: "Et voici le nouveau dashboard en production"

**Temps:** 1 minute (en ayant pré-build l'image)

---

## 📝 Résumé - 3 Commandes

```bash
docker-compose down
docker-compose build --no-cache frontend
docker-compose up -d
```

**C'est tout!**

---

**Version:** Guide Docker v1.0  
**Date:** 2026-05-07  
**Temps:** 3-5 minutes

🐳 **Nouveau dashboard déployé avec Docker!**
