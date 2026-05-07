# 🔧 Résolution: "Un compte existe déjà avec ce NIN"

## 🎯 Problème

Quand vous essayez de créer un compte via **formulaire public d'inscription** avec:
- NIN: `30112002001`
- Email: `babsba123@gmail.com`

**Erreur:** "Un compte existe déjà avec ce NIN" (400 Bad Request)

## 📊 Explication

Le backend vérifie l'unicité du NIN et de l'email dans **2 tables**:
1. **`users_customuser`** - Table des comptes utilisateurs
2. **`surveillance_agentregistrationrequest`** - Table des demandes d'inscription

Si le NIN ou l'email existe dans **l'une de ces tables**, la création est bloquée.

## ✅ Solutions

### Solution 1: Supprimer Complètement le Compte (Recommandé)

**Exécuter:**
```bash
.\supprimer-babsba.bat
```

Ce script supprime:
- ✅ Le compte utilisateur (`users_customuser`)
- ✅ Les demandes d'inscription (`surveillance_agentregistrationrequest`)
- ✅ Les rendez-vous associés (`surveillance_installationappointment`)

**Confirmer** quand demandé, puis **vérifier** (0 rows) = succès.

**Ensuite, vous pouvez:**
- Recréer via formulaire public: http://localhost:3000/register-agent
- OU créer via maintenancier: http://localhost:3000/maintenancier/agents

---

### Solution 2: Supprimer un Autre Compte

**Pour supprimer n'importe quel compte:**
```bash
.\supprimer-compte-agent.bat
```

Saisir l'email du compte à supprimer, confirmer.

---

### Solution 3: Utiliser un Autre NIN/Email

**Créer avec des données différentes:**
- NIN: `10052025999` (nouveau)
- Email: `nouveau.test@agri.sn` (nouveau)
- Autres champs: à votre choix

---

### Solution 4: Suppression Manuelle via Interface

#### A) Supprimer le Compte Utilisateur

1. **Login maintenancier**
2. **Aller sur:** "Agents" (sidebar)
3. **Trouver:** Le compte avec email `babsba123@gmail.com`
4. **Cliquer:** Icône poubelle rouge (🗑️)
5. **Confirmer** la suppression

#### B) Supprimer la Demande d'Inscription

1. **Toujours connecté maintenancier**
2. **Aller sur:** "Demandes" (sidebar)
3. **Cliquer:** Carte correspondante (Approuvées ou Rejetées)
4. **Trouver:** La demande de Boubacar Ba
5. Si pas de bouton supprimer visible → Utiliser script

---

## 🔍 Vérification

### Vérifier si Compte Existe

```bash
docker-compose exec postgres sh -c "psql -U \$POSTGRES_USER -d \$POSTGRES_DB -c \"SELECT email, nin FROM users_customuser WHERE email='babsba123@gmail.com' OR nin='30112002001';\""
```

**Résultat attendu après suppression:** `(0 rows)`

### Vérifier si Demande Existe

```bash
docker-compose exec postgres sh -c "psql -U \$POSTGRES_USER -d \$POSTGRES_DB -c \"SELECT email, nin, status FROM surveillance_agentregistrationrequest WHERE email='babsba123@gmail.com' OR nin='30112002001';\""
```

**Résultat attendu après suppression:** `(0 rows)`

---

## 🚀 Workflow Recommandé pour Soutenance

### Option A: Nouveau Compte Test (Propre)

**Utiliser des données fraîches pour la démo:**

1. **Inscription publique:**
   - NIN: `15051995123`
   - Email: `moussa.ndiaye@agridemo.sn`
   - Prénom: `Moussa`
   - Nom: `Ndiaye`
   - Autres champs: au choix

2. **Maintenancier approuve**

3. **Agent login avec nouveau NIN**

**Avantage:** Aucun conflit, démo fluide

---

### Option B: Recycler Compte Existant

1. **Supprimer complètement:**
   ```bash
   .\supprimer-babsba.bat
   ```

2. **Recréer via formulaire public:**
   - Mêmes données: NIN `30112002001`, email `babsba123@gmail.com`
   - OU nouvelles données

3. **Suivre workflow complet**

---

## 🐛 Problème: Demandes Approuvées Restent

### Symptôme

Après suppression d'un compte via "Agents", la demande reste visible dans "Demandes → Approuvées".

### Cause

La suppression du compte utilisateur ne supprime **pas automatiquement** la demande d'inscription correspondante (pas de CASCADE sur le champ `created_user`).

### Solution A: Script de Suppression

```bash
.\supprimer-babsba.bat
```

Ce script supprime **à la fois** le compte ET la demande.

### Solution B: Suppression Manuelle DB

```bash
docker-compose exec postgres sh -c "psql -U \$POSTGRES_USER -d \$POSTGRES_DB -c \"DELETE FROM surveillance_agentregistrationrequest WHERE email='babsba123@gmail.com';\""
```

### Solution C: Ajouter Bouton Supprimer dans Interface

**(Fonctionnalité à implémenter si besoin pour soutenance)**

Dans `RegistrationRequests.jsx`, ajouter bouton de suppression pour demandes APPROVED/REJECTED.

---

## 📋 Commandes Utiles

### Lister Tous les Comptes Agents

```bash
docker-compose exec postgres sh -c "psql -U \$POSTGRES_USER -d \$POSTGRES_DB -c \"SELECT email, nin, first_name, last_name FROM users_customuser WHERE role='agent_agricole' ORDER BY created_at DESC;\""
```

### Lister Toutes les Demandes

```bash
docker-compose exec postgres sh -c "psql -U \$POSTGRES_USER -d \$POSTGRES_DB -c \"SELECT email, nin, first_name, last_name, status FROM surveillance_agentregistrationrequest ORDER BY created_at DESC;\""
```

### Supprimer Toutes les Demandes Approuvées

```bash
docker-compose exec postgres sh -c "psql -U \$POSTGRES_USER -d \$POSTGRES_DB -c \"DELETE FROM surveillance_agentregistrationrequest WHERE status='APPROVED';\""
```

### Supprimer Toutes les Demandes Rejetées

```bash
docker-compose exec postgres sh -c "psql -U \$POSTGRES_USER -d \$POSTGRES_DB -c \"DELETE FROM surveillance_agentregistrationrequest WHERE status='REJECTED';\""
```

### Nettoyer TOUTES les Données de Test

**⚠️ ATTENTION: Supprime TOUS les agents et demandes**

```bash
docker-compose exec postgres sh -c "psql -U \$POSTGRES_USER -d \$POSTGRES_DB -c \"DELETE FROM surveillance_agentregistrationrequest;\""
docker-compose exec postgres sh -c "psql -U \$POSTGRES_USER -d \$POSTGRES_DB -c \"DELETE FROM surveillance_installationappointment;\""
docker-compose exec postgres sh -c "psql -U \$POSTGRES_USER -d \$POSTGRES_DB -c \"DELETE FROM users_customuser WHERE role='agent_agricole';\""
```

---

## 🎓 Préparation Soutenance

### Scénario Clean (Recommandé)

**1 jour avant:**

1. **Nettoyer toutes les données de test:**
   ```bash
   # Supprimer tous les agents test
   docker-compose exec postgres sh -c "psql -U \$POSTGRES_USER -d \$POSTGRES_DB -c \"DELETE FROM users_customuser WHERE role='agent_agricole';\""
   
   # Supprimer toutes les demandes
   docker-compose exec postgres sh -c "psql -U \$POSTGRES_USER -d \$POSTGRES_DB -c \"DELETE FROM surveillance_agentregistrationrequest;\""
   ```

2. **Préparer un compte maintenancier propre**

**Le jour J:**

3. **Faire démo en direct:**
   - Inscription publique avec données fraîches
   - Approbation maintenancier
   - Login agent
   - Dashboard

**Avantages:**
- ✅ Aucune donnée résiduelle
- ✅ Démo fluide sans erreur
- ✅ Montre workflow complet
- ✅ Badges/compteurs à 0 puis augmentent en direct

---

## 🎯 Checklist Pré-Soutenance

- [ ] Nettoyer base de données (supprimer tests)
- [ ] Vérifier aucun compte agent existant
- [ ] Vérifier aucune demande pendante
- [ ] Tester formulaire public (créer + supprimer)
- [ ] Tester approbation maintenancier
- [ ] Tester login agent nouveau compte
- [ ] Vérifier dashboard agent fonctionne
- [ ] Préparer données de démo (NIN, email, etc.)
- [ ] Noter credentials maintenancier

---

## 📞 Support Immédiat

**Problème persiste après suppression:**

1. **Redémarrer backend:**
   ```bash
   docker-compose restart backend
   ```

2. **Vérifier cache React Query:**
   - F12 → Application → Clear Storage
   - Rafraîchir page (Ctrl+Shift+R)

3. **Logs backend:**
   ```bash
   docker-compose logs backend --tail=50 | grep -i "error\|nin\|email"
   ```

**Contact d'urgence:** Utiliser scripts `.bat` pour automatiser !

---

## ✅ Résumé Actions Rapides

| Situation | Commande |
|-----------|----------|
| Supprimer babsba123@gmail.com | `.\supprimer-babsba.bat` |
| Supprimer n'importe quel compte | `.\supprimer-compte-agent.bat` |
| Vérifier si compte existe | Voir section "Vérification" |
| Nettoyer toutes demandes | Commandes SQL ci-dessus |
| Créer nouveau compte test | Formulaire public avec nouveau NIN |

**🚀 Prêt pour soutenance !**
