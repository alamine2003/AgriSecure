@echo off
echo ========================================
echo VERIFICATION INTEGRATION PERIMETRE
echo ========================================
echo.

echo [1/5] Verification fichiers frontend...
if exist "frontend\src\components\ui\field-map-drawer.jsx" (
    echo   ✓ field-map-drawer.jsx PRESENT
) else (
    echo   ✗ field-map-drawer.jsx MANQUANT
)

if exist "frontend\src\pages\PerimeterDefinitionAdvanced.jsx" (
    echo   ✓ PerimeterDefinitionAdvanced.jsx PRESENT
) else (
    echo   ✗ PerimeterDefinitionAdvanced.jsx MANQUANT
)

if exist "frontend\src\components\ui\map-selector.jsx" (
    echo   ✓ map-selector.jsx PRESENT
) else (
    echo   ✗ map-selector.jsx MANQUANT
)

if exist "frontend\src\components\ui\commune-dropdown.jsx" (
    echo   ✓ commune-dropdown.jsx PRESENT
) else (
    echo   ✗ commune-dropdown.jsx MANQUANT
)
echo.

echo [2/5] Verification fichier backend...
if exist "backend\surveillance\utils\senegal_locations.py" (
    echo   ✓ senegal_locations.py PRESENT
) else (
    echo   ✗ senegal_locations.py MANQUANT
)
echo.

echo [3/5] Verification App.jsx...
findstr /C:"PerimeterDefinitionAdvanced" frontend\src\App.jsx >nul 2>&1
if %errorlevel% == 0 (
    echo   ✓ PerimeterDefinitionAdvanced importe dans App.jsx
) else (
    echo   ✗ PerimeterDefinitionAdvanced NON importe
)

findstr /C:"path=\"/agent/perimeter\"" frontend\src\App.jsx >nul 2>&1
if %errorlevel% == 0 (
    echo   ✓ Route /agent/perimeter configuree
) else (
    echo   ✗ Route /agent/perimeter NON configuree
)
echo.

echo [4/5] Verification senegalLocations.js...
findstr /C:"findCommuneByGPS" frontend\src\data\senegalLocations.js >nul 2>&1
if %errorlevel% == 0 (
    echo   ✓ Fonction findCommuneByGPS presente
) else (
    echo   ✗ Fonction findCommuneByGPS MANQUANTE
)
echo.

echo [5/5] Instructions redemarrage...
echo.
echo   IMPORTANT: Pour voir les changements:
echo   1. Arreter le serveur frontend (Ctrl+C)
echo   2. Dans le terminal frontend:
echo      cd frontend
echo      npm run dev
echo   3. Vider le cache navigateur (Ctrl+Shift+R)
echo   4. Rafraichir la page
echo.

echo ========================================
echo VERIFICATION TERMINEE
echo ========================================
echo.
echo Si tous les fichiers sont PRESENT, redemarrez simplement
echo le serveur frontend pour voir les changements.
echo.
pause
