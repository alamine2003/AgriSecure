@echo off
echo ===============================================
echo CORRECTION MONITORING
echo ===============================================
echo.

cd /d "%~dp0"

echo [1/4] Arret services monitoring...
docker-compose -f docker-compose.monitoring.yml stop loki grafana

echo.
echo [2/4] Suppression conteneurs...
docker-compose -f docker-compose.monitoring.yml rm -f loki grafana

echo.
echo [3/4] Redemarrage avec nouvelle config...
docker-compose -f docker-compose.monitoring.yml up -d loki grafana

echo.
echo [4/4] Attente demarrage (15s)...
timeout /t 15 /nobreak >nul

echo.
echo ===============================================
echo VERIFICATION
echo ===============================================
echo.

docker-compose -f docker-compose.monitoring.yml ps

echo.
echo ===============================================
echo TEST ACCES
echo ===============================================
echo.

echo Grafana:
curl -s http://localhost:3001 -o nul && echo   ✓ OK || echo   ✗ INACCESSIBLE

echo Prometheus:
curl -s http://localhost:9090 -o nul && echo   ✓ OK || echo   ✗ INACCESSIBLE

echo Loki:
curl -s http://localhost:3100/ready -o nul && echo   ✓ OK || echo   ✗ INACCESSIBLE

echo.
echo ===============================================
echo URLS
echo ===============================================
echo.
echo Grafana:    http://localhost:3001 (admin/admin123)
echo Prometheus: http://localhost:9090
echo cAdvisor:   http://localhost:8081
echo.

set /p open="Ouvrir Grafana ? (O/N): "
if /i "%open%"=="O" start http://localhost:3001

echo.
pause
