@echo off
echo ========================================
echo INSTALLATION DASHBOARD AGENT UNIFIE
echo ========================================
echo.
echo Ce script va installer toutes les dependances
echo necessaires pour le nouveau dashboard.
echo.
pause

echo.
echo [1/4] Navigation vers dossier frontend...
cd frontend
if %errorlevel% neq 0 (
    echo ERREUR: Dossier frontend introuvable
    pause
    exit /b 1
)

echo.
echo [2/4] Installation des packages npm...
echo (Cela peut prendre 1-2 minutes)
echo.
call npm install
if %errorlevel% neq 0 (
    echo.
    echo ERREUR lors de npm install
    echo Essayez: npm install --legacy-peer-deps
    pause
    exit /b 1
)

echo.
echo [3/4] Verification des packages installes...
echo.
echo Verification @radix-ui/react-dialog:
call npm list @radix-ui/react-dialog | findstr "react-dialog"
if %errorlevel% neq 0 (
    echo   MANQUANT - Installation manuelle...
    call npm install @radix-ui/react-dialog
)

echo.
echo Verification leaflet:
call npm list leaflet | findstr "leaflet@"
if %errorlevel% neq 0 (
    echo   MANQUANT - Installation manuelle...
    call npm install leaflet
)

echo.
echo Verification react-leaflet:
call npm list react-leaflet | findstr "react-leaflet"
if %errorlevel% neq 0 (
    echo   MANQUANT - Installation manuelle...
    call npm install react-leaflet
)

echo.
echo [4/4] Verification des fichiers crees...
echo.

if exist "src\pages\AgentDashboardUnified.jsx" (
    echo   ✓ AgentDashboardUnified.jsx PRESENT
) else (
    echo   ✗ AgentDashboardUnified.jsx MANQUANT
)

if exist "src\components\ui\dialog.jsx" (
    echo   ✓ dialog.jsx PRESENT
) else (
    echo   ✗ dialog.jsx MANQUANT
)

if exist "src\components\ui\textarea.jsx" (
    echo   ✓ textarea.jsx PRESENT
) else (
    echo   ✗ textarea.jsx MANQUANT
)

if exist "src\components\ui\field-map-drawer.jsx" (
    echo   ✓ field-map-drawer.jsx PRESENT
) else (
    echo   ✗ field-map-drawer.jsx MANQUANT
)

echo.
echo ========================================
echo INSTALLATION TERMINEE
echo ========================================
echo.
echo PROCHAINES ETAPES:
echo.
echo 1. Si le serveur frontend est lance, arretez-le (Ctrl+C)
echo.
echo 2. Dans ce terminal (deja dans frontend/):
echo    npm run dev
echo.
echo 3. Ouvrez votre navigateur:
echo    http://localhost:3000/login
echo.
echo 4. Connectez-vous avec un compte agent
echo.
echo 5. Vous serez redirige vers le nouveau dashboard:
echo    http://localhost:3000/agent/dashboard
echo.
echo NOUVEAU DASHBOARD - FONCTIONNALITES:
echo   ✓ Tout sur une seule page (pas de scroll inutile)
echo   ✓ Gestion perimetres integree (dialog modale)
echo   ✓ Stats compactes (4 cards)
echo   ✓ Sections: Perimetres, Cameras, Alertes, Detections
echo   ✓ Actions rapides: Creer, Modifier, Supprimer
echo   ✓ Design moderne avec gradients
echo.
echo TESTER LA CREATION PERIMETRE:
echo   1. Cliquer "Nouveau Perimetre" (header)
echo   2. Dialog s'ouvre avec carte
echo   3. Dessiner polygone (clic sur carte)
echo   4. Surface calculee automatiquement
echo   5. Cliquer "Terminer" puis "Enregistrer"
echo   6. Perimetre apparait dans la liste
echo.
echo ========================================
echo.
pause
