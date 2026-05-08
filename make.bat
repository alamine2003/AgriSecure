@echo off
REM Wrapper pour utiliser make sur Windows sans installer GNU Make
REM Usage: make.bat <commande>

if "%1"=="" (
    echo Usage: make.bat ^<commande^>
    echo.
    echo Exemples:
    echo   make.bat help
    echo   make.bat start-dev
    echo   make.bat fix-login
    echo.
    echo Pour voir toutes les commandes:
    echo   make.bat help
    exit /b 1
)

REM Vérifier si make est installé
where make >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    REM make est installé, l'utiliser
    make %*
    exit /b %ERRORLEVEL%
)

REM make n'est pas installé, exécuter les commandes manuellement
set "CMD=%1"
shift

if "%CMD%"=="help" goto help
if "%CMD%"=="start-dev" goto start-dev
if "%CMD%"=="start-prod" goto start-prod
if "%CMD%"=="fix-login" goto fix-login
if "%CMD%"=="status" goto status
if "%CMD%"=="logs" goto logs
if "%CMD%"=="diagnostic" goto diagnostic
if "%CMD%"=="install" goto install
if "%CMD%"=="create-test-user" goto create-test-user

echo Commande inconnue: %CMD%
echo Utilisez "make.bat help" pour voir les commandes disponibles
exit /b 1

:help
echo.
echo ╔════════════════════════════════════════════════════════════╗
echo ║          Surveillance Agricole - Commandes Make          ║
echo ╚════════════════════════════════════════════════════════════╝
echo.
echo Demarrage Rapide:
echo   start-dev        Demarrer en mode DEVELOPPEMENT (recommande)
echo   start-prod       Demarrer en mode PRODUCTION (avec nginx)
echo   install          Installation complete (premiere fois)
echo.
echo Gestion Services:
echo   status           Afficher l'etat des services
echo   logs             Voir les logs (temps reel)
echo   restart-all      Redemarrer tous les services
echo.
echo Corrections ^& Debug:
echo   fix-login        Corriger probleme login/redirection
echo   fix-nginx        Corriger configuration nginx
echo   diagnostic       Diagnostic complet du systeme
echo.
echo Base de Donnees:
echo   migrate          Creer et appliquer migrations
echo   superuser        Creer un superutilisateur
echo   create-test-user Creer utilisateur test (admin@test.com)
echo.
echo Pour plus de commandes, installez GNU Make:
echo   choco install make
echo.
exit /b 0

:start-dev
echo Demarrage MODE DEVELOPPEMENT (sans nginx)...
docker-compose down
docker-compose build
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d
timeout /t 15 /nobreak >nul
echo.
echo Services demarres !
echo.
echo Acces aux services:
echo   Frontend:  http://localhost:3000
echo   Backend:   http://localhost:8000
echo   Admin:     http://localhost:8000/admin/
echo.
docker-compose ps
exit /b 0

:start-prod
echo Demarrage MODE PRODUCTION (avec nginx)...
docker-compose down
docker-compose -f docker-compose.yml -f docker-compose.prod.yml build
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
timeout /t 20 /nobreak >nul
echo.
echo Services demarres !
echo.
echo Acces a l'application:
echo   http://localhost
echo.
docker-compose ps
exit /b 0

:fix-login
echo Correction du login et redirection...
echo.
echo Etape 1/4: Arret frontend...
docker-compose stop frontend
docker-compose rm -f frontend
echo.
echo Etape 2/4: Redemarrage avec nouvelle config...
docker-compose up -d frontend
timeout /t 15 /nobreak >nul
echo.
echo Etape 3/4: Verification config...
docker-compose exec frontend printenv | findstr VITE_API_URL
echo.
echo Etape 4/4: Creation utilisateur test...
docker-compose exec backend python manage.py shell -c "from users.models import CustomUser; user, created = CustomUser.objects.get_or_create(email='admin@test.com', defaults={'first_name': 'Admin', 'last_name': 'Test', 'role': 'maintenancier', 'is_staff': True, 'is_superuser': True}); user.set_password('admin123'); user.save(); print('Utilisateur cree: admin@test.com / admin123')"
echo.
echo Correction terminee !
echo.
echo Pour tester:
echo   1. Ouvre http://localhost:3000
echo   2. Ouvre Console (F12)
echo   3. Connecte avec: admin@test.com / admin123
echo.
exit /b 0

:status
echo Etat des services:
docker-compose ps
exit /b 0

:logs
docker-compose logs -f
exit /b 0

:diagnostic
echo.
echo ╔════════════════════════════════════════════════════════════╗
echo ║               DIAGNOSTIC COMPLET SYSTEME                  ║
echo ╚════════════════════════════════════════════════════════════╝
echo.
echo Etat des conteneurs:
docker-compose ps
echo.
echo Test ports:
echo   Frontend (3000):
curl -s http://localhost:3000 -o nul && echo     OK || echo     INACCESSIBLE
echo   Backend (8000):
curl -s http://localhost:8000/admin/ -o nul && echo     OK || echo     INACCESSIBLE
echo.
echo Configuration frontend:
docker-compose exec frontend printenv | findstr VITE
echo.
exit /b 0

:install
echo Installation complete...
docker-compose build
docker-compose exec backend python manage.py makemigrations
docker-compose exec backend python manage.py migrate
goto create-test-user

:create-test-user
echo Creation utilisateur de test...
docker-compose exec backend python manage.py shell -c "from users.models import CustomUser; user, created = CustomUser.objects.get_or_create(email='admin@test.com', defaults={'first_name': 'Admin', 'last_name': 'Test', 'role': 'maintenancier', 'is_staff': True, 'is_superuser': True}); user.set_password('admin123'); user.save(); print('Utilisateur cree: admin@test.com / admin123 (maintenancier)')"
echo.
echo Installation terminee !
echo.
echo Prochaine etape:
echo   make.bat start-dev
echo.
echo Compte cree:
echo   Email:    admin@test.com
echo   Password: admin123
echo   Role:     maintenancier
echo.
exit /b 0
