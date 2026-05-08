.PHONY: help build up down logs migrate superuser test coverage shell \
        dev prod status clean reset \
        restart-frontend restart-backend restart-nginx restart-all \
        camera-list camera-attach camera-detach camera-status camera-test \
        logs-frontend logs-backend logs-all \
        start-monitoring stop-monitoring logs-monitoring status-monitoring \
        open-grafana open-prometheus open-frontend open-backend \
        create-test-user diagnostic cleanup-scripts collectstatic install info

# Couleurs
CYAN := \033[0;36m
GREEN := \033[0;32m
YELLOW := \033[1;33m
RED := \033[0;31m
NC := \033[0m

##@ Aide

help: ## Affiche cette aide
	@echo "$(CYAN)============================================================$(NC)"
	@echo "$(CYAN)       Surveillance Agricole - Commandes Make$(NC)"
	@echo "$(CYAN)============================================================$(NC)"
	@echo ""
	@awk 'BEGIN {FS = ":.*##"; printf "\n"} /^[a-zA-Z_-]+:.*?##/ { printf "  $(CYAN)%-22s$(NC) %s\n", $$1, $$2 } /^##@/ { printf "\n$(YELLOW)%s$(NC)\n", substr($$0, 5) } ' $(MAKEFILE_LIST)
	@echo ""

##@ Demarrage Rapide

dev: ## Demarrer en mode DEVELOPPEMENT (sans nginx)
	@echo "$(GREEN)Demarrage MODE DEVELOPPEMENT...$(NC)"
	@docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d --build
	@echo ""
	@echo "$(GREEN)Services demarres !$(NC)"
	@echo "  Frontend:  http://localhost:3000"
	@echo "  Backend:   http://localhost:8000"
	@echo "  API:       http://localhost:8000/api/v1/"
	@echo ""
	@$(MAKE) status

prod: ## Demarrer en mode PRODUCTION (avec nginx)
	@echo "$(GREEN)Demarrage MODE PRODUCTION...$(NC)"
	@docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
	@echo ""
	@echo "$(GREEN)Services demarres !$(NC)"
	@echo "  Application: http://localhost"
	@echo ""
	@$(MAKE) status

##@ Build & Services

build: ## Construire les images Docker
	@docker-compose build

up: ## Demarrer tous les services
	@docker-compose up -d

down: ## Arreter tous les services
	@docker-compose down

restart-all: ## Redemarrer tous les services
	@docker-compose restart

restart-frontend: ## Redemarrer le frontend
	@docker-compose restart frontend

restart-backend: ## Redemarrer le backend
	@docker-compose restart backend

restart-nginx: ## Redemarrer nginx
	@docker-compose restart nginx

status: ## Etat des services
	@docker-compose ps

clean: ## Nettoyer conteneurs, volumes, images
	@docker-compose down -v --remove-orphans

reset: clean build up ## Reset complet (clean + build + up)

##@ Camera & USBIPD (Windows)

camera-list: ## Lister les peripheriques USB disponibles
	@echo "$(CYAN)Peripheriques USB disponibles:$(NC)"
	@powershell.exe -Command "usbipd list" 2>/dev/null || echo "  usbipd non installe. Installer: winget install usbipd"

camera-attach: ## Attacher la camera USB a WSL2 (usage: make camera-attach BUS=1-4)
	@echo "$(GREEN)Attachement camera USB au WSL2...$(NC)"
	@if [ -z "$(BUS)" ]; then \
		echo "$(RED)Usage: make camera-attach BUS=<busid>$(NC)"; \
		echo "  Utilise 'make camera-list' pour trouver le BUS ID"; \
	else \
		powershell.exe -Command "usbipd attach --wsl --busid $(BUS)"; \
		echo "$(GREEN)Camera attachee ! Device: /dev/video0$(NC)"; \
	fi

camera-detach: ## Detacher la camera USB de WSL2 (usage: make camera-detach BUS=1-4)
	@if [ -z "$(BUS)" ]; then \
		echo "$(RED)Usage: make camera-detach BUS=<busid>$(NC)"; \
	else \
		powershell.exe -Command "usbipd detach --busid $(BUS)"; \
		echo "$(GREEN)Camera detachee$(NC)"; \
	fi

camera-status: ## Verifier si la camera est accessible dans Docker
	@echo "$(CYAN)Verification camera dans le conteneur backend...$(NC)"
	@docker-compose exec backend ls -la /dev/video* 2>/dev/null && echo "$(GREEN)Camera detectee !$(NC)" || echo "$(RED)Camera non detectee. Verifier: make camera-list$(NC)"

camera-test: ## Tester la capture camera dans le conteneur
	@echo "$(CYAN)Test capture camera...$(NC)"
	@docker-compose exec backend python -c "import cv2; cap=cv2.VideoCapture(0); ret,frame=cap.read(); print('Capture OK' if ret else 'ECHEC capture'); cap.release()"

##@ Logs

logs: ## Logs de tous les services (temps reel)
	@docker-compose logs -f

logs-all: ## Derniers logs (100 lignes)
	@docker-compose logs --tail=100

logs-frontend: ## Logs frontend
	@docker-compose logs -f frontend

logs-backend: ## Logs backend
	@docker-compose logs -f backend

##@ Base de Donnees

migrate: ## Creer et appliquer les migrations
	@docker-compose exec backend python manage.py makemigrations
	@docker-compose exec backend python manage.py migrate

superuser: ## Creer un superutilisateur
	@docker-compose exec backend python manage.py createsuperuser

create-test-user: ## Creer utilisateur de test (admin@test.com / admin123)
	@docker-compose exec backend python manage.py shell -c "from users.models import CustomUser; user, created = CustomUser.objects.get_or_create(email='admin@test.com', defaults={'first_name': 'Admin', 'last_name': 'Test', 'nin': 'NIN000TEST', 'role': 'maintenancier', 'is_staff': True, 'is_superuser': True, 'must_change_password': False}); user.set_password('admin123'); user.save(); print('Utilisateur cree: admin@test.com / admin123')"

shell: ## Ouvrir le shell Django
	@docker-compose exec backend python manage.py shell

collectstatic: ## Collecter les fichiers statiques
	@docker-compose exec backend python manage.py collectstatic --noinput

##@ Tests

test: ## Lancer les tests
	@docker-compose exec backend pytest

coverage: ## Rapport de couverture
	@docker-compose exec backend pytest --cov=.

##@ Monitoring (Prometheus + Grafana + Loki)

start-monitoring: ## Demarrer la stack de monitoring
	@docker-compose -f docker-compose.yml -f docker-compose.monitoring.yml up -d prometheus grafana loki promtail cadvisor node-exporter
	@echo "$(GREEN)Monitoring demarre !$(NC)"
	@echo "  Grafana:    http://localhost:3001 (admin/admin123)"
	@echo "  Prometheus: http://localhost:9090"

stop-monitoring: ## Arreter le monitoring
	@docker-compose -f docker-compose.yml -f docker-compose.monitoring.yml stop prometheus grafana loki promtail cadvisor node-exporter

status-monitoring: ## Etat du monitoring
	@docker-compose -f docker-compose.yml -f docker-compose.monitoring.yml ps prometheus grafana loki promtail cadvisor node-exporter

logs-monitoring: ## Logs monitoring
	@docker-compose -f docker-compose.yml -f docker-compose.monitoring.yml logs -f prometheus grafana loki

##@ Nettoyage Projet

cleanup-scripts: ## Supprimer les anciens scripts .bat orphelins
	@echo "$(RED)Suppression des scripts .bat obsoletes...$(NC)"
	@rm -f start-app.bat check-system.ps1 fix-502-and-restart.bat fix-502-quick.bat \
		fix-nginx-force.bat acces-direct-services.bat restart-frontend.bat \
		start-dev.bat start-prod.bat test-login-complet.bat fix-login-redirection.bat \
		cleanup-old-scripts.bat make.bat integrate-monitoring.bat fix-monitoring.bat \
		fix-grafana.bat cleanup-grafana-files.bat migrate-registration.bat \
		update-frontend.bat debug-login.bat check-user.bat check-babsba.bat \
		create-babsba.bat activate-babsba.bat check-babsba-v2.bat create-babsba-v2.bat \
		activate-babsba-v2.bat setup-workflow-complet.bat supprimer-compte-agent.bat \
		supprimer-babsba.bat deploy-nouveau-dashboard.bat deploy-interfaces-ameliorees.bat \
		deploy-interfaces-v3.bat deploy-complete-workflow.bat deploy-workflow-final.bat \
		check-logs-installation.bat verifier-integration.bat install-leaflet.bat \
		installer-dashboard-unifie.bat rebuild-docker-frontend.bat
	@echo "$(GREEN)Nettoyage termine$(NC)"

##@ Ouverture Navigateur

open-frontend: ## Ouvrir le frontend
	@start http://localhost:3000 || open http://localhost:3000

open-backend: ## Ouvrir le backend admin
	@start http://localhost:8000/admin/ || open http://localhost:8000/admin/

open-grafana: ## Ouvrir Grafana
	@start http://localhost:3001 || open http://localhost:3001

open-prometheus: ## Ouvrir Prometheus
	@start http://localhost:9090 || open http://localhost:9090

##@ Diagnostic

diagnostic: ## Diagnostic complet du systeme
	@echo "$(CYAN)=== DIAGNOSTIC SYSTEME ===$(NC)"
	@echo ""
	@echo "$(YELLOW)Services:$(NC)"
	@docker-compose ps
	@echo ""
	@echo "$(YELLOW)Camera:$(NC)"
	@docker-compose exec backend ls -la /dev/video* 2>/dev/null && echo "  Camera OK" || echo "  Camera non detectee"
	@echo ""
	@echo "$(YELLOW)Dernières erreurs backend:$(NC)"
	@docker-compose logs backend --tail=5 2>/dev/null | grep -i "error" || echo "  Pas d'erreurs"

##@ Installation

install: build migrate create-test-user ## Installation complete (premiere fois)
	@echo ""
	@echo "$(GREEN)Installation terminee !$(NC)"
	@echo ""
	@echo "  Prochaine etape: make dev"
	@echo "  Compte: admin@test.com / admin123"
	@echo ""

info: ## Informations sur le projet
	@echo "$(CYAN)=== Surveillance Agricole ===$(NC)"
	@echo ""
	@echo "  Backend:   Django 5 + DRF + Channels"
	@echo "  Frontend:  React 18 + Vite 5 + TailwindCSS"
	@echo "  IA:        YOLOv8n (detection objets)"
	@echo "  Base:      PostgreSQL 15 + Redis 7"
	@echo "  Storage:   MinIO"
	@echo "  Tasks:     Celery + Beat"
	@echo ""
	@echo "  make help  - Liste des commandes"
	@echo ""
