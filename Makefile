# =============================================================================
# Makefile - Systeme de Surveillance Agricole par IA
# =============================================================================
# Usage : make <cible>
#         make help
#
# Compatible Windows (cmd.exe / PowerShell) ET Linux / macOS / WSL / Git Bash.
# Aucun caractere accentue dans les "echo" -> evite les problemes d'encodage.
# =============================================================================

DC      = docker compose
DC_PROD = docker compose -f docker-compose.yml
DC_MON  = docker compose -f docker-compose.yml -f docker-compose.monitoring.yml

.DEFAULT_GOAL := help

.PHONY: help
help:
	@echo.
	@echo Systeme de Surveillance Agricole par IA
	@echo =========================================
	@echo.
	@echo Cycle de vie :
	@echo   install               Installation complete (premiere fois)
	@echo   dev                   Demarrer en mode DEVELOPPEMENT
	@echo   prod                  Demarrer en mode PRODUCTION
	@echo   build                 (Re)construire les images Docker
	@echo   up                    Demarrer les services (sans rebuild)
	@echo   down                  Arreter tous les services
	@echo   restart               Redemarrer tous les services
	@echo   restart-backend       Redemarrer uniquement le backend
	@echo   restart-frontend      Redemarrer uniquement le frontend
	@echo   restart-nginx         Redemarrer uniquement nginx
	@echo   status                Etat des services
	@echo   clean                 Supprimer conteneurs, volumes, images
	@echo   reset                 Reinitialiser (clean + build + up)
	@echo.
	@echo Logs :
	@echo   logs                  Logs en temps reel
	@echo   logs-tail             Derniers 100 logs
	@echo   logs-backend          Logs backend
	@echo   logs-frontend         Logs frontend
	@echo   logs-nginx            Logs nginx
	@echo   logs-celery           Logs Celery worker + beat
	@echo.
	@echo Django :
	@echo   migrate               Creer + appliquer les migrations
	@echo   makemigrations        Creer les migrations sans les appliquer
	@echo   superuser             Creer un superutilisateur
	@echo   create-test-user      Utilisateur test (admin@test.com / admin123)
	@echo   shell                 Shell Django interactif
	@echo   bash-backend          Bash dans le conteneur backend
	@echo   bash-db               psql dans le conteneur Postgres
	@echo   collectstatic         Collecter les fichiers statiques
	@echo.
	@echo Tests :
	@echo   test                  Lancer les tests
	@echo   test-fast             Tests rapides (arret au 1er echec)
	@echo   coverage              Rapport de couverture
	@echo   lint                  Linting Python (flake8)
	@echo   format                Formatage Python (black)
	@echo.
	@echo Monitoring :
	@echo   monitoring-up         Demarrer Prometheus + Grafana + Loki
	@echo   monitoring-down       Arreter le monitoring
	@echo   monitoring-logs       Logs monitoring
	@echo   monitoring-status     Etat de la stack monitoring
	@echo.
	@echo Diagnostic :
	@echo   diagnostic            Diagnostic complet
	@echo   info                  Informations sur le projet
	@echo.

# ============ Cycle de vie ============

.PHONY: install
install: build up migrate create-test-user
	@echo.
	@echo Installation terminee !
	@echo Lance maintenant : make dev

.PHONY: dev
dev:
	@echo Demarrage en mode DEVELOPPEMENT...
	@$(DC) up -d --build
	@echo.
	@echo Services demarres ! (verifie avec: make status)
	@echo   Application  : http://localhost
	@echo   Backend API  : http://localhost:8000/api/v1/
	@echo   API Docs     : http://localhost:8000/api/docs/
	@echo   Django Admin : http://localhost:8000/admin/
	@echo.

.PHONY: prod
prod:
	@echo Demarrage en mode PRODUCTION...
	@$(DC_PROD) up -d --build
	@echo.
	@echo Application disponible sur http://localhost

.PHONY: build
build:
	@$(DC) build

.PHONY: up
up:
	@$(DC) up -d

.PHONY: down
down:
	@$(DC) down

.PHONY: restart
restart:
	@$(DC) restart

.PHONY: restart-backend
restart-backend:
	@$(DC) restart backend

.PHONY: restart-frontend
restart-frontend:
	@$(DC) restart frontend

.PHONY: restart-nginx
restart-nginx:
	@$(DC) restart nginx

.PHONY: status
status:
	@$(DC) ps

.PHONY: clean
clean:
	@$(DC) down -v --rmi local --remove-orphans

.PHONY: reset
reset: clean build up

# ============ Logs ============

.PHONY: logs
logs:
	@$(DC) logs -f

.PHONY: logs-tail
logs-tail:
	@$(DC) logs --tail=100

.PHONY: logs-backend
logs-backend:
	@$(DC) logs -f backend

.PHONY: logs-frontend
logs-frontend:
	@$(DC) logs -f frontend

.PHONY: logs-nginx
logs-nginx:
	@$(DC) logs -f nginx

.PHONY: logs-celery
logs-celery:
	@$(DC) logs -f celery-worker celery-beat

# ============ Django ============

.PHONY: migrate
migrate:
	@$(DC) exec backend python manage.py makemigrations
	@$(DC) exec backend python manage.py migrate

.PHONY: makemigrations
makemigrations:
	@$(DC) exec backend python manage.py makemigrations

.PHONY: superuser
superuser:
	@$(DC) exec backend python manage.py createsuperuser

.PHONY: create-test-user
create-test-user:
	@$(DC) exec backend python manage.py shell -c "from users.models import CustomUser; u, c = CustomUser.objects.get_or_create(email='admin@test.com', defaults={'first_name': 'Admin', 'last_name': 'Test', 'nin': 'NIN000TEST', 'role': 'maintenancier', 'is_staff': True, 'is_superuser': True, 'must_change_password': False}); u.set_password('admin123'); u.save(); print('OK : admin@test.com / admin123')"

.PHONY: shell
shell:
	@$(DC) exec backend python manage.py shell

.PHONY: bash-backend
bash-backend:
	@$(DC) exec backend bash

.PHONY: bash-db
bash-db:
	@$(DC) exec postgres psql -U surveillance_user -d surveillance_db

.PHONY: collectstatic
collectstatic:
	@$(DC) exec backend python manage.py collectstatic --noinput

# ============ Tests ============

.PHONY: test
test:
	@$(DC) exec backend pytest

.PHONY: test-fast
test-fast:
	@$(DC) exec backend pytest -x --no-cov

.PHONY: coverage
coverage:
	@$(DC) exec backend pytest --cov=. --cov-report=term-missing

.PHONY: lint
lint:
	@$(DC) exec backend flake8 . --exclude=migrations,__pycache__,static,media

.PHONY: format
format:
	@$(DC) exec backend black . --exclude="/(migrations|__pycache__|static|media)/"

# ============ Monitoring ============

.PHONY: monitoring-up
monitoring-up:
	@$(DC_MON) up -d
	@echo.
	@echo Monitoring demarre :
	@echo   Grafana    : http://localhost:3001
	@echo   Prometheus : http://localhost:9090

.PHONY: monitoring-down
monitoring-down:
	@$(DC_MON) down

.PHONY: monitoring-logs
monitoring-logs:
	@$(DC_MON) logs -f prometheus grafana loki promtail cadvisor node-exporter postgres-exporter redis-exporter nginx-exporter

.PHONY: monitoring-status
monitoring-status:
	@$(DC_MON) ps

# ============ Diagnostic ============

.PHONY: diagnostic
diagnostic:
	@echo === Diagnostic systeme ===
	@echo.
	@echo Docker :
	@docker --version
	@docker compose version
	@echo.
	@echo Conteneurs :
	@$(DC) ps
	@echo.
	@echo Espace disque Docker :
	@docker system df

.PHONY: info
info:
	@echo Systeme de Surveillance Agricole par IA
	@echo.
	@echo Stack :
	@echo   Backend  : Django 5 + DRF + Channels
	@echo   Frontend : React 18 + Vite + TailwindCSS
	@echo   DB       : PostgreSQL
	@echo   Cache    : Redis 7
	@echo   Storage  : MinIO
	@echo   IA       : YOLOv8
	@echo   Tasks    : Celery + Celery Beat
	@echo   Proxy    : Nginx
	@echo.
	@echo URLs (mode dev) :
	@echo   http://localhost                - Application
	@echo   http://localhost:8000/admin/    - Django Admin
	@echo   http://localhost:8000/api/docs/ - API Docs
	@echo   http://localhost:5050           - PgAdmin
	@echo   http://localhost:5555           - Flower
	@echo   http://localhost:9001           - MinIO Console