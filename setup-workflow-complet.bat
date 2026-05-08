@echo off
echo ===============================================
echo CONFIGURATION WORKFLOW COMPLET
echo ===============================================
echo.

cd /d "%~dp0"

echo [1/5] Application migrations AgentRegistrationRequest...
echo.
docker-compose exec backend python manage.py makemigrations surveillance
docker-compose exec backend python manage.py migrate

echo.
echo [2/5] Redemarrage backend...
echo.
docker-compose restart backend

echo.
echo [3/5] Attente demarrage (10s)...
timeout /t 10 /nobreak >nul

echo.
echo [4/5] Verification services...
echo.
docker-compose ps

echo.
echo [5/5] Test acces URLs...
echo.
echo Frontend:
curl -s http://localhost:3000 -o nul && echo   ✓ OK || echo   ✗ INACCESSIBLE

echo Backend:
curl -s http://localhost:8000/api/v1/ -o nul && echo   ✓ OK || echo   ✗ INACCESSIBLE

echo Nginx:
curl -s http://localhost -o nul && echo   ✓ OK || echo   ✗ INACCESSIBLE

echo.
echo ===============================================
echo WORKFLOW COMPLET PRET
echo ===============================================
echo.
echo ETAPE 1: Inscription Publique
echo   ^> http://localhost:3000/register-agent
echo   ^> Remplir formulaire avec vos infos
echo.
echo ETAPE 2: Login Maintenancier
echo   ^> http://localhost:3000/login
echo   ^> Aller sur "Demandes" (sidebar)
echo   ^> Approuver la demande
echo.
echo ETAPE 3: Login Agent
echo   ^> http://localhost:3000/login
echo   ^> Email: celui de l'inscription
echo   ^> Password: le NIN saisi
echo   ^> Changer le password
echo   ^> Acces dashboard agent ✓
echo.
pause
