@echo off
echo ===============================================
echo DEMARRAGE MODE DEVELOPPEMENT (SANS NGINX)
echo ===============================================
echo.
echo Ce mode permet d'acceder directement aux services:
echo   - Frontend: http://localhost:3000
echo   - Backend:  http://localhost:8000
echo   - Admin:    http://localhost:8000/admin/
echo.
echo Avantages:
echo   ✓ Hot reload frontend (HMR)
echo   ✓ Logs en temps reel
echo   ✓ Pas de problemes nginx
echo   ✓ Developpement rapide
echo.

cd /d "%~dp0"

echo [ETAPE 1/3] Arret des services existants...
docker-compose down

echo.
echo [ETAPE 2/3] Construction des images...
docker-compose build

echo.
echo [ETAPE 3/3] Demarrage en mode dev (sans nginx)...
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d

echo.
echo [ATTENTE] Demarrage des services (15 secondes)...
timeout /t 15 /nobreak >nul

echo.
echo ===============================================
echo SERVICES DEMARRES
echo ===============================================
echo.
docker-compose ps

echo.
echo ===============================================
echo ACCES AUX SERVICES
echo ===============================================
echo.
echo Frontend (React):    http://localhost:3000
echo Backend (Django):    http://localhost:8000
echo Django Admin:        http://localhost:8000/admin/
echo API Documentation:   http://localhost:8000/api/docs/
echo.
echo ===============================================
echo COMMANDES UTILES
echo ===============================================
echo.
echo Voir les logs:
echo   docker-compose logs -f
echo.
echo Arreter les services:
echo   docker-compose down
echo.
echo Creer un superuser:
echo   docker-compose exec backend python manage.py createsuperuser
echo.

set /p open="Ouvrir le frontend dans le navigateur ? (O/N): "
if /i "%open%"=="O" start http://localhost:3000

echo.
pause
