# Architecture Logicielle — AgriWatch
> Plateforme de surveillance agricole par vision par ordinateur (YOLOv8)

---

## 1. Architecture Globale du Système

```mermaid
flowchart TD
    %% ── Acteurs ───────────────────────────────────────────────────────────
    AGENT("👨‍🌾 Agent Agricole")
    MAINT("👨‍💼 Maintenancier")

    %% ── Point d'entrée ────────────────────────────────────────────────────
    NGINX["🔀 Nginx — Reverse Proxy\nPort 80 · TLS termination\nProxy /api/v1/* et /ws/*"]

    %% ── Frontend ──────────────────────────────────────────────────────────
    subgraph FE["⚛️  Frontend — React 18 + Vite"]
        subgraph FE_PAGES["Pages (React Router)"]
            P_AUTH["Login · RegisterAgent\nChangePassword"]
            P_AGENT["AgentDashboard · Surveillance\nPerimeterDefinitionAdvanced\nReports · AgentInbox\nSettings · Archive"]
            P_MAIN["MaintenancierDashboard\nAgentsManagement\nRegistrationRequests\nInstallationAppointments"]
        end
        subgraph FE_COMP["Composants — Atomic Design"]
            ATOMS["Atoms\nStatCard · Spinner · DeviceCard"]
            MOLS["Molecules\nAlertItem · CameraCard · PerimeterCard"]
            ORGS["Organisms\nStatsGrid · AlertsSection\nCamerasSection · PerimetersSection"]
            TMPL["Templates\nDashboardLayout"]
            UI_PRIM["UI Primitives\nButton · Dialog · FloatingInput\nFieldMapDrawer · DashboardMap\nMapPointPicker · NotificationBell"]
        end
        subgraph FE_SVC["Services & Infrastructure"]
            AXIOS["Axios Client\n+ Intercepteur JWT auto-refresh"]
            RQ["TanStack React Query\nCache serveur + invalidation"]
            UAUTH["useAuth Hook\nLocalStorage tokens"]
            GUARD["ProtectedRoute\nRequireRole"]
            LEAFLET["Leaflet.js\nCarte interactive · Dessin périmètres"]
        end
    end

    %% ── Backend ───────────────────────────────────────────────────────────
    subgraph BE["🐍 Backend — Django 5 + Daphne ASGI :8000"]
        subgraph WS_LAYER["WebSocket — Django Channels"]
            WS_CAM["ws/surveillance/camera_id/\n→ CameraConsumer\nStream vidéo temps réel"]
            WS_NOTIF["ws/notifications/\n→ NotificationConsumer\nAlertes temps réel"]
            JWT_MW["JwtAuthMiddleware\nAuthentification WS par token URL"]
        end
        subgraph REST_LAYER["REST API — /api/v1/"]
            API_AUTH["auth/\nlogin · verify-otp\nrefresh · change-password · profile"]
            API_USERS["users/\nCRUD utilisateurs"]
            API_SURV["surveillance/\ncameras · detections · alerts\nperimeters · appointments\ntechnicians · subscriptions\nregistration-requests · dashboard"]
            API_NOTIF["notifications/\nCRUD + envoi bulk"]
            API_REP["reports/\nGénération PDF"]
        end
        subgraph DJANGO_APPS["Applications Django"]
            APP_USERS["📦 users\nCustomUser · OTPCode · TrustedDevice\nRôles: agent_agricole · maintenancier\nPermissions: IsAgentAgricole\nIsMaintenancier · MustChangePassword"]
            APP_SURV["📦 surveillance\nCamera · Detection · Alert\nFieldPerimeter · InstallationAppointment\nTechnician · Subscription · Payment\nAgentRegistrationRequest · AuditLog"]
            APP_AI["📦 ai_engine\nYOLODetector (singleton YOLOv8n)\nDangerScorer (HIGH/MEDIUM/LOW)\nFrameCache Redis 30s TTL\nTâches Celery asynchrones"]
            APP_CAM["📦 camera\nCameraCapture (Thread OpenCV)\nStreamManager (registry)\nFrame encoder/reader\nDetectionProcessor · Filter"]
            APP_NOTIF["📦 notifications\nNotification · Template · Channel\nServices: Email · SMS\nNotificationConsumer WS"]
            APP_REP["📦 reports\nReport · PDFReportGenerator\nViews PDF dédiées"]
        end
    end

    %% ── Traitement asynchrone ─────────────────────────────────────────────
    subgraph ASYNC["⚙️  Celery — Traitement Asynchrone"]
        CEL_WORKER["Celery Worker\nDétections YOLO\nGénération alertes\nEnvoi notifications\nNettoyage frames"]
        CEL_BEAT["Celery Beat\nTâches périodiques planifiées\n(django-celery-beat)"]
    end

    %% ── Données ───────────────────────────────────────────────────────────
    subgraph DATA["🗄️  Couche de Données"]
        POSTGRES[("PostgreSQL 15\nToutes entités métier\nUUID primary keys")]
        REDIS[("Redis 7\nDB 0 — Broker Celery\nDB 1 — Channel Layers WS\nDB 2 — Cache frames YOLO")]
        MINIO[("MinIO\nObject Storage\nFrames annotées détectées")]
    end

    %% ── Monitoring ────────────────────────────────────────────────────────
    subgraph MON["📊 Monitoring Stack"]
        PROM["Prometheus :9090\nMétriques Django · Redis · Nginx\nPostgres · Celery"]
        GRAFANA["Grafana :3001\nDashboards temps réel"]
        LOKI["Loki :3100\nAgrégation logs"]
    end

    %% ── Connexions principales ────────────────────────────────────────────
    AGENT & MAINT -->|HTTPS| NGINX
    NGINX -->|"/* (statique)"| FE
    NGINX -->|/api/v1/*| REST_LAYER
    NGINX -->|/ws/*| WS_LAYER

    FE_SVC --> AXIOS & RQ
    AXIOS -->|HTTP + Bearer| REST_LAYER
    UAUTH -.->|WebSocket + token| WS_LAYER
    GUARD --> FE_PAGES

    API_AUTH --> APP_USERS
    API_SURV --> APP_SURV & APP_CAM
    API_NOTIF --> APP_NOTIF
    API_REP --> APP_REP

    JWT_MW --> WS_CAM & WS_NOTIF
    WS_CAM --> APP_CAM
    WS_NOTIF --> APP_NOTIF

    APP_CAM -->|frames vidéo| APP_AI
    APP_AI -->|tâches async| CEL_WORKER
    APP_SURV -->|événements| CEL_WORKER
    CEL_BEAT --> CEL_WORKER

    APP_USERS & APP_SURV & APP_NOTIF & APP_REP --> POSTGRES
    CEL_WORKER --> POSTGRES
    APP_AI --> REDIS
    APP_CAM --> REDIS
    CEL_WORKER & CEL_BEAT --> REDIS
    APP_AI -->|frames annotées| MINIO

    POSTGRES & REDIS & NGINX --> PROM
    PROM --> GRAFANA
    LOKI --> GRAFANA

    %% ── Styles ────────────────────────────────────────────────────────────
    classDef actor fill:#f59e0b,color:#000,stroke:#d97706,font-weight:bold,rx:8
    classDef proxy fill:#1d4ed8,color:#fff,stroke:#1e40af
    classDef data fill:#065f46,color:#fff,stroke:#047857
    classDef async fill:#7c3aed,color:#fff,stroke:#6d28d9
    classDef monitor fill:#92400e,color:#fff,stroke:#78350f

    class AGENT,MAINT actor
    class NGINX proxy
    class POSTGRES,REDIS,MINIO data
    class CEL_WORKER,CEL_BEAT async
    class PROM,GRAFANA,LOKI monitor
```

---

## 2. Pipeline Détection IA — Temps Réel

```mermaid
flowchart LR
    subgraph CAP["📹 Capture Vidéo"]
        CAM["Caméra IP\nRTSP · USB · Fichier"]
        CV["OpenCV\nCameraCapture\nThread daemon"]
    end

    subgraph AI["🤖 Moteur IA — ai_engine"]
        HASH["Frame Hash\n(shape + byte sample)"]
        CACHE{{"FrameCache\nRedis TTL 30s"}}
        YOLO["YOLODetector\nSingleton\nyolov8n.pt\nConfidence > seuil"]
        SCORER["DangerScorer\nperson → HIGH\nhorse/cow → MEDIUM\nbird/cat → LOW"]
    end

    subgraph PROC["⚙️ Traitement — Celery Worker"]
        SAVER["DetectionSaver\nPostgreSQL"]
        COOL{{"AlertCooldown\nAnti-spam Redis"}}
        NOTIF["AlertNotifier"]
        UPLOAD["MinioUploader\nFrame annotée JPEG"]
    end

    subgraph OUT["📤 Sorties"]
        WS_OUT["WebSocket\n→ Frontend\nStream temps réel"]
        EMAIL_OUT["Email\nSMTP"]
        SMS_OUT["SMS\nAPI externe"]
        PG_OUT[("PostgreSQL\nDetection + Alert")]
        MINIO_OUT[("MinIO\nFrame annotée")]
    end

    CAM -->|flux vidéo| CV
    CV -->|frame JPEG| HASH
    HASH --> CACHE
    CACHE -->|"MISS → détection"| YOLO
    CACHE -->|"HIT → résultat cached"| SCORER
    YOLO -->|classes + bbox| SCORER

    SCORER -->|score + métadonnées| SAVER
    SCORER -->|"si danger ≥ seuil"| COOL
    COOL -->|"non spammé → notifier"| NOTIF

    SAVER --> PG_OUT
    SAVER --> UPLOAD
    UPLOAD --> MINIO_OUT

    NOTIF --> WS_OUT & EMAIL_OUT & SMS_OUT
    CV -->|stream frames brutes| WS_OUT

    classDef ioNode fill:#1e40af,color:#fff,stroke:#1d4ed8
    classDef aiNode fill:#7c3aed,color:#fff,stroke:#6d28d9
    classDef procNode fill:#065f46,color:#fff,stroke:#047857
    classDef outNode fill:#92400e,color:#fff,stroke:#78350f
    classDef cacheNode fill:#b45309,color:#fff,stroke:#92400e

    class CAM,CV ioNode
    class YOLO,SCORER aiNode
    class SAVER,NOTIF,UPLOAD procNode
    class WS_OUT,EMAIL_OUT,SMS_OUT,PG_OUT,MINIO_OUT outNode
    class CACHE,COOL cacheNode
```

---

## 3. Flux d'Authentification — JWT + 2FA OTP

```mermaid
sequenceDiagram
    actor User as 👤 Utilisateur
    participant FE  as ⚛️ Frontend React
    participant API as 🐍 Django REST API
    participant DB  as 🗄️ PostgreSQL
    participant EML as 📧 Service Email

    rect rgb(30, 64, 175)
        Note over User,EML: Étape 1 — Connexion & OTP
        User  ->>  FE  : Saisit email + mot de passe
        FE    ->>  API : POST /api/v1/auth/login/
        API   ->>  DB  : Vérifier credentials (CustomUser)
        DB    -->> API : CustomUser {rôle, must_change_password}
        API   ->>  DB  : Créer OTPCode (6 chiffres, TTL 10 min)
        API   ->>  EML : Envoyer code OTP par email
        API   -->> FE  : {otp_required: true, user_id}
        FE    -->> User: Affiche saisie OTP
    end

    rect rgb(6, 95, 70)
        Note over User,EML: Étape 2 — Vérification OTP
        User  ->>  FE  : Saisit le code OTP
        FE    ->>  API : POST /api/v1/auth/verify-otp/
        API   ->>  DB  : Vérifier OTPCode (non expiré, non utilisé)
        DB    -->> API : Valide ✓
        API   ->>  DB  : Invalider OTPCode (usage unique)
        API   -->> FE  : {access_token, refresh_token, user {id, rôle}}
        FE    ->>  FE  : Stocke tokens (localStorage)
        FE    -->> User: Redirige selon rôle (agent / maintenancier)
    end

    rect rgb(124, 58, 237)
        Note over User,EML: Utilisation — Requêtes authentifiées
        User  ->>  FE  : Navigation / action
        FE    ->>  API : GET /api/v1/... (Authorization: Bearer access_token)
        API   -->> FE  : Données JSON
    end

    rect rgb(146, 64, 14)
        Note over User,EML: Renouvellement automatique (401)
        FE    ->>  API : Requête échoue → 401 Unauthorized
        FE    ->>  API : POST /api/v1/auth/refresh/ {refresh_token}
        API   -->> FE  : {access_token} (nouveau)
        FE    ->>  API : Réessaie la requête originale
    end

    rect rgb(30, 64, 175)
        Note over User,EML: WebSocket — Authentification par URL param
        FE    ->>  API : ws://host/ws/surveillance/id/?token=access_token
        API   ->>  API : JwtAuthMiddleware valide le token
        API   -->> FE  : Connexion WebSocket établie
    end
```

---

## 4. Modèle de Données — Entités Principales

```mermaid
erDiagram
    CustomUser {
        uuid    id              PK
        string  email           UK
        string  role            "agent_agricole|maintenancier"
        boolean must_change_password
        boolean is_active
        boolean is_staff
        datetime created_at
    }

    OTPCode {
        uuid    id              PK
        uuid    user_id         FK
        string  code
        datetime expires_at
        boolean is_used
    }

    TrustedDevice {
        uuid    id              PK
        uuid    user_id         FK
        string  device_hash
        datetime created_at
    }

    Camera {
        uuid    id              PK
        uuid    agent_id        FK
        string  name
        string  stream_url
        string  location
        string  status          "online|offline|maintenance"
        boolean is_active
        decimal latitude
        decimal longitude
    }

    Detection {
        uuid    id              PK
        uuid    camera_id       FK
        string  object_class
        float   confidence
        string  danger_level    "HIGH|MEDIUM|LOW"
        json    bounding_box
        string  frame_url
        datetime detected_at
    }

    Alert {
        uuid    id              PK
        uuid    detection_id    FK
        uuid    camera_id       FK
        string  danger_level
        boolean is_resolved
        datetime created_at
    }

    FieldPerimeter {
        uuid    id              PK
        uuid    agent_id        FK
        string  name
        json    coordinates     "liste {lat,lng}"
        decimal center_lat
        decimal center_lng
        decimal area_hectares
        boolean is_active
    }

    InstallationAppointment {
        uuid    id              PK
        uuid    agent_id        FK
        uuid    technician_id   FK
        datetime scheduled_at
        string  status          "pending|confirmed|done"
        string  location
    }

    Technician {
        uuid    id              PK
        string  name
        string  email
        string  phone
        string  specialty
        boolean is_available
    }

    Notification {
        uuid    id              PK
        uuid    recipient_id    FK
        string  title
        string  message
        string  type            "alert|info|warning"
        boolean is_read
        datetime created_at
    }

    Report {
        uuid    id              PK
        uuid    agent_id        FK
        string  title
        string  report_type
        string  file_url
        datetime generated_at
    }

    Subscription {
        uuid    id              PK
        uuid    agent_id        FK
        string  plan            "basic|premium"
        string  status          "active|expired"
        datetime expires_at
    }

    Payment {
        uuid    id              PK
        uuid    subscription_id FK
        decimal amount
        string  status          "pending|paid|failed"
        datetime paid_at
    }

    %% ── Relations ─────────────────────────────────────────────────
    CustomUser      ||--o{ OTPCode                : "génère"
    CustomUser      ||--o{ TrustedDevice           : "enregistre"
    CustomUser      ||--o{ Camera                  : "possède"
    CustomUser      ||--o{ FieldPerimeter           : "délimite"
    CustomUser      ||--o{ Notification             : "reçoit"
    CustomUser      ||--o{ Report                   : "génère"
    CustomUser      ||--o| Subscription             : "souscrit"
    CustomUser      }o--o{ InstallationAppointment  : "planifie"

    Camera          ||--o{ Detection               : "capture"
    Detection       ||--o| Alert                   : "déclenche"

    Technician      ||--o{ InstallationAppointment : "réalise"

    Subscription    ||--o{ Payment                 : "génère"
```

---

## 5. Infrastructure Docker Compose

```mermaid
flowchart TD
    subgraph DOCKER["🐳 Docker Compose Network"]
        subgraph APP_TIER["Couche Application"]
            DAPHNE["backend\nDaphne ASGI :8000\nDjango 5"]
            VITE["frontend\nVite Dev :3000\nReact 18"]
            NGINX_SVC["nginx\nReverse Proxy :80"]
            CEL_W_SVC["celery-worker\nCelery 5"]
            CEL_B_SVC["celery-beat\nDjango Celery Beat"]
        end

        subgraph DATA_TIER["Couche Données"]
            PG_SVC["postgres\nPostgreSQL 15-alpine :5432"]
            REDIS_SVC["redis\nRedis 7-alpine :6379"]
            MINIO_SVC["minio\nMinIO :9000 · Console :9001"]
        end

        subgraph ADMIN_TIER["Outils Admin"]
            PGADMIN["pgadmin\nPostgreSQL UI :5050"]
            FLOWER["flower\nCelery Monitor :5555"]
        end

        subgraph MON_TIER["Monitoring"]
            PROM_SVC["prometheus :9090"]
            GRAFANA_SVC["grafana :3001"]
            LOKI_SVC["loki :3100"]
            PG_EXP["postgres-exporter :9187"]
            RD_EXP["redis-exporter :9121"]
            NG_EXP["nginx-exporter :9113"]
        end
    end

    INTERNET(["🌐 Internet"])

    INTERNET -->|:80| NGINX_SVC
    NGINX_SVC --> DAPHNE & VITE

    DAPHNE & CEL_W_SVC & CEL_B_SVC --> PG_SVC & REDIS_SVC
    DAPHNE --> MINIO_SVC
    CEL_W_SVC --> MINIO_SVC

    PG_SVC --> PGADMIN
    REDIS_SVC --> FLOWER

    PG_SVC --> PG_EXP
    REDIS_SVC --> RD_EXP
    NGINX_SVC --> NG_EXP
    PG_EXP & RD_EXP & NG_EXP --> PROM_SVC
    DAPHNE -->|django-prometheus| PROM_SVC
    PROM_SVC --> GRAFANA_SVC
    LOKI_SVC --> GRAFANA_SVC

    classDef app fill:#1d4ed8,color:#fff,stroke:#1e40af
    classDef data fill:#065f46,color:#fff,stroke:#047857
    classDef admin fill:#374151,color:#fff,stroke:#1f2937
    classDef mon fill:#92400e,color:#fff,stroke:#78350f

    class DAPHNE,VITE,NGINX_SVC,CEL_W_SVC,CEL_B_SVC app
    class PG_SVC,REDIS_SVC,MINIO_SVC data
    class PGADMIN,FLOWER admin
    class PROM_SVC,GRAFANA_SVC,LOKI_SVC,PG_EXP,RD_EXP,NG_EXP mon
```

---

*Généré pour la soutenance du projet AgriWatch — Surveillance agricole par IA*
