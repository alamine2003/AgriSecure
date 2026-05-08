<<<<<<< HEAD
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
=======
.PHONY: help build up down logs migrate superuser test coverage shell \
        dev prod start-dev start-prod \
        restart-frontend restart-backend restart-nginx restart-all \
        fix-login fix-nginx test-login \
        create-test-user status clean reset \
        logs-frontend logs-backend logs-nginx logs-all \
        start-monitoring stop-monitoring logs-monitoring status-monitoring \
        open-grafana open-prometheus open-loki

# Couleurs pour l'affichage
CYAN := \033[0;36m
GREEN := \033[0;32m
YELLOW := \033[1;33m
RED := \033[0;31m
NC := \033[0m # No Color

##@ Aide

help: ## Affiche cette aide
	@echo "$(CYAN)╔════════════════════════════════════════════════════════════╗$(NC)"
	@echo "$(CYAN)║          Surveillance Agricole - Commandes Make          ║$(NC)"
	@echo "$(CYAN)╚════════════════════════════════════════════════════════════╝$(NC)"
	@echo ""
	@awk 'BEGIN {FS = ":.*##"; printf "\n"} /^[a-zA-Z_-]+:.*?##/ { printf "  $(CYAN)%-20s$(NC) %s\n", $$1, $$2 } /^##@/ { printf "\n$(YELLOW)%s$(NC)\n", substr($$0, 5) } ' $(MAKEFILE_LIST)
	@echo ""

##@ Démarrage Rapide

start-dev: ## Démarrer en mode DÉVELOPPEMENT (sans nginx, recommandé)
	@echo "$(GREEN)🚀 Démarrage MODE DÉVELOPPEMENT (sans nginx)...$(NC)"
	@docker-compose down
	@docker-compose build
	@docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d
	@echo "$(YELLOW)⏳ Attente démarrage services (15s)...$(NC)"
	@timeout /t 15 /nobreak >nul || sleep 15
	@echo ""
	@echo "$(GREEN)✅ Services démarrés !$(NC)"
	@echo ""
	@echo "$(CYAN)📍 Accès aux services:$(NC)"
	@echo "   Frontend:  http://localhost:3000"
	@echo "   Backend:   http://localhost:8000"
	@echo "   Admin:     http://localhost:8000/admin/"
	@echo "   API Docs:  http://localhost:8000/api/docs/"
	@echo ""
	@$(MAKE) status

start-prod: ## Démarrer en mode PRODUCTION (avec nginx)
	@echo "$(GREEN)🚀 Démarrage MODE PRODUCTION (avec nginx)...$(NC)"
	@docker-compose down
	@docker-compose -f docker-compose.yml -f docker-compose.prod.yml build
	@docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
	@echo "$(YELLOW)⏳ Attente démarrage services (20s)...$(NC)"
	@timeout /t 20 /nobreak >nul || sleep 20
	@echo ""
	@echo "$(GREEN)✅ Services démarrés !$(NC)"
	@echo ""
	@echo "$(CYAN)📍 Accès à l'application:$(NC)"
	@echo "   http://localhost"
	@echo ""
	@$(MAKE) status

dev: start-dev ## Alias pour start-dev

prod: start-prod ## Alias pour start-prod

##@ Build & Services

build: ## Construire les images Docker
	@echo "$(GREEN)🔨 Construction des images...$(NC)"
	@docker-compose build

up: ## Démarrer tous les services
	@echo "$(GREEN)🚀 Démarrage des services...$(NC)"
	@docker-compose up -d

down: ## Arrêter tous les services
	@echo "$(RED)🛑 Arrêt des services...$(NC)"
	@docker-compose down

restart-all: ## Redémarrer tous les services
	@echo "$(YELLOW)🔄 Redémarrage de tous les services...$(NC)"
	@docker-compose restart
	@echo "$(GREEN)✅ Services redémarrés$(NC)"

status: ## Afficher l'état des services
	@echo "$(CYAN)📊 État des services:$(NC)"
	@docker-compose ps

clean: ## Nettoyer conteneurs, volumes, images
	@echo "$(RED)🧹 Nettoyage complet...$(NC)"
	@docker-compose down -v --remove-orphans
	@echo "$(GREEN)✅ Nettoyage terminé$(NC)"

reset: clean build up ## Reset complet (clean + build + up)
	@echo "$(GREEN)✅ Reset complet terminé$(NC)"
	@$(MAKE) status

##@ Redémarrage Services Individuels

restart-frontend: ## Redémarrer uniquement le frontend
	@echo "$(YELLOW)🔄 Redémarrage frontend...$(NC)"
	@docker-compose restart frontend
	@timeout /t 5 /nobreak >nul || sleep 5
	@echo "$(GREEN)✅ Frontend redémarré$(NC)"

restart-backend: ## Redémarrer uniquement le backend
	@echo "$(YELLOW)🔄 Redémarrage backend...$(NC)"
	@docker-compose restart backend
	@timeout /t 5 /nobreak >nul || sleep 5
	@echo "$(GREEN)✅ Backend redémarré$(NC)"

restart-nginx: ## Redémarrer uniquement nginx
	@echo "$(YELLOW)🔄 Redémarrage nginx...$(NC)"
	@docker-compose restart nginx
	@timeout /t 5 /nobreak >nul || sleep 5
	@echo "$(GREEN)✅ Nginx redémarré$(NC)"

##@ Logs

logs: ## Voir les logs de tous les services (temps réel)
	@docker-compose logs -f

logs-all: ## Voir les derniers logs (100 lignes)
	@docker-compose logs --tail=100

logs-frontend: ## Logs du frontend uniquement
	@echo "$(CYAN)📋 Logs Frontend:$(NC)"
	@docker-compose logs -f frontend

logs-backend: ## Logs du backend uniquement
	@echo "$(CYAN)📋 Logs Backend:$(NC)"
	@docker-compose logs -f backend

logs-nginx: ## Logs de nginx uniquement
	@echo "$(CYAN)📋 Logs Nginx:$(NC)"
	@docker-compose logs -f nginx

##@ Base de Données

migrate: ## Créer et appliquer les migrations
	@echo "$(GREEN)🗃️  Création et application des migrations...$(NC)"
	@docker-compose exec backend python manage.py makemigrations
	@docker-compose exec backend python manage.py migrate
	@echo "$(GREEN)✅ Migrations appliquées$(NC)"

superuser: ## Créer un superutilisateur
	@echo "$(GREEN)👤 Création d'un superutilisateur...$(NC)"
	@docker-compose exec backend python manage.py createsuperuser

create-test-user: ## Créer utilisateur de test (admin@test.com / admin123)
	@echo "$(GREEN)👤 Création utilisateur de test...$(NC)"
	@docker-compose exec backend python manage.py shell -c "from users.models import CustomUser; user, created = CustomUser.objects.get_or_create(email='admin@test.com', defaults={'first_name': 'Admin', 'last_name': 'Test', 'role': 'maintenancier', 'is_staff': True, 'is_superuser': True}); user.set_password('admin123'); user.save(); print('✅ Utilisateur créé: admin@test.com / admin123 (maintenancier)')"

shell: ## Ouvrir le shell Django
	@docker-compose exec backend python manage.py shell

##@ Tests

test: ## Lancer les tests
	@echo "$(GREEN)🧪 Exécution des tests...$(NC)"
	@docker-compose exec backend pytest

coverage: ## Générer le rapport de couverture
	@echo "$(GREEN)📊 Génération rapport de couverture...$(NC)"
	@docker-compose exec backend pytest --cov=.

##@ Corrections & Debug

fix-login: ## Corriger le problème de login/redirection
	@echo "$(GREEN)🔧 Correction du login et redirection...$(NC)"
	@echo ""
	@echo "$(CYAN)Étape 1/4: Arrêt frontend...$(NC)"
	@docker-compose stop frontend
	@docker-compose rm -f frontend
	@echo ""
	@echo "$(CYAN)Étape 2/4: Redémarrage avec nouvelle config...$(NC)"
	@docker-compose up -d frontend
	@echo "$(YELLOW)⏳ Attente démarrage (15s)...$(NC)"
	@timeout /t 15 /nobreak >nul || sleep 15
	@echo ""
	@echo "$(CYAN)Étape 3/4: Vérification config...$(NC)"
	@docker-compose exec frontend printenv | findstr VITE_API_URL || docker-compose exec frontend printenv | grep VITE_API_URL
	@echo ""
	@echo "$(CYAN)Étape 4/4: Création utilisateur test...$(NC)"
	@$(MAKE) create-test-user
	@echo ""
	@echo "$(GREEN)✅ Correction terminée !$(NC)"
	@echo ""
	@echo "$(CYAN)🧪 Pour tester:$(NC)"
	@echo "   1. Ouvre http://localhost:3000"
	@echo "   2. Ouvre Console (F12)"
	@echo "   3. Connecte avec: admin@test.com / admin123"
	@echo "   4. Observe les logs [LOGIN] dans la console"
	@echo ""

fix-nginx: ## Corriger la configuration nginx (mode dev)
	@echo "$(GREEN)🔧 Correction nginx (mode dev)...$(NC)"
	@docker-compose stop nginx
	@docker-compose rm -f nginx
	@docker-compose build --no-cache nginx
	@docker-compose up -d nginx
	@timeout /t 5 /nobreak >nul || sleep 5
	@echo ""
	@echo "$(GREEN)✅ Nginx redémarré$(NC)"
	@echo ""
	@echo "$(CYAN)🧪 Testez:$(NC)"
	@echo "   http://localhost"
	@echo ""
	@docker-compose logs nginx --tail=10

test-login: ## Tester la connexion API
	@echo "$(CYAN)🧪 Test de connexion API...$(NC)"
	@echo ""
	@echo "$(CYAN)1. Vérification backend accessible:$(NC)"
	@curl -s -X OPTIONS http://localhost:8000/api/v1/auth/login/ -I | findstr "HTTP Allow" || curl -s -X OPTIONS http://localhost:8000/api/v1/auth/login/ -I | grep -E "HTTP|Allow"
	@echo ""
	@echo "$(CYAN)2. État des services:$(NC)"
	@docker-compose ps frontend backend
	@echo ""
	@echo "$(CYAN)3. Configuration frontend:$(NC)"
	@docker-compose exec frontend printenv | findstr VITE || docker-compose exec frontend printenv | grep VITE
	@echo ""
	@echo "$(YELLOW)Pour un test complet, ouvre la console du navigateur (F12)$(NC)"

##@ Diagnostic

diagnostic: ## Diagnostic complet du système
	@echo "$(CYAN)╔════════════════════════════════════════════════════════════╗$(NC)"
	@echo "$(CYAN)║               DIAGNOSTIC COMPLET SYSTÈME                  ║$(NC)"
	@echo "$(CYAN)╚════════════════════════════════════════════════════════════╝$(NC)"
	@echo ""
	@echo "$(YELLOW)📊 État des conteneurs:$(NC)"
	@docker-compose ps
	@echo ""
	@echo "$(YELLOW)🔌 Test ports:$(NC)"
	@echo "  Frontend (3000):"
	@curl -s http://localhost:3000 -o nul && echo "    ✅ OK" || echo "    ❌ INACCESSIBLE"
	@echo "  Backend (8000):"
	@curl -s http://localhost:8000/admin/ -o nul && echo "    ✅ OK" || echo "    ❌ INACCESSIBLE"
	@echo ""
	@echo "$(YELLOW)🔧 Configuration frontend:$(NC)"
	@docker-compose exec frontend printenv | findstr VITE || docker-compose exec frontend printenv | grep VITE || echo "  ⚠️  Frontend non disponible"
	@echo ""
	@echo "$(YELLOW)📋 Dernières erreurs backend:$(NC)"
	@docker-compose logs backend --tail=10 | findstr /i "error" || docker-compose logs backend --tail=10 | grep -i "error" || echo "  ✅ Pas d'erreurs"
	@echo ""
	@echo "$(YELLOW)📋 Dernières erreurs frontend:$(NC)"
	@docker-compose logs frontend --tail=10 | findstr /i "error" || docker-compose logs frontend --tail=10 | grep -i "error" || echo "  ✅ Pas d'erreurs"

##@ Utilitaires

open-frontend: ## Ouvrir le frontend dans le navigateur
	@start http://localhost:3000 || open http://localhost:3000 || xdg-open http://localhost:3000

open-backend: ## Ouvrir le backend admin dans le navigateur
	@start http://localhost:8000/admin/ || open http://localhost:8000/admin/ || xdg-open http://localhost:8000/admin/

open-app: ## Ouvrir l'app via nginx dans le navigateur
	@start http://localhost || open http://localhost || xdg-open http://localhost

collectstatic: ## Collecter les fichiers statiques Django
	@echo "$(GREEN)📦 Collecte des fichiers statiques...$(NC)"
	@docker-compose exec backend python manage.py collectstatic --noinput

##@ Installation

install: build migrate create-test-user ## Installation complète (première fois)
	@echo ""
	@echo "$(GREEN)╔════════════════════════════════════════════════════════════╗$(NC)"
	@echo "$(GREEN)║          ✅ INSTALLATION TERMINÉE AVEC SUCCÈS !            ║$(NC)"
	@echo "$(GREEN)╚════════════════════════════════════════════════════════════╝$(NC)"
	@echo ""
	@echo "$(CYAN)🚀 Prochaine étape:$(NC)"
	@echo "   make start-dev    $(YELLOW)# Mode développement (recommandé)$(NC)"
	@echo "   make start-prod   $(YELLOW)# Mode production (avec nginx)$(NC)"
	@echo ""
	@echo "$(CYAN)👤 Compte créé:$(NC)"
	@echo "   Email:    admin@test.com"
	@echo "   Password: admin123"
	@echo "   Rôle:     maintenancier"
	@echo ""

##@ Info

info: ## Informations sur le projet
	@echo "$(CYAN)╔════════════════════════════════════════════════════════════╗$(NC)"
	@echo "$(CYAN)║           Surveillance Agricole - Informations           ║$(NC)"
	@echo "$(CYAN)╚════════════════════════════════════════════════════════════╝$(NC)"
	@echo ""
	@echo "$(YELLOW)📂 Architecture:$(NC)"
	@echo "   Backend:   Django 5 + DRF + Channels (WebSocket)"
	@echo "   Frontend:  React 18 + Vite 5 + TailwindCSS"
	@echo "   IA:        YOLOv8n (détection objets)"
	@echo "   Base:      PostgreSQL 15"
	@echo "   Cache:     Redis 7"
	@echo "   Storage:   MinIO"
	@echo "   Tasks:     Celery + Beat"
	@echo ""
	@echo "$(YELLOW)📖 Documentation:$(NC)"
	@echo "   CLAUDE.md           - Architecture technique"
	@echo "   GUIDE_DEMARRAGE.md  - Guide complet"
	@echo "   CORRECTION_LOGIN.md - Debug login"
	@echo ""
	@echo "$(YELLOW)🔗 Liens utiles:$(NC)"
	@echo "   make help           - Liste des commandes"
	@echo "   make diagnostic     - Diagnostic système"
	@echo ""

##@ Monitoring (Prometheus + Grafana + Loki)

start-monitoring: ## Démarrer la stack de monitoring
	@echo "$(GREEN)🔍 Démarrage stack monitoring...$(NC)"
	@echo ""
	@echo "$(CYAN)Services à démarrer:$(NC)"
	@echo "   - Prometheus (métriques)"
	@echo "   - Grafana (visualisation)"
	@echo "   - Loki (logs)"
	@echo "   - Promtail (collecte logs)"
	@echo "   - cAdvisor (métriques containers)"
	@echo "   - Node Exporter (métriques système)"
	@echo ""
	@docker-compose -f docker-compose.yml -f docker-compose.monitoring.yml up -d prometheus grafana loki promtail cadvisor node-exporter
	@echo "$(YELLOW)⏳ Attente démarrage (15s)...$(NC)"
	@timeout /t 15 /nobreak >nul || sleep 15
	@echo ""
	@echo "$(GREEN)✅ Stack monitoring démarrée !$(NC)"
	@echo ""
	@echo "$(CYAN)📍 Accès aux services:$(NC)"
	@echo "   Grafana:     http://localhost:3001 (admin / admin123)"
	@echo "   Prometheus:  http://localhost:9090"
	@echo "   Loki:        http://localhost:3100"
	@echo "   cAdvisor:    http://localhost:8081"
	@echo ""
	@$(MAKE) status-monitoring

stop-monitoring: ## Arrêter la stack de monitoring
	@echo "$(RED)🛑 Arrêt stack monitoring...$(NC)"
	@docker-compose -f docker-compose.yml -f docker-compose.monitoring.yml stop prometheus grafana loki promtail cadvisor node-exporter
	@echo "$(GREEN)✅ Stack monitoring arrêtée$(NC)"

restart-monitoring: ## Redémarrer la stack de monitoring
	@echo "$(YELLOW)🔄 Redémarrage stack monitoring...$(NC)"
	@docker-compose -f docker-compose.yml -f docker-compose.monitoring.yml restart prometheus grafana loki promtail cadvisor node-exporter
	@echo "$(GREEN)✅ Stack monitoring redémarrée$(NC)"

status-monitoring: ## Afficher l'état du monitoring
	@echo "$(CYAN)📊 État stack monitoring:$(NC)"
	@docker-compose -f docker-compose.yml -f docker-compose.monitoring.yml ps prometheus grafana loki promtail cadvisor node-exporter

logs-monitoring: ## Logs du monitoring
	@docker-compose -f docker-compose.yml -f docker-compose.monitoring.yml logs -f prometheus grafana loki promtail

logs-grafana: ## Logs Grafana uniquement
	@echo "$(CYAN)📋 Logs Grafana:$(NC)"
	@docker-compose -f docker-compose.yml -f docker-compose.monitoring.yml logs -f grafana

logs-prometheus: ## Logs Prometheus uniquement
	@echo "$(CYAN)📋 Logs Prometheus:$(NC)"
	@docker-compose -f docker-compose.yml -f docker-compose.monitoring.yml logs -f prometheus

logs-loki: ## Logs Loki uniquement
	@echo "$(CYAN)📋 Logs Loki:$(NC)"
	@docker-compose -f docker-compose.yml -f docker-compose.monitoring.yml logs -f loki

open-grafana: ## Ouvrir Grafana dans le navigateur
	@echo "$(GREEN)🌐 Ouverture Grafana...$(NC)"
	@echo "   URL: http://localhost:3001"
	@echo "   User: admin"
	@echo "   Pass: admin123"
	@start http://localhost:3001 || open http://localhost:3001 || xdg-open http://localhost:3001

open-prometheus: ## Ouvrir Prometheus dans le navigateur
	@echo "$(GREEN)🌐 Ouverture Prometheus...$(NC)"
	@start http://localhost:9090 || open http://localhost:9090 || xdg-open http://localhost:9090

open-loki: ## Ouvrir Loki (via Grafana Explore) dans le navigateur
	@echo "$(GREEN)🌐 Ouverture Loki (Grafana Explore)...$(NC)"
	@start http://localhost:3001/explore || open http://localhost:3001/explore || xdg-open http://localhost:3001/explore

monitoring-dashboard: ## Afficher les liens monitoring
	@echo "$(CYAN)╔════════════════════════════════════════════════════════════╗$(NC)"
	@echo "$(CYAN)║              DASHBOARD MONITORING - LIENS                 ║$(NC)"
	@echo "$(CYAN)╚════════════════════════════════════════════════════════════╝$(NC)"
	@echo ""
	@echo "$(YELLOW)📊 Visualisation:$(NC)"
	@echo "   Grafana:     http://localhost:3001"
	@echo "                User: admin / Pass: admin123"
	@echo ""
	@echo "$(YELLOW)📈 Métriques:$(NC)"
	@echo "   Prometheus:  http://localhost:9090"
	@echo "   cAdvisor:    http://localhost:8081"
	@echo ""
	@echo "$(YELLOW)📋 Logs:$(NC)"
	@echo "   Loki:        http://localhost:3100"
	@echo "   Explore:     http://localhost:3001/explore"
	@echo ""
	@echo "$(YELLOW)🔍 Commandes utiles:$(NC)"
	@echo "   make logs-monitoring     # Tous les logs monitoring"
	@echo "   make status-monitoring   # État des services"
	@echo "   make restart-monitoring  # Redémarrer"
	@echo ""

setup-monitoring: ## Installation complète monitoring
	@echo "$(GREEN)⚙️  Installation monitoring...$(NC)"
	@echo ""
	@echo "$(CYAN)Étape 1/4: Création réseau Docker...$(NC)"
	@docker network create surveillance_net 2>/dev/null || echo "   ℹ️  Réseau déjà existant"
	@echo ""
	@echo "$(CYAN)Étape 2/4: Build images monitoring...$(NC)"
	@docker-compose -f docker-compose.yml -f docker-compose.monitoring.yml build prometheus grafana loki promtail
	@echo ""
	@echo "$(CYAN)Étape 3/4: Démarrage services...$(NC)"
	@$(MAKE) start-monitoring
	@echo ""
	@echo "$(CYAN)Étape 4/4: Configuration terminée$(NC)"
	@echo ""
	@echo "$(GREEN)✅ Monitoring installé !$(NC)"
	@echo ""
	@$(MAKE) monitoring-dashboard

clean-monitoring: ## Nettoyer les données monitoring
	@echo "$(RED)🧹 Nettoyage données monitoring...$(NC)"
	@docker-compose -f docker-compose.yml -f docker-compose.monitoring.yml down -v
	@echo "$(GREEN)✅ Données monitoring nettoyées$(NC)"
>>>>>>> feature/interface
