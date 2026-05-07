# 📦 INSTALLATION DES DÉPENDANCES MANQUANTES

## 🚨 PROBLÈME IDENTIFIÉ

**Leaflet et React-Leaflet ne sont pas installés!**

C'est pour ça que vous ne voyez pas les changements. Les composants de carte ont besoin de ces packages npm.

---

## ⚡ SOLUTION (3 minutes)

### Étape 1: Ouvrir terminal dans le dossier frontend

**Windows CMD:**
```cmd
cd "C:\Users\7MAKSACOD PC\Downloads\dossiers soutenance\Alamine_Bouba_Project_v0\frontend"
```

**Windows PowerShell:**
```powershell
cd "C:\Users\7MAKSACOD PC\Downloads\dossiers soutenance\Alamine_Bouba_Project_v0\frontend"
```

**Git Bash:**
```bash
cd "/c/Users/7MAKSACOD PC/Downloads/dossiers soutenance/Alamine_Bouba_Project_v0/frontend"
```

---

### Étape 2: Installer les dépendances

```bash
npm install
```

**Attendez voir:**
```
added 2 packages, and audited XXX packages in XXs
```

**Packages installés:**
- ✅ `leaflet@^1.9.4` - Bibliothèque de cartes
- ✅ `react-leaflet@^4.2.1` - Intégration React pour Leaflet

---

### Étape 3: Redémarrer le serveur frontend

**Si le serveur est déjà lancé, arrêtez-le d'abord:**
```
Ctrl + C
```

**Puis relancez:**
```bash
npm run dev
```

**Vous devriez voir:**
```
  VITE v5.x.x  ready in XXX ms

  ➜  Local:   http://localhost:3000/
  ➜  Network: use --host to expose
```

---

### Étape 4: Vider le cache du navigateur

**Chrome/Edge/Brave:**
```
Ctrl + Shift + R
```

**Firefox:**
```
Ctrl + F5
```

**Safari (Mac):**
```
Cmd + Option + R
```

---

### Étape 5: Vérifier que ça fonctionne

1. Ouvrir http://localhost:3000
2. Login avec compte agent
3. Aller sur `/agent/perimeter`
4. **Vous devriez voir:**
   - ✅ Header "Gestion des Périmètres Agricoles"
   - ✅ 3 cards de stats
   - ✅ Bouton "Nouveau Périmètre" (vert)
   - ✅ Liste vide avec message

5. Cliquer "Nouveau Périmètre"
6. **Vous devriez voir:**
   - ✅ **Carte interactive Leaflet** (OpenStreetMap)
   - ✅ Toolbar avec boutons Zoom+, Zoom-, etc.
   - ✅ Message "Cliquez sur la carte pour ajouter des points"

---

## 🔍 VÉRIFICATION

### A. Vérifier installation

Dans le terminal frontend:
```bash
npm list leaflet react-leaflet
```

**Vous devriez voir:**
```
surveillance-frontend@0.0.0
├── leaflet@1.9.4
└── react-leaflet@4.2.1
```

---

### B. Vérifier console navigateur

1. Ouvrir http://localhost:3000/agent/perimeter
2. Appuyer **F12** (DevTools)
3. Onglet **Console**
4. **Rechercher erreurs:**

**✅ Bon signe (aucune erreur rouge):**
```
No errors
```

**❌ Mauvais signe:**
```
Cannot find module 'leaflet'
Cannot find module 'react-leaflet'
```
→ Réinstaller avec `npm install`

---

## 🎯 SCRIPT AUTOMATIQUE (OPTION FACILE)

**Double-cliquez sur:**
```
install-leaflet.bat
```

Il va:
1. ✅ Aller dans dossier frontend
2. ✅ Installer leaflet et react-leaflet
3. ✅ Afficher instructions redémarrage

---

## 📝 POURQUOI C'EST NÉCESSAIRE?

### Avant (problème)

Le composant `field-map-drawer.jsx` chargeait Leaflet **dynamiquement via CDN**:
```javascript
<link rel="stylesheet" href="https://unpkg.com/leaflet/dist/leaflet.css" />
<script src="https://unpkg.com/leaflet/dist/leaflet.js"></script>
```

**Problèmes:**
- ⚠️ Nécessite connexion internet
- ⚠️ Chargement lent
- ⚠️ Peut échouer silencieusement
- ⚠️ Pas de typage TypeScript
- ⚠️ Conflits de versions

### Après (solution)

Leaflet installé via **npm** et importé directement:
```javascript
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
```

**Avantages:**
- ✅ Fonctionne hors ligne
- ✅ Chargement instantané
- ✅ Erreurs explicites si problème
- ✅ Version fixée (pas de surprise)
- ✅ Intégré dans le bundle Vite

---

## 🚨 SI ÇA NE MARCHE TOUJOURS PAS

### Solution 1: Supprimer node_modules et réinstaller

```bash
cd frontend
rm -rf node_modules
rm package-lock.json
npm install
```

Ou sur Windows CMD:
```cmd
cd frontend
rmdir /s /q node_modules
del package-lock.json
npm install
```

---

### Solution 2: Vérifier version de Node.js

```bash
node --version
```

**Requis:** Node.js >= 18.x

**Si inférieur:**
- Télécharger Node.js LTS sur https://nodejs.org
- Installer nouvelle version
- Réessayer `npm install`

---

### Solution 3: Vérifier npm registry

Parfois npm a des problèmes de connexion:

```bash
npm config get registry
```

**Devrait afficher:**
```
https://registry.npmjs.org/
```

**Si différent, réinitialiser:**
```bash
npm config set registry https://registry.npmjs.org/
npm install
```

---

### Solution 4: Installer manuellement les packages

```bash
npm install leaflet@1.9.4 --save
npm install react-leaflet@4.2.1 --save
```

---

## ✅ CHECKLIST FINALE

Avant de tester l'application, vérifiez:

- [ ] `package.json` contient `"leaflet": "^1.9.4"`
- [ ] `package.json` contient `"react-leaflet": "^4.2.1"`
- [ ] `npm install` exécuté sans erreur
- [ ] `node_modules/leaflet` existe
- [ ] `node_modules/react-leaflet` existe
- [ ] Serveur frontend redémarré
- [ ] Cache navigateur vidé
- [ ] Aucune erreur console (F12)

**Si TOUT coché:**
→ ✅ **Ça devrait fonctionner!**

---

## 💬 MESSAGE POUR L'UTILISATEUR

**J'ai identifié le problème:**

Les packages Leaflet n'étaient pas installés. J'ai:
1. ✅ Ajouté `leaflet` et `react-leaflet` dans `package.json`
2. ✅ Créé ce guide d'installation
3. ✅ Créé `install-leaflet.bat` pour automatiser

**Ce que VOUS devez faire maintenant:**

```bash
cd frontend
npm install
npm run dev
```

Puis ouvrir http://localhost:3000/agent/perimeter et vider le cache (Ctrl+Shift+R).

**La carte devrait apparaître!**

---

**Version:** Guide Installation v1  
**Date:** 2026-05-07  
**Durée estimée:** 3 minutes

🔧 **Suivez ces étapes et tout fonctionnera!**
