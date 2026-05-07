@echo off
echo ===============================================
echo ACCES DIRECT AUX SERVICES (SANS NGINX)
echo ===============================================
echo.

echo Puisque nginx pose probleme, vous pouvez acceder
echo DIRECTEMENT aux services :
echo.

echo ===============================================
echo PORTS DES SERVICES
echo ===============================================
echo.

echo Frontend (Vite) :
echo   URL : http://localhost:3000
echo   Status :
docker-compose ps frontend | findstr "Up" >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo   ✓ EN LIGNE
) else (
    echo   ✗ HORS LIGNE
)

echo.
echo Backend (Django) :
echo   URL : http://localhost:8000
echo   Status :
docker-compose ps backend | findstr "Up" >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo   ✓ EN LIGNE
) else (
    echo   ✗ HORS LIGNE
)

echo.
echo ===============================================
echo ACCES RAPIDES
echo ===============================================
echo.
echo 1. Page d'accueil (Frontend)
echo    http://localhost:3000
echo.
echo 2. Django Admin
echo    http://localhost:8000/admin/
echo.
echo 3. API Swagger
echo    http://localhost:8000/api/docs/
echo.
echo 4. API Schema
echo    http://localhost:8000/api/docs/schema/
echo.

echo ===============================================
echo OUVRIR DANS LE NAVIGATEUR
echo ===============================================
echo.
echo Voulez-vous ouvrir le frontend dans le navigateur ?
echo.
set /p choice="Tapez O pour Oui, N pour Non : "

if /i "%choice%"=="O" (
    echo.
    echo Ouverture de http://localhost:3000...
    start http://localhost:3000
    echo.
    echo Si la page ne charge pas, verifiez que le service frontend
    echo est bien UP avec : docker-compose ps frontend
)

echo.
echo ===============================================
echo COMMANDES UTILES
echo ===============================================
echo.
echo Voir l'etat des services :
echo   docker-compose ps
echo.
echo Voir les logs :
echo   docker-compose logs frontend
echo   docker-compose logs backend
echo   docker-compose logs nginx
echo.
echo Redemarrer un service :
echo   docker-compose restart frontend
echo   docker-compose restart backend
echo.
pause
