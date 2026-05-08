@echo off
echo ===============================================
echo NETTOYAGE FICHIERS GRAFANA
echo ===============================================
echo.

cd /d "%~dp0"

echo Suppression anciens fichiers...

REM Supprimer anciens fichiers dupliques
del /Q "monitoring\grafana\provisioning\datasources\datasource.yml" 2>nul
del /Q "monitoring\grafana\dashboards\dashboard.yml" 2>nul
del /Q "monitoring\grafana\Dockerfile" 2>nul

echo.
echo Structure finale:
echo   monitoring/grafana/
echo   ├── provisioning/
echo   │   ├── datasources/
echo   │   │   └── datasources.yml      (OK)
echo   │   └── dashboards/
echo   │       └── dashboards.yml       (OK)
echo.

echo ✓ Fichiers nettoyes
echo.

echo Maintenant execute:
echo   .\fix-grafana.bat
echo.
pause
