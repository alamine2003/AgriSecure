# 🔧 Correction Problème Login et Redirection

## 🎯 Problème Identifié

Le frontend ne pouvait pas se connecter au backend car la configuration API était incorrecte:
- ❌ `VITE_API_URL=http://localhost:8000/api/v1` (ne fonctionne pas depuis le navigateur)
- ✅ `VITE_API_URL=/api/v1` (utilise le proxy Vite)

## ✅ Corrections Appliquées

### 1. Configuration API Corrigée

**Fichiers modifiés:**
- `docker-compose.override.yml`
- `docker-compose.dev.yml`

**Changement:**
```yaml
# AVANT (incorrect)
environment:
  - VITE_API_URL=http://localhost:8000/api/v1
  - VITE_WS_URL=ws://localhost:8000/ws

# APRÈS (correct)
environment:
  - VITE_API_URL=/api/v1
  - VITE_WS_URL=ws://localhost:3000/ws
```

**Pourquoi ça marche maintenant:**
- Le proxy Vite (configuré dans `vite.config.js`) redirige `/api/v1` vers `http://backend:8000`
- Le navigateur fait des requêtes vers `http://localhost:3000/api/v1`
- Vite proxy vers le backend Docker `backend:8000`
- Pas de problème CORS, pas de problème réseau

### 2. Logs de Debug Ajoutés

**Fichier modifié:** `frontend/src/pages/Login.jsx`

**Ajouts:**
```javascript
console.log('[LOGIN] Tentative de connexion...');
console.log('[LOGIN] Réponse reçue:', response.data);
console.log('[LOGIN] Données sauvegardées:', { hasToken, hasUser, userRole });
console.log('[LOGIN] Connexion réussie, redirection vers /dashboard');
```

**Pourquoi c'est utile:**
- Permet de voir exactement où le processus échoue
- Vérifie que les données sont bien sauvegardées dans localStorage
- Confirme que la redirection est tentée

### 3. Timeout Ajouté Avant Navigation

**Pourquoi:**
- React peut avoir besoin d'un instant pour mettre à jour le state
- Le timeout de 100ms garantit que tout est prêt avant la navigation

## 🚀 Comment Tester

### Méthode Rapide

```batch
.\fix-login-redirection.bat
```

Ce script va:
1. ✅ Redémarrer le frontend avec la nouvelle config
2. ✅ Créer un utilisateur de test: `admin@test.com` / `admin123`
3. ✅ Ouvrir le navigateur

### Méthode Manuelle

1. **Redémarrer le frontend:**
   ```batch
   docker-compose restart frontend
   ```

2. **Ouvrir http://localhost:3000**

3. **Ouvrir la Console (F12):**
   - Onglet "Console" pour les logs
   - Onglet "Network" pour les requêtes

4. **Se connecter:**
   - Email: `admin@test.com`
   - Password: `admin123`

5. **Observer les logs Console:**
   ```
   [LOGIN] Tentative de connexion... {email: "admin@test.com"}
   [LOGIN] Réponse reçue: {access: "...", refresh: "...", user: {...}}
   [LOGIN] Sauvegarde dans localStorage...
   [LOGIN] Données sauvegardées: {hasToken: true, hasUser: true, userRole: "maintenancier"}
   [LOGIN] Connexion réussie, redirection vers /dashboard
   [LOGIN] Exécution de la navigation...
   ```

6. **Vérifier la redirection:**
   - URL devrait changer vers `/dashboard`
   - Le dashboard maintenancier devrait s'afficher

## 🔍 Diagnostic

### Si la connexion fonctionne mais pas de redirection:

**Vérifier localStorage:**
1. F12 → Application → Local Storage → http://localhost:3000
2. Vérifier la présence de:
   - `access_token`
   - `refresh_token`
   - `user`

**Vérifier les logs Console:**
- Est-ce que `[LOGIN] Exécution de la navigation...` apparaît?
- Y a-t-il des erreurs après?

**Vérifier l'URL:**
- Est-ce que l'URL change vers `/dashboard` même brièvement?
- Est-ce qu'il y a une redirection immédiate vers `/login`?

**Solutions:**
1. **Vider le cache:**
   ```
   Ctrl + Shift + Delete → Effacer cookies et cache
   ```

2. **Rafraîchir la page:**
   ```
   Ctrl + Shift + R (force refresh)
   ```

3. **Accès direct:**
   ```
   http://localhost:3000/dashboard
   ```
   Si ça fonctionne → problème de navigation React Router

### Si "Network Error" ou requête échoue:

**Vérifier que le backend est accessible:**
```batch
curl http://localhost:8000/api/v1/auth/login/ -X OPTIONS
```

Devrait retourner `200 OK` ou `405 Method Not Allowed` (normal pour OPTIONS)

**Vérifier le proxy Vite:**
```javascript
// Dans vite.config.js (déjà configuré)
proxy: {
  "/api/v1": {
    target: "http://backend:8000",
    changeOrigin: true,
  }
}
```

**Vérifier que les services sont UP:**
```batch
docker-compose ps
```

Tous doivent être "Up"

## 📊 Architecture du Flux Login

```
Navigateur (localhost:3000)
    │
    │ 1. POST /api/v1/auth/login/
    │    { email, password }
    ▼
Vite Dev Server (port 3000)
    │
    │ 2. Proxy vers backend:8000
    ▼
Backend Django (backend:8000)
    │
    │ 3. Vérification identifiants
    │ 4. Génération JWT tokens
    │
    │ { access, refresh, user }
    ▼
Vite → Navigateur
    │
    │ 5. localStorage.setItem()
    │ 6. navigate('/dashboard')
    ▼
React Router
    │
    │ 7. <ProtectedRoute> vérifie token
    │ 8. Affiche <Dashboard />
    ▼
Dashboard affiché ✅
```

## 🎓 Explications Techniques

### Proxy Vite vs URL Directe

**Avec URL directe (incorrect):**
```javascript
// Frontend dans Docker
const response = await axios.post('http://localhost:8000/api/v1/auth/login/', ...)
// ❌ Erreur: le navigateur essaie localhost:8000 de SA machine, pas du conteneur
```

**Avec proxy Vite (correct):**
```javascript
// Frontend utilise chemin relatif
const response = await axios.post('/api/v1/auth/login/', ...)
// ✅ Le navigateur envoie vers localhost:3000/api/v1/...
// ✅ Vite proxy vers backend:8000 (réseau Docker)
```

### Pourquoi le timeout ?

```javascript
setTimeout(() => {
  navigate('/dashboard', { replace: true });
}, 100);
```

React utilise un système de rendu asynchrone. Même si `localStorage.setItem()` est synchrone, React peut avoir besoin d'un cycle de rendu pour mettre à jour l'état d'authentification. Le timeout de 100ms donne ce temps à React.

## 🎯 Checklist Finale

Avant de dire que ça fonctionne:

- [ ] `docker-compose ps` → frontend "Up"
- [ ] `curl http://localhost:3000` → HTML reçu
- [ ] Navigateur sur http://localhost:3000 → page d'accueil
- [ ] Console F12 ouverte
- [ ] Login avec admin@test.com / admin123
- [ ] Console affiche `[LOGIN] Connexion réussie...`
- [ ] URL change vers `/dashboard`
- [ ] Dashboard maintenancier s'affiche
- [ ] Cartes statistiques visibles
- [ ] Accès rapides (Gestion Agents, etc.) visibles

Si tous les points sont ✅ → **SUCCÈS!**

## 📞 Si Toujours Pas de Redirection

**Dernière solution (workaround):**

Modifier `Login.jsx` pour utiliser `window.location.href` au lieu de `navigate()`:

```javascript
// Au lieu de:
navigate('/dashboard', { replace: true });

// Utiliser:
window.location.href = '/dashboard';
```

Cette méthode force un rechargement complet de la page, ce qui garantit que tout est réinitialisé.

---

**Date:** 2026-05-07  
**Version:** 1.0 - Correction Login  
**Statut:** ✅ CORRIGÉ
