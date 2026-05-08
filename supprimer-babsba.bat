@echo off
echo ===============================================
echo SUPPRESSION COMPTE: babsba123@gmail.com
echo ===============================================
echo.

cd /d "%~dp0"

echo NIN: 30112002001
echo Email: babsba123@gmail.com
echo.
echo Cette action va supprimer COMPLETEMENT:
echo   - Le compte utilisateur
echo   - Les demandes d'inscription
echo   - Les rendez-vous
echo.
set /p CONFIRM="Confirmer suppression (O/N): "

if /i NOT "%CONFIRM%"=="O" (
    echo Annule
    pause
    exit /b
)

echo.
echo [1/5] Suppression demandes avec cet email...
docker-compose exec postgres sh -c "psql -U \$POSTGRES_USER -d \$POSTGRES_DB -c \"DELETE FROM surveillance_agentregistrationrequest WHERE email='babsba123@gmail.com';\""

echo.
echo [2/5] Suppression demandes avec ce NIN...
docker-compose exec postgres sh -c "psql -U \$POSTGRES_USER -d \$POSTGRES_DB -c \"DELETE FROM surveillance_agentregistrationrequest WHERE nin='30112002001';\""

echo.
echo [3/5] Suppression rendez-vous...
docker-compose exec postgres sh -c "psql -U \$POSTGRES_USER -d \$POSTGRES_DB -c \"DELETE FROM surveillance_installationappointment WHERE agent_id IN (SELECT id FROM users_customuser WHERE email='babsba123@gmail.com');\""

echo.
echo [4/5] Suppression compte utilisateur...
docker-compose exec postgres sh -c "psql -U \$POSTGRES_USER -d \$POSTGRES_DB -c \"DELETE FROM users_customuser WHERE email='babsba123@gmail.com' OR nin='30112002001';\""

echo.
echo [5/5] Verification...
echo.
echo Compte utilisateur:
docker-compose exec postgres sh -c "psql -U \$POSTGRES_USER -d \$POSTGRES_DB -c \"SELECT email, nin FROM users_customuser WHERE email='babsba123@gmail.com' OR nin='30112002001';\""

echo.
echo Demandes:
docker-compose exec postgres sh -c "psql -U \$POSTGRES_USER -d \$POSTGRES_DB -c \"SELECT email, nin, status FROM surveillance_agentregistrationrequest WHERE email='babsba123@gmail.com' OR nin='30112002001';\""

echo.
echo ===============================================
echo RESULTAT
echo ===============================================
echo.
echo Si (0 rows) pour les deux:
echo   ^> SUPPRESSION COMPLETE
echo   ^> Vous pouvez maintenant:
echo     1. Recreer via formulaire public
echo     2. OU creer via maintenancier/agents
echo.
pause
