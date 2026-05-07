@echo off
echo ===============================================
echo CORRECTION GRAFANA
echo ===============================================
echo.

cd /d "%~dp0"

echo [1/5] Arret Grafana...
docker-compose -f docker-compose.monitoring.yml stop grafana

echo.
echo [2/5] Suppression conteneur...
docker-compose -f docker-compose.monitoring.yml rm -f grafana

echo.
echo [3/5] Suppression volume (reset complet)...
docker volume rm alamine_bouba_project_v0_grafana_data 2>nul
echo   (Ignorer erreur si volume n'existe pas)

echo.
echo [4/5] Redemarrage Grafana SANS provisioning...
docker-compose -f docker-compose.monitoring.yml up -d grafana

echo.
echo [5/5] Attente demarrage (20s)...
timeout /t 20 /nobreak >nul

echo.
echo ===============================================
echo VERIFICATION
echo ===============================================
echo.

docker-compose -f docker-compose.monitoring.yml ps grafana

echo.
echo Logs Grafana (10 dernieres lignes):
docker-compose -f docker-compose.monitoring.yml logs grafana --tail=10

echo.
echo ===============================================
echo TEST ACCES
echo ===============================================
echo.

curl -s http://localhost:3001 -o nul
if %ERRORLEVEL% EQU 0 (
    echo   ✓ Grafana ACCESSIBLE !
    echo.
    echo   URL:  http://localhost:3001
    echo   User: admin
    echo   Pass: admin123
    echo.
    set /p open="Ouvrir maintenant ? (O/N): "
    if /i "!open!"=="O" start http://localhost:3001
) else (
    echo   ✗ Grafana INACCESSIBLE
    echo.
    echo   Voir les logs complets:
    echo   docker-compose -f docker-compose.monitoring.yml logs grafana
)

echo.
pause
