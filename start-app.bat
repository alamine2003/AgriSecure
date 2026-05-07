@echo off
REM Script de démarrage de l'application de surveillance agricole
echo ========================================
echo Demarrage Application Surveillance
echo ========================================
echo.

REM Vérifier si Docker est installé
docker --version >nul 2>&1
if errorlevel 1 (
    echo [ERREUR] Docker n'est pas installe ou n'est pas dans le PATH
    echo Veuillez installer Docker Desktop depuis https://www.docker.com/products/docker-desktop
    pause
    exit /b 1
)

REM Vérifier si Docker Compose est installé
docker-compose --version >nul 2>&1
if errorlevel 1 (
    echo [ERREUR] Docker Compose n'est pas installe
    pause
    exit /b 1
)

echo [OK] Docker et Docker Compose sont installes
echo.

REM Vérifier si le fichier .env existe
if not exist ".env.docker" (
    echo [ATTENTION] Fichier .env.docker manquant
    if exist ".env.example" (
        echo Creation de .env.docker depuis .env.example...
        copy .env.example .env.docker
        echo [OK] Fichier .env.docker cree
        echo.
        echo IMPORTANT: Veuillez editer .env.docker et configurer les variables
        pause
    ) else (
        echo [ERREUR] Fichier .env.example introuvable
        pause
        exit /b 1
    )
)

echo.
echo Quelle commande souhaitez-vous executer ?
echo.
echo 1. Demarrer en mode developpement (make dev)
echo 2. Construire les images (make build)
echo 3. Demarrer tous les services (make up)
echo 4. Voir les logs (make logs)
echo 5. Arreter les services (make down)
echo 6. Creer un superutilisateur (make superuser)
echo 7. Appliquer les migrations (make migrate)
echo 8. Quitter
echo.

set /p choice="Votre choix (1-8): "

if "%choice%"=="1" goto dev
if "%choice%"=="2" goto build
if "%choice%"=="3" goto up
if "%choice%"=="4" goto logs
if "%choice%"=="5" goto down
if "%choice%"=="6" goto superuser
if "%choice%"=="7" goto migrate
if "%choice%"=="8" goto end

echo Choix invalide
pause
goto end

:dev
echo.
echo ========================================
echo Demarrage en mode developpement...
echo ========================================
docker-compose -f docker-compose.yml -f docker-compose.override.yml up -d
if errorlevel 1 (
    echo [ERREUR] Echec du demarrage
    pause
    exit /b 1
)
echo.
echo [OK] Application demarree en mode developpement
echo.
echo Acces aux services :
echo - Application      : http://localhost
echo - API Swagger      : http://localhost/api/docs/
echo - Django Admin     : http://localhost/admin/
echo - PgAdmin          : http://localhost:5050
echo - Flower (Celery)  : http://localhost:5555
echo - MinIO Console    : http://localhost:9001
echo.
goto end

:build
echo.
echo ========================================
echo Construction des images Docker...
echo ========================================
docker-compose build
if errorlevel 1 (
    echo [ERREUR] Echec de la construction
    pause
    exit /b 1
)
echo [OK] Images construites avec succes
goto end

:up
echo.
echo ========================================
echo Demarrage des services...
echo ========================================
docker-compose up -d
if errorlevel 1 (
    echo [ERREUR] Echec du demarrage
    pause
    exit /b 1
)
echo [OK] Services demarres
goto end

:logs
echo.
echo ========================================
echo Affichage des logs (Ctrl+C pour quitter)
echo ========================================
docker-compose logs -f
goto end

:down
echo.
echo ========================================
echo Arret des services...
echo ========================================
docker-compose down
echo [OK] Services arretes
goto end

:superuser
echo.
echo ========================================
echo Creation d'un superutilisateur...
echo ========================================
docker-compose exec backend python manage.py createsuperuser
goto end

:migrate
echo.
echo ========================================
echo Application des migrations...
echo ========================================
docker-compose exec backend python manage.py makemigrations
docker-compose exec backend python manage.py migrate
echo [OK] Migrations appliquees
goto end

:end
echo.
pause
