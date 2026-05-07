@echo off
echo ===============================================
echo CORRECTION LOGIN ET REDIRECTION
echo ===============================================
echo.

cd /d "%~dp0"

echo [INFO] Cette correction va:
echo   1. Corriger la configuration API (proxy Vite)
echo   2. Ajouter des logs de debug dans Login.jsx
echo   3. Redemarrer le frontend
echo   4. Creer un utilisateur de test
echo.

echo [ETAPE 1/5] Arret frontend...
docker-compose stop frontend

echo.
echo [ETAPE 2/5] Suppression ancien conteneur...
docker-compose rm -f frontend

echo.
echo [ETAPE 3/5] Redemarrage frontend avec nouvelle config...
docker-compose up -d frontend

echo.
echo [ATTENTE] Demarrage frontend (15 secondes)...
timeout /t 15 /nobreak >nul

echo.
echo [ETAPE 4/5] Verification configuration...
echo.
docker-compose exec frontend printenv | findstr VITE_API_URL
docker-compose ps frontend

echo.
echo [ETAPE 5/5] Creation utilisateur de test...
echo.
docker-compose exec backend python manage.py shell -c "from users.models import CustomUser; user, created = CustomUser.objects.get_or_create(email='admin@test.com', defaults={'first_name': 'Admin', 'last_name': 'Test', 'role': 'maintenancier', 'is_staff': True, 'is_superuser': True}); user.set_password('admin123'); user.save(); print('Utilisateur: admin@test.com / admin123 (role: maintenancier)')"

echo.
echo ===============================================
echo CORRECTION TERMINEE
echo ===============================================
echo.
echo CONFIGURATION:
echo   - API URL: /api/v1 (proxy Vite)
echo   - Logs debug actives dans Login.jsx
echo   - Utilisateur test cree
echo.
echo POUR TESTER:
echo.
echo 1. Ouvre http://localhost:3000
echo.
echo 2. Ouvre la Console (F12):
echo    - Onglet "Console" pour voir les logs [LOGIN]
echo    - Onglet "Network" pour voir les requetes
echo.
echo 3. Connecte-toi:
echo    Email:    admin@test.com
echo    Password: admin123
echo.
echo 4. Observe dans la Console:
echo    [LOGIN] Tentative de connexion...
echo    [LOGIN] Reponse recue: ...
echo    [LOGIN] Donnees sauvegardees: ...
echo    [LOGIN] Connexion reussie, redirection vers /dashboard
echo.
echo 5. Si tu vois tous ces messages mais pas de redirection:
echo    - C'est un probleme React Router
echo    - Essaie de rafraichir (Ctrl+Shift+R)
echo    - Ou accede directement a http://localhost:3000/dashboard
echo.
echo ===============================================
echo OUVERTURE DU NAVIGATEUR
echo ===============================================
echo.

set /p open="Ouvrir http://localhost:3000 maintenant ? (O/N): "
if /i "%open%"=="O" (
    start http://localhost:3000
    echo.
    echo ✓ Navigateur ouvert
    echo   N'oublie pas d'ouvrir la Console (F12) !
)

echo.
pause
