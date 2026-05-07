@echo off
echo ===============================================
echo DEMARRAGE MODE PRODUCTION (AVEC NGINX)
echo ===============================================
echo.
echo Ce mode utilise nginx comme reverse proxy:
echo   - Acces unique: http://localhost (port 80)
echo   - Nginx route vers backend/frontend
echo   - Configuration production
echo.
echo Avantages:
echo   ✓ URL propre (sans port)
echo   ✓ Architecture production
echo   ✓ Load balancing possible
echo   ✓ SSL/TLS (si configure)
echo.

cd /d "%~dp0"

echo [ETAPE 1/4] Arret des services existants...
docker-compose down

echo.
echo [ETAPE 2/4] Build des images avec mode production...
docker-compose -f docker-compose.yml -f docker-compose.prod.yml build

echo.
echo [ETAPE 3/4] Demarrage en mode production (avec nginx)...
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

echo.
echo [ATTENTE] Demarrage des services (20 secondes)...
timeout /t 20 /nobreak >nul

echo.
echo [ETAPE 4/4] Verification nginx...
docker-compose exec nginx nginx -t 2>nul
if %ERRORLEVEL% EQU 0 (
    echo   ✓ Configuration nginx valide
) else (
    echo   ✗ Probleme configuration nginx
)

echo.
echo ===============================================
echo SERVICES DEMARRES
echo ===============================================
echo.
docker-compose ps

echo.
echo ===============================================
echo ACCES AU SERVICE
echo ===============================================
echo.
echo Application:  http://localhost
echo.
echo Note: Tous les services passent par nginx (port 80)
echo.
echo ===============================================
echo COMMANDES UTILES
echo ===============================================
echo.
echo Voir les logs nginx:
echo   docker-compose logs -f nginx
echo.
echo Voir tous les logs:
echo   docker-compose logs -f
echo.
echo Arreter les services:
echo   docker-compose down
echo.
echo Recharger nginx (apres modif config):
echo   docker-compose exec nginx nginx -s reload
echo.

set /p open="Ouvrir l'application dans le navigateur ? (O/N): "
if /i "%open%"=="O" start http://localhost

echo.
pause
