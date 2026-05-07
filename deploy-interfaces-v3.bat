@echo off
echo ===============================================
echo DEPLOIEMENT INTERFACES V3 ULTRA-MODERNES
echo ===============================================
echo.

cd /d "%~dp0"

echo Cette mise a jour deploie les interfaces V3 avec:
echo   • Design glassmorphism avance
echo   • Effets hover et animations sophistiques
echo   • Gradient backgrounds et glow effects
echo   • MaintenancierDashboard V3 (Bento-grid ultra-moderne)
echo   • RegistrationRequests V3 (Demandes ameliorees)
echo   • AgentsManagement V3 (Gestion agents avec style)
echo.
set /p CONFIRM="Continuer? (O/N): "

if /i NOT "%CONFIRM%"=="O" (
    echo Annule
    pause
    exit /b
)

echo.
echo [1/7] Verification fichiers V3...
echo.

if not exist "frontend\src\pages\MaintenancierDashboardV3.jsx" (
    echo   ❌ ERREUR: MaintenancierDashboardV3.jsx manquant
    pause
    exit /b 1
)
echo   ✓ MaintenancierDashboardV3.jsx

if not exist "frontend\src\pages\RegistrationRequestsV3.jsx" (
    echo   ❌ ERREUR: RegistrationRequestsV3.jsx manquant
    pause
    exit /b 1
)
echo   ✓ RegistrationRequestsV3.jsx

if not exist "frontend\src\pages\AgentsManagementV3.jsx" (
    echo   ❌ ERREUR: AgentsManagementV3.jsx manquant
    pause
    exit /b 1
)
echo   ✓ AgentsManagementV3.jsx

echo.
echo [2/7] Backup anciennes versions...
echo.

REM Backup Dashboard
if exist "frontend\src\pages\MaintenancierDashboard.jsx" (
    copy /Y "frontend\src\pages\MaintenancierDashboard.jsx" "frontend\src\pages\MaintenancierDashboard.jsx.v2.backup" >nul
    echo   ✓ Backup: MaintenancierDashboard.jsx
)

REM Backup RegistrationRequests
if exist "frontend\src\pages\RegistrationRequests.jsx" (
    copy /Y "frontend\src\pages\RegistrationRequests.jsx" "frontend\src\pages\RegistrationRequests.jsx.v2.backup" >nul
    echo   ✓ Backup: RegistrationRequests.jsx
)

REM Backup AgentsManagement
if exist "frontend\src\pages\AgentsManagement.jsx" (
    copy /Y "frontend\src\pages\AgentsManagement.jsx" "frontend\src\pages\AgentsManagement.jsx.v2.backup" >nul
    echo   ✓ Backup: AgentsManagement.jsx
)

echo.
echo [3/7] Remplacement par versions V3...
echo.

REM Replace avec V3
copy /Y "frontend\src\pages\MaintenancierDashboardV3.jsx" "frontend\src\pages\MaintenancierDashboard.jsx" >nul
echo   ✓ MaintenancierDashboard.jsx ^<- V3

copy /Y "frontend\src\pages\RegistrationRequestsV3.jsx" "frontend\src\pages\RegistrationRequests.jsx" >nul
echo   ✓ RegistrationRequests.jsx ^<- V3

copy /Y "frontend\src\pages\AgentsManagementV3.jsx" "frontend\src\pages\AgentsManagement.jsx" >nul
echo   ✓ AgentsManagement.jsx ^<- V3

echo.
echo [4/7] Migrations backend (AuditLog si necessaire)...
echo.
docker-compose exec backend python manage.py makemigrations surveillance

echo.
echo [5/7] Application migrations...
echo.
docker-compose exec backend python manage.py migrate

echo.
echo [6/7] Redemarrage services...
echo.
docker-compose restart backend
docker-compose restart frontend

echo.
echo [7/7] Attente demarrage (15s)...
timeout /t 15 /nobreak >nul

echo.
echo ===============================================
echo DEPLOIEMENT V3 TERMINE
echo ===============================================
echo.
echo INTERFACES ULTRA-MODERNES DEPLOYEES:
echo.
echo ✨ Dashboard Maintenancier V3
echo    • Glassmorphism avance (backdrop-blur-xl)
echo    • Bento-grid avec gradient backgrounds
echo    • KPI cards avec glow effects et hover animations
echo    • Icon rotation et scale effects
echo    • Progress bars animees (1s transitions)
echo    • Activity feed avec gradient icons
echo    • Custom scrollbar avec gradient
echo    URL: http://localhost:3000/maintenancier/dashboard
echo.
echo ✨ Demandes d'Inscription V3
echo    • Full-page gradient background
echo    • Stats cards avec hover glow et scale
echo    • Recherche avec glassmorphism
echo    • Cartes demandes avec hover effects
echo    • Info cards avec gradient backgrounds
echo    • Modal rejet avec backdrop-blur-lg
echo    • Animations smooth (duration-300/500)
echo    URL: http://localhost:3000/maintenancier/inscription
echo.
echo ✨ Gestion Agents V3
echo    • Stats avec hover glow et rotate effects
echo    • Formulaire creation avec gradient header
echo    • Liste agents avec hover glow
echo    • Agent cards avec gradient info badges
echo    • Modal edition avec glassmorphism
echo    • Custom scrollbar gradient
echo    • Live badge avec pulse animation
echo    URL: http://localhost:3000/maintenancier/agents
echo.
echo EFFETS VISUELS INCLUS:
echo   • Glassmorphism: bg-white/80 backdrop-blur-xl
echo   • Gradients: from-* via-* to-* avec hover
echo   • Glow effects: absolute -inset-1 blur-xl
echo   • Animations: hover:-translate-y-2 scale-110 rotate-6
echo   • Smooth transitions: duration-300/500
echo   • Custom scrollbars avec gradient
echo   • Loading animations avec pulse/ping
echo.
echo BACKUP DISPONIBLES:
echo   • MaintenancierDashboard.jsx.v2.backup
echo   • RegistrationRequests.jsx.v2.backup
echo   • AgentsManagement.jsx.v2.backup
echo.
echo ACCES:
echo   Login maintenancier: http://localhost:3000/login
echo.
pause
