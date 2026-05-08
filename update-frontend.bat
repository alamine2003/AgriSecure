@echo off
echo ===============================================
echo MISE A JOUR FRONTEND - Affichage NIN
echo ===============================================
echo.

cd /d "%~dp0"

echo [1/2] Redemarrage frontend...
docker-compose restart frontend

echo.
echo [2/2] Attente demarrage (10s)...
timeout /t 10 /nobreak >nul

echo.
echo ===============================================
echo VERIFICATION
echo ===============================================
echo.

docker-compose ps frontend

echo.
echo ✓ Frontend redémarre
echo.
echo Modifications appliquées:
echo   - Colonne NIN ajoutée dans table agents
echo   - Format: Police monospace pour lisibilité
echo   - Visible entre "Agent" et "Statut"
echo.
echo Acceder a: http://localhost:3000/maintenancier/agents
echo.
pause
