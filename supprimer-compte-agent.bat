@echo off
echo ===============================================
echo SUPPRESSION COMPLETE COMPTE AGENT
echo ===============================================
echo.

cd /d "%~dp0"

set /p EMAIL="Email du compte a supprimer: "
echo.
echo ATTENTION: Cette action va supprimer:
echo   - Le compte utilisateur
echo   - Les demandes d'inscription associees
echo   - Les rendez-vous associes
echo   - Toutes les donnees liees
echo.
set /p CONFIRM="Confirmer suppression de %EMAIL% (O/N): "

if /i NOT "%CONFIRM%"=="O" (
    echo Annule
    pause
    exit /b
)

echo.
echo [1/4] Suppression demandes d'inscription...
docker-compose exec postgres sh -c "psql -U \$POSTGRES_USER -d \$POSTGRES_DB -c \"DELETE FROM surveillance_agentregistrationrequest WHERE email='%EMAIL%';\""

echo.
echo [2/4] Suppression rendez-vous...
docker-compose exec postgres sh -c "psql -U \$POSTGRES_USER -d \$POSTGRES_DB -c \"DELETE FROM surveillance_installationappointment WHERE agent_id IN (SELECT id FROM users_customuser WHERE email='%EMAIL%');\""

echo.
echo [3/4] Suppression compte utilisateur...
docker-compose exec postgres sh -c "psql -U \$POSTGRES_USER -d \$POSTGRES_DB -c \"DELETE FROM users_customuser WHERE email='%EMAIL%';\""

echo.
echo [4/4] Verification...
docker-compose exec postgres sh -c "psql -U \$POSTGRES_USER -d \$POSTGRES_DB -c \"SELECT email FROM users_customuser WHERE email='%EMAIL%';\""

echo.
echo ===============================================
echo RESULTAT
echo ===============================================
echo.
echo Si (0 rows):
echo   ^> COMPTE SUPPRIME AVEC SUCCES
echo   ^> Vous pouvez maintenant recreer avec meme NIN/email
echo.
pause
