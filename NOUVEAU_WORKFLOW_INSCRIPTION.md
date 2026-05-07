# 🚀 Nouveau Workflow d'Inscription Agent

## Vue d'Ensemble

Nouveau système complet d'inscription publique pour les agents agricoles depuis la page d'accueil.

## Architecture

### Backend

#### Nouveau Modèle: `AgentRegistrationRequest`
**Fichier:** `backend/surveillance/models.py`

```python
class AgentRegistrationRequest(models.Model):
    STATUS_CHOICES = (
        ("PENDING", "En attente"),
        ("APPROVED", "Approuvé"),
        ("REJECTED", "Rejeté"),
    )
    
    id = UUIDField
    nin = CharField (unique)
    email = EmailField (unique)
    first_name, last_name, phone
    region, locality, address, farm_size
    status = CharField (default="PENDING")
    rejection_reason = TextField
    created_user = ForeignKey (User créé si approuvé)
    created_at, processed_at
```

#### API Endpoints

**Publique (AllowAny):**
- `POST /api/v1/surveillance/registration-requests/` - Créer une demande

**Maintenancier uniquement:**
- `GET /api/v1/surveillance/registration-requests/` - Liste des demandes
- `POST /api/v1/surveillance/registration-requests/{id}/approve/` - Approuver
- `POST /api/v1/surveillance/registration-requests/{id}/reject/` - Rejeter

#### Actions Approve

Quand un maintenancier approuve:
1. Crée le compte agent avec `CustomUser.objects.create_user()`
2. Mot de passe initial = NIN
3. Crée automatiquement un `InstallationAppointment` en statut PENDING
4. Marque la demande comme APPROVED
5. Lie l'utilisateur créé à la demande

### Frontend

#### Pages Créées

**1. Page d'Inscription Publique**
- **Route:** `/register-agent`
- **Fichier:** `frontend/src/pages/RegisterAgent.jsx`
- **Accès:** Public (sans authentification)
- **Formulaire:**
  - Informations personnelles (NIN, email, prénom, nom, téléphone)
  - Localisation (région, localité, adresse)
  - Exploitation agricole (superficie optionnelle)

**2. Gestion des Demandes (Maintenancier)**
- **Route:** `/maintenancier/inscription`
- **Fichier:** `frontend/src/pages/RegistrationRequests.jsx`
- **Accès:** Maintenancier uniquement
- **Fonctionnalités:**
  - Vue par statut (PENDING, APPROVED, REJECTED)
  - Compteurs stats sur 3 cartes
  - Approbation en un clic (avec confirmation)
  - Rejet avec raison obligatoire
  - Détails complets de chaque demande

#### Navigation

**Page d'Accueil (Home.jsx):**
- Bouton principal CTA: "S'Inscrire Maintenant" → `/register-agent`
- Bouton secondaire: "Se Connecter" → `/login`

**Sidebar Maintenancier:**
- Dashboard
- **Demandes** (nouveau, icône UserPlus)
- Agents
- Rendez-vous

## Workflow Complet

### 1. Visiteur sur Page d'Accueil
```
Visiteur sur http://localhost:3000
  ↓
Clique "S'Inscrire Maintenant"
  ↓
Formulaire /register-agent
  ↓
Remplit: NIN, email, nom, prénom, téléphone, région, localité, adresse, superficie
  ↓
Soumet (POST /api/v1/surveillance/registration-requests/)
  ↓
Notification: "Demande envoyée avec succès"
  ↓
Redirection vers page d'accueil (après 2s)
```

### 2. Maintenancier Traite la Demande
```
Maintenancier login → Dashboard
  ↓
Clique "Demandes" dans sidebar
  ↓
Voit 3 cartes: En attente (🟡), Approuvées (🟢), Rejetées (🔴)
  ↓
Clique carte "En attente" (filtre PENDING)
  ↓
Voit liste des demandes avec toutes les infos
  ↓
OPTION A: Approuver
  ├─ Clique "Approuver"
  ├─ Popup confirmation avec NIN affiché
  ├─ POST /api/v1/surveillance/registration-requests/{id}/approve/
  ├─ Backend crée User + InstallationAppointment
  ├─ Notification: "Compte agent créé avec succès"
  └─ Demande disparaît de "En attente", apparaît dans "Approuvées"

OPTION B: Rejeter
  ├─ Clique "Rejeter"
  ├─ Modal s'ouvre: "Raison du rejet"
  ├─ Écrit raison (obligatoire)
  ├─ POST /api/v1/surveillance/registration-requests/{id}/reject/
  ├─ Notification: "Demande rejetée"
  └─ Demande disparaît de "En attente", apparaît dans "Rejetées"
```

### 3. Agent Se Connecte
```
Agent reçoit email (manuel pour l'instant)
  ↓
Va sur /login
  ↓
Email: celui fourni dans demande
Password: son NIN
  ↓
Première connexion → Redirection vers /change-password
  ↓
Change son mot de passe (min 8 caractères)
  ↓
Accède au dashboard agent
```

## Validation et Sécurité

### Backend
✅ NIN unique (vérifie si User existe déjà avec ce NIN)
✅ Email unique (vérifie si User existe déjà avec cet email)
✅ Permissions: seuls maintenanciers peuvent approve/reject
✅ Création atomique: User + Appointment dans même transaction
✅ Mot de passe hashé (Django set_password)

### Frontend
✅ Formulaire avec validation HTML5 (required fields)
✅ Affichage erreurs backend détaillées
✅ Confirmation avant approbation
✅ Raison obligatoire pour rejet
✅ Routes protégées (maintenancier uniquement)

## Migration

### Étapes d'Installation

1. **Créer et appliquer la migration:**
```bash
# Option 1: Via .bat Windows
.\migrate-registration.bat

# Option 2: Manuel
docker-compose exec backend python manage.py makemigrations surveillance
docker-compose exec backend python manage.py migrate
docker-compose restart backend
```

2. **Redémarrer frontend:**
```bash
docker-compose restart frontend
```

3. **Vérifier:**
```bash
# Backend logs
docker-compose logs backend --tail=50

# Frontend accessible
curl http://localhost:3000

# Nginx OK
curl http://localhost
```

## Test Complet (Scénario Démo)

### 1. Inscription Publique
```
1. Ouvrir http://localhost:3000
2. Cliquer "S'Inscrire Maintenant"
3. Remplir formulaire:
   - NIN: 12345678901
   - Email: test@agri.sn
   - Prénom: Abdou
   - Nom: Diop
   - Téléphone: 771234567
   - Région: Thiès
   - Localité: Mbour
   - Adresse: Quartier Medina, Rue 5
   - Superficie: 3 hectares (optionnel)
4. Cliquer "Envoyer la Demande"
5. Voir notification succès
6. Redirection vers accueil
```

### 2. Traitement Maintenancier
```
1. Login maintenancier
2. Cliquer "Demandes" (sidebar)
3. Voir carte "En attente" avec badge "1"
4. Cliquer carte "En attente"
5. Voir demande de Abdou Diop avec toutes les infos
6. Cliquer "Approuver"
7. Confirmer popup
8. Voir notification "Compte agent créé"
9. Demande disparaît, badge "Approuvées" passe à "1"
```

### 3. Connexion Agent
```
1. Logout maintenancier
2. Login avec:
   - Email: test@agri.sn
   - Password: 12345678901 (son NIN)
3. Redirection automatique vers /change-password
4. Changer mot de passe (ex: NewPassword123!)
5. Accès au dashboard agent
```

### 4. Vérifier Rendez-vous
```
1. Login maintenancier
2. Aller "Rendez-vous"
3. Voir nouveau rendez-vous automatique pour Abdou Diop
   - Statut: PENDING
   - Région: Thiès
   - Localité: Mbour
4. Maintenancier peut maintenant:
   - Assigner un technicien
   - Planifier date/heure
   - Changer statut
```

## Points d'Amélioration Futurs

- [ ] Email automatique après approbation (SendGrid/Mailgun)
- [ ] SMS notification avec Twilio
- [ ] Upload pièces justificatives (CIN, titre foncier)
- [ ] Validation KYC automatique
- [ ] Géolocalisation exploitation sur carte
- [ ] Pagination demandes (>100)
- [ ] Export CSV/Excel des demandes
- [ ] Dashboard analytics (taux approbation, délai moyen)

## Fichiers Modifiés/Créés

### Backend
✅ `backend/surveillance/models.py` - Ajout AgentRegistrationRequest
✅ `backend/surveillance/serializers.py` - Ajout serializer + validations
✅ `backend/surveillance/views.py` - Ajout ViewSet + actions approve/reject
✅ `backend/surveillance/urls.py` - Ajout route registration-requests

### Frontend
✅ `frontend/src/pages/RegisterAgent.jsx` - Page inscription publique
✅ `frontend/src/pages/RegistrationRequests.jsx` - Page gestion maintenancier
✅ `frontend/src/pages/Home.jsx` - Ajout boutons CTA
✅ `frontend/src/App.jsx` - Ajout routes
✅ `frontend/src/components/AppLayout.jsx` - Ajout lien sidebar

### Scripts
✅ `migrate-registration.bat` - Script migration Windows

### Documentation
✅ `NOUVEAU_WORKFLOW_INSCRIPTION.md` - Ce fichier

## Commandes Utiles

```bash
# Démarrer application
make dev

# Voir logs en temps réel
make logs

# Restart services
docker-compose restart backend frontend

# Migrations
docker-compose exec backend python manage.py makemigrations
docker-compose exec backend python manage.py migrate

# Shell Django (debug)
docker-compose exec backend python manage.py shell

# Voir demandes dans DB
docker-compose exec db psql -U postgres -d surveillance_db \
  -c "SELECT first_name, last_name, email, status FROM surveillance_agentregistrationrequest;"
```

## Support

En cas de problème:
1. Vérifier logs: `docker-compose logs backend --tail=100`
2. Vérifier frontend: `docker-compose logs frontend --tail=50`
3. Tester API directement:
   ```bash
   curl -X POST http://localhost:8000/api/v1/surveillance/registration-requests/ \
     -H "Content-Type: application/json" \
     -d '{"nin":"123","email":"test@test.com","first_name":"Test",...}'
   ```

---

**✅ Système Prêt pour Soutenance**

Le workflow complet est fonctionnel:
- Page publique professionnelle
- Formulaire complet avec validation
- Gestion maintenancier intuitive
- Création automatique compte + rendez-vous
- Notifications claires
- UI moderne et responsive
