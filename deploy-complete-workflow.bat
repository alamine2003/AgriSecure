@echo off
echo ===============================================
echo DEPLOIEMENT WORKFLOW COMPLET AVEC LOCALISATION
echo ===============================================
echo.

cd /d "%~dp0"

echo Ce deploiement inclut:
echo   • Modifications modeles Camera et InstallationAppointment
echo   • Ajout coordonnees GPS (latitude, longitude)
echo   • Action complete_installation dans API
echo   • Interface V3 rendez-vous avec modal installation
echo   • Activation automatique agent apres installation
echo   • Creation cameras avec GPS
echo   • Tracabilite complete (AuditLog)
echo.
set /p CONFIRM="Continuer? (O/N): "

if /i NOT "%CONFIRM%"=="O" (
    echo Annule
    pause
    exit /b
)

echo.
echo [1/8] Verification fichiers...
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

if not exist "frontend\src\pages\InstallationAppointmentsV3.jsx" (
    echo   ❌ ERREUR: InstallationAppointmentsV3.jsx manquant
    pause
    exit /b 1
)
echo   ✓ InstallationAppointmentsV3.jsx

echo.
echo [2/8] Backup anciennes versions...
echo.

REM Backup toutes les pages
if exist "frontend\src\pages\MaintenancierDashboard.jsx" (
    copy /Y "frontend\src\pages\MaintenancierDashboard.jsx" "frontend\src\pages\MaintenancierDashboard.jsx.backup" >nul
    echo   ✓ Backup: MaintenancierDashboard.jsx
)

if exist "frontend\src\pages\RegistrationRequests.jsx" (
    copy /Y "frontend\src\pages\RegistrationRequests.jsx" "frontend\src\pages\RegistrationRequests.jsx.backup" >nul
    echo   ✓ Backup: RegistrationRequests.jsx
)

if exist "frontend\src\pages\AgentsManagement.jsx" (
    copy /Y "frontend\src\pages\AgentsManagement.jsx" "frontend\src\pages\AgentsManagement.jsx.backup" >nul
    echo   ✓ Backup: AgentsManagement.jsx
)

if exist "frontend\src\pages\InstallationAppointments.jsx" (
    copy /Y "frontend\src\pages\InstallationAppointments.jsx" "frontend\src\pages\InstallationAppointments.jsx.backup" >nul
    echo   ✓ Backup: InstallationAppointments.jsx
)

echo.
echo [3/8] Remplacement par versions V3...
echo.

copy /Y "frontend\src\pages\MaintenancierDashboardV3.jsx" "frontend\src\pages\MaintenancierDashboard.jsx" >nul
echo   ✓ MaintenancierDashboard.jsx ^<- V3

copy /Y "frontend\src\pages\RegistrationRequestsV3.jsx" "frontend\src\pages\RegistrationRequests.jsx" >nul
echo   ✓ RegistrationRequests.jsx ^<- V3

copy /Y "frontend\src\pages\AgentsManagementV3.jsx" "frontend\src\pages\AgentsManagement.jsx" >nul
echo   ✓ AgentsManagement.jsx ^<- V3

copy /Y "frontend\src\pages\InstallationAppointmentsV3.jsx" "frontend\src\pages\InstallationAppointments.jsx" >nul
echo   ✓ InstallationAppointments.jsx ^<- V3

echo.
echo [4/8] Migrations backend...
echo.
echo    Creation migrations pour Camera et InstallationAppointment...
docker-compose exec backend python manage.py makemigrations surveillance

echo.
echo [5/8] Application migrations...
echo.
docker-compose exec backend python manage.py migrate

echo.
echo [6/8] Redemarrage backend...
echo.
docker-compose restart backend

echo.
echo [7/8] Redemarrage frontend...
echo.
docker-compose restart frontend

echo.
echo [8/8] Attente demarrage (20s)...
timeout /t 20 /nobreak >nul

echo.
echo ===============================================
echo DEPLOIEMENT WORKFLOW COMPLET TERMINE
echo ===============================================
echo.
echo 🎯 WORKFLOW COMPLET OPERATIONNEL:
echo.
echo 📝 ETAPE 1: Inscription Publique
echo    • Agent s'inscrit sur page publique
echo    • URL: http://localhost:3000/register-agent
echo    • Formulaire: NIN, email, nom, prenom, localisation
echo.
echo ✅ ETAPE 2: Approbation Maintenancier
echo    • Maintenancier approuve la demande
echo    • URL: http://localhost:3000/maintenancier/inscription
echo    • Creation compte + rendez-vous automatique
echo    • Login: email + NIN (mot de passe initial)
echo.
echo 📅 ETAPE 3: Planification Installation
echo    • Maintenancier gere les rendez-vous
echo    • URL: http://localhost:3000/maintenancier/rendez-vous
echo    • Assignation technicien (optionnel)
echo.
echo 🔧 ETAPE 4: Installation Equipement
echo    • Equipe technique installe cameras
echo    • Maintenancier complete l'installation via modal:
echo      - Coordonnees GPS lieu installation
echo      - Liste cameras avec GPS individuels
echo      - Notes techniques
echo    • Action: "Terminer Installation"
echo.
echo 🚀 ETAPE 5: Activation Automatique
echo    • Compte agent active automatiquement
echo    • Cameras creees et assignees avec GPS
echo    • Agent peut se connecter
echo.
echo 🎮 ETAPE 6: Acces Dashboard Agent
echo    • Agent se connecte avec email + NIN
echo    • Acces dashboard surveillance
echo    • Visualisation cameras en temps reel
echo    • Definition perimetre agricole
echo    • Monitoring et alertes
echo.
echo 🗺️ FONCTIONNALITES LOCALISATION:
echo    • Coordonnees GPS de chaque camera
echo    • Coordonnees GPS lieu installation
echo    • Perimetre agricole avec polygone GPS
echo    • Carte visualisation pour maintenancier
echo    • Tracking toutes installations
echo.
echo ✨ INTERFACES V3 DEPLOYEES:
echo    ✓ Dashboard Maintenancier (Bento-grid + KPIs + Activity)
echo    ✓ Demandes Inscription (Stats + Cards + Modal rejet)
echo    ✓ Gestion Agents (Stats + Creation + Edition)
echo    ✓ Rendez-vous Installation (GPS + Equipement + Modal)
echo.
echo 📊 TRACABILITE COMPLETE:
echo    • AuditLog pour toutes actions maintenancier
echo    • Historique activites sur dashboard
echo    • Details: qui, quoi, quand, IP, user-agent
echo    • Actions: CREATE_AGENT, APPROVE_REQUEST,
echo      COMPLETE_INSTALLATION, CREATE_CAMERA, etc.
echo.
echo 🔐 SECURITE:
echo    • JWT authentication
echo    • Role-based access control
echo    • Password change force 1ere connexion
echo    • Permissions granulaires
echo.
echo 📡 POINT CULMINANT DU PROJET:
echo    • Surveillance temps reel avec YOLOv8
echo    • Detection intrusions sur perimetre
echo    • Alertes automatiques agents
echo    • WebSocket streaming video
echo    • Localisation GPS precise
echo    • Monitoring 24/7
echo.
echo BACKUP DISPONIBLES:
echo   • MaintenancierDashboard.jsx.backup
echo   • RegistrationRequests.jsx.backup
echo   • AgentsManagement.jsx.backup
echo   • InstallationAppointments.jsx.backup
echo.
echo ACCES RAPIDES:
echo   • Page publique: http://localhost:3000/register-agent
echo   • Login maintenancier: http://localhost:3000/login
echo   • Dashboard maintenancier: http://localhost:3000/maintenancier/dashboard
echo   • Rendez-vous: http://localhost:3000/maintenancier/rendez-vous
echo.
echo TEST COMPLET:
echo   1. Inscrivez un agent sur /register-agent
echo   2. Approuvez-le dans /maintenancier/inscription
echo   3. Completez installation dans /maintenancier/rendez-vous
echo   4. Agent se connecte et accede a son dashboard
echo   5. Agent definit son perimetre agricole
echo   6. Surveillance operationnelle!
echo.
pause
