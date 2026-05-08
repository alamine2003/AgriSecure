@echo off
echo ===============================================
echo DEPLOIEMENT NOUVEAU DASHBOARD MAINTENANCIER
echo ===============================================
echo.

cd /d "%~dp0"

echo [1/6] Creation migrations AuditLog...
echo.
docker-compose exec backend python manage.py makemigrations surveillance

echo.
echo [2/6] Application migrations...
echo.
docker-compose exec backend python manage.py migrate

echo.
echo [3/6] Redemarrage backend...
echo.
docker-compose restart backend

echo.
echo [4/6] Redemarrage frontend...
echo.
docker-compose restart frontend

echo.
echo [5/6] Attente demarrage (15s)...
timeout /t 15 /nobreak >nul

echo.
echo [6/6] Verification services...
echo.
docker-compose ps

echo.
echo ===============================================
echo NOUVEAU DASHBOARD DEPLOYE
echo ===============================================
echo.
echo FONCTIONNALITES AJOUTEES:
echo.
echo ✅ Dashboard maintenancier avec bento-grid
echo ✅ KPIs en temps reel (refresh auto 30s)
echo ✅ Statistiques visuelles avec progress bars
echo ✅ Historique des activites (15 dernieres)
echo ✅ Tracabilite complete des actions
echo ✅ Design moderne et responsive
echo.
echo ACCES:
echo   Login maintenancier: http://localhost:3000/login
echo   Dashboard: http://localhost:3000/maintenancier/dashboard
echo.
echo APIs NOUVELLES:
echo   GET /api/v1/surveillance/maintenancier-stats/kpi/
echo   GET /api/v1/surveillance/maintenancier-stats/trends/
echo   GET /api/v1/surveillance/maintenancier-stats/recent_activity/
echo   GET /api/v1/surveillance/audit-logs/
echo.
pause
