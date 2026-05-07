# 🌾 Système de Surveillance Agricole par IA

Plateforme intelligente de surveillance agricole utilisant la vision par ordinateur (YOLOv8) pour détecter les intrusions sur les exploitations agricoles et alerter les agents en temps réel.

## Architecture

- **Backend** : Django 5 + Django REST Framework + Django Channels (ASGI)
- **Frontend** : React 18 + Vite 5 + TailwindCSS
- **IA** : YOLOv8n (Ultralytics) avec cache Redis intelligent
- **Base de données** : PostgreSQL
- **Cache & Pub/Sub** : Redis 7
- **Stockage objet** : MinIO (S3-compatible)
- **Reverse Proxy** : Nginx
- **Tâches asynchrones** : Celery + Celery Beat
- **Monitoring** : Prometheus + Grafana + Loki + Promtail
- **Conteneurisation** : Docker + Docker Compose

## Prérequis

- Docker & Docker Compose
- Git

## ⚡ Démarrage Rapide

### Installation (première fois)

```bash
# 1. Cloner le projet
git clone <repo-url>
cd Alamine_Bouba_Project_v0

# 2. Configurer l'environnement
cp .env.example .env

# 3. Installation complète
make install

# 4. Démarrer en mode développement (recommandé)
make start-dev
```

**Accès:** http://localhost:3000  
**Login:** admin@test.com / admin123

### Commandes Essentielles

```bash
make help          # Liste complète des commandes
make start-dev     # Mode développement (sans nginx)
make start-prod    # Mode production (avec nginx)
make status        # État des services
make logs          # Voir les logs
make fix-login     # Corriger problème login
make diagnostic    # Diagnostic complet
```

📖 **Documentation complète:** [COMMANDES.md](COMMANDES.md)

### Démarrage Rapide (Développement)

```bash
make start-dev        # Démarrer
make open-frontend    # Ouvrir dans le navigateur
```

### Démarrage Rapide (Production)

```bash
make start-prod    # Démarrer avec nginx
make open-app      # Ouvrir dans le navigateur
   ```

## Commandes Utiles

| Commande | Description |
|----------|-------------|
| `make build` | Construire les images Docker |
| `make up` | Démarrer tous les services |
| `make down` | Arrêter tous les services |
| `make dev` | Mode développement (hot-reload) |
| `make logs` | Voir les logs en temps réel |
| `make migrate` | Appliquer les migrations |
| `make superuser` | Créer un superutilisateur |
| `make test` | Lancer les tests |
| `make coverage` | Rapport de couverture |
| `make shell` | Shell Django interactif |

## Accès aux Services

| Service | URL | Identifiants par défaut |
|---------|-----|------------------------|
| Application | http://localhost | — |
| API Swagger | http://localhost/api/docs/ | — |
| Django Admin | http://localhost/admin/ | Superuser |
| PgAdmin | http://localhost:5050 | Voir `.env` |
| Flower (Celery) | http://localhost:5555 | Voir `.env` |
| MinIO Console | http://localhost:9001 | Voir `.env` |

## Monitoring (optionnel)

```bash
docker-compose -f docker-compose.yml -f docker-compose.monitoring.yml up -d
```

| Service | URL |
|---------|-----|
| Grafana | http://localhost:3000 |
| Prometheus | http://localhost:9090 |

## Rôles Utilisateurs

- **Maintenancier** : Gestion des agents, techniciens, rendez-vous, supervision globale
- **Agent Agricole** : Surveillance en temps réel, détections, rapports, alertes

## Structure du Projet

```
├── backend/          # Django 5 + DRF + Channels
├── frontend/         # React 18 + Vite + TailwindCSS
├── nginx/            # Reverse proxy
├── postgres/         # Base de données
├── pgadmin/          # Administration DB
├── monitoring/       # Prometheus + Grafana + Loki
└── docker-compose.*  # Orchestration conteneurs
```

## Licence

Projet académique — Soutenance de fin d'études.
