@echo off
echo ===============================================
echo VERIFICATION COMPTE UTILISATEUR
echo ===============================================
echo.

cd /d "%~dp0"

echo Email recherche: babsba123@gmail.com
echo.

echo [1/2] Recherche dans la base de donnees...
docker-compose exec postgres psql -U postgres -d surveillance_db -c "SELECT email, nin, first_name, last_name, role, is_active, must_change_password, created_at FROM users_customuser WHERE email='babsba123@gmail.com';"

echo.
echo [2/2] Liste de tous les agents agricoles...
docker-compose exec postgres psql -U postgres -d surveillance_db -c "SELECT email, nin, first_name, last_name, is_active, must_change_password FROM users_customuser WHERE role='agent_agricole' ORDER BY created_at DESC LIMIT 5;"

echo.
echo ===============================================
echo INFO
echo ===============================================
echo.
echo Si le compte existe:
echo   - Verifier is_active = t (true)
echo   - Si must_change_password = f, le mot de passe a ete change
echo   - Le NIN comme password ne fonctionne que si must_change_password = t
echo.
echo Si le compte n'existe pas:
echo   - Creer le compte via page d'inscription OU
echo   - Creer directement via maintenancier/agents
echo.
pause
