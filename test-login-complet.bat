@echo off
echo ===============================================
echo TEST COMPLET LOGIN ET REDIRECTION
echo ===============================================
echo.

cd /d "%~dp0"

echo [ETAPE 1] Arret et redemarrage frontend avec nouvelle config...
docker-compose restart frontend

echo.
echo [ATTENTE] Redemarrage frontend (10 secondes)...
timeout /t 10 /nobreak >nul

echo.
echo [ETAPE 2] Verification de la configuration...
echo.
echo Configuration frontend (variables VITE):
docker-compose exec frontend printenv | findstr VITE

echo.
echo [ETAPE 3] Verification backend...
echo.
echo Test endpoint login:
curl -s -X OPTIONS http://localhost:8000/api/v1/auth/login/ -I | findstr "HTTP\|Allow"

echo.
echo [ETAPE 4] Creation utilisateur de test (si n'existe pas deja)...
echo.
echo Entre le mot de passe pour le superuser 'admin@test.com':
docker-compose exec backend python manage.py shell -c "from users.models import CustomUser; user, created = CustomUser.objects.get_or_create(email='admin@test.com', defaults={'first_name': 'Admin', 'last_name': 'Test', 'role': 'maintenancier', 'is_staff': True, 'is_superuser': True}); user.set_password('admin123'); user.save(); print('✓ Utilisateur cree/mis a jour: admin@test.com / admin123')"

echo.
echo [ETAPE 5] Test de connexion via curl...
echo.
curl -X POST http://localhost:8000/api/v1/auth/login/ ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"admin@test.com\",\"password\":\"admin123\"}" ^
  -s | findstr "access\|refresh\|user\|error\|detail"

echo.
echo.
echo ===============================================
echo INSTRUCTIONS POUR TESTER
echo ===============================================
echo.
echo 1. Ouvre http://localhost:3000 dans ton navigateur
echo.
echo 2. Ouvre la Console Developpeur (F12):
echo    - Onglet "Network" (Reseau)
echo    - Garde l'onglet ouvert
echo.
echo 3. Connecte-toi avec:
echo    Email:    admin@test.com
echo    Password: admin123
echo.
echo 4. Dans l'onglet Network, cherche la requete "login":
echo    - Status: devrait etre 200 OK
echo    - Response: devrait contenir "access", "refresh", "user"
echo.
echo 5. Si Status 200 mais pas de redirection:
echo    - Onglet "Console" - y a-t-il des erreurs ?
echo    - Onglet "Application" ^> Local Storage
echo      Verifie que "access_token" et "user" sont bien sauvegardes
echo.
echo 6. Si erreur CORS ou Network Error:
echo    - Le frontend ne peut pas contacter le backend
echo    - Verifie que les deux services sont UP
echo.
echo ===============================================
echo COMMANDES UTILES
echo ===============================================
echo.
echo Voir logs frontend:
echo   docker-compose logs -f frontend
echo.
echo Voir logs backend:
echo   docker-compose logs -f backend
echo.
echo Vider localStorage dans le navigateur:
echo   F12 ^> Application ^> Local Storage ^> http://localhost:3000
echo   Clic droit ^> Clear
echo.
pause
