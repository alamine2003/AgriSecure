@echo off
echo ===============================================
echo CORRECTION FORCEE NGINX - PORT 3000
echo ===============================================
echo.

echo [INFO] Cette methode va FORCER le port 3000 dans nginx.conf
echo.

echo [ETAPE 1/6] Arret nginx...
docker-compose stop nginx

echo.
echo [ETAPE 2/6] Suppression ancien conteneur...
docker-compose rm -f nginx

echo.
echo [ETAPE 3/6] Modification nginx.conf (80 -> 3000)...
powershell -Command "(Get-Content nginx\nginx.conf) -replace 'server frontend:80;', 'server frontend:3000;' | Set-Content nginx\nginx.conf"
echo   ✓ Fichier modifie

echo.
echo [ETAPE 4/6] Verification modification...
findstr /C:"frontend:3000" nginx\nginx.conf >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo   ✓ Port 3000 detecte dans nginx.conf
) else (
    echo   ✗ ATTENTION: Port 3000 non trouve !
    echo   Modification manuelle necessaire
)

echo.
echo [ETAPE 5/6] Reconstruction nginx SANS cache...
docker-compose build --no-cache nginx

echo.
echo [ETAPE 6/6] Demarrage nginx...
docker-compose up -d nginx

echo.
echo [ATTENTE] Laisser nginx demarrer (5 secondes)...
timeout /t 5 /nobreak >nul

echo.
echo ===============================================
echo VERIFICATION
echo ===============================================
echo.

echo Test 1: Etat du conteneur nginx
docker-compose ps nginx

echo.
echo Test 2: Configuration upstream dans le conteneur
docker-compose exec nginx cat /etc/nginx/nginx.conf 2>nul | findstr /C:"frontend"

echo.
echo ===============================================
echo RESULTATS
echo ===============================================
echo.

echo Si vous voyez "frontend:3000" ci-dessus : ✓ OK
echo Si vous voyez "frontend:80" : ✗ Probleme
echo.
echo Testez maintenant dans votre navigateur :
echo.
echo   http://localhost          (Page d'accueil)
echo   http://localhost:3000     (Frontend direct)
echo   http://localhost:8000/admin/ (Django admin)
echo.

echo ===============================================
echo ALTERNATIVE SI CA NE MARCHE TOUJOURS PAS
echo ===============================================
echo.
echo Essayez l'acces DIRECT sans nginx :
echo.
echo   http://localhost:3000  (Frontend Vite)
echo   http://localhost:8000  (Backend Django)
echo.
pause
