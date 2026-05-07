@echo off
echo ===============================================
echo DEBUG LOGIN - babsba123@gmail.com
echo ===============================================
echo.

cd /d "%~dp0"

echo [ETAPE 1] Verification compte dans DB...
echo.
docker-compose exec postgres psql -U postgres -d surveillance_db -c "SELECT id, email, nin, first_name, last_name, role, is_active, must_change_password, date_joined FROM users_customuser WHERE email='babsba123@gmail.com';"

echo.
echo.
echo [ETAPE 2] Tous les agents agricoles recents...
echo.
docker-compose exec postgres psql -U postgres -d surveillance_db -c "SELECT email, nin, first_name, last_name, is_active, must_change_password, created_at FROM users_customuser WHERE role='agent_agricole' ORDER BY created_at DESC LIMIT 10;"

echo.
echo.
echo [ETAPE 3] Compte maintenancier...
echo.
docker-compose exec postgres psql -U postgres -d surveillance_db -c "SELECT email, first_name, last_name, is_active FROM users_customuser WHERE role='maintenancier' LIMIT 3;"

echo.
echo.
echo ===============================================
echo DIAGNOSTIC
echo ===============================================
echo.

echo Si le compte babsba123@gmail.com existe:
echo   1. Verifier is_active = t (true)
echo   2. Si must_change_password = t:
echo      - Mot de passe = NIN (celui affiche dans colonne 'nin')
echo   3. Si must_change_password = f:
echo      - Le mot de passe a ete change, utiliser le nouveau
echo.
echo Si le compte N'EXISTE PAS:
echo   SOLUTION 1: Creer via interface web
echo     - Login maintenancier
echo     - Aller sur "Agents" (sidebar)
echo     - Remplir formulaire creation
echo     - NIN: 10062004001
echo     - Email: babsba123@gmail.com
echo     - Prenom: Babs
echo     - Nom: Ba
echo     - Tel: 771234567
echo     - Creer
echo.
echo   SOLUTION 2: Via page inscription publique
echo     - Ouvrir http://localhost:3000/register-agent
echo     - Remplir formulaire complet
echo     - Envoyer demande
echo     - Login maintenancier
echo     - "Demandes" puis Approuver la demande
echo.
pause
