@echo off
echo ===============================================
echo REDEMARRAGE FRONTEND AVEC PORT 3000 EXPOSE
echo ===============================================
echo.

cd /d "%~dp0"

echo [ETAPE 1/3] Arret frontend...
docker-compose stop frontend

echo.
echo [ETAPE 2/3] Suppression ancien conteneur...
docker-compose rm -f frontend

echo.
echo [ETAPE 3/3] Recreation avec port 3000 expose...
docker-compose up -d frontend

echo.
echo [ATTENTE] Demarrage du service (10 secondes)...
timeout /t 10 /nobreak >nul

echo.
echo ===============================================
echo VERIFICATION
echo ===============================================
echo.

echo Etat du conteneur frontend:
docker-compose ps frontend

echo.
echo Test port 3000:
curl http://localhost:3000 -s --connect-timeout 3 -o nul && echo   ✓ Port 3000 ACCESSIBLE || echo   ✗ Port 3000 INACCESSIBLE

echo.
echo ===============================================
echo INSTRUCTIONS
echo ===============================================
echo.
echo 1. Si "Port 3000 ACCESSIBLE" ci-dessus : ✓ OK
echo    → Ouvrez http://localhost dans votre navigateur
echo.
echo 2. Si "Port 3000 INACCESSIBLE" :
echo    → Verifiez les logs : docker-compose logs frontend
echo.
pause
