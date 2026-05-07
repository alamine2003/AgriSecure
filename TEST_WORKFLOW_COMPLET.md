# 🎯 Test Workflow Complet - Page Publique → Maintenancier → Agent

## 📋 Vue d'Ensemble du Workflow

```
VISITEUR (Page Publique)
    ↓ Remplit formulaire inscription
DEMANDE CRÉÉE (Status: PENDING)
    ↓ Maintenancier login
MAINTENANCIER (Dashboard)
    ↓ Approuve la demande
COMPTE CRÉÉ + RENDEZ-VOUS
    ↓ Agent reçoit ses credentials
AGENT (Première Connexion)
    ↓ Change mot de passe obligatoire
AGENT (Dashboard) ✅
```

---

## 🚀 Préparation

### Étape 0: Appliquer Migrations

**Exécuter:**
```bash
.\setup-workflow-complet.bat
```

**OU manuellement:**
```bash
docker-compose exec backend python manage.py makemigrations surveillance
docker-compose exec backend python manage.py migrate
docker-compose restart backend frontend
```

**Vérifier:**
- ✅ Frontend: http://localhost:3000
- ✅ Backend: http://localhost:8000/api/v1/
- ✅ Nginx: http://localhost

---

## 📝 PARTIE 1: Inscription Publique (Visiteur)

### Étape 1.1: Accéder à la Page d'Accueil

1. **Ouvrir navigateur:** http://localhost:3000
2. **Voir:**
   - Logo AgriWatch
   - Hero section avec titre "Protégez Vos Exploitations"
   - Bouton **"S'Inscrire Maintenant"** (vert)
   - Bouton "Se Connecter" (outline)

### Étape 1.2: Aller sur Page Inscription

**Cliquer:** Bouton **"S'Inscrire Maintenant"**

**OU directement:** http://localhost:3000/register-agent

**Voir:**
- Formulaire complet d'inscription
- 3 sections:
  1. Informations Personnelles
  2. Localisation de l'Exploitation
  3. Exploitation Agricole

### Étape 1.3: Remplir le Formulaire

#### Section 1: Informations Personnelles

| Champ | Valeur à Saisir | Remarque |
|-------|----------------|----------|
| **NIN** | `20052025001` | Unique, sera le mot de passe initial |
| **Email** | `moussa.diop@agritest.sn` | Unique |
| **Prénom** | `Moussa` | |
| **Nom** | `Diop` | |
| **Téléphone** | `771234567` | |

#### Section 2: Localisation

| Champ | Valeur à Saisir |
|-------|----------------|
| **Région** | `Thiès` (sélection) |
| **Localité** | `Mbour` |
| **Adresse** | `Quartier Médina, Rue 12` |

#### Section 3: Exploitation

| Champ | Valeur à Saisir | Remarque |
|-------|----------------|----------|
| **Superficie** | `5 hectares` | Optionnel |

### Étape 1.4: Envoyer la Demande

**Cliquer:** Bouton vert **"Envoyer la Demande"**

**Résultat attendu:**
- ✅ Notification verte: "Demande envoyée - Votre demande d'inscription a été envoyée avec succès..."
- ✅ Redirection vers page d'accueil après 2 secondes
- ✅ Dans la DB: Nouvelle ligne dans `surveillance_agentregistrationrequest` avec `status='PENDING'`

**Vérification DB (optionnel):**
```bash
docker-compose exec postgres sh -c "psql -U \$POSTGRES_USER -d \$POSTGRES_DB -c \"SELECT email, nin, first_name, last_name, status FROM surveillance_agentregistrationrequest WHERE email='moussa.diop@agritest.sn';\""
```

---

## 👨‍💼 PARTIE 2: Traitement Maintenancier

### Étape 2.1: Login Maintenancier

1. **Aller sur:** http://localhost:3000/login
2. **Saisir credentials maintenancier:**
   - Email: [votre email maintenancier]
   - Password: [votre password maintenancier]
3. **Cliquer:** "Se connecter"

**Résultat attendu:**
- ✅ Redirection vers `/dashboard` (ou `/maintenancier/agents` selon config)
- ✅ Voir dashboard maintenancier

**Si pas de maintenancier, créer:**
```bash
docker-compose exec backend python manage.py createsuperuser
```
Puis:
- Email: admin@surveillance.sn
- NIN: 00000000000
- Prénom: Admin
- Nom: System
- Password: [votre choix, min 8 caractères]

### Étape 2.2: Accéder aux Demandes

**Dans sidebar, cliquer:** **"Demandes"** (icône UserPlus)

**OU directement:** http://localhost:3000/maintenancier/inscription

**Voir:**
- 3 cartes statistiques:
  - 🟡 **En attente** (badge avec nombre)
  - 🟢 **Approuvées**
  - 🔴 **Rejetées**

### Étape 2.3: Filtrer Demandes Pendantes

**Cliquer:** Carte **"En attente"** (jaune)

**Résultat:**
- Liste filtrée des demandes avec `status='PENDING'`
- Voir la demande de **Moussa Diop** avec toutes les infos:
  - NIN: 20052025001
  - Email: moussa.diop@agritest.sn
  - Téléphone: 771234567
  - Région: Thiès - Mbour
  - Adresse complète
  - Superficie: 5 hectares

### Étape 2.4: Approuver la Demande

**Cliquer:** Bouton vert **"Approuver"** sur la demande de Moussa Diop

**Popup de confirmation s'affiche:**
```
Approuver la demande de Moussa Diop?

Cela créera un compte agent avec:
- Email: moussa.diop@agritest.sn
- NIN: 20052025001
- Mot de passe initial: 20052025001
```

**Cliquer:** OK / Confirmer

**Résultat attendu:**
- ✅ Notification verte: "Demande approuvée - Le compte agent a été créé avec succès"
- ✅ La demande disparaît de la liste "En attente"
- ✅ Badge "Approuvées" passe de 0 à 1
- ✅ Dans la DB:
  - Nouveau user dans `users_customuser` avec email `moussa.diop@agritest.sn`
  - Nouveau rendez-vous dans `surveillance_installationappointment` avec `status='PENDING'`
  - Demande mise à jour: `status='APPROVED'`, `processed_at` rempli

**Vérification (optionnel):**

Voir le compte créé:
```bash
docker-compose exec postgres sh -c "psql -U \$POSTGRES_USER -d \$POSTGRES_DB -c \"SELECT email, nin, first_name, last_name, role, is_active, must_change_password FROM users_customuser WHERE email='moussa.diop@agritest.sn';\""
```

Résultat attendu:
```
         email              |     nin     | first_name | last_name |     role      | is_active | must_change_password 
---------------------------+-------------+------------+-----------+---------------+-----------+----------------------
 moussa.diop@agritest.sn   | 20052025001 | Moussa     | Diop      | agent_agricole| t         | t
```

### Étape 2.5: Vérifier Rendez-vous Créé

**Cliquer:** "Rendez-vous" dans sidebar

**Voir:**
- Nouveau rendez-vous pour **Moussa Diop**
- Statut: PENDING (En attente)
- Région: Thiès
- Localité: Mbour
- Agent assigné: Moussa Diop

**Optionnel:** Le maintenancier peut maintenant:
- Assigner un technicien
- Planifier une date
- Changer le statut

---

## 👤 PARTIE 3: Connexion Agent

### Étape 3.1: Logout Maintenancier

**Cliquer:** Bouton "Déconnexion" dans sidebar (en bas)

**OU ouvrir navigation privée / autre navigateur**

### Étape 3.2: Aller sur Page Login

**Ouvrir:** http://localhost:3000/login

**Voir:**
- Formulaire login
- Logo "Surveillance Agricole"

### Étape 3.3: Première Connexion Agent

**Saisir:**
- **Email:** `moussa.diop@agritest.sn`
- **Mot de passe:** `20052025001` (son NIN)

**Cliquer:** Bouton vert **"Se connecter"**

**Résultat attendu:**
- ✅ Notification bleue: "Action requise - Change ton mot de passe pour continuer"
- ✅ **Redirection automatique vers** `/change-password`
- ✅ Voir formulaire de changement de mot de passe

### Étape 3.4: Changer le Mot de Passe

**Formulaire affiché:**
- Ancien mot de passe
- Nouveau mot de passe
- Confirmer nouveau mot de passe

**Saisir:**
- **Ancien mot de passe:** `20052025001`
- **Nouveau mot de passe:** `Moussa2025!` (min 8 caractères)
- **Confirmer:** `Moussa2025!`

**Cliquer:** "Changer le mot de passe"

**Résultat attendu:**
- ✅ Notification verte: "Mot de passe changé avec succès"
- ✅ **Redirection automatique vers** `/dashboard`
- ✅ Voir dashboard agent avec:
  - Statistiques personnelles
  - Caméras actives (0 pour l'instant)
  - Détections aujourd'hui
  - Alertes critiques

### Étape 3.5: Explorer Dashboard Agent

**Voir dans dashboard:**

**Cartes statistiques:**
- 📊 Détections Aujourd'hui: 0
- 🚨 Alertes Critiques: 0
- 📹 Caméras Actives: 0
- 🛡️ Statut Surveillance: Inactive

**Sidebar navigation:**
- Dashboard
- Surveillance (pour voir flux caméras)
- Rapports (pour générer PDF)

**Feed d'activité:**
- Affiche "Aucune détection récente" (normal pour nouveau compte)

### Étape 3.6: Vérifier Profil Agent

**Dans sidebar, voir:**
- Nom: Moussa Diop
- Email: moussa.diop@agritest.sn
- Badge: "Agent agricole" (vert)

---

## ✅ Vérifications Finales

### Checklist Complète

- [x] **Page publique accessible** (http://localhost:3000)
- [x] **Formulaire inscription fonctionne**
- [x] **Demande enregistrée dans DB**
- [x] **Maintenancier peut voir demandes**
- [x] **Approbation crée compte + rendez-vous**
- [x] **Agent peut se connecter avec NIN**
- [x] **Changement password obligatoire**
- [x] **Agent accède à son dashboard**
- [x] **Dashboard affiche données correctes**

### Vérification Base de Données

**Demande approuvée:**
```bash
docker-compose exec postgres sh -c "psql -U \$POSTGRES_USER -d \$POSTGRES_DB -c \"SELECT email, status, processed_at FROM surveillance_agentregistrationrequest WHERE email='moussa.diop@agritest.sn';\""
```

**Compte agent créé:**
```bash
docker-compose exec postgres sh -c "psql -U \$POSTGRES_USER -d \$POSTGRES_DB -c \"SELECT email, nin, role, is_active, must_change_password FROM users_customuser WHERE email='moussa.diop@agritest.sn';\""
```

**Rendez-vous créé:**
```bash
docker-compose exec postgres sh -c "psql -U \$POSTGRES_USER -d \$POSTGRES_DB -c \"SELECT agent_id, region, locality, status FROM surveillance_installationappointment WHERE agent_id IN (SELECT id FROM users_customuser WHERE email='moussa.diop@agritest.sn');\""
```

---

## 🎓 Pour la Soutenance

### Scénario de Démo (12 minutes)

**Partie 1: Inscription (3 min)**
1. Montrer page d'accueil professionnelle
2. Cliquer "S'inscrire"
3. Remplir formulaire en direct
4. Envoyer → montrer notification

**Partie 2: Maintenancier (4 min)**
5. Login maintenancier
6. Dashboard → cliquer "Demandes"
7. Montrer cartes statistiques (1 en attente)
8. Cliquer "En attente"
9. Montrer détails demande (toutes les infos)
10. Cliquer "Approuver"
11. Montrer notification succès
12. Vérifier dans "Agents" → compte créé
13. Vérifier dans "Rendez-vous" → rendez-vous créé

**Partie 3: Agent (5 min)**
14. Logout maintenancier
15. Login avec email agent + NIN
16. Montrer redirection automatique `/change-password`
17. Expliquer sécurité (NIN temporaire)
18. Changer password
19. Montrer dashboard agent
20. Expliquer fonctionnalités disponibles

**Messages clés à expliquer:**
- ✅ Workflow complet automatisé
- ✅ Sécurité: password initial = NIN, changement obligatoire
- ✅ Traçabilité: demande → approbation → compte → rendez-vous
- ✅ Séparation des rôles: visiteur → maintenancier → agent
- ✅ UX moderne et intuitive

---

## 🐛 Troubleshooting

### Page d'inscription inaccessible

**Vérifier:**
```bash
docker-compose ps frontend
docker-compose logs frontend --tail=30
```

**Solution:**
```bash
docker-compose restart frontend
```

### Erreur lors de l'approbation

**Vérifier logs backend:**
```bash
docker-compose logs backend --tail=50
```

**Erreurs courantes:**
- NIN/Email déjà existant → Supprimer ancien compte
- Migration non appliquée → Exécuter `setup-workflow-complet.bat`

### Agent ne peut pas login

**Vérifier compte créé:**
```bash
docker-compose exec postgres sh -c "psql -U \$POSTGRES_USER -d \$POSTGRES_DB -c \"SELECT email, is_active FROM users_customuser WHERE email='moussa.diop@agritest.sn';\""
```

**Si `is_active = f`:**
```bash
docker-compose exec postgres sh -c "psql -U \$POSTGRES_USER -d \$POSTGRES_DB -c \"UPDATE users_customuser SET is_active=true WHERE email='moussa.diop@agritest.sn';\""
```

---

## 📊 Données de Test Supplémentaires

Pour tester plusieurs demandes:

### Agent 2
- NIN: 15031990002
- Email: fatou.ba@agritest.sn
- Prénom: Fatou
- Nom: Ba
- Région: Dakar
- Localité: Pikine

### Agent 3
- NIN: 22121988003
- Email: ibrahima.fall@agritest.sn
- Prénom: Ibrahima
- Nom: Fall
- Région: Saint-Louis
- Localité: Saint-Louis Ville

### Test de Rejet

1. Créer demande pour agent test
2. Login maintenancier
3. Cliquer "Rejeter"
4. Saisir raison: "Informations incomplètes - adresse imprécise"
5. Confirmer
6. Vérifier badge "Rejetées" augmente

---

## 🎯 Résumé Workflow

```
┌─────────────────────────────────────────────────────────┐
│                    PAGE PUBLIQUE                        │
│  Formulaire inscription → Demande (PENDING)             │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│                  MAINTENANCIER                          │
│  Login → Demandes → Approuver                           │
│  ├─ Crée User (agent_agricole)                          │
│  └─ Crée InstallationAppointment (PENDING)              │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│                       AGENT                             │
│  Login (email + NIN) → Change Password → Dashboard      │
└─────────────────────────────────────────────────────────┘
```

**✅ Workflow Complet Fonctionnel !** 🚀

---

## 📞 Support

**Besoin d'aide:**
1. Exécuter `.\setup-workflow-complet.bat`
2. Vérifier services: `docker-compose ps`
3. Logs: `docker-compose logs backend frontend --tail=50`

**Tout redémarrer:**
```bash
docker-compose down
docker-compose up -d
```

**✨ Prêt pour une démo parfaite !**
