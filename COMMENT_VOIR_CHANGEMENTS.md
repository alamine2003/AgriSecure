# 🔍 COMMENT VOIR LES CHANGEMENTS

**Problème:** Vous ne voyez pas les nouvelles fonctionnalités  
**Cause:** Le serveur frontend utilise encore l'ancienne version en cache  
**Solution:** Redémarrer le serveur frontend

---

## ⚡ SOLUTION RAPIDE (2 minutes)

### Étape 1: Arrêter le serveur frontend

Dans le terminal où vous avez lancé `npm run dev`:

**Windows:**
```
Appuyer sur: Ctrl + C
Confirmer: Y (ou O si en français)
```

**Mac/Linux:**
```
Appuyer sur: Ctrl + C
```

Vous devriez voir:
```
^C
> Serveur arrêté
```

---

### Étape 2: Redémarrer le serveur

Dans le même terminal:

```bash
cd frontend
npm run dev
```

Attendez voir:
```
  VITE v5.x.x  ready in XXX ms

  ➜  Local:   http://localhost:3000/
  ➜  Network: use --host to expose
```

---

### Étape 3: Vider le cache du navigateur

**Chrome/Edge:**
1. Ouvrir http://localhost:3000
2. Appuyer sur **Ctrl + Shift + R** (Windows)
3. Ou **Ctrl + F5**
4. Ou clic droit → "Inspecter" → Onglet "Network" → Cocher "Disable cache"

**Firefox:**
1. Ouvrir http://localhost:3000
2. Appuyer sur **Ctrl + Shift + R**
3. Ou **Ctrl + F5**

**Safari (Mac):**
1. Ouvrir http://localhost:3000
2. Appuyer sur **Cmd + Option + R**

---

### Étape 4: Vérifier les changements

1. **Login** avec compte agent
2. **Aller sur Dashboard Agent** (`/agent/dashboard`)
3. **Chercher section "Périmètres"**
4. **Cliquer** sur "Définir Périmètre" ou "Gérer Périmètres"
5. **Vérifier URL:** doit être `/agent/perimeter`

**Si vous voyez une carte interactive avec:**
- ✅ Bouton "Nouveau Périmètre" (vert)
- ✅ Stats en haut (0 périmètre, 0 ha, 0 points)
- ✅ Liste vide avec message "Aucun périmètre"

**→ C'EST BON! L'intégration fonctionne!**

**Si vous voyez toujours l'ancienne version:**
→ Continuer ci-dessous

---

## 🔧 VÉRIFICATION FICHIERS

### Script de Vérification Automatique

Double-cliquez sur:
```
verifier-integration.bat
```

Il va vérifier:
- ✅ Présence tous les fichiers créés
- ✅ App.jsx modifié correctement
- ✅ Route configurée

---

## 🔍 VÉRIFICATION MANUELLE

### 1. Vérifier que les fichiers existent

**Ouvrir l'explorateur Windows, aller dans:**
```
frontend/src/components/ui/
```

**Vous devez voir:**
- ✅ `field-map-drawer.jsx` (nouveau)
- ✅ `map-selector.jsx` (nouveau)
- ✅ `commune-dropdown.jsx` (nouveau)
- ✅ `location-selector-advanced.jsx` (nouveau)

**Ensuite aller dans:**
```
frontend/src/pages/
```

**Vous devez voir:**
- ✅ `PerimeterDefinitionAdvanced.jsx` (nouveau)
- ✅ `PerimeterDefinition.jsx` (ancien, conservé)

---

### 2. Vérifier App.jsx

**Ouvrir avec éditeur de texte:**
```
frontend/src/App.jsx
```

**Chercher (Ctrl+F):** `PerimeterDefinitionAdvanced`

**Vous devez voir:**
```javascript
import PerimeterDefinitionAdvanced from './pages/PerimeterDefinitionAdvanced';
```

**Et plus bas:**
```javascript
<Route
  path="/agent/perimeter"
  element={
    <RequireRole role="agent_agricole">
      <PerimeterDefinitionAdvanced />
    </RequireRole>
  }
/>
```

**Si vous ne voyez PAS ça:**
→ Le fichier App.jsx n'a pas été modifié correctement

---

## 🚨 SI ÇA NE MARCHE TOUJOURS PAS

### Solution 1: Forcer le rebuild

```bash
# Arrêter serveur (Ctrl+C)
cd frontend

# Supprimer cache
rm -rf node_modules/.vite
rm -rf dist

# Redémarrer
npm run dev
```

---

### Solution 2: Vérifier console erreurs

1. Ouvrir http://localhost:3000
2. Appuyer **F12** (ouvrir DevTools)
3. Onglet **Console**
4. Chercher erreurs en rouge

**Erreurs fréquentes:**

**A) "Cannot find module './pages/PerimeterDefinitionAdvanced'"**
→ Le fichier n'existe pas au bon endroit
→ Vérifier: `frontend/src/pages/PerimeterDefinitionAdvanced.jsx`

**B) "Cannot find module './components/ui/field-map-drawer'"**
→ Le fichier n'existe pas au bon endroit
→ Vérifier: `frontend/src/components/ui/field-map-drawer.jsx`

**C) "Unexpected token" ou "Syntax error"**
→ Erreur de syntaxe dans un fichier
→ Copier l'erreur et me la montrer

---

### Solution 3: Accès direct URL

Essayez d'aller directement sur:
```
http://localhost:3000/agent/perimeter
```

**Si vous voyez:**
- ✅ **Page avec carte** → L'intégration fonctionne!
- ❌ **404 ou ancienne page** → Problème routing
- ❌ **Page blanche** → Erreur JavaScript (voir console)

---

## 📸 À QUOI ÇA DOIT RESSEMBLER

### Dashboard Agent (avant)

Vous devriez voir une section "Périmètres" avec:
- Nombre de périmètres
- Surface totale (ha)
- Bouton d'action

### Page Périmètres (nouvelle)

**URL:** `/agent/perimeter`

**En haut:**
```
┌─────────────────────────────────────────┐
│  🗺️  Gestion des Périmètres Agricoles   │
│                                         │
│  Dessinez et gérez vos parcelles...    │
└─────────────────────────────────────────┘
```

**Stats (3 cards):**
```
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ Périmètres   │ │ Surface      │ │ Points GPS   │
│    0         │ │   0.00 ha    │ │      0       │
└──────────────┘ └──────────────┘ └──────────────┘
```

**Liste:**
```
┌─────────────────────────────────────────┐
│                                         │
│    📍  Aucun périmètre                  │
│                                         │
│    Commencez par dessiner votre         │
│    premier périmètre agricole           │
│                                         │
│    [+ Créer un Périmètre]               │
│                                         │
└─────────────────────────────────────────┘
```

**Bouton en haut à droite:**
```
[+ Nouveau Périmètre]  (vert)
```

---

## ✅ CHECKLIST VISUELLE

Cochez ce que vous voyez:

**Sur http://localhost:3000/agent/perimeter**

- [ ] Header "Gestion des Périmètres Agricoles"
- [ ] 3 cards de stats en haut
- [ ] Bouton "Nouveau Périmètre" (vert)
- [ ] Message "Aucun périmètre" si vide
- [ ] Bouton "Dashboard" en haut à droite

**Si vous cliquez "Nouveau Périmètre":**

- [ ] Carte interactive apparaît
- [ ] Toolbar avec boutons (Zoom +, Zoom -, etc.)
- [ ] Message "Cliquez sur la carte pour ajouter des points"
- [ ] Panels info (Points, Surface, Localisation)

**Si TOUT est coché:**
→ ✅ **L'INTÉGRATION FONCTIONNE!**

**Si RIEN n'est coché:**
→ ❌ **Le serveur n'a pas été redémarré**

---

## 🎯 ACTIONS IMMÉDIATES

### Ce que VOUS devez faire:

1. ✅ **Arrêter serveur frontend** (Ctrl+C)
2. ✅ **Redémarrer serveur** (`npm run dev`)
3. ✅ **Vider cache navigateur** (Ctrl+Shift+R)
4. ✅ **Aller sur** `/agent/perimeter`
5. ✅ **Vérifier** que vous voyez la nouvelle interface

### Ce que je PEUX faire si ça ne marche pas:

1. Vérifier les fichiers créés
2. Re-modifier App.jsx si besoin
3. Créer version alternative
4. Déboguer erreurs console

---

## 💬 ME DIRE

Après avoir redémarré le serveur, dites-moi:

**Ça marche:**
- "Je vois la nouvelle page avec la carte!"
- "Le bouton Nouveau Périmètre est là"
- "Ça fonctionne!"

**Ça ne marche pas:**
- "Je vois toujours l'ancienne page"
- "J'ai cette erreur dans la console: [copier l'erreur]"
- "La page est blanche"
- "404 sur /agent/perimeter"

---

**Version:** Guide Dépannage v1  
**Date:** 2026-05-07

🔧 **Suivez ce guide étape par étape et ça devrait fonctionner!**
