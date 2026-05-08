@echo off
echo ===============================================
echo DEPLOIEMENT INTERFACES AMELIOREES
echo ===============================================
echo.

cd /d "%~dp0"

echo Cette mise a jour remplace les pages existantes par:
echo   • MaintenancierDashboard (nouveau avec bento-grid)
echo   • RegistrationRequestsV2 (demandes ameliorees)
echo   • AgentsManagementV2 (gestion agents moderne)
echo.
set /p CONFIRM="Continuer? (O/N): "

if /i NOT "%CONFIRM%"=="O" (
    echo Annule
    pause
    exit /b
)

echo.
echo [1/6] Remplacement fichiers frontend...
echo.

REM Backup anciens fichiers
if exist "frontend\src\pages\RegistrationRequests.jsx" (
    copy /Y "frontend\src\pages\RegistrationRequests.jsx" "frontend\src\pages\RegistrationRequests.jsx.backup" >nul
    echo   Backup: RegistrationRequests.jsx
)

if exist "frontend\src\pages\AgentsManagement.jsx" (
    copy /Y "frontend\src\pages\AgentsManagement.jsx" "frontend\src\pages\AgentsManagement.jsx.backup" >nul
    echo   Backup: AgentsManagement.jsx
)

REM Remplacement par nouvelles versions
copy /Y "frontend\src\pages\RegistrationRequestsV2.jsx" "frontend\src\pages\RegistrationRequests.jsx" >nul
echo   ✓ RegistrationRequests.jsx remplace

copy /Y "frontend\src\pages\AgentsManagementV2.jsx" "frontend\src\pages\AgentsManagement.jsx" >nul
echo   ✓ AgentsManagement.jsx remplace

echo.
echo [2/6] Migrations backend (AuditLog)...
echo.
docker-compose exec backend python manage.py makemigrations surveillance

echo.
echo [3/6] Application migrations...
echo.
docker-compose exec backend python manage.py migrate

echo.
echo [4/6] Redemarrage backend...
echo.
docker-compose restart backend

echo.
echo [5/6] Redemarrage frontend...
echo.
docker-compose restart frontend

echo.
echo [6/6] Attente demarrage (15s)...
timeout /t 15 /nobreak >nul

echo.
echo ===============================================
echo DEPLOIEMENT TERMINE
echo ===============================================
echo.
echo PAGES AMELIOREES:
echo.
echo ✅ Dashboard Maintenancier
echo    • Bento-grid moderne
echo    • 8 KPIs (4 principaux + 4 secondaires)
echo    • Activites recentes avec tracabilite
echo    • Stats rapides avec progress bars
echo    • Auto-refresh 30s
echo    URL: http://localhost:3000/maintenancier/dashboard
echo.
echo ✅ Demandes d'Inscription
echo    • Design par cartes
echo    • 4 stats cards cliquables
echo    • Recherche en temps reel
echo    • Actions avec confirmations
echo    • Modal rejet ameliore
echo    URL: http://localhost:3000/maintenancier/inscription
echo.
echo ✅ Gestion Agents
echo    • 4 stats cards (total, actifs, inactifs, 1ere co)
echo    • Formulaire creation ameliore
echo    • Liste agents avec cartes
echo    • Recherche multi-criteres
echo    • Modal edition moderne
echo    • Auto-refresh 15s
echo    URL: http://localhost:3000/maintenancier/agents
echo.
echo BACKUP:
echo   Les anciennes versions sont sauvegardees:
echo   • RegistrationRequests.jsx.backup
echo   • AgentsManagement.jsx.backup
echo.
echo ACCES:
echo   Login maintenancier: http://localhost:3000/login
echo.
pause
