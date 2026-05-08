@echo off
echo ===============================================
echo ACTIVATION COMPTE: babsba123@gmail.com
echo ===============================================
echo.

cd /d "%~dp0"

echo [1/2] Activation du compte...
echo.
docker-compose exec postgres sh -c "psql -U \$POSTGRES_USER -d \$POSTGRES_DB -c \"UPDATE users_customuser SET is_active=true WHERE email='babsba123@gmail.com';\""

echo.
echo [2/2] Verification...
echo.
docker-compose exec postgres sh -c "psql -U \$POSTGRES_USER -d \$POSTGRES_DB -c \"SELECT email, nin, is_active, must_change_password FROM users_customuser WHERE email='babsba123@gmail.com';\""

echo.
echo ===============================================
echo RESULTAT
echo ===============================================
echo.
echo Si is_active = t:
echo   ^> COMPTE ACTIVE
echo   ^> Tester login: http://localhost:3000/login
echo   ^> Email: babsba123@gmail.com
echo   ^> Password: 10062004001
echo.
pause
