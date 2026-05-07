@echo off
echo ===============================================
echo INTEGRATION MONITORING AU MAKEFILE
echo ===============================================
echo.

cd /d "%~dp0"

echo Ajout des commandes monitoring au Makefile principal...
echo.

type Makefile.monitoring >> Makefile

echo.
echo ✓ Commandes monitoring ajoutees au Makefile
echo.
echo Commandes disponibles:
echo   make start-monitoring
echo   make stop-monitoring
echo   make status-monitoring
echo   make logs-monitoring
echo   make open-grafana
echo   make monitoring-dashboard
echo   make setup-monitoring
echo.
echo Pour voir toutes les commandes:
echo   make help
echo.
pause
