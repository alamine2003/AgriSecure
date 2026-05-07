# 📍 WORKFLOW COMPLET AVEC LOCALISATION GPS

## Vue d'ensemble

Ce document décrit le workflow complet de l'application AgriWatch, du point d'inscription publique jusqu'à la surveillance active avec localisation GPS des équipements.

---

## 🔄 Processus Complet (6 Étapes)

### ÉTAPE 1: 📝 Inscription Publique

**Page:** `/register-agent`

L'agent agricole remplit le formulaire d'inscription avec:
- NIN (Numéro d'Identification National)
- Email
- Nom et Prénom
- Téléphone
- Région et Localité
- Adresse complète
- Superficie de l'exploitation

**Backend:** 
- Crée un `AgentRegistrationRequest` avec status `PENDING`
- Validation: NIN et email uniques
- Aucun compte utilisateur créé à ce stade

---

### ÉTAPE 2: ✅ Approbation Maintenancier

**Page:** `/maintenancier/inscription`

Le maintenancier:
1. Consulte les demandes en attente (stats cards + filtres)
2. Examine les détails de chaque demande (3 colonnes: info perso, localisation, actions)
3. **Approuve** ou **Rejette** la demande

**Action "Approuver":**
```javascript
// Backend: AgentRegistrationRequestViewSet.approve()
1. Crée compte agent (CustomUser)
   - email: depuis demande
   - password: NIN (mot de passe initial)
   - role: agent_agricole
   - is_active: False (sera activé après installation)
   - must_change_password: True

2. Crée rendez-vous installation automatique (InstallationAppointment)
   - agent: lien vers compte créé
   - region, locality, address: depuis demande
   - status: PENDING

3. Met à jour demande: status = APPROVED

4. Log d'audit (AuditLog)
   - action: APPROVE_REQUEST
   - user: maintenancier
   - details: email agent, région, date
```

**Action "Rejeter":**
- Modal avec raison obligatoire
- Status = REJECTED
- Agent n'est PAS créé
- Log d'audit: REJECT_REQUEST

---

### ÉTAPE 3: 📅 Gestion Rendez-vous

**Page:** `/maintenancier/rendez-vous`

Le maintenancier visualise tous les rendez-vous:
- **Stats cards:** Pending, Scheduled, Done, Cancelled
- **Filtres:** Par status, recherche par agent/région
- **Cartes détaillées:** 4 colonnes par rendez-vous
  1. Info Agent (nom, email)
  2. Localisation (région, localité, adresse, GPS si disponible)
  3. Planning (dates création, planification, complétion)
  4. Actions (bouton "Terminer Installation")

**Status:**
- `PENDING`: En attente d'installation
- `SCHEDULED`: Planifié (date définie)
- `DONE`: Installation terminée
- `CANCELLED`: Annulé

---

### ÉTAPE 4: 🔧 Installation Équipement

**Action:** Bouton "Terminer Installation" sur rendez-vous PENDING ou SCHEDULED

**Modal d'installation:**

1. **Coordonnées GPS du lieu** (Obligatoire)
   ```
   Latitude: 14.xxxxxxx
   Longitude: -17.xxxxxxx
   ```

2. **Caméras installées** (Minimum 1)
   - Nom de la caméra
   - Latitude GPS (optionnel, hérite du lieu par défaut)
   - Longitude GPS (optionnel, hérite du lieu par défaut)
   - Bouton "Ajouter Caméra" pour multiples caméras

3. **Notes techniques**
   - Détails d'installation
   - Configurations
   - Observations

**Backend: `complete_installation` action**

```python
def complete_installation(self, request, pk=None):
    """
    1. Met à jour InstallationAppointment:
       - status = DONE
       - completed_at = now()
       - latitude, longitude (lieu)
       - equipment_installed (JSON)
       - installation_notes
    
    2. Active le compte agent:
       - agent.is_active = True
    
    3. Crée les caméras:
       Pour chaque équipement dans equipment_installed:
       - Camera.create(
           name=equipment.name,
           agent=agent,
           latitude=equipment.latitude ou lieu.latitude,
           longitude=equipment.longitude ou lieu.longitude,
           installed_at=now(),
           is_active=True
         )
    
    4. Log d'audit:
       - action: COMPLETE_INSTALLATION
       - details: cameras_created, GPS location
    
    5. Retourne:
       - appointment mis à jour
       - liste des caméras créées
       - confirmation activation agent
    """
```

---

### ÉTAPE 5: 🚀 Activation Automatique

**Automatique après complétion installation:**

✅ **Compte Agent Activé**
- `is_active = True`
- L'agent peut maintenant se connecter

✅ **Caméras Créées**
- Chaque caméra est enregistrée dans la DB
- Lien avec l'agent (`agent_id`)
- Coordonnées GPS individuelles
- Status `is_active = True`
- Date d'installation enregistrée

✅ **Rendez-vous Marqué DONE**
- Status final
- Date de complétion
- Historique complet

---

### ÉTAPE 6: 🎮 Dashboard Agent & Surveillance

**Login Agent:**
- URL: `/login`
- Email: celui de l'inscription
- Password: NIN (mot de passe initial)
- Force changement password à première connexion

**Dashboard Agent:** `/agent/dashboard`

L'agent accède à:

1. **Vue Caméras**
   - Liste de toutes ses caméras installées
   - Localisation GPS de chaque caméra
   - Streaming vidéo en temps réel (WebSocket)
   - Status actif/inactif

2. **Définition Périmètre Agricole**
   - Outil de dessin sur carte
   - Points GPS formant polygone
   - Calcul automatique surface (hectares)
   - Enregistrement dans `FieldPerimeter`

3. **Surveillance Temps Réel**
   - YOLOv8 détection intrusions
   - Détection objets: person, bird, cat, dog, etc.
   - Niveau de danger: LOW, MEDIUM, HIGH
   - Alertes automatiques si intrusion

4. **Historique & Alertes**
   - Détections passées
   - Alertes générées
   - Frames capturées
   - Horodatage précis

---

## 🗺️ Architecture Localisation GPS

### Modèle Camera

```python
class Camera(models.Model):
    name = CharField(max_length=100)
    location = CharField(max_length=255)  # Description textuelle
    latitude = DecimalField(max_digits=10, decimal_places=7)   # GPS
    longitude = DecimalField(max_digits=10, decimal_places=7)  # GPS
    installed_at = DateTimeField()  # Date installation
    agent = ForeignKey(User)
    is_active = BooleanField()
```

### Modèle InstallationAppointment

```python
class InstallationAppointment(models.Model):
    agent = ForeignKey(User)
    region = CharField(choices=REGIONS)
    locality = CharField(max_length=120)
    address = CharField(max_length=255)
    
    # GPS lieu installation
    latitude = DecimalField(max_digits=10, decimal_places=7)
    longitude = DecimalField(max_digits=10, decimal_places=7)
    
    # Équipement installé
    equipment_installed = JSONField()  # Liste caméras avec GPS
    installation_notes = TextField()
    
    # Dates
    scheduled_at = DateTimeField()
    completed_at = DateTimeField()
    
    status = CharField(choices=STATUS_CHOICES)
```

### Modèle FieldPerimeter

```python
class FieldPerimeter(models.Model):
    agent = ForeignKey(User)
    name = CharField(max_length=100)
    
    # Polygone GPS
    coordinates = JSONField()  # [[lat1, lng1], [lat2, lng2], ...]
    
    # Centre pour affichage carte
    center_lat = DecimalField(max_digits=10, decimal_places=7)
    center_lng = DecimalField(max_digits=10, decimal_places=7)
    
    # Surface calculée
    area_hectares = DecimalField(max_digits=10, decimal_places=2)
    
    def calculate_area(self):
        # Algorithme Shoelace pour calculer surface polygone
```

---

## 📊 Vue Maintenancier - Localisation Globale

Le maintenancier a une **vue d'ensemble** de toutes les installations:

### Dashboard avec Carte

**Affichage sur carte interactive:**
- 📍 Marqueurs pour chaque caméra installée
- 🟢 Vert: caméra active
- 🔴 Rouge: caméra inactive
- Info au clic: agent, nom caméra, date installation

**Filtres:**
- Par région
- Par agent
- Par status (actif/inactif)
- Par date d'installation

**Statistiques:**
- Nombre total de caméras déployées
- Distribution par région
- Taux d'utilisation
- Alertes par zone

---

## 🎯 Point Culminant du Projet

### Surveillance Active en Temps Réel

```
┌─────────────────────────────────────────────────────┐
│           AGENT AGRICOLE - DASHBOARD                │
├─────────────────────────────────────────────────────┤
│                                                     │
│  🎥 Caméra 1 (14.7123, -17.4567)    🟢 Active      │
│  ┌─────────────────────────────────────┐           │
│  │                                     │           │
│  │     [Streaming Vidéo Temps Réel]   │           │
│  │                                     │           │
│  │  YOLOv8 Detection:                 │           │
│  │  ▪ Person détecté (98% conf)       │           │
│  │  ▪ Danger: HIGH ⚠️                  │           │
│  │  ▪ Alerte générée: 14h32           │           │
│  │                                     │           │
│  └─────────────────────────────────────┘           │
│                                                     │
│  📍 PÉRIMÈTRE AGRICOLE                              │
│  ┌─────────────────────────────────────┐           │
│  │         [Carte Interactive]         │           │
│  │                                     │           │
│  │    🟩🟩🟩🟩🟩  Périmètre défini     │           │
│  │    🟩      🟩  Surface: 5.2 ha      │           │
│  │    🟩  📍  🟩  3 caméras            │           │
│  │    🟩      🟩  Coverage: 95%        │           │
│  │    🟩🟩🟩🟩🟩                        │           │
│  │                                     │           │
│  └─────────────────────────────────────┘           │
│                                                     │
│  🚨 ALERTES RÉCENTES                                │
│  ▪ 14h32 - Intrusion humaine détectée (Caméra 1)   │
│  ▪ 12h15 - Animal détecté (Caméra 2) - LOW         │
│  ▪ 09h47 - Mouvement suspect (Caméra 1) - MEDIUM   │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### Technologies Clés

**Backend:**
- Django 5 + Django REST Framework
- Django Channels (WebSocket ASGI)
- YOLOv8n (Computer Vision)
- PostgreSQL (données structurées)
- Redis (cache + channels layer)
- MinIO (stockage frames)

**Frontend:**
- React 18 + Vite 5
- TanStack Query (real-time sync)
- TailwindCSS + shadcn/ui
- Lucide React (icons)
- WebSocket client

**AI/ML:**
- YOLOv8n (détection objets)
- OpenCV (capture vidéo)
- Système de scoring danger
- Cache intelligent (Redis)

**Infrastructure:**
- Docker Compose
- Nginx (reverse proxy)
- Multi-threaded camera capture
- JWT Authentication

---

## 🔐 Sécurité & Permissions

### Rôles

**Maintenancier:**
- Gestion complète agents
- Gestion rendez-vous
- Complétion installations
- Vue globale toutes caméras
- Accès tous périmètres
- Statistiques globales

**Agent Agricole:**
- Vue uniquement SES caméras
- Définition SON périmètre
- SES détections et alertes
- Changement password forcé 1ère connexion
- Compte inactif jusqu'à installation

### Audit & Traçabilité

**AuditLog enregistre:**
- CREATE_AGENT
- APPROVE_REQUEST
- REJECT_REQUEST
- COMPLETE_INSTALLATION
- CREATE_CAMERA
- CREATE_PERIMETER
- UPDATE_AGENT
- ACTIVATE_AGENT
- DEACTIVATE_AGENT

**Chaque log contient:**
- User (qui)
- Action (quoi)
- Target (sur qui/quoi)
- Details (JSON avec contexte)
- IP address
- User agent
- Timestamp

---

## 📦 Déploiement

### Script Automatique

```bash
deploy-complete-workflow.bat
```

**Étapes automatisées:**
1. Vérification fichiers V3
2. Backup versions actuelles
3. Remplacement fichiers frontend
4. Migrations Django (Camera + InstallationAppointment)
5. Redémarrage backend
6. Redémarrage frontend
7. Attente stabilisation (20s)

### Migrations Créées

```python
# Migration pour Camera
- Ajout champ latitude (DecimalField nullable)
- Ajout champ longitude (DecimalField nullable)
- Ajout champ installed_at (DateTimeField nullable)

# Migration pour InstallationAppointment
- Ajout champ latitude (DecimalField nullable)
- Ajout champ longitude (DecimalField nullable)
- Ajout champ equipment_installed (JSONField nullable)
- Ajout champ installation_notes (TextField)
- Ajout champ completed_at (DateTimeField nullable)

# Migration pour AuditLog
- Ajout choices: COMPLETE_INSTALLATION, CREATE_CAMERA, CREATE_PERIMETER
```

---

## 🎓 Pour la Soutenance

### Démonstration Complète (10-15 minutes)

**1. Inscription Publique (2 min)**
- Montrer page `/register-agent`
- Remplir formulaire avec vraies données
- Soumission et confirmation

**2. Approbation Maintenancier (2 min)**
- Login maintenancier
- Dashboard moderne (glassmorphism)
- Page demandes avec stats
- Approuver la demande
- Montrer création compte + rendez-vous

**3. Complétion Installation (3 min)**
- Page rendez-vous
- Sélectionner rendez-vous créé
- Ouvrir modal "Terminer Installation"
- Entrer GPS (exemple: Dakar 14.7167, -17.4677)
- Ajouter 2-3 caméras avec GPS
- Notes techniques
- Valider installation
- Montrer activation automatique

**4. Dashboard Agent (3 min)**
- Login avec email + NIN
- Changement password obligatoire
- Dashboard agent
- Voir caméras avec localisation
- Définir périmètre sur carte (dessin polygone)
- Enregistrer périmètre

**5. Surveillance Temps Réel (3 min)**
- Streaming caméra WebSocket
- YOLOv8 détection en direct
- Génération alerte
- Historique détections
- Dashboard maintenancier: vue globale

**6. Carte Globale Maintenancier (2 min)**
- Vue toutes caméras installées
- Marqueurs avec info
- Filtres par région
- Statistiques déploiement

### Points Forts à Souligner

✅ **Workflow complet automatisé**
- De l'inscription publique à la surveillance active
- Aucune étape manuelle côté agent
- Activation automatique post-installation

✅ **Localisation GPS précise**
- Coordonnées pour chaque caméra
- Périmètre agricole avec polygone
- Vue globale sur carte

✅ **Intelligence Artificielle**
- YOLOv8 détection temps réel
- Scoring danger automatique
- Alertes intelligentes

✅ **Interfaces Modernes**
- Design glassmorphism
- Animations fluides
- Responsive et intuitif

✅ **Sécurité & Traçabilité**
- Permissions granulaires
- Audit log complet
- JWT authentication

✅ **Scalabilité**
- Architecture microservices
- WebSocket pour temps réel
- Cache intelligent Redis
- Multi-threading cameras

---

## 📞 Support & Documentation

**Fichiers clés:**
- `CLAUDE.md` - Instructions développement
- `WORKFLOW_COMPLET_LOCALISATION.md` - Ce document
- `TEST_WORKFLOW_COMPLET.md` - Tests étape par étape
- `NOUVEAU_DASHBOARD_MAINTENANCIER.md` - Features dashboard

**Scripts utiles:**
- `deploy-complete-workflow.bat` - Déploiement complet
- `check-babsba-v2.bat` - Vérifier compte
- `create-babsba-v2.bat` - Créer compte test
- `supprimer-compte-agent.bat` - Nettoyer compte

**URLs importantes:**
- Page publique: http://localhost:3000/register-agent
- Login: http://localhost:3000/login
- Dashboard maintenancier: http://localhost:3000/maintenancier/dashboard
- Demandes: http://localhost:3000/maintenancier/inscription
- Agents: http://localhost:3000/maintenancier/agents
- Rendez-vous: http://localhost:3000/maintenancier/rendez-vous

---

## 🚀 Prêt pour la Soutenance!

Le projet est maintenant **100% fonctionnel** avec:
- ✅ Workflow complet implémenté
- ✅ Localisation GPS opérationnelle
- ✅ Surveillance IA temps réel
- ✅ Interfaces ultra-modernes
- ✅ Traçabilité complète
- ✅ Documentation exhaustive

**Succès garanti! 🎉**
