# Spécifications Fonctionnelles - Plateforme de Monitoring Agricole

## 1. Contexte et Vision

Système de surveillance agricole autonome utilisant l'intelligence artificielle (YOLOv8) pour détecter les intrusions en temps réel et protéger les exploitations agricoles contre les menaces (animaux, intrus humains).

### Principes Architecturaux
- **Séparation des Responsabilités** : Chaque module a une responsabilité unique et clairement définie
- **Isolation des Rôles** : Maintenancier (administration) et Agent Agricole (surveillance) ont des périmètres fonctionnels distincts et étanches
- **Sécurité par Conception** : Authentification JWT, isolation des flux vidéo, principe du moindre privilège

---

## 2. Acteurs et Rôles

### 2.1 Maintenancier (Administrateur Système)
**Responsabilités :**
- Gestion du cycle de vie des comptes agents (création, activation, désactivation)
- Coordination logistique des installations (rendez-vous, affectation techniciens)
- Support technique niveau 1 (vérification état caméra : online/offline)

**Restrictions de Sécurité :**
- ❌ **INTERDIT** : Accès aux flux vidéo en direct des exploitations
- ❌ **INTERDIT** : Consultation des détections et alertes privées des agents
- ✅ **AUTORISÉ** : Visualisation des localisations GPS (uniquement pour les abonnements Premium avec installation)

### 2.2 Agent Agricole (Utilisateur Final)
**Responsabilités :**
- Surveillance en temps réel de son exploitation via flux vidéo sécurisé
- Consultation de l'historique des détections et alertes
- Gestion de son profil (changement de mot de passe obligatoire au premier accès)

**Droits Exclusifs :**
- ✅ **Seul propriétaire** de ses données de surveillance
- ✅ **Seul visualiseur** du flux vidéo de ses caméras
- ✅ **Seul gestionnaire** de ses périmètres agricoles sur la carte

---

## 3. Flux d'Authentification et Sécurité

### 3.1 Processus de Connexion Agent Agricole

```
┌─────────────────────────────────────────────────────┐
│ ÉTAPE 1 : Première Connexion                        │
├─────────────────────────────────────────────────────┤
│ • Identifiant : Email                               │
│ • Mot de passe provisoire : NIN                     │
│ • Flag système : must_change_password = TRUE        │
└─────────────────────────────────────────────────────┘
           ↓
┌─────────────────────────────────────────────────────┐
│ ÉTAPE 2 : Barrière de Sécurité                     │
├─────────────────────────────────────────────────────┤
│ • Redirection forcée vers /change-password          │
│ • Validation complexité mot de passe                │
│ • Flag système : must_change_password = FALSE       │
└─────────────────────────────────────────────────────┘
           ↓
┌─────────────────────────────────────────────────────┐
│ ÉTAPE 3 : Accès Dashboard                          │
├─────────────────────────────────────────────────────┤
│ • Accès complet aux fonctionnalités de surveillance │
└─────────────────────────────────────────────────────┘
```

**Règle de Gestion RG-001** : Tant que `must_change_password == TRUE`, toutes les requêtes API (sauf `/change-password`) retournent une erreur `403 Forbidden` avec message explicite.

### 3.2 Processus de Connexion Maintenancier

- Identifiant : Email
- Mot de passe : Défini lors de la création du compte (pas de NIN)
- Accès direct au dashboard administrateur après authentification JWT

---

## 4. Fonctionnalités par Rôle

### 4.1 Dashboard Maintenancier

#### 4.1.1 Gestion des Comptes Agents
| Opération | Endpoint API | Méthode | Description |
|-----------|--------------|---------|-------------|
| Créer agent | `/api/users/` | POST | Enregistrement avec NIN comme mot de passe initial |
| Lister agents | `/api/users/` | GET | Vue d'ensemble avec filtres (actif/inactif, région) |
| Activer agent | `/api/users/{id}/activate/` | PATCH | Passage `is_active = True` |
| Désactiver agent | `/api/users/{id}/deactivate/` | PATCH | Passage `is_active = False` (suspension) |
| Supprimer agent | `/api/users/{id}/` | DELETE | Suppression définitive (cascade sur données associées) |

**Règle de Gestion RG-002** : Seul le maintenancier peut créer/modifier/supprimer des comptes agents.

#### 4.1.2 Gestion des Rendez-vous d'Installation
| Statut | Description | Actions possibles |
|--------|-------------|-------------------|
| `PENDING` | Demande en attente | Assigner technicien → `SCHEDULED` |
| `SCHEDULED` | Technicien assigné | Marquer comme terminé → `DONE` |
| `DONE` | Installation complétée | Aucune |
| `CANCELLED` | Annulé par agent/maintenancier | Aucune |

**Workflow d'Assignation :**
1. Agent crée une demande de rendez-vous (`/api/surveillance/appointments/`)
2. Maintenancier consulte la file d'attente triée par date de création
3. Maintenancier assigne un technicien disponible dans la région
4. Système envoie notification par email/SMS (optionnel)

**Règle de Gestion RG-003** : Un technicien ne peut être assigné qu'à un seul rendez-vous par plage horaire.

#### 4.1.3 Cartographie des Installations (Premium uniquement)
- **Condition d'Accès** : Abonnement Premium actif (`subscription.plan == 'PREMIUM'`)
- **Données Visibles** : Coordonnées GPS des périmètres clôturés avec délimitation polygonale
- **Usage** : Planification logistique des interventions techniques

**Règle de Gestion RG-004** : Les périmètres des abonnements Standard ne sont pas visibles sur la carte du maintenancier.

#### 4.1.4 Support Technique
- **Vérification État Caméra** : Statut binaire (Online/Offline) via heartbeat Redis
- **Logs Système** : Accès aux logs techniques (erreurs connexion, performances)
- **Restrictions** : Aucun accès aux captures d'écran ni aux détections

### 4.2 Dashboard Agent Agricole

#### 4.2.1 Surveillance en Temps Réel
**Protocole WebSocket** : `wss://domain/ws/surveillance/{camera_id}/?token={jwt_token}`

**Format des Messages :**
```json
{
  "type": "camera_frame",
  "frame_b64": "data:image/jpeg;base64,...",
  "detections": [
    {
      "label": "cow",
      "confidence": 0.89,
      "bbox": [x1, y1, x2, y2],
      "danger_level": "MEDIUM",
      "color": "#EF9F27"
    }
  ],
  "timestamp": "2026-05-07T14:32:10.123Z"
}
```

**Règle de Gestion RG-005** : Un agent ne peut se connecter qu'aux caméras dont il est propriétaire (`camera.agent_id == user.id`). Tentative d'accès à une caméra tierce → Erreur `403 Forbidden`.

#### 4.2.2 Historique des Détections
| Filtre | Type | Description |
|--------|------|-------------|
| `date_debut` | DateTime | Début de la période |
| `date_fin` | DateTime | Fin de la période |
| `danger_level` | Enum | HIGH, MEDIUM, LOW |
| `label` | String | Type d'objet détecté (person, cow, bird...) |
| `camera_id` | UUID | Identifiant de la caméra |

**Endpoint** : `GET /api/surveillance/detections/?date_debut=...&danger_level=HIGH`

**Règle de Gestion RG-006** : Les détections sont automatiquement filtrées par `agent_id` (principe du moindre privilège).

#### 4.2.3 Alertes Critiques
- **Déclenchement** : Détection de niveau `HIGH` (ex: présence humaine)
- **Mécanisme Anti-Spam** : Cooldown de 15 secondes par type d'objet et par caméra (configurable via `ALERT_COOLDOWN_SECONDS`)
- **Canaux de Notification** :
  - WebSocket (temps réel)
  - Email (optionnel, si configuré)
  - SMS (optionnel, intégration Twilio/autre)

**Format Message Alerte :**
```json
{
  "type": "camera_alert",
  "message": "ALERTE CRITIQUE : person détecté sur Caméra Nord !",
  "level": "HIGH",
  "detection_id": "uuid",
  "timestamp": "2026-05-07T14:32:15.456Z"
}
```

**Règle de Gestion RG-007** : Les alertes `HIGH` entraînent la capture et l'upload automatique de la frame sur MinIO pour preuve.

#### 4.2.4 Cartographie du Périmètre
- **Visualisation** : Polygone délimitant les bordures du champ sur une carte interactive (Leaflet/OpenStreetMap)
- **Données Affichées** :
  - Superficie en hectares
  - Position de la caméra (marqueur avec icône)
  - Zones de couverture (champ de vision estimé)

**Règle de Gestion RG-008** : Chaque agent ne voit que ses propres périmètres.

#### 4.2.5 Gestion du Profil
| Opération | Endpoint | Méthode | Description |
|-----------|----------|---------|-------------|
| Consulter profil | `/api/users/profile/` | GET | Informations personnelles |
| Changer mot de passe | `/api/users/change-password/` | POST | Validation complexité + ancien MDP |
| Modifier coordonnées | `/api/users/profile/` | PATCH | Téléphone, adresse |

**Règle de Gestion RG-009** : Le changement de mot de passe nécessite l'ancien mot de passe (même si c'est le NIN initial).

---

## 5. Architecture Technique et Flux de Données

### 5.1 Pipeline de Détection en Temps Réel

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Caméra     │────▶│  Capture     │────▶│   Encodage   │
│  (OpenCV)    │     │  Frame       │     │   JPEG       │
└──────────────┘     └──────────────┘     └──────────────┘
                                                  │
                                                  ▼
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  Diffusion   │◀────│ Détection IA │◀────│    Cache     │
│  WebSocket   │     │  (YOLOv8)    │     │    Redis     │
└──────────────┘     └──────────────┘     └──────────────┘
       │                     │
       ▼                     ▼
┌──────────────┐     ┌──────────────┐
│   Frontend   │     │  Sauvegarde  │
│   (React)    │     │  Async       │
└──────────────┘     │  (Celery)    │
                     └──────────────┘
                            │
                            ▼
                     ┌──────────────┐
                     │  PostgreSQL  │
                     │  + MinIO     │
                     └──────────────┘
```

### 5.2 Séparation des Responsabilités (Clean Code)

Chaque composant du pipeline a **UNE SEULE RESPONSABILITÉ** :

#### Module `camera/capture.py` (Thread de Capture)
- **Responsabilité** : Acquisition des frames depuis la caméra physique
- **Dépendances** : OpenCV, Threading
- **Sorties** : Frame brute (numpy array)

#### Module `ai_engine/detector.py` (Singleton YOLO)
- **Responsabilité** : Analyse d'image et détection d'objets
- **Dépendances** : Ultralytics YOLOv8, Cache Redis
- **Sorties** : Liste de détections avec bounding boxes

#### Module `ai_engine/danger_scorer.py` (Pur Function)
- **Responsabilité** : Mapping label → niveau de dangerosité
- **Dépendances** : Aucune (configuration via variables d'environnement)
- **Sorties** : `{'level': 'HIGH', 'color': '#E24B4A'}`

#### Module `ai_engine/cache.py` (Service de Cache)
- **Responsabilité** : Mise en cache des détections pour frames similaires
- **Dépendances** : Redis
- **Optimisation** : Réduit charge CPU de ~70% en production

#### Module `ai_engine/tasks.py` (Workers Celery)
- **Responsabilité** : Sauvegarde asynchrone des détections + alertes
- **Dépendances** : PostgreSQL, MinIO, Redis (cooldown alertes)
- **Principe** : Traitement en arrière-plan pour ne pas bloquer le flux temps réel

#### Module `camera/consumer.py` (WebSocket Handler)
- **Responsabilité** : Gestion des connexions WebSocket bidirectionnelles
- **Dépendances** : Django Channels, JWT Middleware
- **Sécurité** : Validation token + vérification propriété caméra

**Règle d'Architecture RA-001** : Une fonction ne doit jamais contenir d'appels à d'autres fonctions métier complexes. Elle délègue via des services/modules.

**Exemple Violation :**
```python
# ❌ MAUVAIS : capture.py fait TOUT
def run(self):
    frame = self.capture_frame()
    detections = self.analyze_with_yolo(frame)  # IA dans capture !
    danger = self.calculate_danger(detections)  # Scoring dans capture !
    self.save_to_db(detections)  # DB dans capture !
    self.send_websocket(frame)
```

**Exemple Correct :**
```python
# ✅ BON : capture.py délègue
def run(self):
    frame = self.capture_frame()
    detections = self.detector.analyze(frame)  # Service IA externe
    self.broadcast_frame(frame, detections)  # WebSocket uniquement
    self.enqueue_save_task(detections)  # Celery pour DB
```

---

## 6. Règles de Gestion Récapitulatives

| ID | Règle | Priorité |
|----|-------|----------|
| RG-001 | Blocage API si `must_change_password == TRUE` | Critique |
| RG-002 | Seul maintenancier crée/modifie comptes | Critique |
| RG-003 | Un technicien = un rendez-vous par plage horaire | Haute |
| RG-004 | Périmètres Premium uniquement visibles maintenancier | Moyenne |
| RG-005 | Agent accède uniquement à ses caméras | Critique |
| RG-006 | Détections auto-filtrées par `agent_id` | Critique |
| RG-007 | Alertes HIGH → capture frame + upload MinIO | Haute |
| RG-008 | Agent voit uniquement ses périmètres | Critique |
| RG-009 | Changement MDP nécessite ancien MDP | Haute |

---

## 7. Principes de Développement (Clean Code)

### 7.1 DRY (Don't Repeat Yourself)
- **Exemple** : La logique de validation JWT est centralisée dans `core/ws_jwt_middleware.py`
- **Anti-pattern** : Dupliquer la validation dans chaque consumer → ❌ INTERDIT

### 7.2 YAGNI (You Aren't Gonna Need It)
- **Exemple** : Pas de système de notifications SMS/email tant qu'il n'y a pas de cas d'usage validé
- **Anti-pattern** : Créer une abstraction `NotificationService` avec 10 canaux "au cas où" → ❌ SURENGINEERING

### 7.3 Single Responsibility Principle (SRP)
- **Exemple** : `danger_scorer.py` fait UNIQUEMENT le scoring, pas de log, pas de DB, pas d'IO
- **Anti-pattern** : Une classe `CameraManager` qui fait capture + IA + DB + WebSocket → ❌ GOD OBJECT

### 7.4 Principe de Moindre Surprise
- **Exemple** : Une fonction nommée `capture_frame()` retourne une frame, JAMAIS un booléen ou une exception custom
- **Anti-pattern** : `get_user()` qui modifie la base de données → ❌ SIDE-EFFECT INATTENDU

---

## 8. Cas d'Usage Détaillés

### UC-001 : Création d'un Compte Agent (Maintenancier)
**Acteur** : Maintenancier  
**Préconditions** : Authentifié avec rôle `maintenancier`  
**Postconditions** : Compte agent créé avec `must_change_password = TRUE`

**Scénario Nominal :**
1. Maintenancier accède à `/dashboard/agents/create`
2. Formulaire : NIN, Email, Nom, Prénom, Téléphone, Région
3. Validation backend :
   - NIN unique (14 caractères pour Sénégal)
   - Email unique
   - Format téléphone : `+221 XX XXX XX XX`
4. Création user avec `password = NIN` hashé
5. Flag `must_change_password = TRUE`
6. Email automatique envoyé avec identifiants provisoires

**Scénario Alternatif 1 : NIN déjà existant**
- Système retourne erreur `409 Conflict : "Un compte avec ce NIN existe déjà"`
- Maintenancier vérifie si doublon ou erreur de saisie

### UC-002 : Première Connexion Agent
**Acteur** : Agent Agricole  
**Préconditions** : Compte créé par maintenancier  
**Postconditions** : Mot de passe changé, accès dashboard accordé

**Scénario Nominal :**
1. Agent saisit Email + NIN sur `/login`
2. Backend valide identifiants → JWT généré
3. Middleware détecte `must_change_password = TRUE`
4. Redirection forcée `/change-password` (toute autre route → 403)
5. Agent saisit :
   - Ancien mot de passe (NIN)
   - Nouveau mot de passe (8+ caractères, majuscule, chiffre, caractère spécial)
   - Confirmation
6. Backend vérifie complexité + correspondance
7. Hash du nouveau MDP + `must_change_password = FALSE`
8. Redirection `/dashboard`

**Scénario Alternatif 1 : Nouveau mot de passe trop faible**
- Système retourne erreur `400 Bad Request : "Le mot de passe doit contenir..."`
- Agent reformule

### UC-003 : Surveillance Temps Réel
**Acteur** : Agent Agricole  
**Préconditions** : Authentifié, caméra active  
**Postconditions** : Flux vidéo affiché avec détections

**Scénario Nominal :**
1. Agent clique sur caméra "Champ Nord"
2. Frontend ouvre WebSocket `wss://.../ws/surveillance/{camera_id}/?token={jwt}`
3. Backend valide JWT + vérifie `camera.agent_id == user.id`
4. Thread de capture démarre si pas actif
5. Boucle (15 FPS) :
   - Capture frame
   - Analyse YOLO (avec cache Redis)
   - Encodage JPEG Base64
   - Envoi WebSocket au frontend
6. Frontend affiche flux + bounding boxes avec couleurs (rouge/orange/vert)

**Scénario Alternatif 1 : Caméra offline**
- Backend retourne message `{"type": "error", "message": "Caméra indisponible"}`
- Frontend affiche placeholder "Connexion caméra perdue"

### UC-004 : Alerte Critique (Détection Humain)
**Acteur** : Système (automatique)  
**Préconditions** : Flux actif, objet `person` détecté avec confiance > 0.5  
**Postconditions** : Alerte créée, frame sauvegardée, agent notifié

**Scénario Nominal :**
1. YOLO détecte `label = "person"`, `confidence = 0.87`
2. `danger_scorer.get_danger_score("person")` → `{"level": "HIGH", "color": "#E24B4A"}`
3. Thread capture envoie détection à Celery task `save_detection_task.delay(...)`
4. Worker Celery :
   - Vérifie cooldown Redis (`alert:{camera_id}:person` existe ?)
   - Si non existe : crée clé avec TTL 15s
   - Upload frame sur MinIO : `detections/{camera_id}/{detection_id}.jpg`
   - Insert PostgreSQL : table `Detection` + table `Alert`
   - Envoie WebSocket : `{"type": "camera_alert", "message": "ALERTE CRITIQUE..."}`
5. Frontend affiche notification toast rouge + son d'alerte

**Scénario Alternatif 1 : Cooldown actif**
- Worker Celery détecte clé Redis existante
- Sauvegarde détection en DB mais SANS créer alerte ni notification
- Évite spam d'alertes identiques en boucle

---

## 9. Métriques de Qualité et Performance

### 9.1 KPI Fonctionnels
| Indicateur | Cible | Mesure |
|------------|-------|--------|
| Latence WebSocket (frame → affichage) | < 200ms | Monitoring Prometheus |
| Taux de détection YOLO (recall) | > 85% | Tests manuels benchmark |
| Faux positifs alertes HIGH | < 5% | Logs production / feedbacks agents |
| Temps moyen assignation technicien | < 48h | Dashboard maintenancier |

### 9.2 KPI Techniques
| Indicateur | Cible | Mesure |
|------------|-------|--------|
| Taux cache hit Redis (YOLO) | > 60% | Méthode `YOLOCache.get_cache_stats()` |
| CPU usage backend (par caméra active) | < 15% | Grafana + cAdvisor |
| Temps réponse API REST (p95) | < 500ms | Prometheus histogram |
| Disponibilité WebSocket | > 99% | Uptime monitoring |

### 9.3 Couverture Tests
- **Tests Unitaires** : > 80% couverture (pytest + coverage)
- **Tests Intégration** : Scénarios UC-001 à UC-004 automatisés
- **Tests End-to-End** : Selenium/Playwright pour flux complets

---

## 10. Glossaire Technique

| Terme | Définition |
|-------|------------|
| **NIN** | Numéro d'Identification National (ex: carte d'identité Sénégal) |
| **Bounding Box** | Coordonnées [x1, y1, x2, y2] délimitant un objet détecté |
| **Cooldown** | Période de latence anti-spam entre deux alertes identiques |
| **JWT** | JSON Web Token, standard d'authentification stateless |
| **WebSocket** | Protocole bidirectionnel persistant (RFC 6455) |
| **YOLO** | You Only Look Once, architecture CNN temps réel |
| **MinIO** | Stockage objet compatible S3 (alternative open-source) |
| **Celery** | Framework Python de tâches asynchrones distribuées |

---

## 11. Conclusion

Ce document constitue le **contrat fonctionnel** entre l'équipe technique et le jury. Toute modification des règles de gestion ou de l'architecture doit faire l'objet d'un avenant validé.

**Principes de Qualité Garantis :**
- ✅ Séparation stricte des rôles (maintenancier vs agent)
- ✅ Code modulaire avec responsabilités uniques (SRP)
- ✅ Pas de duplication logique (DRY)
- ✅ Pas de surengineering (YAGNI)
- ✅ Sécurité par défaut (JWT, isolation flux, RBAC)

**Date de Validation** : 2026-05-07  
**Version** : 1.0  
**Auteur** : Équipe Projet Alamine Bouba
