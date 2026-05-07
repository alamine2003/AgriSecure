# 🧪 TEST RAPIDE - Système de Dessin de Périmètre

**Temps estimé:** 5 minutes  
**Objectif:** Vérifier intégration complète  

---

## ⚡ Démarrage

### 1. Lancer l'Application

```bash
# Terminal 1 - Backend
docker-compose up

# Terminal 2 - Frontend
cd frontend
npm run dev
```

**URLs:**
- Frontend: http://localhost:3000
- Backend: http://localhost:8000

---

## 🎯 Test Complet (5 minutes)

### Étape 1: Login Agent (30 secondes)

1. Aller sur http://localhost:3000/login
2. Email: `moussa.fall@example.sn` (ou créer agent)
3. Mot de passe: (votre mot de passe)
4. Cliquer "Se connecter"
5. ✅ Vérifier redirection `/agent/dashboard`

---

### Étape 2: Accéder Périmètres (15 secondes)

1. Sur dashboard agent
2. Chercher section "Périmètres" ou "Mes Périmètres"
3. Cliquer bouton "Définir mon Premier Périmètre" ou "Gérer Périmètres"
4. ✅ Vérifier URL: `/agent/perimeter`
5. ✅ Vérifier page PerimeterDefinitionAdvanced chargée
6. ✅ Vérifier stats affichées (0 périmètre, 0 ha, 0 points)

---

### Étape 3: Créer Périmètre (2 minutes)

1. Cliquer bouton "Nouveau Périmètre" (vert avec icône +)
2. ✅ **Attendre chargement carte** (1-2s)
   - Vérifier carte Leaflet affichée
   - Vérifier toolbar visible
   - Vérifier message: "Cliquez sur la carte pour ajouter des points"

3. **Dessiner polygone:**
   - Cliquer 4-5 fois sur la carte (créer forme)
   - ✅ Points bleus apparaissent
   - ✅ Ligne puis polygone vert tracé

4. **Vérifier calculs temps réel:**
   - ✅ Panel "Points du Périmètre": 4-5
   - ✅ Panel "Surface Calculée": X.XX ha
   - ✅ Panel "Localisation": Commune proche

5. Cliquer bouton "Terminer" (vert)

6. **Remplir formulaire:**
   - ✅ Vérifier données pré-remplies (surface, GPS, commune)
   - Nom: "Test Rapide"
   - Description: (optionnel)

7. Cliquer "Enregistrer" (bouton vert gradient)
8. ✅ Vérifier notification "Périmètre créé"
9. ✅ Vérifier retour à liste
10. ✅ Vérifier périmètre visible dans liste

---

### Étape 4: Modifier Périmètre (1.5 minutes)

1. Dans liste, cliquer "Modifier" sur périmètre créé
2. ✅ Carte charge avec polygone existant
3. ✅ Points rouges (mode édition)
4. **Glisser un point:**
   - Cliquer-maintenir sur un point
   - Déplacer légèrement
   - Relâcher
5. ✅ Vérifier polygone mis à jour
6. ✅ Vérifier surface recalculée
7. Cliquer "Sauvegarder" (toolbar)
8. Modifier nom: "Test Rapide (Modifié)"
9. Cliquer "Mettre à Jour"
10. ✅ Vérifier notification succès
11. ✅ Vérifier modification dans liste

---

### Étape 5: Supprimer Périmètre (30 secondes)

1. Cliquer bouton "Supprimer" (icône poubelle rouge)
2. ✅ Popup confirmation
3. Confirmer
4. ✅ Notification "Périmètre supprimé"
5. ✅ Périmètre disparu de liste
6. ✅ Stats retour à 0

---

## ✅ Checklist Validation Rapide

### Chargement
- [ ] Carte Leaflet charge en 1-2s
- [ ] Pas d'erreur console
- [ ] Toolbar complète visible
- [ ] Panels info affichés

### Dessin
- [ ] Clic ajoute points
- [ ] Points bleus visibles
- [ ] Polygone vert tracé
- [ ] Minimum 3 points validé

### Calculs
- [ ] Surface calculée affichée
- [ ] Centre GPS affiché (7 décimales)
- [ ] Commune proche détectée
- [ ] Distance affichée (km)

### Sauvegarde
- [ ] Formulaire pré-rempli
- [ ] Sauvegarde réussie
- [ ] Notification succès
- [ ] Retour liste

### Modification
- [ ] Carte charge avec existant
- [ ] Points draggables
- [ ] Recalcul temps réel
- [ ] Mise à jour réussie

### Suppression
- [ ] Confirmation demandée
- [ ] Suppression réussie
- [ ] Liste mise à jour

---

## 🐛 Problèmes Fréquents

### Carte ne charge pas

**Symptôme:** "Chargement de la carte..." infini

**Solutions:**
1. Vérifier connexion internet (CDN Leaflet)
2. Vérifier console erreurs (F12)
3. Rafraîchir page (Ctrl+R)
4. Vider cache navigateur

---

### Points ne s'ajoutent pas

**Symptôme:** Clic sans effet

**Solution:**
- Vérifier bouton "Nouveau Périmètre" cliqué
- Vérifier toolbar active
- Vérifier console erreurs

---

### Surface aberrante

**Symptôme:** 10000 ha pour petit champ

**Cause:** Bug calcul

**Solution:**
- Noter coordonnées GPS
- Signaler bug
- Recréer périmètre

---

### Drag ne fonctionne pas

**Symptôme:** Points ne bougent pas

**Solution:**
- Vérifier mode édition activé
- Points doivent être rouges
- Maintenir clic + déplacer

---

## 📊 Données Test Recommandées

### Petit Champ (~1 ha)

**Cliquer sur carte:**
```
Point 1: Clic quelque part
Point 2: Légèrement à droite
Point 3: Former carré
Point 4: Fermer carré
```

**Surface attendue:** 0.5 - 2 ha

---

### Grand Champ (~100 ha)

**Cliquer sur carte:**
```
Point 1, 2, 3, 4, 5, 6: Former hexagone large
```

**Surface attendue:** 50 - 150 ha

---

## 🎯 Critères de Succès

### ✅ Système Fonctionnel Si:

1. **Carte charge** ← CDN Leaflet OK
2. **Clics ajoutent points** ← Event listeners OK
3. **Polygone tracé** ← Leaflet polygon OK
4. **Surface calculée** ← Algorithme Shoelace OK
5. **Commune détectée** ← Haversine + data OK
6. **Sauvegarde DB** ← API backend OK
7. **Modification fonctionne** ← Dragging OK
8. **Suppression fonctionne** ← DELETE API OK

### ❌ Système NON Fonctionnel Si:

1. Carte ne charge jamais
2. Clics sans effet
3. Erreurs console multiples
4. Sauvegarde échoue (500)
5. Données pas persistées

---

## 🚀 Si Tout Fonctionne

**Félicitations! Le système est opérationnel.**

**Actions suivantes:**
1. ✅ Tester avec plusieurs périmètres
2. ✅ Tester formes complexes (10+ points)
3. ✅ Tester zoom/plein écran
4. ✅ Tester responsive (si applicable)
5. ✅ Préparer démonstration soutenance
6. ✅ Prendre captures d'écran

---

## 🎓 Préparation Soutenance

### Données à Préparer

**Créer 2-3 périmètres:**
1. "Champ Maraîcher Nord" (petit, ~2 ha)
2. "Grande Parcelle Riz" (moyen, ~50 ha)
3. "Zone Culture Intensive" (grand, ~100 ha)

**Avantages:**
- Démonstration rapide
- Stats visuelles
- Pas de temps perdu dessin

---

## ⏱️ Résumé Temps

| Étape | Temps | Cumulé |
|-------|-------|--------|
| Login | 30s | 30s |
| Accès | 15s | 45s |
| Créer | 2min | 2min45s |
| Modifier | 1.5min | 4min15s |
| Supprimer | 30s | 4min45s |

**Total:** ~5 minutes

---

**Status:** ✅ PRÊT POUR TEST  
**Difficulté:** Facile  
**Prérequis:** Application running

🧪 **Bon test!**
