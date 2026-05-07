@echo off
echo ===============================================
echo VERIFICATION COMPTE: babsba123@gmail.com
echo ===============================================
echo.

cd /d "%~dp0"

echo [1/3] Verification existence compte...
echo.
docker-compose exec postgres sh -c "psql -U \$POSTGRES_USER -d \$POSTGRES_DB -c \"SELECT email, nin, first_name, last_name, is_active, must_change_password FROM users_customuser WHERE email='babsba123@gmail.com';\""

echo.
echo.
echo [2/3] Liste tous les agents...
echo.
docker-compose exec postgres sh -c "psql -U \$POSTGRES_USER -d \$POSTGRES_DB -c \"SELECT email, nin, first_name, last_name, is_active FROM users_customuser WHERE role='agent_agricole' ORDER BY created_at DESC LIMIT 10;\""

echo.
echo.
echo [3/3] Compte maintenancier pour test...
echo.
docker-compose exec postgres sh -c "psql -U \$POSTGRES_USER -d \$POSTGRES_DB -c \"SELECT email, first_name, last_name FROM users_customuser WHERE role='maintenancier' LIMIT 1;\""

echo.
echo ===============================================
echo RESULTAT
echo ===============================================
echo.
echo Si aucun resultat pour babsba123@gmail.com:
echo   ^> LE COMPTE N'EXISTE PAS
echo   ^> Creer via interface maintenancier/agents
echo   ^> OU executer: .\create-babsba-v2.bat
echo.
echo Si resultat affiche mais is_active = f:
echo   ^> LE COMPTE EST DESACTIVE
echo   ^> Executer: .\activate-babsba-v2.bat
echo.
echo Si resultat affiche et is_active = t:
echo   ^> LE COMPTE EXISTE ET EST ACTIF
echo   ^> Password = NIN (si must_change_password = t)
echo   ^> Tester login sur http://localhost:3000/login
echo.
pause
