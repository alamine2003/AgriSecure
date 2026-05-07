# 🚀 DÉPLOYER LE NOUVEAU DASHBOARD

## ⚡ Solution Ultra-Rapide

### Avec Docker (Production)

**Double-cliquez sur:**
```
rebuild-docker-frontend.bat
```

**Ou en ligne de commande:**
```bash
docker-compose down
docker-compose build --no-cache frontend
docker-compose up -d
```

**Puis ouvrir:** http://localhost/agent/dashboard

---

### Sans Docker (Développement)

**Double-cliquez sur:**
```
installer-dashboard-unifie.bat
```

**Ou en ligne de commande:**
```bash
cd frontend
npm install
npm run dev
```

**Puis ouvrir:** http://localhost:3000/agent/dashboard

---

## ✅ Vérification Rapide

**Vous devriez voir:**
- ✅ Header avec 2 boutons d'action
- ✅ 4 stats cards colorées
- ✅ Section "Mes Périmètres" (grid 2 colonnes)
- ✅ Section "Alertes" (liste à droite)
- ✅ Section "Mes Caméras" (grid 2 colonnes)
- ✅ Section "Détections" (liste à droite)
- ✅ Pas de scroll global (sauf contenu interne)

**Tester:**
1. Cliquer "Nouveau Périmètre"
2. Dialog s'ouvre avec carte
3. Dessiner polygone
4. Enregistrer
5. ✅ Périmètre créé!

---

## 📁 Documentation

- **Installation rapide:** `ACTIONS_IMMEDIATES.md`
- **Docker détaillé:** `DEPLOIEMENT_DOCKER.md`
- **Technique complet:** `NOUVEAU_DASHBOARD_UNIFIE.md`
- **Synthèse:** `SYNTHESE_AMELIORATIONS.md`

---

## 🐛 En cas de problème

### Docker
```bash
docker-compose logs frontend
docker-compose logs nginx
```

### Dev
```bash
# Ouvrir console navigateur
F12 → Console → Chercher erreurs rouges
```

### Cache
```
Ctrl + Shift + R   (Windows/Linux)
Cmd + Shift + R    (Mac)
```

---

**Temps:** 3-5 minutes  
**Difficulté:** Très facile

🎯 **Un clic et c'est déployé!**
