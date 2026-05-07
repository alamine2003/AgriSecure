@echo off
echo ===============================================
echo MIGRATION AGENT REGISTRATION
echo ===============================================
echo.

cd /d "%~dp0"

echo [1/3] Creation migrations...
docker-compose exec backend python manage.py makemigrations surveillance

echo.
echo [2/3] Application migrations...
docker-compose exec backend python manage.py migrate

echo.
echo [3/3] Redemarrage backend...
docker-compose restart backend

echo.
echo ✓ Migration terminee
echo.
pause
